'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ui/ProductCard';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Laptop,
  Armchair,
  Compass,
  Watch,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Gift,
  Tag,
  Flame,
  Percent,
  Zap,
  Star
} from 'lucide-react';

// Datos para los slides del Carrusel Hero con paleta armónica de alta gama
const heroSlides = [
  {
    id: 1,
    tag: 'Nueva Colección 2026',
    title1: 'Eleva Tu Estilo',
    title2: 'Profesional Hoy',
    description: 'Descubre nuestra selección exclusiva de artículos de diseño arquitectónico y confort superior para transformar tu entorno cotidiano.',
    ctaText: 'Explorar Catálogo',
    ctaLink: '/catalogo',
    bgColor: 'from-[#0b1329] via-[#101b38] to-[#1a2942]',
    accentColor: '#e0a96d',
    image: '/images/hero-item.png',
    imageAlt: 'Apex Tech Chair'
  },
  {
    id: 2,
    tag: 'Tecnología Premium',
    title1: 'Precisión',
    title2: 'En Cada Tarea',
    description: 'Equipa tu espacio de trabajo con lo último en tecnología de alto rendimiento y diseño minimalista para una máxima productividad.',
    ctaText: 'Ver Tecnología',
    ctaLink: '/catalogo?categoria=tech',
    bgColor: 'from-[#0f172a] via-[#1e293b] to-[#0f2137]',
    accentColor: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop',
    imageAlt: 'Laptop Setup'
  },
  {
    id: 3,
    tag: 'Estilo de Vida Élite',
    title1: 'Confort',
    title2: 'Que Inspira',
    description: 'Transforma tu hogar u oficina en un santuario de bienestar con piezas de diseño atemporal cuidadosamente seleccionadas.',
    ctaText: 'Descubrir Hogar',
    ctaLink: '/catalogo?categoria=living',
    bgColor: 'from-[#1c140d] via-[#2d2218] to-[#3a2c1f]',
    accentColor: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop',
    imageAlt: 'Modern Living Room'
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [error, setError] = useState('');

  // Estados para el carrusel y menú desplegable
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);
  const totalSlides = heroSlides.length;
  const { addToCart } = useCart();

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cambio automático de slide cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(timer);
  }, [totalSlides]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  const goToSlide = (index) => setCurrentSlide(index);

  // Carga de productos
  useEffect(() => {
    const fetchHomeProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await productService.getPublicProducts({ sortBy: 'recent' });
        if (result.success) {
          const allProducts = result.products || [];
          setProducts(allProducts);
          setFeaturedProducts(allProducts.slice(0, 6));
        } else {
          setError(result.error || 'Error al cargar productos del servidor');
        }
      } catch (err) {
        console.error('❌ Error en Home:', err);
        setError('No se pudieron recuperar los productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchHomeProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f1f3f6]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f6] text-[#010f20] min-h-screen transition-colors duration-300 pt-28 font-sans overflow-x-hidden">

      {/* ================= HERO SECTION ESTILO UMINEX CON MENÚ DE CATEGORÍAS ================= */}
      <section className="w-full mb-12 relative">
        <div className="w-full px-2 sm:px-4 lg:px-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

            {/* ================= 1. BANNER PRINCIPAL / CARRUSEL (8 COLUMNAS) ================= */}
            <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-[#8b2317] via-[#a33324] to-[#c44533] min-h-[460px] sm:min-h-[500px] flex items-center">

              {/* Elementos decorativos de fondo */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-black/10 blur-3xl rounded-full pointer-events-none"></div>

              {/* BOTÓN DESPLEGABLE DE CATEGORÍAS (Menú flotante superior izquierdo dentro del banner) */}
              <div className="absolute top-6 left-6 z-30" ref={categoryRef}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="bg-[#010f20]/90 hover:bg-[#010f20] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 backdrop-blur-md border border-white/20 transition-all cursor-pointer group"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <Menu className="w-4 h-4 text-[#e0a96d] group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-[11px] font-extrabold tracking-wider uppercase">Explorar Categorías</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Menú Desplegable */}
                {isCategoryOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <nav className="space-y-1">
                      {[
                        { name: 'Tecnología de Trabajo', icon: Laptop, query: 'tech' },
                        { name: 'Hogar Moderno', icon: Armchair, query: 'living' },
                        { name: 'Estilo de Vida Élite', icon: Compass, query: 'lifestyle' },
                        { name: 'Accesorios y Moda', icon: Watch, query: 'moda' },
                        { name: 'Papelería Premium', icon: BookOpen, query: 'papeleria' },
                        { name: 'Ofertas Especiales', icon: Tag, query: 'ofertas' },
                      ].map((cat, idx) => {
                        const IconComponent = cat.icon;
                        return (
                          <Link
                            key={idx}
                            href={`/catalogo?categoria=${cat.query}`}
                            onClick={() => setIsCategoryOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition-colors group"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <div className="flex items-center gap-2.5">
                              <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-[#8b2317] transition-colors" />
                              <span>{cat.name}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all text-[#8b2317]" />
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </div>

              {/* Contenedor deslizante */}
              <div className="absolute inset-0 w-full h-full flex transition-transform duration-700 ease-in-out pt-16 sm:pt-0" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {heroSlides.map((slide) => (
                  <div key={slide.id} className="w-full h-full flex-shrink-0 px-8 sm:px-14 py-12 flex flex-col sm:flex-row items-center justify-between gap-8 relative">

                    {/* Textos Izquierda */}
                    <div className="relative z-10 w-full sm:w-[52%] flex flex-col justify-center mt-6 sm:mt-0">
                      <span className="text-[11px] uppercase tracking-widest font-black text-amber-200 mb-2 drop-shadow-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {slide.tag || "NUEVA COLECCIÓN 2026"}
                      </span>

                      <h2
                        className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] mb-3 drop-shadow-md"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {slide.title1} <br />
                        <span className="text-amber-100">{slide.title2}</span>
                      </h2>

                      <p
                        className="text-xs sm:text-sm text-white/90 mb-6 font-medium leading-relaxed"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {slide.description}
                      </p>

                      <Link
                        href={slide.ctaLink}
                        className="px-7 py-3.5 bg-white text-[#8b2317] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-100 transition-all shadow-xl flex items-center gap-2 w-max cursor-pointer transform hover:-translate-y-0.5"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {slide.ctaText} <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Imagen central flotante derecha */}
                    <div className="relative z-10 w-full sm:w-[48%] flex justify-center items-center">
                      <div className="relative w-full max-w-[320px] h-[220px] sm:h-[300px] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl"></div>
                        <img
                          src={slide.image}
                          alt={slide.imageAlt}
                          className="relative z-10 w-full h-full object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.4)] transform hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop'; }}
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Controles de paginación del banner principal */}
              <div className="absolute bottom-4 left-8 z-20 flex items-center gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${currentSlide === index ? 'bg-white w-6' : 'bg-white/40 hover:bg-white w-2'
                      }`}
                    aria-label={`Ir a slide ${index + 1}`}
                  />
                ))}
              </div>

            </div>

            {/* ================= 2. BLOQUES LATERALES DE OFERTAS (4 COLUMNAS) ================= */}
            <div className="lg:col-span-4 flex flex-col gap-4 justify-between">

              {/* Tarjeta Superior Derecha: Top Offer */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-indigo-950 p-6 border border-white/15 shadow-2xl flex items-center justify-between group flex-1">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 max-w-[170px]">
                  <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 block mb-1">Top Offer</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug mb-1">iPad Pro 128GB</h3>
                  <p className="text-[11px] text-purple-200/80 mb-3 font-medium">Discount 20% On Product</p>
                  <Link href="/catalogo?filter=ipad" className="text-[11px] font-bold text-white flex items-center gap-1 hover:underline bg-white/10 px-3 py-1.5 rounded-lg w-max backdrop-blur-sm">
                    Comprar <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex-shrink-0 bg-black/40">
                  <img
                    src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400&auto=format&fit=crop"
                    alt="Top Offer iPad"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Tarjeta Inferior Derecha: Gamepad / Edición Especial */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950 via-rose-900 to-rose-950 p-6 border border-white/15 shadow-2xl flex items-center justify-between group flex-1">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-500/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 max-w-[170px]">
                  <span className="text-[10px] uppercase font-black tracking-widest text-rose-300 block mb-1">Gamepad Edition</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug mb-1">Sport Edition XPS</h3>
                  <p className="text-[11px] text-rose-200/80 mb-3 font-medium">Best Choice Of The Year</p>
                  <Link href="/catalogo?filter=gamepad" className="text-[11px] font-bold text-white flex items-center gap-1 hover:underline bg-white/10 px-3 py-1.5 rounded-lg w-max backdrop-blur-sm">
                    Ver más <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex-shrink-0 bg-black/40">
                  <img
                    src="https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?q=80&w=400&auto=format&fit=crop"
                    alt="Gamepad Edition"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================= EXPLORAR CATEGORÍAS (Círculos) ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Explorar por Categorías
          </h2>
          <p className="text-xs text-[#44474c] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Encuentra colecciones curadas para cada espacio de tu vida.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { name: 'Moda', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop', query: 'moda' },
            { name: 'Belleza', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&auto=format&fit=crop', query: 'belleza' },
            { name: 'Tech', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop', query: 'tech' },
            { name: 'Hogar', img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=200&auto=format&fit=crop', query: 'living' },
            { name: 'Deportes', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=200&auto=format&fit=crop', query: 'deportes' },
            { name: 'Juegos', img: 'https://images.unsplash.com/photo-1612287233002-91d0f5326c33?q=80&w=200&auto=format&fit=crop', query: 'juegos' },
            { name: 'Autos', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop', query: 'auto' },
            { name: 'Papelería', img: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=200&auto=format&fit=crop', query: 'papeleria' },
          ].map((cat, idx) => (
            <Link
              key={idx}
              href={`/catalogo?categoria=${cat.query}`}
              className="flex flex-col items-center group cursor-pointer bg-white p-4 rounded-2xl border border-[#efedef] shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 border-2 border-[#efedef] group-hover:border-[#e0a96d] transition-colors">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-xs font-bold text-[#010f20] text-center group-hover:text-[#e0a96d] transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= TENDENCIAS ACTUALES ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#010f20] flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <Sparkles className="w-5 h-5 text-[#e0a96d]" /> Tendencias Esta Semana
            </h2>
            <p className="text-xs text-[#44474c] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Los artículos más solicitados por nuestra comunidad de compradores élite.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="text-xs font-bold text-[#010f20] hover:text-[#e0a96d] flex items-center gap-1 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ver Todo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        {featuredProducts.length === 0 && !error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#efedef]">
            <p className="text-xs text-[#44474c]">No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ================= BANNERS SECUNDARIOS (PUBLICIDAD) ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-gradient-to-r from-[#010f20] to-[#12243d] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="absolute right-0 top-0 w-48 h-48 bg-[#e0a96d]/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#e0a96d] mb-1 block">Venta de Verano</span>
              <h3 className="text-xl sm:text-2xl font-extrabold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Hasta 50% de Descuento
              </h3>
              <p className="text-xs text-white/70 max-w-xs mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Aprovecha las rebajas especiales en nuestra línea más exclusiva de temporada.
              </p>
              <Link
                href="/catalogo"
                className="inline-block px-5 py-2.5 bg-white text-[#010f20] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#f1f3f6] transition-colors shadow-md"
              >
                Comprar Ofertas
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-[#efedef] relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#e0a96d] mb-1 block">Nuevos Lanzamientos</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#010f20] mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Diseños Que Te Encantarán
              </h3>
              <p className="text-xs text-[#44474c] max-w-xs mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Renueva tus espacios personales con la más alta calidad y acabados de primera.
              </p>
              <Link
                href="/catalogo"
                className="inline-block px-5 py-2.5 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#010f20]/90 transition-colors shadow-md"
              >
                Explorar Novedades
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ================= BENEFICIOS / FOOTER BAR ================= */}
      <section className="bg-white border-t border-[#efedef] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f1f3f6]/50">
              <div className="w-10 h-10 rounded-xl bg-[#010f20] text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#e0a96d]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Envío Gratis</h4>
                <p className="text-[11px] text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>En compras mayores a $160</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f1f3f6]/50">
              <div className="w-10 h-10 rounded-xl bg-[#010f20] text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-[#e0a96d]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Devoluciones Fáciles</h4>
                <p className="text-[11px] text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Garantía dentro de 30 días</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f1f3f6]/50">
              <div className="w-10 h-10 rounded-xl bg-[#010f20] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#e0a96d]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Pagos Seguros</h4>
                <p className="text-[11px] text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Protección 100% garantizada</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f1f3f6]/50">
              <div className="w-10 h-10 rounded-xl bg-[#010f20] text-white flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-[#e0a96d]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Soporte 24/7</h4>
                <p className="text-[11px] text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Atención personalizada</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}