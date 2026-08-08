'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { 
  User, ShoppingBag, Heart, MapPin, CreditCard, LogOut, 
  Camera, Edit3, Save, Eye, Package, ArrowRight, Clock, 
  CheckCircle2, Truck, XCircle, AlertCircle, ChevronRight, ArrowUpRight, Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const labels = { 
  pending: 'Pendiente', 
  processing: 'En proceso', 
  shipped: 'Enviado', 
  delivered: 'Entregado', 
  cancelled: 'Cancelado' 
};

const statusConfig = {
  pending: {
    bg: 'bg-amber-50/80 text-amber-800 border-amber-200/80 font-semibold',
    icon: Clock,
  },
  processing: {
    bg: 'bg-sky-50/80 text-sky-800 border-sky-200/80 font-semibold',
    icon: AlertCircle,
  },
  shipped: {
    bg: 'bg-violet-50/80 text-violet-800 border-violet-200/80 font-semibold',
    icon: Truck,
  },
  delivered: {
    bg: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 font-semibold',
    icon: CheckCircle2,
  },
  cancelled: {
    bg: 'bg-rose-50/80 text-rose-800 border-rose-200/80 font-semibold',
    icon: XCircle,
  }
};

const getOrderStatus = (order) => {
  const items = order.order_items || [];
  if (!items.length) return order.status || 'pending';

  const statuses = items.map(item => item.status || order.status || 'pending');
  if (statuses.every(status => status === 'cancelled')) return 'cancelled';
  if (statuses.every(status => status === 'delivered')) return 'delivered';
  if (statuses.includes('shipped')) return 'shipped';
  if (statuses.includes('processing')) return 'processing';
  return 'pending';
};

const showCustomToast = (message) => {
  toast.success(message, {
    style: {
      background: '#0f172a',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '14px 22px',
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  });
};

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
  const fileInputRef = useRef(null);

  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);
  const [sellerApplication, setSellerApplication] = useState(null);

  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    avatar_url: '',
    role: '',
    status: '',
    details: {
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'México',
      reference: '',
      neighborhood: '',
      birth_date: '',
      gender: 'prefer_not_to_say',
      bio: '',
      website: '',
      social_media: {},
      preferences: {
        email_notifications: true,
        sms_alerts: false
      },
      notifications: {}
    }
  });

  const [formData, setFormData] = useState({});

  const cancelOrder = async (order) => {
    setCancellingId(order.id);
    const result = await cancelOrderRequest(order.id)
    setCancellingId(null);
    setConfirmingCancelId(null);
    if (result.success) showCustomToast('Pedido cancelado correctamente');
  };

  const confirmDelivery = async (order) => {
    if (!window.confirm('¿Confirmas que recibiste todos los productos de este pedido?')) return;
    setConfirmingDeliveryId(order.id);
    const result = await confirmOrderDelivery(order.id);
    setConfirmingDeliveryId(null);
    if (result.success) {
      showCustomToast(result.payout?.released
        ? 'Entrega confirmada y pagos liberados'
        : 'Entrega confirmada; liberación pendiente');
    } else {
      toast.error(result.error || 'No se pudo confirmar la entrega');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/perfil');
      return;
    }
    loadProfile();
    loadOrders();
  }, [authLoading, isAuthenticated, user?.id, router, loadOrders]);

  useEffect(() => {
    if (role !== 'cliente' || !user?.id) return;
    let active = true;
    fetch('/api/seller-applications', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => { if (active) setSellerApplication(result.application || null); })
      .catch(() => {});
    return () => { active = false; };
  }, [role, user?.id]);

  useEffect(() => {
    const requestedTab = searchParams?.get('tab');
    if (!requestedTab) return;

    if (requestedTab === 'orders' || requestedTab === 'historial' || requestedTab === 'pedidos') {
      setActiveTab('orders');
    } else if (['profile', 'wishlist', 'addresses', 'payments'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  async function loadProfile() {
    setLoading(true);
    try {
      const result = await profileService.getProfile(user.id);
      if (result.success) {
        setProfile(result.profile);
        setFormData(result.profile);
      } else {
        toast.error(result.error || 'Error al cargar perfil');
      }
    } catch (error) {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };

  const handleToggleChange = (field) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        preferences: {
          ...prev.details.preferences,
          [field]: !prev.details.preferences?.[field]
        }
      }
    }));
    showCustomToast('Preferencias actualizadas');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
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
    try {
      const result = await profileService.uploadAvatar(user.id, file);
      if (result.success) {
        setProfile(prev => ({ ...prev, avatar_url: result.avatar_url }));
        setFormData(prev => ({ ...prev, avatar_url: result.avatar_url }));
        await updateAuthProfile({ avatar_url: result.avatar_url });
        showCustomToast('Avatar actualizado correctamente');
      } else {
        toast.error(result.error || 'Error al subir avatar');
      }
    } catch (error) {
      toast.error('Error al subir avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const profileResult = await profileService.updateProfile(user.id, {
        name: formData.name,
        avatar_url: formData.avatar_url
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      const detailsResult = await profileService.updateProfileDetails(user.id, {
        phone: formData.details.phone,
        address: formData.details.address,
        city: formData.details.city,
        state: formData.details.state,
        postal_code: formData.details.postal_code,
        country: formData.details.country || 'México',
        reference: formData.details.reference,
        neighborhood: formData.details.neighborhood,
        birth_date: formData.details.birth_date,
        gender: formData.details.gender,
        bio: formData.details.bio,
        website: formData.details.website,
        preferences: formData.details.preferences || {}
      });

      if (!detailsResult.success) {
        throw new Error(detailsResult.error);
      }

      await updateAuthProfile({ name: formData.name });

      setProfile(formData);
      setIsEditing(false);
      showCustomToast('¡Información actualizada correctamente!');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(orderSearchTerm.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || getOrderStatus(order) === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-32 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Menú y Perfil */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-xs mx-auto">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100 text-slate-700 font-bold">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors border-2 border-white cursor-pointer shadow-sm"
                title="Cambiar foto"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {formData.name || 'Usuario'}
            </h2>
            <div className="mt-2 inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
              {role === 'vendedor' ? 'Vendedor' : role === 'admin' ? 'Administrador' : 'Cliente'}
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'profile', label: 'Información del Perfil', icon: User },
              { id: 'orders', label: 'Historial de Pedidos', icon: ShoppingBag },
              { id: 'wishlist', label: 'Lista de Deseos', icon: Heart },
              { id: 'addresses', label: 'Direcciones Guardadas', icon: MapPin },
              { id: 'payments', label: 'Métodos de Pago', icon: CreditCard }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} /> 
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => logout && logout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> 
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Contenido */}
        <div className="lg:col-span-9 space-y-6">
          {role === 'cliente' && sellerApplication?.status === 'pending' && (
            <div className="block bg-[#162536] text-white rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-amber-300 font-bold">Solicitud en revisión</p><h2 className="mt-1 text-xl font-bold">Solicitud enviada</h2><p className="mt-1 text-sm text-slate-300">Te avisaremos por correo cuando el administrador revise tus datos.</p></div><span className="bg-emerald-400 text-[#162536] px-4 py-2 rounded-xl text-sm font-bold">Enviada</span></div>
            </div>
          )}
          {role === 'cliente' && (!sellerApplication || sellerApplication.status === 'rejected') && (
            <Link href={sellerApplication?.status === 'pending' ? '/perfil' : '/convertirse-vendedor'} className="block bg-[#162536] text-white rounded-2xl p-6 hover:bg-slate-800 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-amber-300 font-bold">Nueva oportunidad</p><h2 className="mt-1 text-xl font-bold">Conviértete en vendedor</h2><p className="mt-1 text-sm text-slate-300">Conoce los beneficios y envía tu solicitud de validación.</p></div><span className="bg-[#FFB872] text-[#162536] px-4 py-2 rounded-xl text-sm font-bold">Comenzar</span></div>
            </Link>
          )}
          
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Información Personal */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Información Personal
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-100 px-3.5 py-2 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" /> 
                      <span>Editar</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      disabled={!isEditing}
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all ${
                        isEditing 
                          ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' 
                          : 'bg-slate-50/50 border-slate-200 text-slate-700 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Número de Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      disabled={!isEditing}
                      placeholder="+52 (55) 0000-0000"
                      value={formData.details?.phone || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all ${
                        isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Dirección de Envío
                    </label>
                    <input
                      type="text"
                      name="address"
                      disabled={!isEditing}
                      placeholder="Calle, número..."
                      value={formData.details?.address || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all ${
                        isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Colonia / Barrio
                    </label>
                    <input
                      type="text"
                      name="neighborhood"
                      disabled={!isEditing}
                      placeholder="Colonia..."
                      value={formData.details?.neighborhood || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all ${
                        isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        name="city"
                        disabled={!isEditing}
                        value={formData.details?.city || ''}
                        onChange={handleDetailsChange}
                        className={`w-full px-3 py-3 border rounded-xl text-sm transition-all ${
                          isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado</label>
                      <input
                        type="text"
                        name="state"
                        disabled={!isEditing}
                        value={formData.details?.state || ''}
                        onChange={handleDetailsChange}
                        className={`w-full px-3 py-3 border rounded-xl text-sm transition-all ${
                          isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">C.P.</label>
                      <input
                        type="text"
                        name="postal_code"
                        disabled={!isEditing}
                        placeholder="CP"
                        value={formData.details?.postal_code || ''}
                        onChange={handleDetailsChange}
                        className={`w-full px-3 py-3 border rounded-xl text-sm transition-all ${
                          isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Biografía</label>
                    <textarea
                      name="bio"
                      rows="3"
                      disabled={!isEditing}
                      placeholder="Cuéntanos un poco sobre ti..."
                      value={formData.details?.bio || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all resize-none ${
                        isEditing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {isEditing && (
                    <div className="pt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(profile);
                          setIsEditing(false);
                        }}
                        className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-2/3 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        {saving ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> 
                            <span>Guardar Cambios</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Preferencias */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 tracking-tight">
                    Preferencias
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notificaciones por Correo</p>
                        <p className="text-xs text-slate-500 mt-0.5">Promociones y actualizaciones</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('email_notifications')}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          formData.details?.preferences?.email_notifications ? 'bg-slate-900' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${
                          formData.details?.preferences?.email_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Alertas por SMS</p>
                        <p className="text-xs text-slate-500 mt-0.5">Actualizaciones de envío</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('sms_alerts')}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          formData.details?.preferences?.sms_alerts ? 'bg-slate-900' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${
                          formData.details?.preferences?.sms_alerts ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Historial de pedidos
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Consulta el estatus, los productos y el detalle de tus compras recientes.
                  </p>
                </div>
              </div>

              {/* Filtros y Buscador */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por número de orden..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'processing', label: 'En proceso' },
                     { id: 'shipped', label: 'Enviados' },
                     { id: 'delivered', label: 'Entregados' },
                     { id: 'cancelled', label: 'Cancelados' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderStatusFilter(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        orderStatusFilter === tab.id 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {ordersError && <Alert className="mb-6 rounded-2xl" variant="error">{ordersError}</Alert>}

              {ordersLoading && orders.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                      <div className="h-5 bg-slate-100 rounded w-1/4 mb-4"></div>
                      <div className="h-7 bg-slate-100 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">No se encontraron pedidos</h3>
                  <p className="text-sm text-slate-500 mb-6">Parece que no tienes compras que coincidan con este filtro o aún no has realizado ninguna.</p>
                  <Link 
                    href="/catalogo" 
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => {
                    const currentStatus = getOrderStatus(order);
                    const statusInfo = statusConfig[currentStatus] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    const deliveryItems = (order.order_items || []).filter(item => item.status !== 'cancelled');
                    const canConfirmDelivery = deliveryItems.length > 0 &&
                      deliveryItems.some(item => ['processing', 'shipped'].includes(item.status)) &&
                      deliveryItems.every(item => ['processing', 'shipped', 'delivered'].includes(item.status));
                    
                    const formattedDate = new Date(order.created_at).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div 
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                      >
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/40">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 flex-shrink-0">
                              <Package className="w-6 h-6 stroke-[1.8]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold text-slate-900">Orden #{order.order_number}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs text-slate-500 font-medium">{formattedDate}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'producto' : 'productos'}
                              </p>
                            </div>
                          </div>

                          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs uppercase tracking-wider ${statusInfo.bg}`}>
                            <StatusIcon className="w-4 h-4 stroke-[2]" />
                            <span>{labels[currentStatus] || currentStatus}</span>
                          </div>
                        </div>

                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
                            {order.order_items?.slice(0, 3).map((item, idx) => {
                              const img = item.product_image || item.image_url || item.image || item.product?.image_url || item.products?.images?.[0];
                              return (
                                <div key={idx} className="relative w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                  {img ? (
                                    <img src={img} alt={item.product_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                                  )}
                                </div>
                              );
                            })}
                            {order.order_items?.length > 3 && (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                +{order.order_items.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                            <div className="text-left sm:text-right">
                              <span className="text-xs text-slate-400 block">Total pagado</span>
                              <span className="text-sm font-bold text-slate-900">${order.total?.toFixed(2)}</span>
                            </div>

                            {['pending', 'processing'].includes(currentStatus) && confirmingCancelId !== order.id && (
                              <button type="button" onClick={() => setConfirmingCancelId(order.id)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all">
                                Cancelar pedido
                              </button>
                            )}
                            {canConfirmDelivery && (
                              <button
                                type="button"
                                disabled={confirmingDeliveryId === order.id}
                                onClick={() => confirmDelivery(order)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {confirmingDeliveryId === order.id ? 'Confirmando...' : 'Confirmar recepción'}
                              </button>
                            )}
                            <Link 
                              href={`/dashboard/cliente/pedidos/${order.id}`}
                              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                            >
                              <span>Ver detalle</span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                        {confirmingCancelId === order.id && (
                          <div className="px-6 pb-6">
                            <Alert variant="info">
                              <p className="font-bold">¿Confirmas la cancelación de este pedido?</p>
                              <p className="mt-1 text-xs font-normal">Esta acción enviará una notificación al vendedor.</p>
                              <div className="mt-3 flex gap-2">
                                <button type="button" onClick={() => setConfirmingCancelId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">No, regresar</button>
                                <button type="button" disabled={cancellingId === order.id} onClick={() => cancelOrder(order)} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{cancellingId === order.id ? 'Cancelando...' : 'Sí, cancelar pedido'}</button>
                              </div>
                            </Alert>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Heart className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Tu lista de deseos está vacía</h3>
              <p className="text-sm text-slate-500 mb-6">Guarda tus productos favoritos para comprarlos más tarde.</p>
              <Link 
                href="/catalogo" 
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-xs"
              >
                <span>Explorar catálogo</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MapPin className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No tienes direcciones guardadas</h3>
              <p className="text-sm text-slate-500 mb-6">Agrega una dirección para agilizar tus próximas compras.</p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <CreditCard className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No tienes métodos de pago guardados</h3>
              <p className="text-sm text-slate-500 mb-6">Tus métodos de pago aparecerán aquí cuando realices una compra segura.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingSpinner size="lg" /></div>}>
      <PerfilPageContent />
    </Suspense>
  );
}
