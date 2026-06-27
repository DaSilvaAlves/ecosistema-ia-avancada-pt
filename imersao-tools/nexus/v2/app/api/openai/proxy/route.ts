import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Nexus v2 — OpenAI API proxy (Edge runtime) — Story 8.4 (ADR-10 S4, D-8.4-SIBLING)
 *
 * Sibling independente de `/api/anthropic/proxy` (Abordagem B do ADR-10 §3.3):
 * espelha a estrutura do proxy Anthropic mas com o upstream OpenAI Chat
 * Completions + auth scheme `Authorization: Bearer`. O proxy Anthropic e o
 * `InferenceTransport` ficam **intocados** (AC8 — invariante ADR-10 §6.1).
 *
 * Story 0.5/0.6 (espelho): encapsula a API key server-side + auth via
 * `getSession()` (KV lookup em prod, cookie-presence em dev).
 *
 * Aceita POST com body `{ messages, model, stream?, max_completion_tokens?, tools?,
 * response_format?, stream_options?, temperature? }`.
 * Quando `stream: true`, devolve SSE `text/event-stream`.
 * Caso contrário, devolve JSON.
 *
 * NFR5: OPENAI_API_KEY NUNCA é incluída no bundle do client nem na resposta.
 * SSRF (ADR-10 §7 R5): `OPENAI_URL` é constante hardcoded — o proxy NUNCA deriva
 * o upstream de input do request.
 * Rate limiting: 60 req/min por IP via Vercel KV (sliding window), chave
 * `nexus:ratelimit:openai:*` (DISTINTA da Anthropic — isolamento por provider).
 */

export const runtime = 'edge';

// SSRF (ADR-10 §7 R5): upstream CONSTANTE — jamais derivado do body do request.
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const RATE_LIMIT_PER_MIN = 60;

interface ProxyBody {
  messages: Array<{ role: string; content: unknown }>;
  model: string;
  stream?: boolean;
  max_completion_tokens?: number;
  tools?: unknown[];
  response_format?: unknown;
  stream_options?: unknown;
  temperature?: number;
}

/**
 * Rate limiting via Vercel KV (sliding window por IP).
 * Em ausência de KV (dev local), passa sem rate limit (fail-open).
 *
 * Chave `nexus:ratelimit:openai:*` — distinta da Anthropic
 * (`nexus:ratelimit:anthropic:*`), para que os dois proxies tenham janelas de
 * rate-limit independentes por provider.
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

  const minuteKey = `nexus:ratelimit:openai:${ip}:${Math.floor(Date.now() / 60_000)}`;

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

  // 3. API key — server-only (NFR5: jamais no bundle client, jamais logada)
  const apiKey = process.env.OPENAI_API_KEY;
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

  // 5. Forward para OpenAI — auth scheme `Authorization: Bearer` (NÃO `x-api-key`
  // nem `anthropic-version`; isolamento de auth por provider, ADR-10 §3.3).
  const upstreamHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Falha ao contactar OpenAI.',
        details: err instanceof Error ? err.message : 'unknown',
      },
      { status: 502 },
    );
  }

  // 6. Streaming SSE — pass-through do corpo tal-qual
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

  // 7. Non-streaming — devolve JSON da OpenAI tal-qual
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
