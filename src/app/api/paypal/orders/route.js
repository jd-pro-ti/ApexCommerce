import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { createPaypalAuthAssertion, paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

export async function POST(request) {
  let sessionId = null
  let userId = null
  let authSupabase = null
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'SesiÃ³n no vÃ¡lida' }, { status: 401 })
    const supabase = createSupabaseRouteClient(token)
    authSupabase = supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'SesiÃ³n no vÃ¡lida' }, { status: 401 })
    userId = user.id
    if (!supabaseAdmin) throw new Error('Supabase admin no estÃ¡ configurado')

    const reader = supabaseAdmin
    const { data: profile, error: profileError } = await reader.from('profiles').select('name, email').eq('id', user.id).single()
    if (profileError) throw profileError
    const { data: details, error: detailsError } = await reader.from('profile_details')
      .select('phone, address, address_line2, city, state, postal_code, country, reference').eq('user_id', user.id).maybeSingle()
    if (detailsError && detailsError.code !== 'PGRST116') throw detailsError
    const shipping = details || {}
    const required = [['name', profile?.name], ['email', profile?.email], ['phone', shipping.phone], ['address', shipping.address], ['city', shipping.city], ['state', shipping.state], ['postal_code', shipping.postal_code]]
    const missingFields = required.filter(([, value]) => !String(value ?? '').trim()).map(([field]) => field)
    if (missingFields.length) return NextResponse.json({ error: `Completa estos campos de tu perfil: ${missingFields.join(', ')}`, missingFields }, { status: 400 })
    const normalizedCountry = String(shipping.country || 'México')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    if (!['mx', 'mexico'].includes(normalizedCountry)) {
      return NextResponse.json({ error: 'Apex Commerce solo acepta direcciones de MÃ©xico' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    if (!Array.isArray(body.cartItems) || !body.cartItems.length) return NextResponse.json({ error: 'El carrito estÃ¡ vacÃ­o' }, { status: 400 })
    const { data: createdSessionId, error: sessionError } = await supabase.rpc('create_paypal_checkout_session', {
      p_user_id: user.id, p_customer_name: profile.name, p_customer_email: profile.email, p_customer_phone: shipping.phone,
      p_shipping_address: shipping.address, p_shipping_address_line2: shipping.address_line2 || '', p_shipping_city: shipping.city,
      p_shipping_state: shipping.state, p_shipping_postal_code: shipping.postal_code, p_shipping_country: shipping.country || 'MÃ©xico',
      p_shipping_reference: shipping.reference || '', p_cart_items: body.cartItems, p_notes: body.notes || ''
    })
    if (sessionError) throw sessionError
    sessionId = createdSessionId

    const { data: session, error: sessionReadError } = await reader.from('paypal_checkout_sessions').select('*').eq('id', sessionId).single()
    if (sessionReadError) throw sessionReadError
    const cartItems = Array.isArray(session.cart_items) ? session.cart_items : []
    const productIds = cartItems.map((item) => item.id)
    const { data: products, error: productsError } = await reader.from('products').select('id, seller_id, name, price').in('id', productIds)
    if (productsError) throw productsError
    const productMap = new Map((products || []).map((product) => [product.id, product]))
    const orderItems = cartItems.map((item) => ({ ...productMap.get(item.id), quantity: Math.max(1, Number(item.quantity || 1)), subtotal: Number(productMap.get(item.id)?.price || 0) * Math.max(1, Number(item.quantity || 1)) })).filter((item) => item.id)
    const sellerIds = [...new Set(orderItems.map((item) => item.seller_id))]
    if (!sellerIds.length || sellerIds.length > 10) throw new Error('PayPal permite como mÃ¡ximo 10 vendedores por checkout')

    const { data: accounts, error: accountsError } = await reader.from('seller_paypal_accounts')
      .select('seller_id, paypal_merchant_id, onboarding_status, payments_receivable, permissions_granted').in('seller_id', sellerIds)
    if (accountsError) throw accountsError
    const accountsBySeller = new Map((accounts || []).map((account) => [account.seller_id, account]))
    for (const sellerId of sellerIds) {
      const account = accountsBySeller.get(sellerId)
      if (!account || account.onboarding_status !== 'connected' || !account.paypal_merchant_id || account.payments_receivable === false || account.permissions_granted === false) throw new Error('Uno de los vendedores no puede recibir pagos en PayPal')
    }

    const groups = sellerIds.map((sellerId) => {
      const items = orderItems.filter((item) => item.seller_id === sellerId)
      return { sellerId, items, itemSubtotal: items.reduce((sum, item) => sum + Number(item.subtotal), 0), account: accountsBySeller.get(sellerId) }
    })
    const totalShippingCents = Math.max(0, Math.round(Number(session.shipping_cost || 0) * 100))
    const totalItemsCents = Math.round(groups.reduce((sum, group) => sum + group.itemSubtotal, 0) * 100)
    let allocatedShippingCents = 0
    let totalFeeCents = 0
    const breakdown = groups.map((group, index) => {
      const itemCents = Math.round(group.itemSubtotal * 100)
      const shippingCents = index === groups.length - 1 ? totalShippingCents - allocatedShippingCents : totalItemsCents ? Math.round(totalShippingCents * itemCents / totalItemsCents) : 0
      allocatedShippingCents += shippingCents
      const grossCents = itemCents + shippingCents
      // La comisión se calcula únicamente sobre los productos, nunca sobre el envío.
      const feeCents = Math.round(itemCents * 0.15)
      totalFeeCents += feeCents
      // El vendedor recibe 85% de productos + 100% del envío.
      return { ...group, grossAmount: (grossCents / 100).toFixed(2), platformFeeAmount: (feeCents / 100).toFixed(2), sellerAmount: ((grossCents - feeCents) / 100).toFixed(2) }
    })
    const paypalOrder = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'PayPal-Request-Id': `apex-${session.id}`,
        'PayPal-Auth-Assertion': createPaypalAuthAssertion(accounts[0].paypal_merchant_id),
        ...(process.env.PAYPAL_PARTNER_ATTRIBUTION_ID
          ? { 'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID }
          : {})
      },
      body: JSON.stringify({ intent: 'CAPTURE', purchase_units: breakdown.map((group) => ({ reference_id: `seller-${group.sellerId}`, custom_id: session.id, description: 'Apex Commerce - vendedor', amount: { currency_code: 'MXN', value: group.grossAmount }, payee: { merchant_id: group.account.paypal_merchant_id }, payment_instruction: { disbursement_mode: 'DELAYED', platform_fees: [{ amount: { currency_code: 'MXN', value: group.platformFeeAmount } }] } })), application_context: { brand_name: 'Apex Commerce', user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING' } })
    })
    const sellerPayoutTotal = breakdown.reduce((sum, item) => sum + Number(item.sellerAmount), 0)
    const { error: updateError } = await reader.from('paypal_checkout_sessions').update({ paypal_order_id: paypalOrder.id, paypal_seller_breakdown: breakdown.map((group) => ({ seller_id: group.sellerId, merchant_id: group.account.paypal_merchant_id, gross_amount: group.grossAmount, platform_fee_amount: group.platformFeeAmount, seller_amount: group.sellerAmount })), updated_at: new Date().toISOString() }).eq('id', session.id)
    if (updateError) throw updateError
    return NextResponse.json({ id: paypalOrder.id, checkoutSessionId: session.id, platformFeeTotal: (totalFeeCents / 100).toFixed(2), sellerPayoutTotal: sellerPayoutTotal.toFixed(2) })
  } catch (error) {
    if (sessionId && authSupabase && userId) {
      await authSupabase.rpc('cancel_paypal_checkout_session', { p_user_id: userId, p_session_id: sessionId })
    }
    return NextResponse.json({ error: error.message || 'No se pudo crear la orden de PayPal' }, { status: error.status || 500 })
  }
}
