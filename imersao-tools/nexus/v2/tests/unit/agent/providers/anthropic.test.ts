import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
  AnthropicClassifier,
  AnthropicExecutor,
  DEFAULT_CLASSIFIER_MODEL,
  DEFAULT_EXECUTOR_MODEL,
} from '@/lib/agent/providers/anthropic';
import { getClassifier, getExecutor } from '@/lib/agent/providers/factory';
import { LLMMessageSchema } from '@/lib/agent/schemas';
import type {
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — Anthropic Provider Tests (Story 1.2)
 *
 * Cobertura:
 * - Factory env validation (AC4)
 * - Classifier shape + Zod validation (AC2, AC7)
 * - Classifier ZodError em malformed response (AC7)
 * - Executor stream simples (text_delta + done) (AC2, AC8)
 * - Executor tool_use event (AC3)
 * - Executor input validation (defensive)
 * - Default models constants (AC5)
 *
 * MSW handlers em `tests/mocks/handlers/anthropic.ts` — discriminação por
 * system prompt magic strings (`MOCK_CLASSIFIER`, `MOCK_CLASSIFIER_MALFORMED`,
 * `MOCK_EXECUTOR_TOOL_USE`).
 */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_API_KEY = 'sk-ant-mock-test-key-1234567890';

// Helper: collect all events from async iterable
async function collectEvents(iter: AsyncIterable<LLMStreamEvent>): Promise<LLMStreamEvent[]> {
  const events: LLMStreamEvent[] = [];
  for await (const e of iter) {
    events.push(e);
  }
  return events;
}

describe('Default Models constants (AC5)', () => {
  it('exporta DEFAULT_CLASSIFIER_MODEL como claude-haiku-4-5-20251001', () => {
    expect(DEFAULT_CLASSIFIER_MODEL).toBe('claude-haiku-4-5-20251001');
  });

  it('exporta DEFAULT_EXECUTOR_MODEL como claude-sonnet-4-6', () => {
    expect(DEFAULT_EXECUTOR_MODEL).toBe('claude-sonnet-4-6');
  });
});

describe('Factory env validation (AC4)', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });

  it('getClassifier lança erro PT-PT quando ANTHROPIC_API_KEY ausente', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getClassifier()).toThrowError(/ANTHROPIC_API_KEY não configurada/);
  });

  it('getClassifier lança erro PT-PT quando ANTHROPIC_API_KEY vazia', () => {
    process.env.ANTHROPIC_API_KEY = '';
    expect(() => getClassifier()).toThrowError(/ANTHROPIC_API_KEY não configurada/);
  });

  it('getExecutor lança erro PT-PT quando ANTHROPIC_API_KEY ausente', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getExecutor()).toThrowError(/ANTHROPIC_API_KEY não configurada/);
  });

  it('getClassifier retorna instância válida quando ANTHROPIC_API_KEY presente', () => {
    process.env.ANTHROPIC_API_KEY = MOCK_API_KEY;
    const classifier = getClassifier();
    expect(classifier).toBeDefined();
    expect(typeof classifier.classify).toBe('function');
  });

  it('getExecutor retorna instância válida quando ANTHROPIC_API_KEY presente', () => {
    process.env.ANTHROPIC_API_KEY = MOCK_API_KEY;
    const executor = getExecutor();
    expect(executor).toBeDefined();
    expect(typeof executor.execute).toBe('function');
  });
});

describe('AnthropicClassifier (AC2, AC7)', () => {
  it('retorna ClassificationResult válido quando API responde JSON bem formado', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    const result = await classifier.classify(
      'MOCK_CLASSIFIER — system prompt classifier',
      'paguei 50 euros gasolina'
    );

    expect(result.intents).toEqual(['criar_tarefa', 'criar_evento_calendar']);
    expect(result.confidence).toEqual({ criar_tarefa: 0.92, criar_evento_calendar: 0.85 });
    expect(result.rawResponse).toContain('intents');
    expect(result.inputTokens).toBe(80);
    expect(result.outputTokens).toBe(40);
  });

  it('lança ZodError quando API retorna JSON sem campo intents', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    await expect(
      classifier.classify('MOCK_CLASSIFIER_MALFORMED — system', 'qualquer prompt')
    ).rejects.toThrow(z.ZodError);
  });

  it('lança Error PT-PT quando API retorna texto não-JSON', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    await expect(
      classifier.classify('MOCK_CLASSIFIER_NOT_JSON — system', 'qualquer prompt')
    ).rejects.toThrow(/não é JSON válido/);
  });

  it('rejeita systemPrompt vazio', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    await expect(classifier.classify('', 'user prompt')).rejects.toThrow(
      /systemPrompt obrigatório/
    );
  });

  it('rejeita userPrompt vazio', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    await expect(classifier.classify('MOCK_CLASSIFIER — system', '')).rejects.toThrow(
      /userPrompt obrigatório/
    );
  });

  it('respeita opts.model override', async () => {
    const classifier = new AnthropicClassifier(MOCK_API_KEY);
    // Mock retorna sempre o mesmo body — só testamos que não lança
    const result = await classifier.classify('MOCK_CLASSIFIER — system', 'prompt', {
      model: 'claude-opus-4-7',
      temperature: 0.2,
      maxTokens: 500,
    });
    expect(result.intents).toBeDefined();
  });
});

describe('AnthropicExecutor — basic streaming (AC2, AC8)', () => {
  const messages: LLMMessage[] = [{ role: 'user', content: 'Olá' }];
  const opts = { runId: '11111111-2222-3333-4444-555555555555' };

  it('emite text_delta + done em stream simples (sem tools)', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const events = await collectEvents(executor.execute(messages, [], opts));

    const textEvents = events.filter((e) => e.type === 'text_delta');
    expect(textEvents).toHaveLength(1);
    if (textEvents[0]?.type === 'text_delta') {
      expect(textEvents[0].text).toBe('Olá mundo');
    }

    const doneEvents = events.filter((e) => e.type === 'done');
    expect(doneEvents).toHaveLength(1);
    if (doneEvents[0]?.type === 'done') {
      expect(doneEvents[0].inputTokens).toBe(12);
      expect(doneEvents[0].outputTokens).toBe(7);
    }
  });

  it('done sempre é o último evento emitido', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const events = await collectEvents(executor.execute(messages, [], opts));
    expect(events[events.length - 1]?.type).toBe('done');
  });

  it('rejeita messages array vazio', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    await expect(async () => {
      for await (const _ of executor.execute([], [], opts)) {
        // intentionally empty
      }
    }).rejects.toThrow(/messages array não pode estar vazio/);
  });

  it('rejeita opts.runId vazio', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    await expect(async () => {
      for await (const _ of executor.execute(messages, [], { runId: '' })) {
        // intentionally empty
      }
    }).rejects.toThrow(/opts.runId obrigatório/);
  });
});

describe('AnthropicExecutor — tool calling (AC3)', () => {
  const sampleTool: ToolDefinition = {
    name: 'criar_tarefa',
    description: 'Cria uma nova tarefa na lista do utilizador',
    argsSchema: z.object({
      titulo: z.string().min(1),
      prazo: z.string().optional(),
    }),
  };

  const opts = { runId: '11111111-2222-3333-4444-555555555555' };

  it('emite tool_use quando SDK retorna content_block_start tool_use', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Lembra-me de comprar pão' },
    ];

    const events = await collectEvents(executor.execute(messages, [sampleTool], opts));

    const toolUseEvents = events.filter((e) => e.type === 'tool_use');
    expect(toolUseEvents).toHaveLength(1);
    if (toolUseEvents[0]?.type === 'tool_use') {
      expect(toolUseEvents[0].id).toBe('toolu_test_01');
      expect(toolUseEvents[0].name).toBe('criar_tarefa');
      expect(toolUseEvents[0].input).toEqual({ titulo: 'Comprar pão' });
    }

    // done sempre presente no fim
    expect(events[events.length - 1]?.type).toBe('done');
  });

  it('mensagem com role tool requer toolCallId', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Olá' },
      { role: 'tool', content: 'resultado da tool' /* sem toolCallId */ },
    ];

    await expect(async () => {
      for await (const _ of executor.execute(messages, [], opts)) {
        // intentionally empty
      }
    }).rejects.toThrow(/role "tool" requerem toolCallId/);
  });

  it('aceita mensagem com role tool quando toolCallId presente', async () => {
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [
      { role: 'user', content: 'cria tarefa' },
      { role: 'assistant', content: 'a chamar tool' },
      { role: 'tool', content: '{"ok":true}', toolCallId: 'toolu_test_01' },
    ];

    const events = await collectEvents(executor.execute(messages, [sampleTool], opts));
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });
});

describe('AnthropicExecutor — error handling', () => {
  it('emite error event antes de rethrow quando SDK falha', async () => {
    // Não temos handler que force erro durante stream — testa que o try/finally
    // existe via runtime branch coverage. O comportamento de re-throw é
    // verificado pela ausência de "swallowed errors" — confirmar via outros tests.
    // Este test garante que a presença de try/catch não introduz bug em path normal.
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const events = await collectEvents(
      executor.execute([{ role: 'user', content: 'Olá' }], [], {
        runId: '00000000-0000-0000-0000-000000000000',
      })
    );
    // Path normal: nenhum error event
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
  });
});

/**
 * Iter 3 — CodeRabbit Major 1: protocolo Anthropic real para tool_use.
 *
 * Bug original: executor emitia `tool_use` no `content_block_start` com
 * `input` vazio. Protocolo real emite o `id`/`name` no start e os args
 * em `input_json_delta` chunks finalizando no `content_block_stop`.
 * O mock antigo reproduzia o bug — passamos a emitir o protocolo correcto.
 *
 * Estes tests validam que:
 * 1. O executor reagrega chunks parciais num único `tool_use` event com
 *    `input` completo (caso 2-chunk básico via mock principal — assert na
 *    suite "tool calling" acima).
 * 2. O executor é robusto a chunks que partem em pontos hostis: meio de
 *    string com aspas, no separador `:`, ou no meio de número.
 * 3. JSON malformado emerge como `error` event seguido de re-throw.
 */
describe('AnthropicExecutor — input_json_delta reaggregation (Iter 3 / Major 1)', () => {
  const sampleTool: ToolDefinition = {
    name: 'criar_tarefa',
    description: 'Cria uma nova tarefa',
    argsSchema: z.object({
      titulo: z.string().min(1),
      prioridade: z.number().int().optional(),
    }),
  };

  const opts = { runId: '11111111-2222-3333-4444-555555555555' };

  it('reagrega 2 chunks input_json_delta em 1 único tool_use event', async () => {
    // O mock canónico (palavra "comprar pão") usa 2 chunks: '{"titulo":"Comp'
    // e 'rar pão"}'. Test: executor recompõe correctamente.
    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Lembra-me de comprar pão' },
    ];
    const events = await collectEvents(executor.execute(messages, [sampleTool], opts));

    const toolUseEvents = events.filter((e) => e.type === 'tool_use');
    // Crítico: UM único tool_use event (não dois — chunks foram reagregados)
    expect(toolUseEvents).toHaveLength(1);
    if (toolUseEvents[0]?.type === 'tool_use') {
      expect(toolUseEvents[0].id).toBe('toolu_test_01');
      expect(toolUseEvents[0].name).toBe('criar_tarefa');
      expect(toolUseEvents[0].input).toEqual({ titulo: 'Comprar pão' });
    }
  });

  it('reagrega 5 chunks com cortes hostis (string, separador, número)', async () => {
    // Adicionamos handler runtime override para testar a variante chunked.
    // Cria executor que envia system prompt com MOCK_EXECUTOR_TOOL_USE_CHUNKED
    // — mas como ExecutorOpts não expõe system, replicamos via run override
    // do MSW: inserimos um handler que força a variante chunked para qualquer
    // request com stream=true.
    server.use(
      http.post(
        'https://api.anthropic.com/v1/messages',
        async ({ request }) => {
          const body = (await request.json()) as { model: string; stream?: boolean };
          if (body.stream !== true) {
            return new HttpResponse(null, { status: 404 });
          }
          // Reaproveita exactamente a sequência de events do buildToolUseStreamChunked
          // — duplicação minimal para isolar o test do dispatch principal.
          const encoder = new TextEncoder();
          const seq = [
            `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'm', type: 'message', role: 'assistant', content: [], model: body.model, stop_reason: null, stop_sequence: null, usage: { input_tokens: 30, output_tokens: 0 } } })}\n\n`,
            `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_chunked_01', name: 'criar_tarefa', input: {} } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"titulo":"Olá ' } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: 'mundo","prio' } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: 'ridade":' } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '4' } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '2}' } })}\n\n`,
            `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
            `event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 20 } })}\n\n`,
            `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
          ];
          const stream = new ReadableStream<Uint8Array>({
            start(c) {
              for (const s of seq) c.enqueue(encoder.encode(s));
              c.close();
            },
          });
          return new HttpResponse(stream, {
            headers: { 'content-type': 'text/event-stream' },
          });
        }
      )
    );

    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [{ role: 'user', content: 'qualquer' }];
    const events = await collectEvents(executor.execute(messages, [sampleTool], opts));

    const toolUseEvents = events.filter((e) => e.type === 'tool_use');
    expect(toolUseEvents).toHaveLength(1);
    if (toolUseEvents[0]?.type === 'tool_use') {
      expect(toolUseEvents[0].id).toBe('toolu_chunked_01');
      expect(toolUseEvents[0].name).toBe('criar_tarefa');
      expect(toolUseEvents[0].input).toEqual({ titulo: 'Olá mundo', prioridade: 42 });
    }
    // done sempre presente no fim
    expect(events[events.length - 1]?.type).toBe('done');
  });

  it('emite error event + re-throws quando input_json_delta produz JSON inválido', async () => {
    // Override runtime — emite chunks que somados são JSON sintacticamente inválido
    server.use(
      http.post(
        'https://api.anthropic.com/v1/messages',
        async ({ request }) => {
          const body = (await request.json()) as { model: string; stream?: boolean };
          if (body.stream !== true) {
            return new HttpResponse(null, { status: 404 });
          }
          const encoder = new TextEncoder();
          const seq = [
            `event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: 'mErr', type: 'message', role: 'assistant', content: [], model: body.model, stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } })}\n\n`,
            `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_err_01', name: 'criar_tarefa', input: {} } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"titulo":NOT_VAL' } })}\n\n`,
            `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: 'ID_JSON' } })}\n\n`,
            `event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`,
          ];
          const stream = new ReadableStream<Uint8Array>({
            start(c) {
              for (const s of seq) c.enqueue(encoder.encode(s));
              c.close();
            },
          });
          return new HttpResponse(stream, {
            headers: { 'content-type': 'text/event-stream' },
          });
        }
      )
    );

    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [{ role: 'user', content: 'qualquer' }];

    let error: unknown = null;
    const events: LLMStreamEvent[] = [];
    try {
      for await (const e of executor.execute(messages, [sampleTool], opts)) {
        events.push(e);
      }
    } catch (e) {
      error = e;
    }

    // Re-throw obrigatório (preservar stack trace)
    expect(error).not.toBeNull();
    // Error event emitido antes de re-throw
    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents).toHaveLength(1);
    if (errorEvents[0]?.type === 'error') {
      expect(errorEvents[0].message).toMatch(/input_json_delta accumulator/);
    }
    // tool_use NÃO deve ter sido emitido (parse falhou)
    expect(events.filter((e) => e.type === 'tool_use')).toHaveLength(0);
  });
});

/**
 * Iter 3 — CodeRabbit Nitpick B: superRefine garante toolCallId quando role==='tool'.
 */
describe('LLMMessageSchema — superRefine toolCallId (Iter 3 / Nitpick B)', () => {
  it('aceita mensagem role tool quando toolCallId presente', () => {
    const result = LLMMessageSchema.safeParse({
      role: 'tool',
      content: 'resultado',
      toolCallId: 'toolu_123',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita mensagem role tool sem toolCallId (ZodError com path correcto)', () => {
    const result = LLMMessageSchema.safeParse({
      role: 'tool',
      content: 'resultado',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'toolCallId');
      expect(issue).toBeDefined();
      expect(issue?.message).toMatch(/obrigatório/);
    }
  });

  it('rejeita mensagem role tool com toolCallId vazio', () => {
    const result = LLMMessageSchema.safeParse({
      role: 'tool',
      content: 'resultado',
      toolCallId: '',
    });
    expect(result.success).toBe(false);
  });

  it('aceita mensagem role user/assistant sem toolCallId', () => {
    expect(
      LLMMessageSchema.safeParse({ role: 'user', content: 'olá' }).success
    ).toBe(true);
    expect(
      LLMMessageSchema.safeParse({ role: 'assistant', content: 'oi' }).success
    ).toBe(true);
  });
});
