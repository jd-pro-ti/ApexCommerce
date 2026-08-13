import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendSellerEmail } from '@/lib/seller-application-email'

export async function GET() {
  const { profile } = await getServerAuth()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('seller_applications').select('*, profiles:user_id(name,email)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: deletionRequests, error: deletionError } = await supabaseAdmin.from('account_deletion_requests').select('*, profiles:user_id(name,email,role)').order('created_at', { ascending: false })
  if (deletionError) return NextResponse.json({ error: deletionError.message }, { status: 500 })
  return NextResponse.json({ applications: data || [], deletionRequests: deletionRequests || [] })
}

export async function PATCH(request) {
  try {
    const { user, profile } = await getServerAuth()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    const { id, status, rejection_reason = '', type = 'seller' } = await request.json()
    if (!id || !['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    if (type === 'deletion') {
      const { data: deletionRequest, error: findDeletionError } = await supabaseAdmin.from('account_deletion_requests').select('*, profiles:user_id(name,email,role)').eq('id', id).single()
      if (findDeletionError || !deletionRequest) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
      if (deletionRequest.status !== 'pending') return NextResponse.json({ error: 'La solicitud ya fue revisada' }, { status: 409 })
      const { error: updateError } = await supabaseAdmin.from('account_deletion_requests').update({ status, rejection_reason: status === 'rejected' ? rejection_reason : null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
      if (updateError) throw updateError
      await supabaseAdmin.from('admin_logs').insert({
        actor_id: user.id,
        action: `account_deletion_request_${status}`,
        entity_type: 'account_deletion_request',
        entity_id: id,
        message: `${status === 'approved' ? 'Aprobó' : 'Rechazó'} la solicitud de eliminación de ${deletionRequest.profiles?.name || 'un usuario'}`,
        metadata: { applicant_id: deletionRequest.user_id, rejection_reason }
      })
      if (status === 'approved') {
        const deletionResponse = await fetch(`${new URL(request.url).origin}/api/account/delete`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' }, body: JSON.stringify({ confirmation: 'ELIMINAR', user_id: deletionRequest.user_id }), cache: 'no-store' })
        if (!deletionResponse.ok) {
          const detail = await deletionResponse.json().catch(() => ({}))
          throw new Error(detail.error || 'No se pudo eliminar la cuenta aprobada')
        }
      }
      await supabaseAdmin.from('notifications').insert({ user_id: deletionRequest.user_id, type: `account_deletion_${status}`, title: status === 'approved' ? 'Cuenta eliminada' : 'Solicitud de eliminación rechazada', message: status === 'approved' ? 'Tu cuenta fue eliminada por el administrador.' : `Tu solicitud de eliminación fue rechazada.${rejection_reason ? ` Motivo: ${rejection_reason}` : ''}` })
      return NextResponse.json({ success: true })
    }
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
