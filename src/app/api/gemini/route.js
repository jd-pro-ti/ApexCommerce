// src/app/api/gemini/route.js
import { NextResponse } from 'next/server';

// Función para llamar a Gemini con un modelo específico
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
    console.log('Body recibido:', JSON.stringify(body, null, 2));

    const { history } = body;
    if (!history || !Array.isArray(history)) {
      return NextResponse.json(
        { error: 'El historial es requerido y debe ser un array' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Falta GEMINI_API_KEY en el entorno');
      return NextResponse.json(
        { error: 'Falta la clave de API de Gemini' },
        { status: 500 }
      );
    }

    // Construir contents (sin role)
    const contents = history.map((msg) => ({
      parts: [{ text: msg.content }],
    }));

    console.log('Enviando a Gemini:', JSON.stringify({ contents }, null, 2));

    // Intentar primero con gemini-flash-latest
    let { response, data } = await callGemini(apiKey, contents, 'gemini-flash-latest');

    // Si falla por alta demanda, intentar con gemini-pro
    if (!response.ok && data.error?.message?.includes('high demand')) {
      console.log('⚠️ gemini-flash-latest con alta demanda, probando con gemini-pro...');
      const fallback = await callGemini(apiKey, contents, 'gemini-pro');
      response = fallback.response;
      data = fallback.data;
    }

    console.log('Respuesta Gemini:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      // Si ambos modelos fallan, devolver un mensaje amigable
      const errorMsg = data.error?.message || 'Error en Gemini';
      if (errorMsg.includes('high demand')) {
        return NextResponse.json(
          { error: '😅 El asistente está muy ocupado ahora mismo. ¡Inténtalo de nuevo en unos segundos!' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar respuesta.';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error en route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + error.message },
      { status: 500 }
    );
  }
}