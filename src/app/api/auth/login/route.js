import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateEmail, validatePassword } from '@/utils/validation'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      return NextResponse.json({ success: false, error: 'El correo o la contraseña no tienen un formato válido' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: 'No se encontró el perfil del usuario' },
        { status: 401 }
      )
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: 'La cuenta está suspendida' },
        { status: 403 }
      )
    }

    const result = {
      success: true,
      user: {
        ...authData.user,
        ...profile,
      },
    }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
