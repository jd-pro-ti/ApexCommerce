import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token || !supabaseAdmin) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })

    const supabase = createSupabaseRouteClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const productIds = [...new Set((Array.isArray(body.productIds) ? body.productIds : []).filter(Boolean))]
    if (!productIds.length) return NextResponse.json({ merchantIds: [] })

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products').select('seller_id').in('id', productIds).eq('status', 'active')
    if (productsError) throw productsError

    const sellerIds = [...new Set((products || []).map((product) => product.seller_id).filter(Boolean))]
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('seller_paypal_accounts')
      .select('seller_id, paypal_merchant_id, onboarding_status, payments_receivable, permissions_granted')
      .in('seller_id', sellerIds)
    if (accountsError) throw accountsError

    const merchantIds = [...new Set((accounts || [])
      .filter((account) => account.onboarding_status === 'connected' && account.paypal_merchant_id && account.payments_receivable !== false && account.permissions_granted !== false)
      .map((account) => account.paypal_merchant_id))]

    return NextResponse.json({ merchantIds })
  } catch (error) {
    console.error('PayPal merchant ids failed:', error)
    return NextResponse.json({ error: error.message || 'No se pudieron consultar los vendedores PayPal' }, { status: 500 })
  }
}
