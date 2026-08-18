// src/app/perfil/page.js
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useAlert } from '@/components/ui/AlertContext'; // <--- 1. Importamos el hook global de alertas
import { profileService } from '@/services/profileService';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfilePromotions from '@/components/profile/ProfilePromotions';
import ProfileForm from '@/components/profile/ProfileForm';
import OrdersPanel from '@/components/profile/OrdersPanel';
import WishlistPanel from '@/components/profile/WishlistPanel';
import PaymentHistoryPanel from '@/components/profile/PaymentHistoryPanel';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { getAge, validateName, validatePhone, validatePostalCode } from '@/utils/validation';
import { CircleAlert, PackageCheck, X } from 'lucide-react';

const initialProfile = {
  id: '', name: '', email: '', avatar_url: '', role: '', status: '',
  details: {
    phone: '', address: '', city: '', state: '', postal_code: '', country: 'México',
    reference: '', neighborhood: '', birth_date: '', gender: 'prefer_not_to_say', bio: '',
    website: '', social_media: {}, preferences: { email_notifications: true, sms_alerts: false }, notifications: {}
  }
};

function PerfilPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, isAuthenticated, loading: authLoading, updateProfile: updateAuthProfile, logout } = useAuth();
  const { orders, loading: ordersLoading, error: ordersError, loadOrders, cancelOrder: cancelOrderRequest, confirmOrderDelivery } = useOrders();
  const { showAlert } = useAlert(); // <--- 2. Inicializamos la función global de alertas
  
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
  const [deliveryToConfirm, setDeliveryToConfirm] = useState(null);
  const [sellerApplication, setSellerApplication] = useState(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  
  const fileInputRef = useRef(null);
  const mainContentRef = useRef(null);

  async function loadProfile() {
    setLoading(true);
    try {
      const result = await profileService.getProfile(user.id);
      if (result.success) { setProfile(result.profile); setFormData(result.profile); }
      else showAlert(result.error || 'Error al cargar perfil', 'error'); // <--- Reemplazo de toast
    } catch { showAlert('Error al cargar perfil', 'error'); } // <--- Reemplazo de toast
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login?redirect=/perfil'); return; }
    loadProfile();
    loadOrders();
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
      setActiveTab('orders');
    } else if (['profile', 'wishlist', 'payments-history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024 && mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleDetailsChange = (event) => setFormData((previous) => ({ ...previous, details: { ...previous.details, [event.target.name]: event.target.value } }));
  
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showAlert('Solo se permiten imágenes', 'error'); // <--- Reemplazo
    if (file.size > 5 * 1024 * 1024) return showAlert('La imagen no debe superar los 5MB', 'error'); // <--- Reemplazo
    setUploadingAvatar(true);
    try {
      const result = await profileService.uploadAvatar(user.id, file);
      if (!result.success) throw new Error(result.error || 'Error al subir avatar');
      setProfile((previous) => ({ ...previous, avatar_url: result.avatar_url }));
      setFormData((previous) => ({ ...previous, avatar_url: result.avatar_url }));
      await updateAuthProfile({ avatar_url: result.avatar_url });
      showAlert('Avatar actualizado correctamente', 'success'); // <--- Reemplazo
    } catch (error) { showAlert(error.message, 'error'); } // <--- Reemplazo
    finally { setUploadingAvatar(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const age = getAge(formData.details?.birth_date);
      if (age === null || age < 12) throw new Error('Debes tener una fecha de nacimiento válida y al menos 12 años.');
      if (!validateName(formData.name)) throw new Error('Escribe un nombre válido de 2 a 100 caracteres.');
      if (formData.details?.phone && !validatePhone(formData.details.phone)) throw new Error('Escribe un número de teléfono válido.');
      if (formData.details?.postal_code && !validatePostalCode(formData.details.postal_code)) throw new Error('El código postal debe tener exactamente 5 números.');
      if (String(formData.details?.address || '').length > 180 || String(formData.details?.city || '').length > 80 || String(formData.details?.state || '').length > 80) throw new Error('Revisa la longitud de los datos de tu ubicación.');
      const profileResult = await profileService.updateProfile(user.id, { name: formData.name, avatar_url: formData.avatar_url });
      if (!profileResult.success) throw new Error(profileResult.error);
      const detailsResult = await profileService.updateProfileDetails(user.id, { ...formData.details, country: formData.details.country || 'México' });
      if (!detailsResult.success) throw new Error(detailsResult.error);
      await updateAuthProfile({ name: formData.name }); setProfile(formData); setIsEditing(false); 
      showAlert('¡Información actualizada correctamente!', 'success'); // <--- Reemplazo
    } catch (error) { showAlert(error.message || 'Error al actualizar perfil', 'error'); } // <--- Reemplazo
    finally { setSaving(false); }
  };

  const cancelOrder = async (order) => { 
    setCancellingId(order.id); 
    const result = await cancelOrderRequest(order.id); 
    setCancellingId(null); 
    setConfirmingCancelId(null); 
    if (result.success) showAlert('Pedido cancelado correctamente', 'success'); // <--- Reemplazo
  };

  const confirmDelivery = async (order) => { 
    setDeliveryToConfirm(null); 
    setConfirmingDeliveryId(order.id); 
    const result = await confirmOrderDelivery(order.id); 
    setConfirmingDeliveryId(null); 
    if (result.success) {
      showAlert(result.payout?.released ? 'Entrega confirmada' : 'Entrega confirmada; liberación pendiente', 'success'); // <--- Reemplazo
    } else {
      showAlert(result.error || 'No se pudo confirmar la entrega', 'error'); // <--- Reemplazo
    } 
  };

  const requestDeliveryConfirmation = (order) => setDeliveryToConfirm(order);

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) return setDeleteAccountError('Cuéntanos por qué deseas eliminar tu cuenta.');
    setDeletingAccount(true); setDeleteAccountError('');
    try {
      const response = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: deleteReason.trim() }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(typeof result.error === 'string' ? result.error : 'No se pudo eliminar la cuenta.');
      setDeleteAccountOpen(false); setDeleteReason(''); 
      showAlert('Solicitud enviada. El administrador revisará tu cuenta.', 'success'); // <--- Reemplazo
    } catch (error) { setDeleteAccountError(error.message); }
    finally { setDeletingAccount(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50/50 pt-32 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  
  return (
    <div className="min-h-screen bg-slate-50/60 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Se eliminó <Toaster /> ya que usamos las alertas globales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <ProfileSidebar 
          formData={formData} 
          role={role} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          fileInputRef={fileInputRef} 
          uploadingAvatar={uploadingAvatar} 
          onAvatarUpload={handleAvatarUpload} 
          onLogout={() => logout?.()} 
        />
        
        <main ref={mainContentRef} className="lg:col-span-9 space-y-6">
          <ProfilePromotions role={role} sellerApplication={sellerApplication} />
          {activeTab === 'profile' && <ProfileForm formData={formData} profile={profile} isEditing={isEditing} saving={saving} onEdit={() => setIsEditing(true)} onCancel={() => { setFormData(profile); setIsEditing(false); }} onSubmit={handleSubmit} onChange={handleChange} onDetailsChange={handleDetailsChange} />}
          {activeTab === 'orders' && <OrdersPanel orders={orders} loading={ordersLoading} error={ordersError} searchTerm={orderSearchTerm} statusFilter={orderStatusFilter} onSearchChange={setOrderSearchTerm} onStatusChange={setOrderStatusFilter} confirmingCancelId={confirmingCancelId} cancellingId={cancellingId} confirmingDeliveryId={confirmingDeliveryId} onCancelRequest={setConfirmingCancelId} onCancel={cancelOrder} onConfirmDelivery={requestDeliveryConfirmation} />}
          {activeTab === 'wishlist' && <WishlistPanel />}
          {activeTab === 'payments-history' && <PaymentHistoryPanel orders={orders} />}
        </main>
      </div>

      {deliveryToConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delivery-confirmation-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Confirmar entrega</p>
                  <h2 id="delivery-confirmation-title" className="mt-1 text-xl font-extrabold text-slate-950">¿Recibiste tu pedido?</h2>
                </div>
              </div>
              <button type="button" onClick={() => setDeliveryToConfirm(null)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar confirmación">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 sm:px-7">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <p className="text-sm leading-6 text-slate-700">Confirma solo si recibiste todos los productos de la orden <strong>#{deliveryToConfirm.order_number}</strong></p>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setDeliveryToConfirm(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Todavía no
                </button>
                <button type="button" onClick={() => confirmDelivery(deliveryToConfirm)} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                  Sí, recibí todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>}><PerfilPageContent /></Suspense>;
}