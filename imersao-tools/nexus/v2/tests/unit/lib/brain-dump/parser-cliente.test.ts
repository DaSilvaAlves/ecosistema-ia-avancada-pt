import { describe, it, expect, vi } from 'vitest';
import { parseBrainDump } from '@/lib/brain-dump/parser-cliente';

/**
 * Nexus v2 — parser-cliente unit tests (Story 5.7 — AC2/AC4/AC7)
 *
 * `mock-protocol-fidelity.md` (CRÍTICO, `[D-5.7-MECHANISM]` Opção A): a 5.7 NÃO
 * cria endpoint interno — a fronteira de mock é a chamada do helper ao
 * `/api/anthropic/proxy`, que faz pass-through da resposta JSON da Anthropic
 * Messages API. O mock reproduz o **wire shape REAL**:
 *   { content: [{ type: 'text', text: '<JSON dos 4 buckets, possivelmente fenced>' }] }
 *
 * Teste de fidelidade (≥1, AC7): se a resposta renomear um bucket
 * (`tarefas` → `tasks`) ou omitir o bloco `content[].text`, o helper LANÇA — NÃO
 * devolve preview vazio silencioso. Estes testes FALHAM se o Zod `.strict()` ou a
 * verificação do bloco text forem removidos.
 *
 * `fetchFn` + `idFn` injectáveis: o teste é determinístico, não depende do proxy
 * real, do `fetch` global nem de `crypto.randomUUID`.
 */

/** Constrói uma resposta wire do proxy (Anthropic Messages API non-stream). */
function proxyResponse(text: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      id: 'msg_brain_dump_mock',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-mock',
      content: [{ type: 'text', text }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 120, output_tokens: 80 },
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

/** `idFn` determinístico para asserções estáveis sobre os ids enriquecidos. */
function seqIds(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

const FULL_WIRE = JSON.stringify({
  tarefas: ['ligar ao contabilista', 'comprar tinta'],
  projectos: ['renovar o escritório'],
  ideias: ['app de receitas'],
  decisoes: ['mudar de banco?'],
});

describe('parseBrainDump (AC2) — caminho feliz', () => {
  it('parseia os 4 buckets do content[].text e devolve o domínio enriquecido', async () => {
    const { fetchFn } = mockFetch(proxyResponse(FULL_WIRE));
    const result = await parseBrainDump('texto livre longo do brain dump', {
      fetchFn,
      idFn: seqIds(),
    });

    expect(result).toEqual({
      tarefas: [
        { id: 'id-1', texto: 'ligar ao contabilista' },
        { id: 'id-2', texto: 'comprar tinta' },
      ],
      projectos: [{ id: 'id-3', texto: 'renovar o escritório' }],
      ideias: [{ id: 'id-4', texto: 'app de receitas' }],
      decisoes: [{ id: 'id-5', texto: 'mudar de banco?' }],
    });
  });

  it('aceita resposta com buckets vazios (a AI omite o que o texto não suporta)', async () => {
    const { fetchFn } = mockFetch(
      proxyResponse(
        JSON.stringify({ tarefas: ['só uma tarefa'], projectos: [], ideias: [], decisoes: [] }),
      ),
    );
    const result = await parseBrainDump('texto', { fetchFn, idFn: seqIds() });
    expect(result).toEqual({
      tarefas: [{ id: 'id-1', texto: 'só uma tarefa' }],
      projectos: [],
      ideias: [],
      decisoes: [],
    });
  });

  it('faz POST síncrono (sem stream) com system + user + max_tokens 2048 + temperature 0', async () => {
    const { fetchFn, getRequestBody } = mockFetch(
      proxyResponse(JSON.stringify({ tarefas: [], projectos: [], ideias: [], decisoes: [] })),
    );
    await parseBrainDump('o meu despejo', { fetchFn });
    const body = getRequestBody();
    expect(body?.stream).toBeUndefined();
    expect(typeof body?.system).toBe('string');
    expect(body?.max_tokens).toBe(2048);
    expect(body?.temperature).toBe(0);
    expect(body?.messages).toEqual([{ role: 'user', content: 'o meu despejo' }]);
  });

  it('strip de markdown fences: o Sonnet pode envolver o JSON em ```json … ```', async () => {
    const fenced = '```json\n' + FULL_WIRE + '\n```';
    const { fetchFn } = mockFetch(proxyResponse(fenced));
    const result = await parseBrainDump('texto', { fetchFn, idFn: seqIds() });
    expect(result.tarefas).toHaveLength(2);
    expect(result.projectos[0]?.texto).toBe('renovar o escritório');
  });
});

describe('parseBrainDump — fidelidade de protocolo (AC7, mock-protocol-fidelity.md)', () => {
  it('LANÇA se a resposta renomear um bucket (tarefas → tasks)', async () => {
    // O mock reflecte o wire real, mas com o bucket renomeado. O Zod `.strict()`
    // rejeita → o helper lança. Sem `.strict()` isto passaria e devolveria preview
    // vazio — exactamente o bug que AC7 proíbe.
    const { fetchFn } = mockFetch(
      proxyResponse(JSON.stringify({ tasks: ['x'], projectos: [], ideias: [], decisoes: [] })),
    );
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /formato inesperado/,
    );
  });

  it('LANÇA se a resposta acrescentar um bucket extra (.strict())', async () => {
    const { fetchFn } = mockFetch(
      proxyResponse(
        JSON.stringify({
          tarefas: [],
          projectos: [],
          ideias: [],
          decisoes: [],
          lembretes: ['x'],
        }),
      ),
    );
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /formato inesperado/,
    );
  });

  it('LANÇA se o wire omitir o bloco content[].text', async () => {
    const noText = new Response(
      JSON.stringify({ id: 'm', type: 'message', content: [], usage: {} }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const { fetchFn } = mockFetch(noText);
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /não contém texto/,
    );
  });
});

describe('parseBrainDump — caminhos de falha (AC4, internal-state-contract-gate eixo c)', () => {
  it('verifica res.ok ANTES do body — proxy 429 lança PT-PT', async () => {
    const { fetchFn } = mockFetch(
      new Response(JSON.stringify({ error: 'rate limit' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /proxy respondeu 429/,
    );
  });

  it('proxy 500 lança PT-PT', async () => {
    const { fetchFn } = mockFetch(new Response('erro interno', { status: 500 }));
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /proxy respondeu 500/,
    );
  });

  it('lança quando o content[].text não é JSON válido', async () => {
    const { fetchFn } = mockFetch(proxyResponse('isto não é JSON de todo'));
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow(
      /não é JSON válido/,
    );
  });

  it('lança quando o fetch rejeita (rede/timeout indisponível)', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    await expect(parseBrainDump('texto', { fetchFn })).rejects.toThrow();
  });
});
