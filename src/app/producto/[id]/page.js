'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const productId = params.id;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await productService.getPublicProductById(productId);
      if (result.success && result.product) {
        setProduct(result.product);
        // Verificar si el producto tiene imágenes
        if (result.product.images && result.product.images.length > 0) {
          setSelectedImage(0);
        }
      } else {
        setError('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/producto/' + productId);
      return;
    }
    
    if (product.stock <= 0) return;
    
    setAddingToCart(true);
    // Agregar al carrito con la cantidad seleccionada
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setTimeout(() => {
      setAddingToCart(false);
    }, 1000);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= (product?.stock || 10)) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (product?.stock || 10)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          {error || 'El producto que buscas no existe o ha sido eliminado'}
        </p>
        <Link href="/catalogo">
          <Button size="lg">Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Migas de pan */}
      <nav className="flex text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div>
          <div className="bg-gray-100 rounded-xl overflow-hidden h-96 mb-4">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">📦</span>
              </div>
            )}
          </div>
          
          {/* Miniaturas */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
                {product.category}
              </span>
              {product.featured && (
                <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm">
                  ⭐ Destacado
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm ${
                product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {product.stock > 0 ? '✓ Disponible' : '❌ Agotado'}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            
            {product.profiles && (
              <p className="text-sm text-gray-500 mt-1">
                Vendido por: <span className="font-medium">{product.profiles.name}</span>
              </p>
            )}
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚡ ¡Últimas {product.stock} unidades disponibles!
              </p>
            )}
            {product.stock > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Stock disponible: {product.stock} unidades
              </p>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Cantidad y compra */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    className="px-3 py-2 hover:bg-gray-100 rounded-l-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-16 text-center border-0 focus:ring-0 py-2"
                  />
                  <button
                    onClick={incrementQuantity}
                    className="px-3 py-2 hover:bg-gray-100 rounded-r-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  max. {product.stock}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="flex-1"
              size="lg"
            >
              {addingToCart ? 'Agregando...' : product.stock === 0 ? 'Agotado' : '🛒 Agregar al carrito'}
            </Button>
            {isAuthenticated && (
              <Button variant="outline" size="lg" className="px-6">
                ❤️
              </Button>
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Categoría</p>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <p className="text-gray-500">Estado</p>
                <p className="font-medium capitalize">{product.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Publicado</p>
                <p className="font-medium">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
              {product.profiles && (
                <div>
                  <p className="text-gray-500">Vendedor</p>
                  <p className="font-medium">{product.profiles.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Productos relacionados (opcional) */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center text-gray-500 py-8">
            Próximamente más productos relacionados
          </div>
        </div>
      </div>
    </div>
  );
}