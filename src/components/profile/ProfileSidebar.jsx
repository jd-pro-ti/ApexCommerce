'use client';

import { Camera, LogOut, Trash2 } from 'lucide-react';
import ProfileNavigation from './ProfileNavigation';

export default function ProfileSidebar({
  formData,
  role,
  activeTab,
  onTabChange,
  fileInputRef,
  uploadingAvatar,
  onAvatarUpload,
  onDeleteAccount,
  onLogout
}) {
  const roleLabel = role === 'vendedor' ? 'Vendedor' : role === 'admin' ? 'Administrador' : 'Cliente';

  return (
    <aside className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="text-center pb-6 border-b border-slate-100">
        <div className="relative inline-block mx-auto mb-4">
          <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-xs mx-auto">
            {formData.avatar_url ? <img src={formData.avatar_url} alt={formData.name || 'Usuario'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100 text-slate-700 font-bold">{formData.name?.charAt(0) || 'U'}</div>}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors border-2 border-white cursor-pointer shadow-sm" title="Cambiar foto">
            {uploadingAvatar ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{formData.name || 'Usuario'}</h2>
        <div className="mt-2 inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">{roleLabel}</div>
      </div>

      <ProfileNavigation activeTab={activeTab} onChange={onTabChange} />

      <div className="pt-4 border-t border-slate-100">
        <button type="button" onClick={onDeleteAccount} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" /><span>Eliminar cuenta</span>
        </button>
        <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
          <LogOut className="w-4 h-4 text-rose-500" /><span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
