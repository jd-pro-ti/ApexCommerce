'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, MapPin, Package, Star, UserRound, Flag, Send } from 'lucide-react';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

function Stars({ value }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`h-5 w-5 ${star <= Math.round(Number(value) || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

export default function SellerPage() {
  const { id } = useParams();
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

  useEffect(() => {
    if (!id) return;
    productService.getPublicSellerProfile(id).then(result => {
      if (result.success) setData(result);
      else setError(result.error || 'No se pudo cargar el vendedor');
      setLoading(false);
    });
  }, [id]);

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
    const result = await productService.createSellerRating({ seller_id: id, user_id: user.id, rating: ratingForm.rating, comment: ratingForm.comment });
    if (result.success) {
      const count = Number(data.profile.seller_rating_count || 0);
      const average = Number(data.profile.seller_rating_avg || 0);
      const nextCount = count + 1;
      setData(prev => ({ ...prev, profile: { ...prev.profile, seller_rating_count: nextCount, seller_rating_avg: ((average * count) + Number(ratingForm.rating)) / nextCount }, ratings: [{ ...result.rating, profiles: { name: user.name || 'Cliente' } }, ...prev.ratings] }));
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
    const result = await productService.createSellerReport({ seller_id: id, user_id: user.id, ...reportForm });
    if (result.success) {
      setReportForm({ reason: 'other', reason_details: '', description: '' });
      setShowReportForm(false);
      setFeedback('Reporte enviado. El equipo lo revisará.');
    } else setFeedback(result.error || 'No se pudo enviar el reporte.');
    setSubmitting(false);
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error || !data?.profile) return <div className="flex min-h-[60vh] items-center justify-center px-4 text-center"><div><p className="text-xl font-bold text-slate-900">Vendedor no encontrado</p><p className="mt-2 text-base text-slate-500">{error}</p><Link href="/catalogo" className="mt-5 inline-block font-bold text-amber-700 text-base">Volver al catálogo</Link></div></div>;

  const { profile, details, products, ratings } = data;
  const socialMedia = details.social_media || {};
  const location = [details.city, details.state, details.country].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 pb-24 pt-30 sm:px-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="mx-auto max-w-[1280px] space-y-8">
        <div className="mb-2">
          <Link href="/catalogo" className="inline-block text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1">← Volver al catálogo</Link>
        </div>

        {/* Header / Perfil Principal */}
        <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-200/60">
          <div className="h-44 bg-gradient-to-r from-[#162536] via-slate-800 to-[#FFB872]" />
          <div className="px-8 pb-10 sm:px-12">
            <div className="-mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-6">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name || 'Vendedor'} className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-xl bg-white" />
                ) : (
                  <span className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-slate-200 text-slate-500 shadow-xl"><UserRound className="h-14 w-14" /></span>
                )}
                <div className="pb-1">
                  <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/50 mb-2">Vendedor Verificado</span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{profile.name || 'Vendedor'}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl bg-white border border-slate-100 shadow-lg px-5 py-3.5">
                <Stars value={profile.seller_rating_avg} />
                <span className="font-extrabold text-slate-900 text-lg ml-1">{Number(profile.seller_rating_avg || 0).toFixed(1)}</span>
                <span className="text-sm text-slate-400">({profile.seller_rating_count || 0})</span>
              </div>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] border-t border-slate-100 pt-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sobre este vendedor</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{details.bio || 'Este vendedor aún no ha agregado una descripción.'}</p>
              </div>
              <div className="space-y-3 text-sm sm:text-base text-slate-600 bg-slate-50/90 p-6 rounded-3xl border border-slate-100">
                {location && <p className="flex items-center gap-2.5 font-medium"><MapPin className="h-5 w-5 text-amber-600 shrink-0" />{location}</p>}
                {details.website && <a href={details.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 font-semibold text-amber-700 hover:text-amber-900"><Globe className="h-5 w-5 shrink-0" />Sitio web</a>}
                {Object.entries(socialMedia).filter(([, value]) => value).map(([network, value]) => (
                  <a key={network} href={String(value).startsWith('http') ? value : `https://${network}.com/${String(value).replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="block font-semibold capitalize text-slate-600 hover:text-amber-700 transition-colors">
                    {network}: {value}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Productos del Vendedor */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Productos de {profile.name || 'este vendedor'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Catálogo disponible en la tienda</p>
            </div>
            <span className="text-sm font-semibold bg-white border border-slate-200 px-4 py-2 rounded-2xl text-slate-700 shadow-sm">{products.length} productos</span>
          </div>
          {products.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-16 text-center text-base text-slate-500 shadow-sm">
              <Package className="mx-auto mb-3 h-12 w-12 text-slate-400" />Este vendedor aún no tiene productos activos.
            </div>
          )}
        </section>

        {/* Sección de Opiniones e Interacción con Estrellas Interactivas */}
        <section className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/80 shadow-2xl shadow-slate-200/60 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Opiniones sobre el vendedor</h2>
              <p className="text-sm text-slate-500 mt-1">Cualquier usuario registrado puede compartir su experiencia.</p>
            </div>
            <button 
              type="button" 
              onClick={() => { if (requireLogin()) setShowRatingForm(value => !value); }} 
              className="rounded-2xl bg-[#162536] px-6 py-3.5 text-sm font-bold text-white hover:bg-amber-600 transition-all shadow-lg cursor-pointer"
            >
              {showRatingForm ? 'Cancelar calificación' : 'Calificar vendedor'}
            </button>
          </div>

          {showRatingForm && (
            <form onSubmit={handleRatingSubmit} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-8 space-y-6 shadow-inner">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">Selecciona tu calificación</label>
                {/* Selector de Estrellas Interactivo por Iconos */}
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                      aria-label={`${star} estrellas`}
                    >
                      <Star 
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoverRating || ratingForm.rating) 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-md' 
                            : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-base font-bold text-slate-800 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                    {ratingForm.rating} de 5 estrellas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">Comentario</label>
                <textarea 
                  value={ratingForm.comment} 
                  onChange={event => setRatingForm({ ...ratingForm, comment: event.target.value })} 
                  placeholder="Escribe tu comentario sobre tu experiencia (opcional)" 
                  rows="4" 
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm sm:text-base focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-400 shadow-sm" 
                />
              </div>

              <button 
                disabled={submitting} 
                className="inline-flex items-center rounded-2xl bg-amber-500 px-7 py-4 text-sm sm:text-base font-bold text-slate-900 hover:bg-amber-400 transition-all shadow-lg disabled:opacity-60 cursor-pointer"
              >
                <Send className="mr-2.5 h-5 w-5" />{submitting ? 'Publicando...' : 'Publicar calificación'}
              </button>
            </form>
          )}

          <div className="space-y-5 pt-2">
            {ratings.length ? (
              ratings.map(rating => (
                <article key={rating.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 space-y-3 hover:bg-white transition-all shadow-sm">
                  <div className="flex justify-between gap-4 items-center">
                    <div>
                      <p className="text-base font-bold text-slate-900">{rating.profiles?.name || 'Cliente'}</p>
                      <div className="mt-1.5"><Stars value={rating.rating} /></div>
                    </div>
                    <time className="text-xs sm:text-sm text-slate-400">{new Date(rating.created_at).toLocaleDateString('es-MX')}</time>
                  </div>
                  {rating.comment && <p className="text-sm sm:text-base leading-relaxed text-slate-600 pt-1">{rating.comment}</p>}
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50/60 p-8 text-center text-sm sm:text-base italic text-slate-400 border border-slate-100">Todavía no hay opiniones sobre este vendedor.</p>
            )}
          </div>
        </section>

        {/* Sección de Reportes */}
        <section className="rounded-3xl border border-rose-200 bg-rose-50/50 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-rose-950/5 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">¿Detectaste un problema?</h2>
              <p className="text-sm text-slate-600 mt-1">Reporta fraude, mal servicio, productos falsos u otra situación.</p>
            </div>
            <button 
              type="button" 
              onClick={() => { if (requireLogin()) setShowReportForm(value => !value); }} 
              className="inline-flex items-center justify-center rounded-2xl border border-rose-300 bg-white px-6 py-3.5 text-sm font-bold text-rose-700 hover:bg-rose-50 transition-all shadow-sm cursor-pointer"
            >
              <Flag className="mr-2 h-5 w-5" />{showReportForm ? 'Cerrar reporte' : 'Reportar vendedor'}
            </button>
          </div>

          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="rounded-3xl border border-rose-200 bg-white p-8 space-y-5 shadow-lg">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">Motivo del reporte</label>
                <select 
                  value={reportForm.reason} 
                  onChange={event => setReportForm({ ...reportForm, reason: event.target.value })} 
                  className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm sm:text-base bg-white focus:outline-none focus:border-rose-500 transition-colors shadow-sm"
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
                  className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm sm:text-base focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-400 shadow-sm" 
                />
              </div>

              <div>
                <textarea 
                  required 
                  value={reportForm.description} 
                  onChange={event => setReportForm({ ...reportForm, description: event.target.value })} 
                  placeholder="Describe lo ocurrido con claridad..." 
                  rows="4" 
                  className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm sm:text-base focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-400 shadow-sm" 
                />
              </div>

              <button 
                disabled={submitting} 
                className="rounded-2xl bg-rose-600 px-7 py-4 text-sm sm:text-base font-bold text-white hover:bg-rose-700 transition-all shadow-lg disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </form>
          )}

          {feedback && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">{feedback}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}