'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import {
  Plus,
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  Trophy,
  BarChart3,
  Settings,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Compass,
  Zap
} from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [statsResp, ordersResp, sellerProfileResp, sellerProductsResp] = await Promise.all([
          orderService.getSellerOrderStats(user.id),
          orderService.getSellerOrders(user.id),
          productService.getPublicSellerProfile(user.id),
          productService.getSellerProducts(user.id)
        ]);

        const orderStats = statsResp?.success ? statsResp.stats : {};
        const orders = ordersResp?.success ? ordersResp.orders || [] : [];
        const sellerProfile = sellerProfileResp?.success ? sellerProfileResp.profile || {} : {};
        const sellerProducts = sellerProductsResp?.success ? sellerProductsResp.products || [] : [];

        setStats({
          totalSales: orderStats.revenue || 0,
          orders: orderStats.total || orders.length,
          products: sellerProducts.length,
          pendingOrders: orderStats.pending || 0,
          rating: sellerProfile.seller_rating_avg ? Number(sellerProfile.seller_rating_avg).toFixed(1) : 0
        });

        const mappedOrders = (orders || []).map(o => {
          const created = o.created_at || o.createdAt || o.items?.[0]?.created_at;
          const totalAmount = o.total || o.total_amount || (
            (o.items && o.items.reduce ? o.items.reduce((s, it) => s + (it.subtotal || 0), 0) : 0)
          );
          const customer = o.profiles?.name || o.user_name || 'Cliente';
          const rawStatus = o.status || (o.items && o.items[0] && o.items[0].status) || 'pending';
          const status = mapStatus(rawStatus);

          return {
            id: o.id || o.order_number || `ORD-${o.id}`,
            customer,
            total: Number(totalAmount || 0),
            status,
            date: created ? new Date(created).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''
          };
        });

        setRecentOrders(mappedOrders.slice(0, 3));

        const productMap = {};
        (orders || []).forEach(order => {
          (order.items || []).forEach(item => {
            const prod = item.product || item.products || {};
            const pid = prod.id || item.product_id;
            if (!pid) return;
            if (!productMap[pid]) {
              productMap[pid] = { name: prod.name || item.name || 'Producto', sales: 0, revenue: 0 };
            }
            productMap[pid].sales += 1;
            productMap[pid].revenue += Number(item.subtotal || item.price || 0);
          });
        });

        const top = Object.values(productMap)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        if (top.length === 0 && sellerProducts.length > 0) {
          setTopProducts(sellerProducts.slice(0, 5).map(p => ({ name: p.name, sales: 0, revenue: p.price || 0 })));
        } else {
          setTopProducts(top);
        }

      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const mapStatus = (status) => {
    if (!status) return 'Pendiente';
    const s = String(status).toLowerCase();
    if (s.includes('delivered')) return 'Entregado';
    if (s.includes('shipped')) return 'Enviado';
    if (s.includes('processing')) return 'Procesando';
    if (s.includes('pending')) return 'Pendiente';
    if (s.includes('cancel')) return 'Cancelado';
    return String(status);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const maxSales = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.sales), 1) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-12 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Banner de Bienvenida Creativo */}
        <div className="relative overflow-hidden bg-[#162536] rounded-3xl p-8 sm:p-10 shadow-xl text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-[#FFB872] border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Panel de vendedor
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Hola, {user?.name || 'Tacos Elguerito'}
              </h1>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Cada venta y cada pedido forman parte de tu historia. Aquí tienes el pulso exacto de tu negocio hoy.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/vendedor/productos/nuevo">
                <Button className="bg-[#FFB872] text-[#162536] hover:bg-[#ffaa54] text-xs font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border-0">
                  <Plus className="w-4 h-4" /> Nuevo Producto
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Dinámicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:bg-white hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ventas Totales</span>
              <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              ${stats.totalSales?.toFixed(2)}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Ingresos consolidados
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:bg-white hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pedidos</span>
              <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {stats.orders}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Zap className="w-3.5 h-3.5" /> {stats.pendingOrders} pendientes de entrega
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:bg-white hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Productos</span>
              <div className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {stats.products}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-violet-600 font-medium">
              <Layers className="w-3.5 h-3.5" /> Activos en catálogo
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:bg-white hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calificación</span>
              <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-sm" /> {stats.rating}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Compass className="w-3.5 h-3.5" /> Excelente reputación
            </div>
          </div>

        </div>

        {/* Sección de Contenido Principal: Pedidos y Productos Top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Pedidos Recientes */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Últimos Pedidos</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Transacciones recientes en tu tienda</p>
                </div>
                <Link href="/dashboard/vendedor/pedidos">
                  <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                    Ver todos <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </div>

              <div className="space-y-3.5">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No hay pedidos recientes.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-200">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800">{order.id}</div>
                        <div className="text-xs text-slate-600 font-medium">{order.customer}</div>
                        <div className="text-[11px] text-slate-400">{order.date}</div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-sm font-bold text-slate-800">${order.total.toFixed(2)}</div>
                        <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full ${order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                            order.status === 'Enviado' ? 'bg-blue-50 text-blue-600 border border-blue-200/50' :
                              order.status === 'Procesando' ? 'bg-purple-50 text-purple-600 border border-purple-200/50' :
                                order.status === 'Cancelado' ? 'bg-red-50 text-red-600 border border-red-200/50' :
                                  'bg-amber-50 text-amber-600 border border-amber-200/50'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Productos más vendidos */}
          <div className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Top Productos</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Artículos con mayor salida</p>
                </div>
                <Link href="/dashboard/vendedor/productos">
                  <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                    Gestionar <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </div>

              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">Aún sin registros de ventas.</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={index} className="space-y-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[140px]">{product.name}</span>
                        <span className="font-semibold text-slate-600">${product.revenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${(product.sales / maxSales) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/dashboard/vendedor/analiticas">
                <Button variant="outline" className="w-full border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-xs font-semibold py-2.5 rounded-2xl transition-all cursor-pointer shadow-sm">
                  Ver analíticas detalladas
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Accesos Rápidos Creativos */}
        <div className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Accesos Directos</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Link href="/dashboard/vendedor/productos/nuevo" className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-3 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Agregar producto</span>
            </Link>

            <Link href="/dashboard/vendedor/pedidos" className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-3 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Ver pedidos</span>
            </Link>

            <Link href="/dashboard/vendedor/analiticas" className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-3 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Analíticas</span>
            </Link>

            <Link href="/dashboard/vendedor/configuracion" className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-3 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Configuración</span>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}