'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ShoppingBag } from 'lucide-react';

export default function CatalogoContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'recent'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('categoria') || searchParams.get('category') || 'all';

    setFilters(prev => ({ ...prev, search: searchParam, category: categoryParam }));
    loadProducts(searchParam, categoryParam, filters.minPrice, filters.maxPrice, filters.sortBy);
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const result = await productService.getCategoriesWithCount();
      if (result.success) setCategories(result.categories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadProducts = async (searchVal, catVal, minP, maxP, sortVal) => {
    setLoading(true);
    try {
      const result = await productService.getPublicProducts({
        search: searchVal || undefined,
        category: catVal !== 'all' ? catVal : undefined,
        minPrice: minP ? parseFloat(minP) : undefined,
        maxPrice: maxP ? parseFloat(maxP) : undefined,
        sortBy: sortVal
      });

      if (result.success) setProducts(result.products || []);
    } catch (error) {
      console.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    loadProducts(newFilters.search, newFilters.category, newFilters.minPrice, newFilters.maxPrice, newFilters.sortBy);
  };

  const handleCategorySelect = (categoryName) => {
    const newFilters = { ...filters, category: categoryName };
    setFilters(newFilters);
    loadProducts(newFilters.search, categoryName, filters.minPrice, filters.maxPrice, filters.sortBy);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const newFilters = { ...filters, sortBy: newSort };
    setFilters(newFilters);
    loadProducts(newFilters.search, newFilters.category, newFilters.minPrice, newFilters.maxPrice, newSort);
  };

  const resetFilters = () => {
    const reset = { search: '', category: 'all', minPrice: '', maxPrice: '', sortBy: 'recent' };
    setFilters(reset);
    loadProducts('', 'all', '', '', 'recent');
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto text-slate-900">

      {/* CONTENIDO PRINCIPAL EN 2 COLUMNAS (FILTROS IZQUIERDA / GRILLA DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">

        {/* PANEL DE FILTROS LATERAL (ESTILO REFERENCIA: LIMPIO, CATEGORÍAS Y PRECIO) */}
        <aside className="space-y-8 lg:sticky lg:top-28">

          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Categoría
            </h3>
            {(filters.category !== 'all' || filters.minPrice || filters.maxPrice) && (
              <button onClick={resetFilters} className="text-xs font-bold text-amber-700 hover:underline">
                Limpiar
              </button>
            )}
          </div>

          {/* Lista de Categorías */}
          <div className="space-y-2">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${filters.category === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-gray-100'
                }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Todos los productos</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${filters.category === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'}`}>
                {categories.reduce((acc, cat) => acc + cat.count, 0)}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize text-left ${filters.category === cat.name
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-gray-100'
                  }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="truncate">{cat.name.toLowerCase()}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${filters.category === cat.name ? 'bg-white/20 text-white' : 'bg-gray-100 text-slate-500'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Rango de Precios */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Precio (MXN)
            </h3>
            <div className="flex items-center gap-2">
              <input
                name="minPrice"
                type="number"
                placeholder="Mín"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-1/2 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <input
                name="maxPrice"
                type="number"
                placeholder="Máx"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-1/2 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Ordenar por
            </h3>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleSortChange}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <option value="recent">Más recientes</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
          </div>

        </aside>

        {/* GRILLA DE PRODUCTOS PRINCIPAL */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : products.length === 0 ? (
            <Card className="bg-gray-50 border-gray-200 p-16 text-center shadow-none">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-900 mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                No se encontraron productos
              </h3>
              <p className="text-xs text-slate-500 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Intenta ajustando los filtros o seleccionando otra categoría.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md cursor-pointer"
              >
                Ver todos los productos
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}