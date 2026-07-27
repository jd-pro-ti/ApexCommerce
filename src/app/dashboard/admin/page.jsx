'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FolderTree, 
  BarChart3, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    // Simular carga de datos estáticos
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        totalSellers: 45,
        totalProducts: 3280,
        totalOrders: 892,
        totalRevenue: 157920.50,
        pendingApprovals: 12,
      });
      setRecentUsers([
        { id: '1', name: 'María García', email: 'maria@email.com', role: 'vendedor', date: '2024-01-15' },
        { id: '2', name: 'Juan Pérez', email: 'juan@email.com', role: 'cliente', date: '2024-01-14' },
        { id: '3', name: 'Ana López', email: 'ana@email.com', role: 'vendedor', date: '2024-01-13' },
      ]);
      setSystemAlerts([
        { id: '1', type: 'warning', message: '3 productos sin stock', date: '2024-01-15' },
        { id: '2', type: 'info', message: 'Nuevo vendedor registrado', date: '2024-01-14' },
        { id: '3', type: 'success', message: 'Pagos procesados correctamente', date: '2024-01-13' },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f1f3f6]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] py-28 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de Bienvenida */}
        <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dd9448]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#010f20]/5 text-[#010f20] rounded-full text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#dd9448]" /> Panel de Administración
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              ¡Hola, {user?.name || 'Administrador'}!
            </h1>
            <p className="text-xs sm:text-sm text-[#44474c] mt-1">
              Control total y supervisión general de la plataforma.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            <Link href="/dashboard/admin/reportes" className="w-full md:w-auto">
              <Button 
                className="w-full md:w-auto bg-[#010f20] text-white hover:bg-[#010f20]/90 text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> Ver Reportes
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Usuarios Totales */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Usuarios Totales</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-blue-600 font-bold mr-1">{stats.totalSellers} vendedores</span> registrados
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Productos</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-emerald-600 font-bold mr-1">{stats.pendingApprovals} por aprobar</span> en catálogo
            </div>
          </div>

          {/* Pedidos y Ventas */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Pedidos</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-purple-600 font-bold mr-1">${stats.totalRevenue?.toFixed(2)}</span> en ventas
            </div>
          </div>

          {/* Alertas del Sistema */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Sistema</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{systemAlerts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#dd9448] shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-[#dd9448] font-bold mr-1">Alertas activas</span> requiriendo atención
            </div>
          </div>

        </div>

        {/* Contenido Principal (Usuarios recientes y Alertas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Usuarios Recientes (Ocupa 2 columnas) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Usuarios recientes
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Últimos registros en la plataforma
                  </p>
                </div>
                <Link href="/dashboard/admin/usuarios">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Gestionar usuarios
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-[#fdfdfd] hover:bg-[#f1f3f6]/50 rounded-2xl border border-[#efedef] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{u.name}</p>
                        <p className="text-xs text-[#44474c]">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-200' :
                        u.role === 'vendedor' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                      <p className="text-[11px] text-[#44474c] mt-1">{u.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas del Sistema (Ocupa 1 columna) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Alertas del sistema
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Estado de actividad y avisos
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-2xl border transition-colors ${
                    alert.type === 'warning' ? 'bg-amber-50/50 border-amber-200' :
                    alert.type === 'error' ? 'bg-red-50/50 border-red-200' :
                    'bg-emerald-50/50 border-emerald-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                         alert.type === 'error' ? <XCircle className="w-5 h-5 text-red-600" /> :
                         <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#010f20] leading-snug">{alert.message}</p>
                        <p className="text-[10px] text-[#44474c] mt-1">{alert.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#efedef]">
              <Link href="/dashboard/admin/logs">
                <Button 
                  variant="outline" 
                  className="w-full border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Ver todos los logs
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef]">
          <h2 className="text-lg font-extrabold text-[#010f20] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Accesos Rápidos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <Link href="/dashboard/admin/usuarios">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Gestionar usuarios
                </span>
              </div>
            </Link>

            <Link href="/dashboard/admin/productos">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Gestionar productos
                </span>
              </div>
            </Link>

            <Link href="/dashboard/admin/categorias">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <FolderTree className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Categorías
                </span>
              </div>
            </Link>

            <Link href="/dashboard/admin/reportes">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Reportes avanzados
                </span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}