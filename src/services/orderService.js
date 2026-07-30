import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const orderService = {
  // Enviar notificaciones por correo
  async notifyOrder(event, { orderId, itemId, status, notes = '' }) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return { sent: false, error: 'Sesión no válida' }

      const response = await fetch('/api/orders/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ event, orderId, itemId, status, notes })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudieron enviar las notificaciones')
      return result
    } catch (error) {
      console.error('❌ Error al enviar notificaciones:', error)
      return { sent: false, error: error.message }
    }
  },

  // Verificar si el perfil está completo para hacer un pedido
  async checkProfileComplete(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      const { data: details, error: detailsError } = await supabase
        .from('profile_details')
        .select('phone, address, city, state, postal_code, country')
        .eq('user_id', userId)
        .maybeSingle()

      if (detailsError && detailsError.code !== 'PGRST116') {
        throw detailsError
      }

      const requiredFields = {
        name: profile?.name,
        email: profile?.email,
        phone: details?.phone,
        address: details?.address,
        city: details?.city,
        state: details?.state,
        postal_code: details?.postal_code
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value || String(value).trim() === '')
        .map(([key]) => key)

      const isComplete = missingFields.length === 0

      return {
        success: true,
        isComplete,
        missingFields,
        profile: {
          ...profile,
          details: details || {}
        }
      }
    } catch (error) {
      console.error('Error al verificar perfil:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Crear pedido
  async createOrder(orderData) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Creando pedido:', orderData)

      const { data, error } = await supabase.rpc('create_order', {
        p_user_id: orderData.user_id,
        p_customer_name: orderData.customer_name,
        p_customer_email: orderData.customer_email,
        p_customer_phone: orderData.customer_phone,
        p_shipping_address: orderData.shipping_address,
        p_shipping_address_line2: orderData.shipping_address_line2 || '',
        p_shipping_city: orderData.shipping_city,
        p_shipping_state: orderData.shipping_state,
        p_shipping_postal_code: orderData.shipping_postal_code,
        p_shipping_country: orderData.shipping_country || 'México',
        p_shipping_reference: orderData.shipping_reference || '',
        p_cart_items: orderData.cart_items,
        p_notes: orderData.notes || ''
      })

      if (error) {
        console.error('❌ Error al crear pedido:', error)
        throw error
      }

      console.log('✅ Pedido creado ID:', data)

      const orderResult = await this.getOrderById(data)

      return {
        success: true,
        orderId: data,
        order: orderResult.order
      }
    } catch (error) {
      console.error('❌ Error al crear pedido:', error)
      return {
        success: false,
        error: error.message || 'Error al crear pedido'
      }
    }
  },

  // Obtener pedido por ID con rescate explícito de email de vendedores desde la tabla `profiles`
  // Obtener pedido por ID con garantía de traer el perfil del vendedor
  async getOrderById(orderId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      // 1. Obtener la orden con sus ítems
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              price,
              images
            ),
            profiles:seller_id (
              id,
              name,
              email
            )
          ),
          order_status_history ( * )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // 2. FORZAR BÚSQUEDA DE PROFILES: Garantiza que sellerEmail nunca venga vacío
      if (order && order.order_items && order.order_items.length > 0) {
        // Extraer todos los seller_id válidos de los ítems
        const sellerIds = [...new Set(
          order.order_items
            .map(item => item.seller_id)
            .filter(Boolean)
        )]

        if (sellerIds.length > 0) {
          // Consultar directamente a la tabla profiles
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', sellerIds)

          if (!profilesError && profilesData) {
            const profileMap = {}
            profilesData.forEach(p => {
              profileMap[p.id] = p
            })

            // Mapear manualmente los perfiles en cada ítem
            order.order_items = order.order_items.map(item => {
              const matchedProfile = profileMap[item.seller_id] || item.profiles
              return {
                ...item,
                profiles: matchedProfile,
                seller_email: matchedProfile?.email || '',
                seller_name: matchedProfile?.name || ''
              }
            })
          }
        }
      }

      return {
        success: true,
        order
      }
    } catch (error) {
      console.error('Error al obtener pedido:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Obtener pedidos del cliente
  async getClientOrders(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        orders: data || []
      }
    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Obtener pedidos para vendedor
  async getSellerOrders(sellerId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (
            *,
            profiles:user_id (
              id,
              name,
              email
            )
          ),
          products (
            id,
            name,
            images
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const ordersMap = {}
      data?.forEach(item => {
        if (!ordersMap[item.order_id]) {
          ordersMap[item.order_id] = {
            ...item.orders,
            items: []
          }
        }
        ordersMap[item.order_id].items.push({
          ...item,
          product: item.products
        })
      })

      const orders = Object.values(ordersMap)

      return {
        success: true,
        orders
      }
    } catch (error) {
      console.error('Error al obtener pedidos del vendedor:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Obtener todos los pedidos (admin)
  async getAllOrders() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email
          ),
          order_items (
            *,
            products (
              id,
              name,
              images
            ),
            profiles:seller_id (
              id,
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        orders: data || []
      }
    } catch (error) {
      console.error('Error al obtener todos los pedidos:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Actualizar estado del pedido
  async updateOrderStatus(orderId, status, notes = '') {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_status: status,
        p_notes: notes
      })

      if (error) throw error

      const orderResult = await this.getOrderById(orderId)

      return {
        success: true,
        order: orderResult.order
      }
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Cancelar un pedido desde el cliente, validando la propiedad en el servidor
  async cancelOrder(orderId) {
    try {
      if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión no válida')

      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ orderId })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo cancelar el pedido')
      return result
    } catch (error) {
      console.error('Error al cancelar pedido:', error)
      return { success: false, error: error.message }
    }
  },

  // Actualizar estado de artículo individual
  async updateOrderItemStatus(itemId, sellerId, status) {
    try {
      if (!isSupabaseConfigured()) throw new Error('Supabase no está configurado')
      if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        throw new Error('Estado no permitido')
      }

      const { data: item, error: itemError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError

      let data
      let error

      if (status === 'cancelled') {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('Sesión no válida')

        const response = await fetch('/api/orders/cancel-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ itemId })
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'No se pudo cancelar el artículo')
        data = result
      } else {
        ({ data, error } = await supabase.rpc('update_order_item_status', {
          p_item_id: itemId,
          p_status: status
        }))
      }

      if (error) throw error
      
      return { 
        success: true, 
        orderId: item.order_id,
        itemId: itemId
      }
    } catch (error) {
      console.error('Error al actualizar artículo del pedido:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener estadísticas de pedidos para vendedor
  async getSellerOrderStats(sellerId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('order_items')
        .select('status, subtotal')
        .eq('seller_id', sellerId)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(item => item.status === 'pending').length || 0,
        processing: data?.filter(item => item.status === 'processing').length || 0,
        shipped: data?.filter(item => item.status === 'shipped').length || 0,
        delivered: data?.filter(item => item.status === 'delivered').length || 0,
        cancelled: data?.filter(item => item.status === 'cancelled').length || 0,
        revenue: data?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
      }

      return {
        success: true,
        stats
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
