'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Store, 
  Plus, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  Star, 
  Trophy, 
  BarChart3, 
  Settings, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalSales: 15420.75,
        orders: 45,
        products: 28,
        pendingOrders: 8,
        rating: 4.7,
      });
      setRecentOrders([
        { id: 'ORD-001', customer: 'María García', total: 599.99, status: 'Pendiente', date: '2024-01-15' },
        { id: 'ORD-002', customer: 'Juan Pérez', total: 299.99, status: 'Enviado', date: '2024-01-14' },
        { id: 'ORD-003', customer: 'Ana López', total: 149.99, status: 'Procesando', date: '2024-01-13' },
      ]);
      setTopProducts([
        { name: 'Smartphone X Pro', sales: 45, revenue: 26999.55 },
        { name: 'Laptop Ultra Slim', sales: 28, revenue: 25199.72 },
        { name: 'Auriculares Bluetooth', sales: 62, revenue: 4959.38 },
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
    <div className="min-h-screen bg-[#f1f3f6] py-10 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera del Panel */}
        <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dd9448]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#010f20]/5 text-[#010f20] rounded-full text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#dd9448]" /> Panel de Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Panel de Vendedor
            </h1>
            <p className="text-xs sm:text-sm text-[#44474c] mt-1">
              Bienvenido de nuevo, <span className="font-bold text-[#010f20]">{user?.name || 'Vendedor'}</span>. Aquí tienes el resumen de tu tienda hoy.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            <Link href="/dashboard/vendedor/productos/nuevo" className="w-full md:w-auto">
              <Button className="w-full md:w-auto bg-[#010f20] text-white hover:bg-[#010f20]/90 text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Agregar Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Ventas totales */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Ventas totales</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  ${stats.totalSales?.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-blue-600 font-bold mr-1">Rendimiento</span> general actual
            </div>
          </div>

          {/* Pedidos Totales */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Pedidos Totales</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {stats.orders}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-emerald-600 font-bold mr-1">{stats.pendingOrders} pendientes</span> de entrega
            </div>
          </div>

          {/* Productos activos */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Productos activos</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {stats.products}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-purple-600 font-bold mr-1">Publicados</span> en la tienda
            </div>
          </div>

          {/* Calificación */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider">Calificación</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1 flex items-center gap-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> {stats.rating}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-amber-600 font-bold mr-1">Excelente</span> reputación
            </div>
          </div>

        </div>

        {/* Grid Principal: Pedidos Recientes y Top Productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Pedidos recientes */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Pedidos Recientes
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Últimas compras realizadas en tu tienda
                  </p>
                </div>
                <Link href="/dashboard/vendedor/pedidos">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Ver todos
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-[#fdfdfd] hover:bg-[#f1f3f6]/50 rounded-2xl border border-[#efedef] transition-colors">
                    <div>
                      <p className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{order.id}</p>
                      <p className="text-xs text-[#44474c] mt-0.5">{order.customer}</p>
                      <p className="text-[10px] text-[#44474c] mt-1">{order.date}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>${order.total.toFixed(2)}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        order.status === 'Enviado' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Productos Top */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Top Productos
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5">
                    Artículos más vendidos
                  </p>
                </div>
                <Link href="/dashboard/vendedor/productos">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Gestionar
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="p-4 bg-[#fdfdfd] rounded-2xl border border-[#efedef]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{product.name}</p>
                        <p className="text-xs text-[#44474c] mt-0.5">{product.sales} ventas</p>
                      </div>
                      <p className="font-extrabold text-xs sm:text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>${product.revenue.toFixed(2)}</p>
                    </div>
                    <div className="mt-3 h-2 bg-[#f1f3f6] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#010f20] rounded-full"
                        style={{ width: `${(product.sales / 62) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#efedef]">
              <Link href="/dashboard/vendedor/analiticas">
                <Button 
                  variant="outline" 
                  className="w-full border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Ver analíticas completas
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
            
            <Link href="/dashboard/vendedor/productos/nuevo">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Agregar producto
                </span>
              </div>
            </Link>

            <Link href="/dashboard/vendedor/pedidos">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Gestionar pedidos
                </span>
              </div>
            </Link>

            <Link href="/dashboard/vendedor/analiticas">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Ver analíticas
                </span>
              </div>
            </Link>

            <Link href="/dashboard/vendedor/configuracion">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors">
                  Configurar tienda
                </span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}