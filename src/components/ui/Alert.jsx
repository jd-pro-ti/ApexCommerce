'use client';

import { useEffect } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const variants = {
  success: { icon: CheckCircle2, styles: 'border-emerald-200 bg-emerald-50 text-emerald-800', iconStyles: 'text-emerald-600' },
  error: { icon: CircleAlert, styles: 'border-red-200 bg-red-50 text-red-800', iconStyles: 'text-red-600' },
  info: { icon: Info, styles: 'border-slate-200 bg-slate-50 text-slate-800', iconStyles: 'text-slate-700' },
};

export default function Alert({ children, variant = 'info', onClose, autoHide = 0, className = '' }) {
  const current = variants[variant] || variants.info;
  const Icon = current.icon;

  useEffect(() => {
    if (!autoHide || !onClose) return undefined;
    const timer = setTimeout(onClose, autoHide);
    return () => clearTimeout(timer);
  }, [autoHide, onClose]);

  return <div role="alert" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${current.styles} ${className}`}>
    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${current.iconStyles}`} />
    <div className="flex-1 leading-relaxed">{children}</div>
    {onClose && <button type="button" onClick={onClose} className="rounded-md p-0.5 opacity-70 transition hover:bg-black/5 hover:opacity-100" aria-label="Cerrar alerta"><X className="h-4 w-4" /></button>}
  </div>;
}
