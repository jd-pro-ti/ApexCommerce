// src/app/api/gemini/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function callGemini(apiKey, contents, model = 'gemini-flash-latest') {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents }),
    }
  );
  const data = await response.json();
  return { response, data };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { history, userRole } = body;

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ error: 'El historial es requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key' }, { status: 500 });
    }

    // 1. Obtener productos de Supabase (usando 'images' en lugar de 'image_url')
    const { data: productsFromDB, error: dbError } = await supabaseAdmin
      .from('products') 
      .select('id, name, price, stock, images')
      .limit(30);

    if (dbError) {
      console.error('Error Supabase:', dbError.message);
    }

    const catalogSummary = productsFromDB && productsFromDB.length > 0
      ? productsFromDB.map(p => {
          // Extraer la primera imagen ya sea si es array o string
          const imgUrl = Array.isArray(p.images) ? p.images[0] : (p.images || 'sin-imagen');
          return `[ID: ${p.id}] - ${p.name} (Precio: $${p.price}, Stock: ${p.stock}, Imagen: ${imgUrl})`;
        }).join('\n')
      : "No hay productos registrados.";

    let scopeInstruction = "El usuario es un CLIENTE buscando productos.";
    if (userRole === "ADMINISTRADOR") scopeInstruction = "El usuario es un ADMINISTRADOR.";
    if (userRole === "VENDEDOR") scopeInstruction = "El usuario es un VENDEDOR.";

    const systemPromptContent = `Eres Apex-ito, un asistente amigable y divertido de Apex Commerce.
Contexto: ${scopeInstruction}

Catálogo real de Supabase:
${catalogSummary}

Reglas obligatorias:
- Si recomiendas o mencionas un producto de la lista, debes incluir al final de tu respuesta un bloque especial con este formato exacto para que el sistema dibuje la tarjeta:
[PRODUCTO:{ "id": "AQUÍ_EL_ID", "name": "NOMBRE", "price": PRECIO, "image": "URL_IMAGEN" }]
- Puedes incluir varios bloques [PRODUCTO:...] si mencionas varios artículos.
- Siempre responde en español, tono alegre, con pocos emojis 😊🚀.
- NO uses formato Markdown (nada de negritas, cursivas o listas con guiones).
- Frases cortas.`;

    const contents = [
      { parts: [{ text: systemPromptContent }] },
      ...history.map((msg) => ({
        parts: [{ text: msg.content }],
      }))
    ];

    let { response, data } = await callGemini(apiKey, contents, 'gemini-flash-latest');

    if (!response.ok && data.error?.message?.includes('high demand')) {
      const fallback = await callGemini(apiKey, contents, 'gemini-pro');
      response = fallback.response;
      data = fallback.data;
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Error en Gemini' }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}