'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { MOCK_PRODUCTS } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_PRODUCTS.find(p => p.id === id);
      setProduct(found || null);
      setLoading(false);
    }, 400);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
        <p className="text-gray-600 mb-6">El producto que buscas no existe o ha sido eliminado</p>
        <Link href="/catalogo">
          <Button>Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/catalogo" className="text-blue-600 hover:text-blue-700">
          ← Volver al catálogo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen del producto */}
        <div>
          <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-8xl">📦</span>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i - 1)}
                className={`w-20 h-20 rounded-lg border-2 ${
                  selectedImage === i - 1 ? 'border-blue-600' : 'border-gray-200'
                } bg-gray-100 flex items-center justify-center`}
              >
                <span className="text-2xl">📦</span>
              </button>
            ))}
          </div>
        </div>

        {/* Información del producto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
              {product.category}
            </span>
            <span className="flex items-center text-yellow-500">
              ⭐ {product.rating || 4.5}
            </span>
            <span className="text-gray-500">{product.seller}</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mb-4">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.description || 'Descripción del producto no disponible.'}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {product.stock > 0 ? `✅ ${product.stock} disponibles` : '❌ Agotado'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
                disabled={product.stock === 0}
              >
                -
              </button>
              <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 hover:bg-gray-100"
                disabled={product.stock === 0 || quantity >= product.stock}
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="flex-1"
            >
              🛒 Agregar al carrito
            </Button>
          </div>

          <Card className="p-4 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-medium">PRD-{String(product.id).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoría:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendedor:</span>
                <span className="font-medium">{product.seller}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sección de reseñas */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reseñas</h2>
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">María García</span>
                  <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-gray-600 text-sm">Excelente producto, muy recomendado.</p>
                <p className="text-xs text-gray-400">Hace 2 días</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                J
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Juan Pérez</span>
                  <span className="text-yellow-500">⭐⭐⭐⭐</span>
                </div>
                <p className="text-gray-600 text-sm">Buena calidad, el envío fue rápido.</p>
                <p className="text-xs text-gray-400">Hace 5 días</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}