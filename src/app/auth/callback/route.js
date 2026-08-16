import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  
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
    
    
    if (data.user) {
      // Obtener perfil con logs
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      
      // Si no existe el perfil, crearlo
      if (profileError && profileError.code === 'PGRST116') {
        
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
        
        return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard/admin' : role === 'vendedor' ? '/dashboard/vendedor' : '/', request.url))
      }
      
      // Si hay error diferente
      if (profileError) {
        console.error('❌ Error al obtener perfil:', profileError)
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      // Determinar redirección según el rol del perfil
      const role = profile?.role || 'cliente'
      
      return NextResponse.redirect(new URL(role === 'admin' ? '/dashboard/admin' : role === 'vendedor' ? '/dashboard/vendedor' : '/', request.url))
    }
    
    // Fallback
    return NextResponse.redirect(new URL('/', request.url))
    
  } catch (error) {
    console.error('❌ Error en callback:', error)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'unknown')}`, request.url))
  }
}
