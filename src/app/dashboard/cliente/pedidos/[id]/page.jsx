'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrders } from '@/context/OrderContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, loading } = useOrders();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const result = await getOrder(params.id);
      if (result) {
        setOrder(result);
      } else {
        router.push('/dashboard/cliente/pedidos');
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      router.push('/dashboard/cliente/pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5 text-yellow-500" />,
      processing: <Package className="w-5 h-5 text-blue-500" />,
      shipped: <Truck className="w-5 h-5 text-purple-500" />,
      delivered: <CheckCircle className="w-5 h-5 text-green-500" />,
      cancelled: <Clock className="w-5 h-5 text-red-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      processing: 'En proceso',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido no encontrado</h2>
        <Link href="/dashboard/cliente/pedidos">
          <button className="text-blue-600 hover:text-blue-800">Volver a mis pedidos</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard/cliente/pedidos" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cabecera */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.order_number}</h1>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Dirección de envío */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Dirección de envío</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p>{order.customer_name}</p>
              <p>{order.shipping_address}</p>
              {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
              <p>{order.shipping_city}, {order.shipping_state}</p>
              <p>CP: {order.shipping_postal_code}</p>
              <p>{order.shipping_country}</p>
              {order.shipping_reference && <p>Referencia: {order.shipping_reference}</p>}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📦</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${(item.product_price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">${item.product_price.toFixed(2)} c/u</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status || order.status)}`}>
                      {getStatusLabel(item.status || order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-900">${order.shipping_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (16%)</span>
                <span className="text-gray-900">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Estado de pago */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-700">Estado de pago:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {order.payment_status === 'paid' ? '✅ Pagado' :
                 order.payment_status === 'pending' ? '⏳ Pendiente' : '❌ Fallido'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
