import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

export async function POST(request, { params }) {
  let stage = 'authentication'
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })
    const supabase = createSupabaseRouteClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })
    const { paypalOrderId } = await params

    stage = 'reading_paypal_order'
    const paypalOrder = await paypalRequest(`/v2/checkout/orders/${paypalOrderId}`)
    const localOrderId = paypalOrder.purchase_units?.[0]?.reference_id
    if (!localOrderId) throw new Error('PayPal no devolvió la referencia del pedido')
    stage = 'reading_local_order'
    const { data: localOrder, error: localError } = await supabase
      .from('orders').select('id, user_id, total, paypal_order_id, payment_status').eq('id', localOrderId).single()
    if (localError || localOrder?.user_id !== user.id || localOrder.paypal_order_id !== paypalOrderId) {
      return NextResponse.json({ error: 'Pedido no autorizado' }, { status: 403 })
    }

    if (localOrder.payment_status === 'paid') {
      return NextResponse.json({ success: true, orderId: localOrder.id, alreadyProcessed: true })
    }

    const paypalTotal = Number(paypalOrder.purchase_units?.[0]?.amount?.value)
    if (paypalOrder.purchase_units?.[0]?.amount?.currency_code !== 'MXN' || paypalTotal !== Number(localOrder.total)) {
      throw new Error('El importe de PayPal no coincide con el pedido')
    }

    // Reuse a completed PayPal capture if the previous request reached PayPal
    // but failed while finalizing the local order.
    let capture = paypalOrder
    let captureData = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]
    if (paypalOrder.status !== 'COMPLETED') {
      stage = 'capturing_paypal_order'
      capture = await paypalRequest(`/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST', body: '{}' })
      captureData = capture.purchase_units?.[0]?.payments?.captures?.[0]
    }
    if (capture.status !== 'COMPLETED' || captureData?.status !== 'COMPLETED') {
      throw new Error('PayPal no confirmó el pago')
    }

    stage = 'finalizing_local_order'
    const { data: completedId, error: completeError } = await supabase.rpc('complete_paid_order', {
      p_user_id: user.id,
      p_order_id: localOrder.id,
      p_paypal_order_id: paypalOrderId,
      p_paypal_capture_id: captureData.id
    })
    if (completeError) throw completeError
    return NextResponse.json({ success: true, orderId: completedId, captureId: captureData.id })
  } catch (error) {
    console.error(`PayPal capture failed at ${stage}:`, error)
    return NextResponse.json({
      error: error.message || 'No se pudo capturar el pago',
      stage
    }, { status: error.status || 500 })
  }
}
