'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SellerNotificationsPanel from '@/components/dashboard/SellerNotificationsPanel';

export default function SellerNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${session?.access_token || ''}` }, cache: 'no-store' });
    const data = await response.json();
    if (response.ok) setNotifications(data.notifications || []);
    setLoading(false);
  }, [user?.id]);
  // La carga inicial sincroniza la vista con la API de notificaciones.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const updateRead = async (id) => { const { data: { session } } = await supabase.auth.getSession(); const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ id }) }); if (!response.ok) return; setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item)); window.dispatchEvent(new CustomEvent('seller-notifications-read', { detail: { count: 1 } })); };
  const updateAll = async () => { const { data: { session } } = await supabase.auth.getSession(); const response = await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({}) }); if (!response.ok) return; const count = notifications.filter((item) => !item.read_at).length; setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))); window.dispatchEvent(new CustomEvent('seller-notifications-read', { detail: { count } })); };
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;
  return <main className="min-h-screen bg-slate-50 py-10"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><Link href="/dashboard/vendedor" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Volver al dashboard</Link><header className="mb-8 mt-7"><div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Bell className="h-6 w-6" /></div><div><h1 className="text-3xl font-bold text-slate-900">Notificaciones</h1><p className="mt-1 text-sm text-slate-500">Mantente al tanto de la actividad de tu tienda.</p></div></div></header><SellerNotificationsPanel notifications={notifications} onRead={updateRead} onReadAll={updateAll} /></div></main>;
}
