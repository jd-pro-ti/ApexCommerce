'use client';

import { Edit3, Save } from 'lucide-react';
import Alert from '@/components/ui/Alert';

const inputClass = (editing, compact = false) => `${compact ? 'px-3' : 'px-4'} py-3 border rounded-xl text-sm transition-all ${editing ? 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500' : 'bg-slate-50/50 border-slate-200 text-slate-500 cursor-not-allowed'}`;

function Field({ label, name, value, onChange, editing, type = 'text', placeholder, compact = false }) {
  return <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label><input type={type} name={name} disabled={!editing} placeholder={placeholder} value={value || ''} onChange={onChange} className={`w-full ${inputClass(editing, compact)}`} /></div>;
}

export default function ProfileForm({ formData, isEditing, saving, onEdit, onCancel, onSubmit, onChange, onDetailsChange }) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 md:col-span-12">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4"><h3 className="text-base font-bold tracking-tight text-slate-900">Información Personal</h3>{!isEditing && <button type="button" onClick={onEdit} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:text-slate-900"><Edit3 className="h-4 w-4" />Editar</button>}</div>
      <form onSubmit={onSubmit} className="space-y-4.5">
        <Field label="Nombre Completo" name="name" value={formData.name} onChange={onChange} editing={isEditing} />
        <Field label="Correo Electrónico" value={formData.email} editing={false} type="email" />
        <Field label="Número de Teléfono" name="phone" value={formData.details?.phone} onChange={onDetailsChange} editing={isEditing} placeholder="+52 (55) 0000-0000" />
        <Field label="Dirección de Envío" name="address" value={formData.details?.address} onChange={onDetailsChange} editing={isEditing} placeholder="Calle, número..." />
        <Field label="Colonia / Barrio" name="neighborhood" value={formData.details?.neighborhood} onChange={onDetailsChange} editing={isEditing} placeholder="Colonia..." />
        <div className="grid grid-cols-3 gap-3"><Field label="Ciudad" name="city" value={formData.details?.city} onChange={onDetailsChange} editing={isEditing} compact /><Field label="Estado" name="state" value={formData.details?.state} onChange={onDetailsChange} editing={isEditing} compact /><Field label="C.P." name="postal_code" value={formData.details?.postal_code} onChange={onDetailsChange} editing={isEditing} placeholder="CP" compact /></div>
        <Alert variant="info">Es necesario completar correctamente toda tu ubicación. Si está incompleta, tu paquete podría no llegar correctamente.</Alert>
        <Field label="Fecha de nacimiento" name="birth_date" value={formData.details?.birth_date} onChange={onDetailsChange} editing={isEditing} type="date" />
        <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Biografía</label><textarea name="bio" rows="3" disabled={!isEditing} placeholder="Cuéntanos un poco sobre ti..." value={formData.details?.bio || ''} onChange={onDetailsChange} className={`w-full ${inputClass(isEditing)} resize-none`} /></div>
        {isEditing && <div className="flex gap-3 pt-3"><button type="button" onClick={onCancel} className="w-1/3 cursor-pointer rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200">Cancelar</button><button type="submit" disabled={saving} className="flex w-2/3 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-slate-800">{saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4" />Guardar Cambios</>}</button></div>}
      </form>
    </div>
  </div>;
}
