'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { productService } from '@/services/productService'; // Importamos tu servicio real
import { ChevronDown, User, LogOut, Settings, Heart, Search, Loader2 } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, role } = useAuth();
  const { itemsCount } = useCart();
  const { wishlist } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Estados para búsqueda y autocompletado/recomendaciones
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const profileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manejar clics fuera para cerrar menús desplegables y sugerencias de búsqueda
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Efecto para buscar recomendaciones usando directamente tu productService
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        // Usamos directamente tu servicio conectado a Supabase con límite de 5 sugerencias
        const result = await productService.getPublicProducts({
          search: searchQuery.trim(),
          limit: 5
        });

        if (result.success) {
          setSuggestions(result.products || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error al obtener recomendaciones de productos:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300); // Debounce de 300ms para no saturar peticiones

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getDashboardRoute = () => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'vendedor') return '/dashboard/vendedor';
    return '/';
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
      setShowSuggestions(false);
      router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectSuggestion = (productName) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    router.push(`/catalogo?search=${encodeURIComponent(productName)}`);
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Usuario';
    return fullName.trim().split(' ')[0];
  };

  return (
    <header className={`fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-2xl transition-all duration-300 ${isScrolled ? 'py-2.5 bg-[#010f20]/95 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'py-4 bg-[#010f20]/80'}`}>
      <nav className="max-w-[1440px] mx-auto px-4 md:px-16 flex justify-between items-center h-16 gap-3 md:gap-8">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-white/20 group-hover:bg-white transition-all">
            <img src="/logo.png" alt="Apex Commerce Logo" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
          </div>
          <span className="hidden md:inline font-semibold text-2xl tracking-tight text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Apex <span className="text-[#e0a96d]">Commerce</span>
          </span>
        </Link>

{/* BUSCADOR CON RECOMENDACIONES / AUTOCOMPLETADO */}
        <div className="flex-1 max-w-xl relative" ref={searchContainerRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!showSuggestions) setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder="Buscar productos..."
              className="w-full pl-4 md:pl-5 pr-10 md:pr-12 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/15 bg-white/10 text-white placeholder-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#e0a96d] text-xs transition-all shadow-inner"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            <button type="submit" className="absolute right-3.5 top-2.5 md:top-3 text-white/60 hover:text-[#e0a96d] transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Menú desplegable de sugerencias de productos con scroll integrado */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#010f20]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-4 text-white/60 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#e0a96d]" /> Buscando productos...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">Productos sugeridos</p>
                  
                  {/* Contenedor con altura máxima y scroll vertical */}
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(product.name)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        {product.image_url || product.image ? (
                          <img 
                            src={product.image_url || product.image} 
                            alt={product.name} 
                            className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-xs shrink-0">
                            <Search className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-[#e0a96d] font-bold">
                            ${product.price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full text-center py-2.5 bg-white/5 hover:bg-white/10 text-xs text-[#e0a96d] font-bold border-t border-white/10 transition-colors block cursor-pointer"
                  >
                    Ver todos los resultados para &quot;{searchQuery}&quot;
                  </button>
                </div>
              ) : (
                <div className="py-4 px-4 text-center text-white/60 text-xs">
                  No se encontraron productos con ese nombre.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Link href="/catalogo" className="text-white/80 hover:text-[#e0a96d] text-xs font-bold uppercase tracking-wider transition-colors">Catálogo</Link>
          {isAuthenticated && (
            <Link href={getDashboardRoute()} className="text-white/80 hover:text-[#e0a96d] text-xs font-bold uppercase tracking-wider transition-colors">Dashboard</Link>
          )}
        </div>

        {/* Iconos y Acciones */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Favoritos */}
          <Link href="/favorito" className="hidden md:flex relative group p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all shadow-sm">
            <Heart className="w-5 h-5 text-white" strokeWidth={2} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Carrito */}
          <Link href="/carrito" className="hidden md:flex relative group p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#e0a96d] text-[#010f20] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {itemsCount}
              </span>
            )}
          </Link>

          {/* Perfil Desktop */}
          {isAuthenticated ? (
            <div className="hidden md:block relative" ref={profileMenuRef}>
              <button 
                type="button"
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
                    href="/configuraciones" 
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#e0a96d]" /> Configuraciones
                  </Link>

                  <div className="border-t border-white/10 my-1"></div>

                  <button 
                    type="button"
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
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <button type="button" className="px-5 py-2.5 bg-gradient-to-r from-[#e0a96d] to-[#c58b4e] text-[#010f20] rounded-xl text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg cursor-pointer">
                  Ingresar
                </button>
              </Link>
            </div>
          )}

          {/* Botón Hamburguesa Mobile */}
          <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-white bg-white/10 rounded-xl border border-white/10 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </nav>

      {/* Menú Desplegable Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#010f20]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl">
          <div className="flex flex-col space-y-3 font-semibold text-xs text-white/80">
            <Link href="/catalogo" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Catálogo</Link>
            {isAuthenticated && (
              <>
                <Link href={getDashboardRoute()} onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Dashboard</Link>
                <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Mi Perfil</Link>
                <Link href="/configuraciones" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d]">Configuraciones</Link>
              </>
            )}

            <Link href="/favorito" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d] flex items-center justify-between">
              <span>Favoritos</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{wishlist.length}</span>
              )}
            </Link>
            <Link href="/carrito" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-[#e0a96d] flex items-center justify-between">
              <span>Carrito</span>
              {itemsCount > 0 && (
                <span className="bg-[#e0a96d] text-[#010f20] px-2 py-0.5 rounded-full text-[10px] font-black">{itemsCount}</span>
              )}
            </Link>

            {/* Acciones de Autenticación para Móvil */}
            <div className="pt-3 border-t border-white/15 mt-2">
              {isAuthenticated ? (
                <button 
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
                  disabled={isLoggingOut}
                  className="w-full py-3 text-center bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl font-bold uppercase tracking-wider hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                </button>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <button type="button" className="w-full py-3 bg-gradient-to-r from-[#e0a96d] to-[#c58b4e] text-[#010f20] rounded-xl text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg cursor-pointer">
                    Ingresar
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;