'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/ui/Alert'

function loadPaypalSdk() {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal)
    const existing = document.querySelector('script[data-apex-paypal]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '')}&currency=MXN&buyer-country=MX&locale=es_MX&intent=capture&components=buttons&enable-funding=card`
    script.async = true
    script.dataset.apexPaypal = 'true'
    script.onload = () => resolve(window.paypal)
    script.onerror = () => reject(new Error('No se pudo cargar PayPal'))
    document.head.appendChild(script)
  })
}

export default function PayPalCheckout({ cartItems, onSuccess, onCancel, onError }) {
  const containerRef = useRef(null)
  const renderedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ variant: 'info', message: 'Conectando con PayPal Sandbox...' })

  useEffect(() => {
    let cancelled = false
    async function renderButtons() {
      try {
        const paypal = await loadPaypalSdk()
        if (cancelled || !paypal || !containerRef.current || renderedRef.current) return
        renderedRef.current = true
        await paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 48 },
          createOrder: async () => {
            setStatus({ variant: 'info', message: 'Preparando tu pedido y verificando el stock...' })
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) throw new Error('Sesión no válida')
            const response = await fetch('/api/paypal/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ cartItems })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'No se pudo preparar el pago')
            setStatus({ variant: 'info', message: 'Orden creada. Completa los datos de pago en PayPal.' })
            return result.id
          },
          onApprove: async data => {
            setStatus({ variant: 'info', message: 'Pago recibido. Confirmando el pedido y descontando el stock...' })
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session?.access_token || ''}` }
            })
            const result = await response.json()
            if (!response.ok) {
              const stage = result.stage ? ` (fase: ${result.stage})` : ''
              throw new Error(`${result.error || 'No se pudo confirmar el pago'}${stage}`)
            }
            setStatus({ variant: 'success', message: 'Pago realizado correctamente y pedido confirmado.' })
            onSuccess(result)
          },
          onCancel: () => {
            setStatus({ variant: 'info', message: 'Pago cancelado. No se descontó el stock.' })
            onCancel()
          },
          onError: error => onError(error?.message || 'PayPal canceló el pago')
        }).render(containerRef.current)
        if (!cancelled) setLoading(false)
      } catch (error) {
        if (!cancelled) {
          setLoading(false)
          setStatus({ variant: 'error', message: error.message })
          onError(error.message)
        }
      }
    }
    renderButtons()
    return () => { cancelled = true }
  }, [cartItems, onCancel, onError, onSuccess])

  return <div className="min-h-24">
    <Alert variant={status.variant} className="mb-4">{status.message}</Alert>
    <div ref={containerRef} />
    {loading && <p className="text-center text-sm text-slate-500">Cargando checkout seguro...</p>}
  </div>
}
