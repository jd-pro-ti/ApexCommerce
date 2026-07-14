'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CartPage() {
  const { cart, total, itemsCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = total;
  const shipping = subtotal > 100 ? 0 : 19.99;
  const tax = subtotal * 0.16;
  const grandTotal = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirigir a login
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowCheckout(true);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-600 mb-6">
            Explora nuestro catálogo y encuentra productos increíbles
          </p>
          <Link href="/catalogo">
            <Button size="lg">Ir al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-2xl mx-auto text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pedido confirmado!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu pedido ha sido procesado correctamente. Recibirás un correo con los detalles.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/catalogo">
              <Button variant="outline">Seguir comprando</Button>
            </Link>
            <Link href="/dashboard/cliente/pedidos">
              <Button>Ver mis pedidos</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrito de compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Vaciar carrito
              </button>
              <Link href="/catalogo">
                <Button variant="outline" size="sm">Seguir comprando</Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Resumen */}
        <div>
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemsCount} productos)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Impuesto (16%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-sm text-green-600 mt-1">✨ Envío gratis incluido</p>
                )}
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
                loading={loading}
              >
                {isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para comprar'}
              </Button>
              {!isAuthenticated && (
                <p className="text-sm text-center text-gray-600">
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Inicia sesión
                  </Link>
                  {' '}o{' '}
                  <Link href="/registro" className="text-blue-600 hover:underline">
                    regístrate
                  </Link>
                  {' '}para finalizar tu compra
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}