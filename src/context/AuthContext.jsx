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
            }, 1000)
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

  // Función de login
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
        setRole(result.user.role || 'cliente');
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función de registro
  const register = async (email, password, userData) => {
    try {
      const result = await authService.register(email, password, userData);
      if (result.success) {
        setUser(result.user);
        setRole(result.user.role || 'cliente');
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función de login con Google
  const loginWithGoogle = async () => {
    try {
      const result = await authService.loginWithGoogle();
      if (result.success) {
        window.location.href = result.url;
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      const result = await authService.logout();
      if (result.success) {
        setUser(null);
        setRole(null);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función de actualizar perfil
  const updateProfile = async (updates) => {
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }
    try {
      const result = await authService.updateProfile(user.id, updates);
      if (result.success) {
        setUser({ ...user, ...result.profile });
        setRole(result.profile.role || role);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    role,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
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