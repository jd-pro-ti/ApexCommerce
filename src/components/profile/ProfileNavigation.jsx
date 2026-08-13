'use client'

import { Heart, Receipt, ShoppingBag, User } from 'lucide-react'

const items = [
  { id: 'profile', label: 'Información del Perfil', icon: User },
  { id: 'orders', label: 'Historial de Pedidos', icon: ShoppingBag },
  { id: 'payments-history', label: 'Historial de Pagos', icon: Receipt },
  { id: 'wishlist', label: 'Lista de Deseos', icon: Heart }
]

export default function ProfileNavigation({ activeTab, onChange }) {
  return <nav className="space-y-1.5">{items.map(({ id, label, icon: Icon }) => { const active = activeTab === id; return <button key={id} onClick={() => onChange(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${active ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}`}><Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} /><span>{label}</span></button> })}</nav>
}
