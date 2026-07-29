'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Eye, Package } from 'lucide-react';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';

const labels = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const colors = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

export default function ClientOrdersPage() {
  const { orders, loading, error, loadOrders } = useOrders();
  useEffect(() => { loadOrders(); }, [loadOrders]);
  if (loading && orders.length === 0) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900">Mis pedidos</h1>
    <p className="mt-1 text-gray-600">Consulta tus compras y el avance de cada producto.</p>
    {error && <Alert className="mt-6" variant="error">{error}</Alert>}
    {orders.length === 0 ? <div className="mt-8 rounded-xl border border-gray-200 bg-white p-12 text-center"><Package className="mx-auto mb-4 h-16 w-16 text-gray-300" /><h2 className="text-xl font-semibold">Aún no tienes pedidos</h2><Link className="mt-4 inline-block text-blue-700" href="/catalogo">Ir al catálogo</Link></div> :
      <div className="mt-8 space-y-4">{orders.map(order => <article key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Pedido #{order.order_number}</h2><p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('es-MX')}</p></div><Link href={`/dashboard/cliente/pedidos/${order.id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"><Eye className="h-4 w-4" />Ver detalle</Link></div>
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">{order.order_items?.map(item => { const status = item.status || order.status || 'pending'; return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{item.product_name} <span className="text-gray-500">× {item.quantity}</span></span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{labels[status] || status}</span></div>; })}</div>
      </article>)}</div>}
  </div>;
}
