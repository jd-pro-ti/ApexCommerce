'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowDownToLine, Banknote, CircleDollarSign, Clock3, WalletCards } from 'lucide-react'

function money(value) {
  return `$${Number(value || 0).toFixed(2)} MXN`
}

export default function EarningsPanel({ userId, role }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!userId) return
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const query = role === 'vendedor' ? `?sellerId=${encodeURIComponent(userId)}` : ''
        const response = await fetch(`/api/admin/earnings${query}`, {
          headers: { Authorization: `Bearer ${session?.access_token || ''}` },
          cache: 'no-store'
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el resumen financiero')
        if (active) setReport(data)
      } catch (loadError) {
        if (active) setError(loadError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [userId, role])

  const downloadCsv = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const query = role === 'vendedor' ? `&sellerId=${encodeURIComponent(userId)}` : ''
    const response = await fetch(`/api/admin/earnings?format=csv${query}`, {
      headers: { Authorization: `Bearer ${session?.access_token || ''}` }
    })
    if (!response.ok) return
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = role === 'admin' ? 'ganancias-apex-commerce.csv' : 'mis-ganancias.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="bg-white/80 rounded-3xl p-7 border border-white/60 shadow-xl text-sm text-slate-500">Cargando resumen financiero...</div>
  if (error) return <div className="bg-red-50 rounded-3xl p-7 border border-red-200 text-sm text-red-700">{error}</div>

  const totals = report?.totals || {}
  const isAdmin = role === 'admin'
  const cards = isAdmin
    ? [
        { label: 'Ventas brutas', value: money(totals.grossSales), icon: CircleDollarSign, color: 'text-blue-600 bg-blue-50' },
        { label: 'Comisión Apex 15%', value: money(totals.platformCommission), icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Pagos a vendedores', value: money(totals.sellerPayout), icon: WalletCards, color: 'text-violet-600 bg-violet-50' },
        { label: 'Pedidos cobrados', value: totals.orders || 0, icon: Clock3, color: 'text-amber-600 bg-amber-50' }
      ]
    : [
        { label: 'Ventas brutas', value: money(totals.grossSales), icon: CircleDollarSign, color: 'text-blue-600 bg-blue-50' },
        { label: 'Mi pago 85%', value: money(totals.sellerPayout), icon: WalletCards, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Retenido', value: money(report?.sellers?.[0]?.held), icon: Clock3, color: 'text-amber-600 bg-amber-50' },
        { label: 'Liberado', value: money(report?.sellers?.[0]?.paid), icon: Banknote, color: 'text-violet-600 bg-violet-50' }
      ]

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Resumen financiero</h2>
          <p className="text-xs text-slate-400 mt-1">{isAdmin ? 'Comisiones y pagos de toda la plataforma' : 'Tus ventas y pagos de PayPal'}</p>
        </div>
        <button onClick={downloadCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700">
          <ArrowDownToLine className="w-4 h-4" /> Descargar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/90 rounded-3xl p-5 border border-white/60 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
              <span className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/90 rounded-3xl p-6 border border-white/60 shadow-xl shadow-slate-200/40 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-4">{isAdmin ? 'Ganancias por vendedor' : 'Detalle de mis ganancias'}</h3>
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3">Vendedor</th><th className="pb-3">Pedidos</th><th className="pb-3">Ventas brutas</th><th className="pb-3">Comisión</th><th className="pb-3">Pago vendedor</th></tr></thead>
          <tbody>
            {(report?.sellers || []).map((seller) => (
              <tr key={seller.sellerId} className="border-b border-slate-50 text-slate-700"><td className="py-4 font-semibold">{isAdmin ? seller.sellerName : 'Mis ventas'}{isAdmin && <div className="font-normal text-slate-400">{seller.sellerEmail}</div>}</td><td className="py-4">{seller.orders}</td><td className="py-4">{money(seller.grossSales)}</td><td className="py-4 text-emerald-700">{money(seller.platformCommission)}</td><td className="py-4 font-semibold">{money(seller.sellerPayout)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
