'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Catalogo() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'recent'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    // Cargar categoría desde URL
    const categoryParam = searchParams.get('categoria');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
      // Recargar productos con el filtro
      setTimeout(() => loadProducts(), 100);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const result = await productService.getCategoriesWithCount();
      console.log('📊 Categorías cargadas:', result);
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    setDebug(null);
    try {
      console.log('🔍 Cargando productos con filtros:', filters);
      
      const result = await productService.getPublicProducts({
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        sortBy: filters.sortBy
      });

      console.log('📦 Resultado:', result);
      
      if (result.success) {
        setProducts(result.products || []);
        setDebug({
          count: result.products?.length || 0,
          filters: filters
        });
      } else {
        setError(result.error || 'Error al cargar productos');
        setDebug({ error: result.error });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al cargar productos');
      setDebug({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Catálogo de Productos</h1>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && debug && (
        <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono">
          <details>
            <summary className="cursor-pointer font-semibold">🔍 Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Buscar productos..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              icon="🔍"
            />
          </div>
          <div>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              name="minPrice"
              placeholder="Precio min"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="w-1/2 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Precio max"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="w-1/2 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Button variant="outline" size="sm" onClick={handleSearch}>
            Aplicar filtros
          </Button>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-4 text-gray-600">
        {products.length} productos encontrados
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-600">
            Intenta con otros términos de búsqueda o categorías
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}