'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/ui/Alert'

function getFriendlyPaypalError(error) {
  const message = String(error?.message || error || '')
  if (/payee\(s\).*merchant id|merchant-id=.*sdk|zoid|bootstrap error|request listener already exists|paypal\.buttons is not a function|nueva.*checkout/i.test(message)) {
    return 'Algo falló con PayPal. Recarga la página e inténtalo de nuevo.'
  }
  return message || 'Algo falló con PayPal. Recarga la página e inténtalo de nuevo.'
}

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
  console.log('[PayPal] Merchant IDs del carrito:', {
    productCount: productIds.length,
    sellerCount: result.merchantIds.length,
    merchantIds: result.merchantIds
  })
  return result.merchantIds
}

function loadPaypalSdk(merchantIds) {
  return new Promise((resolve, reject) => {
    const merchantIdValue = merchantIds.join(',')
    const isMultiSeller = merchantIds.length > 1
    const sdkMerchantQuery = isMultiSeller
      ? '*'
      : encodeURIComponent(merchantIds[0])
    console.log('[PayPal] Configurando SDK:', {
      sellerCount: merchantIds.length,
      merchantIds,
      sdkMerchantQuery,
      isMultiSeller
    })
    const existing = document.querySelector('script[data-apex-paypal]')
    if (existing) {
      const existingMerchantQuery = new URL(existing.src, window.location.origin).searchParams.get('merchant-id')
      const existingDataMerchantIds = existing.getAttribute('data-merchant-id') || ''
      const sameMerchantConfiguration = existingMerchantQuery === sdkMerchantQuery
        && (!isMultiSeller || existingDataMerchantIds === merchantIdValue)
      if (sameMerchantConfiguration && window.paypal?.Buttons) return resolve(window.paypal)
      if (window.paypal?.Buttons) {
        console.warn('[PayPal] Cambió la configuración de merchant-id. Se requiere una nueva sesión de checkout.')
        return reject(new Error('PayPal necesita una nueva sesión de checkout'))
      }
      // La instancia anterior fue inicializada con otra configuración de
      // merchant-id. Eliminarla evita reutilizar sellers del carrito anterior.
      existing.addEventListener('load', () => {
        if (window.paypal?.Buttons) resolve(window.paypal)
        else reject(new Error('PayPal SDK cargó sin exponer Buttons'))
      }, { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '')}&merchant-id=${sdkMerchantQuery}&currency=MXN&buyer-country=MX&locale=es_MX&intent=capture&components=buttons&enable-funding=card`
    console.log('[PayPal] SDK URL merchant-id:', sdkMerchantQuery)
    script.dataset.merchantId = merchantIdValue
    if (isMultiSeller) script.setAttribute('data-merchant-id', merchantIdValue)
    script.async = true
    script.dataset.apexPaypal = 'true'
    script.onload = () => {
      if (window.paypal?.Buttons) resolve(window.paypal)
      else reject(new Error('PayPal SDK cargó sin exponer Buttons'))
    }
    script.onerror = () => reject(new Error('No se pudo cargar PayPal'))
    document.head.appendChild(script)
  })
}

export default function PayPalCheckout({ cartItems, onSuccess, onCancel, onError, onProcessing }) {
  const containerRef = useRef(null)
  const renderedRef = useRef(false)
  const processingRef = useRef(false)
  const cartItemsRef = useRef(cartItems)
  const callbacksRef = useRef({ onSuccess, onCancel, onError, onProcessing })
  const cartItemsKey = JSON.stringify(cartItems)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ variant: 'info', message: 'Conectando con PayPal Sandbox...' })

  useEffect(() => {
    cartItemsRef.current = cartItems
    callbacksRef.current = { onSuccess, onCancel, onError, onProcessing }
  }, [cartItems, onCancel, onError, onProcessing, onSuccess])

  useEffect(() => {
    let cancelled = false
    const checkoutContainer = containerRef.current
    const currentCartItems = cartItemsRef.current
    async function renderButtons() {
      try {
        const merchantIds = await getMerchantIds(currentCartItems.map((item) => item.id))
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
              body: JSON.stringify({ cartItems: currentCartItems, merchantIds })
            })
            const result = await response.json()
            if (!response.ok) throw new Error(getFriendlyPaypalError(result.error || 'No se pudo preparar el pago'))
            setStatus({ variant: 'info', message: 'Orden creada. Completa los datos de pago en PayPal.' })
            return result.id
          },
          onApprove: async data => {
            processingRef.current = true
            callbacksRef.current.onProcessing?.(true)
            setStatus({ variant: 'info', message: 'Pago recibido. Confirmando el pedido y descontando el stock...' })
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session?.access_token || ''}` }
            })
            const result = await response.json()
            if (!response.ok) {
              const stage = result.stage ? ` (fase: ${result.stage})` : ''
              throw new Error(getFriendlyPaypalError(`${result.error || 'No se pudo confirmar el pago'}${stage}`))
            }
            setStatus({ variant: 'success', message: 'Pago realizado correctamente y pedido confirmado.' })
            callbacksRef.current.onSuccess(result)
          },
          onCancel: () => {
            processingRef.current = false
            callbacksRef.current.onProcessing?.(false)
            setStatus({ variant: 'info', message: 'Pago cancelado. No se descontó el stock.' })
            callbacksRef.current.onCancel()
          },
          onError: error => {
            processingRef.current = false
            callbacksRef.current.onProcessing?.(false)
            callbacksRef.current.onError(getFriendlyPaypalError(error))
          }
        }).render(containerRef.current)
        if (!cancelled) setLoading(false)
      } catch (error) {
        if (!cancelled) {
          processingRef.current = false
          callbacksRef.current.onProcessing?.(false)
          setLoading(false)
          const friendlyError = getFriendlyPaypalError(error)
          setStatus({ variant: 'error', message: friendlyError })
          callbacksRef.current.onError(friendlyError)
        }
      }
    }
    renderButtons()
    return () => {
      cancelled = true
      renderedRef.current = false
      if (checkoutContainer) checkoutContainer.replaceChildren()
    }
  }, [cartItemsKey])

  return <div className="relative min-h-24">
    <Alert variant={status.variant} className="mb-4">{status.message}</Alert>
    <div ref={containerRef} />
    {loading && <p className="text-center text-sm text-slate-500">Cargando checkout seguro...</p>}
  </div>
}
