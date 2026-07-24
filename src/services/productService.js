import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const productService = {
  // ============================================
  // MÉTODOS PARA CATEGORÍAS
  // ============================================

  async getCategories() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .order('name', { ascending: true })

      if (error) throw error

      return {
        success: true,
        categories: data || []
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error)
      return {
        success: false,
        error: error.message || 'Error al cargar categorías'
      }
    }
  },

  // ============================================
  // MÉTODOS PARA PRODUCTOS (CRUD)
  // ============================================

  async getSellerProducts(sellerId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            id,
            name
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const products = data?.map(product => ({
        ...product,
        category: product.categories?.name || 'Sin categoría',
        category_id: product.categories?.id
      })) || []

      return {
        success: true,
        products
      }
    } catch (error) {
      console.error('Error al obtener productos:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getProductById(productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            id,
            name
          )
        `)
        .eq('id', productId)
        .single()

      if (error) throw error

      const product = {
        ...data,
        category: data.categories?.name || '',
        category_id: data.categories?.id
      }

      return {
        success: true,
        product
      }
    } catch (error) {
      console.error('Error al obtener producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async createProduct(productData) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const dbData = {
        seller_id: productData.seller_id,
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        category_id: productData.category_id,
        stock: productData.stock || 0,
        images: productData.images || [],
        specifications: productData.specifications || {},
        status: productData.status || 'active',
        featured: productData.featured || false
      }

      const { data, error } = await supabase
        .from('products')
        .insert(dbData)
        .select(`
          *,
          categories!inner (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      const product = {
        ...data,
        category: data.categories?.name || '',
        category_id: data.categories?.id
      }

      return {
        success: true,
        product
      }
    } catch (error) {
      console.error('Error al crear producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async updateProduct(productId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const dbData = {
        name: updates.name,
        description: updates.description || '',
        price: updates.price,
        category_id: updates.category_id,
        stock: updates.stock || 0,
        images: updates.images || [],
        specifications: updates.specifications || {},
        status: updates.status || 'active',
        featured: updates.featured || false,
        updated_at: new Date()
      }

      const { data, error } = await supabase
        .from('products')
        .update(dbData)
        .eq('id', productId)
        .select(`
          *,
          categories!inner (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      const product = {
        ...data,
        category: data.categories?.name || '',
        category_id: data.categories?.id
      }

      return {
        success: true,
        product
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async deleteProduct(productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data: product } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single()

      if (product?.images?.length > 0) {
        for (const imageUrl of product.images) {
          const path = imageUrl.split('/').slice(-2).join('/')
          await supabase.storage
            .from('products')
            .remove([path])
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ============================================
  // MÉTODOS PARA IMÁGENES
  // ============================================

  async uploadImages(files, productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const uploadedUrls = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${productId}/${uuidv4()}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      }

      return {
        success: true,
        urls: uploadedUrls
      }
    } catch (error) {
      console.error('Error al subir imágenes:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async deleteImage(imageUrl) {
    try {
      const path = imageUrl.split('/').slice(-2).join('/')
      
      const { error } = await supabase.storage
        .from('products')
        .remove([path])

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ============================================
  // MÉTODOS PÚBLICOS PARA CLIENTES
  // ============================================

  async getPublicProducts(filters = {}) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      let query = supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            id,
            name
          ),
          profiles:seller_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      // El catálogo selecciona las categorías disponibles por su nombre.
      // Mantener este filtro junto al de ID permite usar ambas formas.
      if (filters.category) {
        query = query.eq('categories.name', filters.category)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.minPrice) {
        query = query.gte('price', parseFloat(filters.minPrice))
      }

      if (filters.maxPrice) {
        query = query.lte('price', parseFloat(filters.maxPrice))
      }

      if (filters.featured) {
        query = query.eq('featured', true)
      }

      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price_asc':
          case 'price-asc':
            query = query.order('price', { ascending: true })
            break
          case 'price_desc':
          case 'price-desc':
            query = query.order('price', { ascending: false })
            break
          case 'name':
            query = query.order('name', { ascending: true })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }
      }

      const { data, error } = await query

      if (error) throw error

      const products = data?.map(product => ({
        ...product,
        category: product.categories?.name || '',
        category_id: product.categories?.id
      })) || []

      return {
        success: true,
        products
      }
    } catch (error) {
      console.error('Error al obtener productos públicos:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getPublicProductById(productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            id,
            name
          ),
          profiles:seller_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('id', productId)
        .eq('status', 'active')
        .single()

      if (error) throw error

      const product = {
        ...data,
        category: data.categories?.name || '',
        category_id: data.categories?.id
      }

      return {
        success: true,
        product
      }
    } catch (error) {
      console.error('Error al obtener producto público:', error)
      return {
        success: false,
        error: error.message || 'Error al cargar el producto'
      }
    }
  },

  async getFeaturedProducts(limit = 8) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner (
            id,
            name
          ),
          profiles:seller_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const products = data?.map(product => ({
        ...product,
        category: product.categories?.name || '',
        category_id: product.categories?.id
      })) || []

      return {
        success: true,
        products
      }
    } catch (error) {
      console.error('Error al obtener productos destacados:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getCategoriesWithCount() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          products:products(count)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      const categories = data?.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        count: cat.products?.[0]?.count || 0
      })) || []

      return {
        success: true,
        categories
      }
    } catch (error) {
      console.error('Error al obtener categorías con conteo:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ============================================
  // MÉTODOS PARA EL CARRITO
  // ============================================

  async getCart(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      if (!userId) {
        throw new Error('Usuario no especificado')
      }

      console.log('🔄 Obteniendo carrito para usuario:', userId)

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            description,
            images,
            category_id,
            stock,
            categories (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)

    if (error) {
      console.error('Error en getCart:', error)
      throw error
    }

    console.log('📦 Datos crudos del carrito:', data)

    // Transformar datos para el frontend
    const cartItems = data?.map(item => ({
      id: item.product_id,
      cart_item_id: item.id,
      name: item.products?.name,
      price: item.products?.price,
      description: item.products?.description,
      images: item.products?.images || [],
      image: item.products?.images?.[0],
      category: item.products?.categories?.name || 'General',
      category_id: item.products?.category_id,
      stock: item.products?.stock || 0,
      quantity: item.quantity || 1
    })) || []

    console.log('✅ Carrito transformado:', cartItems.length, 'items')

    return {
      success: true,
      cart: cartItems
    }
  } catch (error) {
    console.error('Error al obtener carrito:', error)
    return {
      success: false,
      error: error.message || 'Error al obtener carrito'
    }
  }
},

async addToCart(userId, productId, quantity = 1) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Validar parámetros
    if (!userId) {
      throw new Error('Usuario no autenticado')
    }

    if (!productId) {
      throw new Error('Producto no especificado')
    }

    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0')
    }

    console.log('🔄 Agregando al carrito:', { userId, productId, quantity })

    // OBTENER EL STOCK DEL PRODUCTO
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single()

    if (productError) {
      console.error('Error al obtener stock del producto:', productError)
      throw productError
    }

    if (!productData) {
      throw new Error('Producto no encontrado')
    }

    // VERIFICAR SI EL PRODUCTO YA ESTÁ EN EL CARRITO
    const { data: existing, error: checkError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error al verificar existencia:', checkError)
      throw checkError
    }

    let result
    let currentQuantity = existing?.quantity || 0
    let newTotalQuantity = currentQuantity + quantity

    // VALIDAR STOCK DISPONIBLE
    if (newTotalQuantity > productData.stock) {
      const available = productData.stock - currentQuantity
      throw new Error(`Stock insuficiente. Solo quedan ${available} unidades disponibles.`)
    }

    if (existing) {
      // Actualizar cantidad del item existente
      console.log('🔄 Actualizando cantidad existente:', { 
        existingId: existing.id, 
        currentQuantity: existing.quantity,
        newQuantity: newTotalQuantity 
      })
      
      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newTotalQuantity, 
          updated_at: new Date() 
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error al actualizar:', error)
        throw error
      }
      result = data
      console.log('✅ Cantidad actualizada:', result)
    } else {
      // Insertar nuevo item (no existe previamente)
      console.log('🔄 Insertando nuevo item en carrito')
      
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity: quantity
        })
        .select()
        .single()

      if (error) {
        console.error('Error al insertar:', error)
        throw error
      }
      result = data
      console.log('✅ Item insertado:', result)
    }

    return {
      success: true,
      cartItem: result
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error)
    return {
      success: false,
      error: error.message || 'Error al agregar al carrito'
    }
  }
},

  async updateCartItemQuantity(userId, productId, quantity) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      if (quantity <= 0) {
        return await this.removeFromCart(userId, productId)
      }

      // OBTENER STOCK DEL PRODUCTO
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single()

      if (productError) throw productError

      // VALIDAR STOCK
      if (quantity > productData.stock) {
        throw new Error(`Stock insuficiente. Solo quedan ${productData.stock} unidades disponibles.`)
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date() })
        .eq('user_id', userId)
        .eq('product_id', productId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        cartItem: data
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async removeFromCart(userId, productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      console.error('Error al eliminar del carrito:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async clearCart(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      return {
        success: true
      }
    } catch (error) {
      console.error('Error al vaciar carrito:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async getCartCount(userId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId)

      if (error) throw error

      const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0

      return {
        success: true,
        count
      }
    } catch (error) {
      console.error('Error al obtener conteo del carrito:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async syncCart(userId, items) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Sincronizando carrito completo para usuario:', userId)
      
      // Primero vaciar el carrito
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (clearError) {
        console.error('Error al vaciar carrito:', clearError)
        throw clearError
      }

      if (!items || items.length === 0) {
        console.log('✅ Carrito vaciado correctamente')
        return { success: true }
      }

      // Insertar todos los items
      const cartItems = items.map(item => ({
        user_id: userId,
        product_id: item.id,
        quantity: item.quantity
      }))

      const { data, error } = await supabase
        .from('cart_items')
        .insert(cartItems)
        .select()

      if (error) {
        console.error('Error al insertar items:', error)
        throw error
      }

      console.log('✅ Carrito sincronizado:', data?.length || 0, 'items')
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Error al sincronizar carrito:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ============================================
// MÉTODOS PARA FAVORITOS (WISHLIST)
// ============================================

async getWishlist(userId) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        product_id,
        products (
          id,
          name,
          price,
          description,
          images,
          stock,
          categories (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const wishlistItems = data?.map(item => ({
      id: item.product_id,
      wishlist_id: item.id,
      ...item.products
    })) || []

    return {
      success: true,
      wishlist: wishlistItems
    }
  } catch (error) {
    console.error('Error al obtener favoritos:', error)
    return {
      success: false,
      error: error.message
    }
  }
},

async addToWishlist(userId, productId) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (existing) {
      return {
        success: true,
        message: 'Producto ya está en favoritos'
      }
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      wishlistItem: data
    }
  } catch (error) {
    console.error('Error al agregar a favoritos:', error)
    return {
      success: false,
      error: error.message
    }
  }
},

async removeFromWishlist(userId, productId) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error

    return {
      success: true
    }
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error)
    return {
      success: false,
      error: error.message
    }
  }
},

async isInWishlist(userId, productId) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, isInWishlist: false }
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) throw error

    return {
      success: true,
      isInWishlist: !!data
    }
  } catch (error) {
    console.error('Error al verificar favorito:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
}
