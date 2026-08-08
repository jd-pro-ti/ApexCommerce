import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildEarningsReport, earningsReportToCsv } from '@/services/earningsService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getAuthorized(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  if (!supabaseAdmin) return { error: NextResponse.json({ error: 'Supabase admin no esta configurado' }, { status: 500 }) }

  const supabase = createSupabaseRouteClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles').select('role, status').eq('id', user.id).single()
  if (profileError || !['admin', 'vendedor'].includes(profile?.role) || profile?.status !== 'active') {
    return { error: NextResponse.json({ error: 'No tienes permiso para consultar las ganancias' }, { status: 403 }) }
  }
  return { supabase, userId: user.id, role: profile.role }
}

export async function GET(request) {
  try {
    const auth = await getAuthorized(request)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const format = searchParams.get('format')

    if (auth.role === 'vendedor' && sellerId && sellerId !== auth.userId) {
      return NextResponse.json({ error: 'Un vendedor solo puede consultar sus propias ganancias' }, { status: 403 })
    }
    const effectiveSellerId = auth.role === 'vendedor' ? auth.userId : sellerId

    let query = supabaseAdmin.from('seller_paypal_payouts')
      .select('seller_id, order_id, paypal_order_id, paypal_capture_id, gross_amount, platform_fee_amount, seller_amount, status, created_at')
      .order('created_at', { ascending: false })
    if (effectiveSellerId) query = query.eq('seller_id', effectiveSellerId)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lt('created_at', to)

    const { data: payouts, error: payoutsError } = await query
    if (payoutsError) throw payoutsError
    const sellerIds = [...new Set((payouts || []).map((payout) => payout.seller_id))]
    const { data: profiles, error: profilesError } = sellerIds.length
      ? await supabaseAdmin.from('profiles').select('id, name, email').in('id', sellerIds)
      : { data: [], error: null }
    if (profilesError) throw profilesError

    const report = buildEarningsReport(payouts, profiles)
    if (format === 'csv') {
      const orderIds = [...new Set((payouts || []).map((payout) => payout.order_id))]
      const { data: orders, error: ordersError } = orderIds.length
        ? await supabaseAdmin.from('orders').select('id, order_number, status, payment_created_at, paypal_order_id').in('id', orderIds)
        : { data: [], error: null }
      if (ordersError) throw ordersError
      const { data: orderItems, error: orderItemsError } = orderIds.length
        ? await supabaseAdmin.from('order_items').select('order_id, seller_id, product_name, quantity').in('order_id', orderIds)
        : { data: [], error: null }
      if (orderItemsError) throw orderItemsError
      const ordersById = new Map((orders || []).map((order) => [order.id, order]))
      const itemsByOrder = new Map()
      for (const item of orderItems || []) {
        const items = itemsByOrder.get(`${item.order_id}:${item.seller_id}`) || []
        items.push(item)
        itemsByOrder.set(`${item.order_id}:${item.seller_id}`, items)
      }
      const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]))
      const details = (payouts || []).map((payout) => {
        const order = ordersById.get(payout.order_id) || {}
        const seller = profilesById.get(payout.seller_id) || {}
        const items = itemsByOrder.get(`${payout.order_id}:${payout.seller_id}`) || []
        return {
          orderNumber: order.order_number || payout.order_id,
          paymentDate: order.payment_created_at ? new Date(order.payment_created_at).toLocaleString('es-MX') : '',
          sellerName: seller.name || 'Vendedor',
          sellerEmail: seller.email || '',
          products: items.map((item) => item.product_name).join(' | '),
          quantities: items.map((item) => item.quantity).join(' | '),
          grossAmount: payout.gross_amount,
          platformFeeAmount: payout.platform_fee_amount,
          sellerAmount: payout.seller_amount,
          orderStatus: order.status || '',
          payoutStatus: payout.status || '',
          paypalOrderId: order.paypal_order_id || payout.paypal_order_id || '',
          paypalCaptureId: payout.paypal_capture_id || ''
        }
      })
      return new Response(earningsReportToCsv(report, details), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="apex-ganancias-${new Date().toISOString().slice(0, 10)}.csv"`
        }
      })
    }
    return NextResponse.json(report)
  } catch (error) {
    console.error('Admin earnings report failed:', error)
    return NextResponse.json({ error: error.message || 'No se pudo consultar las ganancias' }, { status: 500 })
  }
}
