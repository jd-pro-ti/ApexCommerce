// Servicio de emails - Usa API Route para enviar correos
export const emailService = {
  // Enviar email a través de la API
  async sendEmail({ to, subject, html, from }) {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, html, from })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      return { success: true, messageId: data.messageId }
    } catch (error) {
      console.error('❌ Error al enviar email:', error)
      return { success: false, error: error.message }
    }
  },

  // Enviar notificación de nuevo pedido al vendedor
  async sendNewOrderToSeller(order, seller) {
    try {
      const allItems = order.order_items || order.items || []
      
      // Filtrar únicamente los ítems que pertenecen a este vendedor
      const sellerItems = allItems.filter(item => {
        const itemSellerId = item.seller_id || item.profiles?.id
        return itemSellerId === seller.id
      })

      // Si por alguna razón no se puede filtrar, usar todos los ítems como respaldo
      const itemsToRender = sellerItems.length > 0 ? sellerItems : allItems

      // Calcular el total específico de este vendedor
      const sellerTotal = itemsToRender.reduce((sum, item) => sum + (item.subtotal || item.price || 0) * (item.quantity || 1), 0)

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #010f20; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .header span { color: #e0a96d; }
            .header p { color: #ffffff; opacity: 0.8; margin: 5px 0 0; }
            .content { padding: 30px; }
            .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .order-info p { margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #010f20; color: white; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #010f20; text-align: right; padding-top: 20px; border-top: 2px solid #eee; }
            .button { display: inline-block; background: #e0a96d; color: #010f20; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .badge { display: inline-block; background: #e0a96d; color: #010f20; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Apex <span>Commerce</span></h1>
              <p>Nuevo pedido recibido</p>
            </div>
            <div class="content">
              <h2>¡Hola ${seller.name || 'Vendedor'}, tienes un nuevo pedido! 🎉</h2>
              <div class="order-info">
                <p><strong>Pedido:</strong> #${order.order_number || order.id || 'N/A'}</p>
                <p><strong>Cliente:</strong> ${order.customer_name || 'N/A'}</p>
                <p><strong>Email del Cliente:</strong> ${order.customer_email || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${order.customer_phone || 'No especificado'}</p>
                <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString('es-MX') : 'N/A'}</p>
                <p><strong>Estado:</strong> <span class="badge">${order.status === 'pending' ? 'Pendiente' : order.status || 'N/A'}</span></p>
              </div>

              <h3>📋 Tus productos en este pedido</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsToRender.map(item => `
                    <tr>
                      <td>${item.products?.name || item.product_name || item.name || 'Producto'}</td>
                      <td>${item.quantity || 1}</td>
                      <td style="text-align: right;">$${((item.subtotal || item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total">
                <p style="font-size: 20px;">Total por tus productos: $${sellerTotal.toFixed(2)}</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendedor/pedidos" class="button">Ver pedido en el panel</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Apex Commerce. Todos los derechos reservados.</p>
              <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `

      return await this.sendEmail({
        to: seller.email,
        subject: `📦 Nuevo pedido #${order.order_number || order.id || 'N/A'}`,
        html
      })
    } catch (error) {
      console.error('❌ Error al enviar email al vendedor:', error)
      return { success: false, error: error.message }
    }
  },

  // Enviar notificación de nuevo pedido al cliente
  async sendNewOrderToClient(order) {
    try {
      const items = order.order_items || order.items || []
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #010f20; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .header span { color: #e0a96d; }
            .header p { color: #ffffff; opacity: 0.8; margin: 5px 0 0; }
            .content { padding: 30px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .order-info p { margin: 5px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #010f20; color: white; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #010f20; text-align: right; padding-top: 20px; border-top: 2px solid #eee; }
            .button { display: inline-block; background: #e0a96d; color: #010f20; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .badge { display: inline-block; background: #e0a96d; color: #010f20; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Apex <span>Commerce</span></h1>
              <p>Pedido confirmado</p>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2 style="text-align: center;">¡Gracias por tu compra!</h2>
              <p style="text-align: center;">Tu pedido ha sido confirmado y está siendo procesado.</p>

              <div class="order-info">
                <p><strong>Pedido:</strong> #${order.order_number || order.id || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString('es-MX') : 'N/A'}</p>
                <p><strong>Estado:</strong> <span class="badge">${order.status === 'pending' ? 'Pendiente de procesamiento' : order.status || 'N/A'}</span></p>
              </div>

              <h3>📋 Resumen de tu pedido</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.products?.name || item.product_name || item.name || 'Producto'}</td>
                      <td>${item.quantity || 1}</td>
                      <td style="text-align: right;">$${((item.subtotal || item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total">
                <p>Subtotal: $${(order.subtotal || 0).toFixed(2)}</p>
                <p>Envío: $${(order.shipping_cost || 0).toFixed(2)}</p>
                <p>IVA (16%): $${(order.tax || 0).toFixed(2)}</p>
                <p style="font-size: 22px;">Total: $${(order.total || 0).toFixed(2)}</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cliente/pedidos" class="button">Ver mis pedidos</a>
              </div>

              <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                Te notificaremos cuando tu pedido sea enviado. 📦
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Apex Commerce. Todos los derechos reservados.</p>
              <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `

      return await this.sendEmail({
        to: order.customer_email,
        subject: `✅ Pedido #${order.order_number || order.id || 'N/A'} confirmado`,
        html
      })
    } catch (error) {
      console.error('❌ Error al enviar email al cliente:', error)
      return { success: false, error: error.message }
    }
  },

  // Enviar notificación de cambio de estado al cliente
  async sendOrderStatusUpdate(order, status, notes = '') {
    try {
      const statusMessages = {
        processing: '📦 Tu pedido está siendo procesado',
        shipped: '🚚 Tu pedido ha sido enviado',
        delivered: '✅ ¡Tu pedido ha sido entregado!',
        cancelled: '❌ Tu pedido ha sido cancelado'
      }

      const statusEmojis = {
        processing: '📦',
        shipped: '🚚',
        delivered: '✅',
        cancelled: '❌'
      }

      const statusDetails = {
        processing: {
          title: 'Pedido en proceso',
          message: 'Tu pedido está siendo preparado para el envío. Pronto recibirás más notificaciones.'
        },
        shipped: {
          title: 'Pedido enviado',
          message: '¡Tu pedido está en camino! Revisa tu correo para más detalles del seguimiento.'
        },
        delivered: {
          title: 'Pedido entregado',
          message: '¡Tu pedido ha sido entregado exitosamente! Esperamos que disfrutes tu compra.'
        },
        cancelled: {
          title: 'Pedido cancelado',
          message: 'Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.'
        }
      }

      const detail = statusDetails[status] || { 
        title: 'Actualización de pedido', 
        message: 'El estado de tu pedido ha cambiado.' 
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #010f20; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .header span { color: #e0a96d; }
            .header p { color: #ffffff; opacity: 0.8; margin: 5px 0 0; }
            .content { padding: 30px; }
            .status-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .order-info p { margin: 5px 0; }
            .button { display: inline-block; background: #e0a96d; color: #010f20; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .notes { background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e0a96d; }
            .badge { display: inline-block; background: #e0a96d; color: #010f20; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Apex <span>Commerce</span></h1>
              <p>${detail.title}</p>
            </div>
            <div class="content">
              <div class="status-icon">${statusEmojis[status] || '📫'}</div>
              <h2 style="text-align: center;">${statusMessages[status] || 'Actualización de pedido'}</h2>
              <p style="text-align: center; color: #555;">${detail.message}</p>

              ${notes ? `<div class="notes"><strong>📝 Nota:</strong><br>${notes}</div>` : ''}

              <div class="order-info">
                <p><strong>Pedido:</strong> #${order.order_number || order.id || 'N/A'}</p>
                <p><strong>Estado actual:</strong> <span class="badge">${status}</span></p>
                <p><strong>Fecha de actualización:</strong> ${new Date().toLocaleString('es-MX')}</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cliente/pedidos" class="button">Ver estado del pedido</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Apex Commerce. Todos los derechos reservados.</p>
              <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `

      return await this.sendEmail({
        to: order.customer_email,
        subject: `${statusEmojis[status] || '📫'} ${statusMessages[status] || 'Actualización de pedido'}`,
        html
      })
    } catch (error) {
      console.error('❌ Error al enviar email de actualización:', error)
      return { success: false, error: error.message }
    }
  },

// Notificar a todos los vendedores involucrados en un pedido
  async notifySellersAboutNewOrder(order) {
    try {
      const items = order.order_items || order.items || []
      
      if (!items.length) {
        console.warn('⚠️ No hay items en el pedido para notificar vendedores')
        return { success: true, total: 0 }
      }

      // 1. Recopilar IDs de vendedores que necesitemos buscar
      const sellerMap = {}
      const missingSellerIds = []

      for (const item of items) {
        const sellerProfile = item.profiles || item.seller || item.seller_profile || {}
        const sellerId = item.seller_id || sellerProfile.id
        let sellerEmail = (sellerProfile.email || item.seller_email || '').trim().toLowerCase()
        let sellerName = sellerProfile.name || item.seller_name || ''

        if (sellerId) {
          if (sellerEmail && sellerEmail.includes('@') && sellerEmail !== 'vendedor@apex.com') {
            sellerMap[sellerId] = { id: sellerId, email: sellerEmail, name: sellerName || 'Vendedor' }
          } else {
            missingSellerIds.push(sellerId)
          }
        }
      }

      // 2. RESCATE DIRECTO: Si falta el email de algún vendedor, consultarlo directamente a Supabase
      if (missingSellerIds.length > 0) {
        const uniqueIds = [...new Set(missingSellerIds)]

        // Importación dinámica para evitar ciclos
        const { supabase } = await import('@/lib/supabase')

        const { data: fetchedProfiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', uniqueIds)

        if (!fetchError && fetchedProfiles) {
          fetchedProfiles.forEach(p => {
            const emailClean = (p.email || '').trim().toLowerCase()
            if (p.id && emailClean && emailClean.includes('@')) {
              sellerMap[p.id] = {
                id: p.id,
                email: emailClean,
                name: p.name || 'Vendedor'
              }
            }
          })
        } else if (fetchError) {
          console.error('❌ Error al consultar profiles en el envío de emails:', fetchError)
        }
      }

      const sellers = Object.values(sellerMap)
      
      if (!sellers.length) {
        console.warn('⚠️ No se encontraron correos de vendedores válidos para notificar en este pedido')
        return { success: true, total: 0 }
      }


      const results = []

      for (const seller of sellers) {
        const result = await this.sendNewOrderToSeller(order, seller)
        results.push({ sellerId: seller.id, ...result })
      }

      const allSuccess = results.every(r => r.success)
      return { 
        success: allSuccess, 
        results,
        total: results.length
      }
    } catch (error) {
      console.error('❌ Error al notificar vendedores:', error)
      return { success: false, error: error.message }
    }
  },

  // Enviar notificación de cambio de estado de item (para vendedor)
  async sendItemStatusUpdate(order, item, status, notes = '') {
    try {
      const statusMessages = {
        processing: '📦 El producto está siendo procesado',
        shipped: '🚚 El producto ha sido enviado',
        delivered: '✅ El producto ha sido entregado',
        cancelled: '❌ El producto ha sido cancelado'
      }

      const statusEmojis = {
        processing: '📦',
        shipped: '🚚',
        delivered: '✅',
        cancelled: '❌'
      }

      const seller = item.profiles || item.seller || { 
        name: 'Vendedor',
        email: item.seller_email
      }

      if (!seller.email || seller.email === 'vendedor@apex.com') {
        console.warn('⚠️ No se envió actualización de item por falta de email de vendedor válido')
        return { success: false, error: 'Email de vendedor no disponible' }
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #010f20; padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .header span { color: #e0a96d; }
            .header p { color: #ffffff; opacity: 0.8; margin: 5px 0 0; }
            .content { padding: 30px; }
            .status-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .item-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item-info p { margin: 5px 0; }
            .button { display: inline-block; background: #e0a96d; color: #010f20; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .notes { background: #f0f0f0; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e0a96d; }
            .badge { display: inline-block; background: #e0a96d; color: #010f20; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Apex <span>Commerce</span></h1>
              <p>Actualización de producto</p>
            </div>
            <div class="content">
              <div class="status-icon">${statusEmojis[status] || '📫'}</div>
              <h2 style="text-align: center;">${statusMessages[status] || 'Actualización de producto'}</h2>

              ${notes ? `<div class="notes"><strong>📝 Nota:</strong><br>${notes}</div>` : ''}

              <div class="item-info">
                <p><strong>Pedido:</strong> #${order.order_number || order.id || 'N/A'}</p>
                <p><strong>Producto:</strong> ${item.products?.name || item.product_name || 'Producto'}</p>
                <p><strong>Cantidad:</strong> ${item.quantity || 1}</p>
                <p><strong>Estado:</strong> <span class="badge">${status}</span></p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendedor/pedidos" class="button">Ver pedido</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Apex Commerce. Todos los derechos reservados.</p>
              <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
        </html>
      `

      return await this.sendEmail({
        to: seller.email,
        subject: `${statusEmojis[status] || '📫'} ${statusMessages[status] || 'Actualización de producto'}`,
        html
      })
    } catch (error) {
      console.error('❌ Error al enviar email de item:', error)
      return { success: false, error: error.message }
    }
  }
}
