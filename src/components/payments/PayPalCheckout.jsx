'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/ui/Alert'

async function getMerchantIds(productIds) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('SesiÃ³n no vÃ¡lida')
  const response = await fetch('/api/paypal/sellers/merchant-ids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ productIds })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'No se pudieron consultar los vendedores PayPal')
  if (!result.merchantIds?.length) throw new Error('Ningún vendedor del carrito tiene PayPal conectado')
  return result.merchantIds
}

function loadPaypalSdk(merchantIds) {
  return new Promise((resolve, reject) => {
    const merchantIdValue = merchantIds.join(',')
    const isMultiSeller = merchantIds.length > 1
    const sdkMerchantQuery = isMultiSeller
      ? '*'
      : encodeURIComponent(merchantIds[0])
    const existing = document.querySelector('script[data-apex-paypal]')
    if (existing) {
      const existingIsMultiSeller = existing.hasAttribute('data-merchant-id')
      if (existing.dataset.merchantId === merchantIdValue && existingIsMultiSeller === isMultiSeller && window.paypal) return resolve(window.paypal)
      // PayPal registra listeners globales y no permite bootstrappear el SDK
      // otra vez en la misma pestaña. Se reutiliza la instancia existente.
      if (window.paypal) return resolve(window.paypal)
      existing.addEventListener('load', () => resolve(window.paypal), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '')}&merchant-id=${sdkMerchantQuery}&currency=MXN&buyer-country=MX&locale=es_MX&intent=capture&components=buttons&enable-funding=card`
    script.dataset.merchantId = merchantIdValue
    if (isMultiSeller) script.setAttribute('data-merchant-id', merchantIdValue)
    script.async = true
    script.dataset.apexPaypal = 'true'
    script.onload = () => resolve(window.paypal)
    script.onerror = () => reject(new Error('No se pudo cargar PayPal'))
    document.head.appendChild(script)
  })
}

export default function PayPalCheckout({ cartItems, onSuccess, onCancel, onError, onProcessing }) {
  const containerRef = useRef(null)
  const renderedRef = useRef(false)
  const processingRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ variant: 'info', message: 'Conectando con PayPal Sandbox...' })

  useEffect(() => {
    let cancelled = false
    async function renderButtons() {
      try {
        const merchantIds = await getMerchantIds(cartItems.map((item) => item.id))
        const paypal = await loadPaypalSdk(merchantIds)
        if (cancelled || !paypal || !containerRef.current || renderedRef.current) return
        renderedRef.current = true
        await paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 48 },
          createOrder: async () => {
            if (processingRef.current) throw new Error('El pago ya está siendo procesado')
            processingRef.current = true
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
            processingRef.current = true
            onProcessing?.(true)
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
            processingRef.current = false
            onProcessing?.(false)
            setStatus({ variant: 'info', message: 'Pago cancelado. No se descontó el stock.' })
            onCancel()
          },
          onError: error => {
            processingRef.current = false
            onProcessing?.(false)
            onError(error?.message || 'PayPal canceló el pago')
          }
        }).render(containerRef.current)
        if (!cancelled) setLoading(false)
      } catch (error) {
        if (!cancelled) {
          processingRef.current = false
          onProcessing?.(false)
          setLoading(false)
          setStatus({ variant: 'error', message: error.message })
          onError(error.message)
        }
      }
    }
    renderButtons()
    return () => { cancelled = true }
  }, [cartItems, onCancel, onError, onProcessing, onSuccess])

  return <div className="relative min-h-24">
    <Alert variant={status.variant} className="mb-4">{status.message}</Alert>
    <div ref={containerRef} />
    {loading && <p className="text-center text-sm text-slate-500">Cargando checkout seguro...</p>}
  </div>
}
