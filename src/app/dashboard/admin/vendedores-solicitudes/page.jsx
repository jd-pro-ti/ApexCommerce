'use client'

import { useEffect, useState } from 'react'
import { Check, X, ArrowLeft, ShieldCheck, Trash2, UserPlus, Sparkles, RefreshCw, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminRequestsPage() {
  const [sellerRequests, setSellerRequests] = useState([])
  const [deletionRequests, setDeletionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [deletionFilter, setDeletionFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/seller-applications', { cache: 'no-store' })
      const result = await response.json()
      setSellerRequests(result.applications || [])
      setDeletionRequests(result.deletionRequests || [])
    } catch (error) {
      setMessage('Error al cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch('/api/admin/seller-applications', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (!active) return
        setSellerRequests(result.applications || [])
        setDeletionRequests(result.deletionRequests || [])
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const review = async (id, status, type) => {
    const rejection_reason = status === 'rejected' ? window.prompt('Motivo del rechazo (opcional):') : ''
    if (rejection_reason === null) return

    try {
      const response = await fetch('/api/admin/seller-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, type, rejection_reason })
      })
      const result = await response.json()
      setMessage(response.ok ? 'Solicitud actualizada correctamente.' : result.error || 'No se pudo actualizar')
      if (response.ok) load()
    } catch (error) {
      setMessage('Error de red al actualizar la solicitud.')
    }
  }

  const statusLabel = (status) => ({ pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[status] || status)

  const statusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm'
      case 'approved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm'
      default:
        return 'bg-rose-50 text-rose-600 border border-rose-200/60 shadow-sm'
    }
  }

  const filterRequests = (requests, filter) => filter === 'all' ? requests : requests.filter((item) => item.status === filter)

  const Actions = ({ item, type }) => (
    item.status === 'pending' && (
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <button
          onClick={() => review(item.id, 'approved', type)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" /> Aprobar
        </button>
        <button
          onClick={() => review(item.id, 'rejected', type)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-2xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 px-4 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" /> Rechazar
        </button>
      </div>
    )
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-6 sm:py-12 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* Cabecera Creativa */}
        <div className="relative overflow-hidden bg-[#162536] rounded-3xl p-6 sm:p-10 shadow-xl text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#FFB872] border border-white/10 shadow-inner">
                <Sparkles className="w-3.5 h-3.5" /> Moderación y Solicitudes
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Gestión de Solicitudes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Revisa las solicitudes pendientes para nuevos vendedores y las peticiones de eliminación de cuentas en la plataforma.
              </p>
            </div>

            <button
              onClick={load}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold py-3 px-6 rounded-2xl backdrop-blur-md border border-white/15 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
            >
              <RefreshCw className="w-4 h-4" /> Refrescar
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-4 text-xs font-bold shadow-sm animate-in fade-in">
            {message}
          </div>
        )}

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-10">

            {/* Sección: Solicitudes de Vendedor */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60 shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Solicitudes de Vendedor
                </h2>
              </div>

              <RequestFilters value={sellerFilter} onChange={setSellerFilter} />
              {filterRequests(sellerRequests, sellerFilter).length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-4">
                  {filterRequests(sellerRequests, sellerFilter).map((app) => (
                    <article key={app.id} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 p-5 sm:p-8 shadow-xl space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-extrabold text-base sm:text-lg text-slate-800">{app.full_name}</h3>
                            <span className={`text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold ${statusClass(app.status)}`}>
                              {statusLabel(app.status)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            {app.profiles?.email || 'Sin correo'} &bull; <span className="text-slate-400">{new Date(app.created_at).toLocaleDateString('es-MX')}</span>
                          </p>
                        </div>
                        <Actions item={app} type="seller" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-xs">
                        <div className="min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">CURP</span>
                          <b className="text-slate-800 font-bold break-all block">{app.curp}</b>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">RFC</span>
                          <b className="text-slate-800 font-bold break-all block">{app.rfc || 'No proporcionado'}</b>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Teléfono</span>
                          <b className="text-slate-800 font-bold break-all block">{app.phone}</b>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Identificación</span>
                          <b className="text-slate-800 font-bold break-all block">{app.id_type} {app.id_number || ''}</b>
                        </div>
                        <div className="col-span-2 lg:col-span-4 pt-2 border-t border-slate-200/60 min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Domicilio</span>
                          <b className="text-slate-800 font-bold break-words block">{app.address}, {app.city}, {app.state}, CP {app.postal_code}</b>
                        </div>
                        <div className="col-span-2 lg:col-span-4 pt-2 border-t border-slate-200/60 min-w-0">
                          <span className="text-slate-400 font-bold uppercase text-[10px] block mb-0.5">Razón de la solicitud</span>
                          <b className="text-slate-800 font-bold break-words block">{app.notes || 'No proporcionada'}</b>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Sección: Solicitudes de Eliminación de Cuenta */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200/60 shadow-sm">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Solicitudes de eliminación de cuenta
                </h2>
              </div>

              <RequestFilters value={deletionFilter} onChange={setDeletionFilter} />
              {filterRequests(deletionRequests, deletionFilter).length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-4">
                  {filterRequests(deletionRequests, deletionFilter).map((item) => (
                    <article key={item.id} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 p-5 sm:p-8 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-extrabold text-base sm:text-lg text-slate-800">{item.profiles?.name || 'Usuario'}</h3>
                            <span className={`text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold ${statusClass(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            {item.profiles?.email || 'Sin correo'} &bull; Rol: <span className="uppercase font-bold text-slate-700">{item.profiles?.role || 'usuario'}</span> &bull; <span className="text-slate-400">{new Date(item.created_at).toLocaleDateString('es-MX')}</span>
                          </p>
                        </div>
                        <Actions item={item} type="deletion" />
                      </div>

                      {item.reason && (
                        <div className="rounded-2xl bg-slate-50/80 border border-slate-200/60 p-4 text-xs text-slate-600">
                          <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Motivo de eliminación:</span>
                          {item.reason}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

      </div>
    </main>
  )
}

function Empty() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/80 p-8 text-center text-xs font-semibold text-slate-400 shadow-xl">
      No hay solicitudes todavía.
    </div>
  )
}

function RequestFilters({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-2 shadow-sm">
      <span className="mr-1 inline-flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><SlidersHorizontal className="h-3.5 w-3.5" />Filtrar</span>
      {[['all', 'Todas'], ['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['rejected', 'Rechazadas']].map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${value === key ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}
