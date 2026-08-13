import Link from 'next/link';

export default function ProfilePromotions({ role, sellerApplication }) {
  if (role !== 'cliente') return null;
  if (sellerApplication?.status === 'pending') {
    return <div className="block bg-[#162536] text-white rounded-2xl p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-amber-300 font-bold">Solicitud en revisión</p><h2 className="mt-1 text-xl font-bold">Solicitud enviada</h2><p className="mt-1 text-sm text-slate-300">Te avisaremos por correo cuando el administrador revise tus datos.</p></div><span className="bg-emerald-400 text-[#162536] px-4 py-2 rounded-xl text-sm font-bold">Enviada</span></div></div>;
  }
  return <Link href="/convertirse-vendedor" className="block bg-[#162536] text-white rounded-2xl p-6 hover:bg-slate-800 transition-colors"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-amber-300 font-bold">Nueva oportunidad</p><h2 className="mt-1 text-xl font-bold">Conviértete en vendedor</h2><p className="mt-1 text-sm text-slate-300">Conoce los beneficios y envía tu solicitud de validación.</p></div><span className="bg-[#FFB872] text-[#162536] px-4 py-2 rounded-xl text-sm font-bold">Comenzar</span></div></Link>;
}
