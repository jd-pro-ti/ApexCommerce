'use client';

import { Edit3, Save } from 'lucide-react';

const inputClass = (editing, compact = false) => `${compact ? 'px-3' : 'px-4'} py-3 border rounded-xl text-sm transition-all ${editing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'}`;

function Field({ label, name, value, onChange, editing, type = 'text', placeholder, compact = false }) {
  return <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label><input type={type} name={name} disabled={!editing} placeholder={placeholder} value={value || ''} onChange={onChange} className={`w-full ${inputClass(editing, compact)}`} /></div>;
}

export default function ProfileForm({ formData, profile, isEditing, saving, onEdit, onCancel, onSubmit, onChange, onDetailsChange, onTogglePreference }) {
  return <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
    <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100"><h3 className="text-base font-bold text-slate-900 tracking-tight">Información Personal</h3>{!isEditing && <button type="button" onClick={onEdit} className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-100 px-3.5 py-2 rounded-lg"><Edit3 className="w-4 h-4" />Editar</button>}</div>
      <form onSubmit={onSubmit} className="space-y-4.5">
        <Field label="Nombre Completo" name="name" value={formData.name} onChange={onChange} editing={isEditing} />
        <Field label="Correo Electrónico" value={formData.email} editing={false} type="email" />
        <Field label="Número de Teléfono" name="phone" value={formData.details?.phone} onChange={onDetailsChange} editing={isEditing} placeholder="+52 (55) 0000-0000" />
        <Field label="Dirección de Envío" name="address" value={formData.details?.address} onChange={onDetailsChange} editing={isEditing} placeholder="Calle, número..." />
        <Field label="Colonia / Barrio" name="neighborhood" value={formData.details?.neighborhood} onChange={onDetailsChange} editing={isEditing} placeholder="Colonia..." />
        <div className="grid grid-cols-3 gap-3"><Field label="Ciudad" name="city" value={formData.details?.city} onChange={onDetailsChange} editing={isEditing} compact /><Field label="Estado" name="state" value={formData.details?.state} onChange={onDetailsChange} editing={isEditing} compact /><Field label="C.P." name="postal_code" value={formData.details?.postal_code} onChange={onDetailsChange} editing={isEditing} placeholder="CP" compact /></div>
        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Biografía</label><textarea name="bio" rows="3" disabled={!isEditing} placeholder="Cuéntanos un poco sobre ti..." value={formData.details?.bio || ''} onChange={onDetailsChange} className={`w-full ${inputClass(isEditing)} resize-none`} /></div>
        {isEditing && <div className="pt-3 flex gap-3"><button type="button" onClick={onCancel} className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer">Cancelar</button><button type="submit" disabled={saving} className="w-2/3 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer">{saving ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Save className="w-4 h-4" />Guardar Cambios</>}</button></div>}
      </form>
    </div>
    <PreferencesPanel formData={formData} onToggle={onTogglePreference} />
  </div>;
}

function PreferencesPanel({ formData, onToggle }) {
  const toggle = (field) => onToggle({ target: { name: `preferences.${field}`, value: !formData.details?.preferences?.[field] } }, field);
  return <div className="md:col-span-5 space-y-6"><div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs"><h3 className="text-base font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 tracking-tight">Preferencias</h3><div className="space-y-4">{[['email_notifications', 'Notificaciones por Correo', 'Promociones y actualizaciones'], ['sms_alerts', 'Alertas por SMS', 'Actualizaciones de envío']].map(([field, title, text]) => <div key={field} className="flex items-center justify-between p-4 bg-slate-50/60 rounded-xl border border-slate-100"><div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="text-xs text-slate-500 mt-0.5">{text}</p></div><button type="button" onClick={() => toggle(field)} className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${formData.details?.preferences?.[field] ? 'bg-slate-900' : 'bg-slate-300'}`}><div className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${formData.details?.preferences?.[field] ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>)}</div></div></div>;
}
