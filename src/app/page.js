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
import ChatBot from '../components/chatbot/ChatBot';

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

  // Estados para el carrusel y menú desplegabl
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
    <div className="bg-[#f1f3f6] text-[#010f20] min-h-screen transition-colors duration-300 pt-20 font-sans overflow-x-hidden">

{/* ================= HERO SECTION (PEGADA A NAVBAR, SIN ESPACIADO SUPERIOR) ================= */}
      <section className="w-full bg-[#f8f7fa] pt-0 pb-6 px-3 sm:px-5 flex justify-center overflow-hidden">
        
        {/* Contenedor principal expandido a ancho completo */}
        <div className="w-full max-w-[1780px] bg-white rounded-b-[32px] sm:rounded-[32px] shadow-[0_25px_70px_rgba(1,15,32,0.04)] border-x border-b sm:border border-gray-100 px-6 sm:px-12 py-8 sm:py-12 relative overflow-hidden">
          
          {/* Degradado rosado/cálido de fondo */}
          <div className="absolute right-[-5%] bottom-[-25%] w-[850px] h-[850px] bg-gradient-to-tr from-[#ff3366]/20 via-[#dd9448]/15 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* ================= COLUMNA IZQUIERDA (TEXTO DE ALTA CONVERSIÓN Y LLAMADO A LA ACCIÓN) ================= */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              
              {/* Badge superior */}
              <div className="inline-block bg-[#010f20] text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl w-max mb-4 shadow-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                ¡ENVÍO GRATIS EN TU PRIMERA COMPRA HOY!
              </div>

              {/* Título Principal orientada a comprar */}
              <h1 className="text-3xl sm:text-5xl font-black text-[#010f20] tracking-tight leading-[1.1] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Renueva tu Estilo con las Mejores Tendencias de Temporada
              </h1>

              {/* Descripción persuasiva para incentivar la compra */}
              <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed mb-6 max-w-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Descubre colecciones exclusivas diseñadas para destacar. Aprovecha descuentos únicos por tiempo limitado, pagos seguros y recibe tus productos favoritos en la puerta de tu casa.
              </p>

              {/* Botón de Ver Catálogo */}
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

              {/* Reseñas y Marcas Aliadas */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 text-amber-400 text-base">
                  ★★★★★
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <strong className="text-[#010f20]">1,240 pedidos</strong> entregados con éxito y un <strong className="text-[#010f20]">94.8%</strong> de clientes totalmente satisfechos
                </p>
              </div>

            </div>

            {/* ================= COLUMNA DERECHA (TARJETAS DECORATIVAS CON TEXTO EN ESPAÑOL) ================= */}
            <div className="lg:col-span-6 relative h-[560px] sm:h-[620px] flex items-center justify-end">

              {/* Contenedor relativo de tarjetas */}
              <div className="relative w-full max-w-[680px] h-full">

                {/* 1. Botón superior izquierdo: Bolsa / Carrito Rosa con inclinación */}
                <div className="absolute top-2 right-80 sm:right-92 w-18 h-18 bg-[#ff3366] rounded-[26px] shadow-[0_25px_50px_rgba(255,51,102,0.4)] flex items-center justify-center text-white z-30 transform -rotate-12">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>

                {/* 2. Botón superior derecho: Calendario Oscuro con inclinación */}
                <div className="absolute top-[-4px] right-48 sm:right-56 w-18 h-18 bg-[#010f20] rounded-[26px] shadow-[0_25px_50px_rgba(1,15,32,0.3)] flex items-center justify-center text-[#ff3366] z-30 transform rotate-12">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>

                {/* 3. Tarjeta central de categorías y productos (Traducido al español) */}
                <div className="absolute top-16 right-36 sm:right-44 w-[450px] sm:w-[490px] bg-white/95 backdrop-blur-md rounded-[36px] p-6 shadow-[0_40px_90px_rgba(1,15,32,0.16)] border border-gray-100 z-20 transform -rotate-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="bg-[#010f20] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#ff3366]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      Ropa
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-4 py-2 rounded-full">Calzado</span>
                    <span className="ml-auto text-gray-300 text-sm font-bold cursor-pointer hover:text-gray-500">✕</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-[#010f20] mb-4 tracking-wide flex items-center justify-between border-b border-gray-100 pb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span>¡GRAN VENTA 25% DE DESCUENTO!</span>
                    <span className="w-2 h-4 bg-[#ff3366] rounded-full inline-block animate-pulse"></span>
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden shadow-inner">
                      <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden shadow-inner">
                      <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 h-20 flex items-center justify-center overflow-hidden shadow-inner">
                      <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop" alt="prod" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div className="bg-rose-50/80 border border-rose-100 rounded-2xl h-20 flex items-center justify-center text-[#ff3366] font-bold text-xl shadow-sm cursor-pointer hover:bg-rose-100 transition-colors">
                      +
                    </div>
                  </div>
                </div>

                {/* 4. Tarjeta de Colores Disponibles (Traducido al español) */}
                <div className="absolute top-[265px] right-36 sm:right-44 w-[450px] sm:w-[490px] bg-white/95 backdrop-blur-md rounded-[32px] p-5 shadow-[0_35px_70px_rgba(1,15,32,0.12)] border border-gray-100 z-25 transform -rotate-3">
                  <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3.5">COLORES DISPONIBLES</p>
                  <div className="flex items-center justify-between px-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white shadow-md cursor-pointer"></div>
                    <div className="w-7 h-7 rounded-full bg-[#ff3366] border-2 border-white shadow-md ring-2 ring-[#ff3366]/40 cursor-pointer"></div>
                    <div className="w-7 h-7 rounded-full bg-teal-400 border-2 border-white shadow-md cursor-pointer"></div>
                    <div className="w-7 h-7 rounded-full bg-cyan-400 border-2 border-white shadow-md cursor-pointer"></div>
                    <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-md cursor-pointer"></div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white shadow-md cursor-pointer"></div>
                  </div>
                </div>

                {/* 5. Tarjeta inferior extendida / Tu Bolsa (Traducido al español) */}
                <div className="absolute top-[415px] right-36 sm:right-44 w-[450px] sm:w-[490px] bg-white/95 backdrop-blur-md rounded-[32px] p-5 shadow-[0_40px_80px_rgba(1,15,32,0.15)] border border-gray-100 z-28 transform -rotate-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">TU BOLSA DE COMPRAS</span>
                    <span className="text-gray-300 text-sm font-bold cursor-pointer hover:text-gray-500">✕</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#010f20]">
                    <span className="truncate pr-2 font-semibold">Tenis casuales de algodón...</span>
                    <span className="text-[#010f20] font-black text-base">$257</span>
                  </div>
                </div>

                {/* 6. Tarjeta derecha principal de producto (Balenciaga Sneaker con textos en español) */}
                <div className="absolute top-6 right-0 sm:right-4 w-[350px] sm:w-[390px] bg-white rounded-[40px] p-6 shadow-[0_45px_100px_rgba(1,15,32,0.25)] border border-gray-100 z-40 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute top-5 left-6 w-9 h-9 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                  </div>
                  <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-2xl overflow-hidden mb-4 border border-gray-100 relative shadow-inner flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=400&auto=format&fit=crop" 
                      alt="Triple S Balenciaga" 
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-gray-600 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </div>
                  </div>
                  <h5 className="text-sm font-black text-[#010f20] truncate mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Tenis Triple S Edición Especial</h5>
                  <p className="text-[11px] font-extrabold text-[#ff3366] uppercase tracking-wider mb-3">BALENCIAGA</p>
                  
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Tenis deportivos en tonos azul pastel con diseño moderno y máximo confort para ti...
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-2">Cantidad: <span className="bg-gray-100 px-3 py-1.5 rounded-xl text-[#010f20] font-bold shadow-inner">- 2 +</span></span>
                    <span className="text-[#010f20] text-lg font-black">$757</span>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-gray-50 text-[10px] text-gray-400 text-center font-medium">
                    Altura del modelo: 189 cm / 6&apos; 2&quot;
                  </div>
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