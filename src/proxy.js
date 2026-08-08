import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const ROLE_HOME = {
  admin: '/dashboard/admin',
  vendedor: '/dashboard/vendedor',
  cliente: '/',
}

const PUBLIC_ROUTES = ['/', '/login', '/registro', '/catalogo', '/producto', '/auth/callback']
const CLIENT_ONLY_ROUTES = ['/carrito', '/favorito', '/favoritos', '/perfil']

function matchesRoute(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function isAnyRoute(pathname, routes) {
  return routes.some((route) => matchesRoute(pathname, route))
}

function safeRedirectPath(pathname, search) {
  const value = `${pathname}${search}`
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function redirectTo(request, pathname, search = '') {
  const url = new URL(pathname, request.url)
  if (search) url.search = search
  return NextResponse.redirect(url)
}

export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getUser valida la sesión en Supabase y también permite refrescarla.
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  const isPublicRoute = isAnyRoute(pathname, PUBLIC_ROUTES)
  const isDashboardRoute = matchesRoute(pathname, '/dashboard')
  const isClientOnlyRoute = isAnyRoute(pathname, CLIENT_ONLY_ROUTES)

  if (!user) {
    if (isDashboardRoute || isClientOnlyRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', safeRedirectPath(pathname, search))
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return redirectTo(request, '/login', '?error=profile_not_found')
  }

  if (profile.status === 'suspended') {
    await supabase.auth.signOut()
    return redirectTo(request, '/login', '?error=account_suspended')
  }

  const role = ROLE_HOME[profile.role] ? profile.role : 'cliente'
  const home = ROLE_HOME[role]

  // Admines y vendedores trabajan únicamente dentro de su área.
  if (pathname === '/login' || pathname === '/registro') {
    return redirectTo(request, '/')
  }

  if (isPublicRoute && pathname !== '/' && role !== 'cliente') {
    return redirectTo(request, home)
  }

  if (matchesRoute(pathname, '/dashboard/admin') && role !== 'admin') {
    return redirectTo(request, home)
  }

  if (matchesRoute(pathname, '/dashboard/vendedor') && role !== 'vendedor') {
    return redirectTo(request, home)
  }

  if (isClientOnlyRoute && role !== 'cliente') {
    return redirectTo(request, home)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}
