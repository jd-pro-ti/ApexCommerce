import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

async function callGemini(apiKey, contents, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({ contents }),
    }
  );
  return { response, data: await response.json() };
}

function shouldUseFallback(response, data) {
  const message = data.error?.message?.toLowerCase() || '';
  return response.status === 429 || [
    'high demand', 'quota', 'rate limit', 'resource_exhausted', 'exceeded your current quota',
  ].some((phrase) => message.includes(phrase));
}

function messageParts(message) {
  return [
    ...(message.content ? [{ text: message.content }] : []),
    ...(message.image?.data && message.image?.mimeType ? [{
      inlineData: { mimeType: message.image.mimeType, data: message.image.data },
    }] : []),
  ];
}

export async function POST(request) {
  try {
    const { history, sellerId } = await request.json();
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: 'El historial es requerido' }, { status: 400 });
    }
    if (!sellerId) {
      return NextResponse.json({ error: 'No se encontró el vendedor autenticado' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Falta la API Key' }, { status: 500 });

    const { data: sellerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, status')
      .eq('id', sellerId)
      .maybeSingle();
    if (!sellerProfile || sellerProfile.role !== 'vendedor' || sellerProfile.status !== 'active') {
      return NextResponse.json({ error: 'El usuario no es un vendedor activo' }, { status: 403 });
    }

    const [{ data: products, error }, { data: sellerProducts, error: sellerProductsError }, { data: orderItems, error: ordersError }, { data: notifications, error: notificationsError }] = await Promise.all([
      supabaseAdmin
      .from('products')
      .select('id, name, price, stock, images')
      .limit(100),
      supabaseAdmin
        .from('products')
        .select('name, price, stock')
        .eq('seller_id', sellerId)
        .limit(100),
      supabaseAdmin
        .from('order_items')
        .select('order_id, product_name, quantity, subtotal, status, created_at, orders(order_number, status)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('notifications')
        .select('title, message, read_at, created_at')
        .eq('user_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (error) console.error('[Seller IA] Error Supabase:', error.message);
    if (sellerProductsError) console.error('[Seller IA] Error productos del vendedor:', sellerProductsError.message);
    if (ordersError) console.error('[Seller IA] Error pedidos del vendedor:', ordersError.message);
    if (notificationsError) console.error('[Seller IA] Error notificaciones:', notificationsError.message);

    const catalog = (products || []).map((product) => {
      const image = Array.isArray(product.images) ? product.images[0] : product.images || 'sin-imagen';
      return `[ID: ${product.id}] - ${product.name} (Precio: $${product.price}, Stock: ${product.stock}, Imagen: ${image})`;
    }).join('\n') || 'No hay productos registrados.';

    const sellerProductSummary = (sellerProducts || []).map((product) =>
      `${product.name} ($${product.price}, stock: ${product.stock})`
    ).join(', ') || 'No hay productos propios registrados.';
    const orderSummary = orderItems || [];
    const pendingStatuses = ['pending', 'processing', 'shipped'];
    const orderStats = {
      total: new Set(orderSummary.map((item) => item.order_id)).size,
      pending: orderSummary.filter((item) => pendingStatuses.includes(item.status)).length,
      delivered: orderSummary.filter((item) => item.status === 'delivered').length,
      cancelled: orderSummary.filter((item) => item.status === 'cancelled').length,
      revenue: orderSummary.reduce((total, item) => total + Number(item.subtotal || 0), 0),
    };
    const orderDetails = orderSummary.slice(0, 10).map((item) =>
      `#${item.orders?.order_number || item.order_id}: ${item.product_name || 'Producto'} x${item.quantity || 1} ($${item.subtotal || 0}), estado ${item.status || item.orders?.status || 'pendiente'}`
    ).join('\n') || 'No hay pedidos registrados.';
    const notificationSummary = (notifications || []).slice(0, 10).map((notification) =>
      `${notification.read_at ? 'leída' : 'NO LEÍDA'}: ${notification.title} - ${notification.message}`
    ).join('\n') || 'No hay notificaciones.';

    const systemPrompt = `Eres Apex-ito Seller IA, un asesor comercial para vendedores de Apex Commerce.
Tu trabajo es ayudar a vender mejor usando exclusivamente el catálogo real.

Catálogo real:
${catalog}

Contexto privado del vendedor:
Productos propios: ${sellerProductSummary}
Resumen de pedidos: ${JSON.stringify(orderStats)}
Últimos pedidos:
${orderDetails}
Notificaciones recientes:
${notificationSummary}

Reglas:
- No uses Markdown, negritas ni asteriscos.
- Segun el tema, agrega al final como maximo un marcador: [ACCION:PEDIDOS], [ACCION:ANALITICAS], [ACCION:NOTIFICACIONES], [ACCION:PRODUCTOS], [ACCION:GANANCIAS] o [ACCION:PERFIL].
- Usa PEDIDOS para pedidos o entregas; ANALITICAS para ventas y rendimiento; NOTIFICACIONES para avisos; PRODUCTOS para inventario; GANANCIAS para pagos; PERFIL para la cuenta.
- Responde de forma clara y breve: máximo 70 palabras.
- Mantén siempre un tono alegre, profesional y usa pocos emojis relevantes.
- Puedes informar sobre pedidos pendientes, ventas, ingresos, productos propios, analíticas y notificaciones usando el contexto privado recibido.
- Si preguntan por un pedido concreto, indica su estado y recomienda revisar la sección Pedidos si necesitan gestionarlo.
- Si preguntan por una notificación, resume su prioridad y recomienda abrir Notificaciones para verla o marcarla como leída.
- No afirmes que cambiaste estados, leíste notificaciones, editaste productos o realizaste acciones; solo puedes informar y recomendar.
- Recomienda hasta 3 productos relevantes cuando el vendedor pida ideas de venta.
- Prioriza productos con stock disponible y menciona si tienen stock bajo.
- Siempre responde en español, tono alegre, con pocos emojis 😊🚀.
- Sugiere una razón de venta, cliente ideal, promoción o venta cruzada.
- También puedes aconsejar sobre títulos, fotos, descripciones, atención, envíos, seguimiento y devoluciones.
- No inventes productos, precios, stock, métricas ni acciones realizadas.
- Puedes generar bloques [PRODUCTO:...] pero no los botones de compra.
- Usa como máximo 3 recomendaciones y 2 consejos prácticos.`;

    const contents = [
      { parts: [{ text: systemPrompt }] },
      ...history.map((message) => ({ parts: messageParts(message) })),
    ];

    const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    let response;
    let data;
    let modelUsed = models[0];

    for (let index = 0; index < models.length; index += 1) {
      modelUsed = models[index];
      ({ response, data } = await callGemini(apiKey, contents, modelUsed));
      if (response.ok || !shouldUseFallback(response, data) || index === models.length - 1) break;
      console.warn('[Seller IA] Cambiando de modelo por cuota o límite', {
        exhaustedModel: modelUsed,
        nextModel: models[index + 1],
        status: response.status,
      });
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Error en Seller IA' }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';
    console.log('[Seller IA] Consumo de tokens', {
      model: modelUsed,
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}
