'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, FileBarChart, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isoDate = (date) => date.toISOString().slice(0, 10);

export default function AdminReportsPage() {
  const today = new Date();
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(isoDate(today));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invalidRange = !from || !to || from > to;

  const range = (value) => {
    const now = new Date();
    if (value === 'day') { const date = isoDate(now); setFrom(date); setTo(date); }
    if (value === 'month') { setFrom(isoDate(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(isoDate(now)); }
    setPeriod(value);
  };

  useEffect(() => {
    let active = true;
    if (invalidRange) return () => { active = false; };
    // El efecto sincroniza el estado con la respuesta del reporte.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('');
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1);
      const response = await fetch(`/api/admin/earnings?from=${encodeURIComponent(`${from}T00:00:00`)}&to=${encodeURIComponent(end.toISOString())}`, { headers: { Authorization: `Bearer ${sessionData.session?.access_token || ''}` }, cache: 'no-store' });
      const result = await response.json();
      if (active) { if (response.ok) setReport(result); else setError(result.error || 'No se pudo cargar el reporte'); setLoading(false); }
    });
    return () => { active = false; };
  }, [from, to, invalidRange]);

  const bestSeller = useMemo(() => report?.sellers?.[0], [report]);
  const download = async () => {
    if (!from || !to || from > to) {
      setError('El rango de fechas no es válido: la fecha inicial debe ser anterior o igual a la final.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1);
    const response = await fetch(`/api/admin/earnings?format=csv&from=${encodeURIComponent(`${from}T00:00:00`)}&to=${encodeURIComponent(end.toISOString())}`, { headers: { Authorization: `Bearer ${sessionData.session?.access_token || ''}` } });
    if (!response.ok) return;
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `reporte-ganancias-${from}-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (invalidRange) return <div className="p-10 text-center text-sm text-rose-600">El rango de fechas no es válido: la fecha inicial debe ser anterior o igual a la final.</div>;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-10 text-center text-sm text-rose-600">{error}</div>;
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-10 text-slate-800 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link href="/dashboard/admin" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /> Volver al dashboard</Link><header className="mb-8"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Finanzas de Apex</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Reportes de ganancias</h1><p className="mt-2 text-sm text-slate-500">Consulta únicamente las ventas, comisiones y ganancias de la plataforma.</p></header><section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-2 text-xs font-bold text-slate-700">Periodo del reporte</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => range('day')} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${period === 'day' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Hoy</button><button type="button" onClick={() => range('month')} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${period === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Este mes</button><button type="button" onClick={() => setPeriod('custom')} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${period === 'custom' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Rango personalizado</button></div></div><div className="flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-slate-600">Desde<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPeriod('custom'); }} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><label className="text-xs font-semibold text-slate-600">Hasta<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPeriod('custom'); }} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><button type="button" onClick={download} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"><Download className="h-4 w-4" /> Descargar CSV</button></div></div></section><div className="mb-6 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-[#162536] p-6 text-white shadow-sm"><FileBarChart className="mb-4 h-6 w-6 text-[#FFB872]" /><p className="text-xs text-white/60">Ganancia Apex / comisión</p><p className="mt-1 text-3xl font-extrabold">{money(report?.totals?.platformCommission)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><TrendingUp className="mb-4 h-6 w-6 text-emerald-600" /><p className="text-xs text-slate-500">Ventas brutas del periodo</p><p className="mt-1 text-3xl font-extrabold text-slate-900">{money(report?.totals?.grossSales)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs text-slate-500">Vendedor con más ganancias generadas</p><p className="mt-2 text-xl font-extrabold text-slate-900">{bestSeller?.sellerName || 'Sin ventas'}</p><p className="mt-1 text-sm font-bold text-emerald-600">{money(bestSeller?.platformCommission)} de comisión</p></div></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-base font-bold text-slate-900">Ganancias por vendedor</h2><p className="mt-1 text-xs text-slate-500">Desglose del periodo seleccionado.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="pb-3">Vendedor</th><th className="pb-3">Pedidos</th><th className="pb-3">Venta bruta</th><th className="pb-3">Comisión Apex</th><th className="pb-3">Pago vendedor</th></tr></thead><tbody>{(report?.sellers || []).map((seller) => <tr key={seller.sellerId} className="border-b border-slate-50"><td className="py-4 font-bold text-slate-700">{seller.sellerName}</td><td className="py-4 text-slate-500">{seller.orders}</td><td className="py-4 text-slate-600">{money(seller.grossSales)}</td><td className="py-4 font-bold text-emerald-600">{money(seller.platformCommission)}</td><td className="py-4 text-slate-600">{money(seller.sellerPayout)}</td></tr>)}</tbody></table>{!report?.sellers?.length && <p className="py-10 text-center text-sm text-slate-400">No hay ganancias en este periodo.</p>}</div></section></div></main>;
}
