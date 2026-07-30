import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    const { itemId } = await request.json()
    if (!itemId) return NextResponse.json({ success: false, error: 'Falta el artículo' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const authClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })

    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: item, error: itemError } = await admin
      .from('order_items')
      .select('id, order_id, seller_id, status')
      .eq('id', itemId)
      .single()

    if (itemError || !item) return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 })
    if (item.seller_id !== user.id) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    if (['shipped', 'delivered', 'cancelled'].includes(item.status)) {
      return NextResponse.json({ success: false, error: 'Este artículo ya no se puede cancelar' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('order_items')
      .update({ status: 'cancelled' })
      .eq('id', itemId)

    if (updateError) throw updateError

    const { data: remainingItems, error: remainingError } = await admin
      .from('order_items')
      .select('status')
      .eq('order_id', item.order_id)
    if (remainingError) throw remainingError

    if (remainingItems?.length && remainingItems.every(entry => entry.status === 'cancelled')) {
      await admin.from('orders').update({ status: 'cancelled' }).eq('id', item.order_id)
    }

    return NextResponse.json({ success: true, orderId: item.order_id, itemId })
  } catch (error) {
    console.error('Error al cancelar artículo:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
