import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendSellerEmail } from '@/lib/seller-application-email'

export async function GET() {
  const { profile } = await getServerAuth()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('seller_applications').select('*, profiles:user_id(name,email)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data || [] })
}

export async function PATCH(request) {
  try {
    const { user, profile } = await getServerAuth()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    const { id, status, rejection_reason = '' } = await request.json()
    if (!id || !['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    const { data: application, error: findError } = await supabaseAdmin.from('seller_applications').select('*, profiles:user_id(name,email)').eq('id', id).single()
    if (findError || !application) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    if (application.status !== 'pending') return NextResponse.json({ error: 'La solicitud ya fue revisada' }, { status: 409 })
    const { error } = await supabaseAdmin.from('seller_applications').update({ status, rejection_reason: status === 'rejected' ? rejection_reason : null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    if (status === 'approved') {
      const { error: roleError } = await supabaseAdmin.from('profiles').update({ role: 'vendedor', updated_at: new Date().toISOString() }).eq('id', application.user_id)
      if (roleError) throw roleError
    }
    const isApproved = status === 'approved'
    const message = isApproved ? 'Tu solicitud fue aprobada. Ya puedes comenzar a publicar productos como vendedor.' : `Tu solicitud fue rechazada.${rejection_reason ? ` Motivo: ${rejection_reason}` : ''}`
    await supabaseAdmin.from('admin_logs').insert({ actor_id: user.id, action: `seller_application_${status}`, entity_type: 'seller_application', entity_id: id, message: `${isApproved ? 'Aprobó' : 'Rechazó'} la solicitud de ${application.profiles?.name || application.full_name}`, metadata: { applicant_id: application.user_id, rejection_reason } })
    await supabaseAdmin.from('notifications').insert({ user_id: application.user_id, type: `seller_application_${status}`, title: isApproved ? 'Solicitud aprobada' : 'Solicitud rechazada', message })
    await sendSellerEmail({ to: application.profiles?.email, subject: isApproved ? 'Tu solicitud de vendedor fue aprobada' : 'Actualización de tu solicitud de vendedor', title: isApproved ? '¡Felicidades! Ya eres vendedor' : 'Actualización de tu solicitud', message, actionPath: isApproved ? '/dashboard/vendedor' : '/perfil' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al revisar solicitud:', error)
    return NextResponse.json({ error: error.message || 'No se pudo revisar la solicitud' }, { status: 500 })
  }
}
