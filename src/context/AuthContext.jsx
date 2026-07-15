'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);

 useEffect(() => {
  const checkSession = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase no está configurado')
        setLoading(false)
        return
      }

      const result = await authService.getSession();
      console.log('📊 Resultado de sesión:', result)
      
      if (result.success && result.user) {
        // Forzar el rol si es el usuario admin
        if (result.user.email === 'jdchavezr917@gmail.com') {
          result.user.role = 'admin'
        }
        
        setUser(result.user);
        setRole(result.user.role || 'cliente');
        console.log('✅ Sesión activa:', result.user.email, 'Rol:', result.user.role)
      } else {
        console.log('ℹ️ No hay sesión activa')
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  checkSession();

    // Suscribirse a cambios de autenticación
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 Auth event:', event)
          
          if (event === 'SIGNED_IN' && session) {
            setTimeout(async () => {
              const result = await authService.getSession();
              if (result.success && result.user) {
                setUser(result.user);
                setRole(result.user.role || 'cliente');
                console.log('✅ Usuario autenticado con rol:', result.user.role)
              }
            }, 500)
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setRole(null);
            console.log('👋 Sesión cerrada')
          }
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithGoogle = async () => {
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
      
      if (data?.url) {
        window.location.href = data.url
        return { success: true }
      }
      
      return { success: false, error: 'No se obtuvo URL de redirección' }
    } catch (error) {
      console.error('Error en login con Google:', error)
      return { success: false, error: error.message }
    }
  };

  // ... resto de funciones (login, register, logout, etc.) igual que antes

  const value = {
    user,
    role,
    loading,
    error,
    login: authService.login,
    loginWithGoogle,
    register: authService.register,
    logout: authService.logout,
    updateProfile: authService.updateProfile,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isSeller: role === 'vendedor',
    isClient: role === 'cliente' || !role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};