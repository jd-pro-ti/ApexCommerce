import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verificar variables de entorno
if (!supabaseUrl) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL no está definida')
}

if (!supabaseServiceKey) {
}

// Crear cliente admin solo si tenemos las credenciales
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Función de utilidad para verificar si el admin está configurado
export const isSupabaseAdminConfigured = () => {
  return !!supabaseAdmin
}