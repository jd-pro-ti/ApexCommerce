'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Package, 
  ShoppingBag, 
  Heart, 
  Clock, 
  ArrowRight, 
  CreditCard, 
  User, 
  Store, 
  ShoppingCart,
  Sparkles
} from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    // Verificar autenticación
    if (authLoading) return;
    if (!isAuthenticated) {
      
      return;
    }
    if (user.role === 'admin'){
      router.push('/dashboard/admin?redirect=/dashboard/cliente');
      return;
    }
    if (user.role === 'vendedor'){
      router.push('/dashboard/vendedor?redirect=/dashboard/cliente');
      return;
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    // Simular carga de datos estáticos
    setTimeout(() => {
      setStats({
        orders: 12,
        totalSpent: 2499.99,
        wishlistItems: 5,
        pendingOrders: 2,
      });
      setRecentOrders([
        { id: 'ORD-001', date: '2024-01-15', total: 599.99, status: 'Entregado' },
        { id: 'ORD-002', date: '2024-01-12', total: 89.99, status: 'En camino' },
        { id: 'ORD-003', date: '2024-01-10', total: 199.99, status: 'Procesando' },
      ]);
      setWishlist([
        { id: 'w1', name: 'Smartphone X Pro', price: 599.99, image: '/images/product1.jpg' },
        { id: 'w2', name: 'Auriculares Bluetooth', price: 79.99, image: '/images/product2.jpg' },
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
    <div className="min-h-screen bg-[#f1f3f6] py-28 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de Bienvenida */}
        <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dd9448]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#010f20]/5 text-[#010f20] rounded-full text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#dd9448]" /> Panel de Cliente
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              ¡Hola, {user?.name || 'Cliente'}!
            </h1>
            <p className="text-xs sm:text-sm text-[#44474c] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Aquí tienes un resumen general de tu actividad, pedidos y lista de deseos.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            <Link href="/catalogo" className="w-full md:w-auto">
              <Button 
                className="w-full md:w-auto bg-[#010f20] text-white hover:bg-[#010f20]/90 text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Store className="w-4 h-4" /> Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Estadísticas (Stats Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Total de Pedidos */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Total de Pedidos</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.orders}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-blue-600 font-bold mr-1">Historial activo</span> en la plataforma
            </div>
          </div>

          {/* Total Gastado */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Total Gastado</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>${stats.totalSpent?.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-emerald-600 font-bold mr-1">Inversión total</span> acumulada
            </div>
          </div>

          {/* Lista de Deseos */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Lista de Deseos</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.wishlistItems}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                <Heart className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-purple-600 font-bold mr-1">Productos guardados</span> para después
            </div>
          </div>

          {/* Pedidos Pendientes */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#efedef] relative overflow-hidden group hover:border-[#010f20] transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#44474c] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pedidos Pendientes</p>
                <p className="text-3xl font-extrabold text-[#010f20] mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#dd9448] shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#efedef] flex items-center text-[11px] text-[#44474c]">
              <span className="text-[#dd9448] font-bold mr-1">En proceso</span> de envío o entrega
            </div>
          </div>

        </div>

        {/* Contenido Principal (Pedidos recientes & Lista de deseos) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Pedidos Recientes (Ocupa 2 columnas) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Pedidos recientes
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Estado actual de tus últimas compras
                  </p>
                </div>
                <Link href="/dashboard/cliente/pedidos">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Ver todos
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-[#fdfdfd] hover:bg-[#f1f3f6]/50 rounded-2xl border border-[#efedef] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 flex items-center justify-center text-[#010f20]">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>{order.id}</p>
                        <p className="text-xs text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{order.date}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>${order.total.toFixed(2)}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        order.status === 'En camino' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Deseos (Ocupa 1 columna) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Lista de deseos
                  </h2>
                  <p className="text-xs text-[#44474c] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Tus artículos guardados
                  </p>
                </div>
                <Link href="/dashboard/cliente/wishlist">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border border-[#efedef] hover:border-[#010f20] text-[#010f20] text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Ver todo
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {wishlist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-[#fdfdfd] hover:bg-[#f1f3f6]/50 rounded-2xl border border-[#efedef] transition-colors">
                    <div className="w-12 h-12 bg-[#f1f3f6] rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-[#efedef] text-[#44474c]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <ShoppingBag className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-[#010f20] truncate" style={{ fontFamily: "'Montserrat', sans-serif" }}>{item.name}</p>
                      <p className="text-xs font-semibold text-[#44474c] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${item.price.toFixed(2)}</p>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-[#010f20] text-white hover:bg-[#010f20]/90 text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl transition-all cursor-pointer shrink-0"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#efedef]">
          <h2 className="text-lg font-extrabold text-[#010f20] mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Accesos Rápidos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <Link href="/catalogo">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Seguir comprando
                </span>
              </div>
            </Link>

            <Link href="/carrito">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ir al carrito
                </span>
              </div>
            </Link>

            <Link href="/perfil">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Mi perfil
                </span>
              </div>
            </Link>

            <Link href="/dashboard/cliente/historial">
              <div className="p-4 bg-[#fdfdfd] hover:bg-[#010f20] hover:text-white rounded-2xl border border-[#efedef] transition-all group cursor-pointer flex flex-col items-center text-center shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#010f20]/5 group-hover:bg-white/10 flex items-center justify-center text-[#010f20] group-hover:text-white mb-2 transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#010f20] group-hover:text-white transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Historial de pagos
                </span>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}
