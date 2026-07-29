import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const statusLabels = { processing: 'En proceso', shipped: 'Enviado' };

function emailShell(title, body) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111827"><h1>${title}</h1>${body}<p style="color:#6b7280">Apex Commerce</p></div>`;
}

async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.ORDER_EMAIL_FROM, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error('El proveedor de correo rechazó el envío');
}

export async function POST(request) {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.ORDER_EMAIL_FROM || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ sent: false, reason: 'Email no configurado' }, { status: 202 });
    }

    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { event, orderId, itemId, status } = await request.json();
    if (!['created', 'item-status'].includes(event) || !orderId) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });

    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: order, error } = await admin.from('orders').select(`
      id, order_number, user_id, customer_name, customer_email, total,
      order_items (id, seller_id, product_name, product_price, quantity, subtotal, status, profiles:seller_id(name, email))
    `).eq('id', orderId).single();
    if (error || !order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

    if (event === 'created' && order.user_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const item = itemId ? order.order_items.find(entry => entry.id === itemId) : null;
    if (event === 'item-status' && (!item || item.seller_id !== user.id || !statusLabels[status])) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    if (event === 'created') {
      const lines = order.order_items.map(item => `<li>${item.product_name} × ${item.quantity}</li>`).join('');
      await sendEmail({ to: order.customer_email, subject: `Confirmación de pedido ${order.order_number}`, html: emailShell('¡Recibimos tu pedido!', `<p>Hola ${order.customer_name}, tu pedido <b>${order.order_number}</b> fue creado.</p><ul>${lines}</ul><p>Total: <b>$${Number(order.total).toFixed(2)}</b></p>`) });
      const sellerGroups = new Map();
      order.order_items.forEach(entry => {
        if (entry.profiles?.email) sellerGroups.set(entry.seller_id, [...(sellerGroups.get(entry.seller_id) || []), entry]);
      });
      await Promise.all([...sellerGroups.values()].map(items => sendEmail({ to: items[0].profiles.email, subject: `Nuevo pedido ${order.order_number}`, html: emailShell('Tienes un nuevo pedido', `<p>Productos solicitados:</p><ul>${items.map(entry => `<li>${entry.product_name} × ${entry.quantity}</li>`).join('')}</ul>`) })));
    } else {
      await sendEmail({ to: order.customer_email, subject: `Actualización de pedido ${order.order_number}`, html: emailShell('Actualización de tu pedido', `<p>Tu producto <b>${item.product_name}</b> ahora está: <b>${statusLabels[status]}</b>.</p>`) });
    }
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Error al notificar pedido:', error);
    return NextResponse.json({ sent: false }, { status: 202 });
  }
}
