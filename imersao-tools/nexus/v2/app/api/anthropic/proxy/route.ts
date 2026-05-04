import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Nexus v2 — Anthropic API proxy (Edge runtime)
 *
 * Story 0.5 — encapsula a API key Anthropic server-side.
 * Story 0.6 — auth check via `getSession()` (KV lookup em prod, cookie-presence em dev).
 *
 * Conforme architecture-v2.md §4.1 (Edge runtime para latência baixa) e §9.3 (rate limiting).
 *
 * Aceita POST com body `{ messages, model, stream?, max_tokens?, tools? }`.
 * Quando `stream: true`, devolve SSE `text/event-stream`.
 * Caso contrário, devolve JSON.
 *
 * NFR5: ANTHROPIC_API_KEY NUNCA é incluída no bundle do client.
 * Rate limiting: 60 req/min por IP via Vercel KV (sliding window).
 */

export const runtime = 'edge';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const RATE_LIMIT_PER_MIN = 60;

interface ProxyBody {
  messages: Array<{ role: 'user' | 'assistant'; content: unknown }>;
  model: string;
  stream?: boolean;
  max_tokens?: number;
  tools?: unknown[];
  system?: string | unknown[];
}

/**
 * Rate limiting via Vercel KV (sliding window por IP).
 * Em ausência de KV (dev local), passa sem rate limit.
 *
 * Retorna `null` se OK ou `Response` 429 se excedeu.
 */
async function checkRateLimit(ip: string): Promise<Response | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    // Dev local sem KV — sem rate limit
    return null;
  }

  const minuteKey = `nexus:ratelimit:anthropic:${ip}:${Math.floor(Date.now() / 60_000)}`;

  try {
    // INCR atómico
    const incrRes = await fetch(`${kvUrl}/incr/${encodeURIComponent(minuteKey)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!incrRes.ok) return null; // KV indisponível, não bloqueia

    const incrJson = (await incrRes.json()) as { result: number };
    const count = incrJson.result;

    // Define EXPIRE 60s na primeira request da janela
    if (count === 1) {
      await fetch(`${kvUrl}/expire/${encodeURIComponent(minuteKey)}/60`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
    }

    if (count > RATE_LIMIT_PER_MIN) {
      return new Response(
        JSON.stringify({ error: 'Rate limit excedido. Tenta de novo em 60s.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        },
      );
    }
    return null;
  } catch {
    // KV falha — não bloqueia (fail-open)
    return null;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Auth check via getSession (Story 0.6 — KV lookup em prod, cookie-presence em dev)
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // 2. Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitResp = await checkRateLimit(ip);
  if (rateLimitResp) return rateLimitResp;

  // 3. API key — server-only
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key não configurada.' },
      { status: 500 },
    );
  }

  // 4. Parse body
  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return NextResponse.json(
      { error: 'Body inválido — esperado JSON.' },
      { status: 400 },
    );
  }

  if (!body.messages || !Array.isArray(body.messages) || !body.model) {
    return NextResponse.json(
      { error: 'Body deve conter `messages` (array) e `model` (string).' },
      { status: 400 },
    );
  }

  // 5. Forward para Anthropic
  const upstreamHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
    'x-api-key': apiKey,
  };

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Falha ao contactar Anthropic.',
        details: err instanceof Error ? err.message : 'unknown',
      },
      { status: 502 },
    );
  }

  // 6. Streaming SSE
  if (body.stream && upstreamResp.body) {
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // 7. Non-streaming — devolve JSON da Anthropic tal-qual
  const upstreamText = await upstreamResp.text();
  return new Response(upstreamText, {
    status: upstreamResp.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    { error: 'Apenas POST suportado.' },
    { status: 405 },
  );
}
