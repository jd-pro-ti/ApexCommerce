'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, TrendingUp } from 'lucide-react';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const validItem = (item) => String(item.status || '').toLowerCase() !== 'cancelled';

function getItems(orders) {
  return orders.flatMap((order) => (order.items || []).filter(validItem).map((item) => ({ ...item, date: order.created_at })));
}

function RevenueChart({ orders, compact = false }) {
  const [range, setRange] = useState('30');
  const data = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - Number(range));
    const grouped = {};
    getItems(orders).forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime()) || date < since) return;
      const key = date.toISOString().slice(0, 10);
      grouped[key] = (grouped[key] || 0) + Number(item.subtotal || 0);
    });
    const days = Number(range) <= 7 ? Number(range) : 10;
    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - index) * (Number(range) > 30 ? 3 : 1));
      const key = date.toISOString().slice(0, 10);
      return { label: date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), value: grouped[key] || 0 };
    });
  }, [orders, range]);

  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => `${(index / Math.max(data.length - 1, 1)) * 100},${92 - (item.value / max) * 78}`).join(' ');

  return <section className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div><h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Ganancias</h2><p className="text-xs text-slate-400 mt-1">Ingresos generados por tus productos</p></div>
      <div className="flex items-center gap-2"><label className="sr-only" htmlFor="revenue-range">Periodo</label><div className="relative"><CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><select id="revenue-range" value={range} onChange={(event) => setRange(event.target.value)} className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white"><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></div><Link href="/dashboard/vendedor/analiticas" className="text-xs font-semibold text-blue-600 flex items-center gap-1">Ver detalle <ArrowUpRight className="w-3.5 h-3.5" /></Link></div>
    </div>
    <div className={compact ? 'h-44' : 'h-64'}><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible" role="img" aria-label="Gráfica de ganancias"><defs><linearGradient id="seller-revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".22" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs><polyline points={`0,92 ${points} 100,92`} fill="url(#seller-revenue-fill)" stroke="none" /><polyline points={points} fill="none" stroke="#2563eb" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />{data.map((item, index) => <text key={item.label} x={`${(index / Math.max(data.length - 1, 1)) * 100}`} y="100" textAnchor="middle" fontSize="3.3" fill="#94a3b8">{item.label}</text>)}</svg></div>
    <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{money(data.reduce((sum, item) => sum + item.value, 0))} en el periodo</span><span>MXN</span></div>
  </section>;
}

function TopProductsChart({ orders }) {
  const products = useMemo(() => {
    const result = {};
    getItems(orders).forEach((item) => {
      const id = item.product_id || item.product_name;
      if (!result[id]) result[id] = { name: item.product_name || 'Producto', quantity: 0, revenue: 0 };
      result[id].quantity += Number(item.quantity || 1);
      result[id].revenue += Number(item.subtotal || 0);
    });
    return Object.values(result).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders]);
  const max = Math.max(...products.map((product) => product.quantity), 1);

  return <section className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"><div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-bold text-slate-800">Productos más vendidos</h2><p className="text-xs text-slate-400 mt-1">Los artículos con mayor cantidad de ventas</p></div><Link href="/dashboard/vendedor/analiticas" className="text-xs font-semibold text-blue-600 flex items-center gap-1">Ver detalle <ArrowUpRight className="w-3.5 h-3.5" /></Link></div><div className="space-y-4">{products.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">Aún no hay ventas registradas.</p> : products.map((product) => <div key={product.name} className="space-y-2"><div className="flex justify-between gap-3 text-xs"><span className="font-bold text-slate-800 truncate">{product.name}</span><span className="text-slate-500 whitespace-nowrap">{product.quantity} uds. · {money(product.revenue)}</span></div><div className="h-2 bg-slate-200/70 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full" style={{ width: `${(product.quantity / max) * 100}%` }} /></div></div>)}</div></section>;
}

export { RevenueChart, TopProductsChart };
