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

  // 🛒 ESTADO: CARRITO VACÍO
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] pt-28 md:pt-36 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-4 text-slate-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h2 
            className="text-2xl font-bold text-[#010f20] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Tu bolsa está vacía
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        {/* <div className="mb-10">
          <h1 
            className="text-3xl font-bold text-[#010f20] tracking-tight mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Bolsa de Compras
          </h1>
          <p 
            className="text-xs text-[#44474c]/60"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Revisa tu selección curada para esta temporada.
          </p>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Listado de Productos Izquierda */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl border border-[#efedef] p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm transition-all hover:shadow-md/5 relative"
              >
                {/* Imagen y Detalles principales */}
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="w-24 h-24 bg-[#f8f9fa] rounded-xl flex items-center justify-center flex-shrink-0 border border-[#efedef] overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span 
                      className="text-[9px] font-bold tracking-widest text-[#dd9448] uppercase block"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {item.category || 'ACCESORIOS'}
                    </span>
                    <h3 
                      className="font-bold text-base text-[#010f20] tracking-tight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {item.name}
                    </h3>
                    <p 
                      className="text-[11px] text-[#44474c]/60"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Color: {item.color || 'Espresso'} / Material: {item.material || 'Piel'}
                    </p>
                    
                    {/* Selector y Botón Eliminar agrupados */}
                    <div className="flex items-center gap-6 pt-2">
                      {/* Cápsula de Cantidad Minimalista */}
                      <div className="flex items-center bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 text-slate-400 hover:text-slate-900 font-medium text-xs flex items-center justify-center transition-colors focus:outline-none focus:ring-0"
                        >
                          —
                        </button>
                        <span 
                          className="w-7 text-center text-xs font-semibold text-slate-800"
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

                      {/* Botón Eliminar Minimalista */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 tracking-wider flex items-center gap-1 transition-colors focus:outline-none focus:ring-0"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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
                    className="text-base font-bold text-[#010f20]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}

            {/* Acciones de pie */}
            <div className="flex justify-between items-center pt-2 px-1">
              <Link 
                href="/catalogo" 
                className="text-xs text-[#44474c]/80 hover:text-[#0b1523] font-semibold flex items-center gap-1.5 transition-colors group"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Continuar Comprando
              </Link>
              <button
                onClick={clearCart}
                className="text-xs text-red-600/70 hover:text-red-700 font-medium transition-colors focus:ring-0"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Vaciar Bolsa
              </button>
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