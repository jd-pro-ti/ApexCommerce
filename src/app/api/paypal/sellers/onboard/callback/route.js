import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request) {
  const url = new URL(request.url)
  const trackingId = url.searchParams.get('merchantId') || url.searchParams.get('tracking_id')
  const paypalMerchantId = url.searchParams.get('merchantIdInPayPal')
  const permissionsGranted = url.searchParams.get('permissionsGranted') === 'true'
  const consentStatus = url.searchParams.get('consentStatus') === 'true'
  const accountStatus = url.searchParams.get('accountStatus') || ''

  try {
    if (!supabaseAdmin || !trackingId) {
      throw new Error('PayPal no devolvió el identificador de seguimiento del vendedor')
    }

    const connected = Boolean(paypalMerchantId && permissionsGranted && consentStatus)
    const { error } = await supabaseAdmin
      .from('seller_paypal_accounts')
      .update({
        paypal_merchant_id: paypalMerchantId || null,
        onboarding_status: connected ? 'connected' : 'error',
        payments_receivable: connected && accountStatus === 'BUSINESS_ACCOUNT',
        permissions_granted: permissionsGranted,
        consent_status: consentStatus,
        last_error: connected ? null : 'El vendedor no terminó de conceder los permisos de PayPal'
      })
      .eq('tracking_id', trackingId)

    if (error) throw error

    const destination = new URL('/dashboard/vendedor/perfil', url.origin)
    destination.searchParams.set('paypal', connected ? 'connected' : 'error')
    return NextResponse.redirect(destination)
  } catch (error) {
    console.error('PayPal seller onboarding callback failed:', error)
    const destination = new URL('/dashboard/vendedor/perfil', url.origin)
    destination.searchParams.set('paypal', 'error')
    destination.searchParams.set('message', error.message || 'No se pudo confirmar la conexión con PayPal')
    return NextResponse.redirect(destination)
  }
}
