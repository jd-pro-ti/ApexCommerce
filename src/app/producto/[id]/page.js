'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const result = await productService.getPublicProductById(productId);
      
      if (result.success && result.product) {
        setProduct(result.product);
        setSelectedImage(0);
        
        const relatedResult = await productService.getPublicProducts({
          category: result.product.category,
          limit: 5
        });

        if (relatedResult.success) {
          const filtered = relatedResult.products.filter(p => p.id !== result.product.id);
          setRelatedProducts(filtered);
        }
      } else {
        setError('Producto no encontrado');
      }
    } catch (error) {
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) return router.push('/login?redirect=/producto/' + productId);
    setAddingToCart(true);
    for (let i = 0; i < quantity; i++) addToCart(product);
    setTimeout(() => {
      setAddingToCart(false);
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 3000);
    }, 600);
  };

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  // Función para renderizar las especificaciones
  const renderSpecifications = () => {
    if (!product?.specifications || Object.keys(product.specifications).length === 0) {
      return null;
    }

    return (
      <div className="mt-8 border-t border-gray-100 pt-8">
        <h2 className="text-lg font-extrabold mb-4 uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Especificaciones técnicas
        </h2>
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            {Object.entries(product.specifications).map(([key, value], index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-4 ${
                  index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/50'
                }`}
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {key}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><LoadingSpinner size="lg" /></div>;

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <h1 className="text-2xl font-bold mb-4 text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>Producto no encontrado</h1>
      <Link href="/catalogo"><Button className="bg-slate-900 text-white rounded-xl">Volver al catálogo</Button></Link>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-20 text-slate-900 bg-white relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* TOAST FLOTANTE */}
      {showAddedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold tracking-wider uppercase">¡Producto agregado al carrito!</span>
        </div>
      )}

      {/* BREADCRUMBS */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
        <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-slate-900 transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* TARJETA PRINCIPAL (3 Columnas compactas y equilibradas) */}
      <div className="bg-white border border-gray-200/90 rounded-3xl shadow-sm p-6 sm:p-8 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* COLUMNA IZQUIERDA: Miniaturas + Imagen Principal (Compacto) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
            {product.images?.length > 0 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[400px] scrollbar-none py-1 order-2 sm:order-1">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)} 
                    className={`w-14 h-14 rounded-xl overflow-hidden border transition-all flex-shrink-0 bg-gray-50 ${
                      selectedImage === idx ? 'border-slate-900 shadow-md ring-1 ring-slate-900' : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 bg-white rounded-2xl h-[380px] sm:h-[400px] flex items-center justify-center overflow-hidden relative order-1 sm:order-2 border border-gray-100">
              {product.images?.[selectedImage] ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-4xl opacity-30">📦</div>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <span className="absolute top-3 left-3 bg-[#dd9448] text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-sm">
                  ¡Última unidad!
                </span>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Información y Controles de Compra Integrados */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full pt-1">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {product.category || 'General'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Stock disponible ({product.stock})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400 text-xs">★★★★★</div>
                <span className="text-[11px] text-slate-400">(4.9)</span>
              </div>

              <div className="mb-5">
                <div className="text-3xl font-light text-slate-900">
                  ${product.price?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} 
                  <span className="text-xs font-semibold text-slate-400 ml-1">MXN</span>
                </div>
                <span className="text-[10px] text-slate-400">IVA incluido</span>
              </div>

              {/* Selector de cantidad y Botón de compra compactos */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Cantidad:</span>
                  <div className="flex items-center border border-gray-200 w-28 rounded-xl bg-gray-50 overflow-hidden shadow-inner">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      disabled={product.stock <= 0}
                      className="px-3 py-1.5 hover:bg-gray-200 transition-colors text-slate-700 font-bold disabled:opacity-50 text-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold text-slate-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} 
                      disabled={product.stock <= 0 || quantity >= product.stock}
                      className="px-3 py-1.5 hover:bg-gray-200 transition-colors text-slate-700 font-bold disabled:opacity-50 text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAddToCart} 
                  disabled={addingToCart || product.stock <= 0}
                  className="w-full bg-slate-950 text-white py-3.5 px-6 uppercase tracking-widest text-xs font-extrabold hover:bg-slate-800 transition-all rounded-2xl shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {addingToCart ? (
                    <span>Agregando...</span>
                  ) : product.stock > 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Agregar al carrito</span>
                    </>
                  ) : (
                    'Agotado'
                  )}
                </button>
              </div>
            </div>

            {/* Info rápida en la tarjeta */}
            <div className="text-[11px] text-slate-500 space-y-1.5 pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span>Envío rápido disponible a todo México</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* SECCIÓN DESCRIPCIÓN Y ACORDEONES */}
      <div className="max-w-4xl border-t border-gray-100 pt-12">
        <h2 className="text-lg font-extrabold mb-3 uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Descripción del producto
        </h2>
        <p className="text-slate-600 leading-relaxed text-sm mb-8">
          {product.description || 'Sin descripción detallada disponible.'}
        </p>

        {/* SECCIÓN DE ESPECIFICACIONES TÉCNICAS */}
        {renderSpecifications()}

        <div className="border-t border-gray-200 mt-8">
          {[
            { id: 'detalles', title: 'Detalles del producto', content: 'Diseñado bajo los más altos estándares de calidad. Producto original garantizado.' },
            { id: 'materiales', title: 'Materiales y componentes', content: 'Fabricado con materiales seleccionados de alta durabilidad y rendimiento óptimo.' },
            { id: 'envio', title: 'Garantía y devoluciones', content: 'Cuentas con 30 días de garantía directa y soporte técnico ante cualquier eventualidad.' }
          ].map((item) => (
            <div key={item.id} className="border-b border-gray-200">
              <button 
                onClick={() => toggleAccordion(item.id)}
                className="w-full py-4 flex justify-between items-center text-left hover:text-[#dd9448] transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {item.title}
                </span>
                <svg 
                  className={`w-4 h-4 text-slate-400 transform transition-transform duration-300 ${openAccordion === item.id ? 'rotate-180 text-slate-900' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openAccordion === item.id && (
                <div className="pb-4 text-xs text-slate-500 leading-relaxed">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTOS RELACIONADOS */}
      <div className="mt-20 border-t border-gray-100 pt-12">
        <h3 className="text-xl font-black mb-6 text-slate-900 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Productos relacionados
        </h3>

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-xs italic">No hay más productos disponibles en esta categoría.</p>
        )}
      </div>

    </div>
  );
}