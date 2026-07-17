'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
// 1. Importamos el servicio real en lugar de las constantes MOCK
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ui/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [error, setError] = useState(''); // Añadido por si falla la base de datos
  const { addToCart } = useCart();

  // 2. Lógica real extraída de tu catálogo
  useEffect(() => {
    const fetchHomeProducts = async () => {
      setLoading(true);
      setError('');
      try {
        // Llamamos a la base de datos ordenando por los más recientes
        const result = await productService.getPublicProducts({
          sortBy: 'recent'
        });

        if (result.success) {
          const allProducts = result.products || [];
          setProducts(allProducts);
          // Tomamos los primeros 4 productos reales de la base de datos
          setFeaturedProducts(allProducts.slice(0, 4));
        } else {
          setError(result.error || 'Error al cargar productos del servidor');
        }
      } catch (err) {
        console.error('❌ Error en Home al conectar con la base de datos:', err);
        setError('No se pudieron recuperar los productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9fa] text-[#1b1c1d] min-h-screen transition-colors duration-300 pt-20">

      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[85vh] flex items-center px-6 md:px-16 max-w-[1440px] mx-auto mb-20 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">

          <div className="z-10">
            <div className="flex gap-2 mb-6">
              <span className="w-3 h-3 rounded-full bg-[#dd9448]" />
              <span className="w-3 h-3 rounded-full bg-[#010f20]/20" />
              <span className="w-3 h-3 rounded-full bg-[#010f20]/20" />
            </div>

            <h1
              className="font-display-lg text-5xl md:text-6xl font-bold tracking-tight text-[#010f20] leading-[1.1] mb-4 max-w-md"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Servicio <br />
              <span className="text-[#dd9448]">Profesional.</span>
            </h1>

            <p
              className="font-body-lg text-lg text-[#44474c] mb-12 max-w-lg leading-relaxed"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Eleva tu día a día con nuestra colección meticulosamente seleccionada de artículos esenciales para el hogar y objetos de diseño. La precisión arquitectónica se encuentra con el confort.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Tarjeta 1 */}
              <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(1,15,32,0.04)] flex flex-col gap-3 w-full sm:w-56 hover:-translate-y-2 transition-transform duration-300">
                <div className="text-[#dd9448] bg-[#dd9448]/10 p-3 rounded-full w-fit">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <h3 className="font-headline-md text-[18px] text-[#010f20] font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Diseño Curado</h3>
                <p className="text-[#44474c] text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>Piezas artesanales para el interior moderno.</p>
              </div>

              {/* Tarjeta 2 */}
              <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(1,15,32,0.04)] flex flex-col gap-3 w-full sm:w-56 hover:-translate-y-2 transition-transform duration-300">
                <div className="text-[#010f20] bg-[#010f20]/10 p-3 rounded-full w-fit">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 10.99H6V6.13l6-2.25v9.11z" />
                  </svg>
                </div>
                <h3 className="font-headline-md text-[18px] text-[#010f20] font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Calidad Élite</h3>
                <p className="text-[#44474c] text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>Adquiridas directamente de los mejores estudios de diseño.</p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-[#010f20]/5 rounded-full filter blur-2xl -z-10 scale-110"></div>
            <div className="relative w-full max-w-lg aspect-square bg-[#f5f3f4] rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] overflow-hidden border-[8px] border-white shadow-2xl">
              <img
                src="/images/hero-item.png"
                alt="Decoración de Diseño Exclusivo"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuACKrhEO73fKrmmnv2I4nwQm2JJZhBTevsRVITtysZIXadH7NnyaiW8iQAyQfHwE6Igl1ihWnyE4XWOIHXtRnBBPFaMD4jkHhu2Ey5dxyAD-YJErwVeNILFUMBENZoBDFtS16Sc8ZloDYvu8ucyk4nfzhOcDiWm7rN1ax5mArmWZyN-uk71mxZKEOuVV8paNRaiwP5SHtW6ZB1lMn5g0oTJsvfJgwWtQ2MTn1dvU64HdyGlRYXzj9Hs'; }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ================= EXPLORE CATEGORIES ================= */}
      <section className="bg-[#f5f3f4] py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2
                className="font-display-lg text-[32px] font-semibold text-[#010f20] mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Explorar Categorías
              </h2>
              <p className="text-[#44474c]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                Encuentra el complemento perfecto para tu espacio profesional.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="text-[#010f20] hover:text-[#dd9448] font-bold flex items-center gap-2 group transition-all"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ver Todo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/catalogo?categoria=tech" className="group relative overflow-hidden rounded-xl h-80 cursor-pointer shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010f20]/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="font-label-sm uppercase tracking-widest text-[#dd9448] mb-2 block text-xs">Premium</span>
                <h3 className="font-headline-md text-2xl font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Tecnología de Trabajo</h3>
              </div>
            </Link>

            <Link href="/catalogo?categoria=living" className="group relative overflow-hidden rounded-xl h-80 cursor-pointer shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010f20]/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="font-label-sm uppercase tracking-widest text-[#dd9448] mb-2 block text-xs">Confort</span>
                <h3 className="font-headline-md text-2xl font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Hogar Moderno</h3>
              </div>
            </Link>

            <Link href="/catalogo?categoria=lifestyle" className="group relative overflow-hidden rounded-xl h-80 cursor-pointer shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010f20]/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="font-label-sm uppercase tracking-widest text-[#dd9448] mb-2 block text-xs">Esencia</span>
                <h3 className="font-headline-md text-2xl font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Estilo de Vida Élite</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

{/* ================= NEW ARRIVALS (Productos reales consumidos vía ProductCard) ================= */}
      <section className="py-24 max-w-[1440px] mx-auto px-6 md:px-16">
        <h2 
          className="font-display-lg text-[32px] font-semibold text-[#010f20] mb-12 text-center"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Nuevos Lanzamientos
        </h2>

        {/* Mensaje de Error en caso de falla */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center max-w-md mx-auto">
            {error}
          </div>
        )}
        
        {featuredProducts.length === 0 && !error ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          /* Renderizamos usando el mismo ProductCard del catálogo */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}