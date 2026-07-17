'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard'; // Asegúrate de importar tu componente

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]); // Nuevo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const result = await productService.getPublicProductById(productId);
      
      if (result.success && result.product) {
        setProduct(result.product);
        
        // Cargar relacionados usando la misma lógica de filtros del catálogo
        const relatedResult = await productService.getPublicProducts({
          category: result.product.category,
          limit: 4 // Opcional: limita la cantidad si tu servicio lo permite
        });

        if (relatedResult.success) {
          // Filtramos para no mostrar el producto actual en la lista de relacionados
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
    setTimeout(() => setAddingToCart(false), 1000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Producto no encontrado</h1>
      <Link href="/catalogo"><Button>Volver al catálogo</Button></Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* COLUMNA IZQUIERDA: Galería + Descripción + Acordeones */}
        <div className="lg:col-span-7 space-y-12">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-16 h-16 border ${selectedImage === idx ? 'border-slate-900' : 'border-gray-200'}`}>
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg h-[400px] flex items-center justify-center">
              <img src={product.images[selectedImage]} alt={product.name} className="max-h-full p-8 object-contain" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Descripción</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            <div className="border-t border-gray-200">
              {['DETALLES', 'MATERIALES', 'ENVÍO'].map((section) => (
                <div key={section} className="border-b border-gray-200 py-5 flex justify-between items-center cursor-pointer">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{section}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Caja de compra fija */}
        <div className="lg:col-span-5">
          <div className="border border-gray-200 rounded-xl p-8 shadow-sm sticky top-28 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#dd9448]">{product.category}</span>
            <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>{product.name}</h1>
            <div className="text-4xl font-light text-slate-900 mb-8">${product.price.toFixed(2)}</div>

            <div className="mb-8">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-3 block">Cantidad</label>
              <div className="flex items-center border border-gray-300 w-32 rounded">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-50">-</button>
                <span className="flex-1 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-gray-50">+</button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <button onClick={handleAddToCart} className="w-full bg-slate-950 text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-slate-800 transition-all rounded">
                {addingToCart ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>

            <div className="text-xs text-gray-500 space-y-3 pt-6 border-t">
              <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Envío rápido</div>
              <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Compra protegida</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN RELACIONADOS CORREGIDA */}
      <div className="mt-2 border-t border-gray-100 pt-16">
        <h3 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>Productos relacionados</h3>

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay productos relacionados en esta categoría.</p>
        )}
      </div>
    </div>
  );
}