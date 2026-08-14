import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import { paypalRequest } from '@/lib/paypal'

export const runtime = 'nodejs'

async function getUserFromRequest(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !supabaseAdmin) return null

  const supabase = createSupabaseRouteClient(token)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError
  return { user, profile }
}

export async function GET(request) {
  try {
    const authenticated = await getUserFromRequest(request)
    if (!authenticated) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })
    if (String(authenticated.profile.role).toLowerCase() !== 'vendedor') {
      return NextResponse.json({ error: 'Solo los vendedores pueden conectar PayPal' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('seller_paypal_accounts')
      .select('*')
      .eq('seller_id', authenticated.user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ account: data })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'No se pudo consultar PayPal' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authenticated = await getUserFromRequest(request)
    if (!authenticated) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })

    const { user, profile } = authenticated
    const role = String(profile.role || '').trim().toLowerCase()
    if (role !== 'vendedor') {
      return NextResponse.json({
        error: 'Solo los vendedores pueden conectar PayPal',
        detectedRole: role || 'sin_rol',
        userId: user.id
      }, { status: 403 })
    }

    const trackingId = `apex-${user.id}-${Date.now()}`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/paypal/sellers/onboard/callback`
    const referral = await paypalRequest('/v2/customer/partner-referrals', {
      method: 'POST',
      headers: process.env.PAYPAL_PARTNER_ATTRIBUTION_ID
        ? { 'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID }
        : {},
      body: JSON.stringify({
        tracking_id: trackingId,
        partner_config_override: {
          return_url: returnUrl,
          return_url_description: 'Regresar a Apex Commerce después de conectar PayPal'
        },
        operations: [{
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: {
              integration_method: 'PAYPAL',
              integration_type: 'THIRD_PARTY',
              third_party_details: {
                features: ['PAYMENT', 'REFUND', 'PARTNER_FEE', 'DELAY_FUNDS_DISBURSEMENT']
              }
            }
          }
        }],
        products: ['EXPRESS_CHECKOUT'],
        legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }]
      })
    })

    const actionUrl = referral.links?.find((link) => link.rel === 'action_url')?.href
    if (!actionUrl) throw new Error('PayPal no devolvió el enlace de onboarding')

    const selfUrl = referral.links?.find((link) => link.rel === 'self')?.href || null
    const { error: saveError } = await supabaseAdmin
      .from('seller_paypal_accounts')
      .upsert({
        seller_id: user.id,
        tracking_id: trackingId,
        partner_referral_id: selfUrl,
        onboarding_status: 'pending',
        last_error: null
      }, { onConflict: 'seller_id' })

    if (saveError) throw saveError
    return NextResponse.json({ actionUrl, trackingId })
  } catch (error) {
    console.error('PayPal seller onboarding failed:', error)
    if (error.status === 403 && /insufficient permissions/i.test(error.message || '')) {
      return NextResponse.json({
        error: 'La aplicación PayPal Sandbox no tiene permisos de Partner Referrals. Se requiere una cuenta de plataforma aprobada por PayPal.',
        code: 'PAYPAL_PARTNER_PERMISSIONS_REQUIRED'
      }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'No se pudo iniciar el onboarding de PayPal' }, { status: error.status || 500 })
  }
}

export async function DELETE(request) {
  try {
    const authenticated = await getUserFromRequest(request)
    if (!authenticated) return NextResponse.json({ error: 'SesiÃ³n no vÃ¡lida' }, { status: 401 })
    if (String(authenticated.profile.role || '').trim().toLowerCase() !== 'vendedor') {
      return NextResponse.json({ error: 'Solo los vendedores pueden desconectar PayPal' }, { status: 403 })
    }

    const { data: pendingPayouts, error: payoutsError } = await supabaseAdmin
      .from('seller_paypal_payouts')
      .select('id')
      .eq('seller_id', authenticated.user.id)
      .in('status', ['held', 'pending', 'failed'])
      .limit(1)
    if (payoutsError) throw payoutsError
    if (pendingPayouts?.length) {
      return NextResponse.json({ error: 'No puedes desconectar PayPal mientras tengas pagos pendientes de liberar. Libera esos pagos primero.' }, { status: 409 })
    }

    const { error } = await supabaseAdmin
      .from('seller_paypal_accounts')
      .update({
        paypal_merchant_id: null,
        tracking_id: null,
        partner_referral_id: null,
        onboarding_status: 'revoked',
        payments_receivable: false,
        permissions_granted: false,
        consent_status: false,
        last_error: null
      })
      .eq('seller_id', authenticated.user.id)
    if (error) throw error

    return NextResponse.json({ success: true, account: null })
  } catch (error) {
    console.error('PayPal seller disconnect failed:', error)
    return NextResponse.json({ error: error.message || 'No se pudo desconectar PayPal' }, { status: error.status || 500 })
  }
}
