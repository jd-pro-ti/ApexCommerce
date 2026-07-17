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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
      if (result.success) router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className={`fixed top-0 w-full z-50 border-b border-white/20 backdrop-blur-[16px] transition-all duration-300 ${isScrolled ? 'py-2 bg-surface/90 shadow-[0_8px_32px_rgba(1,15,32,0.08)]' : 'py-4 bg-surface/80'}`}>
      <nav className="max-w-[1440px] mx-auto px-6 md:px-16 flex justify-between items-center h-16 gap-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="Apex Commerce Logo" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-2xl tracking-tight text-primary" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Apex <span className="text-warm-accent">Commerce</span>
          </span>
        </Link>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos, marcas y más..."
            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-warm-accent text-sm transition-all"
          />
          <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          <Link href="/catalogo" className="text-on-surface-variant hover:text-primary font-medium transition-colors">Catálogo</Link>
          {isAuthenticated && (
            <Link href={getDashboardRoute()} className="text-on-surface-variant hover:text-primary font-medium transition-colors">Dashboard</Link>
          )}
        </div>

        {/* Iconos y Acciones */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/carrito" className="relative group p-1">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-warm-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{itemsCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative group">
              <button className="flex items-center gap-1 text-primary hover:text-warm-accent font-semibold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm">{user?.name || 'Usuario'}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-[16px] rounded-[0.5rem] shadow-lg border py-2 hidden group-hover:block">
                <Link href="/perfil" className="block px-4 py-2.5 text-sm hover:bg-gray-100">Mi Perfil</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-error hover:bg-gray-100">Cerrar Sesión</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login"><Button variant="outline" size="sm">Ingresar</Button></Link>
            </div>
          )}
        </div>

        {/* Botón Mobile */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;