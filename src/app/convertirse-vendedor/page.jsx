'use client'

import Link from 'next/link'
import { ShieldCheck, Store, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function BecomeSellerPage() {
  const { role } = useAuth()
  return <main className="min-h-screen bg-gradient-to-br from-[#fffaf5] via-white to-[#f1f5f9] px-5 py-28">
    <div className="max-w-5xl mx-auto">
      <div className="max-w-2xl mb-12"><span className="text-xs font-bold tracking-[.2em] uppercase text-amber-600">Apex Commerce</span><h1 className="mt-4 text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">Convierte tu pasión en un negocio.</h1><p className="mt-5 text-lg text-slate-600 leading-relaxed">Únete como vendedor, muestra tus productos a nuestra comunidad y administra tus ventas desde un solo lugar.</p></div>
      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {[['Vende a más personas', 'Llega a clientes que ya están buscando productos como los tuyos.', Store], ['Crece con herramientas', 'Gestiona catálogo, inventario, pedidos y ganancias desde tu panel.', TrendingUp], ['Comunidad segura', 'Validamos la identidad de cada vendedor para proteger las compras.', ShieldCheck]].map(([title, text, Icon]) => <div key={title} className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center"><Icon /></div><h2 className="mt-5 font-bold text-slate-900 text-lg">{title}</h2><p className="mt-2 text-sm text-slate-500 leading-relaxed">{text}</p></div>)}
      </div>
      <div className="bg-[#162536] rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"><div><h2 className="text-2xl font-bold">¿Listo para comenzar?</h2><div className="mt-4 space-y-2 text-sm text-slate-300"><p><CheckCircle2 className="inline w-4 h-4 mr-2 text-amber-400" />Completa tus datos de identificación.</p><p><CheckCircle2 className="inline w-4 h-4 mr-2 text-amber-400" />Nuestro equipo revisará tu solicitud.</p><p><CheckCircle2 className="inline w-4 h-4 mr-2 text-amber-400" />Recibirás la resolución por correo.</p></div></div>{role === 'cliente' ? <Link href="/convertirse-vendedor/solicitud" className="inline-flex items-center gap-2 bg-[#FFB872] text-[#162536] px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-300">Iniciar solicitud <ArrowRight className="w-4 h-4" /></Link> : <span className="text-sm text-slate-300">Esta opción está disponible para cuentas de cliente.</span>}</div>
    </div>
  </main>
}
