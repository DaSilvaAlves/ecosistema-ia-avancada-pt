import { describe, it, expect, vi } from 'vitest';
import { estruturarDiario } from '@/lib/diario/estruturar-cliente';

/**
 * Nexus v2 — estruturar-cliente unit tests (Story 5.4 — AC2/AC4/AC5)
 *
 * `mock-protocol-fidelity.md` (CRÍTICO nesta story, `[D-5.4-ENDPOINT]` Opção B):
 *   A 5.4 NÃO cria endpoint interno — a fronteira de mock é a mesma do classifier:
 *   a chamada do helper ao `/api/anthropic/proxy`, que faz pass-through da resposta
 *   JSON da Anthropic Messages API. Logo o mock reproduz o **wire shape REAL**:
 *     { content: [{ type: 'text', text: '<JSON de domínio, possivelmente fenced>' }], ... }
 *   O `text` contém o JSON de domínio `{ whatHappened?, whatLearned?, whatFelt? }`.
 *
 *   Teste de fidelidade (≥1, AC5): se a resposta renomear um campo de domínio
 *   (`whatHappened` → `happened`) ou omitir o bloco `content[].text`, o helper
 *   LANÇA — NÃO devolve preview vazio silencioso. Estes testes FALHAM se o Zod
 *   `.strict()` ou a verificação do bloco text forem removidos.
 *
 * `fetchFn` injectável (padrão `InferenceTransport`, `inference-transport.ts:226`):
 *   o teste é determinístico, não depende do proxy real nem do `fetch` global.
 */

/** Constrói uma resposta wire do proxy (Anthropic Messages API non-stream). */
function proxyResponse(text: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      id: 'msg_diario_mock',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-mock',
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 80, output_tokens: 40 },
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

/** `fetchFn` que devolve uma `Response` fixa e regista o body do request. */
function mockFetch(response: Response): {
  fetchFn: typeof fetch;
  getRequestBody: () => Record<string, unknown> | null;
} {
  let body: Record<string, unknown> | null = null;
  const fetchFn = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : null;
    return response;
  }) as typeof fetch;
  return { fetchFn, getRequestBody: () => body };
}

describe('estruturarDiario (AC2) — caminho feliz', () => {
  it('parseia os 3 buckets do content[].text e devolve o shape de domínio', async () => {
    const domainJson = JSON.stringify({
      whatHappened: 'fui ao mercado e comprei pão',
      whatLearned: 'que comprar a granel poupa',
      whatFelt: 'satisfeito',
    });
    const { fetchFn } = mockFetch(proxyResponse(domainJson));

    const result = await estruturarDiario('texto livre longo da entrada', { fetchFn });

    expect(result).toEqual({
      whatHappened: 'fui ao mercado e comprei pão',
      whatLearned: 'que comprar a granel poupa',
      whatFelt: 'satisfeito',
    });
  });

  it('aceita resposta com apenas 1 bucket (AI omite os que o texto não suporta)', async () => {
    const { fetchFn } = mockFetch(
      proxyResponse(JSON.stringify({ whatHappened: 'relato factual sem emoção' })),
    );
    const result = await estruturarDiario('texto', { fetchFn });
    expect(result).toEqual({ whatHappened: 'relato factual sem emoção' });
  });

  it('faz POST síncrono (sem stream) ao proxy com system + user', async () => {
    const { fetchFn, getRequestBody } = mockFetch(proxyResponse(JSON.stringify({})));
    await estruturarDiario('o meu texto', { fetchFn });
    const body = getRequestBody();
    expect(body?.stream).toBeUndefined();
    expect(typeof body?.system).toBe('string');
    expect(body?.messages).toEqual([{ role: 'user', content: 'o meu texto' }]);
  });

  it('strip de markdown fences: o Sonnet pode envolver o JSON em ```json … ```', async () => {
    const fenced = '```json\n' + JSON.stringify({ whatFelt: 'em paz' }) + '\n```';
    const { fetchFn } = mockFetch(proxyResponse(fenced));
    const result = await estruturarDiario('texto', { fetchFn });
    expect(result).toEqual({ whatFelt: 'em paz' });
  });
});

describe('estruturarDiario — fidelidade de protocolo (AC5, mock-protocol-fidelity.md)', () => {
  it('LANÇA se a resposta renomear um campo de domínio (whatHappened → happened)', async () => {
    // O mock reflecte o wire real, mas com o campo de DOMÍNIO renomeado. O Zod
    // `.strict()` rejeita → o helper lança. Sem `.strict()` isto passaria e
    // devolveria preview vazio — exactamente o bug que AC5 proíbe.
    const { fetchFn } = mockFetch(
      proxyResponse(JSON.stringify({ happened: 'x', learned: 'y', felt: 'z' })),
    );
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /formato inesperado/,
    );
  });

  it('LANÇA se a resposta acrescentar um campo extra (.strict())', async () => {
    const { fetchFn } = mockFetch(
      proxyResponse(JSON.stringify({ whatHappened: 'x', whatPlanned: 'amanhã' })),
    );
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /formato inesperado/,
    );
  });

  it('LANÇA se o wire omitir o bloco content[].text', async () => {
    const noText = new Response(
      JSON.stringify({ id: 'm', type: 'message', content: [], usage: {} }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const { fetchFn } = mockFetch(noText);
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /não contém texto/,
    );
  });
});

describe('estruturarDiario — caminhos de falha (AC4, internal-state-contract-gate eixo c)', () => {
  it('verifica res.ok ANTES do body — proxy 429 lança PT-PT', async () => {
    const { fetchFn } = mockFetch(
      new Response(JSON.stringify({ error: 'rate limit' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /proxy respondeu 429/,
    );
  });

  it('proxy 500 lança PT-PT', async () => {
    const { fetchFn } = mockFetch(new Response('erro interno', { status: 500 }));
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /proxy respondeu 500/,
    );
  });

  it('lança quando o content[].text não é JSON válido', async () => {
    const { fetchFn } = mockFetch(proxyResponse('isto não é JSON de todo'));
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow(
      /não é JSON válido/,
    );
  });

  it('lança quando o fetch rejeita (rede/timeout indisponível)', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    await expect(estruturarDiario('texto', { fetchFn })).rejects.toThrow();
  });
});
