import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { profile } = await getServerAuth()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Incluye solicitudes antiguas que se crearon antes de que comenzaran a registrarse en admin_logs.
  const { data: deletionRequests } = await supabaseAdmin.from('account_deletion_requests').select('id,user_id,status,created_at,profiles:user_id(name)').order('created_at', { ascending: false }).limit(100)
  const loggedRequestIds = new Set((data || []).filter((log) => log.entity_type === 'account_deletion_request').map((log) => log.entity_id))
  const fallbackLogs = (deletionRequests || []).filter((request) => !loggedRequestIds.has(request.id)).map((request) => ({
    id: `account-deletion-${request.id}`,
    action: 'account_deletion_request_created',
    entity_type: 'account_deletion_request',
    entity_id: request.id,
    message: `${request.profiles?.name || 'Un usuario'} solicitó eliminar su cuenta`,
    created_at: request.created_at,
    metadata: { applicant_id: request.user_id, status: request.status }
  }))
  return NextResponse.json({ logs: [...(data || []), ...fallbackLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100) })
}
