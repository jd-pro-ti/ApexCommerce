'use client';

import { CircleAlert, MapPin, Phone, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fieldInfo = {
  name: ['Tu nombre', 'Agrega tu nombre completo.', UserRound],
  email: ['Tu correo electrónico', 'Verifica el correo de tu cuenta.', UserRound],
  phone: ['Tu número de teléfono', 'Necesitamos un teléfono de contacto.', Phone],
  address: ['Tu dirección', 'Agrega la dirección de entrega.', MapPin],
  city: ['Tu ciudad', 'Indica la ciudad de entrega.', MapPin],
  state: ['Tu estado', 'Indica el estado de entrega.', MapPin],
  postal_code: ['Tu código postal', 'Agrega el código postal de entrega.', MapPin],
};

export default function CustomerProfileAlert({ missing = [], onClose }) {
  const router = useRouter();
  const requirements = missing.map((field) => fieldInfo[field]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="customer-profile-alert-title">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3"><div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><CircleAlert className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Perfil incompleto</p><h2 id="customer-profile-alert-title" className="mt-1 text-xl font-extrabold text-slate-950">Completa tu perfil para comprar</h2></div></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar alerta"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-6 sm:px-8"><p className="text-sm leading-6 text-slate-600">Para continuar con tu compra necesitamos completar estos datos de entrega y contacto:</p><div className="mt-5 space-y-3">{requirements.map(([label, description, Icon]) => <div key={label} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-sm font-bold text-slate-900">{label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{description}</p></div></div>)}</div><button type="button" onClick={() => router.push('/perfil?tab=profile')} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-amber-600">Completar mi perfil</button></div>
      </div>
    </div>
  );
}
