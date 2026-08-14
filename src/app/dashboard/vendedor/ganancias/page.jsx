'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SellerEarningsOverview from '@/components/dashboard/SellerEarningsOverview';
import { orderService } from '@/services/orderService';

export default function SellerEarningsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [{ success, orders: sellerOrders = [] }, { data: { session } }] = await Promise.all([orderService.getSellerOrders(user.id), supabase.auth.getSession()]);
        setOrders(success ? sellerOrders : []);
        const response = await fetch(`/api/admin/earnings?sellerId=${encodeURIComponent(user.id)}`, { headers: { Authorization: `Bearer ${session?.access_token || ''}` }, cache: 'no-store' });
        if (response.ok) setReport(await response.json());
      } catch (error) { console.error('Error cargando ganancias:', error); } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const downloadCsv = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/admin/earnings?format=csv&sellerId=${encodeURIComponent(user.id)}`, { headers: { Authorization: `Bearer ${session?.access_token || ''}` } });
    if (!response.ok) return;
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(await response.blob()); anchor.download = 'mis-ganancias.csv'; anchor.click();
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;
  return <main className="min-h-screen bg-slate-50 py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Link href="/dashboard/vendedor" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Volver al dashboard</Link><header className="mb-8 mt-7"><div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><BarChart3 className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold text-slate-900">Mis ganancias</h1><p className="mt-1 text-sm text-slate-500">Ventas brutas, comisión de Apex y ganancias netas por producto.</p></div></div></header><SellerEarningsOverview report={report} orders={orders} onDownload={downloadCsv} /></div></main>;
}
