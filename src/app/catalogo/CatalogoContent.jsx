'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

  // 1. Carga inicial de categorías
  useEffect(() => {
    loadCategories();
  }, []);

  // 2. Escucha cambios en la URL (Navbar search)
  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('categoria') || 'all';
    
    setFilters(prev => ({ ...prev, search: searchParam, category: categoryParam }));
    loadProducts(searchParam, categoryParam, filters.minPrice, filters.maxPrice);
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const result = await productService.getCategoriesWithCount();
      if (result.success) setCategories(result.categories);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadProducts = async (searchVal, catVal, minP, maxP) => {
    setLoading(true);
    try {
      const result = await productService.getPublicProducts({
        search: searchVal || undefined,
        category: catVal !== 'all' ? catVal : undefined,
        minPrice: minP ? parseFloat(minP) : undefined,
        maxPrice: maxP ? parseFloat(maxP) : undefined,
        sortBy: filters.sortBy
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
    loadProducts(newFilters.search, newFilters.category, newFilters.minPrice, newFilters.maxPrice);
  };

  const handleCategorySelect = (categoryName) => {
    setFilters(prev => ({ ...prev, category: categoryName }));
    loadProducts(filters.search, categoryName, filters.minPrice, filters.maxPrice);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-[#fdfdfd]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
        <aside className="space-y-8 lg:sticky lg:top-28 bg-white/40 p-6 rounded-2xl border border-white/20 shadow-sm">
          
          {/* Categorías */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Categorías</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={filters.category === 'all'} onChange={() => handleCategorySelect('all')} />
                <span className={`text-sm ${filters.category === 'all' ? 'font-bold' : ''}`}>Todas</span>
              </label>

              {categories.map(cat => (
                <label key={cat.name} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={filters.category === cat.name} onChange={() => handleCategorySelect(cat.name)} />
                  <span className="capitalize text-sm">{cat.name.toLowerCase()} ({cat.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Precios */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Precios</h3>
            <div className="flex gap-2">
              <input name="minPrice" placeholder="Mín" value={filters.minPrice} onChange={handleFilterChange} className="w-1/2 p-2 text-sm border rounded" />
              <input name="maxPrice" placeholder="Máx" value={filters.maxPrice} onChange={handleFilterChange} className="w-1/2 p-2 text-sm border rounded" />
            </div>
          </div>
        </aside>

        {/* Resultados */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </div>
    </div>
  );
}