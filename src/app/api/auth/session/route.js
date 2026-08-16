import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const refreshedCookies = []

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
            refreshedCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    const response = NextResponse.json({ success: false, user: null })
    refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.status === 'suspended') {
    const response = NextResponse.json({ success: false, user: null })
    refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const response = NextResponse.json({
    success: true,
    user: { ...user, ...profile },
  })
  refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))

  return response
}
