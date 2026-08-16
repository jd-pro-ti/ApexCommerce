import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { createPaypalAuthAssertion, paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

export async function POST(request, { params }) {
  let stage = 'authentication'
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })
    const supabase = createSupabaseRouteClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })
    if (!supabaseAdmin) throw new Error('Supabase admin no esta configurado')
    const { paypalOrderId } = await params

    stage = 'reading_checkout_session'
    const { data: session, error: sessionError } = await supabaseAdmin.from('paypal_checkout_sessions')
      .select('*').eq('paypal_order_id', paypalOrderId).eq('user_id', user.id).single()
    if (sessionError || !session) return NextResponse.json({ error: 'Checkout no autorizado' }, { status: 403 })
    if (session.completed_order_id) return NextResponse.json({ success: true, orderId: session.completed_order_id, alreadyProcessed: true })

    const breakdown = Array.isArray(session.paypal_seller_breakdown) ? session.paypal_seller_breakdown : []
    const sellerIds = [...new Set(breakdown.map((group) => group.seller_id).filter(Boolean))]
    if (!sellerIds.length) throw new Error('El checkout no tiene vendedores válidos')
    const { data: sellerAccounts, error: sellerError } = await supabaseAdmin.from('seller_paypal_accounts')
      .select('seller_id, paypal_merchant_id, onboarding_status').in('seller_id', sellerIds)
    if (sellerError || sellerAccounts?.length !== sellerIds.length || sellerAccounts.some((account) => account.onboarding_status !== 'connected' || !account.paypal_merchant_id)) throw new Error('Uno de los vendedores no tiene una cuenta PayPal conectada')
    const sellerAccount = sellerAccounts[0]
    const paypalHeaders = { 'PayPal-Auth-Assertion': createPaypalAuthAssertion(sellerAccount.paypal_merchant_id) }

    stage = 'reading_paypal_order'
    const paypalOrder = await paypalRequest(`/v2/checkout/orders/${paypalOrderId}`, { headers: paypalHeaders })
    const purchaseUnits = paypalOrder.purchase_units || []
    const paypalTotalCents = purchaseUnits.reduce((sum, unit) => sum + Math.round(Number(unit.amount?.value || 0) * 100), 0)
    const localTotalCents = Math.round(Number(session.total || 0) * 100)
    if (purchaseUnits.some((unit) => unit.amount?.currency_code !== 'MXN') || paypalTotalCents !== localTotalCents) throw new Error('El importe de PayPal no coincide con el checkout')

    let capture = paypalOrder
    let captureData = purchaseUnits.flatMap((unit) => unit.payments?.captures || [])
    if (paypalOrder.status !== 'COMPLETED') {
      stage = 'capturing_paypal_order'
      capture = await paypalRequest(`/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST', headers: paypalHeaders, body: '{}' })
      captureData = (capture.purchase_units || []).flatMap((unit) => unit.payments?.captures || [])
    }
    if (capture.status !== 'COMPLETED' || !captureData.length || captureData.some((item) => item.status !== 'COMPLETED')) throw new Error('PayPal no confirmo el pago')

    stage = 'creating_paid_order'
    const { data: completedId, error: completeError } = await supabase.rpc('complete_paypal_checkout', {
      p_user_id: user.id, p_session_id: session.id, p_paypal_order_id: paypalOrderId, p_paypal_capture_id: captureData[0].id
    })
    if (completeError) throw completeError

    for (const unit of capture.purchase_units || []) {
      const sellerId = String(unit.reference_id || '').replace(/^seller-/, '')
      const unitCapture = unit.payments?.captures?.[0]
      if (!sellerId || !unitCapture?.id) continue
      await supabaseAdmin.from('seller_paypal_payouts').update({ status: 'held', paypal_capture_id: unitCapture.id })
        .eq('order_id', completedId).eq('seller_id', sellerId)
    }
    await supabaseAdmin.from('orders').update({ payout_status: 'held' }).eq('id', completedId)
    return NextResponse.json({ success: true, orderId: completedId, captureId: captureData[0].id, captureIds: captureData.map((item) => item.id) })
  } catch (error) {
    console.error(`PayPal capture failed at ${stage}:`, error)
    return NextResponse.json({ error: error.message || 'No se pudo confirmar el pago', stage }, { status: error.status || 500 })
  }
}
