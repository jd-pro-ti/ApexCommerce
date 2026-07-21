'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Plus,
  Search,
  Package,
  FolderOpen,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

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
      active: 'bg-emerald-50 text-emerald-600',
      inactive: 'bg-gray-100 text-gray-700',
      draft: 'bg-amber-50 text-amber-600'
    };
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.draft}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8f9fa]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 md:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Botón de retorno independiente fuera de la tarjeta principal */}
        <div className="mb-6">
          <Link href="/dashboard/vendedor">
            <Button
              variant="outline"
              size="sm"
              className="border border-gray-200 hover:border-slate-800 bg-white text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-xl transition-all shadow-sm focus:ring-0 inline-flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" /> Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Cabecera de la sección */}
        <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span
              className="text-[10px] font-bold tracking-widest text-[#dd9448] uppercase block mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              GESTIÓN DE INVENTARIO
            </span>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#010f20] tracking-tight"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Mis Productos
            </h1>
            <p
              className="text-xs sm:text-sm text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Gestiona el catálogo de tu tienda y mantén tus productos actualizados.
            </p>
          </div>

          <Link href="/dashboard/vendedor/productos/nuevo" className="self-start sm:self-center">
            <Button
              className="!bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3 px-5 rounded-md transition-all tracking-wide uppercase shadow-sm focus:ring-0 flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Plus className="w-4 h-4" /> Agregar Producto
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Búsqueda */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Search className="w-4 h-4" />
            </span>
            <Input
              placeholder="Buscar productos por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
        </div>

        {/* Grid de productos */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#efedef] p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Package className="w-8 h-8" />
            </div>
            <h3
              className="text-lg font-bold text-[#010f20] mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              No tienes productos
            </h3>
            <p
              className="text-xs text-[#44474c]/70 mb-6 max-w-sm mx-auto"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Comienza agregando tu primer producto a la tienda para empezar a vender.
            </p>
            <Link href="/dashboard/vendedor/productos/nuevo">
              <Button
                className="!bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-2.5 px-5 rounded-md transition-all shadow-sm focus:ring-0"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Agregar Producto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#efedef] overflow-hidden shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative">
                    <div className="h-48 bg-[#fafbfc] overflow-hidden border-b border-[#efedef]">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3
                        className="font-bold text-[#010f20] text-sm sm:text-base truncate"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {product.name}
                      </h3>
                      <span
                        className="font-bold text-sm text-[#dd9448] shrink-0"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <p
                      className="text-xs text-[#44474c]/70 mb-4 line-clamp-2"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {product.description || 'Sin descripción'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#44474c]/60 pt-3 border-t border-[#efedef] mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> {product.category}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Package className="w-3.5 h-3.5 text-slate-400" /> Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex gap-2">
                    <Link href={`/dashboard/vendedor/productos/${product.id}/editar`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-1.5"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDeleteModal(true);
                      }}
                      className="!bg-red-50 hover:!bg-red-100 !text-red-600 border border-red-100 py-2.5 px-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-[#efedef]">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2
                className="text-xl font-bold text-[#010f20] mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Eliminar Producto
              </h2>
              <p
                className="text-xs sm:text-sm text-[#44474c]/70 mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ¿Estás seguro de que deseas eliminar <span className="font-semibold text-slate-900">{selectedProduct.name}</span>? Esta acción no se puede deshacer y eliminará todas las imágenes asociadas.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm focus:ring-0 cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border border-gray-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
    </div>
  );
}