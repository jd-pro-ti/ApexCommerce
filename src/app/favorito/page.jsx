'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function FavoritosPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { wishlist, loading, error, loadWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated) {
      router.push('/login?redirect=/favoritos');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await loadWishlist();
      setIsLoading(false);
    };

    loadData();
  }, [isAuthenticated, router, loadWishlist]);

  if (!isAuthenticated) {
    return null; // Redirigiendo...
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto text-slate-900">

      {/* Cabecera */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href="/catalogo"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#44474c]/70 hover:text-[#010f20] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" /> Volver al catálog
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 
              className="text-3xl sm:text-4xl font-bold text-[#010f20] tracking-tight"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Mis Favoritos
            </h1>
            <p 
              className="text-sm text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {wishlist.length === 0 
                ? 'Aún no tienes productos guardados en favoritos' 
                : `${wishlist.length} ${wishlist.length === 1 ? 'producto guardado' : 'productos guardados'}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {wishlist.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Tu lista de favoritos está vacía
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Explora el catálogo y guarda los productos que más te gusten. 
            Así podrás encontrarlos fácilmente cuando quieras comprarlos.
          </p>
          <Link href="/catalogo">
            <Button className="!bg-[#0b1523] hover:!bg-slate-800 !text-white text-sm font-bold py-3 px-8 rounded-xl transition-all shadow-sm">
              <ShoppingBag className="w-4 h-4 mr-2" /> Explorar Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}