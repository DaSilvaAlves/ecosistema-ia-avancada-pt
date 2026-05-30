import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { http } from 'msw';
import { server } from '@/tests/mocks/server';

// Story 1.7 — mock global do `@vercel/kv` singleton. Sem este mock, qualquer
// teste que execute `runAgent` lança "Missing required environment variables
// KV_REST_API_URL and KV_REST_API_TOKEN" porque o executor agora importa o
// singleton real (Story 1.5 placeholder `null as unknown as VercelKV` foi
// substituído na Story 1.7). RESOLVED-1 (Architect Aria): `vi.mock` directo
// é o pattern aprovado (alinhado Stories 1.4-1.6 com Anthropic). Tests
// específicos de undo registam comportamento adicional via `kvMock.set/get/del`
// — ver describe block "Story 1.7" no fim deste ficheiro.
vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(0),
  },
}));

// Story 1.11 — o singleton `@vercel/kv` deixou de estar no caminho do executor
// (undo agora injectável via `RunAgentOpts.undoStore`). O `vi.mock` acima
// mantém-se como guard de segurança caso algum import transitivo o toque, mas
// já NÃO importamos `kv` nos testes — os testes de undo usam um `undoStore` mock.
import {
  MAX_TOOL_ITERATIONS,
  PREVIEW_CONFIDENCE_THRESHOLD,
  runAgent,
  type ConfirmationProvider,
  type ExecutorSSEEvent,
  _getToolsForDomains,
} from '@/lib/agent/executor';
import { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';

/**
 * Story 1.5 — Executor `runAgent` tests.
 *
 * Cobre AC1-AC13. MSW intercepta `https://api.anthropic.com/v1/messages` para:
 *   - classifier non-streaming (body.stream undefined/false)
 *   - executor SSE streaming (body.stream === true)
 *
 * Magic strings `MOCK_EXECUTOR_*` injectadas no `userPrompt` activam handlers
 * dedicados em `tests/mocks/handlers/anthropic.ts` (Story 1.5 extensão).
 *
 * Sem Dexie no setup (RESOLVED-2 — executor é stateless server-side; persistência
 * é client-only — Story 1.9). `fake-indexeddb/auto` carrega via `tests/setup.ts`
 * mas o executor NUNCA toca em `@/lib/db/client`.
 */

const MOCK_API_KEY = 'sk-ant-test-' + 'x'.repeat(40);

// ─────────────────────────────────────────────────────────────────────────────
// Magic strings (camelCase de constantes do MSW handler — lição Iter 2 Story 1.4)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PROMPTS = {
  textOnly: 'MOCK_EXECUTOR_TEXT_ONLY',
  oneToolUse: 'MOCK_EXECUTOR_ONE_TOOL_USE',
  twoTools: 'MOCK_EXECUTOR_TWO_TOOLS',
  infiniteLoop: 'MOCK_EXECUTOR_INFINITE_LOOP',
  badToolName: 'MOCK_EXECUTOR_BAD_TOOL_NAME',
  badArgs: 'MOCK_EXECUTOR_BAD_ARGS',
  classifierFail: 'MOCK_EXECUTOR_CLASSIFIER_FAIL',
  textThenToolUse: 'MOCK_EXECUTOR_TEXT_THEN_TOOL_USE',
  providerError: 'MOCK_EXECUTOR_PROVIDER_ERROR',
  // Story 1.6 — preview gate
  lowConfidence: 'MOCK_EXECUTOR_LOW_CONFIDENCE',
  requiresPreview: 'MOCK_EXECUTOR_REQUIRES_PREVIEW',
  bothGates: 'MOCK_EXECUTOR_BOTH_GATES',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = MOCK_API_KEY;
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  toolRegistry.clear();
});

afterEach(() => {
  server.resetHandlers();
  toolRegistry.clear();
});

afterAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
  server.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function collectEvents(
  prompt: string,
  opts?: Parameters<typeof runAgent>[1]
): Promise<ExecutorSSEEvent[]> {
  const events: ExecutorSSEEvent[] = [];
  for await (const ev of runAgent(prompt, opts)) {
    events.push(ev);
  }
  return events;
}

async function collectEventsExpectingThrow(
  prompt: string,
  opts?: Parameters<typeof runAgent>[1]
): Promise<{ events: ExecutorSSEEvent[]; error: unknown }> {
  const events: ExecutorSSEEvent[] = [];
  let error: unknown = null;
  try {
    for await (const ev of runAgent(prompt, opts)) {
      events.push(ev);
    }
  } catch (e) {
    error = e;
  }
  return { events, error };
}

// Stable timestamp tracker para sequencialidade
function createTimedTool(
  name: string,
  domain: ToolDefinition['domain'],
  delayMs: number,
  log: Array<{ name: string; start: number; end: number }>
): ToolDefinition {
  return defineTool({
    name,
    description: `Tool de teste ${name} (delay ${delayMs}ms)`,
    domain,
    argsSchema: z.object({}).passthrough(),
    resultSchema: z.unknown() as unknown as z.ZodType<unknown>,
    requiresPreview: false,
    reversible: false,
    execute: async () => {
      const start = Date.now();
      await new Promise((r) => setTimeout(r, delayMs));
      const end = Date.now();
      log.push({ name, start, end });
      return { ok: true };
    },
  }) as ToolDefinition;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + AC3 — input validation
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — input validation', () => {
  it('lança erro PT-PT quando userPrompt é vazio', async () => {
    await expect(async () => {
      const gen = runAgent('');
      await gen.next();
    }).rejects.toThrow('Executor: userPrompt obrigatório');
  });

  it('lança erro PT-PT quando userPrompt é apenas whitespace', async () => {
    await expect(async () => {
      const gen = runAgent('   \t\n  ');
      await gen.next();
    }).rejects.toThrow('Executor: userPrompt obrigatório');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 + AC3 + AC8 — happy path: text only (sem tools)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — happy path text-only', () => {
  it('emite ordem canónica de eventos: meta(start) → meta(classified) → text_delta → done', async () => {
    const events = await collectEvents(MOCK_PROMPTS.textOnly);

    const types = events.map((e) => e.type);
    expect(types[0]).toBe('meta');
    expect(types[types.length - 1]).toBe('done');
    expect(types).toContain('text_delta');

    const metaStart = events[0];
    if (metaStart.type !== 'meta' || metaStart.phase !== 'start') {
      throw new Error('primeiro evento não é meta(start)');
    }
    expect(metaStart.runId).toMatch(/^[0-9a-f-]{36}$/);
    expect(metaStart.prompt).toBe(MOCK_PROMPTS.textOnly);
    expect(metaStart.modelClassifier).toBe(DEFAULT_CLASSIFIER_MODEL);
    expect(metaStart.modelExecutor).toBe(DEFAULT_EXECUTOR_MODEL);
    expect(metaStart.classifierResult).toBeNull();

    const metaClassified = events[1];
    if (metaClassified.type !== 'meta' || metaClassified.phase !== 'classified') {
      throw new Error('segundo evento não é meta(classified)');
    }
    expect(metaClassified.classifierResult.intents).toEqual([]);

    const done = events[events.length - 1];
    if (done.type !== 'done') throw new Error('último evento não é done');
    expect(done.status).toBe('success');
    expect(done.intents).toEqual([]);
    expect(done.totals.toolCalls).toBe(0);
    expect(done.totals.intents).toBe(0);
    expect(done.durationMs).toBeGreaterThanOrEqual(0);
    expect(done.runId).toBe(metaStart.runId);
  });

  it('payload `done` contém tudo que o client precisa para invocar finishRun', async () => {
    const events = await collectEvents(MOCK_PROMPTS.textOnly);
    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
    if (done?.type !== 'done') throw new Error('done not found');

    expect(done).toMatchObject({
      type: 'done',
      runId: expect.any(String),
      status: 'success',
      intents: expect.any(Array),
      inputTokens: expect.any(Number),
      outputTokens: expect.any(Number),
      durationMs: expect.any(Number),
      totals: { intents: expect.any(Number), toolCalls: expect.any(Number) },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 + AC8 — single tool happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — single tool execution', () => {
  it('executa 1 tool: tool_start → tool_complete com payload completo → done success', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool de teste single',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: false,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);

    const toolStart = events.find((e) => e.type === 'tool_start');
    expect(toolStart).toBeDefined();
    if (toolStart?.type !== 'tool_start') throw new Error();
    expect(toolStart.toolName).toBe('tool_test_one');
    expect(toolStart.args).toEqual({ x: 'hello' });

    const toolComplete = events.find((e) => e.type === 'tool_complete');
    expect(toolComplete).toBeDefined();
    if (toolComplete?.type !== 'tool_complete') throw new Error();
    // Payload COMPLETO — Story 1.1 appendToolCall sem reconstrução
    expect(toolComplete.toolName).toBe('tool_test_one');
    expect(toolComplete.args).toEqual({ x: 'hello' });
    expect(toolComplete.result).toEqual({ ok: true, echo: 'hello' });
    expect(toolComplete.durationMs).toBeGreaterThanOrEqual(0);
    expect(toolComplete.runId).toBe(toolStart.runId);

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success');
    expect(done.totals.toolCalls).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 + RESOLVED-1 — multi-tool sequencial (não paralelo)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — multi-tool sequencial (RESOLVED-1)', () => {
  it('executa 2 tools SEQUENCIALMENTE: tool2.start >= tool1.end (zero overlap)', async () => {
    const log: Array<{ name: string; start: number; end: number }> = [];
    toolRegistry.register(createTimedTool('tool_calendar', 'calendar', 30, log) as ToolDefinition);
    toolRegistry.register(createTimedTool('tool_finance', 'finance', 30, log) as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.twoTools);

    // Sequencialidade: encontrar tools no log e validar ordem
    const calendar = log.find((l) => l.name === 'tool_calendar');
    const finance = log.find((l) => l.name === 'tool_finance');
    expect(calendar).toBeDefined();
    expect(finance).toBeDefined();
    if (!calendar || !finance) return;
    // RESOLVED-1: paralelismo proibido
    expect(finance.start).toBeGreaterThanOrEqual(calendar.end);

    // Ordem dos tool_complete corresponde à ordem dos tool_use do Sonnet
    const completes = events.filter(
      (e): e is Extract<ExecutorSSEEvent, { type: 'tool_complete' }> => e.type === 'tool_complete'
    );
    expect(completes).toHaveLength(2);
    expect(completes[0].toolName).toBe('tool_calendar');
    expect(completes[1].toolName).toBe('tool_finance');

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success');
    expect(done.intents).toEqual(['calendar', 'finance']);
    expect(done.totals.toolCalls).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 + AC7 — MAX_TOOL_ITERATIONS guard
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — MAX_TOOL_ITERATIONS guard', () => {
  it('para ao atingir MAX_TOOL_ITERATIONS e emite tool_error loop_guard antes de done partial', async () => {
    const tool = defineTool({
      name: 'tool_test_loop',
      description: 'Tool que sempre dispara loop',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({ ok: true }),
    });
    toolRegistry.register(tool as ToolDefinition);

    // Override para acelerar — limite=2 com mock infinite
    const events = await collectEvents(MOCK_PROMPTS.infiniteLoop, {
      maxToolIterations: 2,
    });

    const guardError = events.find(
      (e) => e.type === 'tool_error' && e.toolName === 'loop_guard'
    );
    expect(guardError).toBeDefined();
    if (guardError?.type !== 'tool_error') throw new Error();
    expect(guardError.error).toMatch(/limite de iterações atingido/);

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');

    // loop_guard precede done
    const guardIdx = events.findIndex(
      (e) => e.type === 'tool_error' && e.toolName === 'loop_guard'
    );
    const doneIdx = events.length - 1;
    expect(guardIdx).toBeLessThan(doneIdx);
  });

  it('exporta MAX_TOOL_ITERATIONS = 5', () => {
    expect(MAX_TOOL_ITERATIONS).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — tool não registada (fail-loud sem abortar loop)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — tool não registada', () => {
  it('emite tool_error e continua loop quando tool não está registada', async () => {
    // Não registamos a tool 'tool_inexistente_xyz' que o handler MSW invoca
    const events = await collectEvents(MOCK_PROMPTS.badToolName);

    const errors = events.filter((e) => e.type === 'tool_error');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    const unknownToolErr = errors.find(
      (e) => e.type === 'tool_error' && /não registada/.test(e.error)
    );
    expect(unknownToolErr).toBeDefined();

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — args validation fail-loud
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — args validation', () => {
  it('emite tool_error com mensagem PT-PT quando Zod parse falha', async () => {
    // Schema requer string, mock injecta number
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool de teste com args strict',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({ ok: true }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.badArgs);

    const argsErr = events.find(
      (e) => e.type === 'tool_error' && /args inválidos/i.test(e.error)
    );
    expect(argsErr).toBeDefined();
    if (argsErr?.type !== 'tool_error') throw new Error();
    expect(argsErr.toolName).toBe('tool_test_one');

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 + SF-1 — try/finally garante done emitido em error path
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — error path emite done (SF-1)', () => {
  it('classifier falha: emite tool_error executor + done failed antes de re-throw', async () => {
    const { events, error } = await collectEventsExpectingThrow(
      MOCK_PROMPTS.classifierFail
    );

    expect(error).toBeInstanceOf(Error);

    // tool_error executor emitido
    const execErr = events.find(
      (e) => e.type === 'tool_error' && e.toolName === 'executor'
    );
    expect(execErr).toBeDefined();

    // done emitido (SF-1) antes do throw
    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('failed');
    expect(done.errorMessage).toBeDefined();
    expect(done.intents).toEqual([]);
    expect(done.inputTokens).toBe(0);
    expect(done.outputTokens).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC12 — Edge runtime safety (verificável estaticamente via leitura source)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Edge runtime safety (AC12)', () => {
  it('executor.ts NÃO importa @/lib/db/client em runtime (apenas import type)', () => {
    const executorPath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      'lib',
      'agent',
      'executor.ts'
    );
    const source = readFileSync(executorPath, 'utf-8');

    // import type não conta — `import type` é apagado no compile
    // Pesquisar por imports runtime (sem `type`) de @/lib/db/client
    const runtimeDbImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
    expect(source).not.toMatch(runtimeDbImport);

    // Story 1.11 (ADR-9, A1): o executor passou a correr CLIENT-SIDE (browser).
    // `@vercel/kv` NÃO corre no browser — o import de valor no topo do módulo
    // explodiria o bundle client. Por isso o `kv` passou a ser INJECTÁVEL via
    // `RunAgentOpts.kv` (server injecta o adapter; client injecta nada → noKvStub).
    // Esta asserção foi INVERTIDA face à Story 1.7: o executor agora NÃO importa
    // `@vercel/kv` como valor. (Pré-1.11 importava-o; pré-1.7 rejeitava qualquer
    // import — a história deste teste documenta a evolução da fronteira Edge.)
    const vercelKvImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@vercel\/kv['"]/m;
    expect(source).not.toMatch(vercelKvImport);

    // Zero Node-only APIs
    expect(source).not.toMatch(/from\s+['"]fs['"]/);
    expect(source).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(source).not.toMatch(/from\s+['"]child_process['"]/);
    // Match invocação real (`createHmac(...`) — não a referência em JSDoc
    expect(source).not.toMatch(/createHmac\s*\(/);
  });

  it('ctx.db é null e ctx.kv é o singleton @vercel/kv durante execução de tool', async () => {
    let capturedDb: unknown = 'unset';
    let capturedKv: unknown = 'unset';
    let capturedUserId: unknown = 'unset';
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool que captura ctx',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async (_args, ctx) => {
        capturedDb = ctx.db;
        capturedKv = ctx.kv;
        capturedUserId = ctx.userId;
        return { ok: true };
      },
    });
    toolRegistry.register(tool as ToolDefinition);

    await collectEvents(MOCK_PROMPTS.oneToolUse);

    // Story 1.7: db continua null (RESOLVED-2 Story 1.5 — Dexie é client-side),
    // mas kv é agora o singleton real (mockado neste test file). Tool tem
    // `reversible: false` portanto `registerUndoEntry` não é chamado neste run.
    expect(capturedDb).toBeNull();
    expect(capturedKv).toBeDefined();
    expect(capturedKv).not.toBeNull();
    // Singleton do `@vercel/kv` (real ou mock) expõe pelo menos get/set/del
    expect(typeof (capturedKv as { set?: unknown }).set).toBe('function');
    expect(typeof (capturedKv as { get?: unknown }).get).toBe('function');
    expect(typeof (capturedKv as { del?: unknown }).del).toBe('function');
    expect(capturedUserId).toBe('eurico');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — getToolsForDomains: meta sempre + dedup
// ─────────────────────────────────────────────────────────────────────────────

describe('getToolsForDomains', () => {
  it('retorna [] quando registry vazio', () => {
    const result = _getToolsForDomains([]);
    expect(result).toEqual([]);
  });

  it('inclui sempre tools de domain "meta" mesmo que não esteja em domains', () => {
    const metaTool = defineTool({
      name: 'tool_meta_consultar',
      description: 'Meta tool',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({}).passthrough(),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({}),
    });
    const tasksTool = defineTool({
      name: 'tool_tasks_criar',
      description: 'Tasks tool',
      domain: 'tasks',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({}).passthrough(),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({}),
    });
    toolRegistry.register(metaTool as ToolDefinition);
    toolRegistry.register(tasksTool as ToolDefinition);

    const result = _getToolsForDomains(['tasks']);
    const names = result.map((t) => t.name);
    expect(names).toContain('tool_meta_consultar');
    expect(names).toContain('tool_tasks_criar');
  });

  it('desduplicar quando "meta" também está em domains', () => {
    const metaTool = defineTool({
      name: 'tool_meta_consultar',
      description: 'Meta tool',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({}).passthrough(),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({}),
    });
    toolRegistry.register(metaTool as ToolDefinition);

    const result = _getToolsForDomains(['meta', 'meta']);
    const names = result.map((t) => t.name);
    const occurrences = names.filter((n) => n === 'tool_meta_consultar').length;
    expect(occurrences).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — sequential append-friendly contract (Story 1.1)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Story 1.1 appendToolCall contract', () => {
  it('cada tool_complete carrega payload completo (runId, toolName, args, result, durationMs)', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool single',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: false,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);

    const completes = events.filter(
      (e): e is Extract<ExecutorSSEEvent, { type: 'tool_complete' }> => e.type === 'tool_complete'
    );
    expect(completes).toHaveLength(1);

    const c = completes[0];
    // Story 1.1 appendToolCall(runId, toolCall) — todos os campos requeridos:
    expect(c.runId).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.toolName).toBe('tool_test_one');
    expect(c.args).toBeDefined();
    expect(c.result).toBeDefined();
    expect(typeof c.durationMs).toBe('number');
    expect(c.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NFR11 — logger não loga userPrompt nem rawResponse em claro
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — NFR11 logger guard', () => {
  it('console.info e console.error não recebem o userPrompt em claro', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await collectEvents(MOCK_PROMPTS.textOnly);

      const allCalls = [...infoSpy.mock.calls, ...errorSpy.mock.calls];
      for (const call of allCalls) {
        const serialised = call.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join(' ');
        // userPrompt completo NÃO deve aparecer
        expect(serialised).not.toContain(MOCK_PROMPTS.textOnly);
      }
    } finally {
      infoSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CodeRabbit Iter 2 #3 — ContentBlock[] ordem preservada (Story 1.8 contract)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Iter 3 fix #3: ContentBlock[] ordem preservada', () => {
  it('histórico do follow-up turn contém [text, tool_use] na ordem em que o SDK os emitiu', async () => {
    // Captura body de TODAS as requests POST /v1/messages com `stream === true`
    const streamingBodies: Array<{
      messages: Array<{ role: string; content: unknown }>;
    }> = [];

    server.use(
      http.post(
        'https://api.anthropic.com/v1/messages',
        async ({ request }) => {
          const cloned = request.clone();
          try {
            const body = (await cloned.json()) as {
              stream?: boolean;
              messages: Array<{ role: string; content: unknown }>;
            };
            if (body.stream === true) {
              streamingBodies.push({ messages: body.messages });
            }
          } catch {
            // ignore non-JSON
          }
          // Passthrough — deixa o handler default responder
          return undefined;
        }
      )
    );

    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool de teste',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({ ok: true }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.textThenToolUse);

    // Sanity: tool foi executada
    const completes = events.filter((e) => e.type === 'tool_complete');
    expect(completes).toHaveLength(1);
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error('done not found');
    expect(done.status).toBe('success');

    // Pelo menos 2 requests streaming (turn 1 + follow-up)
    expect(streamingBodies.length).toBeGreaterThanOrEqual(2);

    const followUp = streamingBodies[1];
    // Estrutura esperada: [user, assistant(content=ContentBlock[]), tool(result)]
    expect(followUp.messages.length).toBeGreaterThanOrEqual(3);

    const assistantMsg = followUp.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    if (!assistantMsg) throw new Error('assistant message missing');

    // CONTRACT (Story 1.8 Anthropic API): assistant.content é ContentBlock[]
    expect(Array.isArray(assistantMsg.content)).toBe(true);
    const blocks = assistantMsg.content as Array<{ type: string; [k: string]: unknown }>;

    // Ordem do mock handler: text emitido ANTES de tool_use →
    // assistant.content deve preservar ordem `text → tool_use`
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0].type).toBe('text');
    expect(blocks[blocks.length - 1].type).toBe('tool_use');

    // Validar text content
    const textBlock = blocks[0] as { type: 'text'; text: string };
    expect(textBlock.text).toContain('Vou criar essa tarefa');

    // Validar tool_use content
    const toolUseBlock = blocks[blocks.length - 1] as {
      type: 'tool_use';
      id: string;
      name: string;
      input: unknown;
    };
    expect(toolUseBlock.id).toBe('toolu_text_then_01');
    expect(toolUseBlock.name).toBe('tool_test_one');
  });

  it('text-only turn (sem tool_use) preserva fallback `content: string`', async () => {
    // Capture follow-up of TWO_TOOLS to confirm assistant content for tool_use
    // turns is array; this test confirms text-only fallback path remains string
    // (regression guard — não regrida para array a uma mensagem text-only).
    const streamingBodies: Array<{
      messages: Array<{ role: string; content: unknown }>;
    }> = [];

    server.use(
      http.post(
        'https://api.anthropic.com/v1/messages',
        async ({ request }) => {
          const cloned = request.clone();
          try {
            const body = (await cloned.json()) as {
              stream?: boolean;
              messages: Array<{ role: string; content: unknown }>;
            };
            if (body.stream === true) {
              streamingBodies.push({ messages: body.messages });
            }
          } catch {
            // ignore
          }
          return undefined;
        }
      )
    );

    await collectEvents(MOCK_PROMPTS.textOnly);

    // text_only só tem 1 request (sem follow-up) — não há assistant message
    // no histórico para verificar. Verificar que o `user` original é string.
    expect(streamingBodies.length).toBeGreaterThanOrEqual(1);
    const turn1 = streamingBodies[0];
    const userMsg = turn1.messages.find((m) => m.role === 'user');
    expect(userMsg).toBeDefined();
    expect(typeof userMsg?.content).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CodeRabbit Iter 2 #1 — catch around tool.execute → toolUseProcessed: false
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Iter 3 fix #1: tool.execute throw não conta para totals.toolCalls', () => {
  it('tool.execute lança → tool_error emitido + done.totals.toolCalls === 0', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool que lança',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async () => {
        throw new Error('falha simulada na execução');
      },
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);

    // tool_error emitido com a mensagem PT-PT do executor
    const execErr = events.find(
      (e) => e.type === 'tool_error' && /tool_test_one.*falhou/.test(e.error)
    );
    expect(execErr).toBeDefined();

    // tool_complete NÃO foi emitido (execute lançou antes)
    const completes = events.filter((e) => e.type === 'tool_complete');
    expect(completes).toHaveLength(0);

    // CONTRACT (AC8 — toolUseProcessed semantic):
    // tool.execute throw NÃO conta para totals.toolCalls — sem ToolCall
    // payload completo a persistir, o counter manteria-se a 0.
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error('done not found');
    expect(done.totals.toolCalls).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CodeRabbit Iter 2 #2 — provider error: status='failed' + dedup tool_error
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Iter 3 fix #2: provider error → status failed + tool_error único', () => {
  it('stream malformado (provider yield error + throw) → status failed + UM tool_error', async () => {
    // Sem tools registadas — o erro vem do provider (input_json_delta inválido).
    // Provider emite `error event` (handler executor → tool_error) + `throw`
    // (catch externo do loop → seria 2º tool_error sem fix dedup Iter 3).
    //
    // SDK errors são capturados pelo catch externo do loop (linha 564-578),
    // que NÃO re-throws — apenas marca hadFatalError + break. Por isso runAgent
    // termina normalmente com `done failed`, não throws para o caller.
    // (Diferente de classifier failures que SIM re-throw via outer catch.)
    const events = await collectEvents(MOCK_PROMPTS.providerError);

    // CONTRACT (Iter 2 #2 dedup):
    // Antes do fix Iter 3: 2 tool_error events para o mesmo incidente
    // (handler interno emitia 1 via fatalError path + catch externo emitia
    // outro). Após fix: APENAS 1 tool_error (path do provider).
    const errors = events.filter((e) => e.type === 'tool_error');
    expect(errors).toHaveLength(1);

    // CONTRACT (Iter 2 #2 status):
    // Provider error sem tool_complete bem-sucedido → status === 'failed'
    // (não 'partial' como antes do fix Iter 3).
    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
    if (done?.type !== 'done') throw new Error('done not found');
    expect(done.status).toBe('failed');
    expect(done.totals.toolCalls).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Story 1.6 — Preview gate (AC1-AC8)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: regista uma tool de teste para o gate de preview com config flexível.
 *
 * @param domain - Domínio da tool (`'tasks'` para LOW_CONFIDENCE/BOTH;
 *   `'meta'` para REQUIRES_PREVIEW puro).
 * @param requiresPreview - Flag que activa gate independentemente de confidence.
 * @param onExecute - Spy opcional invocado dentro de `execute`.
 */
function registerPreviewTool(
  domain: 'tasks' | 'meta',
  requiresPreview: boolean,
  onExecute?: () => void
): void {
  const tool = defineTool({
    name: 'tool_preview',
    description: 'Tool de teste preview gate',
    domain,
    argsSchema: z.object({ titulo: z.string() }),
    resultSchema: z.object({ ok: z.boolean() }),
    requiresPreview,
    reversible: false,
    execute: async () => {
      onExecute?.();
      return { ok: true };
    },
  });
  toolRegistry.register(tool as ToolDefinition);
}

describe('runAgent — Story 1.6: PREVIEW_CONFIDENCE_THRESHOLD export', () => {
  it('exporta PREVIEW_CONFIDENCE_THRESHOLD = 0.7 (AC1)', () => {
    expect(PREVIEW_CONFIDENCE_THRESHOLD).toBe(0.7);
  });
});

describe('runAgent — Story 1.6: gate por confidence baixa (AC2)', () => {
  it('confidence < 0.7 dispara preview_request com reason=low_confidence + auto-confirm executa tool', async () => {
    let executed = false;
    registerPreviewTool('tasks', false, () => {
      executed = true;
    });

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence);

    // preview_request emitido com payload completo
    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();
    if (previewReq?.type !== 'preview_request') throw new Error();
    expect(previewReq.toolName).toBe('tool_preview');
    expect(previewReq.reason).toBe('low_confidence');
    expect(previewReq.confidence).toBe(0.55);
    expect(previewReq.domain).toBe('tasks');
    expect(previewReq.args).toEqual({ titulo: 'comprar pão' });

    // preview_confirmed com action=confirm (auto-confirm default)
    const previewConfirmed = events.find((e) => e.type === 'preview_confirmed');
    expect(previewConfirmed).toBeDefined();
    if (previewConfirmed?.type !== 'preview_confirmed') throw new Error();
    expect(previewConfirmed.action).toBe('confirm');
    expect(previewConfirmed.toolName).toBe('tool_preview');

    // Tool foi executada
    expect(executed).toBe(true);

    // Ordem: preview_request → preview_confirmed → tool_complete
    const reqIdx = events.findIndex((e) => e.type === 'preview_request');
    const confirmIdx = events.findIndex((e) => e.type === 'preview_confirmed');
    const completeIdx = events.findIndex((e) => e.type === 'tool_complete');
    expect(reqIdx).toBeLessThan(confirmIdx);
    expect(confirmIdx).toBeLessThan(completeIdx);

    // done com previewCount=1 e success
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success');
    expect(done.previewCount).toBe(1);
    expect(done.totals.toolCalls).toBe(1);
  });
});

describe('runAgent — Story 1.6: gate por requiresPreview (AC3)', () => {
  it('confidence >= 0.7 mas tool.requiresPreview=true dispara preview_request com reason=requires_preview', async () => {
    let executed = false;
    // domain='tasks' alinhado ao MOCK_EXECUTOR_REQUIRES_PREVIEW classifier
    // (intents=['tasks'], confidence={tasks: 0.92}). gate activa só por flag.
    registerPreviewTool('tasks', true, () => {
      executed = true;
    });

    const events = await collectEvents(MOCK_PROMPTS.requiresPreview);

    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();
    if (previewReq?.type !== 'preview_request') throw new Error();
    expect(previewReq.reason).toBe('requires_preview');
    // Confidence omitido quando reason !== low_confidence (AC2 spec)
    expect(previewReq.confidence).toBeUndefined();
    expect(previewReq.domain).toBe('tasks');

    // Auto-confirm executa
    expect(executed).toBe(true);

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(1);
    expect(done.status).toBe('success');
  });
});

describe('runAgent — Story 1.6: gate activado por ambos os triggers (AC3)', () => {
  it('confidence < 0.7 E requiresPreview=true → reason=both com confidence preenchido', async () => {
    registerPreviewTool('tasks', true);

    const events = await collectEvents(MOCK_PROMPTS.bothGates);

    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();
    if (previewReq?.type !== 'preview_request') throw new Error();
    expect(previewReq.reason).toBe('both');
    expect(previewReq.confidence).toBe(0.45);
    expect(previewReq.domain).toBe('tasks');

    // AC5 + AC4: previewCount incrementa uma vez por gate; auto-confirm default
    // produz status=success e preview executado com sucesso (sem provider).
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(1);
    expect(done.status).toBe('success');
  });
});

describe('runAgent — Story 1.6: auto-confirm default preserva Story 1.5 (AC4)', () => {
  it('sem confirmationProvider e sem gates activos → ZERO preview events emitidos', async () => {
    // tool com requiresPreview=false, classifier confidence>=0.7 (oneToolUse usa
    // intents=['meta'], confidence={meta: 0.9} — gate não activa)
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool sem gate',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: false,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);

    // Zero preview events — comportamento Story 1.5 preservado
    expect(events.find((e) => e.type === 'preview_request')).toBeUndefined();
    expect(events.find((e) => e.type === 'preview_confirmed')).toBeUndefined();

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(0);
    expect(done.status).toBe('success');
  });
});

describe('runAgent — Story 1.6: confirmationProvider mock cancel (AC3)', () => {
  it('provider resolve cancel → preview_confirmed{cancel} + tool_error + tool NÃO executa', async () => {
    let executed = false;
    registerPreviewTool('tasks', false, () => {
      executed = true;
    });

    const provider: ConfirmationProvider = {
      requestConfirmation: vi.fn(async () => 'cancel' as const),
    };

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence, {
      confirmationProvider: provider,
    });

    // preview_request emitido
    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();

    // preview_confirmed com action=cancel
    const previewConfirmed = events.find((e) => e.type === 'preview_confirmed');
    expect(previewConfirmed).toBeDefined();
    if (previewConfirmed?.type !== 'preview_confirmed') throw new Error();
    expect(previewConfirmed.action).toBe('cancel');

    // tool_error com mensagem PT-PT canónica
    const toolError = events.find(
      (e) => e.type === 'tool_error' && /Cancelado pelo utilizador/.test(e.error)
    );
    expect(toolError).toBeDefined();

    // Tool NÃO executou
    expect(executed).toBe(false);

    // tool_complete NÃO foi emitido
    const completes = events.filter((e) => e.type === 'tool_complete');
    expect(completes).toHaveLength(0);

    // done com previewCount=1, status=partial, totals.toolCalls=0
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(1);
    expect(done.status).toBe('partial');
    expect(done.totals.toolCalls).toBe(0);

    // Provider foi invocado com runId + toolName
    expect(provider.requestConfirmation).toHaveBeenCalledTimes(1);
    expect(provider.requestConfirmation).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]{36}$/),
      'tool_preview'
    );
  });
});

describe('runAgent — Story 1.6: confirmationProvider mock confirm (AC3)', () => {
  it('provider resolve confirm → fluxo igual a auto-confirm (tool executa)', async () => {
    let executed = false;
    registerPreviewTool('tasks', false, () => {
      executed = true;
    });

    const provider: ConfirmationProvider = {
      requestConfirmation: vi.fn(async () => 'confirm' as const),
    };

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence, {
      confirmationProvider: provider,
    });

    const previewConfirmed = events.find((e) => e.type === 'preview_confirmed');
    expect(previewConfirmed).toBeDefined();
    if (previewConfirmed?.type !== 'preview_confirmed') throw new Error();
    expect(previewConfirmed.action).toBe('confirm');

    expect(executed).toBe(true);

    // Simetria com cancel test (L1019): valida que provider foi consultado
    // exactamente uma vez antes do tool.execute().
    expect(provider.requestConfirmation).toHaveBeenCalledTimes(1);

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(1);
    expect(done.status).toBe('success');
    expect(done.totals.toolCalls).toBe(1);
  });
});

describe('runAgent — Story 1.6: confirmationProvider lança erro (AC6)', () => {
  it('provider rejeita Promise → tool_error executor + tool NÃO executa + status partial', async () => {
    let executed = false;
    registerPreviewTool('tasks', false, () => {
      executed = true;
    });

    const provider: ConfirmationProvider = {
      requestConfirmation: vi.fn(async () => {
        throw new Error('falha de coordenação KV');
      }),
    };

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence, {
      confirmationProvider: provider,
    });

    // preview_request foi emitido
    expect(events.find((e) => e.type === 'preview_request')).toBeDefined();

    // preview_confirmed NÃO emitido (provider falhou antes de resolver)
    expect(events.find((e) => e.type === 'preview_confirmed')).toBeUndefined();

    // tool_error com mensagem PT-PT incluindo a causa do provider
    const toolError = events.find(
      (e) => e.type === 'tool_error' && /provider de confirmação falhou/i.test(e.error)
    );
    expect(toolError).toBeDefined();

    expect(executed).toBe(false);

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');
    expect(done.previewCount).toBe(1);
    expect(done.totals.toolCalls).toBe(0);
  });
});

describe('runAgent — Story 1.6: previewCount counter (AC5)', () => {
  it('run sem gate activado → done.previewCount === 0', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool sem gate',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: false,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(0);
  });

  it('text-only run sem tools → done.previewCount === 0', async () => {
    const events = await collectEvents(MOCK_PROMPTS.textOnly);
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.previewCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CodeRabbit Iter 1 fix #1 — preview_request usa validatedArgs (pós-Zod)
// em vez de event.input (raw do SDK)
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — CR Iter 1 fix #1: preview_request reflecte args validados', () => {
  it('schema com default → preview_request.args mostra payload pós-validação (com default aplicado)', async () => {
    // ToolDefinition exige `argsSchema` ser z.ZodObject (não permite .transform
    // no top-level). Usamos um campo OPCIONAL com `.default()` que o Zod
    // injecta durante `.parse()`. O mock MSW emite apenas
    // `{"titulo":"comprar pão"}` como `tool_use.input` (sem `prioridade`).
    // O schema injecta `prioridade: 'normal'` por default. Antes do fix #1,
    // `preview_request.args === event.input` mostrava SEM prioridade. Após
    // fix #1, mostra a payload PÓS-validação que será de facto passada a
    // `tool.execute()` (com prioridade preenchida).
    let executedArgs: unknown = null;
    const tool = defineTool({
      name: 'tool_preview',
      description: 'Tool com schema default',
      domain: 'tasks',
      argsSchema: z.object({
        titulo: z.string(),
        prioridade: z.string().default('normal'),
      }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async (args: { titulo: string; prioridade: string }) => {
        executedArgs = args;
        return { ok: true };
      },
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence);

    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();
    if (previewReq?.type !== 'preview_request') throw new Error();

    // CORE assertion #1: preview_request.args inclui o campo `prioridade`
    // injectado pelo `.default()` do Zod (prova de que veio do parse, não
    // do event.input raw que NÃO tinha esse campo).
    expect(previewReq.args).toEqual({ titulo: 'comprar pão', prioridade: 'normal' });

    // CORE assertion #2: tool.execute recebeu exactamente os mesmos args
    // que estavam no preview_request (regra de correctness do fix #1 —
    // utilizador confirma X e executor corre X).
    expect(executedArgs).toEqual({ titulo: 'comprar pão', prioridade: 'normal' });

    // tool_complete está presente (auto-confirm)
    const complete = events.find((e) => e.type === 'tool_complete');
    expect(complete).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CodeRabbit Iter 1 fix #2 — toolUseSeen desacoplado de toolUseProcessed
// permite que o tool_result enfileirado seja injectado no histórico mesmo
// quando a tool não foi executada (preview cancel, provider error, etc.).
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — CR Iter 1 fix #2: tool_result injectado em error branches permite follow-up turn', () => {
  it('preview cancel → loop continua para 2ª iteração e modelo emite text_delta de follow-up', async () => {
    // Após cancel, o `tool_result` com `error: 'Cancelado pelo utilizador'`
    // tem de ser injectado no histórico. Sem fix #2, `toolUseProcessed: false`
    // levaria `toolUsesInThisIteration === 0` e o loop quebrava ANTES de
    // injectar — modelo nunca via o resultado e a 2ª iteração nunca corria.
    //
    // O mock MSW para LOW_CONFIDENCE tem 2 turnos:
    //   turn 1 (isFollowUp=false): emite tool_use 'tool_preview'
    //   turn 2 (isFollowUp=true):  emite text 'Acção concluída.' + end_turn
    //
    // Após o fix, com cancel: o loop deve injectar o tool_result e fazer turn 2.
    // Resultado observável: o evento `text_delta` 'Acção concluída.' é emitido,
    // provando que o follow-up turn correu.
    registerPreviewTool('tasks', false);

    const provider: ConfirmationProvider = {
      requestConfirmation: vi.fn(async () => 'cancel' as const),
    };

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence, {
      confirmationProvider: provider,
    });

    // 1. preview_request emitido
    expect(events.find((e) => e.type === 'preview_request')).toBeDefined();

    // 2. preview_confirmed{cancel} emitido
    const cancelled = events.find((e) => e.type === 'preview_confirmed');
    if (cancelled?.type !== 'preview_confirmed') throw new Error();
    expect(cancelled.action).toBe('cancel');

    // 3. tool_error 'Cancelado pelo utilizador' emitido
    expect(
      events.find(
        (e) => e.type === 'tool_error' && /Cancelado pelo utilizador/.test(e.error)
      )
    ).toBeDefined();

    // 4. CORE assertion #2: text_delta da 2ª iteração foi recebido
    //    (sem fix, o loop quebrava após cancel e turn 2 nunca corria)
    const followUpText = events
      .filter((e) => e.type === 'text_delta')
      .map((e) => (e.type === 'text_delta' ? e.delta : ''))
      .join('');
    expect(followUpText).toContain('Acção concluída.');

    // 5. done.status === 'partial' (cancel marca errorEmitted=true)
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');
    expect(done.previewCount).toBe(1);
    expect(done.totals.toolCalls).toBe(0); // tool nunca executou

    // 6. Token deltas da 2ª iteração foram acumulados (output > 0 prova
    //    que o text_delta de turn 2 chegou ao token accounting)
    expect(done.outputTokens).toBeGreaterThan(0);
  });

  it('provider rejeita Promise → loop continua para 2ª iteração após injectar tool_result de erro', async () => {
    // Mesmo cenário do test acima, mas com provider que rejeita em vez
    // de retornar 'cancel'. Path interno é diferente (catch block dentro
    // do gate) mas o efeito esperado é idêntico: tool_result enfileirado
    // + loop continua → text_delta de turn 2 recebido.
    registerPreviewTool('tasks', false);

    const provider: ConfirmationProvider = {
      requestConfirmation: vi.fn(async () => {
        throw new Error('falha de coordenação KV');
      }),
    };

    const events = await collectEvents(MOCK_PROMPTS.lowConfidence, {
      confirmationProvider: provider,
    });

    // tool_error emitido
    expect(
      events.find(
        (e) => e.type === 'tool_error' && /provider de confirmação falhou/i.test(e.error)
      )
    ).toBeDefined();

    // CORE assertion: 2ª iteração correu (text_delta presente)
    const followUpText = events
      .filter((e) => e.type === 'text_delta')
      .map((e) => (e.type === 'text_delta' ? e.delta : ''))
      .join('');
    expect(followUpText).toContain('Acção concluída.');

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('partial');
    expect(done.previewCount).toBe(1);
    expect(done.totals.toolCalls).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Story 1.7 — undo registration
// ─────────────────────────────────────────────────────────────────────────────

describe('runAgent — Story 1.7 undo registration (Story 1.11: undoStore injectável)', () => {
  // Story 1.11 (ADR-9, A1+A4): o executor deixou de chamar `kv.set` directamente
  // — o undo é agora INJECTADO via `RunAgentOpts.undoStore`. Server injecta o
  // adapter KV; client injecta no-op (Phase 1) / store in-memory (Phase 2). Estes
  // testes exercitam o contrato injectável com um `undoStore` mock, em vez de
  // espiar o singleton `@vercel/kv` (que já não está no caminho do executor).
  let undoRegister: ReturnType<typeof vi.fn>;
  let undoStore: { register: typeof undoRegister };

  beforeEach(() => {
    undoRegister = vi.fn().mockResolvedValue(undefined);
    undoStore = { register: undoRegister };
  });

  it('chama undoStore.register e emite undo_registered após tool reversível bem-sucedida', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool reversível de teste',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: true,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse, { undoStore });

    // undoStore.register chamado com (runId, reversibleToolCalls).
    expect(undoRegister).toHaveBeenCalledTimes(1);
    const [runIdArg, toolCallsArg] = undoRegister.mock.calls[0];
    expect(runIdArg).toMatch(/^[0-9a-f-]{36}$/);
    expect(toolCallsArg).toMatchObject([
      {
        toolName: 'tool_test_one',
        args: { x: 'hello' },
        result: { ok: true, echo: 'hello' },
        durationMs: expect.any(Number),
        reverted: false,
      },
    ]);

    // undo_registered event emitido ANTES de done
    const undoRegistered = events.find((e) => e.type === 'undo_registered');
    expect(undoRegistered).toBeDefined();
    if (undoRegistered?.type !== 'undo_registered') throw new Error();
    expect(undoRegistered.undoableToolCount).toBe(1);
    expect(undoRegistered.expiresAt).toBeGreaterThan(Date.now());

    const undoIdx = events.findIndex((e) => e.type === 'undo_registered');
    const doneIdx = events.findIndex((e) => e.type === 'done');
    expect(undoIdx).toBeLessThan(doneIdx);
  });

  it('Phase 1: sem undoStore injectado → undo desactivado (no-op), done na mesma', async () => {
    // Story 1.11: o caminho client Phase 1 NÃO injecta undoStore — o undo fica
    // desactivado mas o run completa normalmente (AC8 é Phase 2).
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool reversível sem store',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: true,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse);

    expect(events.find((e) => e.type === 'undo_registered')).toBeUndefined();
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success');
  });

  it('NÃO chama undoStore.register quando tool tem reversible: false', async () => {
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool não reversível',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: false,
      execute: async () => ({ ok: true }),
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse, { undoStore });

    expect(undoRegister).not.toHaveBeenCalled();
    expect(events.find((e) => e.type === 'undo_registered')).toBeUndefined();

    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success');
  });

  it('NÃO chama undoStore.register quando done.status === failed (classifier falha)', async () => {
    // Classifier falha → status 'failed' → NÃO regista undo
    // (mesmo que houvesse tool reversível registada — não chega ao loop)
    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool reversível',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool as ToolDefinition);

    const { events } = await collectEventsExpectingThrow(
      MOCK_PROMPTS.classifierFail,
      { undoStore }
    );

    expect(undoRegister).not.toHaveBeenCalled();
    expect(events.find((e) => e.type === 'undo_registered')).toBeUndefined();

    const done = events.find((e) => e.type === 'done');
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('failed');
  });

  it('emite done mesmo quando undoStore.register lança (best-effort)', async () => {
    undoRegister.mockRejectedValueOnce(new Error('KV connection refused'));

    const tool = defineTool({
      name: 'tool_test_one',
      description: 'Tool reversível',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean(), echo: z.string() }),
      requiresPreview: false,
      reversible: true,
      execute: async (args: { x: string }) => ({ ok: true, echo: args.x }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool as ToolDefinition);

    const events = await collectEvents(MOCK_PROMPTS.oneToolUse, { undoStore });

    // tool_error com toolName 'undo_register' emitido (observability)
    const undoErr = events.find(
      (e) => e.type === 'tool_error' && e.toolName === 'undo_register'
    );
    expect(undoErr).toBeDefined();
    if (undoErr?.type !== 'tool_error') throw new Error();
    expect(undoErr.error).toMatch(/KV connection refused/);

    // undo_registered NÃO emitido (register falhou)
    expect(events.find((e) => e.type === 'undo_registered')).toBeUndefined();

    // done EMITIDO (best-effort: store down não bloqueia o run)
    const done = events.at(-1);
    if (done?.type !== 'done') throw new Error();
    expect(done.status).toBe('success'); // tool executou OK; só undo registration falhou
    expect(done.totals.toolCalls).toBe(1);
  });
});
