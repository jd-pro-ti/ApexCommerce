'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useOrders } from '@/context/OrderContext';
import { useAlert } from '@/components/ui/AlertContext'; // <-- Importa tu contexto de alertas
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const labels = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const colors = { pending: 'bg-yellow-50 text-yellow-700 border-yellow-200', processing: 'bg-blue-50 text-blue-700 border-blue-200', shipped: 'bg-purple-50 text-purple-700 border-purple-200', delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200', cancelled: 'bg-rose-50 text-rose-700 border-rose-200' };

export default function SellerOrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { getOrder, updateOrderItemStatus } = useOrders();
  const { showAlert } = useAlert(); // <-- Inicializa el hook de alertas
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    getOrder(id).then((result) => { if (active) setOrder(result || null); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getOrder]);

  const changeStatus = async (item, status) => {
    setUpdatingId(item.id);
    const result = await updateOrderItemStatus(item.id, status);
    setUpdatingId(null);
    if (!result?.success) {
      return showAlert(result?.error || 'No se pudo actualizar el estado.', 'error');
    }
    setOrder((previous) => ({ ...previous, order_items: previous.order_items.map((entry) => entry.id === item.id ? { ...entry, status } : entry) }));
    showAlert(`Producto actualizado a ${labels[status]}.`, 'success');
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!order) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><Package className="mb-4 h-14 w-14 text-gray-300" /><p className="font-bold text-slate-900">Pedido no encontrado</p><Link href="/dashboard/vendedor/pedidos" className="mt-4 text-sm font-bold text-blue-700">Volver a pedidos</Link></div>;

  const items = order.order_items || order.items || [];
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/dashboard/vendedor/pedidos" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Volver a pedidos</Link>
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Detalle del pedido</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900">#{order.order_number}</h1><p className="mt-1 text-sm text-gray-500">Cliente: {order.customer_name || order.profiles?.name || 'Cliente'} · {new Date(order.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p></div><div className="text-right text-sm text-gray-600"><p>{order.customer_email || order.profiles?.email || 'Correo no disponible'}</p><p>{[order.shipping_address, order.shipping_city, order.shipping_state].filter(Boolean).join(', ') || 'Dirección no disponible'}</p><p>C.P. {order.shipping_postal_code || 'N/D'}</p></div></div></div>
    <div className="space-y-4">{items.map((item) => { const status = item.status || 'pending'; const image = item.product_image || item.products?.images?.[0] || item.product?.images?.[0]; const price = Number(item.product_price ?? item.products?.price ?? item.product?.price ?? 0); const subtotal = Number(item.subtotal ?? price * Number(item.quantity || 0)); return <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">{image ? <img src={image} alt={item.product_name || 'Producto'} className="h-full w-full object-cover" /> : <Package className="h-7 w-7 text-gray-400" />}</div><div><h2 className="font-bold text-slate-900">{item.product_name || item.products?.name || 'Producto'}</h2><p className="mt-1 text-sm text-gray-500">Cantidad: <strong className="text-gray-800">{item.quantity}</strong> · Precio unitario: <strong className="text-gray-800">${price.toFixed(2)} MXN</strong></p><p className="mt-1 text-sm text-gray-500">Subtotal: <strong className="text-gray-800">${subtotal.toFixed(2)} MXN</strong></p><span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${colors[status] || colors.pending}`}>{labels[status] || status}</span></div></div><div className="flex flex-wrap gap-2">{status !== 'delivered' && status !== 'cancelled' ? <><button type="button" disabled={updatingId === item.id || status === 'processing'} onClick={() => changeStatus(item, 'processing')} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-50"><Clock className="h-3.5 w-3.5" />En proceso</button><button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item, 'shipped')} className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 disabled:opacity-50"><Truck className="h-3.5 w-3.5" />Enviar</button><button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item, 'cancelled')} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Cancelar</button></> : <span className={`inline-flex items-center gap-1 text-sm font-bold ${status === 'delivered' ? 'text-emerald-700' : 'text-gray-400'}`}>{status === 'delivered' ? <><CheckCircle2 className="h-4 w-4" />Ya se entregó</> : 'Producto cancelado'}</span>}</div></div></article>; })}</div>
    <div className="mt-5 flex justify-end gap-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600"> <span>Subtotal: <strong className="text-slate-900">${Number(order.subtotal || 0).toFixed(2)} MXN</strong></span><span>Total: <strong className="text-slate-900">${Number(order.total || 0).toFixed(2)} MXN</strong></span></div>
  </main>;
}