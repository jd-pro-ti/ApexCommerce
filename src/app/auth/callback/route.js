import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🚀 Callback recibido')
  console.log('📝 Código:', code ? '✅ Presente' : '❌ No presente')
  
  if (!code) {
    console.error('❌ No hay código en la URL')
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Error al intercambiar código:', error)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }
    
    console.log('✅ Sesión obtenida:', data.user?.email)
    
    if (data.user) {
      // Obtener perfil con logs
      console.log('🔍 Buscando perfil para usuario:', data.user.id)
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      console.log('📊 Perfil encontrado:', profile)
      console.log('📊 Error de perfil:', profileError)
      
      // Si no existe el perfil, crearlo
      if (profileError && profileError.code === 'PGRST116') {
        console.log('🔄 Creando perfil para:', data.user.email)
        
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        const isFirstUser = count === 0
        const role = isFirstUser ? 'admin' : 'cliente'
        
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Usuario',
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            role: role
          })
        
        console.log('✅ Perfil creado con rol:', role)
        const roleToUse = role
        let dashboardRoute = '/dashboard/cliente'
        
        if (roleToUse === 'admin') {
          dashboardRoute = '/dashboard/admin'
        } else if (roleToUse === 'vendedor') {
          dashboardRoute = '/dashboard/vendedor'
        }
        
        console.log(`✅ Redirigiendo a: ${dashboardRoute} (rol: ${roleToUse})`)
        return NextResponse.redirect(new URL(dashboardRoute, request.url))
      }
      
      // Si hay error diferente
      if (profileError) {
        console.error('❌ Error al obtener perfil:', profileError)
        return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
      }
      
      // Determinar redirección según el rol del perfil
      const role = profile?.role || 'cliente'
      console.log('🎯 Rol del usuario:', role)
      
      let dashboardRoute = '/dashboard/cliente'
      if (role === 'admin') {
        dashboardRoute = '/dashboard/admin'
      } else if (role === 'vendedor') {
        dashboardRoute = '/dashboard/vendedor'
      }
      
      console.log(`✅ Redirigiendo a: ${dashboardRoute} (rol: ${role})`)
      return NextResponse.redirect(new URL(dashboardRoute, request.url))
    }
    
    // Fallback
    console.log('⚠️ No hay usuario, redirigiendo a cliente')
    return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
    
  } catch (error) {
    console.error('❌ Error en callback:', error)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'unknown')}`, request.url))
  }
}