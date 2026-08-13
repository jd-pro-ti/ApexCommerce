'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { profileService } from '@/services/profileService';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfilePromotions from '@/components/profile/ProfilePromotions';
import ProfileForm from '@/components/profile/ProfileForm';
import OrdersPanel from '@/components/profile/OrdersPanel';
import WishlistPanel from '@/components/profile/WishlistPanel';
import PaymentHistoryPanel from '@/components/profile/PaymentHistoryPanel';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';

const initialProfile = {
  id: '', name: '', email: '', avatar_url: '', role: '', status: '',
  details: {
    phone: '', address: '', city: '', state: '', postal_code: '', country: 'México',
    reference: '', neighborhood: '', birth_date: '', gender: 'prefer_not_to_say', bio: '',
    website: '', social_media: {}, preferences: { email_notifications: true, sms_alerts: false }, notifications: {}
  }
};

const showSuccess = (message) => toast.success(message, { style: { background: '#0f172a', color: '#fff', borderRadius: '12px', padding: '14px 22px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', fontWeight: '500' } });

function PerfilPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, isAuthenticated, loading: authLoading, updateProfile: updateAuthProfile, logout } = useAuth();
  const { orders, loading: ordersLoading, error: ordersError, loadOrders, cancelOrder: cancelOrderRequest, confirmOrderDelivery } = useOrders();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState(initialProfile);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);
  const [sellerApplication, setSellerApplication] = useState(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const fileInputRef = useRef(null);

  async function loadProfile() {
    setLoading(true);
    try {
      const result = await profileService.getProfile(user.id);
      if (result.success) { setProfile(result.profile); setFormData(result.profile); }
      else toast.error(result.error || 'Error al cargar perfil');
    } catch { toast.error('Error al cargar perfil'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login?redirect=/perfil'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
    loadOrders();
  // loadProfile intentionally runs only when the authenticated user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id, router, loadOrders]);

  useEffect(() => {
    if (role !== 'cliente' || !user?.id) return undefined;
    let active = true;
    fetch('/api/seller-applications', { cache: 'no-store' }).then((response) => response.json()).then((result) => { if (active) setSellerApplication(result.application || null); }).catch(() => {});
    return () => { active = false; };
  }, [role, user?.id]);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'orders' || tab === 'historial' || tab === 'pedidos') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('orders');
    } else if (['profile', 'wishlist', 'payments-history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleDetailsChange = (event) => setFormData((previous) => ({ ...previous, details: { ...previous.details, [event.target.name]: event.target.value } }));
  const handleTogglePreference = (field) => { setFormData((previous) => ({ ...previous, details: { ...previous.details, preferences: { ...previous.details.preferences, [field]: !previous.details.preferences?.[field] } } })); showSuccess('Preferencias actualizadas'); };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Solo se permiten imágenes');
    if (file.size > 5 * 1024 * 1024) return toast.error('La imagen no debe superar los 5MB');
    setUploadingAvatar(true);
    try {
      const result = await profileService.uploadAvatar(user.id, file);
      if (!result.success) throw new Error(result.error || 'Error al subir avatar');
      setProfile((previous) => ({ ...previous, avatar_url: result.avatar_url }));
      setFormData((previous) => ({ ...previous, avatar_url: result.avatar_url }));
      await updateAuthProfile({ avatar_url: result.avatar_url });
      showSuccess('Avatar actualizado correctamente');
    } catch (error) { toast.error(error.message); }
    finally { setUploadingAvatar(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const profileResult = await profileService.updateProfile(user.id, { name: formData.name, avatar_url: formData.avatar_url });
      if (!profileResult.success) throw new Error(profileResult.error);
      const detailsResult = await profileService.updateProfileDetails(user.id, { ...formData.details, country: formData.details.country || 'México' });
      if (!detailsResult.success) throw new Error(detailsResult.error);
      await updateAuthProfile({ name: formData.name }); setProfile(formData); setIsEditing(false); showSuccess('¡Información actualizada correctamente!');
    } catch (error) { toast.error(error.message || 'Error al actualizar perfil'); }
    finally { setSaving(false); }
  };

  const cancelOrder = async (order) => { setCancellingId(order.id); const result = await cancelOrderRequest(order.id); setCancellingId(null); setConfirmingCancelId(null); if (result.success) showSuccess('Pedido cancelado correctamente'); };
  const confirmDelivery = async (order) => { if (!window.confirm('¿Confirmas que recibiste todos los productos de este pedido?')) return; setConfirmingDeliveryId(order.id); const result = await confirmOrderDelivery(order.id); setConfirmingDeliveryId(null); if (result.success) showSuccess(result.payout?.released ? 'Entrega confirmada y pagos liberados' : 'Entrega confirmada; liberación pendiente'); else toast.error(result.error || 'No se pudo confirmar la entrega'); };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) return setDeleteAccountError('Cuéntanos por qué deseas eliminar tu cuenta.');
    setDeletingAccount(true); setDeleteAccountError('');
    try {
      const response = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: deleteReason.trim() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(typeof result.error === 'string' ? result.error : 'No se pudo eliminar la cuenta.');
      setDeleteAccountOpen(false); setDeleteReason(''); showSuccess('Solicitud enviada. El administrador revisará tu cuenta.');
    } catch (error) { setDeleteAccountError(error.message); }
    finally { setDeletingAccount(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50/50 pt-32 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  return <div className="min-h-screen bg-slate-50/60 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    <Toaster position="top-right" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <ProfileSidebar formData={formData} role={role} activeTab={activeTab} onTabChange={setActiveTab} fileInputRef={fileInputRef} uploadingAvatar={uploadingAvatar} onAvatarUpload={handleAvatarUpload} onDeleteAccount={() => { setDeleteAccountOpen(true); setDeleteAccountError(''); setDeleteReason(''); }} onLogout={() => logout?.()} />
      <main className="lg:col-span-9 space-y-6">
        <ProfilePromotions role={role} sellerApplication={sellerApplication} />
        {activeTab === 'profile' && <ProfileForm formData={formData} profile={profile} isEditing={isEditing} saving={saving} onEdit={() => setIsEditing(true)} onCancel={() => { setFormData(profile); setIsEditing(false); }} onSubmit={handleSubmit} onChange={handleChange} onDetailsChange={handleDetailsChange} onTogglePreference={handleTogglePreference} />}
        {activeTab === 'orders' && <OrdersPanel orders={orders} loading={ordersLoading} error={ordersError} searchTerm={orderSearchTerm} statusFilter={orderStatusFilter} onSearchChange={setOrderSearchTerm} onStatusChange={setOrderStatusFilter} confirmingCancelId={confirmingCancelId} cancellingId={cancellingId} confirmingDeliveryId={confirmingDeliveryId} onCancelRequest={setConfirmingCancelId} onCancel={cancelOrder} onConfirmDelivery={confirmDelivery} />}
        {activeTab === 'wishlist' && <WishlistPanel />}
        {activeTab === 'payments-history' && <PaymentHistoryPanel orders={orders} />}
      </main>
    </div>
    {deleteAccountOpen && <DeleteAccountModal reason={deleteReason} error={deleteAccountError} loading={deletingAccount} onReasonChange={setDeleteReason} onClose={() => setDeleteAccountOpen(false)} onSubmit={handleDeleteAccount} />}
  </div>;
}

export default function PerfilPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>}><PerfilPageContent /></Suspense>;
}
