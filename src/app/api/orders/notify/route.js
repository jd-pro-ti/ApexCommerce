import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const statusLabels = {
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const emailLayout = (subtitle, content, path) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
        .header { background: #010f20; padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .header span { color: #e0a96d; }
        .header p { color: #fff; opacity: .8; margin: 5px 0 0; }
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
        <div class="header"><h1>Apex <span>Commerce</span></h1><p>${subtitle}</p></div>
        ${content}
        <div class="footer">
          <p>© ${new Date().getFullYear()} Apex Commerce. Todos los derechos reservados.</p>
          <p>Este es un mensaje automático, por favor no responder a este correo.</p>
        </div>
      </div>
    </body>
  </html>`

const itemRows = items => items.map(item => `
  <tr>
    <td>${escapeHtml(item.product_name || item.products?.name || 'Producto')}</td>
    <td>${item.quantity || 1}</td>
    <td style="text-align:right;">$${Number(item.subtotal ?? item.product_price ?? 0).toFixed(2)}</td>
  </tr>`).join('')

const orderDetails = (order, includeCustomer = false) => `
  <div class="order-info">
    <p><strong>Pedido:</strong> #${escapeHtml(order.order_number || order.id)}</p>
    ${includeCustomer ? `<p><strong>Cliente:</strong> ${escapeHtml(order.customer_name || 'N/A')}</p><p><strong>Email:</strong> ${escapeHtml(order.customer_email || 'N/A')}</p><p><strong>Teléfono:</strong> ${escapeHtml(order.customer_phone || 'No especificado')}</p>` : ''}
    <p><strong>Fecha:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString('es-MX') : 'N/A'}</p>
    <p><strong>Estado:</strong> <span class="badge">${order.status === 'pending' ? 'Pendiente de procesamiento' : escapeHtml(order.status || 'N/A')}</span></p>
  </div>`

const cancellationEmail = (order, items, audience) => {
  const isSeller = audience === 'seller'
  const title = isSeller ? 'Pedido cancelado' : 'Tu pedido fue cancelado'
  const message = isSeller
    ? 'El siguiente pedido fue cancelado. Revisa los productos involucrados y actualiza tu panel.'
    : 'Tu pedido ha sido cancelado correctamente. Si tienes preguntas, contáctanos.'
  const buttonPath = isSeller ? '/dashboard/vendedor/pedidos' : '/dashboard/cliente/pedidos'
  const total = items.reduce((sum, item) => sum + Number(item.subtotal ?? item.product_price ?? 0), 0)

  return emailLayout(title, `<div class="content"><div class="success-icon">❌</div><h2 style="text-align:center;">${title}</h2><p style="text-align:center;">${message}</p>${orderDetails(order, isSeller)}<h3>📋 Productos del pedido</h3><table class="items-table"><thead><tr><th>Producto</th><th>Cantidad</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>${itemRows(items)}</tbody></table><div class="total"><p style="font-size:20px;">Total cancelado: $${total.toFixed(2)}</p></div><div style="text-align:center;margin-top:30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}${buttonPath}" class="button">${isSeller ? 'Ver pedidos en el panel' : 'Ver mis pedidos'}</a></div></div>`)
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('SMTP no configurado')
  }

  return transporter.sendMail({
    from: `"Apex Commerce" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  })
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ sent: false, error: 'No autorizado' }, { status: 401 })

    const { event, orderId, itemId, status, notes = '' } = await request.json()
    if (!orderId || !['created', 'processing', 'shipped', 'delivered', 'cancelled', 'item-status'].includes(event)) {
      return NextResponse.json({ sent: false, error: 'Solicitud inválida' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ sent: false, error: 'No autorizado' }, { status: 401 })

    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, user_id, customer_name, customer_email, customer_phone, created_at, status, subtotal, shipping_cost, tax, total, order_items(id, seller_id, product_name, product_price, quantity, subtotal, status, products(name))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return NextResponse.json({ sent: false, error: 'Pedido no encontrado' }, { status: 404 })
    const { data: requester } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (event === 'created' && order.user_id !== user.id) {
      return NextResponse.json({ sent: false, error: 'No autorizado' }, { status: 403 })
    }
    if (event !== 'created' && event !== 'item-status' && order.user_id !== user.id && requester?.role !== 'admin' && requester?.role !== 'vendedor') {
      return NextResponse.json({ sent: false, error: 'No autorizado' }, { status: 403 })
    }

    const item = itemId ? order.order_items?.find(entry => entry.id === itemId) : null
    if (event === 'item-status' && (!item || item.seller_id !== user.id || !statusLabels[status])) {
      return NextResponse.json({ sent: false, error: 'No autorizado' }, { status: 403 })
    }

    if (event === 'created') {
      const items = order.order_items || []
      await sendEmail({
        to: order.customer_email,
        subject: `Confirmación de pedido ${order.order_number || order.id}`,
        html: emailLayout('Pedido confirmado', `<div class="content"><div class="success-icon">✅</div><h2 style="text-align:center;">¡Gracias por tu compra!</h2><p style="text-align:center;">Tu pedido ha sido confirmado y está siendo procesado.</p>${orderDetails(order)}<h3>📋 Resumen de tu pedido</h3><table class="items-table"><thead><tr><th>Producto</th><th>Cantidad</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>${itemRows(items)}</tbody></table><div class="total"><p>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</p><p>Envío: $${Number(order.shipping_cost || 0).toFixed(2)}</p><p>IVA (16%): $${Number(order.tax || 0).toFixed(2)}</p><p style="font-size:22px;">Total: $${Number(order.total || 0).toFixed(2)}</p></div><div style="text-align:center;margin-top:30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cliente/pedidos" class="button">Ver mis pedidos</a></div><p style="text-align:center;margin-top:20px;font-size:14px;color:#666;">Te notificaremos cuando tu pedido sea enviado. 📦</p></div>`)
      })

      const sellerIds = [...new Set(items.map(entry => entry.seller_id).filter(Boolean))]
      const { data: sellers, error: sellersError } = await admin
        .from('profiles')
        .select('id, name, email')
        .in('id', sellerIds)

      if (sellersError) throw sellersError

      await Promise.all((sellers || []).filter(seller => seller.email).map(seller => {
        const sellerItems = items.filter(entry => entry.seller_id === seller.id)
        const sellerTotal = sellerItems.reduce((sum, entry) => sum + Number(entry.subtotal ?? entry.product_price ?? 0), 0)
        return sendEmail({
          to: seller.email,
          subject: `Nuevo pedido ${order.order_number || order.id}`,
          html: emailLayout('Nuevo pedido recibido', `<div class="content"><h2>¡Hola ${escapeHtml(seller.name || 'Vendedor')}, tienes un nuevo pedido! 🎉</h2>${orderDetails(order, true)}<h3>📋 Tus productos en este pedido</h3><table class="items-table"><thead><tr><th>Producto</th><th>Cantidad</th><th style="text-align:right;">Subtotal</th></tr></thead><tbody>${itemRows(sellerItems)}</tbody></table><div class="total"><p style="font-size:20px;">Total por tus productos: $${sellerTotal.toFixed(2)}</p></div><div style="text-align:center;margin-top:30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/vendedor/pedidos" class="button">Ver pedido en el panel</a></div></div>`)
        })
      }))
    } else if (event === 'item-status') {
      if (status === 'cancelled') {
        const { data: seller } = await admin.from('profiles').select('name, email').eq('id', item.seller_id).maybeSingle()
        await Promise.all([
          sendEmail({ to: order.customer_email, subject: `Pedido cancelado ${order.order_number || order.id}`, html: cancellationEmail(order, [item], 'client') }),
          ...(seller?.email ? [sendEmail({ to: seller.email, subject: `Pedido cancelado ${order.order_number || order.id}`, html: cancellationEmail(order, [item], 'seller') })] : [])
        ])
        return NextResponse.json({ sent: true })
      }

      await sendEmail({
        to: order.customer_email,
        subject: `Actualización de pedido ${order.order_number || order.id}`,
        html: emailLayout('Actualización de producto', `<div class="content"><div class="success-icon">${status === 'delivered' ? '✅' : '📦'}</div><h2 style="text-align:center;">${statusLabels[status]}</h2>${orderDetails(order)}<div class="order-info"><p><strong>Producto:</strong> ${escapeHtml(item.product_name || item.products?.name || 'Producto')}</p><p><strong>Cantidad:</strong> ${item.quantity || 1}</p><p><strong>Estado:</strong> <span class="badge">${statusLabels[status]}</span></p></div>${notes ? `<p><strong>Nota:</strong> ${escapeHtml(notes)}</p>` : ''}<div style="text-align:center;margin-top:30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cliente/pedidos" class="button">Ver estado del pedido</a></div></div>`)
      })
    } else {
      if (event === 'cancelled') {
        const items = order.order_items || []
        const sellerIds = [...new Set(items.map(entry => entry.seller_id).filter(Boolean))]
        const { data: sellers, error: sellersError } = await admin.from('profiles').select('id, name, email').in('id', sellerIds)
        if (sellersError) throw sellersError

        await Promise.all([
          sendEmail({ to: order.customer_email, subject: `Pedido cancelado ${order.order_number || order.id}`, html: cancellationEmail(order, items, 'client') }),
          ...(sellers || []).filter(seller => seller.email).map(seller => sendEmail({
            to: seller.email,
            subject: `Pedido cancelado ${order.order_number || order.id}`,
            html: cancellationEmail(order, items.filter(item => item.seller_id === seller.id), 'seller')
          }))
        ])
        return NextResponse.json({ sent: true })
      }

      await sendEmail({
        to: order.customer_email,
        subject: `Actualización de pedido ${order.order_number || order.id}`,
        html: emailLayout('Actualización de pedido', `<div class="content"><div class="success-icon">${event === 'delivered' ? '✅' : event === 'cancelled' ? '❌' : '📦'}</div><h2 style="text-align:center;">${statusLabels[event]}</h2><p style="text-align:center;">El estado de tu pedido ha cambiado.</p>${orderDetails(order)}${notes ? `<p><strong>Nota:</strong> ${escapeHtml(notes)}</p>` : ''}<div style="text-align:center;margin-top:30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cliente/pedidos" class="button">Ver estado del pedido</a></div></div>`)
      })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('Error al notificar pedido:', error)
    return NextResponse.json({ sent: false, error: error.message }, { status: 500 })
  }
}
