// src/app/api/gemini/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

async function callGemini(apiKey, contents, model = PRIMARY_MODEL) {
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

function shouldUseFallback(response, data) {
  const errorMessage = data.error?.message?.toLowerCase() || '';
  return response.status === 429 || [
    'high demand',
    'quota',
    'rate limit',
    'resource_exhausted',
    'exceeded your current quota',
  ].some((phrase) => errorMessage.includes(phrase));
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
      // Gemini solo puede recomendar productos que recibe en este contexto.
      // El límite anterior de 30 ocultaba productos como celulares o escritorios.
      .limit(1000);

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
- En recomendaciones abiertas, busquedas por categoria, comparaciones o sugerencias de regalo, recomienda hasta 3 productos relevantes del catalogo real y agrega un bloque [PRODUCTO:...] por cada uno.
- Si el usuario pide un producto especifico, agrega solo un bloque [PRODUCTO:...].
- Nunca inventes ni repitas productos; usa unicamente productos del catalogo real.
- Busca coincidencias por nombre y categoria dentro de todo el catalogo antes de responder.
- Si existen productos que coinciden con lo que pide el usuario, incluyelos en las recomendaciones.
- Si recomiendas o mencionas un producto de la lista, debes incluir al final de tu respuesta un bloque especial con este formato exacto para que el sistema dibuje la tarjeta:
[PRODUCTO:{ "id": "AQUÍ_EL_ID", "name": "NOMBRE", "price": PRECIO, "image": "URL_IMAGEN" }]
- Puedes incluir varios bloques [PRODUCTO:...] si mencionas varios artículos.
- Siempre responde en español, tono alegre, con pocos emojis 😊🚀.
- NO uses formato Markdown (nada de negritas, cursivas o listas con guiones).
- Frases cortas.`;

    const contents = [
      { parts: [{ text: systemPromptContent }] },
      ...history.map((msg) => ({
        parts: [
          ...(msg.content ? [{ text: msg.content }] : []),
          ...(msg.image?.data && msg.image?.mimeType ? [{
            inlineData: {
              mimeType: msg.image.mimeType,
              data: msg.image.data,
            },
          }] : []),
        ],
      }))
    ];

    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    let response;
    let data;
    let modelUsed = PRIMARY_MODEL;

    for (let index = 0; index < modelsToTry.length; index += 1) {
      modelUsed = modelsToTry[index];
      ({ response, data } = await callGemini(apiKey, contents, modelUsed));

      if (response.ok || !shouldUseFallback(response, data) || index === modelsToTry.length - 1) {
        break;
      }

      console.warn('[Gemini] Cuota o límite alcanzado; cambiando de modelo', {
        exhaustedModel: modelUsed,
        nextModel: modelsToTry[index + 1],
        status: response.status,
        error: data.error?.message,
      });
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Error en Gemini' }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';
    console.log('[Gemini] Consumo de tokens', {
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
