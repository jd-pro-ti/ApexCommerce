'use client';
import { useState , useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useOrders } from '@/context/OrderContext';
import Alert from '@/components/ui/Alert';

export default function CartPage() {
  const router = useRouter();
  const { cart, total, itemsCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const { createOrder, loading: orderLoading } = useOrders();

  const subtotal = total;
  const shipping = subtotal > 150 ? 0 : 19.99;
  const tax = 0.00;
  const grandTotal = subtotal + shipping + tax;

  useEffect(() => {
    // Verificar autenticación
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/carrito');
      return;
    }
    if (user.role === 'admin'){
      router.push('/dashboard/admin?redirect=/carrito');
      return;
    }
    if (user.role === 'vendedor'){
      router.push('/dashboard/vendedor?redirect=/carrito');
      return;
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const handlePreCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmCheckout = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const cartItems = cart.map(item => ({
        id: item.id,
        quantity: item.quantity
      }));

      const result = await createOrder({
        cart_items: cartItems,
        notes: ''
      });

      if (result.success) {
        // Pedido creado correctamente: mostrar pantalla de confirmación, limpiar carrito y mostrar toast informativo
        clearCart();
        const orderId = result.order?.id || result.order?.order_number || '';
        toast.success(
          <div>
            <div style={{ fontWeight: 800 }}>Pedido confirmado{orderId ? ` #${orderId}` : ''}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Recibirás un correo con los detalles y el seguimiento.</div>
          </div>,
          {
            duration: 4000,
            style: {
              background: 'var(--color-primary, #010f20)',
              color: 'var(--color-on-primary, #ffffff)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '13px',
              fontWeight: '700'
            },
            iconTheme: {
              primary: 'var(--color-emerald-500, #10b981)',
              secondary: '#ffffff'
            }
          }
        );
        setShowCheckout(true);
        // Redirigir al perfil a la sección Historial de Pedidos después de 4 segundos
        setTimeout(() => {
          router.push('/perfil?tab=orders');
        }, 1000);
        return;
      } else {
        if (result.missingFields) {
          router.push('/perfil?return=checkout');
        } else {
          setError(result.error || 'Error al crear el pedido');
        }
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      setError('Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (id, name) => {
    removeFromCart(id);
    toast.error(
      <span>
        &quot;<span style={{ color: '#38bdf8' }}>{name || 'El artículo'}</span>&quot; ha sido eliminado
      </span>, 
      {
        style: {
          background: 'var(--color-primary, #010f20)',
          color: 'var(--color-on-primary, #ffffff)',
          borderRadius: '9999px',
          padding: '12px 20px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: '700',
        },
        iconTheme: {
          primary: 'var(--color-error, #ba1a1a)',
          secondary: '#ffffff',
        },
      }
    );
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    clearCart();
    toast.error('Has vaciado todo el carrito', {
      style: {
        background: 'var(--color-primary, #010f20)',
        color: 'var(--color-on-primary, #ffffff)',
        borderRadius: '9999px',
        padding: '12px 20px',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '14px',
        fontWeight: '700',
      },
      iconTheme: {
        primary: 'var(--color-error, #ba1a1a)',
        secondary: '#ffffff',
      },
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-surface pt-28 md:pt-36 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4 text-outline">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Tu carrito está vacío
          </h2>
          <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Revisa tu selección cuidadosamente. Parece que aún no has añadido artículos de la colección de esta temporada.
          </p>
          <Link href="/catalogo">
            <Button className="w-full !bg-primary hover:!bg-primary-container !text-on-primary text-sm font-bold py-3.5 rounded-md transition-colors tracking-wide uppercase shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-surface pt-28 md:pt-36 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4 text-emerald-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Pedido Confirmado
          </h2>
          <p className="text-sm text-on-surface-variant/80 mb-6 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tu pedido curado ha sido procesado correctamente. Recibirás un correo electrónico de confirmación con los detalles y el rastreo de inmediato.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/catalogo" className="w-full">
              <Button variant="outline" className="w-full border border-outline-variant text-on-surface-variant text-sm font-semibold py-3 rounded-md transition-all shadow-sm focus:ring-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Seguir Explorando
              </Button>
            </Link>
            <Link href="/dashboard/cliente/pedidos" className="w-full">
              <Button className="w-full !bg-primary hover:!bg-primary-container !text-on-primary text-sm font-bold py-3 rounded-md transition-all shadow-sm focus:ring-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Ver Pedidos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pt-28 md:pt-32 pb-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && <Alert className="mb-5" variant="error" onClose={() => setError('')}>{error}</Alert>}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-4 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="text-xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Artículos en el Carrito
                  </h2>
                  <p className="text-sm text-on-surface-variant/70 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {itemsCount} {itemsCount === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                  </p>
                </div>

                <button
                  onClick={handleClearCart}
                  className="self-start sm:self-auto text-xs font-bold text-error hover:text-error-container uppercase tracking-wider bg-error-container/20 hover:bg-error-container/40 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Vaciar Carrito
                </button>
              </div>

              <div className="max-h-[700px] overflow-y-auto pr-1 sm:pr-3 space-y-4">
                {cart.map((item) => {
                  const itemImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : null) || item.thumbnail;
                  const productUrl = `/producto/${item.id}`;

                  return (
                    <div
                      key={item.id}
                      className="bg-surface-container-low rounded-2xl border border-surface-container p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-surface-container-lowest relative overflow-hidden shadow-xs group"
                    >
                      <div className="flex items-start sm:items-center gap-4 w-full md:w-auto flex-1 min-w-0">
                        {/* Imagen con enlace al producto */}
                        <Link href={productUrl} className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-container-lowest rounded-xl flex items-center justify-center flex-shrink-0 border border-surface-container overflow-hidden shadow-xs hover:border-primary transition-colors">
                          {itemImage ? (
                            <img src={itemImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="text-outline">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                              </svg>
                            </div>
                          )}
                        </Link>

                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="text-xs font-bold tracking-widest text-warm-accent uppercase block truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {item.category || 'ACCESORIOS'}
                          </span>
                          {/* Título con enlace al producto */}
                          <Link href={productUrl}>
                            <h3 className="font-bold text-base sm:text-lg text-on-surface tracking-tight truncate hover:text-primary transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-on-surface-variant/80 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Color: {item.color || 'Espresso'} / Material: {item.material || 'Piel'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center bg-surface-container-lowest border border-outline-variant/60 rounded-full px-2.5 py-1 shadow-xs">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 text-outline hover:text-on-surface font-bold text-sm flex items-center justify-center transition-colors focus:outline-none"
                              >
                                —
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 text-outline hover:text-on-surface font-bold text-sm flex items-center justify-center transition-colors focus:outline-none"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id, item.name)}
                              className="text-xs uppercase font-bold text-error hover:text-error-container tracking-wider flex items-center gap-1 transition-colors focus:outline-none"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              <svg className="w-4 h-4 inline mr-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-surface-container pt-3 md:pt-0">
                        <span className="text-sm text-outline md:hidden font-medium">Subtotal:</span>
                        <span className="text-lg sm:text-xl font-bold text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6 shadow-sm">
              <h2 className="text-lg font-bold text-on-surface mb-6 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Resumen del Pedido
              </h2>

              <div className="space-y-4 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Subtotal</span>
                  <span className="font-semibold text-on-surface">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Envío</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-warm-accent' : 'text-on-surface'}`}>
                    {shipping === 0 ? 'Cortesía' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Estimación de Impuestos</span>
                  <span className="font-semibold text-on-surface">${tax.toFixed(2)}</span>
                </div>

                <div className="border-t border-surface-container my-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>Total</span>
                    <span className="text-xl font-bold text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handlePreCheckout}
                    className="w-full !bg-primary hover:!bg-primary-container !text-on-primary text-sm font-bold py-4 rounded-md transition-all tracking-wide uppercase shadow-sm focus:ring-0"
                    loading={loading}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Comprar'}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-outline font-bold uppercase tracking-widest pt-3 border-t border-surface-container mt-2">
                  <svg className="w-4 h-4 text-outline" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Pago 100% Seguro Garantizado
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tarjeta flotante / Alerta de confirmación con fondo opaco */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
            <div className="w-14 h-14 bg-primary-container/20 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/10 shadow-xs">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                ¿Confirmar tu pedido?
              </h3>
              <p className="text-sm text-on-surface-variant/80 mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Estás a punto de procesar tu compra por un total de <span className="font-bold text-on-surface">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>. ¿Deseas continuar?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full border border-outline-variant text-on-surface-variant text-sm font-semibold py-3.5 rounded-lg transition-colors hover:bg-surface-container"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancelar
              </button>
              <Button
                type="button"
                onClick={handleConfirmCheckout}
                className="w-full !bg-primary hover:!bg-primary-container !text-on-primary text-sm font-bold py-3.5 rounded-lg shadow-sm"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Sí, Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
