'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SellerMetricCard from '@/components/dashboard/SellerMetricCard';
import { RevenueChart, TopProductsChart } from '@/components/dashboard/SellerCharts';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { ArrowUpRight, BarChart3, DollarSign, Layers, Package, Plus, Settings, ShoppingBag, Sparkles, Star, Trophy, Zap } from 'lucide-react';

const statusLabels = { delivered: 'Entregado', shipped: 'Enviado', processing: 'Procesando', pending: 'Pendiente', cancelled: 'Cancelado' };

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [statsResp, ordersResp, profileResp, productsResp] = await Promise.all([
          orderService.getSellerOrderStats(user.id), orderService.getSellerOrders(user.id),
          productService.getPublicSellerProfile(user.id), productService.getSellerProducts(user.id)
        ]);
        const sellerOrders = ordersResp?.success ? ordersResp.orders || [] : [];
        const orderStats = statsResp?.success ? statsResp.stats || {} : {};
        const profile = profileResp?.success ? profileResp.profile || {} : {};
        setOrders(sellerOrders);
        setStats({ totalSales: Number(orderStats.revenue || 0), orders: orderStats.total || sellerOrders.length, products: productsResp?.success ? (productsResp.products || []).length : 0, pendingOrders: orderStats.pending || 0, rating: profile.seller_rating_avg ? Number(profile.seller_rating_avg).toFixed(1) : '0.0' });
      } catch (error) { console.error('Error cargando dashboard:', error); } finally { setLoading(false); }
    };
    load();
  }, [user]);

  if (loading) return <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]"><LoadingSpinner size="lg" /></div>;
  const recentOrders = orders.slice(0, 3);
  const money = `$${stats.totalSales?.toFixed(2)}`;

  return <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-12 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
    <header className="relative overflow-hidden bg-[#162536] rounded-3xl p-8 sm:p-10 shadow-xl text-white"><div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl" /><div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"><div className="space-y-3"><div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-[#FFB872] border border-white/10"><Sparkles className="w-3.5 h-3.5" /> Panel de vendedor</div><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hola, {user?.name || 'Vendedor'}</h1><p className="text-sm text-slate-300 max-w-xl leading-relaxed">Aquí tienes el pulso exacto de tu negocio y tus ganancias.</p></div><Link href="/dashboard/vendedor/productos/nuevo"><Button className="bg-[#FFB872] text-[#162536] hover:bg-[#ffaa54] text-xs font-bold py-3 px-6 rounded-2xl border-0"><Plus className="w-4 h-4 mr-2" /> Nuevo producto</Button></Link></div></header>

    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"><SellerMetricCard label="Ganancia total" value={money} detail={<><DollarSign className="w-3.5 h-3.5" /> Ingresos consolidados</>} detailClass="text-blue-600" icon={DollarSign} iconClass="bg-blue-50 text-blue-600" href="/dashboard/vendedor/analiticas" /><SellerMetricCard label="Pedidos" value={stats.orders} detail={<><Zap className="w-3.5 h-3.5" /> {stats.pendingOrders} pendientes de entrega</>} detailClass="text-emerald-600" icon={Package} iconClass="bg-emerald-50 text-emerald-600" href="/dashboard/vendedor/pedidos" /><SellerMetricCard label="Productos" value={stats.products} detail={<><Layers className="w-3.5 h-3.5" /> Activos en catálogo</>} detailClass="text-violet-600" icon={ShoppingBag} iconClass="bg-violet-50 text-violet-600" href="/dashboard/vendedor/productos" /><SellerMetricCard label="Calificación" value={<span className="flex items-center gap-1.5"><Star className="w-6 h-6 text-amber-400 fill-amber-400" />{stats.rating}</span>} detail={<><Trophy className="w-3.5 h-3.5" /> Excelente reputación</>} detailClass="text-amber-600" icon={Trophy} iconClass="bg-amber-50 text-amber-500" /></section>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><div className="lg:col-span-3"><RevenueChart orders={orders} compact /></div><div className="lg:col-span-2"><TopProductsChart orders={orders} /></div></div>

    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 bg-white/90 p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"><div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-bold text-slate-800">Últimos pedidos</h2><p className="text-xs text-slate-400 mt-1">Transacciones recientes en tu tienda</p></div><Link href="/dashboard/vendedor/pedidos" className="text-xs font-semibold text-blue-600 flex items-center gap-1">Ver todos <ArrowUpRight className="w-3.5 h-3.5" /></Link></div><div className="space-y-3">{recentOrders.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No hay pedidos recientes.</p> : recentOrders.map((order) => <Link key={order.id} href={`/dashboard/vendedor/pedidos/${order.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all"><div><div className="text-sm font-bold text-slate-800">{order.order_number || order.id}</div><div className="text-xs text-slate-600">{order.customer_name || 'Cliente'}</div><div className="text-[11px] text-slate-400">{order.created_at ? new Date(order.created_at).toLocaleDateString('es-MX') : ''}</div></div><div className="text-right"><div className="text-sm font-bold text-slate-800">${Number(order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || order.total || 0).toFixed(2)}</div><span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600">{statusLabels[order.status] || order.status || 'Pendiente'}</span></div></Link>)}</div></div><div className="bg-white/90 p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50"><h2 className="text-lg font-bold text-slate-800">Accesos directos</h2><div className="grid grid-cols-2 gap-3 mt-5"><QuickLink href="/dashboard/vendedor/productos/nuevo" label="Agregar producto" icon={Plus} /><QuickLink href="/dashboard/vendedor/pedidos" label="Ver pedidos" icon={Package} /><QuickLink href="/dashboard/vendedor/analiticas" label="Analíticas" icon={BarChart3} /><QuickLink href="/dashboard/vendedor/perfil" label="Configuración" icon={Settings} /></div></div></section>
  </div></main>;
}

function QuickLink({ href, label, icon: Icon }) { return <Link href={href} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group flex flex-col items-center text-center"><Icon className="w-5 h-5 mb-2 text-slate-700 group-hover:text-white" /><span className="text-[11px] font-bold text-slate-700 group-hover:text-white">{label}</span></Link>; }
