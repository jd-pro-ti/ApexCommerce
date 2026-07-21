'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ChevronDown, User, LogOut, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, role } = useAuth();
  const { itemsCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const getFirstName = (fullName) => {
    if (!fullName) return 'Usuario';
    return fullName.trim().split(' ')[0];
  };

  return (
    <header className={`fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-2xl transition-all duration-300 ${isScrolled ? 'py-2.5 bg-[#010f20]/95 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'py-4 bg-[#010f20]/80'}`}>
      <nav className="max-w-[1440px] mx-auto px-6 md:px-16 flex justify-between items-center h-16 gap-8">
        
        {/* Logo con "Commerce" en color naranjita sólido */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-white/20 group-hover:bg-white transition-all">
            <img src="/logo.png" alt="Apex Commerce Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-semibold text-2xl tracking-tight text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Apex <span className="text-[#e0a96d]">Commerce</span>
          </span>
        </Link>

        {/* Buscador Estilizado */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos, marcas y más..."
            className="w-full pl-5 pr-12 py-2.5 rounded-2xl border border-white/15 bg-white/10 text-white placeholder-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#e0a96d] text-xs transition-all shadow-inner"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button type="submit" className="absolute right-4 top-3 text-white/60 hover:text-[#e0a96d] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Link href="/catalogo" className="text-white/80 hover:text-[#e0a96d] text-xs font-bold uppercase tracking-wider transition-colors">Catálogo</Link>
          {isAuthenticated && (
            <Link href={getDashboardRoute()} className="text-white/80 hover:text-[#e0a96d] text-xs font-bold uppercase tracking-wider transition-colors">Dashboard</Link>
          )}
        </div>

        {/* Iconos y Acciones */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/carrito" className="relative group p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#e0a96d] text-[#010f20] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">{itemsCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 text-white hover:text-[#e0a96d] font-bold bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                {user?.avatar || user?.image || user?.photoURL ? (
                  <img 
                    src={user.avatar || user.image || user.photoURL} 
                    alt={user?.name || 'Avatar'} 
                    className="w-6 h-6 rounded-full object-cover border border-white/20" 
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#e0a96d]/20 text-[#e0a96d] flex items-center justify-center text-xs font-bold border border-[#e0a96d]/30">
                    {getFirstName(user?.name).charAt(0)}
                  </div>
                )}
                <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {getFirstName(user?.name)}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180 text-[#e0a96d]' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#010f20]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-white/10 mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Conectado como</p>
                    <p className="text-xs font-bold text-white truncate">{user?.email || user?.name}</p>
                  </div>
                  
                  <Link 
                    href="/perfil" 
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-[#e0a96d]" /> Mi Perfil
                  </Link>
                  
                  <Link 
                    href={getDashboardRoute()} 
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#e0a96d]" /> Dashboard
                  </Link>

                  <div className="border-t border-white/10 my-1"></div>

                  <button 
                    onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} 
                    disabled={isLoggingOut}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-white/10 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <button className="px-5 py-2.5 bg-gradient-to-r from-[#e0a96d] to-[#c58b4e] text-[#010f20] rounded-xl text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg cursor-pointer">
                  Ingresar
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Botón Mobile */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-white bg-white/10 rounded-xl border border-white/10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </nav>

      {/* Menú Desplegable Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#010f20]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-white/15 bg-white/10 text-white placeholder-white/50 text-xs"
            />
            <button type="submit" className="absolute right-3 top-3 text-white/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>
          <div className="flex flex-col space-y-3 font-semibold text-xs text-white/80">
            <Link href="/catalogo" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Catálogo</Link>
            {isAuthenticated && (
              <>
                <Link href={getDashboardRoute()} onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Dashboard</Link>
                <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Mi Perfil</Link>
              </>
            )}
            <Link href="/carrito" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d] flex items-center justify-between">
              <span>Carrito</span>
              <span className="bg-[#e0a96d] text-[#010f20] px-2 py-0.5 rounded-full text-[10px] font-black">{itemsCount}</span>
            </Link>
            {isAuthenticated && (
              <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="py-2 text-left text-rose-400 hover:text-rose-300">
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;