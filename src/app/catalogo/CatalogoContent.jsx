'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ShoppingBag, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

const PRODUCTS_PER_PAGE = 12;

export default function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false); // Estado para abrir/cerrar filtros en móvil

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'recent'
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (user.role === 'admin') {
        router.push('/dashboard/admin?redirect=/catalogo');
        return;
      }
      if (user.role === 'vendedor') {
        router.push('/dashboard/vendedor?redirect=/catalogo');
        return;
      }
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('categoria') || searchParams.get('category') || 'all';

    setFilters(prev => ({
      ...prev,
      search: searchParam,
      category: categoryParam
    }));

    setCurrentPage(1);

    const timer = setTimeout(() => {
      loadProducts(searchParam, categoryParam, filters.minPrice, filters.maxPrice, filters.sortBy);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const result = await productService.getCategoriesWithCount();
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async (searchVal, catVal, minP, maxP, sortVal) => {
    setLoading(true);
    try {
      const filterParams = {
        search: searchVal || undefined,
        sortBy: sortVal || 'recent'
      };

      if (catVal && catVal !== 'all') {
        filterParams.category = catVal;
      }

      if (minP && parseFloat(minP) >= 0) {
        filterParams.minPrice = parseFloat(minP);
      }

      if (maxP && parseFloat(maxP) >= 0) {
        filterParams.maxPrice = parseFloat(maxP);
      }

      const result = await productService.getPublicProducts(filterParams);

      if (result.success) {
        setProducts(result.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    loadProducts(newFilters.search, newFilters.category, newFilters.minPrice, newFilters.maxPrice, newFilters.sortBy);
  };

  const handleCategorySelect = (categoryName) => {
    const newFilters = { ...filters, category: categoryName };
    setFilters(newFilters);
    setCurrentPage(1);
    loadProducts(newFilters.search, categoryName, filters.minPrice, filters.maxPrice, filters.sortBy);
    setShowFiltersMobile(false); // Cierra el menú de filtros en móvil al seleccionar uno
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const newFilters = { ...filters, sortBy: newSort };
    setFilters(newFilters);
    setCurrentPage(1);
    loadProducts(newFilters.search, newFilters.category, newFilters.minPrice, newFilters.maxPrice, newSort);
  };

  const resetFilters = () => {
    const reset = { search: '', category: 'all', minPrice: '', maxPrice: '', sortBy: 'recent' };
    setFilters(reset);
    setCurrentPage(1);
    loadProducts('', 'all', '', '', 'recent');
  };

  const totalProducts = categories.reduce((acc, cat) => acc + cat.count, 0);
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Componente reutilizable para el contenido de los filtros
  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Categoría
        </h3>
        {(filters.category !== 'all' || filters.minPrice || filters.maxPrice || filters.search) && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-amber-700 hover:underline transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
        <button
          onClick={() => handleCategorySelect('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${filters.category === 'all'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
            }`}
        >
          <span>Todos los productos</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md ${filters.category === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
            }`}>
            {totalProducts}
          </span>
        </button>

        {loadingCategories ? (
          <div className="text-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategorySelect(cat.name)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize text-left ${filters.category === cat.name
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
                }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${filters.category === cat.name ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                }`}>
                {cat.count}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-200/60 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Precio (MXN)
        </h3>
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            type="number"
            placeholder="Mín"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="w-1/2 p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900"
            min="0"
          />
          <input
            name="maxPrice"
            type="number"
            placeholder="Máx"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="w-1/2 p-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900"
            min="0"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200/60 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Ordenar por
        </h3>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleSortChange}
          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer"
        >
          <option value="recent">Más recientes</option>
          <option value="price-asc">Menor precio</option>
          <option value="price-desc">Mayor precio</option>
          <option value="name">Alfabético A-Z</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto text-slate-800" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* Botón de Filtros para Móvil (Solo visible en pantallas pequeñas) */}
      <div className="lg:hidden flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <button
          onClick={() => setShowFiltersMobile(true)}
          className="flex items-center gap-2 text-xs font-bold text-slate-900 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          Filtrar y Ordenar
        </button>
      </div>

      {/* Modal / Drawer de Filtros para Móvil */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Filtros
                </h2>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltersContent />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowFiltersMobile(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Ver resultados ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* PANEL DE FILTROS LATERAL (Escritorio - 3 cols) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
          <FiltersContent />
        </aside>

        {/* GRILLA DE PRODUCTOS PRINCIPAL (9 cols) */}
        <main className="lg:col-span-9 space-y-8">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No se encontraron productos
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Intenta ajustando los filtros o seleccionando otra categoría.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <>
              <div className="hidden lg:flex justify-between items-center">
              </div>

              {/* Grilla: 2 columnas en móvil (grid-cols-2) y hasta 4 en desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* PAGINACIÓN NUMÉRICA */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center pt-8 border-t border-slate-100 gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${currentPage === page
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}