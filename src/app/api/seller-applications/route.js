import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendSellerEmail } from '@/lib/seller-application-email'

const required = ['full_name', 'curp', 'phone', 'address', 'city', 'state', 'postal_code']

export async function GET() {
  const { user } = await getServerAuth()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data, error } = await supabaseAdmin.from('seller_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

export async function POST(request) {
  try {
    const { user, profile } = await getServerAuth()
    if (!user || !profile) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    if (profile.role !== 'cliente') return NextResponse.json({ error: 'Solo los clientes pueden solicitar ser vendedores' }, { status: 403 })
    const body = await request.json()
    const missing = required.find((field) => !String(body[field] || '').trim())
    if (missing) return NextResponse.json({ error: `El campo ${missing} es obligatorio` }, { status: 400 })
    const { data: pending } = await supabaseAdmin.from('seller_applications').select('id').eq('user_id', user.id).eq('status', 'pending').maybeSingle()
    if (pending) return NextResponse.json({ error: 'Ya tienes una solicitud pendiente' }, { status: 409 })
    const payload = { user_id: user.id, ...Object.fromEntries(['full_name','curp','rfc','phone','birth_date','id_type','id_number','address','city','state','postal_code','country','notes'].map((key) => [key, body[key] || null])) }
    payload.id_type = body.id_type || 'INE'; payload.country = body.country || 'México'
    const { data: application, error } = await supabaseAdmin.from('seller_applications').insert(payload).select().single()
    if (error) throw error
    const { data: admins } = await supabaseAdmin.from('profiles').select('id,email,name').eq('role', 'admin').eq('status', 'active')
    await supabaseAdmin.from('admin_logs').insert({ actor_id: user.id, action: 'seller_application_created', entity_type: 'seller_application', entity_id: application.id, message: `${profile.name || payload.full_name} envió una solicitud para convertirse en vendedor`, metadata: { applicant_id: user.id } })
    if (admins?.length) {
      await supabaseAdmin.from('notifications').insert(admins.map((admin) => ({ user_id: admin.id, type: 'seller_application', title: 'Nueva solicitud de vendedor', message: `${profile.name || payload.full_name} solicita convertirse en vendedor.` })))
      await Promise.all(admins.filter((admin) => admin.email).map((admin) => sendSellerEmail({ to: admin.email, subject: 'Nueva solicitud de vendedor', title: 'Nueva solicitud de vendedor', message: `${profile.name || payload.full_name} envió una solicitud que requiere revisión.`, actionPath: '/dashboard/admin/vendedores-solicitudes' })))
    }
    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error('Error al crear solicitud de vendedor:', error)
    return NextResponse.json({ error: error.message || 'No se pudo enviar la solicitud' }, { status: 500 })
  }
}
