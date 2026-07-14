'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Button from './Button';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setShowAdded(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(false);
    }, 2000);
  };

  const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <Link href={`/producto/${product.id}`}>
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl">📦</span>
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              ¡Últimas unidades!
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Agotado
            </span>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/producto/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
            {truncateText(product.name, 40)}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
            {product.category}
          </span>
          <span className="flex items-center gap-1">
            ⭐ {product.rating || 4.5}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.seller && (
            <span className="text-sm text-gray-500">
              {product.seller}
            </span>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className="w-full"
          variant={product.stock === 0 ? 'secondary' : 'primary'}
          size="sm"
        >
          {isAdding ? 'Agregando...' : showAdded ? '✅ Agregado' : '🛒 Agregar al carrito'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;