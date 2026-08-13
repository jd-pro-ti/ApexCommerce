'use client'

import { useEffect, useState } from 'react'
import { Check, X, ArrowLeft, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function AdminRequestsPage() {
  const [sellerRequests, setSellerRequests] = useState([])
  const [deletionRequests, setDeletionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const response = await fetch('/api/admin/seller-applications', { cache: 'no-store' })
    const result = await response.json()
    setSellerRequests(result.applications || [])
    setDeletionRequests(result.deletionRequests || [])
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    fetch('/api/admin/seller-applications', { cache: 'no-store' }).then((response) => response.json()).then((result) => {
      if (!active) return
      setSellerRequests(result.applications || [])
      setDeletionRequests(result.deletionRequests || [])
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const review = async (id, status, type) => {
    const rejection_reason = status === 'rejected' ? window.prompt('Motivo del rechazo (opcional):') : ''
    if (rejection_reason === null) return
    const response = await fetch('/api/admin/seller-applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, type, rejection_reason }) })
    const result = await response.json()
    setMessage(response.ok ? 'Solicitud actualizada correctamente.' : result.error || 'No se pudo actualizar')
    if (response.ok) load()
  }

  const statusLabel = (status) => ({ pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[status] || status)
  const statusClass = (status) => status === 'pending' ? 'bg-amber-100 text-amber-700' : status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
  const Actions = ({ item, type }) => item.status === 'pending' && <div className="flex gap-2"><button onClick={() => review(item.id, 'approved', type)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold"><Check className="w-4 h-4" /> Aprobar</button><button onClick={() => review(item.id, 'rejected', type)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 text-rose-700 px-4 py-2 text-sm font-bold"><X className="w-4 h-4" /> Rechazar</button></div>

  return <main className="min-h-screen bg-slate-50 p-6 md:p-10"><div className="max-w-6xl mx-auto"><Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Dashboard</Link><div className="mt-6 flex items-center gap-3"><div className="p-3 bg-amber-100 text-amber-700 rounded-2xl"><ShieldCheck /></div><div><h1 className="text-3xl font-bold text-slate-900">Solicitudes</h1><p className="text-sm text-slate-500 mt-1">Revisa solicitudes para vender y para eliminar cuentas.</p></div></div>{message && <p className="mt-5 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm">{message}</p>}{loading ? <p className="mt-8 text-slate-500">Cargando solicitudes...</p> : <div className="mt-8 space-y-10"><section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900"><UserPlus className="h-5 w-5 text-amber-600" /> Solicitudes de vendedor</h2>{sellerRequests.length === 0 ? <Empty /> : <div className="space-y-5">{sellerRequests.map((app) => <article key={app.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col md:flex-row md:items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h3 className="font-bold text-lg text-slate-900">{app.full_name}</h3><span className={`text-xs px-2 py-1 rounded-full font-bold ${statusClass(app.status)}`}>{statusLabel(app.status)}</span></div><p className="text-sm text-slate-500 mt-1">{app.profiles?.email || 'Sin correo'} · {new Date(app.created_at).toLocaleDateString('es-MX')}</p></div><Actions item={app} type="seller" /></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-sm"><div><span className="text-slate-400 block">CURP</span><b>{app.curp}</b></div><div><span className="text-slate-400 block">RFC</span><b>{app.rfc || 'No proporcionado'}</b></div><div><span className="text-slate-400 block">Teléfono</span><b>{app.phone}</b></div><div><span className="text-slate-400 block">Identificación</span><b>{app.id_type} {app.id_number || ''}</b></div><div className="sm:col-span-2 lg:col-span-4"><span className="text-slate-400 block">Domicilio</span><b>{app.address}, {app.city}, {app.state}, CP {app.postal_code}</b></div></div></article>)}</div>}</section><section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900"><Trash2 className="h-5 w-5 text-rose-600" /> Solicitudes de eliminación de cuenta</h2>{deletionRequests.length === 0 ? <Empty /> : <div className="space-y-4">{deletionRequests.map((item) => <article key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div className="flex items-center gap-3"><h3 className="font-bold text-lg text-slate-900">{item.profiles?.name || 'Usuario'}</h3><span className={`text-xs px-2 py-1 rounded-full font-bold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></div><p className="text-sm text-slate-500 mt-1">{item.profiles?.email || 'Sin correo'} · Rol: {item.profiles?.role || 'usuario'} · {new Date(item.created_at).toLocaleDateString('es-MX')}</p></div><Actions item={item} type="deletion" /></div>{item.reason && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Motivo: {item.reason}</p>}</article>)}</div>}</section></div>}</div></main>
}

function Empty() { return <div className="bg-white rounded-2xl border p-8 text-center text-slate-500">No hay solicitudes todavía.</div> }
