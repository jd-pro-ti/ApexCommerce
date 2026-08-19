'use client';
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import SellerProfileAlert from '@/components/ui/SellerProfileAlert';
import { getAge, validateName, validatePhone, validatePostalCode } from '@/utils/validation';
import { Camera, Edit3, LogOut, Save, User, MapPin, BriefcaseBusiness, Bell, Globe, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const defaultProfile = {
  name: '',
  email: '',
  avatar_url: '',
  role: 'vendedor',
  details: {
    phone: '',
    address: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'México',
    reference: '',
    neighborhood: '',
    house_number: '',
    birth_date: '',
    gender: 'prefer_not_to_say',
    bio: '',
    website: '',
    social_media: {},
    preferences: {
      email_notifications: true,
      sms_alerts: false,
    },
    notifications: {},
  },
};

const tabs = [
  { id: 'profile', label: 'Información personal', icon: User },
  { id: 'address', label: 'Dirección', icon: MapPin },
  { id: 'business', label: 'Información del vendedor', icon: BriefcaseBusiness },
];

function mergeProfile(profile) {
  return {
    ...defaultProfile,
    ...profile,
    details: {
      ...defaultProfile.details,
      ...(profile?.details || {}),
      social_media: {
        ...defaultProfile.details.social_media,
        ...(profile?.details?.social_media || {}),
      },
      preferences: {
        ...defaultProfile.details.preferences,
        ...(profile?.details?.preferences || {}),
      },
      notifications: {
        ...defaultProfile.details.notifications,
        ...(profile?.details?.notifications || {}),
      },
    },
  };
}

function ProfileField({ label, name, value, onChange, type = 'text', placeholder = '', disabled = false, inputClass }) {
  return (
    <label className="block w-full">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input name={name} type={type} value={value || ''} onChange={onChange} placeholder={placeholder} disabled={disabled} className={inputClass} />
    </label>
  );
}

function VendedorPerfilPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const formContainerRef = useRef(null); // Referencia para el scroll automático

  const { user, isAuthenticated, loading: authLoading, updateProfile: updateAuthProfile, logout } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [paypalAccount, setPaypalAccount] = useState(null);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [profileRequirements, setProfileRequirements] = useState([]);

  // Efecto para realizar el scroll automático suave cada vez que cambie de pestaña
  useEffect(() => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchParams.get('required') !== '1') return;
    const validRequirements = ['paypal', 'phone', 'location'];
    const missing = (searchParams.get('missing') || '').split(',').filter((item) => validRequirements.includes(item));
    setProfileRequirements(missing.length ? missing : validRequirements);
  }, [searchParams]);

  const closeProfileRequirements = () => {
    setProfileRequirements([]);
    router.replace('/dashboard/vendedor/perfil', { scroll: false });
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const result = await profileService.getProfile(user.id);
    if (result.success) {
      const nextProfile = mergeProfile(result.profile);
      setProfile(nextProfile);
      setFormData(nextProfile);
    } else {
      toast.error(result.error || 'No se pudo cargar el perfil');
    }
    setLoading(false);
  }, [user?.id]);

  const loadPaypalAccount = useCallback(async () => {
    if (!user?.id) return;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/paypal/sellers/onboard', {
      headers: { Authorization: `Bearer ${session?.access_token || ''}` },
    });
    const result = await response.json();
    if (response.ok) setPaypalAccount(result.account || null);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.id) {
      router.replace('/login?redirect=/dashboard/vendedor/perfil');
      return;
    }
    loadProfile();
    loadPaypalAccount();
  }, [authLoading, isAuthenticated, user?.id, router, loadProfile, loadPaypalAccount]);

  const connectPaypal = async () => {
    setPaypalLoading(true);
    setPaypalError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/paypal/sellers/onboard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar la conexión con PayPal');
      window.location.href = result.actionUrl;
    } catch (error) {
      setPaypalError(error.message);
      setPaypalLoading(false);
    }
  };

  const disconnectPaypal = async () => {
    if (!window.confirm('¿Quieres desconectar esta cuenta de PayPal? Después podrás conectar otra cuenta Sandbox.')) return;
    setPaypalLoading(true);
    setPaypalError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/paypal/sellers/onboard', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo desconectar PayPal');
      setPaypalAccount(null);
      toast.success('Cuenta PayPal desconectada. Ya puedes conectar otra cuenta.');
    } catch (error) {
      setPaypalError(error.message);
    } finally {
      setPaypalLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      details: { ...current.details, [name]: value },
    }));
  };

  const handleSocialChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      details: {
        ...current.details,
        social_media: { ...current.details.social_media, [name]: value },
      },
    }));
  };

  const handleToggle = (group, field) => {
    setFormData((current) => ({
      ...current,
      details: {
        ...current.details,
        [group]: {
          ...current.details[group],
          [field]: !current.details[group]?.[field],
        },
      },
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingAvatar(true);
    const result = await profileService.uploadAvatar(user.id, file);
    if (result.success) {
      setProfile((current) => ({ ...current, avatar_url: result.avatar_url }));
      setFormData((current) => ({ ...current, avatar_url: result.avatar_url }));
      await updateAuthProfile({ avatar_url: result.avatar_url });
      toast.success('Imagen actualizada correctamente');
    } else {
      toast.error(result.error || 'No se pudo actualizar la imagen');
    }
    setUploadingAvatar(false);
    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const age = getAge(formData.details?.birth_date);
      if (age === null || age < 18) throw new Error('Debes tener una fecha de nacimiento válida y ser mayor de 18 años para vender.');
      if (!validateName(formData.name)) throw new Error('Escribe un nombre válido de 2 a 100 caracteres.');
      if (formData.details?.phone && !validatePhone(formData.details.phone)) throw new Error('Escribe un número de teléfono válido.');
      if (formData.details?.postal_code && !validatePostalCode(formData.details.postal_code)) throw new Error('El código postal debe tener exactamente 5 números.');
      if (String(formData.details?.address || '').length > 180 || String(formData.details?.city || '').length > 80 || String(formData.details?.state || '').length > 80) throw new Error('Revisa la longitud de los datos de tu ubicación.');
      
      const basicResult = await profileService.updateProfile(user.id, {
        name: formData.name,
        avatar_url: formData.avatar_url,
      });
      if (!basicResult.success) throw new Error(basicResult.error);

      const detailsResult = await profileService.updateProfileDetails(user.id, formData.details);
      if (!detailsResult.success) throw new Error(detailsResult.error);

      await updateAuthProfile({ name: formData.name, avatar_url: formData.avatar_url });
      setProfile(formData);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(error.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      setDeleteAccountError('Cuéntanos por qué deseas eliminar tu cuenta.');
      return;
    }
    setDeletingAccount(true);
    setDeleteAccountError('');
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason.trim() })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const detail = typeof result.error === 'string' ? result.error : JSON.stringify(result.error || {});
        throw new Error(detail || 'No se pudo eliminar la cuenta.');
      }
      setDeleteAccountOpen(false);
      setDeleteReason('');
      toast.success('Solicitud enviada. El administrador revisará tu cuenta.');
    } catch (error) {
      setDeletingAccount(false);
      setDeleteAccountError(error.message);
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
    isEditing
      ? 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
      : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-600'
  }`;

  if (loading || authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 text-slate-800 sm:px-6 lg:px-10" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Toaster position="top-center" />
      {profileRequirements.length > 0 && <SellerProfileAlert missing={profileRequirements} onClose={closeProfileRequirements} />}
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Cuenta del vendedor</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Administra tus datos personales y la información visible de tu cuenta.</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Sidebar de navegación y perfil */}
          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-3">
            <div className="border-b border-slate-100 pb-5 text-center">
              <div className="relative mx-auto mb-3 h-24 w-24 sm:h-28 sm:w-28">
                <div className="h-full w-full overflow-hidden rounded-full border-4 border-amber-100 bg-slate-100 shadow-sm">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt={formData.name || 'Vendedor'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500">
                      {formData.name?.charAt(0) || 'V'}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-slate-950 p-2 text-white shadow-sm transition hover:bg-amber-600" title="Cambiar imagen">
                  {uploadingAvatar ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <h2 className="font-bold text-slate-950 truncate px-2">{formData.name || 'Vendedor'}</h2>
              <p className="mt-0.5 truncate px-2 text-xs text-slate-500">{formData.email}</p>
              <span className="mt-2 inline-block rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-700">Vendedor</span>
            </div>

            {/* Pestañas de navegación responsive */}
            <nav className="flex flex-row gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id} 
                    type="button" 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex shrink-0 lg:w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition ${
                      activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <button type="button" onClick={() => { setDeleteAccountOpen(true); setDeleteAccountError(''); setDeleteReason(''); }} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />Eliminar cuenta
              </button>
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 px-2 py-1 text-sm font-semibold text-rose-600 hover:text-rose-700">
                <LogOut className="h-4 w-4" />Cerrar sesión
              </button>
            </div>
          </aside>

          {/* Contenido principal con ref para el scroll automático */}
          <main ref={formContainerRef} className="lg:col-span-9 space-y-6 scroll-mt-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Pagos del vendedor</p>
                  <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-950">Conecta tu cuenta PayPal</h2>
                  <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">Recibe el 85% de tus ventas. Apex Commerce retiene el 15% de comisión.</p>
                  {paypalAccount?.onboarding_status === 'pending' && <p className="mt-2 text-xs font-semibold text-amber-600">Onboarding pendiente. Continúa el proceso en PayPal.</p>}
                  {paypalAccount?.onboarding_status === 'connected' && <p className="mt-2 text-xs font-semibold text-emerald-600">Cuenta PayPal conectada correctamente.</p>}
                  {paypalError && <Alert variant="error" className="mt-3">{paypalError}</Alert>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {paypalAccount?.onboarding_status === 'connected' && (
                    <button type="button" onClick={disconnectPaypal} disabled={paypalLoading} className="w-full sm:w-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                      {paypalLoading ? 'Desconectando...' : 'Desconectar PayPal'}
                    </button>
                  )}
                  <button type="button" onClick={connectPaypal} disabled={paypalLoading || paypalAccount?.onboarding_status === 'connected'} className="w-full sm:w-auto rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    {paypalLoading ? 'Procesando...' : paypalAccount?.onboarding_status === 'connected' ? 'PayPal conectado' : paypalAccount?.onboarding_status === 'pending' ? 'Continuar con PayPal' : 'Conectar PayPal'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Actualiza la información asociada a tu cuenta.</p>
                  </div>
                  {!isEditing && (
                    <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 self-start sm:self-auto">
                      <Edit3 className="h-4 w-4" />Editar
                    </button>
                  )}
                </div>

                {activeTab === 'profile' && (
                  <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                    <ProfileField inputClass={inputClass} disabled={!isEditing} label="Nombre completo" name="name" value={formData.name} onChange={handleProfileChange} />
                    <ProfileField inputClass={inputClass} disabled label="Correo electrónico" name="email" value={formData.email} />
                    <ProfileField inputClass={inputClass} disabled={!isEditing} label="Teléfono" name="phone" value={formData.details.phone} onChange={handleDetailsChange} placeholder="+52 55 0000 0000" />
                    <ProfileField inputClass={inputClass} disabled={!isEditing} label="Fecha de nacimiento" name="birth_date" type="date" value={formData.details.birth_date} onChange={handleDetailsChange} />
                    <label className="block w-full">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">Género</span>
                      <select name="gender" value={formData.details.gender || 'prefer_not_to_say'} onChange={handleDetailsChange} disabled={!isEditing} className={inputClass}>
                        <option value="prefer_not_to_say">Prefiero no decirlo</option>
                        <option value="female">Mujer</option>
                        <option value="male">Hombre</option>
                        <option value="non_binary">No binario</option>
                      </select>
                    </label>
                    <div className="md:col-span-2">
                      <label className="block w-full">
                        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Biografía</span>
                        <textarea name="bio" rows="4" value={formData.details.bio || ''} onChange={handleDetailsChange} disabled={!isEditing} placeholder="Cuéntale a tus clientes sobre ti..." className={`${inputClass} resize-none`} />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'address' && (
                  <>
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <ProfileField inputClass={inputClass} disabled={!isEditing} label="Dirección" name="address" value={formData.details.address} onChange={handleDetailsChange} placeholder="Calle y avenida" />
                      </div>
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Número de casa o local" name="house_number" value={formData.details.house_number} onChange={handleDetailsChange} />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Dirección adicional" name="address_line2" value={formData.details.address_line2} onChange={handleDetailsChange} placeholder="Interior, oficina, piso..." />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Colonia / barrio" name="neighborhood" value={formData.details.neighborhood} onChange={handleDetailsChange} />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Ciudad" name="city" value={formData.details.city} onChange={handleDetailsChange} />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Estado" name="state" value={formData.details.state} onChange={handleDetailsChange} />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Código postal" name="postal_code" value={formData.details.postal_code} onChange={handleDetailsChange} />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="País" name="country" value={formData.details.country} onChange={handleDetailsChange} />
                      <div className="md:col-span-2">
                        <ProfileField inputClass={inputClass} disabled={!isEditing} label="Referencia" name="reference" value={formData.details.reference} onChange={handleDetailsChange} placeholder="Punto de referencia para ubicarte" />
                      </div>
                    </div>
                    <Alert variant="info" className="mt-5 text-xs sm:text-sm">Es necesario completar correctamente toda tu ubicación. Si está incompleta, tus pagos podrían no llegar correctamente.</Alert>
                  </>
                )}

                {activeTab === 'business' && (
                  <div className="space-y-4 sm:space-y-5">
                    <label className="block w-full">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">Descripción de tu tienda o actividad</span>
                      <textarea name="bio" rows="5" value={formData.details.bio || ''} onChange={handleDetailsChange} disabled={!isEditing} placeholder="Describe tus productos, experiencia o marca..." className={`${inputClass} resize-none`} />
                    </label>
                    <label className="block w-full">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sitio web</span>
                      <div className="relative">
                        <Globe className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <input name="website" type="url" value={formData.details.website || ''} onChange={handleDetailsChange} disabled={!isEditing} placeholder="https://tusitio.com" className={`${inputClass} pl-11`} />
                      </div>
                    </label>
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Instagram" name="instagram" value={formData.details.social_media.instagram} onChange={handleSocialChange} placeholder="@usuario" />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="Facebook" name="facebook" value={formData.details.social_media.facebook} onChange={handleSocialChange} placeholder="Página o usuario" />
                      <ProfileField inputClass={inputClass} disabled={!isEditing} label="TikTok" name="tiktok" value={formData.details.social_media.tiktok} onChange={handleSocialChange} />
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-3 sm:space-y-4">
                    <Preference label="Notificaciones por correo" description="Pedidos, actualizaciones de cuenta y actividad de tu tienda." enabled={formData.details.preferences.email_notifications} onClick={() => handleToggle('preferences', 'email_notifications')} />
                    <Preference label="Alertas por SMS" description="Avisos importantes sobre pedidos y entregas." enabled={formData.details.preferences.sms_alerts} onClick={() => handleToggle('preferences', 'sms_alerts')} />
                    <Preference label="Nuevos pedidos" description="Recibe avisos cuando un cliente compre tus productos." enabled={formData.details.notifications.new_orders !== false} onClick={() => handleToggle('notifications', 'new_orders')} />
                    <Preference label="Cambios de estado" description="Notificaciones sobre el estado de tus pedidos." enabled={formData.details.notifications.order_updates !== false} onClick={() => handleToggle('notifications', 'order_updates')} />
                  </div>
                )}

                {isEditing && (
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-5">
                    <button type="button" onClick={cancelEditing} className="w-full sm:w-auto rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">
                      {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}Guardar cambios
                    </button>
                  </div>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>

      {deleteAccountOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="seller-delete-account-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600 shrink-0"><Trash2 className="h-5 w-5" /></div>
              <div>
                <h2 id="seller-delete-account-title" className="text-base font-bold text-slate-900">Eliminar cuenta de vendedor</h2>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">Se eliminarán permanentemente tu perfil, información personal, productos, imágenes y datos relacionados. Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">Tu solicitud será enviada al administrador. La cuenta no se eliminará hasta que sea revisada y aprobada.</p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-600" htmlFor="seller-delete-account-reason">¿Por qué deseas eliminar tu cuenta?</label>
            <textarea id="seller-delete-account-reason" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={4} maxLength={1000} placeholder="Escribe el motivo de tu solicitud..." className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100" />
            {deleteAccountError && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{deleteAccountError}</p>}
            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => setDeleteAccountOpen(false)} disabled={deletingAccount} className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full sm:w-auto rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{deletingAccount ? 'Enviando...' : 'Solicitar eliminación'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendedorPerfilPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>}>
      <VendedorPerfilPageContent />
    </Suspense>
  );
}

function Preference({ label, description, enabled, onClick }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button type="button" onClick={onClick} className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition self-end sm:self-auto ${enabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}