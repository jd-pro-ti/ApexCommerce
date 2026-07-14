'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Vendedor 🏪
        </h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.name || 'Vendedor'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Ventas totales</p>
              <p className="text-3xl font-bold mt-1">${stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Pedidos</p>
              <p className="text-3xl font-bold mt-1">{stats.orders}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Productos activos</p>
              <p className="text-3xl font-bold mt-1">{stats.products}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Calificación</p>
              <p className="text-3xl font-bold mt-1">⭐ {stats.rating}</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Pedidos recientes</h2>
              <Link href="/dashboard/vendedor/pedidos">
                <Button variant="outline" size="sm">Ver todos</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'Entregado' ? 'bg-green-100 text-green-700' :
                      order.status === 'Enviado' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Productos Top */}
        <div>
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Top productos</h2>
              <Link href="/dashboard/vendedor/productos">
                <Button variant="outline" size="sm">Gestionar</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} ventas</p>
                    </div>
                    <p className="font-semibold text-blue-600">${product.revenue.toFixed(2)}</p>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(product.sales / 62) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/vendedor/productos/nuevo">
          <Button className="w-full" variant="primary">
            ➕ Agregar producto
          </Button>
        </Link>
        <Link href="/dashboard/vendedor/pedidos">
          <Button className="w-full" variant="outline">
            📦 Gestionar pedidos
          </Button>
        </Link>
        <Link href="/dashboard/vendedor/analiticas">
          <Button className="w-full" variant="outline">
            📊 Ver analíticas
          </Button>
        </Link>
        <Link href="/dashboard/vendedor/configuracion">
          <Button className="w-full" variant="outline">
            ⚙️ Configurar tienda
          </Button>
        </Link>
      </div>
    </div>
  );
}