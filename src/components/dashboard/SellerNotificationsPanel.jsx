'use client';

import { useMemo, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, CircleDollarSign, Package, ShieldAlert, ShoppingBag, XCircle } from 'lucide-react';

const types = { all: 'Todas', new_order: 'Nuevos pedidos', cancelled_order: 'Cancelaciones', seller_report: 'Reportes', seller_warning: 'Advertencias', low_stock: 'Stock bajo', payment_released: 'Pagos liberados' };
const icons = { new_order: Package, cancelled_order: XCircle, seller_report: ShieldAlert, seller_warning: ShieldAlert, low_stock: ShoppingBag, payment_released: CircleDollarSign };
const colors = { new_order: 'bg-blue-50 text-blue-600', cancelled_order: 'bg-rose-50 text-rose-600', seller_report: 'bg-orange-50 text-orange-600', seller_warning: 'bg-red-50 text-red-600', low_stock: 'bg-amber-50 text-amber-600', payment_released: 'bg-emerald-50 text-emerald-600' };

export default function SellerNotificationsPanel({ notifications, onRead, onOpen, onReadAll }) {
  const [filter, setFilter] = useState('all');
  const unread = notifications.filter((item) => !item.read_at).length;
  const filtered = useMemo(() => filter === 'all' ? notifications : notifications.filter((item) => item.type === filter), [notifications, filter]);

  return <section className="space-y-5">
    <div className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/40 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Bell className="h-5 w-5 text-amber-500" /> Tus notificaciones {unread > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{unread} nuevas</span>}</h2><p className="mt-1 text-xs text-slate-400">Pedidos, reportes, stock y liberación de pagos.</p></div>{unread > 0 && <button onClick={onReadAll} className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"><CheckCheck className="h-4 w-4" /> Marcar todas como leídas</button>}</div>
    <div className="flex flex-wrap gap-2">{Object.entries(types).map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === key ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button>)}</div>
    <div className="space-y-3">{filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-400"><CircleAlert className="mx-auto mb-3 h-8 w-8" />No tienes notificaciones en este filtro.</div> : filtered.map((notification) => { const Icon = icons[notification.type] || Bell; return <article key={notification.id} role="button" tabIndex={0} onClick={() => onOpen(notification)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(notification); }} className={`group flex cursor-pointer gap-4 rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${notification.read_at ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/40 shadow-sm'}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colors[notification.type] || 'bg-slate-100 text-slate-600'}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row"><h3 className="text-sm font-bold text-slate-800">{notification.title}</h3><time className="text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleString('es-MX')}</time></div><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>{!notification.read_at && <button onClick={(event) => { event.stopPropagation(); onRead(notification.id); }} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800">Marcar como leída</button>}</div></article>; })}</div>
  </section>;
}
