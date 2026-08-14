'use client';

import { CircleAlert, MapPin, Phone, Wallet, X } from 'lucide-react';

const requirementInfo = {
  paypal: {
    label: 'Conectar tu cuenta de PayPal',
    description: 'Conecta PayPal para recibir los pagos de tus ventas.',
    icon: Wallet,
  },
  phone: {
    label: 'Agregar tu número de teléfono',
    description: 'Registra un número de contacto en tu información personal.',
    icon: Phone,
  },
  location: {
    label: 'Agregar tu ubicación',
    description: 'Completa tu dirección en la sección de ubicación.',
    icon: MapPin,
  },
};

export default function SellerProfileAlert({ missing = [], onClose }) {
  const requirements = missing.map((item) => requirementInfo[item]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="seller-profile-alert-title">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <CircleAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Perfil incompleto</p>
              <h2 id="seller-profile-alert-title" className="mt-1 text-xl font-extrabold text-slate-950">No puedes publicar todavía</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar alerta">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <p className="text-sm leading-6 text-slate-600">Para empezar a publicar productos necesitas completar minimo los siguientes requisitos:</p>
          <div className="mt-5 space-y-3">
            {requirements.map(({ label, description, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-amber-600">
            Completar mi perfil
          </button>
        </div>
      </div>
    </div>
  );
}
