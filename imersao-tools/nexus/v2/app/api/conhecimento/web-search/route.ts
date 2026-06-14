import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import { parseDdgHtml, type WebSearchResult } from '@/lib/shared/web-search-ddg';
import { parseAnthropicWebSearch } from '@/lib/shared/web-search-anthropic';

/**
 * Nexus v2 — Pesquisa web (Story 5.11 — FR55, AC2)
 *
 * Endpoint server-side que orquestra a cascata de pesquisa web. Node runtime
 * (`[D-5.11-RUNTIME]`): o path DuckDuckGo faz fetch + parsing de HTML grande
 * (~50-200KB) — padrão Node (ADR-1), não Edge. O path Anthropic reutiliza o proxy
 * Edge existente (`/api/anthropic/proxy`) via fetch interno same-origin,
 * propagando o cookie de sessão (senão o proxy devolve 401 — precedente
 * `app/api/push/subscribe`).
 *
 * Cascata (`[D-5.11-FALLBACK]`) — a falha NUNCA silencia (lição 4.9 M4):
 *   1. Anthropic web search (melhor qualidade + citações).
 *      - O gatilho de fallback inspecciona o BODY, não `response.ok`: os erros da
 *        web search vêm como HTTP 200 com `web_search_tool_result_error`.
 *      - Falha de rede / timeout / proxy 4xx-5xx / erro-no-body / zero resultados
 *        → tenta DDG.
 *   2. DuckDuckGo HTML scraping (gratuito).
 *      - Timeout / HTML inesperado (`parseDdgHtml` → `[]`) → 503 PT-PT.
 *   3. Ambos falham → 503 PT-PT.
 *
 * Sucesso → 200 `{ results, source: 'anthropic' | 'duckduckgo' }`.
 *
 * Sem cache (`[D-5.11-NO-CACHE]`). Pesquisa é acção explícita do utilizador.
 */

export const runtime = 'nodejs';

const ANTHROPIC_TIMEOUT_MS = 30_000;
const DDG_TIMEOUT_MS = 10_000;
const MAX_QUERY_LENGTH = 500;
const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';
const DDG_USER_AGENT = 'Mozilla/5.0 (compatible; NexusBot/1.0)';

interface WebSearchRequestBody {
  query?: unknown;
}

interface WebSearchSuccessBody {
  results: WebSearchResult[];
  source: 'anthropic' | 'duckduckgo';
}

const SERVICE_UNAVAILABLE_MESSAGE =
  'Não foi possível pesquisar agora. Tenta de novo mais tarde.';

/**
 * Tenta a pesquisa via Anthropic web search através do proxy Edge. Devolve os
 * resultados em caso de sucesso, ou `null` para sinalizar que se deve cair no
 * fallback DDG (qualquer falha: rede, timeout, proxy não-200, erro-no-body,
 * zero resultados). NUNCA lança — converte todos os caminhos de falha em `null`.
 */
async function tryAnthropic(
  query: string,
  proxyUrl: string,
  cookie: string | null,
): Promise<WebSearchResult[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Propaga o cookie de sessão no fetch interno Node→Edge (`[D-5.11-RUNTIME]`):
    // sem ele o proxy devolve 401 e a cascata partiria silenciosamente.
    if (cookie) headers.Cookie = cookie;

    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_EXECUTOR_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Pesquisa na web e resume os melhores resultados para: ${query}`,
          },
        ],
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      }),
    });

    // (1) Proxy não-200 (rede/auth/rate-limit) → fallback DDG.
    if (!resp.ok) return null;

    let body: unknown;
    try {
      body = await resp.json();
    } catch {
      return null;
    }

    // (2)+(3) Erro-no-body (HTTP 200 + web_search_tool_result_error) OU zero
    // resultados → fallback DDG. O parser distingue mas ambos caem para DDG.
    const outcome = parseAnthropicWebSearch(body);
    if (outcome.kind === 'error') return null;

    return outcome.results;
  } catch {
    // Timeout (abort) ou falha de rede.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tenta a pesquisa via DuckDuckGo HTML scraping. Devolve os resultados, ou `null`
 * (timeout, rede, HTML inesperado → `parseDdgHtml` devolve `[]`). NUNCA lança.
 */
async function tryDuckDuckGo(query: string): Promise<WebSearchResult[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DDG_TIMEOUT_MS);

  try {
    const url = `${DDG_HTML_URL}?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': DDG_USER_AGENT },
      signal: controller.signal,
    });

    if (!resp.ok) return null;

    const html = await resp.text();
    const results = parseDdgHtml(html);
    // HTML inesperado / CAPTCHA / layout alterado → `[]` → tratado como falha.
    return results.length > 0 ? results : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Auth (padrão do proxy/subscribe).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // 2. Parse + validação do body.
  let body: WebSearchRequestBody;
  try {
    body = (await req.json()) as WebSearchRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Body inválido — esperado JSON.' },
      { status: 400 },
    );
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query === '') {
    return NextResponse.json(
      { error: 'Indica um termo de pesquisa.' },
      { status: 400 },
    );
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Pesquisa demasiado longa (máximo ${MAX_QUERY_LENGTH} caracteres).` },
      { status: 400 },
    );
  }

  // 3. Cascata Anthropic → DDG → 503.
  const proxyUrl = new URL('/api/anthropic/proxy', req.nextUrl.origin).toString();
  const cookie = req.headers.get('cookie');

  const anthropicResults = await tryAnthropic(query, proxyUrl, cookie);
  if (anthropicResults) {
    const success: WebSearchSuccessBody = {
      results: anthropicResults,
      source: 'anthropic',
    };
    return NextResponse.json(success, { status: 200 });
  }

  const ddgResults = await tryDuckDuckGo(query);
  if (ddgResults) {
    const success: WebSearchSuccessBody = {
      results: ddgResults,
      source: 'duckduckgo',
    };
    return NextResponse.json(success, { status: 200 });
  }

  // 4. Ambos falharam — 503 PT-PT explícito (NUNCA silencioso).
  return NextResponse.json(
    { error: SERVICE_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: 'Apenas POST suportado.' }, { status: 405 });
}
