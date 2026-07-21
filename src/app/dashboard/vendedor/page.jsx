'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
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
  ArrowRight 
} from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Simular carga de datos
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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8f9fa]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 md:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera del Panel */}
        <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span 
              className="text-[10px] font-bold tracking-widest text-[#dd9448] uppercase block mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              PANEL DE CONTROL
            </span>
            <h1 
              className="text-2xl sm:text-3xl font-bold text-[#010f20] tracking-tight flex items-center gap-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <span>Panel de Vendedor</span>
              <Store className="w-7 h-7 text-[#dd9448]" />
            </h1>
            <p 
              className="text-xs sm:text-sm text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Bienvenido de nuevo, <span className="font-semibold text-slate-900">{user?.name || 'Vendedor'}</span>. Aquí tienes el resumen de tu tienda hoy.
            </p>
          </div>
          
          <Link href="/dashboard/vendedor/productos/nuevo">
            <Button 
              className="!bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3 px-5 rounded-md transition-all tracking-wide uppercase shadow-sm focus:ring-0 flex items-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Plus className="w-4 h-4" /> Agregar Producto
            </Button>
          </Link>
        </div>

        {/* Stats Grid Mejorada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#44474c]/70 font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ventas totales</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#010f20] mt-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>${stats.totalSales?.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#44474c]/70 font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pedidos Totales</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#010f20] mt-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.orders}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#44474c]/70 font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Productos activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#010f20] mt-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.products}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#efedef] p-6 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#44474c]/70 font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Calificación</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#010f20] mt-1.5 flex items-center gap-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> {stats.rating}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shadow-inner">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Principal: Pedidos Recientes y Top Productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Pedidos recientes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#efedef]">
                  <h2 
                    className="text-lg font-bold text-[#010f20] tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Pedidos Recientes
                  </h2>
                  <Link href="/dashboard/vendedor/pedidos">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border border-gray-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-md transition-all shadow-sm focus:ring-0"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Ver todos
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-[#fafbfc] rounded-xl border border-[#efedef] p-4 flex items-center justify-between gap-4 transition-all hover:bg-white"
                    >
                      <div>
                        <p className="font-bold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{order.id}</p>
                        <p className="text-xs text-[#44474c]/80 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{order.customer}</p>
                        <p className="text-[10px] text-slate-400 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>${order.total.toFixed(2)}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'Enviado' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Productos Top */}
          <div>
            <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#efedef]">
                  <h2 
                    className="text-lg font-bold text-[#010f20] tracking-tight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Top Productos
                  </h2>
                  <Link href="/dashboard/vendedor/productos">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border border-gray-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-md transition-all shadow-sm focus:ring-0"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Gestionar
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="bg-[#fafbfc] rounded-xl border border-[#efedef] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{product.name}</p>
                          <p className="text-xs text-[#44474c]/70 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{product.sales} ventas</p>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-[#dd9448]" style={{ fontFamily: "'Montserrat', sans-serif" }}>${product.revenue.toFixed(2)}</p>
                      </div>
                      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0b1523] rounded-full"
                          style={{ width: `${(product.sales / 62) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Acciones Rápidas Unificadas */}
        <div className="bg-white rounded-2xl border border-[#efedef] p-6 sm:p-8 shadow-sm">
          <h3 
            className="text-sm font-bold text-[#010f20] uppercase tracking-wider mb-4"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Acceso Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/dashboard/vendedor/productos/nuevo" className="w-full">
              <Button 
                variant="outline"
                className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Plus className="w-4 h-4" /> Agregar producto
              </Button>
            </Link>
            <Link href="/dashboard/vendedor/pedidos" className="w-full">
              <Button 
                variant="outline"
                className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Package className="w-4 h-4" /> Gestionar pedidos
              </Button>
            </Link>
            <Link href="/dashboard/vendedor/analiticas" className="w-full">
              <Button 
                variant="outline"
                className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <BarChart3 className="w-4 h-4" /> Ver analíticas
              </Button>
            </Link>
            <Link href="/dashboard/vendedor/configuracion" className="w-full">
              <Button 
                variant="outline"
                className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Settings className="w-4 h-4" /> Configurar tienda
              </Button>
            </Link>
            <Link href="/dashboard/vendedor/productos" className="w-full col-span-2 md:col-span-1">
              <Button 
                variant="outline"
                className="w-full border border-gray-200 hover:border-slate-800 text-slate-700 text-xs font-semibold py-3 rounded-xl transition-all shadow-sm focus:ring-0 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <ShoppingBag className="w-4 h-4" /> Mis Productos
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}