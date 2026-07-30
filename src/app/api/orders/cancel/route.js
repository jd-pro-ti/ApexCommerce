import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ success: false, error: 'Falta el pedido' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const authClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, user_id, status, order_items(id, status)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 })
    if (order.user_id !== user.id) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })

    const items = order.order_items || []
    const hasUncancelableItem = items.some(item => ['shipped', 'delivered', 'cancelled'].includes(item.status))
    // El estado global puede tener valores como `confirmed`; la decisión se
    // toma por artículo para no bloquear cancelaciones válidas del cliente.
    if (!items.length || hasUncancelableItem) {
      return NextResponse.json({ success: false, error: 'Este pedido ya no se puede cancelar' }, { status: 400 })
    }

    const { error: itemsError } = await admin
      .from('order_items')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId)
      .in('status', ['pending', 'processing'])
    if (itemsError) throw itemsError

    const { error: updateError } = await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    if (updateError) throw updateError

    return NextResponse.json({ success: true, orderId })
  } catch (error) {
    console.error('Error al cancelar pedido:', error)
    return NextResponse.json({ success: false, error: 'No se pudo cancelar el pedido' }, { status: 500 })
  }
}
