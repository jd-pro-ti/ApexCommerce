import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { getServerAuth } from '@/lib/server-auth'

const getServerSupabase = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      }
    }
  )
}

const deleteRows = async (table, column, values) => {
  if (!values.length) return
  const { error } = await supabaseAdmin.from(table).delete().in(column, values)
  if (error) {
    const detail = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
    throw new Error(`No se pudo limpiar ${table}: ${detail || JSON.stringify(error)}`)
  }
}

const deleteOptionalRows = async (table, column, values) => {
  if (!values.length) return
  const { error } = await supabaseAdmin.from(table).delete().in(column, values)
  // Esta tabla pertenece al módulo opcional de PayPal y puede no existir.
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) return
  if (error) {
    const detail = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
    throw new Error(`No se pudo limpiar ${table}: ${detail || JSON.stringify(error)}`)
  }
}

const removeStorageFolder = async (bucket, folder) => {
  try {
    const { data: files } = await supabaseAdmin.storage.from(bucket).list(folder, { limit: 1000 })
    const paths = (files || []).filter((file) => file.name).map((file) => `${folder}/${file.name}`)
    if (paths.length) await supabaseAdmin.storage.from(bucket).remove(paths)
  } catch (error) {
    // Storage cleanup should not prevent the database/account deletion.
    console.warn(`No se pudieron limpiar archivos de ${bucket}/${folder}:`, error.message)
  }
}

export async function POST(request) {
  try {
    const { user, profile } = await getServerAuth()
    if (!user || !profile) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const reason = String(body.reason || '').trim()
    if (!reason) return NextResponse.json({ error: 'Es necesario indicar por qué deseas eliminar tu cuenta.' }, { status: 400 })
    const { data: pending } = await supabaseAdmin.from('account_deletion_requests').select('id').eq('user_id', user.id).eq('status', 'pending').maybeSingle()
    if (pending) return NextResponse.json({ error: 'Ya tienes una solicitud de eliminación pendiente.' }, { status: 409 })
    const { data: requestRow, error } = await supabaseAdmin.from('account_deletion_requests').insert({ user_id: user.id, reason }).select().single()
    if (error) throw error
    await supabaseAdmin.from('admin_logs').insert({
      actor_id: user.id,
      action: 'account_deletion_request_created',
      entity_type: 'account_deletion_request',
      entity_id: requestRow.id,
      message: `${profile.name || 'Un usuario'} solicitó eliminar su cuenta`,
      metadata: { applicant_id: user.id, request_id: requestRow.id, reason }
    })
    const { data: admins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin').eq('status', 'active')
    if (admins?.length) {
      await supabaseAdmin.from('notifications').insert(admins.map((admin) => ({ user_id: admin.id, type: 'account_deletion_request', title: 'Nueva solicitud de eliminación', message: `${profile.name || 'Un usuario'} solicita eliminar su cuenta.` })))
    }
    return NextResponse.json({ success: true, request: requestRow })
  } catch (error) {
    console.error('Error al crear solicitud de eliminación:', error)
    return NextResponse.json({ error: error.message || 'No se pudo enviar la solicitud' }, { status: 500 })
  }
}

export async function DELETE(request) {
  let step = 'inicio'
  try {
    const { confirmation, user_id: requestedUserId } = await request.json().catch(() => ({}))
    if (confirmation !== 'ELIMINAR') {
      return NextResponse.json({ success: false, error: 'Escribe ELIMINAR para confirmar.' }, { status: 400 })
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ success: false, error: 'La eliminación segura no está configurada en el servidor.' }, { status: 503 })
    }

    step = 'validar sesión'
    const serverSupabase = await getServerSupabase()
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Tu sesión ya no es válida.' }, { status: 401 })
    }

    const { profile } = await getServerAuth()
    if (requestedUserId && (profile?.role !== 'admin' || requestedUserId === user.id)) {
      return NextResponse.json({ success: false, error: 'No autorizado para eliminar esta cuenta.' }, { status: 403 })
    }
    if (!requestedUserId) {
      return NextResponse.json({ success: false, error: 'La eliminación de cuentas se realiza mediante una solicitud al administrador.' }, { status: 403 })
    }
    const userId = requestedUserId
    if (profile?.role === 'admin') {
      const { data: targetProfile } = await supabaseAdmin.from('profiles').select('name,email').eq('id', userId).maybeSingle()
      await supabaseAdmin.from('admin_logs').insert({
        actor_id: user.id,
        action: 'account_deleted_by_admin',
        entity_type: 'profile',
        entity_id: userId,
        message: `Eliminó la cuenta de ${targetProfile?.name || targetProfile?.email || 'un usuario'}`,
        metadata: { deleted_user_id: userId }
      })
    }
    step = 'buscar pedidos'
    const { data: ownedOrders, error: ordersError } = await supabaseAdmin
      .from('orders').select('id').eq('user_id', userId)
    if (ordersError) throw ordersError
    const orderIds = (ownedOrders || []).map(({ id }) => id)

    // Quitar referencias que usan RESTRICT antes de borrar el perfil.
    step = 'limpiar referencias de vendedor'
    const { error: reviewedByError } = await supabaseAdmin.from('seller_applications').update({ reviewed_by: null }).eq('reviewed_by', userId)
    if (reviewedByError) throw reviewedByError
    await deleteOptionalRows('seller_paypal_payouts', 'seller_id', [userId])

    step = 'eliminar historial de pedidos'
    await deleteRows('order_status_history', 'order_id', orderIds)
    step = 'eliminar productos de pedidos'
    await deleteRows('order_items', 'seller_id', [userId])
    await deleteRows('order_items', 'order_id', orderIds)
    step = 'eliminar pedidos'
    await deleteRows('orders', 'id', orderIds)

    step = 'eliminar productos del vendedor'
    const { data: sellerProducts, error: sellerProductsError } = await supabaseAdmin
      .from('products').select('id').eq('seller_id', userId)
    if (sellerProductsError) throw sellerProductsError

    await Promise.all((sellerProducts || []).map((product) => removeStorageFolder('products', product.id)))
    await removeStorageFolder('profiles', userId)

    const { error: productsError } = await supabaseAdmin.from('products').delete().eq('seller_id', userId)
    if (productsError) throw new Error(`No se pudieron eliminar los productos: ${productsError.message}`)

    // Elimina también datos que no dependan de cascadas del perfil.
    step = 'limpiar registros administrativos'
    await deleteRows('admin_logs', 'actor_id', [userId])

    // En algunos proyectos existentes la FK profiles -> auth.users no tiene
    // CASCADE aunque el esquema nuevo sí lo defina. Borramos el perfil antes
    // de eliminar el usuario de Auth para cubrir ambos casos.
    step = 'eliminar perfil y datos personales'
    await deleteRows('profiles', 'id', [userId])

    step = 'eliminar usuario de Supabase Auth'
    const authDeleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: 'no-store',
    })

    if (!authDeleteResponse.ok) {
      const responseText = await authDeleteResponse.text()
      let responseDetail = responseText
      try {
        const parsed = JSON.parse(responseText)
        responseDetail = [parsed.message, parsed.error, parsed.error_description, parsed.code].filter(Boolean).join(' | ') || responseText
      } catch {}
      throw new Error(`No se pudo eliminar la cuenta (${authDeleteResponse.status}): ${responseDetail || 'Supabase no devolvió detalles.'}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar cuenta:', error)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    const code = error?.code || error?.status || ''
    return NextResponse.json({ success: false, error: `Fallo en "${step}": ${message || 'No se pudo eliminar la cuenta.'}`, code }, { status: 500 })
  }
}
