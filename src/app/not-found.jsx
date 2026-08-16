import Link from 'next/link'
import { ArrowLeft, Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#fff7ed] flex items-center justify-center px-5 py-16">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#FFB872]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-slate-900/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#162536] text-[#FFB872] shadow-lg shadow-slate-300/50">
          <SearchX className="h-10 w-10" strokeWidth={1.7} />
        </div>

        <p className="relative z-10 mt-8 text-7xl font-black tracking-tight text-[#162536] sm:text-8xl">404</p>
        <h1 className="relative z-10 mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Página no encontrada
        </h1>
        <p className="relative z-10 mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
          La página que estás buscando no existe, fue movida o ya no está disponible.
        </p>

        <Link
          href="/"
          className="relative z-10 mt-8 inline-flex items-center gap-2 rounded-xl bg-[#162536] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          Regresar al inicio
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>

        <p className="relative z-10 mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
          Apex Commerce
        </p>
      </div>
    </main>
  )
}
