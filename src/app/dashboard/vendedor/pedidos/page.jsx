'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ShoppingBag, XCircle } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const labels = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', cancelled: 'Cancelado' };
const colors = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border border-purple-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export default function SellerOrders() {
  const { orders, loading, error, loadOrders, updateOrderItemStatus } = useOrders();
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null); // { item, status }
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleStatusClick = (item, status) => {
    setConfirmModalData({ item, status });
  };

  const executeStatusChange = async () => {
    if (!confirmModalData) return;
    const { item, status } = confirmModalData;
    setUpdatingId(item.id);
    setConfirmModalData(null);
    
    const result = await updateOrderItemStatus(item.id, status);
    setUpdatingId(null);

    if (!result || result.success === false) {
      toast.error(result?.error || 'Hubo un error al actualizar el estatus.');
      return;
    }

    if (result.notificationSent === false) {
      toast.error(result.notificationError || 'El estado se actualizó, pero no se pudo enviar la notificación.');
      return;
    }

    toast.success(
      <div>
        <div style={{ fontWeight: 800 }}>Estatus actualizado a &quot;{labels[status]}&quot;</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>El producto se ha actualizado correctamente.</div>
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
  };

  if (loading && orders.length === 0) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Encabezado Principal */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Gestión de Pedidos
          </h1>
          <p className="mt-1 text-sm text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Monitorea, actualiza estatus y gestiona los productos correspondientes a tu tienda.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#010f20]/5 flex items-center justify-center text-[#010f20]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Total Pedidos</span>
            <span className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {orders.length}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-xs">
          <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="text-xl font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>No tienes pedidos aún</h2>
          <p className="text-sm text-gray-500 mt-1">Los pedidos de tus clientes aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const isExpanded = expandedOrders[order.id] ?? true;
            return (
              <section key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                
                {/* Cabecera del Pedido */}
                <header className="flex flex-wrap items-center justify-between gap-4 bg-[#f8fafc] border-b border-gray-200 px-6 py-4 cursor-pointer select-none" onClick={() => toggleExpand(order.id)}>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-2 rounded-xl bg-[#010f20] text-white flex items-center justify-center font-bold text-xs shadow-sm whitespace-nowrap">
                      #{order.order_number}
                    </div>
                    <div>
                      <p className="font-bold text-[#010f20] text-sm md:text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        Cliente: <span className="font-normal text-gray-700">{order.customer_name}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 shadow-2xs">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                    <button type="button" className="text-gray-500 hover:text-[#010f20] p-1 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </header>

                {/* Lista de Items del Pedido */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 p-2 sm:p-4">
                    {order.items?.map(item => {
                      const status = item.status || order.status || 'pending';
                      const isUpdating = updatingId === item.id;

                      return (
                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-colors">
                          
                          {/* Info del Producto */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shadow-2xs">
                              {item.product_image ? (
                                <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#010f20] text-sm truncate" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                {item.product_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                Cantidad solicitada: <span className="font-bold text-gray-800">{item.quantity}</span>
                              </p>
                              <div className="mt-2 inline-flex">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                                  {labels[status] || status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Acciones de Cambio de Estado */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                            {status !== 'shipped' && status !== 'cancelled' ? (
                              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <button 
                                  disabled={isUpdating || status === 'processing'} 
                                  onClick={() => handleStatusClick(item, 'processing')} 
                                  className="flex-1 md:flex-none rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  En proceso
                                </button>
                                
                                <button 
                                  disabled={isUpdating} 
                                  onClick={() => handleStatusClick(item, 'shipped')} 
                                  className="flex-1 md:flex-none rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 text-xs font-bold text-purple-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Enviar
                                </button>

                                <button 
                                  disabled={isUpdating} 
                                  onClick={() => handleStatusClick(item, 'cancelled')} 
                                  className="rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold italic">
                                {status === 'shipped' ? '✓ Producto enviado con éxito' : '✕ Producto cancelado'}
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </section>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010f20]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${
              confirmModalData.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {confirmModalData.status === 'cancelled' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                ¿Confirmar cambio de estado?
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Estás a punto de cambiar el estatus del producto <span className="font-bold text-[#010f20]">&quot;{confirmModalData.item.product_name}&quot;</span> a <span className="font-bold underline uppercase text-xs">{labels[confirmModalData.status]}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="w-full border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                No, regresar
              </button>
              <button
                type="button"
                onClick={executeStatusChange}
                className={`w-full text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-colors cursor-pointer ${
                  confirmModalData.status === 'cancelled' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#010f20] hover:bg-[#010f20]/90'
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Sí, confirmar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}