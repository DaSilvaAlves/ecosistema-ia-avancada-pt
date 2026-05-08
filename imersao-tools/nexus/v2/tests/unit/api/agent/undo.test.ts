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
import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';

/**
 * Story 1.7 — `POST /api/agent/undo` endpoint tests.
 *
 * Cobre AC6 + AC9 + AC12 (Edge runtime safety):
 *   - 401 sem cookie de sessão
 *   - 410 quando KV retorna null (TTL natural)
 *   - 410 quando entry.expiresAt < Date.now() (defense-in-depth, RESOLVED-2)
 *   - 200 happy path (reverte 2 tools em ordem reversa)
 *   - 200 + errors[] quando 1 de 3 tools falha em reverse
 *   - 200 + errors[] + logger.error quando tool ausente do registry (RESOLVED-6)
 *   - 200 + errors[] + logger.error quando tool.reverse undefined (invariant violation)
 *   - 410 idempotência (2º POST após 1º consumir)
 *   - Edge runtime safety estática (ausência de imports proibidos)
 *
 * Mock pattern `vi.mock('@vercel/kv')` (RESOLVED-1 Architect Aria — alinhado
 * Stories 1.4-1.6). NÃO mockamos `lib/agent/undo.ts` — testamos pelo input/output
 * do endpoint (princípio "do not mock unit under test").
 *
 * Auth mock: `getSession` retorna `valid: true` ou `valid: false` conforme test.
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

// Mock auth — controlado via `mockSession`
let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'test-session-id' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
  buildSessionCookie: vi.fn(),
  buildClearSessionCookie: vi.fn(),
  destroySession: vi.fn(),
  createSession: vi.fn(),
  SESSION_COOKIE: 'nexus_session',
}));

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

const VALID_RUN_ID = '11111111-1111-4111-8111-111111111111';
const NOW = 1700000000000; // epoch fixed for predictable expiresAt

async function callUndo(body: unknown, hasCookie = true): Promise<Response> {
  mockSessionValid = hasCookie;
  const { POST } = await import('@/app/api/agent/undo/route');

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');

  const req = new Request('http://localhost:3001/api/agent/undo', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  toolRegistry.clear();
  kvMock.set.mockResolvedValue('OK');
  kvMock.get.mockResolvedValue(null);
  kvMock.del.mockResolvedValue(0);
  mockSessionValid = true;
});

afterEach(() => {
  vi.useRealTimers();
  toolRegistry.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth + body validation
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/undo — auth + body validation', () => {
  it('401 quando sessão é inválida', async () => {
    const resp = await callUndo({ runId: VALID_RUN_ID }, false);
    expect(resp.status).toBe(401);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('unauthorized');
  });

  it('400 quando body não é JSON válido', async () => {
    const resp = await callUndo('not-json', true);
    expect(resp.status).toBe(400);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('invalid_body');
  });

  it('400 quando runId não é UUID', async () => {
    const resp = await callUndo({ runId: 'not-a-uuid' });
    expect(resp.status).toBe(400);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('invalid_body');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 410 — TTL expired
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/undo — 410 TTL expired', () => {
  it('410 quando KV retorna null (TTL natural)', async () => {
    kvMock.get.mockResolvedValueOnce(null);

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(410);
    const json = (await resp.json()) as { error: string; message: string };
    expect(json.error).toBe('undo_window_expired');
    expect(json.message).toMatch(/Janela de undo \(30s\) expirou/);
  });

  it('410 + del cleanup quando entry.expiresAt < Date.now() (defense-in-depth RESOLVED-2)', async () => {
    // Entry com expiresAt no passado (race window do Upstash TTL)
    const expired = {
      runId: VALID_RUN_ID,
      timestamp: NOW - 35000,
      toolCalls: [],
      expiresAt: NOW - 1000, // já expirado
    };
    kvMock.get.mockResolvedValueOnce(expired);

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(410);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('undo_window_expired');

    // Cleanup defense-in-depth: entry vencida foi apagada
    expect(kvMock.del).toHaveBeenCalledWith(
      `nexus:undo:run:${VALID_RUN_ID}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 200 — happy path: 2 tools revertidas em ordem reversa
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/undo — happy path multi-tool', () => {
  it('200 + reverte 2 tools em ordem reversa + apaga entry', async () => {
    const reverseLog: string[] = [];
    const tool1 = defineTool({
      name: 'tool_alpha',
      description: 'Tool alpha',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => {
        reverseLog.push('tool_alpha');
      },
    });
    const tool2 = defineTool({
      name: 'tool_beta',
      description: 'Tool beta',
      domain: 'meta',
      argsSchema: z.object({ y: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => {
        reverseLog.push('tool_beta');
      },
    });
    toolRegistry.register(tool1 as ToolDefinition);
    toolRegistry.register(tool2 as ToolDefinition);

    kvMock.get.mockResolvedValueOnce({
      runId: VALID_RUN_ID,
      timestamp: NOW - 5000,
      expiresAt: NOW + 25000,
      toolCalls: [
        {
          toolName: 'tool_alpha',
          args: { x: 'a' },
          result: { ok: true },
          durationMs: 5,
          reverted: false,
        },
        {
          toolName: 'tool_beta',
          args: { y: 'b' },
          result: { ok: true },
          durationMs: 7,
          reverted: false,
        },
      ],
    });

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      reverted: number;
      errors: Array<{ toolName: string; message: string }>;
    };
    expect(json.reverted).toBe(2);
    expect(json.errors).toEqual([]);

    // Ordem reversa: tool_beta primeiro, depois tool_alpha
    expect(reverseLog).toEqual(['tool_beta', 'tool_alpha']);

    // Entry apagada após processamento
    expect(kvMock.del).toHaveBeenCalledWith(
      `nexus:undo:run:${VALID_RUN_ID}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 200 + errors[] partial failures
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/undo — partial errors', () => {
  it('200 + errors[] quando 1 de 3 tools falha em reverse', async () => {
    const tool1 = defineTool({
      name: 'tool_ok_a',
      description: 'OK a',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => undefined,
    });
    const tool2 = defineTool({
      name: 'tool_fails',
      description: 'Falha em reverse',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => {
        throw new Error('Tarefa já apagada manualmente');
      },
    });
    const tool3 = defineTool({
      name: 'tool_ok_b',
      description: 'OK b',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool1 as ToolDefinition);
    toolRegistry.register(tool2 as ToolDefinition);
    toolRegistry.register(tool3 as ToolDefinition);

    kvMock.get.mockResolvedValueOnce({
      runId: VALID_RUN_ID,
      timestamp: NOW - 5000,
      expiresAt: NOW + 25000,
      toolCalls: [
        { toolName: 'tool_ok_a', args: {}, result: {}, durationMs: 1, reverted: false },
        { toolName: 'tool_fails', args: {}, result: {}, durationMs: 1, reverted: false },
        { toolName: 'tool_ok_b', args: {}, result: {}, durationMs: 1, reverted: false },
      ],
    });

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      reverted: number;
      errors: Array<{ toolName: string; message: string }>;
    };
    // reverted = total processados (best-effort semantic — Story 1.5 paralelo)
    expect(json.reverted).toBe(3);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0].toolName).toBe('tool_fails');
    expect(json.errors[0].message).toMatch(/Tarefa já apagada manualmente/);

    // Entry apagada mesmo com erros parciais
    expect(kvMock.del).toHaveBeenCalledWith(
      `nexus:undo:run:${VALID_RUN_ID}`
    );
  });

  it('200 + errors[] + logger.error quando tool ausente do registry (RESOLVED-6)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Tool NÃO registada — simula tool removida entre runs
    kvMock.get.mockResolvedValueOnce({
      runId: VALID_RUN_ID,
      timestamp: NOW - 5000,
      expiresAt: NOW + 25000,
      toolCalls: [
        {
          toolName: 'tool_unregistered',
          args: {},
          result: {},
          durationMs: 1,
          reverted: false,
        },
      ],
    });

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      reverted: number;
      errors: Array<{ toolName: string; message: string }>;
    };
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0].toolName).toBe('tool_unregistered');
    expect(json.errors[0].message).toMatch(/não registada/);

    // logger.error invocado para observability
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool not in registry'),
      expect.anything()
    );

    errorSpy.mockRestore();
  });

  it('200 + errors[] + logger.error quando tool.reverse undefined (invariant violation)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Tool registada com reversible: true MAS sem reverse (bug de definição)
    // Nota: defineTool aceita esta combinação (ZodObject permite reverse undefined),
    // o que é a invariant violation que RESOLVED-6 cobre.
    const buggyTool = defineTool({
      name: 'tool_buggy',
      description: 'reversible: true mas reverse undefined (bug)',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      // reverse: undefined  — invariant violation
    });
    toolRegistry.register(buggyTool as ToolDefinition);

    kvMock.get.mockResolvedValueOnce({
      runId: VALID_RUN_ID,
      timestamp: NOW - 5000,
      expiresAt: NOW + 25000,
      toolCalls: [
        {
          toolName: 'tool_buggy',
          args: {},
          result: {},
          durationMs: 1,
          reverted: false,
        },
      ],
    });

    const resp = await callUndo({ runId: VALID_RUN_ID });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      errors: Array<{ toolName: string; message: string }>;
    };
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0].toolName).toBe('tool_buggy');
    expect(json.errors[0].message).toMatch(/reverse\(\) não definido — invariant violation/);

    // logger.error invocado com mensagem específica
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tool reverse missing — invariant violation'),
      expect.anything()
    );

    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 410 — idempotência (RESOLVED-5: 2º POST após 1º consumir)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/undo — idempotência', () => {
  it('1º POST 200 + 2º POST 410 (entry apagada pelo 1º)', async () => {
    const tool = defineTool({
      name: 'tool_revertable',
      description: 'Tool reversível',
      domain: 'meta',
      argsSchema: z.object({}).passthrough(),
      resultSchema: z.object({ ok: z.boolean() }),
      requiresPreview: false,
      reversible: true,
      execute: async () => ({ ok: true }),
      reverse: async () => undefined,
    });
    toolRegistry.register(tool as ToolDefinition);

    // 1º POST: KV retorna entry válida
    kvMock.get.mockResolvedValueOnce({
      runId: VALID_RUN_ID,
      timestamp: NOW - 5000,
      expiresAt: NOW + 25000,
      toolCalls: [
        {
          toolName: 'tool_revertable',
          args: {},
          result: {},
          durationMs: 1,
          reverted: false,
        },
      ],
    });

    const resp1 = await callUndo({ runId: VALID_RUN_ID });
    expect(resp1.status).toBe(200);

    // 2º POST: KV retorna null (entry apagada pelo 1º via deleteUndoEntry)
    kvMock.get.mockResolvedValueOnce(null);
    const resp2 = await callUndo({ runId: VALID_RUN_ID });
    expect(resp2.status).toBe(410);
    const json2 = (await resp2.json()) as { error: string };
    expect(json2.error).toBe('undo_window_expired');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC12 — Edge runtime safety estática
// ─────────────────────────────────────────────────────────────────────────────

describe('AC12 — Edge runtime safety', () => {
  it('app/api/agent/undo/route.ts NÃO importa fs/child_process e configura runtime edge', () => {
    const routePath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'app',
      'api',
      'agent',
      'undo',
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

    // db é apenas import type (Dexie é client-only — RESOLVED-2 Story 1.5)
    const runtimeDbImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
    expect(source).not.toMatch(runtimeDbImport);
  });

  it('lib/agent/undo.ts NÃO importa fs/child_process nem @/lib/db/client em runtime', () => {
    const undoPath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'lib',
      'agent',
      'undo.ts'
    );
    const source = readFileSync(undoPath, 'utf-8');

    expect(source).not.toMatch(/from\s+['"]fs['"]/);
    expect(source).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(source).not.toMatch(/from\s+['"]child_process['"]/);
    expect(source).not.toMatch(/createHmac\s*\(/);

    const runtimeDbImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
    expect(source).not.toMatch(runtimeDbImport);
  });
});
