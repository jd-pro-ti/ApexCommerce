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
import { ArrowLeft, ShoppingBag, Zap, Check, ChevronDown, Package, Star, UserRound, Send } from 'lucide-react';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
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
  const [reviews, setReviews] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [reviewForm, setReviewForm] = useState({ orderItemId: '', rating: 5, title: '', comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  const loadProduct = async () => {
    setLoading(true);
    try {
      const result = await productService.getPublicProductById(productId);
      
      if (result.success && result.product) {
        setProduct(result.product);
        setSelectedImage(0);

        const reviewsResult = await productService.getProductReviews(productId);
        if (reviewsResult.success) setReviews(reviewsResult.reviews);

        if (user?.id) {
          const ordersResult = await productService.getEligibleProductOrders(productId, user.id);
          if (ordersResult.success) {
            setEligibleOrders(ordersResult.orders);
            setReviewForm(prev => ({
              ...prev,
              orderItemId: prev.orderItemId || ordersResult.orders[0]?.id || ''
            }));
          }
        }
        
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

  useEffect(() => {
    // Data loading updates this component after the asynchronous request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (productId) loadProduct();
    // loadProduct intentionally reloads when the authenticated user becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewMessage('');

    if (!isAuthenticated || !user?.id) {
      router.push('/login?redirect=/producto/' + productId);
      return;
    }

    const selectedOrder = eligibleOrders.find(order => order.id === reviewForm.orderItemId);
    if (!selectedOrder) {
      setReviewMessage('Necesitas tener un pedido entregado para calificar este producto.');
      return;
    }

    setReviewLoading(true);
    const result = await productService.createProductReview({
      product_id: productId,
      user_id: user.id,
      order_id: selectedOrder.order_id,
      order_item_id: selectedOrder.id,
      rating: Number(reviewForm.rating),
      title: reviewForm.title,
      comment: reviewForm.comment
    });

    if (result.success) {
      setReviews(prev => [{ ...result.review, profiles: { name: user.name || 'Tú' } }, ...prev]);
      setReviewForm(prev => ({ ...prev, title: '', comment: '' }));
      setReviewMessage('Tu reseña fue publicada correctamente.');
    } else {
      setReviewMessage(result.error || 'No se pudo publicar la reseña.');
    }
    setReviewLoading(false);
  };

  const renderStars = (value, size = 'w-4 h-4') => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} className={`${size} ${star <= Math.round(Number(value) || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  );

  const handleAddToCart = () => {
    if (!isAuthenticated) return router.push('/login?redirect=/producto/' + productId);
    setAddingToCart(true);
    
    // Agregamos una sola vez con la cantidad seleccionada (evitando bucles de inserción individual)
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setTimeout(() => {
      setAddingToCart(false);
      setShowAddedToast(true);
      setTimeout(() => setShowAddedToast(false), 3000);
    }, 600);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) return router.push('/login?redirect=/producto/' + productId);
    
    try {
      // Intentamos agregar el producto una vez (o las veces de la cantidad) 
      // El CartContext ya maneja si existe o no de manera local/remota
      for (let i = 0; i < quantity; i++) {
        await addToCart(product);
      }
    } catch (err) {
      console.log("Redirigiendo al carrito directamente por restricción existente.");
    }
    
    // Redirige de inmediato al carrito para finalizar la compra
    router.push('/carrito');
  };

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const renderSpecifications = () => {
    if (!product?.specifications || Object.keys(product.specifications).length === 0) {
      return null;
    }

    return (
      <div className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-sm font-bold mb-5 uppercase tracking-wider text-slate-900">
          Especificaciones técnicas
        </h2>
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {Object.entries(product.specifications).map(([key, value], index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-5 ${
                  index % 2 === 0 ? 'bg-white/60' : 'bg-slate-50/60'
                }`}
              >
                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-800" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <div className="w-18 h-18 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-5 text-slate-500">
          <Package className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Producto no encontrado</h2>
        <p className="text-slate-600 text-base mb-8">El producto que buscas no existe o ya no está disponible.</p>
        <Link 
          href="/catalogo" 
          className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 text-slate-800 bg-white relative" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      
      {/* TOAST FLOTANTE */}
      {showAddedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
          <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
          <span className="text-sm font-semibold tracking-wide">¡Producto agregado al carrito!</span>
        </div>
      )}

      {/* BREADCRUMBS */}
      <nav className="flex items-center gap-2.5 text-sm text-slate-500 mb-6 font-medium">
        <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-slate-900 transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[250px]">{product.name}</span>
      </nav>

      {/* TARJETA PRINCIPAL */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 sm:p-10 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

          {/* COLUMNA IZQUIERDA: Miniaturas + Imagen Principal */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4">
            {product.images?.length > 0 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px] scrollbar-none py-1 order-2 sm:order-1">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)} 
                    className={`w-20 h-20 rounded-xl overflow-hidden border transition-all flex-shrink-0 bg-slate-50 ${
                      selectedImage === idx ? 'border-slate-900 shadow-xs ring-2 ring-slate-900/10' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 bg-slate-50/70 rounded-2xl h-[420px] sm:h-[500px] flex items-center justify-center overflow-hidden relative order-1 sm:order-2 border border-slate-200/60">
              {product.images?.[selectedImage] ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-6 transition-transform duration-500 hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package className="w-14 h-14 stroke-[1.5]" />
                </div>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                  ¡Últimas unidades!
                </span>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Información y Botones */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full py-1">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                  {product.category || 'General'}
                </span>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  product.stock > 0 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {product.stock > 0 ? `Stock disponible (${product.stock})` : 'Agotado'}
                </span>
              </div>

              {product.seller_id && (
                <Link
                  href={`/vendedor/${product.seller_id}`}
                  className="-mt-3 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-amber-700"
                >
                  <UserRound className="h-4 w-4 text-amber-600" />
                  <span>Vendido por: <span className="font-bold text-slate-900">{product.profiles?.name || 'Ver vendedor'}</span></span>
                </Link>
              )}

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>
                <div className="hidden">
                  <div className="flex text-amber-400 text-sm">★★★★★</div>
                  <span className="text-xs text-slate-500 font-semibold">(4.9 Reseñas)</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {renderStars(product.rating_avg)}
                <span className="text-xs font-semibold text-slate-600">
                  {Number(product.rating_avg || 0).toFixed(1)} ({product.rating_count || 0} reseñas)
                </span>
              </div>

              {product.profiles?.id && (
                <Link href={`/vendedor/${product.profiles.id}`} className="hidden">
                  {product.profiles.avatar_url ? (
                    <img src={product.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500"><UserRound className="h-5 w-5" /></span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendido por</span>
                    <span className="block truncate text-sm font-bold text-slate-900">{product.profiles.name || 'Vendedor'}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-700">Ver vendedor →</span>
                </Link>
              )}

              <div className="pt-3 pb-2 border-t border-slate-100">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  ${product.price?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} 
                  <span className="text-sm font-bold text-slate-500 ml-1.5">MXN</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Impuestos incluidos</span>
              </div>

              {/* Selector de cantidad y Botones de acción */}
              <div className="space-y-5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-800">Cantidad:</span>
                  <div className="flex items-center border border-slate-300 w-36 rounded-xl bg-slate-50 overflow-hidden shadow-xs">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      disabled={product.stock <= 0}
                      className="px-4 py-2.5 hover:bg-slate-200 transition-colors text-slate-800 font-bold disabled:opacity-40 text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-sm font-bold text-slate-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} 
                      disabled={product.stock <= 0 || quantity >= product.stock}
                      className="px-4 py-2.5 hover:bg-slate-200 transition-colors text-slate-800 font-bold disabled:opacity-40 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Botonera de compra */}
                <div className="space-y-3 pt-2">
                  <button 
                    onClick={handleBuyNow} 
                    disabled={product.stock <= 0}
                    className="w-full bg-slate-900 text-white py-4 px-6 uppercase tracking-wider text-xs font-bold hover:bg-slate-800 transition-all rounded-xl shadow-md cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Comprar ahora</span>
                  </button>

                  <button 
                    onClick={handleAddToCart} 
                    disabled={addingToCart || product.stock <= 0}
                    className="w-full bg-white text-slate-900 border-2 border-slate-300 py-3.5 px-6 uppercase tracking-wider text-xs font-bold hover:bg-slate-50 transition-all rounded-xl shadow-xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                  >
                    {addingToCart ? (
                      <span>Agregando...</span>
                    ) : product.stock > 0 ? (
                      <>
                        <ShoppingBag className="w-4 h-4 stroke-[2]" />
                        <span>Agregar al carrito</span>
                      </>
                    ) : (
                      'Agotado'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Info rápida inferior */}
            <div className="text-xs text-slate-600 space-y-2 pt-6 mt-6 border-t border-slate-100 font-medium">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Envío seguro disponible a todo México</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* SECCIÓN DESCRIPCIÓN Y ACORDEONES */}
      <div className="max-w-3xl border-t border-slate-200 pt-12">
        <h2 className="text-base font-bold mb-4 uppercase tracking-wider text-slate-900">
          Descripción del producto
        </h2>
        <p className="text-slate-700 leading-relaxed text-base mb-10">
          {product.description || 'Sin descripción detallada disponible.'}
        </p>

        {/* SECCIÓN DE ESPECIFICACIONES TÉCNICAS */}
        {renderSpecifications()}

        <div className="border-t border-slate-200 mt-10">
          {[
            { id: 'detalles', title: 'Detalles del producto', content: 'Diseñado bajo los más altos estándares de calidad. Producto original garantizado.' },
            { id: 'materiales', title: 'Materiales y componentes', content: 'Fabricado con materiales seleccionados de alta durabilidad y rendimiento óptimo.' },
            { id: 'envio', title: 'Garantía y devoluciones', content: 'Cuentas con 30 días de garantía directa y soporte técnico ante cualquier eventualidad.' }
          ].map((item) => (
            <div key={item.id} className="border-b border-slate-200">
              <button 
                onClick={() => toggleAccordion(item.id)}
                className="w-full py-5 flex justify-between items-center text-left hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {item.title}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${openAccordion === item.id ? 'rotate-180 text-slate-900' : ''}`} />
              </button>
              {openAccordion === item.id && (
                <div className="pb-5 text-sm text-slate-600 leading-relaxed font-normal">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RESEÑAS DEL PRODUCTO */}
      <section className="mt-20 border-t border-slate-200 pt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Opiniones de clientes</h2>
            <p className="mt-1 text-sm text-slate-500">Experiencias de personas que compraron este producto.</p>
          </div>
          <div className="flex items-center gap-2">{renderStars(product.rating_avg, 'w-5 h-5')}<span className="font-bold text-slate-900">{Number(product.rating_avg || 0).toFixed(1)}</span></div>
        </div>

        {isAuthenticated && eligibleOrders.length > 0 && (
          <form onSubmit={handleReviewSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Califica tu compra</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Pedido
                <select value={reviewForm.orderItemId} onChange={event => setReviewForm({ ...reviewForm, orderItemId: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                  {eligibleOrders.map(order => <option key={order.id} value={order.id}>{order.orders?.order_number || order.order_id}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Calificación
                <select value={reviewForm.rating} onChange={event => setReviewForm({ ...reviewForm, rating: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                  {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} estrellas</option>)}
                </select>
              </label>
            </div>
            <input value={reviewForm.title} onChange={event => setReviewForm({ ...reviewForm, title: event.target.value })} placeholder="Título de tu opinión (opcional)" className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <textarea value={reviewForm.comment} onChange={event => setReviewForm({ ...reviewForm, comment: event.target.value })} placeholder="Cuéntanos qué te pareció..." rows="3" className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">Solo puedes calificar productos de pedidos entregados.</p>
              <Button type="submit" loading={reviewLoading} className="shrink-0"><Send className="mr-2 h-4 w-4" />Publicar</Button>
            </div>
            {reviewMessage && <p className="mt-3 text-sm text-slate-600">{reviewMessage}</p>}
          </form>
        )}

        {!isAuthenticated && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Inicia sesión después de comprar para dejar una opinión.</p>}
        {isAuthenticated && eligibleOrders.length === 0 && <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Podrás calificar este producto cuando tu pedido haya sido entregado.</p>}

        <div className="mt-8 space-y-4">
          {reviews.length === 0 ? <p className="text-sm italic text-slate-500">Todavía no hay opiniones para este producto.</p> : reviews.map(review => (
            <article key={review.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-bold text-slate-900">{review.profiles?.name || 'Cliente'}</p>{renderStars(review.rating)}</div>
                <time className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('es-MX')}</time>
              </div>
              {review.title && <h3 className="mt-3 font-bold text-slate-900">{review.title}</h3>}
              {review.comment && <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
            </article>
          ))}
        </div>
      </section>

      {/* PRODUCTOS RELACIONADOS */}
      <div className="mt-20 border-t border-slate-200 pt-12">
        <h3 className="text-2xl font-bold mb-6 text-slate-900 tracking-tight">
          Productos relacionados
        </h3>

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">No hay más productos disponibles en esta categoría.</p>
        )}
      </div>

    </div>
  );
}
