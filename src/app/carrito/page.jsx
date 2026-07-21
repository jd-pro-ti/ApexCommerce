'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { cart, total, itemsCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [promoCode, setPromoCode] = useState('APEX-BIENVENIDO');

  const subtotal = total;
  const shipping = subtotal > 150 ? 0 : 19.99;
  const tax = 0.00;
  const grandTotal = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowCheckout(true);
    }, 1500);
  };

  // 🛒 ESTADO: CARRITO VACÍO (Con icono de carrito de compras)
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-28 md:pt-36 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4 text-slate-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h2 
            className="text-2xl font-bold text-[#010f20] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Tu carrito está vacío
          </h2>
          <p 
            className="text-xs text-[#44474c]/70 mb-6 leading-relaxed"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Revisa tu selección cuidadosamente. Parece que aún no has añadido artículos de la colección de esta temporada.
          </p>
          <Link href="/catalogo">
            <Button 
              className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3.5 rounded-md transition-colors tracking-wide uppercase"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ ESTADO: COMPRA CONFIRMADA
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-28 md:pt-36 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4 text-emerald-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 
            className="text-2xl font-bold text-[#010f20] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            ¡Pedido Confirmado!
          </h2>
          <p 
            className="text-xs text-[#44474c]/70 mb-6 leading-relaxed"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tu pedido curado ha sido procesado correctamente. Recibirás un correo electrónico de confirmación con los detalles y el rastreo de inmediato.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/catalogo" className="w-full">
              <Button 
                variant="outline" 
                className="w-full border border-gray-200 text-slate-700 text-xs font-semibold py-3 rounded-md transition-all shadow-sm focus:ring-0"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Seguir Explorando
              </Button>
            </Link>
            <Link href="/dashboard/cliente/pedidos" className="w-full">
              <Button 
                className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3 rounded-md transition-all focus:ring-0"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Ver Pedidos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 💼 VISTA PRINCIPAL DEL CARRITO
  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 md:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Contenedor Izquierdo con Scroll Integrado para los Productos */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Cabecera del contenedor con título y botón de vaciar bolsa siempre visible */}
            <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#efedef]">
                <div>
                  <h2 
                    className="text-lg font-bold text-[#010f20] tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Artículos en el Carrito
                  </h2>
                  <p 
                    className="text-xs text-[#44474c]/60 mt-0.5"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {itemsCount} {itemsCount === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                  </p>
                </div>
                
                {/* Botón Vaciar Carrito reubicado en la parte superior */}
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100/60 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Vaciar Carrito
                </button>
              </div>

              {/* Lista con scroll vertical */}
              <div className="max-h-[700px] overflow-y-auto pr-3 space-y-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {cart.map((item) => {
                  const itemImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : null) || item.thumbnail;

                  return (
                    <div 
                      key={item.id} 
                      className="bg-[#fafbfc] rounded-2xl border border-[#efedef] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:bg-white relative"
                    >
                      {/* Imagen grande estilo detalle de producto y Detalles principales */}
                      <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-[#efedef] overflow-hidden shadow-xs">
                          {itemImage ? (
                            <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-300">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1.5">
                          <span 
                            className="text-[10px] font-bold tracking-widest text-[#dd9448] uppercase block"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {item.category || 'ACCESORIOS'}
                          </span>
                          <h3 
                            className="font-bold text-base sm:text-lg text-[#010f20] tracking-tight"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {item.name}
                          </h3>
                          <p 
                            className="text-xs text-[#44474c]/70"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            Color: {item.color || 'Espresso'} / Material: {item.material || 'Piel'}
                          </p>
                          
                          {/* Selector y Botón Eliminar item individual */}
                          <div className="flex items-center gap-6 pt-2">
                            {/* Cápsula de Cantidad */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-full px-2.5 py-1 shadow-sm">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 text-slate-400 hover:text-slate-900 font-medium text-xs flex items-center justify-center transition-colors focus:outline-none focus:ring-0"
                              >
                                —
                              </button>
                              <span 
                                className="w-8 text-center text-xs font-semibold text-slate-800"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 text-slate-400 hover:text-slate-900 font-medium text-xs flex items-center justify-center transition-colors focus:outline-none focus:ring-0"
                              >
                                +
                              </button>
                            </div>

                            {/* Botón Eliminar item */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[11px] uppercase font-bold text-red-500 hover:text-red-700 tracking-wider flex items-center gap-1 transition-colors focus:outline-none focus:ring-0"
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

                      {/* Precio Derecho */}
                      <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                        <span 
                          className="text-lg font-bold text-[#010f20]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones de pie */}
            <div className="flex justify-start items-center pt-2 px-1">
              <Link 
                href="/catalogo" 
                className="text-xs text-[#44474c]/80 hover:text-[#0b1523] font-semibold flex items-center gap-1.5 transition-colors group"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Continuar Comprando
              </Link>
            </div>
          </div>

          {/* Resumen de Pedido Derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm">
              <h2 
                className="text-base font-bold text-[#010f20] mb-6 tracking-tight"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Resumen del Pedido
              </h2>
              
              <div className="space-y-4 text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div className="flex justify-between text-[#44474c]/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between text-[#44474c]/70">
                  <span>Envío</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-[#dd9448]' : 'text-slate-900'}`}>
                    {shipping === 0 ? 'Cortesía' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-[#44474c]/70">
                  <span>Estimación de Impuestos</span>
                  <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                </div>
                
                {/* Divisor Limpio */}
                <div className="border-t border-[#efedef] my-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Total</span>
                    <span className="text-lg font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Botón de Pago */}
                <div className="pt-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3.5 rounded-md transition-all tracking-wide uppercase shadow-sm focus:ring-0"
                    loading={loading}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Comprar'}
                  </Button>
                </div>

                {/* Garantía */}
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-3 border-t border-gray-50 mt-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Pago 100% Seguro Garantizado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}