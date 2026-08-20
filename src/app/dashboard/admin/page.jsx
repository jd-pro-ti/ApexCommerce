'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/components/ui/AlertContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EarningsPanel from '@/components/dashboard/EarningsPanel';
import { authService } from '@/services/authService';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Layers,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [usersResp, ordersResp, categoriesResp, pendingResp] = await Promise.all([
          authService.getAllUsers(),
          orderService.getAllOrders(),
          productService.getCategoriesWithCount(),
          productService.getPendingApprovals()
        ]);

        const users = usersResp?.success ? usersResp.users || [] : [];
        const orders = ordersResp?.success ? ordersResp.orders || [] : [];
        const categories = categoriesResp?.success ? categoriesResp.categories || [] : [];
        const pendingCount = pendingResp?.success ? pendingResp.count || 0 : 0;

        const totalProducts = categories.reduce((s, c) => s + (c.count || 0), 0);
        const totalRevenue = (orders || []).reduce((sum, ord) => {
          if (ord.total) return sum + Number(ord.total);
          if (ord.order_items && ord.order_items.length) {
            return sum + ord.order_items.reduce((ss, it) => ss + (it.subtotal || 0), 0);
          }
          return sum;
        }, 0);

        setStats({
          totalUsers: users.length,
          totalSellers: users.filter(u => u.role === 'vendedor').length,
          totalProducts,
          totalOrders: orders.length,
          totalRevenue,
          pendingApprovals: pendingCount
        });

        setRecentUsers(users.slice(0, 3).map(u => ({
          id: u.id,
          name: u.name || u.email || 'Usuario',
          email: u.email,
          role: u.role || 'cliente',
          date: u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''
        })));

        setSystemAlerts([
          { id: '1', type: 'warning', message: `${pendingCount} productos pendientes de aprobación en el catálogo.`, date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) },
        ]);

      } catch (error) {
        console.error('Error cargando dashboard admin:', error);
        showAlert('Error al cargar la información del panel de administración', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [user, showAlert]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-6 sm:py-10 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Banner de Bienvenida */}
        <div className="relative overflow-hidden bg-[#162536] rounded-3xl p-6 sm:p-8 shadow-xl text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-[#FFB872] border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Panel de Administración
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Hola, {user?.name || 'Administrador'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Supervisa la actividad global, usuarios y estado general de la plataforma con control total.
              </p>
            </div>

            <div className="w-full sm:w-auto flex items-center">
              <Link href="/dashboard/admin/reportes" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#FFB872] text-[#162536] hover:bg-[#ffaa54] text-xs font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer border-0">
                  <BarChart3 className="w-4 h-4" /> Ver Reportes
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales (Forzadas a 2 columnas en móvil y 4 en desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

          {/* Usuarios Totales */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
            <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-3 sm:mb-4">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Usuarios Totales</span>
              <div className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {stats.totalUsers || 0}
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] sm:text-xs text-blue-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> <span className="truncate">{stats.totalSellers || 0} vendedores</span>
            </div>
          </div>

          {/* Productos en Catálogo */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
            <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-3 sm:mb-4">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Productos</span>
              <div className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {stats.totalProducts || 0}
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-600 font-semibold">
              <Zap className="w-3.5 h-3.5" /> <span className="truncate">{stats.pendingApprovals || 0} pendientes</span>
            </div>
          </div>

          {/* Pedidos Globales */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
            <div className="p-2.5 sm:p-3 bg-violet-50 text-violet-600 rounded-2xl w-fit mb-3 sm:mb-4">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Pedidos Globales</span>
              <div className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {stats.totalOrders || 0}
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] sm:text-xs text-violet-600 font-semibold">
              <Layers className="w-3.5 h-3.5" /> <span className="truncate">${stats.totalRevenue?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Alertas del Sistema */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
            <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-500 rounded-2xl w-fit mb-3 sm:mb-4">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Sistema</span>
              <div className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {systemAlerts.length}
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> <span className="truncate">Avisos activos</span>
            </div>
          </div>

        </div>

        <EarningsPanel userId={user?.id} role="admin" />

        {/* Sección de Contenido Principal (Usuarios recientes + Alertas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Usuarios Recientes */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">Usuarios Recientes</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Últimos registros de cuentas creadas</p>
                </div>
                <Link href="/dashboard/admin/usuarios">
                  <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                    Ver todos <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </div>

              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((u) => (
                    <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{u.name}</div>
                          <div className="text-xs text-slate-500 truncate">{u.email}</div>
                          <div className="text-[11px] text-slate-400">{u.date}</div>
                        </div>
                      </div>

                      <div className="self-end sm:self-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-200/50' :
                            u.role === 'vendedor' ? 'bg-blue-50 text-blue-600 border border-blue-200/50' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                          }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No hay usuarios recientes registrados.</p>
                )}
              </div>
            </div>
          </div>

          {/* Alertas del Sistema */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">Alertas del Sistema</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Avisos y notificaciones críticas</p>
                </div>
              </div>

              <div className="space-y-3">
                {systemAlerts.length > 0 ? (
                  systemAlerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{alert.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{alert.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-3">
                    <p className="text-xs font-bold text-emerald-700">Todo en orden, sin alertas pendientes.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link href="/dashboard/admin/logs">
                <Button variant="outline" className="w-full border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-xs font-semibold py-2.5 rounded-2xl transition-all cursor-pointer shadow-sm">
                  Ver todos los logs
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Accesos Directos</h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">

            <Link href="/dashboard/admin/usuarios" className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-2.5 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Gestionar usuarios</span>
            </Link>

            <Link href="/dashboard/admin/reportes" className="p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-slate-900 hover:to-slate-800 hover:text-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-lg">
              <div className="p-3 rounded-2xl bg-white shadow-md text-slate-800 group-hover:bg-white/10 group-hover:text-white mb-2.5 transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-white transition-colors">Reportes avanzados</span>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}