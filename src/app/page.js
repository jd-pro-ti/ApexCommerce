'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Star,
  Layers
} from 'lucide-react';
import ChatBot from '../components/chatbot/ChatBot';

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

const categorySpecificImages = {
  alimentos: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop',
  comida: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
  
  belleza: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop',
  maquillaje: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&auto=format&fit=crop',
  
  deportes: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=400&auto=format&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
  
  electronicos: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=400&auto=format&fit=crop',
  electrónicos: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?q=80&w=400&auto=format&fit=crop',
  tecnologia: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
  tecnología: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
  
  hogar: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=400&auto=format&fit=crop',
  muebles: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop',
  
  juguetes: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=400&auto=format&fit=crop',
};

const defaultCategoryFallback = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=400&auto=format&fit=crop';

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [error, setError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);
  const totalSlides = heroSlides.length;
  const { addToCart } = useCart();

  // Referencia para el carrusel de tendencias
  const scrollContainerRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(timer);
  }, [totalSlides]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError('');
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          productService.getPublicProducts({ sortBy: 'recent' }),
          productService.getCategoriesWithCount()
        ]);

        if (productsResult.success) {
          const allProducts = productsResult.products || [];
          setProducts(allProducts);
          setFeaturedProducts(allProducts.slice(0, 10));
        } else {
          setError(productsResult.error || 'Error al cargar productos del servidor');
        }

        if (categoriesResult.success) {
          const rawCategories = categoriesResult.categories || [];
          
          const processedCategories = rawCategories.slice(0, 6).map((cat) => {
            const catNameLower = (cat.name || '').toLowerCase();
            
            let matchedImage = defaultCategoryFallback;
            for (const [keyword, imgUrl] of Object.entries(categorySpecificImages)) {
              if (catNameLower.includes(keyword)) {
                matchedImage = imgUrl;
                break;
              }
            }

            return {
              ...cat,
              image: matchedImage
            };
          });

          setCategories(processedCategories);
        }
      } catch (err) {
        console.error('❌ Error en Home:', err);
        setError('No se pudieron recuperar los datos de la tienda.');
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleCategoryClick = (categoryName) => {
    router.push(`/catalogo?categoria=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f1f3f6]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f6] text-[#010f20] min-h-screen transition-colors duration-300 pt-20 font-sans overflow-x-hidden">

      {/* ================= HERO SECTION ================= */}
      <section className="w-full bg-[#f8f7fa] pt-0 pb-6 px-3 sm:px-5 flex justify-center overflow-hidden">
        <div className="w-full max-w-[1780px] bg-white rounded-b-[32px] sm:rounded-[32px] shadow-[0_25px_70px_rgba(1,15,32,0.04)] border-x border-b sm:border border-gray-100 px-6 sm:px-12 py-8 sm:py-12 relative overflow-hidden">
          <div className="absolute right-[-5%] bottom-[-25%] w-[850px] h-[850px] bg-gradient-to-tr from-[#ff3366]/20 via-[#dd9448]/15 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            <div className="lg:col-span-12 xl:col-span-6 flex flex-col justify-center text-center xl:text-left items-center xl:items-start">
              <div className="inline-block bg-[#010f20] text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest px-3 sm:px-4 py-2 rounded-xl w-max mb-4 shadow-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                ¡ENVÍO GRATIS EN TU PRIMERA COMPRA HOY!
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-[#010f20] tracking-tight leading-[1.1] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Renueva tu Estilo con las Mejores Tendencias de Temporada
              </h1>

              <p className="text-sm sm:text-lg text-gray-500 font-medium leading-relaxed mb-6 max-w-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Descubre colecciones exclusivas diseñadas para destacar. Aprovecha descuentos únicos por tiempo limitado, pagos seguros y recibe tus productos favoritos en la puerta de tu casa.
              </p>

              <div className="mb-6">
                <a
                  href="/catalogo"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#010f20] text-white text-sm font-bold uppercase tracking-wider rounded-2xl shadow-[0_15px_30px_rgba(1,15,32,0.2)] hover:bg-[#ff3366] transition-all duration-300 transform hover:-translate-y-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <span>Ver Catálogo</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </a>
              </div>

              <div className="flex flex-col items-center xl:items-start gap-2">
                <div className="flex items-center gap-1 text-amber-400 text-base">★★★★★</div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <strong className="text-[#010f20]">1,240 pedidos</strong> entregados con éxito y un <strong className="text-[#010f20]">94.8%</strong> de clientes totalmente satisfechos
                </p>
              </div>
            </div>

            <div className="hidden xl:block xl:col-span-6 relative h-[620px] flex items-center justify-end">
              <div className="relative w-full max-w-[680px] h-full">
                <div className="absolute top-2 right-92 w-18 h-18 bg-[#ff3366] rounded-[26px] shadow-[0_25px_50px_rgba(255,51,102,0.4)] flex items-center justify-center text-white z-30 transform -rotate-12">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <div className="absolute top-[-4px] right-56 w-18 h-18 bg-[#010f20] rounded-[26px] shadow-[0_25px_50px_rgba(1,15,32,0.3)] flex items-center justify-center text-[#ff3366] z-30 transform rotate-12">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div className="absolute top-16 right-44 w-[490px] bg-white/95 backdrop-blur-md rounded-[36px] p-6 shadow-[0_40px_90px_rgba(1,15,32,0.16)] border border-gray-100 z-20 transform -rotate-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="bg-[#010f20] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5">Ropa</span>
                    <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-4 py-2 rounded-full">Calzado</span>
                  </div>
                  <h4 className="text-sm font-black text-[#010f20] mb-4 tracking-wide flex items-center justify-between border-b border-gray-100 pb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span>¡GRAN VENTA 25% DE DESCUENTO!</span>
                    <span className="w-2 h-4 bg-[#ff3366] rounded-full inline-block animate-pulse"></span>
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-rose-50/80 border border-rose-100 rounded-2xl h-20 flex items-center justify-center text-[#ff3366] font-bold text-xl shadow-sm">+</div>
                  </div>
                </div>

                <div className="absolute top-[265px] right-44 w-[490px] bg-white/95 backdrop-blur-md rounded-[32px] p-5 shadow-[0_35px_70px_rgba(1,15,32,0.12)] border border-gray-100 z-25 transform -rotate-3">
                  <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3.5">COLORES DISPONIBLES</p>
                  <div className="flex items-center justify-between px-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white shadow-md"></div>
                    <div className="w-7 h-7 rounded-full bg-[#ff3366] border-2 border-white shadow-md ring-2 ring-[#ff3366]/40"></div>
                    <div className="w-7 h-7 rounded-full bg-teal-400 border-2 border-white shadow-md"></div>
                    <div className="w-7 h-7 rounded-full bg-cyan-400 border-2 border-white shadow-md"></div>
                    <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-md"></div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white shadow-md"></div>
                  </div>
                </div>

                <div className="absolute top-[415px] right-44 w-[490px] bg-white/95 backdrop-blur-md rounded-[32px] p-5 shadow-[0_40px_80px_rgba(1,15,32,0.15)] border border-gray-100 z-28 transform -rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">TU BOLSA DE COMPRAS</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#010f20]">
                    <span className="truncate pr-2 font-semibold">Tenis casuales de algodón...</span>
                    <span className="text-[#010f20] font-black text-base">$257</span>
                  </div>
                </div>

                <div className="absolute top-6 right-4 w-[390px] bg-white rounded-[40px] p-6 shadow-[0_45px_100px_rgba(1,15,32,0.25)] border border-gray-100 z-40 transform rotate-6">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-2xl overflow-hidden mb-4 border border-gray-100 relative flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=400&auto=format&fit=crop" alt="Triple S Balenciaga" className="w-full h-full object-cover" />
                  </div>
                  <h5 className="text-sm font-black text-[#010f20] truncate mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Tenis Triple S Edición Especial</h5>
                  <p className="text-[11px] font-extrabold text-[#ff3366] uppercase tracking-wider mb-3">BALENCIAGA</p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 text-xs font-bold text-gray-500">
                    <span>Cantidad: <span className="bg-gray-100 px-3 py-1.5 rounded-xl text-[#010f20] font-bold">- 2 +</span></span>
                    <span className="text-[#010f20] text-lg font-black">$757</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXPLORAR CATEGORÍAS ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Explorar por Categorías
          </h2>
          <p className="text-xs text-[#44474c] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Encuentra colecciones curadas para cada espacio de tu vida.
          </p>
        </div>

        {categoriesLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-[#efedef]">
            <p className="text-xs text-[#44474c]">No se encontraron categorías activas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategoryClick(cat.name)}
                className="flex flex-col items-center group cursor-pointer bg-white p-3 sm:p-4 rounded-2xl border border-[#efedef] shadow-sm hover:shadow-md transition-all text-left w-full"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-2 sm:mb-3 border-2 border-[#efedef] group-hover:border-[#e0a96d] transition-colors bg-slate-100 flex items-center justify-center">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-[#010f20] text-center group-hover:text-[#e0a96d] transition-colors capitalize truncate w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {cat.count} {cat.count === 1 ? 'producto' : 'productos'}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      
      {/* ================= TENDENCIAS ACTUALES (CARRUSEL TÁCTIL / CLICKS) ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#010f20] flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <Sparkles className="w-5 h-5 text-[#e0a96d]" /> Tendencias Esta Semana
            </h2>
            <p className="text-xs text-[#44474c] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Los artículos más solicitados por nuestra comunidad de compradores élite.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#010f20] hover:bg-[#010f20] hover:text-white transition-all shadow-sm active:scale-95"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#010f20] hover:bg-[#010f20] hover:text-white transition-all shadow-sm active:scale-95"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <Link
              href="/catalogo"
              className="hidden sm:flex text-xs font-bold text-[#010f20] hover:text-[#e0a96d] items-center gap-1 transition-colors ml-4 shrink-0"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ver Todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
          /* Contenedor deslizante con anchos responsivos: w-[calc(50%-6px)] en móvil para forzar 2 por vista, y w-[280px] o más en desktop */
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="w-[calc(50%-6px)] sm:w-[280px] md:w-[300px] flex-shrink-0 snap-start flex"
              >
                <div className="w-full flex flex-col [&>div]:h-full [&>div]:flex [&>div]:flex-col">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= BANNERS SECUNDARIOS ================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-[#010f20] to-[#12243d] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
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

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#efedef] relative overflow-hidden flex flex-col justify-between shadow-sm">
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

      {/* ================= BENEFICIOS ================= */}
      <section className="bg-white border-t border-[#efedef] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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