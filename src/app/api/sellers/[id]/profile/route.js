import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

// Solo se exponen los datos que el vendedor marcó como públicos.
// La tabla profile_details también contiene dirección y teléfono, por eso no
// se consulta directamente desde el navegador.
export async function GET(_request, { params }) {
  try {
    const { id } = await params

    if (!id || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Perfil no disponible' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('profile_details')
      .select('user_id, city, state, country, bio, website, social_media')
      .eq('user_id', id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ success: true, details: data || {} })
  } catch (error) {
    console.error('Error al obtener detalles públicos del vendedor:', error)
    return NextResponse.json(
      { success: false, error: 'No se pudo cargar la información del vendedor' },
      { status: 500 }
    )
  }
}
