'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const handleAddToCart = (e) => {
    // Evitamos que al dar clic al botón se active el Link al detalle del producto
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirigir al login
      return;
    }
    setIsAdding(true);
    addToCart(product);
    setShowAdded(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(false);
    }, 2000);
  };

  const truncateText = (text, maxLength = 50) => {
    return text?.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="group bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-[0_8px_30px_rgba(1,15,32,0.04)] hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(1,15,32,0.08)] transition-all duration-300 h-full flex flex-col overflow-hidden">
      
      {/* Contenedor de la Imagen con enlace */}
      <Link href={`/producto/${product.id}`}>
        <div className="relative aspect-[3/4] bg-[#f5f3f4] overflow-hidden flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#efedef]">
              <span className="text-4xl opacity-30">📦</span>
            </div>
          )}

          {/* ================= GLOBO BOTÓN FLOTANTE (Agregar al Carrito) ================= */}
          {product.stock > 0 && (
            <button 
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`absolute bottom-4 right-4 p-3.5 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md flex items-center justify-center
                ${
                  showAdded 
                    ? 'bg-emerald-600 text-white scale-95' 
                    : 'bg-[#010f20]/90 text-white border border-white/10 hover:bg-[#dd9448] hover:text-[#010f20] hover:scale-110 active:scale-95'
                }
                md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0`}
              title="Añadir al carrito"
            >
              {isAdding ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : showAdded ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Badges superiores con diseño del Hero */}
          {product.stock <= 5 && product.stock > 0 && (
            <span 
              className="absolute top-3 right-3 bg-[#dd9448] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Últimas unidades
            </span>
          )}
          
          {product.stock === 0 && (
            <span 
              className="absolute top-3 right-3 bg-[#44474c] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Agotado
            </span>
          )}
          
          {product.featured && (
            <span 
              className="absolute top-3 left-3 bg-[#010f20] text-[#dd9448] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              ✦ Destacado
            </span>
          )}
        </div>
      </Link>
      
      {/* Detalles del Cuerpo Inferior */}
      <div className="p-5 flex flex-col flex-1">
        
        {/* Categoría y Autor */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span 
            className="text-[11px] font-bold uppercase tracking-widest text-[#dd9448]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {product.category || 'Decoración'}
          </span>
          {product.profiles && (
            <span 
              className="text-[11px] text-[#44474c]/60 italic"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              por {product.profiles.name}
            </span>
          )}
        </div>

        {/* Nombre del Producto */}
        <Link href={`/producto/${product.id}`} className="mb-3 block">
          <h3 
            className="font-semibold text-[#010f20] hover:text-[#dd9448] transition-colors text-base tracking-tight leading-snug line-clamp-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {truncateText(product.name, 45)}
          </h3>
        </Link>
        
        {/* Precio e Indicador de Stock */}
        <div className="flex items-baseline justify-between mt-auto border-t border-[#010f20]/5 pt-3">
          <span 
            className="text-xl font-bold text-[#010f20]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
          
          {product.stock > 0 ? (
            <span 
              className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Disponible
            </span>
          ) : (
            <span 
              className="text-[11px] font-medium text-[#44474c]/40"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Sin Stock
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductCard;