'use client'

import { useMemo, useState } from 'react'
import { CreditCard, Eye, RefreshCcw, Search } from 'lucide-react'
import Link from 'next/link'

const paymentFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'paid', label: 'Pagados' },
  { id: 'refunded', label: 'Reembolsados' },
  { id: 'failed', label: 'Fallidos' }
]

function paymentStatus(order) {
  if (order.payment_status === 'refunded') return { id: 'refunded', label: 'Reembolsado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (order.payment_status === 'paid') return { id: 'paid', label: 'Pagado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return { id: 'failed', label: order.payment_status === 'pending' ? 'Pendiente' : 'Fallido', className: 'bg-rose-50 text-rose-700 border-rose-200' }
}

export default function PaymentHistoryPanel({ orders = [] }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const payments = useMemo(() => orders.filter((order) => order.payment_status || order.paypal_order_id), [orders])
  const filtered = useMemo(() => payments.filter((order) => {
    const status = paymentStatus(order)
    const matchesFilter = filter === 'all' || status.id === filter
    const term = search.trim().toLowerCase()
    return matchesFilter && (!term || String(order.order_number || '').toLowerCase().includes(term))
  }), [payments, filter, search])

  return <div className="space-y-6">
    <div><h1 className="text-xl font-bold text-slate-900">Historial de pagos</h1><p className="mt-1 text-sm text-slate-500">Consulta todos los pagos realizados en Apex Commerce.</p></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número de orden..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-500" /></div>
      <div className="flex gap-2 overflow-x-auto">{paymentFilters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold ${filter === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}</div>
    </div>
    {filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No hay pagos que coincidan con el filtro.</div> : <div className="space-y-3">{filtered.map((order) => { const status = paymentStatus(order); const firstImage = order.order_items?.[0]?.products?.images?.[0]; return <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">{firstImage ? <img src={firstImage} alt="Producto del pedido" className="h-full w-full object-cover" /> : <CreditCard className="h-5 w-5 text-slate-400" />}</div><div><p className="text-sm font-bold text-slate-900">Orden #{order.order_number}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.created_at).toLocaleString('es-MX')}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-right"><p className="text-xs text-slate-400">Importe</p><p className="font-bold text-slate-900">${Number(order.total || 0).toFixed(2)} MXN</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span><Link href={`/dashboard/cliente/pedidos/${order.id}`} className="rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-900 hover:text-white" title="Ver detalle"><Eye className="h-4 w-4" /></Link></div></div>{status.id === 'refunded' && <p className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-emerald-700"><RefreshCcw className="h-4 w-4" /> Reembolso procesado por PayPal.</p>}</article> })}</div>}
  </div>
}
