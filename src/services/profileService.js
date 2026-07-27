import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const profileService = {
  // Obtener perfil completo (profiles + profile_details)
  async getProfile(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      // Obtener datos básicos del perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Obtener detalles adicionales
      const { data: details, error: detailsError } = await supabase
        .from('profile_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (detailsError && detailsError.code !== 'PGRST116') {
        throw detailsError
      }

      // Si no existe profile_details, crearlo
      if (!details) {
        const { data: newDetails, error: createError } = await supabase
          .from('profile_details')
          .insert({ user_id: userId })
          .select()
          .single()

        if (createError) throw createError

        return {
          success: true,
          profile: {
            ...profile,
            details: newDetails || {}
          }
        }
      }

      return {
        success: true,
        profile: {
          ...profile,
          details: details || {}
        }
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Actualizar perfil básico
  async updateProfile(userId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatar_url,
          updated_at: new Date()
        })
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
        error: error.message
      }
    }
  },

  // Actualizar detalles del perfil
  async updateProfileDetails(userId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      // Verificar si existe
      const { data: existing } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let result

      if (existing) {
        // Actualizar existente
        const { data, error } = await supabase
          .from('profile_details')
          .update({
            ...updates,
            updated_at: new Date()
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Insertar nuevo
        const { data, error } = await supabase
          .from('profile_details')
          .insert({
            user_id: userId,
            ...updates
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      return {
        success: true,
        details: result
      }
    } catch (error) {
      console.error('Error al actualizar detalles:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Subir avatar
  async uploadAvatar(userId, file) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      // Validar archivo
      if (!file) {
        throw new Error('No se seleccionó ningún archivo')
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB')
      }

      console.log('📤 Subiendo avatar para usuario:', userId)
      console.log('📄 Archivo:', file.name, file.type, (file.size / 1024).toFixed(2) + 'KB')

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar.${fileExt}`
      // El prefijo con el id permite que las políticas de Storage autoricen
      // únicamente el avatar perteneciente al usuario autenticado.
      const filePath = `${userId}/${fileName}`

      // No se debe consultar ni crear buckets desde el navegador: esas son
      // operaciones administrativas y RLS las bloquea para usuarios normales.
      // El bucket `profiles` debe crearse una sola vez desde Supabase.

      // Intentar eliminar avatar anterior
      try {
        const { data: oldAvatar } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single()

        if (oldAvatar?.avatar_url) {
          // Extraer el path de la URL
          const urlParts = oldAvatar.avatar_url.split('/')
          const oldPath = urlParts.slice(-2).join('/')
          if (oldPath && oldPath.includes('avatar_')) {
            await supabase.storage
              .from('profiles')
              .remove([oldPath])
            console.log('🗑️ Avatar anterior eliminado')
          }
        }
      } catch (e) {
        console.log('ℹ️ No se encontró avatar anterior para eliminar')
      }

      // Subir nuevo avatar
      console.log('📤 Subiendo archivo a:', filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Error al subir:', uploadError)
        throw new Error(uploadError.message || 'Error al subir archivo')
      }

      console.log('✅ Archivo subido:', uploadData)

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      console.log('🔗 URL pública:', publicUrl)

      // Actualizar perfil con nueva URL
      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error al actualizar perfil:', updateError)
        throw new Error('Error al actualizar perfil con el avatar')
      }

      console.log('✅ Perfil actualizado con nuevo avatar')

      return {
        success: true,
        avatar_url: publicUrl,
        profile: profileData
      }
    } catch (error) {
      console.error('❌ Error al subir avatar:', error)
      return {
        success: false,
        error: error.message || 'Error al subir avatar'
      }
    }
  }
}
