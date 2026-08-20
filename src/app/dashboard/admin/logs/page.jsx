'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Sparkles, RefreshCw, Terminal } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/logs', { cache: 'no-store' })
      const r = await response.json()
      setLogs(r.logs || [])
    } catch (error) {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] py-6 sm:py-12 text-[#0f172a]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Cabecera Creativa */}
        <div className="relative overflow-hidden bg-[#162536] rounded-3xl p-6 sm:p-10 shadow-xl text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#FFB872]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-[#545F6D]/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-[#FFB872] border border-white/10 shadow-inner">
                <Sparkles className="w-3.5 h-3.5" /> Auditoría del Sistema
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Logs de Administración
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Historial detallado de acciones, eventos relevantes y movimientos realizados en la plataforma.
              </p>
            </div>

            <button 
              onClick={loadLogs} 
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold py-3 px-6 rounded-2xl backdrop-blur-md border border-white/15 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10"
            >
              <RefreshCw className="w-4 h-4" /> Refrescar Logs
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 p-4 sm:p-8 shadow-xl">
          {loading ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs font-semibold text-slate-400">
              No hay eventos registrados en el sistema.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl transition-all shadow-sm space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <b className="text-xs sm:text-sm font-extrabold text-slate-800 break-words flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-500 shrink-0" /> {log.message}
                    </b>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-xl border border-slate-200/60 w-fit">
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/50">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200/50 uppercase text-[9px] font-bold">
                      {log.action}
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-600">{log.entity_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}