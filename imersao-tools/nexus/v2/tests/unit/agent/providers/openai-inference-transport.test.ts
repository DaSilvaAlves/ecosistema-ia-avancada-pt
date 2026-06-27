import { describe, it, expect } from 'vitest';
import { OpenAIInferenceTransport } from '@/lib/agent/providers/openai-inference-transport';
import type {
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
} from '@/lib/agent/providers/types';
import { z } from 'zod';

/**
 * Nexus v2 — OpenAIInferenceTransport unit tests (Story 8.4 — ADR-10 S4)
 *
 * Exercita o transport client-side OpenAI ISOLADAMENTE, com `fetchFn` injectado
 * que devolve `Response` com o WIRE SSE REAL da OpenAI (`data: {chunk}\n\n` +
 * `[DONE]`) — `mock-protocol-fidelity.md`. Cobre:
 *  - `classify()` — happy path, `!res.ok`, JSON inválido, guards
 *  - `execute()` — text-only, 1 tool single-delta, FALSIFICÁVEL ≥2 deltas (AC9),
 *    multi-tool, args malformados → error, stream abortado → done parcial, !res.ok
 *
 * A `OPENAI_API_KEY` NUNCA é referenciada neste módulo (NFR5/AC5 — o transport
 * fala com `/api/openai/proxy`, que encapsula a key server-side).
 */

const CLASSIFIER_MODEL = 'gpt-4.1-mini-mock';
const EXECUTOR_OPTS = { runId: '11111111-2222-3333-4444-555555555555' };

const sampleTool: ToolDefinition = {
  name: 'listar_tarefas',
  description: 'Lista as tarefas do utilizador',
  domain: 'tasks',
  argsSchema: z.object({ filtro: z.string().optional() }),
  resultSchema: z.object({ total: z.number() }),
  requiresPreview: false,
  reversible: false,
  execute: async () => ({ total: 0 }),
};

/** Constrói uma `Response` JSON (classifier non-streaming). */
function jsonResponse(payload: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
}

/**
 * Constrói uma `Response` SSE OpenAI a partir de chunks. Cada chunk vira
 * `data: {json}\n\n`; anexa `data: [DONE]\n\n` salvo `done:false` (stream
 * abortado).
 */
function sseResponse(
  chunks: unknown[],
  opts: { done?: boolean; status?: number } = {}
): typeof fetch {
  const { done = true, status = 200 } = opts;
  return (async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (const ch of chunks) {
          c.enqueue(enc.encode(`data: ${JSON.stringify(ch)}\n\n`));
        }
        if (done) c.enqueue(enc.encode('data: [DONE]\n\n'));
        c.close();
      },
    });
    return new Response(stream, {
      status,
      headers: { 'content-type': 'text/event-stream' },
    });
  }) as typeof fetch;
}

function chunk(choices: unknown[], usage?: unknown): Record<string, unknown> {
  return {
    id: 'chatcmpl_mock_8_4',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model: 'gpt-4.1-mock',
    choices,
    ...(usage ? { usage } : {}),
  };
}

async function collect(
  iter: AsyncIterable<LLMStreamEvent>
): Promise<LLMStreamEvent[]> {
  const events: LLMStreamEvent[] = [];
  for await (const e of iter) events.push(e);
  return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// classify() — non-streaming via proxy (AC3)
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIInferenceTransport.classify (AC3)', () => {
  it('parseia choices[0].message.content e devolve ClassificationResult', async () => {
    const fetchFn = jsonResponse({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intents: ['tasks', 'finance'],
              confidence: { tasks: 0.9, finance: 0.8 },
            }),
          },
        },
      ],
      usage: { prompt_tokens: 40, completion_tokens: 12 },
    });
    const transport = new OpenAIInferenceTransport(fetchFn);

    const result = await transport.classify('system', 'cria tarefa e despesa', {
      model: CLASSIFIER_MODEL,
    });

    expect(result.intents).toEqual(['tasks', 'finance']);
    expect(result.confidence.tasks).toBe(0.9);
    // Usage mapeada dos nomes OpenAI (prompt_tokens→inputTokens, etc.).
    expect(result.inputTokens).toBe(40);
    expect(result.outputTokens).toBe(12);
  });

  it('strip defensivo: parseia JSON do classifier envolvido em ```json fences', async () => {
    const fenced = '```json\n{"intents":["tasks"],"confidence":{"tasks":0.96}}\n```';
    const fetchFn = jsonResponse({
      choices: [{ message: { content: fenced } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });
    const transport = new OpenAIInferenceTransport(fetchFn);

    const result = await transport.classify('sys', 'anota a tarefa de comprar pão');

    expect(result.intents).toEqual(['tasks']);
    expect(result.confidence.tasks).toBe(0.96);
    // rawResponse preserva o original (com fences) — NFR11/debug.
    expect(result.rawResponse).toContain('```json');
  });

  it('rejeita systemPrompt vazio', async () => {
    const transport = new OpenAIInferenceTransport(jsonResponse({}));
    await expect(transport.classify('', 'x')).rejects.toThrow(/systemPrompt obrigatório/);
  });

  it('rejeita userPrompt vazio', async () => {
    const transport = new OpenAIInferenceTransport(jsonResponse({}));
    await expect(transport.classify('sys', '')).rejects.toThrow(/userPrompt obrigatório/);
  });

  it('propaga erro PT-PT quando o proxy responde não-OK (401)', async () => {
    const fetchFn = jsonResponse({ error: 'Não autenticado.' }, 401);
    const transport = new OpenAIInferenceTransport(fetchFn);
    await expect(transport.classify('sys', 'prompt')).rejects.toThrow(
      /Proxy de inferência OpenAI respondeu 401/
    );
  });

  it('lança quando choices[0].message.content não é JSON válido', async () => {
    const fetchFn = jsonResponse({
      choices: [{ message: { content: 'isto não é JSON' } }],
      usage: { prompt_tokens: 5, completion_tokens: 2 },
    });
    const transport = new OpenAIInferenceTransport(fetchFn);
    await expect(transport.classify('sys', 'prompt')).rejects.toThrow(/não é JSON válido/);
  });

  it('lança quando a resposta não tem choices[0].message.content', async () => {
    const fetchFn = jsonResponse({ choices: [], usage: {} });
    const transport = new OpenAIInferenceTransport(fetchFn);
    await expect(transport.classify('sys', 'prompt')).rejects.toThrow(
      /não contém choices\[0\].message.content/
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// execute() — streaming SSE OpenAI via proxy (AC4)
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIInferenceTransport.execute — guards', () => {
  it('rejeita messages vazio', async () => {
    const transport = new OpenAIInferenceTransport(sseResponse([]));
    await expect(
      collect(transport.execute([], [], EXECUTOR_OPTS))
    ).rejects.toThrow(/messages array não pode estar vazio/);
  });

  it('rejeita runId vazio', async () => {
    const transport = new OpenAIInferenceTransport(sseResponse([]));
    await expect(
      collect(transport.execute([{ role: 'user', content: 'x' }], [], { runId: '' }))
    ).rejects.toThrow(/runId obrigatório/);
  });
});

describe('OpenAIInferenceTransport.execute — text-only (AC4)', () => {
  it('emite text_delta de delta.content + done com usage; nenhum tool_use', async () => {
    const fetchFn = sseResponse([
      chunk([{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]),
      chunk([{ index: 0, delta: { content: 'Olá ' }, finish_reason: null }]),
      chunk([{ index: 0, delta: { content: 'mundo' }, finish_reason: null }]),
      chunk([{ index: 0, delta: {}, finish_reason: 'stop' }]),
      chunk([], { prompt_tokens: 12, completion_tokens: 7 }),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const messages: LLMMessage[] = [{ role: 'user', content: 'olá' }];
    const events = await collect(transport.execute(messages, [], EXECUTOR_OPTS));

    const texts = events.filter((e) => e.type === 'text_delta');
    expect(texts.map((e) => (e.type === 'text_delta' ? e.text : ''))).toEqual([
      'Olá ',
      'mundo',
    ]);
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);

    const done = events[events.length - 1];
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.inputTokens).toBe(12);
      expect(done.outputTokens).toBe(7);
    }
  });
});

describe('OpenAIInferenceTransport.execute — 1 tool, args num único delta (AC4 baseline)', () => {
  it('reagrega e emite tool_use com input parseado', async () => {
    const fetchFn = sseResponse([
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_single',
                type: 'function',
                function: { name: 'listar_tarefas', arguments: '{"filtro":"hoje"}' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
      chunk([], { prompt_tokens: 18, completion_tokens: 6 }),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'tarefas de hoje' }], [sampleTool], EXECUTOR_OPTS)
    );

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].id).toBe('call_single');
      expect(toolUses[0].name).toBe('listar_tarefas');
      expect(toolUses[0].input).toEqual({ filtro: 'hoje' });
    }
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIInferenceTransport.execute — FALSIFICÁVEL: args em ≥2 deltas (AC9)', () => {
  /**
   * `mock-protocol-fidelity.md`: os `arguments` chegam FRAGMENTADOS em ≥2 deltas
   * (`'{"filtro":'` + `'"hoje"}'`). Cada fragmento isolado é JSON inválido — este
   * assert só passa se o accumulator concatenou os deltas e parseou SÓ no
   * boundary `finish_reason:'tool_calls'`. FALHARIA se o mock entregasse os args
   * completos num só delta (o accumulator não seria exercido) ou se o parser
   * parseasse cada delta (`JSON.parse('{"filtro":')` → SyntaxError → error event).
   */
  it('o tool_use emitido tem input completo após concatenação dos fragmentos', async () => {
    const fetchFn = sseResponse([
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                type: 'function',
                function: { name: 'listar_tarefas', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '{"filtro":' } }] },
          finish_reason: null,
        },
      ]),
      chunk([
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '"hoje"}' } }] },
          finish_reason: null,
        },
      ]),
      chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
      chunk([], { prompt_tokens: 50, completion_tokens: 20 }),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'tarefas hoje' }], [sampleTool], EXECUTOR_OPTS)
    );

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].input).toEqual({ filtro: 'hoje' });
      // Prova de que NÃO parseou cedo: input não é o fragmento parcial.
      expect(toolUses[0].input).not.toEqual({});
    }
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIInferenceTransport.execute — multi-tool, índices distintos (AC4)', () => {
  it('emite 2 tool_use com ids distintos e input por índice (fragmentos intercalados)', async () => {
    const fetchFn = sseResponse([
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              { index: 0, id: 'call_aaa', type: 'function', function: { name: 'criar_tarefa', arguments: '' } },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              { index: 1, id: 'call_bbb', type: 'function', function: { name: 'criar_evento', arguments: '' } },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"titulo":' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 1, function: { arguments: '{"local":' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '"A"}' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 1, function: { arguments: '"B"}' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
      chunk([], { prompt_tokens: 40, completion_tokens: 22 }),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'cria tarefa e evento' }], [sampleTool], EXECUTOR_OPTS)
    );

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(2);
    const byId = new Map(
      toolUses.flatMap((e) => (e.type === 'tool_use' ? [[e.id, e]] : []))
    );
    expect([...byId.keys()].sort()).toEqual(['call_aaa', 'call_bbb']);
    const a = byId.get('call_aaa');
    const b = byId.get('call_bbb');
    if (a?.type === 'tool_use') expect(a.input).toEqual({ titulo: 'A' });
    if (b?.type === 'tool_use') expect(b.input).toEqual({ local: 'B' });
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIInferenceTransport.execute — tool sem args → {} (AC4)', () => {
  it('arguments vazio é interpretado como input {} (não erro)', async () => {
    const fetchFn = sseResponse([
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              { index: 0, id: 'call_noargs', type: 'function', function: { name: 'listar_tarefas', arguments: '' } },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
      chunk([], { prompt_tokens: 8, completion_tokens: 2 }),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'lista' }], [sampleTool], EXECUTOR_OPTS)
    );
    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].input).toEqual({});
    }
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
  });
});

describe('OpenAIInferenceTransport.execute — args malformados → error (AC4, AC7-F6)', () => {
  it('emite error identificando a tool culpada e re-throw sem duplicar', async () => {
    const fetchFn = sseResponse([
      chunk([
        {
          index: 0,
          delta: {
            tool_calls: [
              { index: 0, id: 'call_bad', type: 'function', function: { name: 'listar_tarefas', arguments: '' } },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"filtro":NOT_' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: 'VALID' } }] }, finish_reason: null }]),
      chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
    ]);
    const transport = new OpenAIInferenceTransport(fetchFn);

    const events: LLMStreamEvent[] = [];
    let threw = false;
    try {
      for await (const e of transport.execute([{ role: 'user', content: 'x' }], [sampleTool], EXECUTOR_OPTS)) {
        events.push(e);
      }
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(1);
    if (errors[0]?.type === 'error') {
      expect(errors[0].message).toContain('listar_tarefas');
      expect(errors[0].message).toContain('call_bad');
    }
    // Sem done, sem tool_use emitido para a tool partida.
    expect(events.filter((e) => e.type === 'done')).toHaveLength(0);
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);
  });
});

describe('OpenAIInferenceTransport.execute — falhas de transporte (AC7)', () => {
  it('F2: !res.ok 502 → emite error event + throw PT-PT', async () => {
    const fetchFn = jsonResponse({ error: 'Falha ao contactar OpenAI.' }, 502);
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events: LLMStreamEvent[] = [];
    let message = '';
    try {
      for await (const e of transport.execute([{ role: 'user', content: 'x' }], [], EXECUTOR_OPTS)) {
        events.push(e);
      }
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toMatch(/respondeu 502/);
    expect(events.filter((e) => e.type === 'error')).toHaveLength(1);
  });

  it('F1: fetchFn lança → emite error event + relança', async () => {
    const fetchFn = (async () => {
      throw new Error('network down');
    }) as typeof fetch;
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events: LLMStreamEvent[] = [];
    let threw = false;
    try {
      for await (const e of transport.execute([{ role: 'user', content: 'x' }], [], EXECUTOR_OPTS)) {
        events.push(e);
      }
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(1);
    if (errors[0]?.type === 'error') {
      expect(errors[0].message).toContain('network down');
    }
  });

  it('F5: stream abortado antes de [DONE] → done com tokens parciais, sem crash', async () => {
    // Stream com texto + usage mas SEM [DONE] e sem finish_reason — termina a
    // meio. `iterateSseData` acaba; flush defensivo (Map vazio) → done com os
    // tokens acumulados até ao momento.
    const fetchFn = sseResponse(
      [
        chunk([{ index: 0, delta: { content: 'parcial' }, finish_reason: null }]),
        chunk([], { prompt_tokens: 9, completion_tokens: 4 }),
      ],
      { done: false }
    );
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'x' }], [], EXECUTOR_OPTS)
    );
    expect(events.filter((e) => e.type === 'text_delta')).toHaveLength(1);
    const done = events[events.length - 1];
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.inputTokens).toBe(9);
      expect(done.outputTokens).toBe(4);
    }
  });
});
