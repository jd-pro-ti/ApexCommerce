'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, MapPin, Package, Star, UserRound, Flag, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { slugify } from '@/utils/helpers';
import { useRef } from 'react';

function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5 sm:gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= Math.round(Number(value) || 0)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300'
            }`}
        />
      ))}
    </span>
  );
}

export default function SellerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [reportForm, setReportForm] = useState({ reason: 'other', reason_details: '', description: '' });
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});

  const carouselRefs = useRef({});

  useEffect(() => {
    if (!id) return;
    productService.getPublicSellerProfile(id).then(result => {
      if (result.success) {
        setData(result);
        const canonicalSlug = slugify(result.profile.name);
        if (id !== canonicalSlug) router.replace(`/vendedor/${canonicalSlug}`);
      }
      else setError(result.error || 'No se pudo cargar el vendedor');
      setLoading(false);
    });
  }, [id, router]);

  const requireLogin = () => {
    if (!isAuthenticated) {
      setFeedback('Inicia sesión para calificar o reportar a este vendedor.');
      return false;
    }
    return true;
  };

  const handleRatingSubmit = async event => {
    event.preventDefault();
    if (!requireLogin()) return;
    setSubmitting(true);
    const result = await productService.createSellerRating({ seller_id: data.profile.id, user_id: user.id, rating: ratingForm.rating, comment: ratingForm.comment });
    if (result.success) {
      const count = Number(data.profile.seller_rating_count || 0);
      const average = Number(data.profile.seller_rating_avg || 0);
      const nextCount = count + 1;
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          seller_rating_count: nextCount,
          seller_rating_avg: ((average * count) + Number(ratingForm.rating)) / nextCount
        },
        ratings: [{ ...result.rating, profiles: { name: user.name || 'Cliente' } }, ...prev.ratings]
      }));
      setRatingForm({ rating: 5, comment: '' });
      setShowRatingForm(false);
      setFeedback('Tu calificación fue publicada correctamente.');
    } else setFeedback(result.error || 'No se pudo publicar la calificación.');
    setSubmitting(false);
  };

  const handleReportSubmit = async event => {
    event.preventDefault();
    if (!requireLogin()) return;
    setSubmitting(true);
    const result = await productService.createSellerReport({ seller_id: data.profile.id, user_id: user.id, ...reportForm });
    if (result.success) {
      setReportForm({ reason: 'other', reason_details: '', description: '' });
      setShowReportForm(false);
      setFeedback('Reporte enviado. El equipo lo revisará.');
    } else setFeedback(result.error || 'No se pudo enviar el reporte.');
    setSubmitting(false);
  };

  const toggleCategoryExpand = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const scrollCarousel = (categoryName, direction) => {
    const container = carouselRefs.current[categoryName];
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (error || !data?.profile)
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div>
          <p className="text-xl font-bold text-slate-900">Vendedor no encontrado</p>
          <p className="mt-2 text-base text-slate-500">{error}</p>
          <Link href="/catalogo" className="mt-5 inline-block font-bold text-amber-700 text-base">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );

  const { profile, details, products, ratings } = data;
  const socialMedia = details.social_media || {};
  const location = [details.city, details.state, details.country].filter(Boolean).join(', ');

  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Sin categoría';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  const sortedCategories = Object.keys(productsByCategory).sort((a, b) => a.localeCompare(b));

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-3 sm:px-6 pb-24 pt-28 sm:pt-30"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-[1280px] space-y-6 sm:space-y-8">
        <div className="mb-1 sm:mb-2">
          <Link
            href="/catalogo"
            className="inline-block text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1"
          >
            ← Volver al catálogo
          </Link>
        </div>

<section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 backdrop-blur-md shadow-2xl shadow-slate-200/50">
  {/* Cabecera con el gradiente original */}
  <div className="h-20 sm:h-28 bg-gradient-to-r from-[#162536] via-slate-700 to-[#FFB872]" />

  <div className="px-5 sm:px-8 lg:px-12 pb-8 sm:pb-12">
    {/* Fila de identidad (avatar + nombre + badge + rating a la derecha) */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-6">
      {/* Izquierda: avatar y nombre */}
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name || 'Vendedor'}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white shadow-xl object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-slate-400 shadow-xl">
              <UserRound className="h-8 w-8 sm:h-10 sm:w-10" />
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#162536] border-2 border-white shadow-md text-white text-xs font-bold">
            ✓
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {profile.name || 'Vendedor'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#162536] bg-[#FFB872]/10 px-3 py-1 rounded-full border border-[#162536]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB872]" />
              Vendedor Destacado
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Miembro desde 2021</span>
          </div>
        </div>
      </div>

      {/* Derecha: Rating alineado a la derecha con margen automático */}
      <button
        type="button"
        onClick={() => document.getElementById('seller-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        aria-label="Ver opiniones sobre el vendedor"
        className="sm:ml-auto flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-left shadow-lg shadow-slate-200/30 transition-colors hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        <div className="flex text-amber-400">
          <Stars value={profile.seller_rating_avg} />
        </div>
        <span className="font-extrabold text-slate-900 text-lg leading-none">
          {Number(profile.seller_rating_avg || 0).toFixed(1)}
        </span>
        <span className="text-xs text-slate-400 font-medium">
          ({profile.seller_rating_count || 0})
        </span>
      </button>
    </div>

    {/* Panel de estadísticas rápidas (opcional) */}
    {profile.stats && (
      <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4 bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200/60">
        <div className="text-center">
          <p className="text-lg sm:text-xl font-black text-slate-800">{profile.stats.products || 0}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Productos</p>
        </div>
        <div className="text-center border-x border-slate-200/60">
          <p className="text-lg sm:text-xl font-black text-slate-800">{profile.stats.sales || 0}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Ventas</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-xl font-black text-slate-800">{profile.stats.response_time || '24h'}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Respuesta</p>
        </div>
      </div>
    )}

    {/* Cuerpo: descripción + contacto en grid de 3 columnas */}
    <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Descripción - ocupa 2/3 */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 bg-gradient-to-b from-[#162536] to-[#FFB872] rounded-full" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Acerca de</h2>
          <span className="flex-1 border-t border-slate-200/60" />
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <p className="text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
            {details.bio || 'Este vendedor aún no ha compartido su historia, pero su trabajo habla por sí mismo.'}
          </p>
        </div>
        {details.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {details.tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-[#162536] bg-[#162536]/10 px-3 py-1 rounded-full border border-[#162536]/20">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Contacto - ocupa 1/3 */}
      <div className="lg:col-span-1">
        <div className="h-full bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#FFB872] rounded-full" />
            Contacto
          </h3>
          {location && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-[#162536] shrink-0 mt-0.5" />
              <span className="text-slate-800 font-medium">{location}</span>
            </div>
          )}
          {details.website && (
            <a
              href={details.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-sm text-[#162536] hover:text-[#FFB872] transition-colors group"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span className="border-b border-transparent group-hover:border-[#FFB872] transition-all">Sitio web</span>
            </a>
          )}
          {Object.entries(socialMedia)
            .filter(([, value]) => value)
            .map(([network, value]) => (
              <a
                key={network}
                href={String(value).startsWith('http') ? value : `https://${network}.com/${String(value).replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#162536] transition-colors group"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400 w-12 shrink-0">{network}</span>
                <span className="truncate group-hover:underline decoration-[#162536] underline-offset-2">{value}</span>
              </a>
            ))}
        </div>
      </div>
    </div>
  </div>
</section>

        {/* Productos del Vendedor - Organizados por Categoría en Carruseles */}
        <section className="space-y-8 sm:space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Productos por categoría
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Explora el catálogo organizado
              </p>
            </div>
            <span className="text-sm font-semibold bg-white border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-slate-700 shadow-sm self-start sm:self-auto">
              {products.length} productos
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 sm:p-16 text-center text-sm sm:text-base text-slate-500 shadow-sm">
              <Package className="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
              Este vendedor aún no tiene productos activos.
            </div>
          ) : (
            sortedCategories.map(categoryName => {
              const categoryProducts = productsByCategory[categoryName];
              const isExpanded = expandedCategories[categoryName] || false;
              const displayedProducts = isExpanded ? categoryProducts : categoryProducts.slice(0, 8);
              const hasMore = categoryProducts.length > 8;

              return (
                <div key={categoryName} className="space-y-3 sm:space-y-4">
                  {/* Título de categoría con contador y botón Ver más */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 capitalize">
                        {categoryName}
                      </h3>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        {categoryProducts.length}
                      </span>
                    </div>
                    {hasMore && (
                      <button
                        onClick={() => toggleCategoryExpand(categoryName)}
                        className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        {isExpanded ? 'Ver menos' : `Ver más (${categoryProducts.length - 8} restantes)`}
                      </button>
                    )}
                  </div>

                  {/* Carrusel horizontal (scroll) si no está expandido, o grilla si expandido */}
                  {!isExpanded ? (
                    <div className="relative">
                      {/* Contenedor del carrusel con padding lateral en escritorio */}
                      <div
                        ref={el => (carouselRefs.current[categoryName] = el)}
                        className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden scrollbar-hide px-0 sm:px-8"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {displayedProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex-[0_0_calc(50%-0.375rem)] sm:flex-[0_0_calc(33.333%-0.5rem)] md:flex-[0_0_calc(25%-0.5rem)] lg:flex-[0_0_calc(20%-0.5rem)] snap-start"
                          >
                            <ProductCard product={product} />
                          </div>
                        ))}
                      </div>

                      {/* Flechas de navegación (solo visibles en sm en adelante) */}
                      <div className="hidden sm:flex absolute inset-y-0 left-0 items-center pointer-events-none">
                        <button
                          onClick={() => scrollCarousel(categoryName, 'left')}
                          className="pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200 shadow-lg rounded-full p-2 -ml-2 transition-all hover:scale-105"
                          aria-label="Anterior"
                        >
                          <ChevronLeft className="h-5 w-5 text-slate-700" />
                        </button>
                      </div>
                      <div className="hidden sm:flex absolute inset-y-0 right-0 items-center pointer-events-none">
                        <button
                          onClick={() => scrollCarousel(categoryName, 'right')}
                          className="pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200 shadow-lg rounded-full p-2 -mr-2 transition-all hover:scale-105"
                          aria-label="Siguiente"
                        >
                          <ChevronRight className="h-5 w-5 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Grilla cuando está expandido
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {categoryProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* Sección de Opiniones e Interacción con Estrellas Interactivas */}
        <section id="seller-reviews" className="scroll-mt-24 bg-white/95 backdrop-blur-xl p-4 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/60 space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Opiniones sobre el vendedor</h2>
              <p className="text-sm text-slate-500 mt-1">
                Cualquier usuario registrado puede compartir su experiencia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (requireLogin()) setShowRatingForm(value => !value);
              }}
              className="rounded-xl sm:rounded-2xl bg-[#162536] px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-amber-600 transition-all shadow-lg cursor-pointer self-start sm:self-auto"
            >
              {showRatingForm ? 'Cancelar calificación' : 'Calificar vendedor'}
            </button>
          </div>

          {showRatingForm && (
            <form
              onSubmit={handleRatingSubmit}
              className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50/90 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-inner"
            >
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 sm:mb-3">
                  Selecciona tu calificación
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      aria-label={`${star} estrellas`}
                    >
                      <Star
                        className={`h-7 w-7 sm:h-10 sm:w-10 transition-colors ${star <= (hoverRating || ratingForm.rating)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                            : 'text-slate-300'
                          }`}
                      />
                    </button>
                  ))}
                  <span className="ml-1 sm:ml-4 text-sm sm:text-base font-bold text-slate-800 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                    {ratingForm.rating} de 5 estrellas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 sm:mb-3">
                  Comentario
                </label>
                <textarea
                  value={ratingForm.comment}
                  onChange={event => setRatingForm({ ...ratingForm, comment: event.target.value })}
                  placeholder="Escribe tu comentario sobre tu experiencia (opcional)"
                  rows="4"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <button
                disabled={submitting}
                className="inline-flex items-center rounded-xl sm:rounded-2xl bg-amber-500 px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base font-bold text-slate-900 hover:bg-amber-400 transition-all shadow-lg disabled:opacity-60 cursor-pointer"
              >
                <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {submitting ? 'Publicando...' : 'Publicar calificación'}
              </button>
            </form>
          )}

          <div className="space-y-4 sm:space-y-5 pt-2">
            {ratings.length ? (
              ratings.map(rating => (
                <article
                  key={rating.id}
                  className="rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-6 space-y-2 sm:space-y-3 hover:bg-white transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="text-sm sm:text-base font-bold text-slate-900">
                        {rating.profiles?.name || 'Cliente'}
                      </p>
                      <div className="mt-1"><Stars value={rating.rating} /></div>
                    </div>
                    <time className="text-xs sm:text-sm text-slate-400">
                      {new Date(rating.created_at).toLocaleDateString('es-MX')}
                    </time>
                  </div>
                  {rating.comment && (
                    <p className="text-sm sm:text-base leading-relaxed text-slate-600 pt-1">
                      {rating.comment}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p className="rounded-xl sm:rounded-2xl bg-slate-50/60 p-6 sm:p-8 text-center text-sm sm:text-base italic text-slate-400 border border-slate-100">
                Todavía no hay opiniones sobre este vendedor.
              </p>
            )}
          </div>
        </section>

        {/* Sección de Reportes */}
        <section className="rounded-2xl sm:rounded-3xl border border-rose-200 bg-rose-50/50 backdrop-blur-xl p-4 sm:p-8 lg:p-10 shadow-2xl shadow-rose-950/5 space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">¿Detectaste un problema?</h2>
              <p className="text-sm text-slate-600 mt-1">
                Reporta fraude, mal servicio, productos falsos u otra situación.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (requireLogin()) setShowReportForm(value => !value);
              }}
              className="inline-flex items-center justify-center rounded-xl sm:rounded-2xl border border-rose-300 bg-white px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-rose-700 hover:bg-rose-50 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Flag className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {showReportForm ? 'Cerrar reporte' : 'Reportar vendedor'}
            </button>
          </div>

          {showReportForm && (
            <form
              onSubmit={handleReportSubmit}
              className="rounded-2xl sm:rounded-3xl border border-rose-200 bg-white p-4 sm:p-8 space-y-4 sm:space-y-5 shadow-lg"
            >
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 sm:mb-3">
                  Motivo del reporte
                </label>
                <select
                  value={reportForm.reason}
                  onChange={event => setReportForm({ ...reportForm, reason: event.target.value })}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base bg-white focus:outline-none focus:border-rose-500 transition-colors shadow-sm"
                >
                  <option value="product_not_as_described">Producto diferente a la descripción</option>
                  <option value="shipping_delay">Retraso en el envío</option>
                  <option value="poor_communication">Mala comunicación</option>
                  <option value="damaged_product">Producto dañado</option>
                  <option value="fake_product">Producto falso</option>
                  <option value="bad_service">Mal servicio</option>
                  <option value="fraud">Fraude</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <input
                  value={reportForm.reason_details}
                  onChange={event => setReportForm({ ...reportForm, reason_details: event.target.value })}
                  placeholder="Detalle breve del motivo"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div>
                <textarea
                  required
                  value={reportForm.description}
                  onChange={event => setReportForm({ ...reportForm, description: event.target.value })}
                  placeholder="Describe lo ocurrido con claridad..."
                  rows="4"
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <button
                disabled={submitting}
                className="rounded-xl sm:rounded-2xl bg-rose-600 px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-base font-bold text-white hover:bg-rose-700 transition-all shadow-lg disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </form>
          )}

          {feedback && (
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">{feedback}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
