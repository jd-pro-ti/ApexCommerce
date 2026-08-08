'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  useEffect(() => { fetch('/api/admin/logs', { cache: 'no-store' }).then((r) => r.json()).then((r) => setLogs(r.logs || [])) }, [])
  return <main className="min-h-screen bg-slate-50 p-6 md:p-10"><div className="max-w-5xl mx-auto"><Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="w-4 h-4" /> Dashboard</Link><div className="flex items-center gap-3 mt-6"><FileText className="text-amber-600" /><div><h1 className="text-3xl font-bold text-slate-900">Logs de administración</h1><p className="text-sm text-slate-500">Historial de acciones y eventos relevantes.</p></div></div><div className="mt-8 bg-white rounded-2xl border overflow-hidden">{logs.length === 0 ? <p className="p-8 text-center text-slate-500">No hay eventos registrados.</p> : logs.map((log) => <div key={log.id} className="p-5 border-b last:border-0"><div className="flex justify-between gap-4"><b className="text-slate-800">{log.message}</b><span className="text-xs text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('es-MX')}</span></div><p className="mt-1 text-xs text-slate-400">{log.action} · {log.entity_type}</p></div>)}</div></div></main>
}
