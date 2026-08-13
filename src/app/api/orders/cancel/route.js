import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createPaypalAuthAssertion, paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

function errorStatus(error) {
  if (/no autorizado/i.test(error.message)) return 403
  if (/no encontrado|no se puede cancelar|no tiene un pago/i.test(error.message)) return 400
  return error.status || 500
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ success: false, error: 'Falta el pedido' }, { status: 400 })
    if (!supabaseAdmin) throw new Error('Supabase admin no esta configurado')

    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    const { data: order, error: orderError } = await supabaseAdmin.from('orders')
      .select('id, user_id, order_number, status, payment_status, total, platform_fee_total, seller_payout_total, order_items(id, seller_id, status)')
      .eq('id', orderId).single()
    if (orderError || !order) return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 })
    if (order.user_id !== user.id) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })

    if (order.status === 'cancelled' && order.payment_status === 'refunded') {
      const { data: existing } = await supabaseAdmin.from('simulated_refunds').select('id, status').eq('order_id', orderId).maybeSingle()
      return NextResponse.json({ success: true, orderId, refundId: existing?.id || null, realRefund: true, alreadyRefunded: true, message: 'Este pedido ya fue reembolsado.' })
    }

    const items = order.order_items || []
    if (!items.length || items.some((item) => ['shipped', 'delivered', 'cancelled'].includes(item.status))) {
      return NextResponse.json({ success: false, error: 'Este pedido ya no se puede cancelar' }, { status: 400 })
    }

    // Si todavía no hubo captura, solo cancelamos la reserva local.
    if (order.payment_status !== 'paid') {
      const { error: cancelError } = await authClient.rpc('cancel_paid_order_simulated_refund', { p_user_id: user.id, p_order_id: orderId })
      if (cancelError) throw cancelError
      return NextResponse.json({ success: true, orderId, realRefund: false, simulatedRefund: false, message: 'Pedido cancelado y existencias restauradas.' })
    }

    const { data: payouts, error: payoutsError } = await supabaseAdmin.from('seller_paypal_payouts')
      .select('id, seller_id, paypal_capture_id, platform_fee_amount, status').eq('order_id', orderId)
    if (payoutsError) throw payoutsError
    if (!payouts?.length || payouts.some((payout) => !payout.paypal_capture_id)) throw new Error('El pedido no tiene todas sus capturas de PayPal')

    let { data: refund, error: refundReadError } = await supabaseAdmin.from('simulated_refunds').select('*').eq('order_id', orderId).maybeSingle()
    if (refundReadError) throw refundReadError
    if (!refund) {
      const { data: created, error: createError } = await supabaseAdmin.from('simulated_refunds').insert({
        order_id: orderId,
        user_id: user.id,
        amount: order.total,
        platform_fee_amount: order.platform_fee_total,
        seller_amount: order.seller_payout_total,
        status: 'processing'
      }).select('*').single()
      if (createError) throw createError
      refund = created
    } else if (refund.status === 'completed') {
      return NextResponse.json({ success: true, orderId, refundId: refund.id, realRefund: true, alreadyRefunded: true, message: 'Este pedido ya fue reembolsado.' })
    } else if (refund.status !== 'processing') {
      const { data: updated, error: updateError } = await supabaseAdmin.from('simulated_refunds').update({ status: 'processing' }).eq('id', refund.id).select('*').single()
      if (updateError) throw updateError
      refund = updated
    }

    const refundIds = refund.paypal_refund_ids || {}
    const sellerIds = [...new Set(payouts.map((payout) => payout.seller_id))]
    const { data: accounts, error: accountsError } = await supabaseAdmin.from('seller_paypal_accounts')
      .select('seller_id, paypal_merchant_id, onboarding_status').in('seller_id', sellerIds)
    if (accountsError) throw accountsError
    const accountsBySeller = new Map((accounts || []).map((account) => [account.seller_id, account]))

    for (const payout of payouts) {
      if (refundIds[payout.id]) continue
      const account = accountsBySeller.get(payout.seller_id)
      if (!account || account.onboarding_status !== 'connected' || !account.paypal_merchant_id) throw new Error('El vendedor no tiene una cuenta PayPal conectada')
      const response = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(payout.paypal_capture_id)}/refund`, {
        method: 'POST',
        headers: {
          'PayPal-Auth-Assertion': createPaypalAuthAssertion(account.paypal_merchant_id),
          'PayPal-Request-Id': `apex-refund-${refund.id}-${payout.id}`,
          ...(process.env.PAYPAL_PARTNER_ATTRIBUTION_ID ? { 'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID } : {})
        },
        body: JSON.stringify({
          invoice_id: order.order_number,
          note_to_payer: 'Reembolso por cancelacion del pedido'
        })
      })
      const paypalRefundId = response.id || response.refund_id
      if (!paypalRefundId) throw new Error('PayPal no devolvio el identificador del reembolso')
      refundIds[payout.id] = paypalRefundId
      const { error: progressError } = await supabaseAdmin.from('simulated_refunds').update({ paypal_refund_ids: refundIds }).eq('id', refund.id)
      if (progressError) throw progressError
    }

    const { data: finalizedId, error: finalizeError } = await authClient.rpc('finalize_paid_order_real_refund', { p_user_id: user.id, p_order_id: orderId })
    if (finalizeError) throw finalizeError
    return NextResponse.json({ success: true, orderId: finalizedId, refundId: refund.id, realRefund: true, paypalRefundIds: refundIds, message: 'Reembolso real solicitado correctamente. PayPal procesará el abono al medio de pago original.' })
  } catch (error) {
    console.error('Error al cancelar y reembolsar pedido:', error)
    return NextResponse.json({ success: false, error: error.message || 'No se pudo procesar el reembolso real' }, { status: errorStatus(error) })
  }
}
