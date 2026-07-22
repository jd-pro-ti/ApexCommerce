export async function GET() {
  return new Response(JSON.stringify({
    hasKey: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) : null,
  }), { headers: { 'Content-Type': 'application/json' } });
}