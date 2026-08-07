'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { user, isAuthenticated, role } = useAuth();
  const { clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Cargar pedidos según el rol
  const loadOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (role === 'admin') {
        result = await orderService.getAllOrders();
      } else if (role === 'vendedor') {
        result = await orderService.getSellerOrders(user.id);
      } else {
        result = await orderService.getClientOrders(user.id);
      }

      if (result.success) {
        setOrders(result.orders || []);
      } else {
        setError(result.error || 'Error al cargar pedidos');
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, role]);

  // Cargar pedidos al autenticarse
  useEffect(() => {
    const timer = setTimeout(() => { loadOrders(); }, 0);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  // Crear pedido desde el carrito
  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);

    try {
      // Verificar que el perfil esté completo
      const profileCheck = await orderService.checkProfileComplete(user.id);
      
      if (!profileCheck.success) {
        setError(profileCheck.error || 'Error al verificar perfil');
        setLoading(false);
        return { success: false, error: profileCheck.error };
      }

      if (!profileCheck.isComplete) {
        const missingFields = profileCheck.missingFields.join(', ');
        setError(`Por favor completa tu perfil: ${missingFields}`);
        setLoading(false);
        return { 
          success: false, 
          error: `Perfil incompleto: ${missingFields}`,
          missingFields: profileCheck.missingFields
        };
      }

      // Crear el pedido
      const result = await orderService.createOrder({
        user_id: user.id,
        customer_name: profileCheck.profile.name,
        customer_email: profileCheck.profile.email,
        customer_phone: profileCheck.profile.details.phone,
        shipping_address: profileCheck.profile.details.address,
        shipping_address_line2: profileCheck.profile.details.address_line2 || '',
        shipping_city: profileCheck.profile.details.city,
        shipping_state: profileCheck.profile.details.state,
        shipping_postal_code: profileCheck.profile.details.postal_code,
        shipping_country: profileCheck.profile.details.country || 'México',
        shipping_reference: profileCheck.profile.details.reference || '',
        cart_items: orderData.cart_items || [],
        notes: orderData.notes || ''
      });

      if (result.success) {
        setCurrentOrder(result.order);
        
        // Esperar la notificación para garantizar el aviso al vendedor
        const notificationResult = await orderService.notifyOrder('created', { orderId: result.orderId })
        if (!notificationResult.sent) {
          console.error('❌ Error en notificaciones:', notificationResult.error)
        }
        
        // Limpiar el carrito después de crear el pedido
        await clearCart();
        // Recargar pedidos
        await loadOrders();
        return { success: true, order: result.order };
      } else {
        setError(result.error || 'Error al crear pedido');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setError('Error al crear pedido');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado del pedido (para admin y cambios globales)
  const updateOrderStatus = async (orderId, status, notes = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await orderService.updateOrderStatus(orderId, status, notes);
      
      if (result.success) {
        // Enviar notificación por correo
        const notificationResult = await orderService.notifyOrder(status, { orderId, notes })
        if (!notificationResult.sent) console.error('❌ Error en notificación:', notificationResult.error)
        
        await loadOrders();
        return { success: true, order: result.order };
      } else {
        setError(result.error || 'Error al actualizar estado');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError('Error al actualizar estado');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await orderService.cancelOrder(orderId);
      if (!result.success) {
        setError(result.error || 'Error al cancelar el pedido');
        return result;
      }

      const notificationResult = await orderService.notifyOrder('cancelled', {
        orderId,
        notes: 'El cliente canceló el pedido.'
      });
      if (!notificationResult.sent) console.error('❌ Error en notificación:', notificationResult.error);
      await loadOrders();
      return result;
    } catch (error) {
      setError('Error al cancelar el pedido');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const confirmOrderDelivery = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.confirmOrderDelivery(orderId);
      if (!result.success) {
        setError(result.error || 'No se pudo confirmar la entrega');
        return result;
      }
      const notificationResult = await orderService.notifyOrder('delivered', { orderId });
      await loadOrders();
      return { ...result, notificationSent: notificationResult.sent };
    } catch (error) {
      setError(error.message || 'No se pudo confirmar la entrega');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de un item específico (para vendedores)
  const updateOrderItemStatus = async (itemId, status) => {
    if (!user?.id) return { success: false, error: 'Sesión no válida' };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await orderService.updateOrderItemStatus(itemId, user.id, status);
      
      if (result.success) {
        let payoutResult = null;
        if (status === 'delivered') {
          try {
            const payoutResponse = await orderService.fetchWithAuth('/api/paypal/payouts/release', {
              method: 'POST',
              body: JSON.stringify({ orderId: result.orderId })
            });
            payoutResult = await payoutResponse.json();
          } catch (payoutError) {
            payoutResult = { success: false, released: false, error: payoutError.message };
          }
        }
        // Enviar notificación por correo
        const notificationResult = await orderService.notifyOrder('item-status', {
          orderId: result.orderId, 
          itemId, 
          status,
          notes: `Estado del producto actualizado a: ${status}`
        })
        if (!notificationResult.sent) {
          console.error('❌ Error en notificación:', notificationResult.error)
          await loadOrders();
          return {
            success: true,
            orderId: result.orderId,
            payoutResult,
            notificationSent: false,
            notificationError: notificationResult.error || 'No autorizado'
          }
        }
        
        await loadOrders();
        return {
          success: true,
          orderId: result.orderId,
          payoutResult,
          notificationSent: true
        };
      } else {
        setError(result.error || 'Error al actualizar el estado');
        return result;
      }
    } catch (error) {
      console.error('Error al actualizar estado del item:', error);
      setError('Error al actualizar el estado');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener pedido por ID
  const getOrder = async (orderId) => {
    try {
      const result = await orderService.getOrderById(orderId);
      if (result.success) {
        return result.order;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener pedido:', error);
      return null;
    }
  };

  const value = {
    orders,
    loading,
    error,
    currentOrder,
    loadOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    confirmOrderDelivery,
    updateOrderItemStatus,
    getOrder,
    setError
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders debe usarse dentro de OrderProvider');
  }
  return context;
};
