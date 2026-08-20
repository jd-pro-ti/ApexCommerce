'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { 
  BarChart3, 
  ChevronLeft, 
  CircleDollarSign, 
  Package, 
  ShoppingCart, 
  Store, 
  TrendingUp, 
  RefreshCw,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
  const [activeMonth, setActiveMonth] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token || ''}` },
        cache: 'no-store'
      });
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setError('');
      } else {
        setError(result.error || 'No se pudieron cargar las analíticas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxSales = useMemo(() => Math.max(...(data?.monthly || []).map((item) => item.sales), 1), [data]);
  const maxProduct = useMemo(() => Math.max(...(data?.products || []).map((item) => item.sales), 1), [data]);
  
  const pie = useMemo(() => {
    const values = data?.sellers || [];
    const total = values.reduce((sum, item) => sum + item.commission, 0) || 1;
    const colors = ['#0f766e', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2'];
    return values.slice(0, 6).reduce((result, item, index) => {
      const start = result.current;
      const end = start + (item.commission / total) * 360;
      return { 
        current: end, 
        parts: [...result.parts, `${colors[index % colors.length]} ${start}deg ${end}deg`] 
      };
    }, { current: 0, parts: [] }).parts.join(', ');
  }, [data]);
  const commissionRate = data?.totals?.grossSales ? ((data.totals.platformCommission / data.totals.grossSales) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f8fafc] text-center px-4">
        <p className="text-sm font-bold text-rose-600 mb-4">{error}</p>
        <Button onClick={loadData} className="bg-slate-900 text-white text-xs px-4 py-2 rounded-xl">Intentar de nuevo</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-4 sm:py-8 lg:py-12 text-[#0f172a] overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full box-border">
        
        {/* Navegación y Cabecera Adaptable */}
        <div className="w-full">

          <div className="relative overflow-hidden bg-[#162536] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl text-white w-full box-border">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-[#FFB872] border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" /> Inteligencia de Negocio
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate">
                  Analíticas Generales
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Ventas, comisiones, productos principales y rendimiento global de todos los vendedores en tiempo real.
                </p>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-3 shrink-0">
                <Button 
                  onClick={loadData} 
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar Datos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales (Grid Responsiva) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
          <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col justify-between min-w-0">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 shadow-sm shrink-0">
              <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Ventas brutas</p>
              <p className="mt-1 text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{money(data?.totals?.grossSales)}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col justify-between min-w-0">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Comisión Apex</p>
              <p className="mt-1 text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{money(data?.totals?.platformCommission)}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col justify-between min-w-0">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 shadow-sm shrink-0">
              <Store className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Pago a vendedores</p>
              <p className="mt-1 text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{money(data?.totals?.sellerPayout)}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col justify-between min-w-0">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-violet-50 text-violet-600 shadow-sm shrink-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Pedidos</p>
              <p className="mt-1 text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{data?.totals?.orders || 0}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 flex flex-col justify-between col-span-2 lg:col-span-1 min-w-0">
            <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 shadow-sm shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Productos vendidos</p>
              <p className="mt-1 text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 truncate">{data?.totals?.products || 0}</p>
            </div>
          </div>
        </div>

        {/* Sección Gráficos Principales */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr_1fr] w-full">
          
          {/* Gráfico de Barras Mensuales */}
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/60 flex flex-col justify-between min-w-0 w-full box-border">
            <div className="min-w-0 w-full">
              <div className="mb-4 sm:mb-6 flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Ventas y comisiones por periodo</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">Evolución histórica registrada en las liquidaciones.</p>
                </div>
              </div>

              <div className="w-full overflow-x-auto pb-2 touch-pan-x max-w-full">
                <div className="flex h-56 sm:h-64 items-end gap-3 min-w-[450px] border-b border-l border-slate-200/80 px-4 pb-0 pt-2">
                  {data?.monthly?.length ? (
                    data.monthly.map((item) => (
                      <div key={item.label} className="group relative flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2" onMouseEnter={() => setActiveMonth(item)} onFocus={() => setActiveMonth(item)} tabIndex={0}>
                        <div className={`pointer-events-none absolute bottom-[88%] z-10 w-36 rounded-xl bg-slate-900 px-3 py-2 text-center text-[10px] text-white shadow-lg transition-opacity ${activeMonth?.label === item.label ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><strong className="block">{item.label}</strong><span>Ventas: {money(item.sales)}</span><br /><span>Comisión: {money(item.commission)}</span></div>
                        <div className="flex h-[88%] w-full items-end justify-center gap-1.5">
                          <div 
                            title={`Ventas ${money(item.sales)}`} 
                            className="w-3 rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600 shadow-sm" 
                            style={{ height: `${Math.max(5, (item.sales / maxSales) * 100)}%` }} 
                          />
                          <div 
                            title={`Comisión ${money(item.commission)}`} 
                            className="w-3 rounded-t-lg bg-emerald-500 transition-all hover:bg-emerald-600 shadow-sm" 
                            style={{ height: `${item.commission ? Math.max(5, (item.commission / maxSales) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="mb-2 text-[10px] font-semibold text-slate-500 whitespace-nowrap">{item.label}</span>
                      </div>
                    ))
                  ) : (
                    <p className="m-auto text-xs text-slate-400 font-medium">Todavía no hay ventas registradas.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-wrap gap-4 sm:gap-6 text-xs font-bold text-slate-500 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-md bg-blue-500 shadow-sm" />Ventas</span>
              <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-md bg-emerald-500 shadow-sm" />Comisión Apex</span>
            </div>
          </section>

          {/* Gráfica Circular / Distribución de Comisiones */}
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/60 flex flex-col justify-between min-w-0 w-full box-border">
            <div className="min-w-0 w-full">
              <div className="flex items-center gap-3 mb-1 min-w-0">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Comisión por vendedor</h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-6 truncate">Distribución porcentual de las ganancias.</p>

              <div className="my-2 flex items-center justify-center relative">
                 <div className="h-40 w-40 sm:h-44 sm:w-44 rounded-full shadow-inner shrink-0" style={{ background: pie ? `conic-gradient(${pie})` : '#e2e8f0' }} />
                <div className="absolute flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white text-center text-[9px] sm:text-[10px] font-extrabold text-slate-700 shadow-md border border-slate-100">
                   Apex<br />{commissionRate}%
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 space-y-2 pt-4 border-t border-slate-100 w-full min-w-0">
              {(data?.sellers || []).slice(0, 6).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-xs font-semibold gap-2 min-w-0">
                  <span className="flex items-center gap-2 text-slate-600 min-w-0 flex-1">
                    <i className={`h-2.5 w-2.5 rounded-full shrink-0 ${['bg-teal-700', 'bg-blue-600', 'bg-amber-600', 'bg-purple-600', 'bg-red-600', 'bg-cyan-600'][index % 6]}`} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <strong className="text-slate-900 shrink-0">{money(item.commission)}</strong>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Sección Inferior (Productos y Vendedores) */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 w-full">
          
          {/* Productos más vendidos */}
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/60 min-w-0 w-full box-border">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Productos más vendidos</h2>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-6 truncate">Rendimiento detallado por producto.</p>

            <div className="space-y-3 sm:space-y-4 min-w-0 w-full">
              {(data?.products || []).length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-8 text-center">No hay productos registrados aún.</p>
              ) : (
                (data?.products || []).map((item) => (
                  <div key={item.id} className="p-3 sm:p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 min-w-0 w-full box-border">
                    <div className="mb-1.5 flex justify-between gap-3 text-xs min-w-0">
                      <span className="truncate font-bold text-slate-800 flex-1 min-w-0">{item.name}</span>
                      <span className="shrink-0 font-extrabold text-slate-900">{money(item.sales)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/60 overflow-hidden mb-1.5 w-full">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.max(4, (item.sales / maxProduct) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{item.quantity} unidades · comisión estimada {money(item.commission)}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Rendimiento de Vendedores */}
          <section className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/60 min-w-0 w-full box-border">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Rendimiento de vendedores</h2>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-6 truncate">Desglose de ventas, comisiones y pagos acumulados.</p>

            <div className="w-full overflow-x-auto touch-pan-x max-w-full">
              <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 px-2">Vendedor</th>
                    <th className="pb-3 px-2">Pedidos</th>
                    <th className="pb-3 px-2">Ventas</th>
                    <th className="pb-3 px-2">Comisión</th>
                    <th className="pb-3 px-2">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.sellers || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-xs text-slate-400 font-medium">
                        No hay vendedores activos con actividad registrada.
                      </td>
                    </tr>
                  ) : (
                    (data?.sellers || []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-2 font-bold text-slate-800 whitespace-nowrap">{item.name}</td>
                        <td className="py-3.5 px-2 text-slate-600 font-semibold">{item.orders}</td>
                        <td className="py-3.5 px-2 text-slate-600 font-semibold whitespace-nowrap">{money(item.sales)}</td>
                        <td className="py-3.5 px-2 font-extrabold text-emerald-600 whitespace-nowrap">{money(item.commission)}</td>
                        <td className="py-3.5 px-2 text-slate-700 font-semibold whitespace-nowrap">{money(item.payout)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
