'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, Clock } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';

const labels = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', cancelled: 'Cancelado' };
const colors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function SellerOrders() {
  const { orders, loading, error, loadOrders, updateOrderItemStatus } = useOrders();
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const changeStatus = async (item, status, skipConfirm = false) => {
    if (status === 'cancelled' && !skipConfirm) {
      setConfirmingCancelId(item.id);
      return;
    }
    if (!skipConfirm && !confirm(`¿Cambiar "${item.product_name}" a ${labels[status]}?`)) return;
    setUpdatingId(item.id);
    await updateOrderItemStatus(item.id, status);
    setUpdatingId(null);
  };

  if (loading && orders.length === 0) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <p className="mt-1 text-gray-600">Gestiona únicamente los productos de tu tienda.</p>
      </div>
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><Package className="mx-auto mb-4 h-16 w-16 text-gray-300" /><h2 className="text-xl font-semibold">No tienes pedidos aún</h2></div>
      ) : <div className="space-y-4">
        {orders.map(order => (
          <section key={order.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <header className="flex flex-wrap justify-between gap-3 border-b border-gray-100 p-5">
              <div><p className="font-semibold">Pedido #{order.order_number}</p><p className="text-sm text-gray-500">Cliente: {order.customer_name}</p></div>
              <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('es-MX')}</p>
            </header>
            <div className="divide-y divide-gray-100">
              {order.items?.map(item => {
                const status = item.status || order.status || 'pending';
                const isUpdating = updatingId === item.id;
                return <div key={item.id} className="flex flex-wrap items-center gap-4 p-5">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">{item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-40 flex-1"><p className="font-medium">{item.product_name}</p><p className="text-sm text-gray-500">Cantidad: {item.quantity}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{labels[status] || status}</span>
                  {status !== 'shipped' && status !== 'cancelled' && <div className="flex flex-wrap gap-2">
                    <button disabled={isUpdating || status === 'processing'} onClick={() => changeStatus(item, 'processing')} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 disabled:opacity-50">En proceso</button>
                    <button disabled={isUpdating} onClick={() => changeStatus(item, 'shipped')} className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 disabled:opacity-50"><Truck className="mr-1 inline h-3 w-3" />Enviar</button>
                    <button disabled={isUpdating} onClick={() => changeStatus(item, 'cancelled')} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50">Cancelar</button>
                  </div>}
                  {confirmingCancelId === item.id && <Alert variant="info" className="basis-full">
                    <p className="font-bold">¿Confirmas cancelar este producto del pedido?</p>
                    <p className="mt-1 text-xs font-normal">El cliente recibirá un correo con la cancelación.</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setConfirmingCancelId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">No, regresar</button>
                      <button type="button" disabled={isUpdating} onClick={() => { setConfirmingCancelId(null); changeStatus(item, 'cancelled', true); }} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Sí, cancelar</button>
                    </div>
                  </Alert>}
                </div>;
              })}
            </div>
          </section>
        ))}
      </div>}
    </div>
  );
}
