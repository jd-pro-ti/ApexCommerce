import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'

export const authService = {
  // Iniciar sesión con email y contraseña
  async login(email, password) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Obtener perfil del usuario
      const profile = await this.getProfile(data.user.id)
      
      return {
        success: true,
        user: {
          ...data.user,
          ...profile
        }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      }
    }
  },

  // Registrar usuario con email y contraseña
  async register(email, password, userData = {}) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            name: userData.name,
            role: userData.role || 'cliente'
          }
        }
      })
      
      if (error) throw error
      
      // Esperar a que se cree el perfil (trigger)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Obtener el perfil creado
      const profile = await this.getProfile(data.user.id)
      
      return {
        success: true,
        user: {
          ...data.user,
          ...profile
        }
      }
    } catch (error) {
      console.error('Error en registro:', error)
      return {
        success: false,
        error: error.message || 'Error al registrar usuario'
      }
    }
  },

  // Iniciar sesión con Google
  async loginWithGoogle() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) throw error
      
      return {
        success: true,
        url: data.url
      }
    } catch (error) {
      console.error('Error en login con Google:', error)
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión con Google'
      }
    }
  },

  // Cerrar sesión
  async logout() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      return {
        success: true
      }
    } catch (error) {
      console.error('Error en logout:', error)
      return {
        success: false,
        error: error.message || 'Error al cerrar sesión'
      }
    }
  },

  // Obtener sesión actual
  async getSession() {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase no configurado, retornando sesión vacía')
        return {
          success: true,
          user: null
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (!session) {
        return {
          success: true,
          user: null
        }
      }
      
      // Obtener perfil
      const profile = await this.getProfile(session.user.id)
      
      return {
        success: true,
        user: {
          ...session.user,
          ...profile
        }
      }
    } catch (error) {
      console.error('Error al obtener sesión:', error)
      return {
        success: true,
        user: null
      }
    }
  },

  // Obtener perfil de usuario
  async getProfile(userId) {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase no configurado')
        return null
      }

      console.log('🔍 Buscando perfil para:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.warn('⚠️ Error al obtener perfil:', error.message)
        
        // Si el error es que no existe, crear el perfil
        if (error.code === 'PGRST116') {
          console.log('🔄 Perfil no encontrado, creando...')
          
          // Obtener datos del usuario
          const { data: userData } = await supabase.auth.getUser()
          
          if (userData?.user) {
            // Verificar si es el primer usuario
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
            
            const isFirstUser = count === 0
            const role = isFirstUser ? 'admin' : 'cliente'
            
            console.log('📝 Creando perfil con rol:', role)
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: userData.user.email,
                name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || 'Usuario',
                avatar_url: userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture || null,
                role: role
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('❌ Error al crear perfil:', insertError)
              return null
            }
            
            console.log('✅ Perfil creado exitosamente:', newProfile)
            return newProfile
          }
        }
        
        return null
      }
      
      console.log('✅ Perfil encontrado:', data)
      return data
    } catch (error) {
      console.error('❌ Error en getProfile:', error)
      return null
    }
  },

  // Actualizar perfil
  async updateProfile(userId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        success: true,
        profile: data
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      return {
        success: false,
        error: error.message || 'Error al actualizar perfil'
      }
    }
  },

  // Actualizar rol de usuario (solo admin)
  async updateUserRole(userId, newRole) {
    try {
      if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
        throw new Error('Supabase Admin no está configurado correctamente')
      }

      const currentUser = await this.getSession()
      if (!currentUser.success || !currentUser.user) {
        throw new Error('No autenticado')
      }
      
      const currentProfile = await this.getProfile(currentUser.user.id)
      if (!currentProfile || currentProfile.role !== 'admin') {
        throw new Error('No autorizado')
      }
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        success: true,
        profile: data
      }
    } catch (error) {
      console.error('Error al actualizar rol:', error)
      return {
        success: false,
        error: error.message || 'Error al actualizar rol'
      }
    }
  },

  // Verificar si el usuario es admin
  async isAdmin() {
    try {
      const session = await this.getSession()
      if (!session.success || !session.user) return false
      return session.user.role === 'admin'
    } catch (error) {
      console.error('Error al verificar admin:', error)
      return false
    }
  },

  // Obtener todos los usuarios (solo admin)
  async getAllUsers() {
    try {
      if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
        throw new Error('Supabase Admin no está configurado correctamente')
      }

      const isAdmin = await this.isAdmin()
      if (!isAdmin) {
        throw new Error('No autorizado - Se requieren permisos de administrador')
      }
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return {
        success: true,
        users: data
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      return {
        success: false,
        error: error.message || 'Error al obtener usuarios'
      }
    }
  },
  // Agregar estos métodos al authService

// Obtener todos los usuarios (solo admin)
async getAllUsers() {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Verificar admin
    const isAdmin = await this.isAdmin()
    if (!isAdmin) {
      throw new Error('No autorizado - Se requieren permisos de administrador')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      users: data
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return {
      success: false,
      error: error.message || 'Error al obtener usuarios'
    }
  }
},

// Actualizar rol de usuario (solo admin)
async updateUserRole(userId, newRole) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Verificar admin
    const isAdmin = await this.isAdmin()
    if (!isAdmin) {
      throw new Error('No autorizado - Se requieren permisos de administrador')
    }

    // Validar rol
    if (!['admin', 'vendedor', 'cliente'].includes(newRole)) {
      throw new Error('Rol inválido')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      user: data
    }
  } catch (error) {
    console.error('Error al actualizar rol:', error)
    return {
      success: false,
      error: error.message || 'Error al actualizar rol'
    }
  }
},

// Actualizar estado de usuario (solo admin)
async updateUserStatus(userId, status) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Verificar admin
    const isAdmin = await this.isAdmin()
    if (!isAdmin) {
      throw new Error('No autorizado - Se requieren permisos de administrador')
    }

    // Validar estado
    if (!['active', 'suspended'].includes(status)) {
      throw new Error('Estado inválido')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      user: data
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error)
    return {
      success: false,
      error: error.message || 'Error al actualizar estado'
    }
  }
},

// Eliminar usuario (solo admin)
async deleteUser(userId) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Verificar admin
    const isAdmin = await this.isAdmin()
    if (!isAdmin) {
      throw new Error('No autorizado - Se requieren permisos de administrador')
    }

    // Eliminar el perfil
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error

    return {
      success: true,
      message: 'Usuario eliminado correctamente'
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return {
      success: false,
      error: error.message || 'Error al eliminar usuario'
    }
  }
},

  // Refresh token
  async refreshSession() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      return {
        success: true,
        session: data.session
      }
    } catch (error) {
      console.error('Error al refrescar sesión:', error)
      return {
        success: false,
        error: error.message || 'Error al refrescar sesión'
      }
    }
  }
}