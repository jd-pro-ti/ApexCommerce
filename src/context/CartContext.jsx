'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '@/services/productService';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const syncedUserIdRef = useRef(null);

  // Cargar carrito desde la base de datos
  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      loadCartFromLocalStorage();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Cargando carrito desde BD para usuario:', user.id)
      const result = await productService.getCart(user.id);
      if (result.success) {
        setCart(result.cart || []);
        localStorage.setItem('apex_cart', JSON.stringify(result.cart || []));
        console.log('✅ Carrito cargado desde BD:', result.cart?.length || 0, 'items')
      } else {
        console.error('Error al cargar carrito:', result.error);
        loadCartFromLocalStorage();
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      loadCartFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Cargar desde localStorage (fallback o sin autenticación)
  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('apex_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar carrito con la base de datos
  const syncCartToDatabase = async (cartItems) => {
    if (!isAuthenticated || !user?.id) return;

    setSyncing(true);
    try {
      console.log('🔄 Sincronizando carrito con BD:', cartItems.length, 'items')
      
      const result = await productService.syncCart(user.id, cartItems);
      
      if (result.success) {
        console.log('✅ Carrito sincronizado con la base de datos');
      } else {
        console.error('❌ Error al sincronizar carrito:', result.error);
      }
    } catch (error) {
      console.error('Error al sincronizar carrito:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Al autenticarse, sincronizar primero el carrito local y cargar después el
  // resultado desde la BD. Esto evita que una lectura anterior al guardado deje
  // el estado visualmente vacío hasta el siguiente refresco.
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated && user?.id) {
        const localCart = localStorage.getItem('apex_cart');
        if (localCart) {
          const parsedCart = JSON.parse(localCart);
          if (parsedCart.length > 0 && syncedUserIdRef.current !== user.id) {
            syncedUserIdRef.current = user.id;
            await syncCartToDatabase(parsedCart);
          }
        }
      }

      await loadCart();
    };

    initializeCart();
  }, [isAuthenticated, user?.id, loadCart]);

  // Escuchar cambios en la sesión de Supabase (logout)
  useEffect(() => {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event) => {
          if (event === 'SIGNED_OUT') {
            setCart([]);
            localStorage.removeItem('apex_cart');
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Agregar al carrito con validación de stock
  const addToCart = async (product, quantity = 1) => {
    setError(null);
    
    // Validar que el producto tenga ID
    if (!product?.id) {
      console.error('❌ Producto sin ID:', product)
      setError('Producto inválido');
      return;
    }

    // Validar stock disponible
    if (product.stock <= 0) {
      setError('No hay stock disponible de este producto');
      return;
    }

    // Verificar si la cantidad solicitada supera el stock
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem?.quantity || 0;
    const newTotalQuantity = currentQuantity + quantity;

    if (newTotalQuantity > product.stock) {
      const available = product.stock - currentQuantity;
      setError(`Stock insuficiente. Solo quedan ${available} unidades disponibles.`);
      return;
    }

    // Actualizar estado local inmediatamente.
    // React puede reejecutar el actualizador de estado en desarrollo.
    let shouldPersist = true;
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      let newCart;
      
      if (exists) {
        newCart = prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prev, { ...product, quantity }];
      }

      // Guardar en localStorage
      localStorage.setItem('apex_cart', JSON.stringify(newCart));

      // Si está autenticado, guardar en la base de datos
      if (isAuthenticated && user?.id && shouldPersist) {
        shouldPersist = false;
        productService.addToCart(user.id, product.id, quantity)
          .then(result => {
            if (!result.success) {
              console.error('❌ Error al guardar en BD:', result.error);
              // Si hay error de stock, revertir el cambio local
              if (result.error?.includes('Stock insuficiente')) {
                setError(result.error);
                // Revertir el estado local
                loadCart();
              }
            } else {
              console.log('✅ Producto guardado en BD correctamente');
            }
          })
          .catch(error => {
            console.error('❌ Error al guardar en BD:', error);
          });
      }

      return newCart;
    });
  };

  // Eliminar del carrito
  const removeFromCart = async (productId) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== productId);
      localStorage.setItem('apex_cart', JSON.stringify(newCart));

      if (isAuthenticated && user?.id) {
        productService.removeFromCart(user.id, productId)
          .catch(error => console.error('Error al eliminar de BD:', error));
      }

      return newCart;
    });
  };

  // Actualizar cantidad con validación de stock
  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // Buscar el producto en el carrito para verificar stock
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;

    // Validar stock
    if (quantity > cartItem.stock) {
      setError(`Stock insuficiente. Solo quedan ${cartItem.stock} unidades disponibles.`);
      return;
    }

    setCart(prev => {
      const newCart = prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('apex_cart', JSON.stringify(newCart));

      if (isAuthenticated && user?.id) {
        productService.updateCartItemQuantity(user.id, productId, quantity)
          .catch(error => console.error('Error al actualizar en BD:', error));
      }

      return newCart;
    });
  };

  // Vaciar carrito
  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('apex_cart');

    if (isAuthenticated && user?.id) {
      await productService.clearCart(user.id);
    }
  };

  // Calcular total
  const total = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Limpiar error después de 5 segundos
  const clearError = () => {
    setTimeout(() => setError(null), 5000);
  };

  // Si hay error, limpiarlo automáticamente
  if (error) {
    clearError();
  }

  const value = {
    cart,
    loading,
    syncing,
    total,
    itemsCount,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    syncCartToDatabase,
    setError
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};
