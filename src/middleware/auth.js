import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión si es necesario
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener rol del usuario
  let userRole = 'cliente'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role || 'cliente'
  }

  // Rutas protegidas por rol
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin')
  const isSellerRoute = request.nextUrl.pathname.startsWith('/dashboard/vendedor')
  const isClientRoute = request.nextUrl.pathname.startsWith('/dashboard/cliente')

  // Si no está autenticado y trata de acceder a dashboard
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Verificar permisos por rol
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
  }

  if (isSellerRoute && !['admin', 'vendedor'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
  }

  return supabaseResponse
}