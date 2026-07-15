'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, role } = useAuth();
  const { itemsCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getDashboardRoute = () => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'vendedor') return '/dashboard/vendedor';
    return '/dashboard/cliente';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      if (result.success) {
        // Redirigir al login después de cerrar sesión
        router.push('/login');
      } else {
        console.error('Error al cerrar sesión:', result.error);
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">APEX</span>
            <span className="text-xl font-semibold text-gray-800">Commerce</span>
          </Link>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/catalogo" className="text-gray-700 hover:text-blue-600 transition-colors">
              Catálogo
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href={getDashboardRoute()} className="text-gray-700 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                <Link href="/carrito" className="relative text-gray-700 hover:text-blue-600 transition-colors">
                  🛒 Carrito
                  {itemsCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {itemsCount}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                    <span>{user?.name || 'Usuario'}</span>
                    <span className="text-xs">▼</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block">
                    <Link href="/perfil" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                      Mi Perfil
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Iniciar Sesión</Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          {/* Menú Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Menú Mobile Expandido */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <Link href="/catalogo" className="block py-2 text-gray-700 hover:text-blue-600">
              Catálogo
            </Link>
            {isAuthenticated ? (
              <>
                <Link href={getDashboardRoute()} className="block py-2 text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/carrito" className="block py-2 text-gray-700 hover:text-blue-600">
                  🛒 Carrito {itemsCount > 0 && `(${itemsCount})`}
                </Link>
                <Link href="/perfil" className="block py-2 text-gray-700 hover:text-blue-600">
                  Mi Perfil
                </Link>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-gray-700 hover:text-blue-600">
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="block py-2 text-blue-600 font-medium">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;