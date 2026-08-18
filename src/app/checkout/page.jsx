'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/components/ui/AlertContext';
import Alert from '@/components/ui/Alert';
import PayPalCheckout from '@/components/payments/PayPalCheckout';
import { orderService } from '@/services/orderService';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { showAlert } = useAlert();
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Congela el carrito al entrar al checkout para que el SDK de PayPal no
  // cambie de vendedores mientras el comprador está pagando.
  useEffect(() => {
    if (!checkoutItems.length && cart.length) {
      // CartProvider hidrata el carrito de forma asíncrona cuando se accede
      // directamente a /checkout.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckoutItems(cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image || item.images?.[0] || item.thumbnail,
        category: item.category,
        color: item.color,
        material: item.material
      })));
    }
  }, [cart, checkoutItems.length]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    if (['admin', 'vendedor'].includes(String(user?.role || '').toLowerCase())) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/vendedor');
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  useEffect(() => {
    if (!authLoading && !cartLoading && isAuthenticated && !cart.length && !checkoutItems.length && !isRedirecting) {
      router.replace('/carrito');
    }
  }, [authLoading, cart.length, cartLoading, checkoutItems.length, isAuthenticated, isRedirecting, router]);

  const paypalCartItems = useMemo(
    () => checkoutItems.map(({ id, quantity }) => ({ id, quantity })),
    [checkoutItems]
  );
  const checkoutTotal = checkoutItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  const handlePaymentSuccess = useCallback(async (result) => {
    setIsPaymentProcessing(false);
    setIsRedirecting(true);
    setPaymentAlert({ variant: 'success', message: 'Pago realizado correctamente. Tu pedido fue confirmado.' });
    await clearCart();
    await orderService.notifyOrder('created', { orderId: result.orderId });
    showAlert('Pago confirmado. Tu pedido ya está siendo procesado.', 'success');
    router.push('/perfil?tab=orders');
  }, [clearCart, router, showAlert]);

  const handlePaymentError = useCallback((message) => {
    setIsPaymentProcessing(false);
    setPaymentAlert({ variant: 'error', message: message || 'Algo falló con PayPal. Recarga la página e inténtalo de nuevo.' });
    showAlert('El pago no pudo completarse. Inténtalo de nuevo.', 'error');
  }, [showAlert]);

  const handlePaymentCancel = useCallback(() => {
    setIsPaymentProcessing(false);
    showAlert('Operación de pago cancelada.', 'info');
  }, [showAlert]);

  if (authLoading || cartLoading || !isAuthenticated || isRedirecting || !checkoutItems.length) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 pt-24">
        <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-warm-accent/10 blur-3xl" />
        <div className="relative w-full max-w-lg rounded-3xl border border-surface-container bg-surface-container-lowest/95 p-8 text-center shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-12">
          <div className="mb-7 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">
            <span className="flex items-center gap-2 text-primary"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">1</span> Carrito</span>
            <span className="h-px w-8 bg-primary/30" />
            <span className="flex items-center gap-2 text-on-surface"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">2</span> Pago</span>
            <span className="h-px w-8 bg-surface-container" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">3</span>
          </div>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-warm-accent shadow-xl shadow-slate-900/20">A</div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-warm-accent">Apex Commerce</p>
          <h2 className="text-xl font-bold text-on-surface">{isRedirecting ? 'Preparando tu historial de pedidos' : 'Preparando checkout'}</h2>
          <p className="mt-2 text-sm text-on-surface-variant/80">Estamos preparando una sesión segura de pago.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] px-3 pb-28 pt-32 sm:px-6 sm:pb-16 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 flex max-w-xl items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/60 sm:gap-4 sm:text-[11px]">
          <span className="flex items-center gap-2 text-primary"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-on-primary">1</span> Carrito</span>
          <span className="h-px w-8 bg-primary/30 sm:w-16" />
          <span className="flex items-center gap-2 text-on-surface"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-on-primary">2</span> Pago</span>
          <span className="h-px w-8 bg-surface-container sm:w-16" />
          <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-xs">3</span> Confirmación</span>
        </div>
        <div className="mb-7 flex flex-col gap-4 border-b border-surface-container pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-accent">Apex Commerce</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Finalizar compra</h1>
            <p className="mt-2 text-sm text-on-surface-variant/80">Revisa tu pedido y completa el pago de forma segura.</p>
          </div>
          <Link
            href="/carrito"
            aria-label="Volver al carrito de compras"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 sm:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Volver al carrito de compras
          </Link>
        </div>

        {paymentAlert && <Alert className="mb-6" variant={paymentAlert.variant}>{paymentAlert.message}</Alert>}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-7">
          <section className="rounded-3xl border border-surface-container bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-7 lg:p-8">
            <div className="mb-6 border-b border-surface-container pb-5">
              <h2 className="text-xl font-bold text-on-surface">Tu pedido</h2>
              <p className="mt-1 text-sm text-on-surface-variant/70">{checkoutItems.length} artículo(s) reservados para este checkout.</p>
            </div>
            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-surface-container bg-[#f8f7f5] p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <span className="text-2xl text-outline">□</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-on-surface">{item.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant/70">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="self-end font-bold text-on-surface sm:self-auto">${(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              El pedido está congelado durante el pago. Para modificarlo, vuelve al carrito.
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <section className="rounded-3xl border border-surface-container bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface">Resumen</h2>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">{checkoutItems.length} artículos</span>
              </div>
              <div className="mb-5 flex items-center justify-between text-sm text-on-surface-variant/80">
                <span>Subtotal</span>
                <span className="font-semibold text-on-surface">${checkoutTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between border-t border-surface-container pt-4 text-lg font-bold text-on-surface">
                <span>Total</span>
                <span>${checkoutTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN</span>
              </div>
            </section>

            <section className="rounded-3xl border border-surface-container bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface">Pago seguro</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">SSL seguro</span>
              </div>
              <PayPalCheckout
                cartItems={paypalCartItems}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onError={handlePaymentError}
                onProcessing={setIsPaymentProcessing}
              />
              <p className="mt-3 text-center text-xs text-outline">Pago de prueba en PayPal Sandbox.</p>
            </section>
          </aside>
        </div>

        {isPaymentProcessing && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" role="status" aria-live="polite">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white p-8 text-center shadow-2xl shadow-slate-950/30 sm:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-warm-accent/15 blur-3xl" />
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                <span className="absolute inset-1 animate-[spin_2.4s_linear_infinite] rounded-full border-[3px] border-surface-container border-t-primary border-r-warm-accent" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-warm-accent shadow-lg shadow-slate-900/20">A</span>
              </div>
              <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent">Apex Commerce</p>
              <h3 className="relative mt-3 text-xl font-bold tracking-tight text-slate-950">Procesando tu pago</h3>
              <p className="relative mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">Estamos confirmando el pago y preparando tu pedido.</p>
              <div className="relative mt-7 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/5 animate-[loading-bar_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary via-warm-accent to-primary" />
              </div>
              <p className="relative mt-4 text-xs font-medium text-slate-400">No cierres esta ventana</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
