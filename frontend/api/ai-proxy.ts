/**
 * ai-proxy.ts — Vercel/Edge function
 * ───────────────────────────────────
 * Repassa requisições de IA diretamente ao backend Fastify (Gemini 1.5).
 * NÃO use mais o Mistral aqui. A chave de IA fica 100% no backend.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:3001';
  const authHeader = req.headers['authorization'] ?? '';

  try {
    const upstream = await fetch(`${backendUrl}/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: String(authHeader),
      },
      body: JSON.stringify(req.body),
    });

    const data: unknown = await upstream.json();

    return res.status(upstream.status).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(502).json({
      error: 'Gateway error — backend indisponível',
      detail: message,
    });
  }
}
