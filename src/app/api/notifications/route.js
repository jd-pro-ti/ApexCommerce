import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


async function auth(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !supabaseAdmin) return null
  const client = createSupabaseRouteClient(token)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('id, name, email, role, status').eq('id', user.id).single()
  return profile?.role === 'vendedor' && profile.status === 'active' ? { user, profile } : null
}

async function syncNotifications(seller, existing) {
  // La tabla actual de notifications no incluye metadata; el mensaje funciona
  // como una clave estable para no duplicar avisos ya sincronizados.
  const known = new Set((existing || []).map((item) => `${item.title}::${item.message}`))
  const pending = []
  const add = (eventKey, type, title, message) => {
    if (known.has(`${title}::${message}`)) return
    known.add(`${title}::${message}`)
    pending.push({ user_id: seller.id, type, title, message })
  }

  const recentCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const staleIds = []
  const { data: orderItems } = await supabaseAdmin.from('order_items').select('order_id, product_name, quantity, status, created_at, orders(order_number, status, created_at, updated_at)').eq('seller_id', seller.id).order('created_at', { ascending: false })
  for (const item of orderItems || []) {
    const order = item.orders || {}
    const number = order.order_number || item.order_id
    const orderCreated = new Date(order.created_at || item.created_at)
    const orderUpdated = new Date(order.updated_at || order.created_at || item.created_at)
    const newMessage = `Recibiste un nuevo pedido #${number} con ${item.quantity || 1} unidad(es) de ${item.product_name || 'tu producto'}.`
    const cancelMessage = `El pedido #${number} fue cancelado. Revisa el detalle para conocer los productos afectados.`
    if (orderCreated >= recentCutoff) add(`new-order:${item.order_id}`, 'new_order', 'Nuevo pedido recibido', newMessage)
    else existing.filter((notification) => notification.type === 'new_order' && notification.message === newMessage).forEach((notification) => staleIds.push(notification.id))
    if ((order.status === 'cancelled' || item.status === 'cancelled') && orderUpdated >= recentCutoff) add(`cancelled-order:${item.order_id}:${item.product_name}`, 'cancelled_order', 'Pedido cancelado', cancelMessage)
    else if (order.status === 'cancelled' || item.status === 'cancelled') existing.filter((notification) => notification.type === 'cancelled_order' && notification.message === cancelMessage).forEach((notification) => staleIds.push(notification.id))
  }

  const { data: reports } = await supabaseAdmin.from('seller_reports').select('id, reason, reason_details, description, status, created_at').eq('seller_id', seller.id).order('created_at', { ascending: false })
  for (const report of reports || []) {
    if (new Date(report.created_at) < recentCutoff) continue
    const reason = report.reason_details || report.reason || 'incumplimiento de las condiciones de la plataforma'
    add(`seller-report:${report.id}`, 'seller_report', 'Recibiste un reporte', `Un cliente te reportó por: ${reason}. Te recomendamos mejorar esta situación para evitar nuevos reportes.`)
  }
  if ((reports || []).length >= 3 && (reports || []).some((report) => new Date(report.created_at) >= recentCutoff)) add(`seller-report-threshold:${seller.id}`, 'seller_warning', 'Advertencia: límite de reportes', `Tienes ${reports.length} reportes. Si acumulas 3 reportes o más, tu cuenta puede ser suspendida por la plataforma. Revisa la razón de cada reporte y mejora tu servicio.`)

  const { data: products } = await supabaseAdmin.from('products').select('id, name, stock, updated_at').eq('seller_id', seller.id).eq('stock', 5)
  for (const product of products || []) if (new Date(product.updated_at) >= recentCutoff) add(`low-stock:${product.id}:5`, 'low_stock', 'Stock bajo', `Tienes 5 unidades disponibles de ${product.name}. Considera reabastecerlo pronto.`)

  const { data: payouts } = await supabaseAdmin.from('seller_paypal_payouts').select('id, order_id, seller_amount, status, updated_at, orders(order_number)').eq('seller_id', seller.id).eq('status', 'paid').order('updated_at', { ascending: false })
  for (const payout of payouts || []) {
    const message = `Tu pago de ${Number(payout.seller_amount || 0).toFixed(2)} MXN fue liberado porque la entrega del pedido #${payout.orders?.order_number || payout.order_id} fue confirmada.`
    if (new Date(payout.updated_at) >= recentCutoff) add(`payment-released:${payout.id}`, 'payment_released', 'Pago liberado', message)
    else existing.filter((notification) => notification.type === 'payment_released' && notification.message === message).forEach((notification) => staleIds.push(notification.id))
  }

  if (staleIds.length) await supabaseAdmin.from('notifications').delete().eq('user_id', seller.id).in('id', [...new Set(staleIds)])

  const toInsert = pending
  if (toInsert.length) {
    const { data: inserted, error } = await supabaseAdmin.from('notifications').insert(toInsert).select()
    if (error) throw error
    return inserted || []
  }
  return []
}

async function removeDuplicateNotifications(userId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, type, title, message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const seen = new Set()
  const duplicateIds = []
  for (const notification of data || []) {
    const key = `${notification.type}::${notification.title}::${notification.message}`
    if (seen.has(key)) duplicateIds.push(notification.id)
    else seen.add(key)
  }
  if (duplicateIds.length) {
    const { error: deleteError } = await supabaseAdmin.from('notifications').delete().eq('user_id', userId).in('id', duplicateIds)
    if (deleteError) throw deleteError
  }
}

export async function GET(request) {
  try {
    const session = await auth(request)
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const { data: existing, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    await syncNotifications(session.profile, existing)
    await removeDuplicateNotifications(session.user.id)
    const { data: notifications, error: reloadError } = await supabaseAdmin.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(200)
    if (reloadError) throw reloadError
    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) { console.error('Notifications load failed:', error); return NextResponse.json({ error: error.message || 'No se pudieron cargar las notificaciones' }, { status: 500 }) }
}

export async function PATCH(request) {
  try {
    const session = await auth(request)
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    let query = supabaseAdmin.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', session.user.id)
    if (body.id) query = query.eq('id', body.id)
    else query = query.is('read_at', null)
    const { error } = await query
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: error.message || 'No se pudo actualizar la notificación' }, { status: 500 }) }
}
