'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/context/OrderContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Save,
  Camera,
  X,
  Edit3,
  Heart,
  ShoppingBag,
  Package,
  Settings
} from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile: updateAuthProfile } = useAuth();
  const { wishlist } = useWishlist();
  const { orders } = useOrders();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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
      preferences: {},
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
    setError('');
    try {
      const result = await profileService.getProfile(user.id);
      if (result.success) {
        setProfile(result.profile);
        setFormData(result.profile);
      } else {
        setError(result.error || 'Error al cargar perfil');
      }
    } catch (error) {
      setError('Error al cargar perfil');
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const result = await profileService.uploadAvatar(user.id, file);
      if (result.success) {
        setProfile(prev => ({ ...prev, avatar_url: result.avatar_url }));
        setFormData(prev => ({ ...prev, avatar_url: result.avatar_url }));
        await updateAuthProfile({ avatar_url: result.avatar_url });
        setSuccess('Avatar actualizado correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al subir avatar');
      }
    } catch (error) {
      setError('Error al subir avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Actualizar perfil básico
      const profileResult = await profileService.updateProfile(user.id, {
        name: formData.name,
        avatar_url: formData.avatar_url
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      // Actualizar detalles
      const detailsResult = await profileService.updateProfileDetails(user.id, {
        phone: formData.details.phone,
        address: formData.details.address,
        address_line2: formData.details.address_line2,
        city: formData.details.city,
        state: formData.details.state,
        postal_code: formData.details.postal_code,
        country: formData.details.country || 'México',
        reference: formData.details.reference,
        neighborhood: formData.details.neighborhood,
        house_number: formData.details.house_number,
        birth_date: formData.details.birth_date,
        gender: formData.details.gender,
        bio: formData.details.bio,
        website: formData.details.website,
        social_media: formData.details.social_media || {},
        preferences: formData.details.preferences || {},
        notifications: formData.details.notifications || {}
      });

      if (!detailsResult.success) {
        throw new Error(detailsResult.error);
      }

      // Actualizar perfil en contexto
      await updateAuthProfile({ name: formData.name });

      setProfile(formData);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto text-slate-900">
      
      {/* Cabecera */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl">
            <User className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 
              className="text-3xl sm:text-4xl font-bold text-[#010f20] tracking-tight"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Mi Perfil
            </h1>
            <p 
              className="text-sm text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Gestiona tu información personal y preferencias
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <Alert className="mb-6" variant="error" onClose={() => setError('')}>{error}</Alert>
      )}

      {success && (
        <Alert className="mb-6" variant="success" onClose={() => setSuccess('')} autoHide={5000}>{success}</Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Columna Izquierda - Avatar e info rápida */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-gray-100 mx-auto">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt={formData.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-[#010f20] text-white rounded-full shadow-lg hover:bg-slate-800 transition-all border-2 border-white"
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

            <h2 className="text-xl font-bold text-[#010f20] mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {formData.name || 'Sin nombre'}
            </h2>
            <p className="text-sm text-slate-500">{formData.email}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.role === 'admin' ? 'bg-red-100 text-red-700' :
                  formData.role === 'vendedor' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {formData.role === 'admin' ? '👑 Admin' :
                   formData.role === 'vendedor' ? '🏪 Vendedor' :
                   '🛒 Cliente'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {formData.status === 'active' ? 'Activo' : 'Suspendido'}
                </span>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Editar Perfil
              </button>
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => router.push('/favorito')} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-rose-300 transition-colors">
              <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-900">{wishlist.length}</p>
              <p className="text-[10px] text-slate-500">Favoritos</p>
            </button>
            <button onClick={() => router.push(formData.role === 'vendedor' ? '/dashboard/vendedor/pedidos' : '/dashboard/cliente/pedidos')} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-slate-500 transition-colors">
              <ShoppingBag className="w-5 h-5 text-slate-700 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-900">{orders.length}</p>
              <p className="text-[10px] text-slate-500">Pedidos</p>
            </button>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#010f20] mb-6 pb-4 border-b border-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Información Personal
              </h3>

              <div className="space-y-6">
                {/* Nombre y Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Nombre completo"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                  <Input
                    label="Correo electrónico"
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    disabled
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                {/* Teléfono y Fecha de nacimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Teléfono"
                    name="phone"
                    placeholder="+52 55 1234 5678"
                    value={formData.details?.phone || ''}
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                  <div>
                    <label className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.details?.birth_date || ''}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 disabled:bg-gray-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Género y País */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2">
                      Género
                    </label>
                    <select
                      name="gender"
                      value={formData.details?.gender || 'prefer_not_to_say'}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 disabled:bg-gray-50 disabled:text-slate-500"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                      <option value="prefer_not_to_say">Prefiero no decir</option>
                    </select>
                  </div>
                  <Input
                    label="País"
                    name="country"
                    value={formData.details?.country || 'México'}
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                {/* Biografía */}
                <div>
                  <label className="block text-xs font-bold text-[#010f20] uppercase tracking-wider mb-2">
                    Biografía
                  </label>
                  <textarea
                    name="bio"
                    rows="3"
                    placeholder="Cuéntanos sobre ti..."
                    value={formData.details?.bio || ''}
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-white text-sm text-slate-800 disabled:bg-gray-50 disabled:text-slate-500"
                  />
                </div>

                {/* Sitio web */}
                <Input
                  label="Sitio web"
                  name="website"
                  placeholder="https://tusitio.com"
                  value={formData.details?.website || ''}
                  onChange={handleDetailsChange}
                  disabled={!isEditing}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              {/* Dirección */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="text-md font-bold text-[#010f20] mb-4 flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <MapPin className="w-5 h-5" /> Dirección
                </h4>

                <div className="space-y-6">
                  <Input
                    label="Calle y número"
                    name="address"
                    placeholder="Calle Principal 123"
                    value={formData.details?.address || ''}
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />

                  <Input
                    label="Colonia"
                    name="neighborhood"
                    placeholder="Centro"
                    value={formData.details?.neighborhood || ''}
                    onChange={handleDetailsChange}
                    disabled={!isEditing}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Ciudad"
                      name="city"
                      placeholder="Ciudad de México"
                      value={formData.details?.city || ''}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <Input
                      label="Estado"
                      name="state"
                      placeholder="CDMX"
                      value={formData.details?.state || ''}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Código postal"
                      name="postal_code"
                      placeholder="12345"
                      value={formData.details?.postal_code || ''}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <Input
                      label="Referencia"
                      name="reference"
                      placeholder="Frente al parque"
                      value={formData.details?.reference || ''}
                      onChange={handleDetailsChange}
                      disabled={!isEditing}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="flex-1 !bg-[#0b1523] hover:!bg-slate-800 !text-white text-sm font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    loading={saving}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 border border-gray-200 hover:border-slate-800 text-slate-700 text-sm font-semibold py-3 rounded-xl transition-all"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
