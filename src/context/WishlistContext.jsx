'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productService } from '@/services/productService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar favoritos desde la base de datos
  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Cargando favoritos para usuario:', user.id);
      const result = await productService.getWishlist(user.id);
      if (result.success) {
        setWishlist(result.wishlist || []);
        console.log('✅ Favoritos cargados:', result.wishlist?.length || 0, 'items');
      } else {
        console.error('Error al cargar favoritos:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      setError('Error al cargar favoritos');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Cargar favoritos cuando el usuario se autentica
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Verificar si un producto está en favoritos
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Agregar a favoritos
  const addToWishlist = async (product) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para agregar a favoritos');
      return { success: false, error: 'No autenticado' };
    }

    try {
      // Actualizar estado local inmediatamente
      setWishlist(prev => {
        // Evitar duplicados
        if (prev.some(item => item.id === product.id)) {
          return prev;
        }
        return [...prev, product];
      });

      // Guardar en la base de datos
      const result = await productService.addToWishlist(user.id, product.id);
      
      if (!result.success) {
        // Si falla, revertir
        setWishlist(prev => prev.filter(item => item.id !== product.id));
        setError(result.error || 'Error al agregar a favoritos');
        return { success: false, error: result.error };
      }

      console.log('✅ Producto agregado a favoritos:', product.name);
      return { success: true };
    } catch (error) {
      // Revertir en caso de error
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      setError(error.message || 'Error al agregar a favoritos');
      return { success: false, error: error.message };
    }
  };

  // Eliminar de favoritos
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para gestionar favoritos');
      return { success: false, error: 'No autenticado' };
    }

    try {
      // Guardar referencia para revertir si falla
      const removedItem = wishlist.find(item => item.id === productId);
      
      // Actualizar estado local inmediatamente
      setWishlist(prev => prev.filter(item => item.id !== productId));

      // Guardar en la base de datos
      const result = await productService.removeFromWishlist(user.id, productId);
      
      if (!result.success) {
        // Si falla, revertir
        if (removedItem) {
          setWishlist(prev => [...prev, removedItem]);
        }
        setError(result.error || 'Error al eliminar de favoritos');
        return { success: false, error: result.error };
      }

      console.log('✅ Producto eliminado de favoritos');
      return { success: true };
    } catch (error) {
      setError(error.message || 'Error al eliminar de favoritos');
      return { success: false, error: error.message };
    }
  };

  // Alternar favorito (agregar/quitar)
  const toggleWishlist = async (product) => {
    if (!product?.id) {
      setError('Producto inválido');
      return { success: false, error: 'Producto inválido' };
    }

    if (isInWishlist(product.id)) {
      return await removeFromWishlist(product.id);
    } else {
      return await addToWishlist(product);
    }
  };

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    wishlist,
    loading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    loadWishlist,
    setError
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist debe usarse dentro de WishlistProvider');
  }
  return context;
};