'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await productService.getSellerProducts(user.id);
      if (result.success) {
        setProducts(result.products);
      } else {
        setError(result.error || 'Error al cargar productos');
      }
    } catch (error) {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const result = await productService.deleteProduct(selectedProduct.id);
      if (result.success) {
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        setShowDeleteModal(false);
        setSelectedProduct(null);
      } else {
        setError(result.error || 'Error al eliminar producto');
      }
    } catch (error) {
      setError('Error al eliminar producto');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      draft: 'bg-yellow-100 text-yellow-700'
    };
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona el catálogo de tu tienda</p>
        </div>
        <Link href="/dashboard/vendedor/productos/nuevo">
          <Button size="lg">
            ➕ Agregar Producto
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-6">
        <Input
          placeholder="Buscar productos por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon="🔍"
          className="max-w-md"
        />
      </div>

      {/* Grid de productos */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes productos
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza agregando tu primer producto a la tienda
          </p>
          <Link href="/dashboard/vendedor/productos/nuevo">
            <Button>Agregar Producto</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} hover className="overflow-hidden">
              <div className="relative">
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-6xl">📦</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.status)}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {product.name}
                  </h3>
                  <span className="font-bold text-blue-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description || 'Sin descripción'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>📂 {product.category}</span>
                  <span>📦 Stock: {product.stock}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/vendedor/productos/${product.id}/editar`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      ✏️ Editar
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDeleteModal(true);
                    }}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Eliminar Producto</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el producto ?
              Esta acción no se puede deshacer y eliminará todas las imágenes asociadas.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}