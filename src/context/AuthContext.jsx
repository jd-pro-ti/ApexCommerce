'use client';
import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Verificar sesión al cargar
    const checkSession = async () => {
      try {
        // Simular verificación de sesión
        const savedUser = localStorage.getItem('apex_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      // Simular login
      const mockUser = {
        id: '1',
        email,
        name: 'Usuario Prueba',
        role: 'cliente',
      };
      
      localStorage.setItem('apex_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setRole(mockUser.role);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_user');
    setUser(null);
    setRole(null);
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isSeller: role === 'vendedor',
    isClient: role === 'cliente',
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