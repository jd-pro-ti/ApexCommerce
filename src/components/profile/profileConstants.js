import { AlertCircle, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';

export const labels = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
};

export const statusConfig = {
  pending: { bg: 'bg-amber-50/80 text-amber-800 border-amber-200/80 font-semibold', icon: Clock },
  processing: { bg: 'bg-sky-50/80 text-sky-800 border-sky-200/80 font-semibold', icon: AlertCircle },
  shipped: { bg: 'bg-violet-50/80 text-violet-800 border-violet-200/80 font-semibold', icon: Truck },
  delivered: { bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 font-semibold', icon: CheckCircle2 },
  cancelled: { bg: 'bg-rose-50/80 text-rose-800 border-rose-200/80 font-semibold', icon: XCircle },
  refunded: { bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 font-semibold', icon: CheckCircle2 }
};

export function getOrderStatus(order) {
  if (order.payment_status === 'refunded') return 'refunded';
  const items = order.order_items || [];
  if (!items.length) return order.status || 'pending';
  const statuses = items.map((item) => item.status || order.status || 'pending');
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.every((status) => status === 'delivered')) return 'delivered';
  if (statuses.includes('shipped')) return 'shipped';
  if (statuses.includes('processing')) return 'processing';
  return 'pending';
}
