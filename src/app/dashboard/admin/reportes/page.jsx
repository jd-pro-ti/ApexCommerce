'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download, FileBarChart, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
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
    setError('');
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1);
      const response = await fetch(`/api/admin/earnings?from=${encodeURIComponent(`${from}T00:00:00`)}&to=${encodeURIComponent(end.toISOString())}`, { 
        headers: { Authorization: `Bearer ${sessionData.session?.access_token || ''}` }, 
        cache: 'no-store' 
      });
      const result = await response.json();
      if (active) { 
        if (response.ok) setReport(result); 
        else setError(result.error || 'No se pudo cargar el reporte'); 
        setLoading(false); 
      }
    });
    return () => { active = false; };
  }, [from, to, invalidRange]);

  const bestSeller = useMemo(() => report?.sellers?.[0], [report]);

  const download = async () => {
    if (!from || !to || from > to) {
      setError('Rango de fechas no válido.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1);
    const response = await fetch(`/api/admin/earnings?format=csv&from=${encodeURIComponent(`${from}T00:00:00`)}&to=${encodeURIComponent(end.toISOString())}`, { 
      headers: { Authorization: `Bearer ${sessionData.session?.access_token || ''}` } 
    });
    if (!response.ok) return;
    const blob = await response.blob(); 
    const url = URL.createObjectURL(blob); 
    const anchor = document.createElement('a'); 
    anchor.href = url; 
    anchor.download = `reporte-ganancias-${from}-${to}.csv`; 
    anchor.click(); 
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-6 sm:py-12 px-4 sm:px-8 lg:px-12 text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header con estilo unificado */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">Reportes de ganancias</h1>
            <p className="text-sm text-slate-500">Monitorea el rendimiento financiero de la plataforma.</p>
          </div>
        </header>

        {/* Filtros */}
        <section className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-slate-200/20">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {['day', 'month', 'custom'].map((p) => (
                <button key={p} type="button" onClick={() => range(p)} className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${period === p ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p === 'day' ? 'Hoy' : p === 'month' ? 'Este mes' : 'Rango personalizado'}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex w-full sm:w-auto gap-3">
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPeriod('custom'); }} className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold" />
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPeriod('custom'); }} className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold" />
              </div>
              <button type="button" onClick={download} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all">
                <Download className="h-4 w-4" /> Descargar CSV
              </button>
            </div>
          </div>
        </section>

        {/* Tarjetas de Métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-[#162536] p-6 text-white shadow-xl shadow-slate-900/10">
            <FileBarChart className="mb-4 h-6 w-6 text-[#FFB872]" />
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Ganancia Comisión Apex</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold">{money(report?.totals?.platformCommission)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <TrendingUp className="mb-4 h-6 w-6 text-emerald-600" />
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ventas brutas</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">{money(report?.totals?.grossSales)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mejor Vendedor</p>
            <p className="mt-2 text-sm font-extrabold text-slate-900">{bestSeller?.sellerName || 'Sin ventas'}</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">{money(bestSeller?.platformCommission)} ganados</p>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 overflow-hidden">
          <h2 className="text-base font-bold text-slate-900">Ganancias por vendedor</h2>
          <div className="mt-6 w-full overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <tr><th className="pb-4">Vendedor</th><th className="pb-4">Pedidos</th><th className="pb-4">Venta bruta</th><th className="pb-4">Comisión Apex</th><th className="pb-4">Pago vendedor</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(report?.sellers || []).map((seller) => (
                  <tr key={seller.sellerId}>
                    <td className="py-4 font-bold text-slate-700">{seller.sellerName}</td>
                    <td className="py-4 text-slate-500">{seller.orders}</td>
                    <td className="py-4 text-slate-600">{money(seller.grossSales)}</td>
                    <td className="py-4 font-bold text-emerald-600">{money(seller.platformCommission)}</td>
                    <td className="py-4 text-slate-600">{money(seller.sellerPayout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}