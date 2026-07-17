'use client';
import { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header 
      className={`fixed top-0 w-full z-50 border-b border-white/20 backdrop-blur-[16px] transition-all duration-300 ${
        isScrolled 
          ? 'py-2 bg-surface/90 shadow-[0_8px_32px_rgba(1,15,32,0.08)]' 
          : 'py-4 bg-surface/80'
      }`}
    >
      <nav className="max-w-[1440px] mx-auto px-6 md:px-16 flex justify-between items-center h-16">
        
        {/* Logo - Montserrat */}
        <Link href="/" className="flex items-center gap-2">
          <span 
            className="font-semibold text-2xl tracking-tight text-primary" 
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Apex <span className="text-warm-accent">Commerce</span>
          </span>
        </Link>

        {/* Menú Desktop - Open Sans */}
        <div 
          className="hidden md:flex items-center gap-8" 
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          <Link 
            href="/catalogo" 
            className="text-on-surface-variant hover:text-primary font-medium transition-colors"
          >
            Catálogo
          </Link>
          
          {isAuthenticated && (
            <Link 
              href={getDashboardRoute()} 
              className="text-on-surface-variant hover:text-primary font-medium transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Iconos y Autenticación Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-5">
            
            {/* Carrito */}
            <Link href="/carrito" className="relative group p-1">
              <svg 
                className="w-6 h-6 text-primary group-hover:scale-110 transition-transform cursor-pointer" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemsCount > 0 && (
                <span 
                  className="absolute -top-1 -right-2 bg-warm-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {itemsCount}
                </span>
              )}
            </Link>

            {/* Perfil / Usuario */}
            {isAuthenticated ? (
              <div className="relative group">
                <button 
                  className="flex items-center gap-1 text-primary hover:text-warm-accent font-semibold transition-colors"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium">{user?.name || 'Usuario'}</span>
                  <span className="text-[10px]">▼</span>
                </button>
                
                {/* Dropdown flotante */}
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-[16px] rounded-[0.5rem] shadow-[0_8px_32px_rgba(1,15,32,0.08)] border border-white/20 py-2 hidden group-hover:block z-50"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  <Link href="/perfil" className="block px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container/50 hover:text-primary transition-colors">
                    Mi Perfil
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container/50 disabled:opacity-50 transition-colors"
                  >
                    {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </div>
              </div>
            ) : (
              /* Botones Desktop - Plus Jakarta Sans */
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="!border !border-primary-container !text-primary-container !bg-transparent hover:!bg-primary-container/5 rounded-[0.5rem] tracking-[0.05em] uppercase text-[12px] font-semibold transition-all px-4 py-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button 
                    size="sm"
                    className="!bg-primary-container !text-white hover:!bg-primary-container/95 rounded-[0.5rem] tracking-[0.05em] uppercase text-[12px] font-semibold transition-all px-4 py-2 shadow-sm"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Botón Menú Mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-primary hover:bg-gray-100/50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Menú Mobile Expandido */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 py-4 bg-surface/95 backdrop-blur-[16px] border-t border-white/20 space-y-3 shadow-inner">
          <Link 
            href="/catalogo" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-on-surface-variant hover:text-primary font-medium"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Catálogo
          </Link>
          
          {isAuthenticated ? (
            <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
              <Link 
                href={getDashboardRoute()} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-on-surface-variant hover:text-primary font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/carrito" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 text-on-surface-variant hover:text-primary font-medium"
              >
                <span>🛒 Carrito</span>
                {itemsCount > 0 && (
                  <span 
                    className="bg-warm-accent text-white text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {itemsCount}
                  </span>
                )}
              </Link>
              <Link 
                onClick={() => setIsMobileMenuOpen(false)}
                href="/perfil" 
                className="block py-2 text-on-surface-variant hover:text-primary font-medium"
              >
                Mi Perfil
              </Link>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }} 
                disabled={isLoggingOut}
                className="block w-full text-left py-2 text-error font-medium disabled:opacity-50"
              >
                {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
              </button>
            </div>
          ) : (
            /* Botones Mobile - Plus Jakarta Sans */
            <div className="pt-2 border-t border-white/20 flex flex-col gap-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full !border !border-primary-container !text-primary-container !bg-transparent rounded-[0.5rem] tracking-[0.05em] uppercase text-[12px] font-semibold py-2.5 transition-all hover:!bg-primary-container/5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/registro" onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  size="sm" 
                  className="w-full !bg-primary-container !text-white rounded-[0.5rem] tracking-[0.05em] uppercase text-[12px] font-semibold py-2.5 transition-all hover:!bg-primary-container/95 shadow-sm"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;