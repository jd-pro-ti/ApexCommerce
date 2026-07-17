'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductCard from '@/components/ui/ProductCard';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    loadProducts();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('categoria');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
      setTimeout(() => loadProducts(), 100);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const result = await productService.getCategoriesWithCount();
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
    try {
      const result = await productService.getPublicProducts({
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        sortBy: filters.sortBy
      });

      if (result.success) {
        setProducts(result.products || []);
      } else {
        setError(result.error || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (categoryName) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === categoryName ? 'all' : categoryName
    }));
  };

  const handleApplyFilters = () => {
    loadProducts();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadProducts();
    }
  };

  if (loading) {
    return (
      /* pt-24 añadido aquí también para que el spinner no quede tapado por la Navbar durante la carga */
      <div className="min-h-screen pt-32 flex items-center justify-center bg-[#fdfdfd]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    /* pt-24 en móviles y pt-32 en pantallas grandes empuja el catálogo debajo de la Navbar fija */
    <div className="min-h-screen bg-[#fdfdfd] pt-28 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      
      {/* Cabecera del Catálogo */}
      <div className="mb-12 border-b border-[#efedef] pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        {/* <div>
          <h1 
            className="text-4xl font-semibold text-[#010f20] tracking-tight mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Los Esenciales
          </h1>
          <p 
            className="text-[#44474c]/70 text-sm max-w-xl"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Colección seleccionada de artículos de alto rendimiento diseñados para el estilo de vida moderno.
          </p>
        </div> */}

        {/* Ordenador superior */}
        <div className="flex items-center gap-3">
          <span 
            className="text-xs font-semibold text-[#44474c]/60 uppercase tracking-wider whitespace-nowrap"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ordenar por:
          </span>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={(e) => {
              handleFilterChange(e);
              setTimeout(() => loadProducts(), 50);
            }}
            className="px-5 py-2.5 bg-white rounded-full border border-[#efedef] text-xs font-semibold text-[#010f20] focus:outline-none focus:ring-1 focus:ring-[#dd9448] cursor-pointer shadow-sm hover:border-[#dd9448] transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <option value="recent">Más populares</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Grid: Sidebar + Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
        
        {/* ================= BARRA LATERAL DE FILTROS ================= */}
        <aside className="space-y-8 lg:sticky lg:top-28 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-sm">
          
          {/* Búsqueda por Texto */}
          <div>
            <h3 
              className="text-xs font-bold text-[#010f20] uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Buscar
            </h3>
            <div className="relative">
              <Input
                placeholder="Escribe para buscar..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
                className="border-[#efedef] text-sm focus:ring-[#dd9448] focus:border-[#dd9448] w-full"
              />
            </div>
          </div>

          {/* Categorías (Estilo Checkbox) */}
          <div>
            <h3 
              className="text-xs font-bold text-[#010f20] uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Categorías
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group text-sm text-[#44474c] hover:text-[#010f20] transition-colors">
                <input
                  type="checkbox"
                  checked={filters.category === 'all'}
                  onChange={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                  className="rounded border-[#efedef] text-[#010f20] focus:ring-[#dd9448] h-4 w-4"
                />
                <span className={filters.category === 'all' ? 'font-semibold text-[#010f20]' : ''}>
                  Todas las categorías
                </span>
              </label>

              {categories.map(cat => (
                <label 
                  key={cat.name} 
                  className="flex items-center gap-3 cursor-pointer group text-sm text-[#44474c] hover:text-[#010f20] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.category === cat.name}
                    onChange={() => handleCategorySelect(cat.name)}
                    className="rounded border-[#efedef] text-[#010f20] focus:ring-[#dd9448] h-4 w-4 cursor-pointer"
                  />
                  <span className={`capitalize whitespace-nowrap ${filters.category === cat.name ? 'font-semibold text-[#010f20]' : ''}`}>
                    {cat.name.toLowerCase()} <span className="text-xs text-[#44474c]/50">({cat.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rango de Precios */}
          <div>
            <h3 
              className="text-xs font-bold text-[#010f20] uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Rango de Precios
            </h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                name="minPrice"
                placeholder="Mín"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-1/2 px-4 py-2.5 text-xs rounded-lg border border-[#efedef] focus:outline-none focus:ring-1 focus:ring-[#dd9448] text-[#010f20] bg-white"
              />
              <span className="text-[#44474c]/40">-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Máx"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-1/2 px-4 py-2.5 text-xs rounded-lg border border-[#efedef] focus:outline-none focus:ring-1 focus:ring-[#dd9448] text-[#010f20] bg-white"
              />
            </div>
          </div>

          {/* Botón Aplicar Filtros (Con padding ampliado py-3.5 para que no se desborde el texto) */}
          <button
            onClick={handleApplyFilters}
            className="w-full bg-[#010f20] hover:bg-[#dd9448] hover:text-[#010f20] text-white text-xs font-bold uppercase tracking-widest py-3.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Aplicar Filtros
          </button>
        </aside>

        {/* ================= SECCIÓN DERECHA (GRID DE PRODUCTOS) ================= */}
        <div className="lg:col-span-3">
          
          <div className="mb-6 text-xs text-[#44474c]/60 uppercase tracking-widest font-semibold">
            {products.length} Productos Encontrados
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-2xl border border-[#efedef] flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-[#44474c]/40 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <h3 
                className="text-lg font-semibold text-[#010f20] mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                No se encontraron productos
              </h3>
              <p className="text-sm text-[#44474c]/70">
                Intenta ajustando tus filtros o usando otros términos de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}