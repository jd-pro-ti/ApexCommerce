import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { createPaypalAuthAssertion, paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

async function getAuthenticatedUser(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !supabaseAdmin) return null
  const supabase = createSupabaseRouteClient(token)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles').select('id, role').eq('id', user.id).single()
  if (profileError) throw profileError
  return { user, profile }
}

export async function POST(request) {
  let orderId
  try {
    const authenticated = await getAuthenticatedUser(request)
    if (!authenticated) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    orderId = body.orderId
    if (!orderId) return NextResponse.json({ error: 'Falta orderId' }, { status: 400 })

    const isAdmin = String(authenticated.profile.role || '').toLowerCase() === 'admin'
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders').select('id, user_id, status, payment_status').eq('id', orderId).single()
    if (orderError || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items').select('seller_id, status').eq('order_id', orderId)
    if (itemsError) throw itemsError
    if (!items?.length) return NextResponse.json({ error: 'El pedido no tiene productos' }, { status: 400 })
    const sellerIds = [...new Set(items.map((item) => item.seller_id).filter(Boolean))]
    const isCustomer = order.user_id === authenticated.user.id
    if (!isAdmin && !isCustomer && !sellerIds.includes(authenticated.user.id)) {
      return NextResponse.json({ error: 'No tienes permiso para liberar este pedido' }, { status: 403 })
    }
    if (order.status === 'cancelled' || order.payment_status === 'refunded') {
      return NextResponse.json({ error: 'El pedido fue cancelado y su pago no puede liberarse', released: false }, { status: 409 })
    }
    if (order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'El pedido todavía no tiene un pago confirmado' }, { status: 409 })
    }
    if (items.some((item) => !['delivered', 'cancelled'].includes(item.status))) {
      return NextResponse.json({
        error: 'El dinero se liberará cuando todos los productos del pedido estén entregados', released: false
      }, { status: 409 })
    }

    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('seller_paypal_payouts')
      .select('id, seller_id, paypal_capture_id, status')
      .eq('order_id', orderId)
    if (payoutsError) throw payoutsError
    const releasable = (payouts || []).filter((payout) => ['held', 'failed'].includes(payout.status))
    if (!releasable.length) {
      const alreadyReleased = (payouts || []).length > 0 && payouts.every((payout) => payout.status === 'paid')
      return NextResponse.json({
        success: alreadyReleased, released: alreadyReleased, alreadyReleased,
        message: alreadyReleased ? 'Los pagos ya fueron liberados' : 'No hay pagos retenidos para liberar'
      }, { status: alreadyReleased ? 200 : 409 })
    }

    const results = []
    for (const payout of releasable) {
      try {
        if (!payout.paypal_capture_id) throw new Error('El pago no tiene capture_id de PayPal')
        const { data: sellerAccount, error: sellerError } = await supabaseAdmin
          .from('seller_paypal_accounts').select('paypal_merchant_id, onboarding_status')
          .eq('seller_id', payout.seller_id).single()
        if (sellerError || sellerAccount?.onboarding_status !== 'connected' || !sellerAccount.paypal_merchant_id) {
          throw new Error('El vendedor no tiene una cuenta PayPal conectada')
        }
        const headers = {
          'PayPal-Auth-Assertion': createPaypalAuthAssertion(sellerAccount.paypal_merchant_id),
          'PayPal-Request-Id': `apex-release-${payout.id}`,
          ...(process.env.PAYPAL_PARTNER_ATTRIBUTION_ID
            ? { 'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID } : {})
        }
        const response = await paypalRequest('/v1/payments/referenced-payouts-items', {
          method: 'POST', headers,
          body: JSON.stringify({ reference_id: payout.paypal_capture_id, reference_type: 'TRANSACTION_ID' })
        })
        const { error: updateError } = await supabaseAdmin.from('seller_paypal_payouts')
          .update({ status: 'paid' }).eq('id', payout.id).in('status', ['held', 'failed'])
        if (updateError) throw updateError
        results.push({ payoutId: payout.id, sellerId: payout.seller_id, payoutItemId: response.payout_item_id || response.id || null, status: 'paid' })
      } catch (error) {
        await supabaseAdmin.from('seller_paypal_payouts').update({ status: 'failed' }).eq('id', payout.id).in('status', ['held', 'failed'])
        results.push({ payoutId: payout.id, sellerId: payout.seller_id, status: 'failed', error: error.message })
      }
    }

    const failed = results.filter((result) => result.status === 'failed')
    const released = failed.length === 0
    await supabaseAdmin.from('orders').update({ payout_status: released ? 'released' : 'failed', ...(released ? { payouts_released_at: new Date().toISOString() } : {}) }).eq('id', orderId)
    return NextResponse.json({ success: released, released, partial: !released && results.some((result) => result.status === 'paid'), orderId, results, error: failed.length ? 'No se pudieron liberar todos los pagos' : undefined }, { status: released ? 200 : 502 })
  } catch (error) {
    console.error('PayPal payout release failed:', error)
    return NextResponse.json({ error: error.message || 'No se pudo liberar el pago', orderId }, { status: error.status || 500 })
  }
}
