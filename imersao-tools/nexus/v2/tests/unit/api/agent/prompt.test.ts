import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';

/**
 * Story 1.8 — `POST /api/agent/prompt` endpoint tests (AC10).
 *
 * Cobre:
 *   - Happy path: 200 + SSE stream com eventos meta, done
 *   - 400 se body inválido (prompt vazio)
 *   - 401 se sessão ausente
 *   - SSE stream termina com `data: [DONE]\n\n`
 *   - `done` event tem shape canónico (intents, inputTokens, outputTokens,
 *     totals: { intents, toolCalls }, durationMs) — sem campos `toolCallCount`
 *   - Logger invocado com `promptHash` (não prompt cru) — NFR11
 *   - Test estático AC1: route.ts NÃO importa fs/child_process e tem
 *     `runtime = 'edge'`
 *   - Test estático AC9: route.ts NÃO importa `@/lib/db/client` em runtime
 *
 * Pattern: `vi.mock('@/lib/agent/executor')` para controlar runAgent yield;
 * `vi.mock('@/lib/auth/session')` para controlar getSession; `vi.mock('@vercel/kv')`
 * para o KvConfirmationProvider injectado.
 *
 * Auth-first ordering (Crit-3 PO Pax): teste explícito de probing 400 sem sessão
 * → confirma que retorna 401, não 400.
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'test-session-id' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

const VALID_RUN_ID = '22222222-2222-4222-8222-222222222222';

// Default mock — pode ser sobrescrito em testes específicos via mockImplementation.
// Aceita args do runAgent (userPrompt, opts) mas ignora-os no default.
const defaultRunAgentMock = vi.fn(
  async function* (
    _userPrompt: string,
    _opts?: unknown
  ): AsyncGenerator<ExecutorSSEEvent> {
    yield {
      type: 'meta',
      phase: 'start',
      runId: VALID_RUN_ID,
      prompt: 'test',
      modelClassifier: 'haiku',
      modelExecutor: 'sonnet',
      startedAt: Date.now(),
      classifierResult: null,
    };
    yield {
      type: 'done',
      runId: VALID_RUN_ID,
      status: 'success',
      intents: ['tasks'],
      inputTokens: 50,
      outputTokens: 20,
      durationMs: 100,
      totals: { intents: 1, toolCalls: 0 },
      previewCount: 0,
    };
  }
);

vi.mock('@/lib/agent/executor', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/agent/executor')>(
      '@/lib/agent/executor'
    );
  return {
    ...actual,
    runAgent: (...args: Parameters<typeof actual.runAgent>) =>
      defaultRunAgentMock(...args),
  };
});

async function callPrompt(
  body: unknown,
  hasCookie = true
): Promise<Response> {
  mockSessionValid = hasCookie;
  const { POST } = await import('@/app/api/agent/prompt/route');

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');

  const req = new Request('http://localhost:3001/api/agent/prompt', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  return POST(req);
}

/**
 * Lê todo o stream SSE e devolve a lista de eventos parseados (sem o terminator
 * `[DONE]`). Cada evento é o objecto JSON dentro de `data: <JSON>\n\n`.
 */
async function readSSEEvents(resp: Response): Promise<{
  events: ExecutorSSEEvent[];
  rawEnd: string;
}> {
  const text = await resp.text();
  const lines = text.split('\n\n').filter((l) => l.length > 0);
  const events: ExecutorSSEEvent[] = [];
  let rawEnd = '';
  for (const line of lines) {
    const stripped = line.replace(/^data: /, '');
    if (stripped === '[DONE]') {
      rawEnd = stripped;
      continue;
    }
    events.push(JSON.parse(stripped) as ExecutorSSEEvent);
  }
  return { events, rawEnd };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  // Reset default mock to canonical shape
  defaultRunAgentMock.mockImplementation(
    async function* (
      _userPrompt: string,
      _opts?: unknown
    ): AsyncGenerator<ExecutorSSEEvent> {
      yield {
        type: 'meta',
        phase: 'start',
        runId: VALID_RUN_ID,
        prompt: 'test',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt: Date.now(),
        classifierResult: null,
      };
      yield {
        type: 'done',
        runId: VALID_RUN_ID,
        status: 'success',
        intents: ['tasks'],
        inputTokens: 50,
        outputTokens: 20,
        durationMs: 100,
        totals: { intents: 1, toolCalls: 0 },
        previewCount: 0,
      };
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth + body validation (auth-first ordering)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/prompt — auth + body validation', () => {
  it('401 quando sessão é inválida', async () => {
    const resp = await callPrompt({ prompt: 'olá' }, false);
    expect(resp.status).toBe(401);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('não_autenticado');
  });

  it('401 PRECEDE 400 — probing com prompt vazio sem sessão retorna 401', async () => {
    // Crit-3 PO Pax: auth-first ordering. Cliente sem sessão NÃO consegue
    // distinguir 400 (body) vs 401 (auth) — protege endpoint de probing.
    const resp = await callPrompt({ prompt: '' }, false);
    expect(resp.status).toBe(401);
  });

  it('400 quando body não é JSON válido', async () => {
    const resp = await callPrompt('not-json', true);
    expect(resp.status).toBe(400);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('prompt_inválido');
  });

  it('400 quando prompt está vazio', async () => {
    const resp = await callPrompt({ prompt: '' });
    expect(resp.status).toBe(400);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('prompt_inválido');
  });

  it('400 quando prompt excede 4000 caracteres', async () => {
    const longPrompt = 'a'.repeat(4001);
    const resp = await callPrompt({ prompt: longPrompt });
    expect(resp.status).toBe(400);
  });

  it('400 quando conversationId não é UUID', async () => {
    const resp = await callPrompt({
      prompt: 'olá',
      conversationId: 'not-a-uuid',
    });
    expect(resp.status).toBe(400);
  });

  it('200 quando body é válido com conversationId válido', async () => {
    const resp = await callPrompt({
      prompt: 'olá',
      conversationId: '33333333-3333-4333-8333-333333333333',
    });
    expect(resp.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path + SSE format
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/prompt — happy path SSE', () => {
  it('200 + Content-Type text/event-stream', async () => {
    const resp = await callPrompt({ prompt: 'amanhã reunião 15h' });
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('text/event-stream');
    expect(resp.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('SSE stream contém eventos meta(start) e done', async () => {
    const resp = await callPrompt({ prompt: 'amanhã reunião 15h' });
    const { events } = await readSSEEvents(resp);

    const metaStart = events.find(
      (e) => e.type === 'meta' && e.phase === 'start'
    );
    expect(metaStart).toBeDefined();

    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
  });

  it('SSE stream termina com data: [DONE]\\n\\n', async () => {
    const resp = await callPrompt({ prompt: 'olá' });
    const { rawEnd } = await readSSEEvents(resp);
    expect(rawEnd).toBe('[DONE]');
  });

  it('done event tem shape canónico (executor.ts L238-255)', async () => {
    const resp = await callPrompt({ prompt: 'criar tarefa' });
    const { events } = await readSSEEvents(resp);

    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();

    if (done && done.type === 'done') {
      // Campos OBRIGATÓRIOS do done event (executor.ts L238-255)
      expect(done.runId).toBeDefined();
      expect(done.status).toBe('success');
      expect(Array.isArray(done.intents)).toBe(true);
      expect(typeof done.inputTokens).toBe('number');
      expect(typeof done.outputTokens).toBe('number');
      expect(typeof done.durationMs).toBe('number');
      // totals com forma canónica
      expect(done.totals).toBeDefined();
      expect(typeof done.totals.intents).toBe('number');
      expect(typeof done.totals.toolCalls).toBe('number');

      // toolCallCount NÃO existe no shape canónico — usar totals.toolCalls
      expect(done).not.toHaveProperty('toolCallCount');
    }
  });

  it('cada evento SSE está no formato data: <JSON>\\n\\n', async () => {
    const resp = await callPrompt({ prompt: 'olá' });
    const text = await resp.text();
    // Cada line termina em \n\n e começa com "data: "
    const blocks = text.split('\n\n').filter((b) => b.length > 0);
    for (const block of blocks) {
      expect(block.startsWith('data: ')).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Telemetria (NFR11) — promptHash em vez de prompt cru
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/prompt — telemetria NFR11', () => {
  it('logger.info invocado com promptHash (não prompt cru)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const PROMPT = 'segredo super sensível que não deve aparecer em logs';
    await callPrompt({ prompt: PROMPT });

    // Confirma que NENHUM log inclui o prompt cru
    const allCalls = infoSpy.mock.calls.flat();
    const allText = JSON.stringify(allCalls);
    expect(allText).not.toContain(PROMPT);

    // Confirma que pelo menos um log inclui promptHash
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('request iniciado'),
      expect.objectContaining({
        promptHash: expect.any(String),
      })
    );

    infoSpy.mockRestore();
  });

  it('logger.info de fim inclui runId, durationMs, intents, status', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const resp = await callPrompt({ prompt: 'amanhã reunião' });
    // Esgotar o stream para forçar o `finally` do ReadableStream a correr.
    await resp.text();

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('request terminado'),
      expect.objectContaining({
        runId: VALID_RUN_ID,
        durationMs: expect.any(Number),
        intents: expect.any(Array),
        status: 'success',
      })
    );

    infoSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Edge runtime safety (estática)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Edge runtime safety', () => {
  it('app/api/agent/prompt/route.ts NÃO importa fs/child_process e configura runtime edge', () => {
    const routePath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'app',
      'api',
      'agent',
      'prompt',
      'route.ts'
    );
    const source = readFileSync(routePath, 'utf-8');

    // Configura runtime edge
    expect(source).toMatch(/export const runtime = ['"]edge['"]/);

    // Zero Node-only APIs
    expect(source).not.toMatch(/from\s+['"]fs['"]/);
    expect(source).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(source).not.toMatch(/from\s+['"]child_process['"]/);
    expect(source).not.toMatch(/createHmac\s*\(/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Sem import @/lib/db/client em runtime (Dexie é client-only, RESOLVED-2)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC9 — Sem Dexie em runtime', () => {
  it('app/api/agent/prompt/route.ts NÃO importa @/lib/db/client em runtime', () => {
    const routePath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'app',
      'api',
      'agent',
      'prompt',
      'route.ts'
    );
    const source = readFileSync(routePath, 'utf-8');

    // Mesmo padrão do test estático Story 1.7 undo (route.test.ts L609-610):
    // apanha runtime imports `import { ... } from '@/lib/db/client'` e exclui
    // o statement-level `import type { ... }`.
    const runtimeDbImport =
      /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
    expect(source).not.toMatch(runtimeDbImport);
  });
});
