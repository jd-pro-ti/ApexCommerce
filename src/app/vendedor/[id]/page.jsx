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
    <span className="inline-flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`h-4 w-4 ${star <= Math.round(Number(value) || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
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
  if (error || !data?.profile) return <div className="flex min-h-[60vh] items-center justify-center px-4 text-center"><div><p className="text-lg font-bold text-slate-900">Vendedor no encontrado</p><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/catalogo" className="mt-5 inline-block font-bold text-amber-700">Volver al catálogo</Link></div></div>;

  const { profile, details, products, ratings } = data;
  const socialMedia = details.social_media || {};
  const location = [details.city, details.state, details.country].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        <Link href="/catalogo" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Volver al catálogo</Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-slate-950 via-slate-800 to-amber-700" />
          <div className="px-6 pb-7 sm:px-10">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'Vendedor'} className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md" /> : <span className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-200 text-slate-500 shadow-md"><UserRound className="h-10 w-10" /></span>}
                <div className="pb-1"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Vendedor</p><h1 className="text-2xl font-extrabold text-slate-950">{profile.name || 'Vendedor'}</h1></div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3"><Stars value={profile.seller_rating_avg} /><span className="font-bold text-slate-900">{Number(profile.seller_rating_avg || 0).toFixed(1)}</span><span className="text-xs text-slate-500">({profile.seller_rating_count || 0})</span></div>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto]">
              <div><h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Sobre este vendedor</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{details.bio || 'Este vendedor aún no ha agregado una descripción.'}</p></div>
              <div className="space-y-3 text-sm text-slate-600">
                {location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-600" />{location}</p>}
                {details.website && <a href={details.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-amber-700 hover:text-amber-900"><Globe className="h-4 w-4" />Sitio web</a>}
                {Object.entries(socialMedia).filter(([, value]) => value).map(([network, value]) => <a key={network} href={String(value).startsWith('http') ? value : `https://${network}.com/${String(value).replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="block font-semibold capitalize text-slate-600 hover:text-amber-700">{network}: {value}</a>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-950">Productos de {profile.name || 'este vendedor'}</h2><span className="text-sm text-slate-500">{products.length} productos</span></div>
          {products.length ? <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500"><Package className="mx-auto mb-3 h-8 w-8" />Este vendedor aún no tiene productos activos.</div>}
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-2xl font-bold text-slate-950">Opiniones sobre el vendedor</h2><p className="mt-1 text-sm text-slate-500">Cualquier usuario registrado puede compartir su experiencia.</p></div>
            <button type="button" onClick={() => { if (requireLogin()) setShowRatingForm(value => !value); }} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600">Calificar vendedor</button>
          </div>
          {showRatingForm && <form onSubmit={handleRatingSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700">Calificación
              <select value={ratingForm.rating} onChange={event => setRatingForm({ ...ratingForm, rating: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 sm:max-w-xs">{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} estrellas</option>)}</select>
            </label>
            <textarea value={ratingForm.comment} onChange={event => setRatingForm({ ...ratingForm, comment: event.target.value })} placeholder="Escribe tu comentario (opcional)" rows="3" className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <button disabled={submitting} className="mt-4 inline-flex items-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><Send className="mr-2 h-4 w-4" />{submitting ? 'Publicando...' : 'Publicar calificación'}</button>
          </form>}
          <div className="mt-6 space-y-4">{ratings.length ? ratings.map(rating => <article key={rating.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-4"><div><p className="font-bold text-slate-900">{rating.profiles?.name || 'Cliente'}</p><Stars value={rating.rating} /></div><time className="text-xs text-slate-400">{new Date(rating.created_at).toLocaleDateString('es-MX')}</time></div>{rating.comment && <p className="mt-3 text-sm leading-relaxed text-slate-600">{rating.comment}</p>}</article>) : <p className="rounded-2xl bg-white p-6 text-sm italic text-slate-500">Todavía no hay opiniones sobre este vendedor.</p>}</div>
        </section>

        <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-slate-900">¿Detectaste un problema?</h2><p className="mt-1 text-sm text-slate-600">Reporta fraude, mal servicio, productos falsos u otra situación.</p></div>
            <button type="button" onClick={() => { if (requireLogin()) setShowReportForm(value => !value); }} className="inline-flex items-center justify-center rounded-xl border border-rose-300 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100"><Flag className="mr-2 h-4 w-4" />Reportar vendedor</button>
          </div>
          {showReportForm && <form onSubmit={handleReportSubmit} className="mt-5 rounded-xl border border-rose-200 bg-white p-4">
            <label className="block text-sm font-semibold text-slate-700">Motivo
              <select value={reportForm.reason} onChange={event => setReportForm({ ...reportForm, reason: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="product_not_as_described">Producto diferente a la descripción</option><option value="shipping_delay">Retraso en el envío</option><option value="poor_communication">Mala comunicación</option><option value="damaged_product">Producto dañado</option><option value="fake_product">Producto falso</option><option value="bad_service">Mal servicio</option><option value="fraud">Fraude</option><option value="other">Otro</option></select>
            </label>
            <input value={reportForm.reason_details} onChange={event => setReportForm({ ...reportForm, reason_details: event.target.value })} placeholder="Detalle breve del motivo" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <textarea required value={reportForm.description} onChange={event => setReportForm({ ...reportForm, description: event.target.value })} placeholder="Describe lo ocurrido con claridad" rows="4" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <button disabled={submitting} className="mt-4 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Enviando...' : 'Enviar reporte'}</button>
          </form>}
          {feedback && <p className="mt-4 text-sm font-semibold text-slate-700">{feedback}</p>}
        </section>
      </div>
    </main>
  );
}
