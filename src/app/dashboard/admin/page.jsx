'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  

  useEffect(() => {
    // Simular carga de datos
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración 👑
        </h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.name || 'Administrador'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div>
            <p className="text-blue-100 text-sm">Usuarios totales</p>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
            <p className="text-blue-100 text-sm mt-1">{stats.totalSellers} vendedores</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div>
            <p className="text-green-100 text-sm">Productos</p>
            <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
            <p className="text-green-100 text-sm mt-1">{stats.pendingApprovals} por aprobar</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div>
            <p className="text-purple-100 text-sm">Pedidos</p>
            <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
            <p className="text-purple-100 text-sm mt-1">${stats.totalRevenue.toFixed(2)} en ventas</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div>
            <p className="text-orange-100 text-sm">Sistema</p>
            <p className="text-3xl font-bold mt-1">{systemAlerts.length}</p>
            <p className="text-orange-100 text-sm mt-1">Alertas activas</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usuarios recientes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Usuarios recientes</h2>
              <Link href="/dashboard/admin/usuarios">
                <Button variant="outline" size="sm">Gestionar usuarios</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'vendedor' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{user.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Link href="/dashboard/admin/usuarios">
  <Button className="w-full" variant="outline">
    👥 Gestionar usuarios
  </Button>
</Link>

        {/* Alertas del sistema */}
        <div>
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas del sistema</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '❌' : '✅'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/dashboard/admin/logs">
                <Button variant="outline" className="w-full" size="sm">
                  Ver todos los logs
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/admin/usuarios">
          <Button className="w-full" variant="outline">
            👥 Gestionar usuarios
          </Button>
        </Link>
        <Link href="/dashboard/admin/productos">
          <Button className="w-full" variant="outline">
            📦 Gestionar productos
          </Button>
        </Link>
        <Link href="/dashboard/admin/categorias">
          <Button className="w-full" variant="outline">
            📂 Categorías
          </Button>
        </Link>
        <Link href="/dashboard/admin/reportes">
          <Button className="w-full" variant="outline">
            📊 Reportes avanzados
          </Button>
        </Link>
      </div>
    </div>
  );
}