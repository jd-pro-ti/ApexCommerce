'use client';

import Link from 'next/link';
import { ArrowUpRight, Heart, ShoppingBag } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistPanel() {
  const { wishlist, loading, error } = useWishlist();

  if (loading) {
    return <div className="bg-white border border-slate-200/80 rounded-2xl p-20 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lista de deseos</h1>
        <p className="text-sm text-slate-500 mt-1">
          {wishlist.length ? `${wishlist.length} ${wishlist.length === 1 ? 'producto guardado' : 'productos guardados'}` : 'Guarda tus productos favoritos para comprarlos más tarde.'}
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {wishlist.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Heart className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Tu lista de deseos está vacía</h3>
          <p className="text-sm text-slate-500 mb-6">Explora el catálogo y guarda los productos que más te gusten.</p>
          <Link href="/catalogo" className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-xs">
            <ShoppingBag className="w-4 h-4" />Explorar catálogo<ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        // Se cambió a grid-cols-2 por defecto (móvil) y se ajustaron las columnas y el gap (espaciado) para pantallas más grandes
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}