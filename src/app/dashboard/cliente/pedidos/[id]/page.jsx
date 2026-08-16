'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, 
  AlertCircle, MapPin, CreditCard, Receipt 
} from 'lucide-react';

const labels = { 
  pending: 'Pendiente', 
  processing: 'En proceso', 
  shipped: 'Enviado', 
  delivered: 'Entregado', 
  cancelled: 'Cancelado' 
  ,refunded: 'Reembolsado'
};

const statusConfig = {
  pending: {
    bg: 'bg-amber-50/80 text-amber-800 border-amber-200/80 font-semibold',
    icon: Clock,
  },
  processing: {
    bg: 'bg-sky-50/80 text-sky-800 border-sky-200/80 font-semibold',
    icon: AlertCircle,
  },
  shipped: {
    bg: 'bg-violet-50/80 text-violet-800 border-violet-200/80 font-semibold',
    icon: Truck,
  },
  delivered: {
    bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 font-semibold',
    icon: CheckCircle2,
  },
  cancelled: {
    bg: 'bg-rose-50/80 text-rose-800 border-rose-200/80 font-semibold',
    icon: XCircle,
  },
  refunded: {
    bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 font-semibold',
    icon: CheckCircle2,
  }
};

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, loading } = useOrders();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const result = await getOrder(params.id);
      if (result) {
        setOrder(result);
      } else {
        router.push('/dashboard/cliente/pedidos');
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      router.push('/dashboard/cliente/pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-32 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-slate-800" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <div className="w-16 h-16 bg-white rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center mb-4 text-slate-500">
          <Package className="h-7 w-7 stroke-[1.5]" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">
          Pedido no encontrado
        </h2>
        <p className="text-slate-500 text-sm mb-6">El pedido que buscas no existe o no tienes permisos para verlo.</p>
        <Link 
          href="/dashboard/cliente/pedidos" 
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a mis pedidos</span>
        </Link>
      </div>
    );
  }

  const currentStatus = order.payment_status === 'refunded' ? 'refunded' : (order.status || 'pending');
  const statusInfo = statusConfig[currentStatus] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const formattedDate = new Date(order.created_at).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-slate-800" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      
      {/* Botón Volver */}
      <Link 
        href="/perfil?tab=orders" 
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Volver a mi perfil</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* CABECERA DEL PEDIDO */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalle de Orden</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium capitalize">{formattedDate}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Orden #{order.order_number}
              </h1>
            </div>

            {/* Badge de Estatus */}
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs tracking-wider uppercase ${statusInfo.bg}`}>
              <StatusIcon className="w-4 h-4 stroke-[2]" />
              <span>{labels[currentStatus] || currentStatus}</span>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Columna Izquierda: Productos (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500 stroke-[2]" />
                  <span>Productos ({order.order_items?.length || 0})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {order.order_items?.map((item) => {
                  const itemStatus = item.status || order.status || 'pending';
                  const itemConfig = statusConfig[itemStatus] || statusConfig.pending;
                  const ItemStatusIcon = itemConfig.icon;
                  const productImage = item.product_image || item.image_url || item.image || item.product?.image_url || item.product?.image || item.products?.images?.[0] || item.products?.image;

                  return (
                    <div 
                      key={item.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Imagen del producto */}
                        <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-xs">
                          {productImage ? (
                            <img src={productImage} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm bg-slate-100 font-bold text-slate-400">
                              📦
                            </div>
                          )}
                          <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                            {item.quantity}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Precio unitario: <span className="font-semibold text-slate-800">${item.product_price?.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <span className="text-sm font-bold text-slate-900">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </span>
                        <div className={`mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] tracking-wider uppercase ${itemConfig.bg}`}>
                          <ItemStatusIcon className="w-3 h-3 stroke-[2]" />
                          <span>{labels[itemStatus] || itemStatus}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Dirección de Envío y Estado de Pago (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              
              {/* Tarjeta de Dirección */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-500 stroke-[2]" />
                  <span>Dirección de envío</span>
                </h3>

                <div className="text-xs text-slate-600 space-y-1 font-normal leading-relaxed">
                  <p className="font-semibold text-slate-900 text-sm">{order.customer_name}</p>
                  <p>{order.shipping_address}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>{order.shipping_city}, {order.shipping_state}</p>
                  <p>CP: {order.shipping_postal_code}</p>
                  <p>{order.shipping_country || 'México'}</p>
                  {order.shipping_reference && (
                    <p className="text-slate-500 italic mt-1.5 bg-white p-2.5 rounded-xl border border-slate-100">
                      Ref: {order.shipping_reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Tarjeta de Pago */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-slate-500 stroke-[2]" />
                  <span>Estado de pago</span>
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Estatus:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
                    order.payment_status === 'paid' ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80' :
                    order.payment_status === 'pending' ? 'bg-amber-50/80 text-amber-800 border-amber-200/80' :
                    'bg-rose-50/80 text-rose-800 border-rose-200/80'
                  }`}>
                    {order.payment_status === 'paid' ? 'Pagado' :
                     order.payment_status === 'refunded' ? 'Reembolsado' :
                     order.payment_status === 'pending' ? 'Pendiente' : 'Fallido'}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* RESUMEN DE TOTALES */}
          <div className="border-t border-slate-100 pt-6">
            <div className="w-full max-w-sm ml-auto space-y-2.5 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2.5 border-b border-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500 stroke-[2]" />
                <span>Desglose Financiero</span>
              </h4>

              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900 font-semibold">${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Envío</span>
                <span className="text-slate-900 font-semibold">${order.shipping_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>IVA (16%)</span>
                <span className="text-slate-900 font-semibold">${order.tax?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold border-t border-slate-200 pt-3 text-slate-900">
                <span>Total pagado</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
