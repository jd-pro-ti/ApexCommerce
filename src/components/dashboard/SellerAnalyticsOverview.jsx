'use client';

import { useMemo, useState } from 'react';
import { Banknote, CalendarDays, CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import EarningsPanel from '@/components/dashboard/EarningsPanel';

const money = (value) => `$${Number(value || 0).toFixed(2)} MXN`;
const activeItem = (item) => String(item.status || '').toLowerCase() !== 'cancelled';

function periodStart(period, customFrom) {
  if (period === 'all') return null;
  if (period === 'custom') return customFrom ? new Date(`${customFrom}T00:00:00`) : null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === 'today') return date;
  if (period === 'week') date.setDate(date.getDate() - 6);
  if (period === 'month') date.setDate(date.getDate() - 29);
  return date;
}

function StatCard({ label, value, detail, icon: Icon, color }) {
  return <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/40"><div className="mb-4 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span><span className={`rounded-xl p-2.5 ${color}`}><Icon className="h-4 w-4" /></span></div><div className="text-2xl font-bold text-slate-800">{value}</div><p className="mt-1 text-xs text-slate-400">{detail}</p></div>;
}

export default function SellerAnalyticsOverview({ userId, orders }) {
  const [period, setPeriod] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const start = periodStart(period, customFrom);
  const end = useMemo(() => (customTo ? new Date(`${customTo}T23:59:59`) : null), [customTo]);
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const date = new Date(order.created_at);
    return (!start || date >= start) && (!end || date <= end);
  }), [orders, start, end]);
  const items = useMemo(() => filteredOrders.flatMap((order) => (order.items || []).filter(activeItem).map((item) => ({ ...item, order }))), [filteredOrders]);
  const revenue = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const buyers = useMemo(() => {
    const map = {};
    filteredOrders.forEach((order) => {
      const key = order.user_id || order.customer_email || order.customer_name || order.id;
      if (!map[key]) map[key] = { key, name: order.customer_name || 'Cliente', email: order.customer_email || 'Sin correo', orders: 0, total: 0, lastPurchase: order.created_at };
      map[key].orders += 1;
      map[key].total += (order.items || []).filter(activeItem).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      if (new Date(order.created_at) > new Date(map[key].lastPurchase)) map[key].lastPurchase = order.created_at;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);
  const products = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const key = item.product_id || item.product_name;
      if (!map[key]) map[key] = { key, name: item.product_name || 'Producto', units: 0, orders: 0, revenue: 0 };
      map[key].units += Number(item.quantity || 1);
      map[key].orders += 1;
      map[key].revenue += Number(item.subtotal || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [items]);
  const periodLabel = { today: 'Hoy', week: 'Últimos 7 días', month: 'Últimos 30 días', all: 'Todo el tiempo', custom: 'Periodo personalizado' }[period];

  return <div className="space-y-7">
    <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/40"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-bold text-slate-800">Periodo de análisis</h2><p className="mt-1 text-xs text-slate-400">Consulta ventas, compradores y productos de un periodo específico.</p></div><div className="flex flex-wrap items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{['today', 'week', 'month', 'all'].map((value) => <button key={value} type="button" onClick={() => setPeriod(value)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{value === 'today' ? 'Hoy' : value === 'week' ? 'Semana' : value === 'month' ? 'Mes' : 'Todo'}</button>)}<button type="button" onClick={() => setPeriod('custom')} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === 'custom' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Personalizado</button></div></div>{period === 'custom' && <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4"><label className="text-xs font-semibold text-slate-500">Desde<input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700" /></label><label className="text-xs font-semibold text-slate-500">Hasta<input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700" /></label></div>}</section>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Ventas del periodo" value={money(revenue)} detail={periodLabel} icon={CircleDollarSign} color="bg-blue-50 text-blue-600" /><StatCard label="Pedidos" value={filteredOrders.length} detail="Pedidos registrados" icon={Package} color="bg-emerald-50 text-emerald-600" /><StatCard label="Compradores" value={buyers.length} detail="Clientes únicos" icon={Users} color="bg-violet-50 text-violet-600" /><StatCard label="Unidades vendidas" value={items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} detail="Productos vendidos" icon={ShoppingBag} color="bg-amber-50 text-amber-600" /></section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2"><DataTable title="Compradores del periodo" icon={Users} empty="No hay compradores en este periodo." hasData={buyers.length > 0}><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3">Cliente</th><th className="pb-3">Correo</th><th className="pb-3">Pedidos</th><th className="pb-3">Total comprado</th></tr></thead><tbody>{buyers.map((buyer) => <tr key={buyer.key} className="border-b border-slate-50 text-slate-700"><td className="py-4 font-semibold">{buyer.name}</td><td className="py-4 text-slate-500">{buyer.email}</td><td className="py-4">{buyer.orders}</td><td className="py-4 font-bold">{money(buyer.total)}</td></tr>)}</tbody></table></DataTable><DataTable title="Rendimiento de productos" icon={ShoppingBag} empty="No hay productos vendidos en este periodo." hasData={products.length > 0}><table className="w-full min-w-[520px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3">Producto</th><th className="pb-3">Unidades</th><th className="pb-3">Pedidos</th><th className="pb-3">Ventas</th></tr></thead><tbody>{products.map((product) => <tr key={product.key} className="border-b border-slate-50 text-slate-700"><td className="py-4 font-semibold">{product.name}</td><td className="py-4">{product.units}</td><td className="py-4">{product.orders}</td><td className="py-4 font-bold">{money(product.revenue)}</td></tr>)}</tbody></table></DataTable></section>

    <DataTable title="Detalle de pedidos del periodo" icon={Banknote} empty="No hay pedidos en este periodo." hasData={filteredOrders.length > 0}><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3">Pedido</th><th className="pb-3">Comprador</th><th className="pb-3">Fecha</th><th className="pb-3">Productos</th><th className="pb-3">Venta</th><th className="pb-3">Estado</th></tr></thead><tbody>{filteredOrders.map((order) => { const orderItems = (order.items || []).filter(activeItem); const total = orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0); return <tr key={order.id} className="border-b border-slate-50 text-slate-700"><td className="py-4 font-semibold">{order.order_number || order.id}</td><td className="py-4">{order.customer_name || 'Cliente'}</td><td className="py-4">{new Date(order.created_at).toLocaleDateString('es-MX')}</td><td className="py-4">{orderItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}</td><td className="py-4 font-bold">{money(total)}</td><td className="py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{order.status || 'Pendiente'}</span></td></tr>; })}</tbody></table></DataTable>
  </div>;
}

function DataTable({ title, icon: Icon, empty, hasData, children }) { return <section className="overflow-x-auto rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/40"><h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800"><Icon className="h-5 w-5 text-blue-600" />{title}</h2>{hasData ? children : <p className="py-10 text-center text-xs text-slate-400">{empty}</p>}</section>; }
