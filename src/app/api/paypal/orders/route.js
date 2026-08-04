import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

export async function POST(request) {
  let orderId = null
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })
    const supabase = createSupabaseRouteClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })

    const profileReader = supabaseAdmin || supabase
    const profileResult = await profileReader
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()
    if (profileResult.error) throw profileResult.error
    const profile = profileResult.data
    const detailsResult = await profileReader
      .from('profile_details')
      .select('phone, address, address_line2, city, state, postal_code, country, reference')
      .eq('user_id', user.id)
      .maybeSingle()
    if (detailsResult.error && detailsResult.error.code !== 'PGRST116') throw detailsResult.error
    const details = detailsResult.data || {}
    const required = [
      ['name', profile?.name],
      ['email', profile?.email],
      ['phone', details?.phone],
      ['address', details?.address],
      ['city', details?.city],
      ['state', details?.state],
      ['postal_code', details?.postal_code]
    ]
    const missingFields = required
      .filter(([, value]) => !String(value ?? '').trim())
      .map(([field]) => field)
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Completa estos campos de tu perfil: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 })
    }
    const country = String(details.country || 'México').trim().toLowerCase()
    if (!['mx', 'méxico', 'mexico'].includes(country)) {
      return NextResponse.json({ error: 'Apex Commerce solo acepta direcciones de México' }, { status: 400 })
    }

    const body = await request.json()
    if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }
    const { data: createdOrderId, error: createError } = await supabase.rpc('create_pending_order', {
      p_user_id: user.id,
      p_customer_name: profile.name,
      p_customer_email: profile.email,
      p_customer_phone: details.phone,
      p_shipping_address: details.address,
      p_shipping_address_line2: details.address_line2 || '',
      p_shipping_city: details.city,
      p_shipping_state: details.state,
      p_shipping_postal_code: details.postal_code,
      p_shipping_country: details.country || 'México',
      p_shipping_reference: details.reference || '',
      p_cart_items: body.cartItems,
      p_notes: body.notes || ''
    })
    if (createError) throw createError
    orderId = createdOrderId

    const { data: order, error: orderError } = await supabase
      .from('orders').select('id, total, order_number').eq('id', orderId).single()
    if (orderError) throw orderError

    const paypalOrder = await paypalRequest('/v2/checkout/orders', {
      method: 'POST',
      headers: { 'PayPal-Request-Id': `apex-${order.id}` },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: order.id,
          description: `Apex Commerce ${order.order_number}`,
          amount: { currency_code: 'MXN', value: Number(order.total).toFixed(2) }
        }],
        application_context: {
          brand_name: 'Apex Commerce',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING'
        }
      })
    })

    if (!supabaseAdmin) throw new Error('Supabase admin no está configurado')
    const { error: updateError } = await supabaseAdmin.from('orders').update({ paypal_order_id: paypalOrder.id }).eq('id', order.id)
    if (updateError) throw updateError
    return NextResponse.json({ id: paypalOrder.id, localOrderId: order.id })
  } catch (error) {
    if (orderId) {
      try {
        if (supabaseAdmin) {
          const { data: items } = await supabaseAdmin.from('order_items').select('product_id, quantity').eq('order_id', orderId)
          for (const item of items || []) {
            const { data: product } = await supabaseAdmin.from('products').select('reserved_stock').eq('id', item.product_id).single()
            if (product) {
              await supabaseAdmin.from('products').update({ reserved_stock: Math.max(0, product.reserved_stock - item.quantity) }).eq('id', item.product_id)
            }
          }
          await supabaseAdmin.from('orders').update({ status: 'cancelled', reservation_expires_at: null }).eq('id', orderId)
        }
      } catch (releaseError) {
        console.error('No se pudo liberar la reserva de stock:', releaseError)
      }
    }
    return NextResponse.json({ error: error.message || 'No se pudo crear la orden de PayPal' }, { status: error.status || 500 })
  }
}
