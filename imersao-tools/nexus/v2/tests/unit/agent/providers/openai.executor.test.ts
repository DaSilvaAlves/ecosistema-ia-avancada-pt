import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { OpenAIExecutor } from '@/lib/agent/providers/openai';
import type {
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — OpenAIExecutor streaming tests (Story 8.2 / ADR-10 S2)
 *
 * Cobertura: AC2 (text-only), AC3 (1 tool fragmentado), AC4 (multi-tool ids
 * distintos), AC5 (args malformados → error), AC6 (tool sem args → {}),
 * AC7 (usage mapeada), AC11 (eventos canónicos), AC12 (buffer lifecycle).
 *
 * MSW handler em `tests/mocks/handlers/openai.ts` — discrimina por magic string
 * no conteúdo da última mensagem `user`, com `arguments` FRAGMENTADOS (≥2 deltas).
 */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_OPENAI_KEY = 'sk-openai-mock-test-key-1234567890';
const OPTS = { runId: '11111111-2222-3333-4444-555555555555' };

async function collectEvents(
  iter: AsyncIterable<LLMStreamEvent>
): Promise<LLMStreamEvent[]> {
  const events: LLMStreamEvent[] = [];
  for await (const e of iter) {
    events.push(e);
  }
  return events;
}

const sampleTool: ToolDefinition = {
  name: 'criar_tarefa',
  description: 'Cria uma nova tarefa na lista do utilizador',
  domain: 'tasks',
  argsSchema: z.object({
    titulo: z.string().min(1),
    prazo: z.string().optional(),
  }),
  resultSchema: z.object({ id: z.string() }),
  requiresPreview: false,
  reversible: true,
  execute: vi.fn().mockResolvedValue({ id: 'mock-id' }),
};

describe('OpenAIExecutor — input guards (paridade anthropic)', () => {
  it('rejeita messages array vazio', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    await expect(async () => {
      for await (const _ of executor.execute([], [], OPTS)) {
        // intentionally empty
      }
    }).rejects.toThrow(/messages array não pode estar vazio/);
  });

  it('rejeita opts.runId vazio', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const messages: LLMMessage[] = [{ role: 'user', content: 'MOCK_OPENAI_TEXT' }];
    await expect(async () => {
      for await (const _ of executor.execute(messages, [], { runId: '' })) {
        // intentionally empty
      }
    }).rejects.toThrow(/opts.runId obrigatório/);
  });
});

describe('OpenAIExecutor — text-only stream (AC2, C1)', () => {
  const messages: LLMMessage[] = [{ role: 'user', content: 'MOCK_OPENAI_TEXT olá' }];

  it('emite text_delta de delta.content + 1 done com usage; nenhum tool_use', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [], OPTS));

    const textEvents = events.filter((e) => e.type === 'text_delta');
    expect(textEvents.map((e) => (e.type === 'text_delta' ? e.text : ''))).toEqual([
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

describe('OpenAIExecutor — 1 tool, arguments fragmentados (AC3, C2/C3)', () => {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'MOCK_OPENAI_TOOL lembra-me de comprar pão' },
  ];

  it('reagrega arguments fragmentados num único tool_use com input completo', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [sampleTool], OPTS));

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    const tu = toolUses[0];
    if (tu?.type === 'tool_use') {
      expect(tu.id).toBe('call_tool_01');
      expect(tu.name).toBe('criar_tarefa');
      // FALSIFICÁVEL (C3): cada fragmento isolado ('{"titulo":"Comp' / 'rar pão"}')
      // é JSON inválido. Este assert só passa se o acumulador concatenou os ≥2
      // deltas e parseou SÓ no boundary. Falharia se o parser parseasse cada
      // delta OU se o mock entregasse os args completos num só delta.
      expect(tu.input).toEqual({ titulo: 'Comprar pão' });
    }

    // Nenhum error event — prova que a reagregação produziu JSON válido.
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIExecutor — multi-tool, índices distintos (AC4, C4)', () => {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'MOCK_OPENAI_MULTITOOL cria tarefa e evento' },
  ];

  it('emite 2 tool_use com ids distintos e input correcto por índice', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [sampleTool], OPTS));

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(2);

    const byId = new Map(
      toolUses.flatMap((e) => (e.type === 'tool_use' ? [[e.id, e]] : []))
    );
    expect([...byId.keys()].sort()).toEqual(['call_aaa', 'call_bbb']);

    const a = byId.get('call_aaa');
    const b = byId.get('call_bbb');
    if (a?.type === 'tool_use') {
      expect(a.name).toBe('criar_tarefa');
      // Fragmentos intercalados (index 0/1) não se misturam — input por índice.
      expect(a.input).toEqual({ titulo: 'A' });
    }
    if (b?.type === 'tool_use') {
      expect(b.name).toBe('criar_evento_calendar');
      expect(b.input).toEqual({ local: 'B' });
    }

    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIExecutor — args malformados → error (AC5, C5)', () => {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'MOCK_OPENAI_MALFORMED tool partida' },
  ];

  it('emite error identificando a tool culpada e re-throw sem duplicar', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events: LLMStreamEvent[] = [];
    let threw = false;
    try {
      for await (const e of executor.execute(messages, [sampleTool], OPTS)) {
        events.push(e);
      }
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(1);
    if (errors[0]?.type === 'error') {
      expect(errors[0].message).toContain('criar_tarefa');
      expect(errors[0].message).toContain('call_malformed_01');
    }
    // Sem done — o stream abortou no parse. Sem tool_use emitido para a tool partida.
    expect(events.filter((e) => e.type === 'done')).toHaveLength(0);
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);
  });
});

describe('OpenAIExecutor — tool sem args → {} (AC6, C6)', () => {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'MOCK_OPENAI_NOARGS lista tarefas' },
  ];

  it('arguments vazio é interpretado como input {} (não erro)', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [sampleTool], OPTS));

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].input).toEqual({});
      expect(toolUses[0].id).toBe('call_noargs_01');
    }
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('OpenAIExecutor — usage via include_usage (AC7, C7)', () => {
  it('mapeia prompt_tokens→inputTokens, completion_tokens→outputTokens no done', async () => {
    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const messages: LLMMessage[] = [
      { role: 'user', content: 'MOCK_OPENAI_TOOL com usage' },
    ];
    const events = await collectEvents(executor.execute(messages, [sampleTool], OPTS));
    const done = events[events.length - 1];
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.inputTokens).toBe(30);
      expect(done.outputTokens).toBe(15);
    }
  });
});

describe('OpenAIExecutor — buffer lifecycle (AC12, C10)', () => {
  const messages: LLMMessage[] = [
    { role: 'user', content: 'override via server.use' },
  ];

  it('chunk de usage (choices:[]) → tokens, nunca text_delta (guard choices.length)', async () => {
    // Stream que coloca o chunk de usage NO MEIO (choices:[]) — se o executor
    // não tivesse o guard `choices.length===0`, rebentaria ao aceder choices[0].
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => {
        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [{ index: 0, delta: { content: 'parcial' }, finish_reason: null }],
                })}\n\n`
              )
            );
            // chunk de usage no meio (choices vazias)
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [],
                  usage: { prompt_tokens: 9, completion_tokens: 4, total_tokens: 13 },
                })}\n\n`
              )
            );
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
                })}\n\n`
              )
            );
            c.enqueue(enc.encode('data: [DONE]\n\n'));
            c.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { 'content-type': 'text/event-stream' },
        });
      })
    );

    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [], OPTS));

    const texts = events.filter((e) => e.type === 'text_delta');
    expect(texts).toHaveLength(1);
    const done = events[events.length - 1];
    expect(done?.type).toBe('done');
    if (done?.type === 'done') {
      expect(done.inputTokens).toBe(9);
      expect(done.outputTokens).toBe(4);
    }
  });

  it('fragmento de continuação sem entrada prévia no Map → ignorado defensivamente', async () => {
    // delta.tool_calls com index 5 sem id/name (fragmento órfão) → ignorado;
    // o stream fecha em finish_reason:'stop' sem tool_use nem erro.
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => {
        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [
                    {
                      index: 0,
                      delta: { tool_calls: [{ index: 5, function: { arguments: 'orfao' } }] },
                      finish_reason: null,
                    },
                  ],
                })}\n\n`
              )
            );
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
                })}\n\n`
              )
            );
            c.enqueue(enc.encode('data: [DONE]\n\n'));
            c.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { 'content-type': 'text/event-stream' },
        });
      })
    );

    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [], OPTS));
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });

  it('rede de segurança: tool_use sem chunk finish_reason é fechado no fim do stream', async () => {
    // Fixture sem `finish_reason:'tool_calls'` — o flush defensivo de fim de
    // stream emite o tool_use que restou no Map.
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => {
        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(
              enc.encode(
                `data: ${JSON.stringify({
                  id: 'x',
                  object: 'chat.completion.chunk',
                  created: 1,
                  model: 'gpt-4.1',
                  choices: [
                    {
                      index: 0,
                      delta: {
                        tool_calls: [
                          {
                            index: 0,
                            id: 'call_flush',
                            type: 'function',
                            function: { name: 'criar_tarefa', arguments: '{"titulo":"X"}' },
                          },
                        ],
                      },
                      finish_reason: null,
                    },
                  ],
                })}\n\n`
              )
            );
            c.enqueue(enc.encode('data: [DONE]\n\n'));
            c.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { 'content-type': 'text/event-stream' },
        });
      })
    );

    const executor = new OpenAIExecutor(MOCK_OPENAI_KEY);
    const events = await collectEvents(executor.execute(messages, [sampleTool], OPTS));
    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].id).toBe('call_flush');
      expect(toolUses[0].input).toEqual({ titulo: 'X' });
    }
    expect(events[events.length - 1]?.type).toBe('done');
  });
});
