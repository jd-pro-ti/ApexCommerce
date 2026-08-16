'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bell, ChevronLeft, ChevronRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';

const defaultPreferences = { email_notifications: true, order_updates: true };

function SettingRow({ icon: Icon, title, description, children }) {
  return <div className="flex items-center justify-between gap-5 border-b border-slate-100 px-5 py-5 last:border-0"><div className="flex min-w-0 items-start gap-4"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{description}</p></div></div>{children}</div>;
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`flex h-8 w-[92px] shrink-0 items-center justify-between rounded-full p-1 transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}><span className={`text-[9px] font-extrabold tracking-wide ${checked ? 'order-1 pl-1 text-white' : 'order-2 pr-1 text-slate-600'}`}>{checked ? 'ACTIVO' : 'APAGADO'}</span><span className={`h-6 w-6 rounded-full bg-white shadow-md ${checked ? 'order-2' : 'order-1'}`} /></button>;
}

export default function ConfiguracionesContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.replace('/login?redirect=/configuraciones'); return; }
    let active = true;
    profileService.getProfile(user.id).then((result) => { if (!active) return; const loaded = result.profile?.details?.preferences || {}; setPreferences({ email_notifications: loaded.email_notifications !== false, order_updates: loaded.order_updates !== false }); setLoading(false); }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, isAuthenticated, router, user?.id]);

  const updatePreference = (name) => setPreferences((current) => ({ ...current, [name]: !current[name] }));
  const savePreferences = async () => { setSaving(true); const result = await profileService.updateProfileDetails(user.id, { preferences }); setSaving(false); if (result.success) toast.success('Preferencias guardadas'); else toast.error(result.error || 'No se pudieron guardar las preferencias'); };
  const deleteAccount = async () => { if (!deleteReason.trim()) return setDeleteError('Cuéntanos por qué deseas eliminar tu cuenta.'); setDeleting(true); setDeleteError(''); try { const response = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: deleteReason.trim() }) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo enviar la solicitud.'); setDeleteOpen(false); setDeleteReason(''); toast.success('Solicitud enviada para revisión'); } catch (error) { setDeleteError(error.message); } finally { setDeleting(false); } };

  if (loading || authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]"><LoadingSpinner size="lg" /></div>;
  return <div className="min-h-screen bg-[#f8f9fa] px-4 pb-24 pt-28 text-slate-800 sm:px-6 lg:px-10"><div className="mx-auto max-w-5xl"><Link href="/perfil" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /> Volver a mi perfil</Link><header className="mb-8"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#dd9448]">Cuenta de cliente</p><h1 className="text-3xl font-extrabold tracking-tight text-[#010f20] sm:text-4xl">Configuraciones</h1><p className="mt-2 text-sm text-slate-500">Personaliza tu experiencia y mantén el control de tu cuenta.</p></header><div className="grid gap-6 lg:grid-cols-[1fr_280px]"><main className="space-y-6"><section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5"><h2 className="text-base font-bold text-slate-900">Preferencias</h2><p className="mt-1 text-xs text-slate-500">Elige cómo quieres recibir notificaciones.</p></div><SettingRow icon={Mail} title="Notificaciones por correo" description="Recibe avisos sobre tu cuenta y actividad importante."><Toggle checked={preferences.email_notifications} onChange={() => updatePreference('email_notifications')} label="Notificaciones por correo" /></SettingRow><SettingRow icon={Bell} title="Actualizaciones de pedidos" description="Te avisaremos cuando tu pedido cambie de estado."><Toggle checked={preferences.order_updates} onChange={() => updatePreference('order_updates')} label="Actualizaciones de pedidos" /></SettingRow><div className="flex justify-end border-t border-slate-100 px-5 py-4"><button type="button" onClick={savePreferences} disabled={saving} className="rounded-xl bg-[#010f20] px-5 py-3 text-xs font-bold text-white hover:bg-[#162536] disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar preferencias'}</button></div></section><section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5"><h2 className="text-base font-bold text-slate-900">Cuenta y seguridad</h2><p className="mt-1 text-xs text-slate-500">Administra tu información y tus opciones de acceso.</p></div><Link href="/perfil?tab=profile" className="flex items-center justify-between border-b border-slate-100 px-5 py-5 hover:bg-slate-50"><div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><UserRound className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-slate-900">Información personal</h3><p className="mt-1 text-xs text-slate-500">Edita tu nombre, teléfono y dirección.</p></div></div><ChevronRight className="h-4 w-4 text-slate-400" /></Link><Link href="/actualizar-password" className="flex items-center justify-between px-5 py-5 hover:bg-slate-50"><div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><LockKeyhole className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-slate-900">Contraseña y acceso</h3><p className="mt-1 text-xs text-slate-500">Cambia tu contraseña directamente con tu sesión activa.</p></div></div><ChevronRight className="h-4 w-4 text-slate-400" /></Link></section><section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-5"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><span className="text-lg">!</span></div><div><h2 className="text-sm font-bold text-slate-900">Zona de riesgo</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">Solicita la eliminación permanente de tu cuenta y su información asociada.</p></div></div><button type="button" onClick={() => { setDeleteOpen(true); setDeleteError(''); }} className="shrink-0 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50">Eliminar cuenta</button></div></section></main><aside className="space-y-6"><div className="rounded-2xl bg-[#010f20] p-6 text-white shadow-lg"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dd9448] text-[#010f20]"><ShieldCheck className="h-6 w-6" /></div><h2 className="text-base font-bold">Tu cuenta, bajo control</h2><p className="mt-2 text-xs leading-5 text-white/60">Tus preferencias se guardan en tu perfil y puedes cambiarlas cuando quieras.</p></div></aside></div></div>{deleteOpen && <DeleteAccountModal reason={deleteReason} error={deleteError} loading={deleting} onReasonChange={setDeleteReason} onClose={() => setDeleteOpen(false)} onSubmit={deleteAccount} />}</div>;
}
