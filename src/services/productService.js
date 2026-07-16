import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const productService = {
  // Obtener productos de un vendedor
  async getSellerProducts(sellerId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        products: data
      }
    } catch (error) {
      console.error('Error al obtener productos:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Obtener producto por ID
  async getProductById(productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error

      return {
        success: true,
        product: data
      }
    } catch (error) {
      console.error('Error al obtener producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Crear producto
  async createProduct(productData) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          seller_id: productData.seller_id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock: productData.stock || 0,
          images: productData.images || [],
          status: productData.status || 'active',
          featured: productData.featured || false
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        product: data
      }
    } catch (error) {
      console.error('Error al crear producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Actualizar producto
  async updateProduct(productId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        product: data
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Eliminar producto
  async deleteProduct(productId) {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase no está configurado')
      }

      // Primero obtener las imágenes del producto
      const { data: product } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single()

      // Eliminar imágenes del storage
      if (product?.images?.length > 0) {
        for (const imageUrl of product.images) {
          // Extraer el path del storage desde la URL
          const path = imageUrl.split('/').slice(-2).join('/')
          await supabase.storage
            .from('products')
            .remove([path])
        }
      }

      // Eliminar el producto
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

  // Subir imágenes al storage
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

        // Obtener la URL pública
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

  // Eliminar imagen específica
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

  // Obtener productos públicos (para clientes)
async getPublicProducts(filters = {}) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:seller_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Filtros
    if (filters.category && filters.category !== 'all' && filters.category !== '') {
      query = query.eq('category', filters.category)
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

    // Ordenamiento
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error en query:', error)
      throw error
    }

    return {
      success: true,
      products: data || []
    }
  } catch (error) {
    console.error('Error al obtener productos públicos:', error)
    return {
      success: false,
      error: error.message || 'Error al cargar productos'
    }
  }
},

// Obtener productos destacados
async getFeaturedProducts(limit = 8) {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
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

    if (error) {
      console.error('Error en query destacados:', error)
      throw error
    }

    return {
      success: true,
      products: data || []
    }
  } catch (error) {
    console.error('Error al obtener productos destacados:', error)
    return {
      success: false,
      error: error.message || 'Error al cargar productos destacados'
    }
  }
},

// Obtener categorías con conteo de productos
async getCategoriesWithCount() {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado')
    }

    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'active')
      .not('category', 'is', null)

    if (error) throw error

    const counts = {}
    data?.forEach(item => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1
      }
    })

    const categories = Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    }))

    return {
      success: true,
      categories: categories.sort((a, b) => b.count - a.count)
    }
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return {
      success: false,
      error: error.message || 'Error al cargar categorías'
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

    if (error) {
      console.error('Error en getPublicProductById:', error)
      throw error
    }

    return {
      success: true,
      product: data
    }
  } catch (error) {
    console.error('Error al obtener producto público:', error)
    return {
      success: false,
      error: error.message || 'Error al cargar el producto'
    }
  }
},
  
  // Obtener categorías disponibles
  async getCategories() {
    try {
      // Obtener categorías únicas de los productos
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      const categories = [...new Set(data.map(item => item.category))]
      
      return {
        success: true,
        categories
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}