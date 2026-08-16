'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SellerAnalyticsOverview from '@/components/dashboard/SellerAnalyticsOverview';
import { orderService } from '@/services/orderService';

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    orderService.getSellerOrders(user.id).then((response) => {
      if (response?.success) setOrders(response.orders || []);
    }).catch((error) => console.error('Error cargando analíticas:', error)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;
  return <main className="min-h-screen bg-slate-50 py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Link href="/dashboard/vendedor" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Volver al dashboard</Link><header className="mb-8 mt-7"><div className="flex items-center gap-3"><div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><BarChart3 className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold text-slate-900">Analíticas de tu tienda</h1><p className="mt-1 text-sm text-slate-500">Ventas, ganancias, compradores, pedidos y rendimiento de productos.</p></div></div></header><SellerAnalyticsOverview userId={user?.id} orders={orders} /></div></main>;
}
