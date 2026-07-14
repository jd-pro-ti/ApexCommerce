
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    // Simular carga de datos
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {user?.name || 'Cliente'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Bienvenido a tu panel de cliente</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de pedidos</p>
              <p className="text-3xl font-bold mt-1">{stats.orders}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total gastado</p>
              <p className="text-3xl font-bold mt-1">${stats.totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Lista de deseos</p>
              <p className="text-3xl font-bold mt-1">{stats.wishlistItems}</p>
            </div>
            <div className="text-3xl">❤️</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pedidos pendientes</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Pedidos recientes</h2>
              <Link href="/dashboard/cliente/pedidos">
                <Button variant="outline" size="sm">Ver todos</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-600">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'Entregado' ? 'bg-green-100 text-green-700' :
                      order.status === 'En camino' ? 'bg-blue-100 text-blue-700' :
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

        {/* Lista de deseos */}
        <div>
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Lista de deseos</h2>
              <Link href="/dashboard/cliente/wishlist">
                <Button variant="outline" size="sm">Ver todo</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                  <Button size="sm">Agregar</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/catalogo">
          <Button className="w-full" variant="outline">
            🛍️ Seguir comprando
          </Button>
        </Link>
        <Link href="/carrito">
          <Button className="w-full" variant="outline">
            🛒 Ir al carrito
          </Button>
        </Link>
        <Link href="/perfil">
          <Button className="w-full" variant="outline">
            👤 Mi perfil
          </Button>
        </Link>
        <Link href="/dashboard/cliente/historial">
          <Button className="w-full" variant="outline">
            📋 Historial de pagos
          </Button>
        </Link>
      </div>
    </div>
  );
}