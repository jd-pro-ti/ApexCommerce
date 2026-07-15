import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Obtener sesión
  const { data: { session } } = await supabase.auth.getSession()
  
  // Obtener el pathname
  const path = request.nextUrl.pathname
  
  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/', '/login', '/registro', '/catalogo', '/producto', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
  
  // Rutas protegidas
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/carrito') || path.startsWith('/perfil')
  
  // Si no está autenticado y trata de acceder a ruta protegida
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Si está autenticado y trata de acceder a login/registro
  if (session && (path === '/login' || path === '/registro')) {
    // Obtener el rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const role = profile?.role || 'cliente'
    let dashboardRoute = '/dashboard/cliente'
    
    if (role === 'admin') {
      dashboardRoute = '/dashboard/admin'
    } else if (role === 'vendedor') {
      dashboardRoute = '/dashboard/vendedor'
    }
    
    return NextResponse.redirect(new URL(dashboardRoute, request.url))
  }
  
  // Verificar permisos por rol para rutas de dashboard
  if (session && path.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const role = profile?.role || 'cliente'
    
    // Admin routes
    if (path.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
    }
    
    // Seller routes
    if (path.startsWith('/dashboard/vendedor') && !['admin', 'vendedor'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard/cliente', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}