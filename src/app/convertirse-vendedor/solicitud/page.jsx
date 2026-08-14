'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const initial = { full_name: '', curp: '', rfc: '', phone: '', birth_date: '', id_type: 'INE', id_number: '', address: '', city: '', state: '', postal_code: '', country: 'México', notes: '' }

const fields = [
  { name: 'full_name', label: 'Nombre completo', required: true, maxLength: 100 },
  { name: 'curp', label: 'CURP', required: true, maxLength: 18, minLength: 18, transform: (value) => value.toUpperCase() },
  { name: 'rfc', label: 'RFC', required: true, maxLength: 13, minLength: 12, transform: (value) => value.toUpperCase() },
  { name: 'phone', label: 'Teléfono', required: true, maxLength: 15, inputMode: 'tel' },
  { name: 'birth_date', label: 'Fecha de nacimiento', required: true, type: 'date' },
  { name: 'id_number', label: 'Número de identificación oficial', required: true, maxLength: 30 },
  { name: 'address', label: 'Domicilio completo', required: true, maxLength: 180 },
  { name: 'city', label: 'Ciudad', required: true, maxLength: 80 },
  { name: 'state', label: 'Estado', required: true, maxLength: 80 },
  { name: 'postal_code', label: 'Código postal', required: true, maxLength: 5, minLength: 5, inputMode: 'numeric' },
]

export default function SellerApplicationPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!authLoading && !user) router.replace('/login') }, [user, authLoading, router])

  const updateField = (field, value) => {
    const nextValue = field.transform ? field.transform(value) : value
    setForm((current) => ({ ...current, [field.name]: nextValue }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const response = await fetch('/api/seller-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) return setStatus({ type: 'error', text: result.error || 'No se pudo enviar' })
      setStatus({ type: 'success', text: 'Solicitud enviada. El administrador revisará tus datos.' })
      setTimeout(() => router.push('/perfil'), 1800)
    } catch {
      setStatus({ type: 'error', text: 'No se pudo enviar la solicitud. Intenta nuevamente.' })
    } finally {
      setSaving(false)
    }
  }

  return <main className="min-h-screen bg-slate-50 px-5 py-10"><div className="mx-auto max-w-3xl"><Link href="/convertirse-vendedor" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Volver a beneficios</Link><div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10"><div className="flex items-start gap-4"><div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><ShieldCheck /></div><div><h1 className="text-3xl font-bold text-slate-900">Solicitud de vendedor</h1><p className="mt-2 text-sm text-slate-500">Usaremos esta información únicamente para validar tu identidad y prevenir fraudes.</p></div></div>{role && role !== 'cliente' ? <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Tu cuenta ya no puede enviar esta solicitud.</p> : <form onSubmit={submit} className="mt-9 space-y-7"><div><h2 className="mb-4 font-bold text-slate-900">Datos personales</h2><div className="grid gap-4 md:grid-cols-2">{fields.slice(0, 6).map((field) => <label key={field.name} className="text-sm font-semibold text-slate-700">{field.label}{field.required && ' *'}<input required={field.required} type={field.type || 'text'} inputMode={field.inputMode} minLength={field.minLength} maxLength={field.maxLength} value={form[field.name]} onChange={(event) => updateField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-amber-400" /></label>)}</div></div><div><h2 className="mb-4 font-bold text-slate-900">Domicilio</h2><div className="grid gap-4 md:grid-cols-2">{fields.slice(6).map((field) => <label key={field.name} className="text-sm font-semibold text-slate-700">{field.label}{field.required && ' *'}<input required={field.required} type={field.type || 'text'} inputMode={field.inputMode} minLength={field.minLength} maxLength={field.maxLength} value={form[field.name]} onChange={(event) => updateField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-amber-400" /></label>)}</div></div><label className="block text-sm font-semibold text-slate-700">Información adicional<textarea required minLength={20} maxLength={1000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-amber-400" placeholder="Describe con al menos 20 palabras qué productos venderás" /><span className="mt-1 block text-xs font-normal text-slate-500">Mínimo 20 palabras, máximo 1,000 caracteres.</span></label>{status && <p className={`rounded-xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{status.text}</p>}<button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#162536] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{saving ? 'Enviando...' : 'Enviar solicitud'}</button></form>}</div></div></main>
}
