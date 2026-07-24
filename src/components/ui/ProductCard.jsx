'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setIsAdding(true);
    addToCart(product);
    setShowAdded(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(false);
    }, 2000);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirigir al login
      window.location.href = '/login';
      return;
    }

    setIsWishlistLoading(true);
    await toggleWishlist(product);
    setIsWishlistLoading(false);
  };

  const isFavorite = isInWishlist(product.id);

  return (
    <div className="group bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col overflow-hidden">
      
      <Link href={`/producto/${product.id}`}>
        <div className="relative h-60 w-full bg-gray-50 overflow-hidden flex items-center justify-center">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xl opacity-30">📦</div>
          )}

          {/* Botón Favoritos - Esquina superior derecha */}
          <button
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all backdrop-blur-sm z-10
              ${isFavorite 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
              }
              ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isWishlistLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg 
                className="w-4 h-4" 
                fill={isFavorite ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          {/* Botón Agregar al Carrito - Esquina inferior derecha */}
          {product.stock > 0 && (
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`absolute bottom-2 right-2 p-2.5 rounded-full shadow-lg transition-all backdrop-blur-sm z-10
                ${showAdded 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#010f20]/90 text-white hover:bg-[#dd9448]'}
              `}
            >
              {isAdding ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : showAdded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Badges de estado */}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="absolute top-2 left-2 bg-[#dd9448] text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase z-10">Tendencia</span>
          )}
          {product.featured && (
            <span className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase z-10">⭐ Destacado</span>
          )}
        </div>
      </Link>
      
      <div className="p-3 flex flex-col flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#dd9448] mb-1">
          {product.category || 'Producto'}
        </span>

        <Link href={`/producto/${product.id}`} className="mb-2 block">
          <h3 className="font-medium text-[#010f20] text-sm leading-tight line-clamp-2 hover:text-[#dd9448]">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-sm font-bold text-[#010f20]">
            ${product.price?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[9px] ${product.stock > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {product.stock > 0 ? 'En stock' : 'Agotado'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;