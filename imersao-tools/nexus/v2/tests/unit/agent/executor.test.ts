import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { server } from '@/tests/mocks/server';
import {
  MAX_TOOL_ITERATIONS,
  runAgent,
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

    // Zero imports de @vercel/kv (Story 1.7)
    const vercelKvImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@vercel\/kv['"]/m;
    expect(source).not.toMatch(vercelKvImport);

    // Zero Node-only APIs
    expect(source).not.toMatch(/from\s+['"]fs['"]/);
    expect(source).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(source).not.toMatch(/from\s+['"]child_process['"]/);
    // Match invocação real (`createHmac(...`) — não a referência em JSDoc
    expect(source).not.toMatch(/createHmac\s*\(/);
  });

  it('ctx.db e ctx.kv são null durante execução de tool', async () => {
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

    expect(capturedDb).toBeNull();
    expect(capturedKv).toBeNull();
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
