'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';

const labels = { 
  pending: 'Pendiente', 
  processing: 'En proceso', 
  shipped: 'Enviado', 
  delivered: 'Entregado', 
  cancelled: 'Cancelado' 
};

// Diccionario de estilos limpios y elegantes para los estatus
const statusConfig = {
  pending: {
    bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    icon: Clock,
  },
  processing: {
    bg: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
    icon: AlertCircle,
  },
  shipped: {
    bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    icon: Truck,
  },
  delivered: {
    bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    icon: CheckCircle2,
  },
  cancelled: {
    bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    icon: XCircle,
  }
};

export default function ClientOrdersPage() {
  const { orders, loading, error, loadOrders, cancelOrder: cancelOrderRequest, confirmOrderDelivery } = useOrders();
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [cancellationMessage, setCancellationMessage] = useState('');

  useEffect(() => { 
    loadOrders(); 
  }, [loadOrders]);

  const cancelOrder = async (order) => {
    setCancellingId(order.id);
    const result = await cancelOrderRequest(order.id);
    setCancellingId(null);
    setConfirmingCancelId(null);
    if (!result.success) console.error('Error al cancelar pedido:', result.error);
    else setCancellationMessage(result.realRefund
      ? 'Pedido cancelado. El reembolso real fue solicitado a PayPal; consulta el estado en Mis reembolsos.'
      : result.simulatedRefund
        ? 'Pedido cancelado. El reembolso simulado queda en proceso; consulta el plazo en Mis reembolsos.'
      : 'Pedido cancelado y existencias restauradas.');
  };

  const confirmDelivery = async (order) => {
    if (!window.confirm('¿Confirmas que recibiste todos los productos de este pedido?')) return;
    setConfirmingDeliveryId(order.id);
    setDeliveryMessage('');
    const result = await confirmOrderDelivery(order.id);
    setConfirmingDeliveryId(null);
    if (!result.success) {
      setDeliveryMessage(result.error || 'No se pudo confirmar la entrega.');
      return;
    }
    setDeliveryMessage(result.payout?.released
      ? 'Entrega confirmada. Los pagos de los vendedores fueron liberados.'
      : 'Entrega confirmada. La liberación de los pagos quedó pendiente de revisión.');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-slate-900 bg-white min-h-screen" 
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ENCABEZADO DE LA SECCIÓN */}
      <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Historial de compras</span>
          </div>
          <div className="flex items-center justify-between gap-4"><h1 
            className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight" 
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Mis pedidos
          </h1><Link href="/dashboard/cliente/reembolsos" className="text-sm font-bold text-slate-700 hover:text-amber-700">Ver reembolsos</Link></div>
          <p className="text-slate-500 text-base font-normal mt-1">
            Consulta el estatus actual de tus adquisiciones y da seguimiento detallado a tus entregas.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="bg-slate-50 border border-gray-200/80 px-5 py-3 rounded-2xl text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block" style={{ fontFamily: "'Montserrat', sans-serif" }}>Total de órdenes</span>
            <span className="text-xl font-black text-slate-900">{orders.length}</span>
          </div>
        )}
      </div>

      {error && <Alert className="mb-8 rounded-2xl" variant="error">{error}</Alert>}
      {deliveryMessage && <Alert className="mb-8 rounded-2xl" variant="success">{deliveryMessage}</Alert>}
      {cancellationMessage && <Alert className="mb-8 rounded-2xl" variant="success">{cancellationMessage}</Alert>}

      {orders.length === 0 ? (
        /* ESTADO VACÍO MEJORADO */
        <div className="rounded-3xl border border-dashed border-gray-200 bg-slate-50/40 p-16 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Package className="h-10 w-10 stroke-[1.5]" />
          </div>
          <h2 
            className="text-2xl font-black text-slate-900 mb-2 tracking-tight" 
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Aún no tienes pedidos registrados
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Explora nuestro catálogo, descubre productos increíbles y realiza tu primera compra para verla reflejada aquí.
          </p>
          <Link 
            href="/catalogo" 
            className="inline-flex items-center gap-2.5 bg-slate-950 text-white px-8 py-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <span>Ir al catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* LISTA DE PEDIDOS CON DISEÑO MÁS ELEGANTE */
        <div className="space-y-6">
          {orders.map(order => {
            const dateStr = new Date(order.created_at).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const orderCanCancel = (order.order_items || []).length > 0 &&
              (order.order_items || []).every(item => ['pending', 'processing'].includes(item.status || order.status || 'pending'));
            const deliveryItems = (order.order_items || []).filter(item => item.status !== 'cancelled');
            const canConfirmDelivery = deliveryItems.length > 0 &&
              deliveryItems.some(item => ['processing', 'shipped'].includes(item.status)) &&
              deliveryItems.every(item => ['processing', 'shipped', 'delivered'].includes(item.status));

            return (
              <article 
                key={order.id} 
                className="group rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden"
              >
                {/* Acento lateral sutil */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* CABECERA DEL PEDIDO */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-slate-700 font-black shadow-2xs">
                      📦
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orden</span>
                        <h2 
                          className="text-lg sm:text-xl font-black text-slate-900 tracking-tight" 
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          #{order.order_number}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-medium capitalize">
                        Realizada el {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canConfirmDelivery && (
                      <button
                        type="button"
                        disabled={confirmingDeliveryId === order.id}
                        onClick={() => confirmDelivery(order)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {confirmingDeliveryId === order.id ? 'Confirmando...' : 'Confirmar recepción'}
                      </button>
                    )}
                    {orderCanCancel && confirmingCancelId !== order.id && (
                      <button type="button" onClick={() => setConfirmingCancelId(order.id)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all">
                        Cancelar pedido
                      </button>
                    )}
                    <Link
                      href={`/dashboard/cliente/pedidos/${order.id}`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-gray-50 border border-gray-200/80 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-2xs group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver detalle completo</span>
                    </Link>
                  </div>
                </div>

                {/* ARTÍCULOS / PRODUCTOS DENTRO DEL PEDIDO */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Productos incluidos ({order.order_items?.length || 0})
                    </span>
                  </div>

                  {order.order_items?.map(item => {
                    const status = item.status || order.status || 'pending';
                    const config = statusConfig[status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const statusLabel = labels[status] || status;

                    return (
                      <div 
                        key={item.id} 
                        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/60 border border-gray-100 hover:bg-gray-50/90 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-extrabold text-slate-700 shadow-2xs">
                            {item.quantity}x
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 block leading-snug">
                              {item.product_name}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Piezas solicitadas: <strong className="text-slate-700">{item.quantity}</strong>
                            </span>
                          </div>
                        </div>

                        {/* BADGE DE ESTATUS MEJORADO */}
                        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-extrabold tracking-wider uppercase shadow-2xs ${config.bg}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          <StatusIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                          <span>{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {confirmingCancelId === order.id && (
                  <div className="mt-5">
                    <Alert variant="info">
                      <p className="font-bold">¿Confirmas la cancelación de este pedido?</p>
                      <p className="mt-1 text-xs font-normal">El vendedor recibirá una notificación por correo.</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => setConfirmingCancelId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">No, regresar</button>
                        <button type="button" disabled={cancellingId === order.id} onClick={() => cancelOrder(order)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{cancellingId === order.id ? 'Cancelando...' : 'Sí, cancelar pedido'}</button>
                      </div>
                    </Alert>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
