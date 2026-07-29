'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { 
  User, ShoppingBag, Heart, MapPin, CreditCard, LogOut, 
  Camera, Edit3, Save 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// 🍞 Función auxiliar para replicar el estilo exacto de alerta tipo carrito
const showCustomToast = (message) => {
  toast.success(message, {
    style: {
      background: '#010f20',
      color: '#ffffff',
      borderRadius: '9999px',
      padding: '12px 20px',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '13px',
      fontWeight: '700',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  });
};

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile: updateAuthProfile, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/perfil');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-32 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-900">

      {/* Grid Principal de la Interfaz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Menú de Navegación y Perfil resumido */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-md mx-auto">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl bg-slate-200 text-slate-700 font-bold">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-[#010f20] text-white rounded-full hover:bg-slate-800 transition-colors border-2 border-white cursor-pointer shadow-md"
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

            <h2 className="text-lg font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {formData.name || 'Usuario'}
            </h2>
            <div className="mt-2 inline-block bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200/50">
              Miembro desde 2024
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-[#010f20] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-5 h-5" /> Información del Perfil
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'orders' ? 'bg-[#010f20] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5" /> Historial de Pedidos
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'wishlist' ? 'bg-[#010f20] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className="w-5 h-5" /> Lista de Deseos
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'addresses' ? 'bg-[#010f20] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-5 h-5" /> Direcciones Guardadas
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'payments' ? 'bg-[#010f20] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-5 h-5" /> Métodos de Pago
            </button>
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => logout && logout()}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" /> Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Columna Derecha: Contenido según la Pestaña Activa */}
        <div className="lg:col-span-9 space-y-6">
          
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Tarjeta Principal: Información Personal */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#010f20]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Información Personal
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-4 h-4" /> Editar Detalles
                    </button>
                  )}
                </div>

                <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      disabled={!isEditing}
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                        isEditing 
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20] focus:outline-none' 
                          : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Número de Teléfono
                    </label>
                    <input
                      type="text"
                      name="phone"
                      disabled={!isEditing}
                      placeholder="+52 (55) 0000-0000"
                      value={formData.details?.phone || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                        isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Dirección de Envío
                    </label>
                    <input
                      type="text"
                      name="address"
                      disabled={!isEditing}
                      placeholder="Calle, número..."
                      value={formData.details?.address || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                        isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Colonia / Barrio
                    </label>
                    <input
                      type="text"
                      name="neighborhood"
                      disabled={!isEditing}
                      placeholder="Colonia..."
                      value={formData.details?.neighborhood || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                        isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ciudad</label>
                      <input
                        type="text"
                        name="city"
                        disabled={!isEditing}
                        value={formData.details?.city || ''}
                        onChange={handleDetailsChange}
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                          isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado</label>
                      <input
                        type="text"
                        name="state"
                        disabled={!isEditing}
                        value={formData.details?.state || ''}
                        onChange={handleDetailsChange}
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                          isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Biografía</label>
                    <textarea
                      name="bio"
                      rows="3"
                      disabled={!isEditing}
                      placeholder="Cuéntanos un poco sobre ti..."
                      value={formData.details?.bio || ''}
                      onChange={handleDetailsChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm font-medium transition-all resize-none ${
                        isEditing ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#010f20]' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Botones de Guardar y Cancelar que solo aparecen cuando isEditing es true */}
                  {isEditing && (
                    <div className="pt-3 flex gap-3 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(profile);
                          setIsEditing(false);
                        }}
                        className="w-1/3 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-2/3 py-3.5 bg-[#010f20] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        {saving ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Guardar Cambios
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Tarjeta Derecha: Preferencias y Seguridad */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
                  <h3 className="text-base font-bold text-[#010f20] mb-6 pb-4 border-b border-slate-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Preferencias y Seguridad
                  </h3>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Notificaciones por Correo</p>
                        <p className="text-xs text-slate-500 mt-0.5">Promociones y actualizaciones</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('email_notifications')}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          formData.details?.preferences?.email_notifications ? 'bg-[#010f20]' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          formData.details?.preferences?.email_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Alertas por SMS</p>
                        <p className="text-xs text-slate-500 mt-0.5">Actualizaciones de envío</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('sms_alerts')}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          formData.details?.preferences?.sms_alerts ? 'bg-[#010f20]' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
              <h3 className="text-base font-bold text-[#010f20] mb-4">Historial de Pedidos</h3>
              <p className="text-sm text-slate-500">Aquí puedes ver tus compras recientes.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
