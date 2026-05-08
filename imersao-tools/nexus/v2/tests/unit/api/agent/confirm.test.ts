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
import {
  CONFIRM_TTL_SECONDS,
  KV_CONFIRM_NAMESPACE,
} from '@/lib/agent/kv-confirmation-provider';

/**
 * Story 1.8 — `POST /api/agent/confirm` endpoint tests (AC10).
 *
 * Cobre:
 *   - 401 quando sessão é inválida (auth-first ordering)
 *   - 400 quando body não é JSON / runId não é UUID / action inválida
 *   - 200 happy path — KV escrito com chave canónica + TTL CONFIRM_TTL_SECONDS
 *   - 503 quando kv.set falha (KV down)
 *   - Test estático AC8 — runtime edge + sem imports Node-only
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

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

const VALID_RUN_ID = '44444444-4444-4444-8444-444444444444';
const TOOL_NAME = 'criar_tarefa';

async function callConfirm(
  body: unknown,
  hasCookie = true
): Promise<Response> {
  mockSessionValid = hasCookie;
  const { POST } = await import('@/app/api/agent/confirm/route');

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');

  const req = new Request('http://localhost:3001/api/agent/confirm', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  kvMock.set.mockResolvedValue('OK');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth + body validation
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/confirm — auth + body validation', () => {
  it('401 quando sessão é inválida', async () => {
    const resp = await callConfirm(
      { runId: VALID_RUN_ID, toolName: TOOL_NAME, action: 'confirm' },
      false
    );
    expect(resp.status).toBe(401);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('não_autenticado');
  });

  it('401 PRECEDE 400 — probing com body inválido sem sessão retorna 401', async () => {
    const resp = await callConfirm({ invalid: true }, false);
    expect(resp.status).toBe(401);
  });

  it('400 quando body não é JSON', async () => {
    const resp = await callConfirm('not-json', true);
    expect(resp.status).toBe(400);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('invalid_body');
  });

  it('400 quando runId não é UUID', async () => {
    const resp = await callConfirm({
      runId: 'not-a-uuid',
      toolName: TOOL_NAME,
      action: 'confirm',
    });
    expect(resp.status).toBe(400);
  });

  it('400 quando toolName está vazio', async () => {
    const resp = await callConfirm({
      runId: VALID_RUN_ID,
      toolName: '',
      action: 'confirm',
    });
    expect(resp.status).toBe(400);
  });

  it('400 quando action não é "confirm" nem "cancel"', async () => {
    const resp = await callConfirm({
      runId: VALID_RUN_ID,
      toolName: TOOL_NAME,
      action: 'maybe',
    });
    expect(resp.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/confirm — happy path', () => {
  it('200 + ok: true + KV escrito com chave canónica e TTL CONFIRM_TTL_SECONDS', async () => {
    const resp = await callConfirm({
      runId: VALID_RUN_ID,
      toolName: TOOL_NAME,
      action: 'confirm',
    });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as { ok: boolean };
    expect(json.ok).toBe(true);

    expect(kvMock.set).toHaveBeenCalledTimes(1);
    const [key, value, opts] = kvMock.set.mock.calls[0];
    expect(key).toBe(
      `${KV_CONFIRM_NAMESPACE}:${VALID_RUN_ID}:${TOOL_NAME}`
    );
    expect(value).toBe('confirm');
    expect(opts).toEqual({ ex: CONFIRM_TTL_SECONDS });
  });

  it('200 com action "cancel" escreve "cancel" no KV', async () => {
    const resp = await callConfirm({
      runId: VALID_RUN_ID,
      toolName: TOOL_NAME,
      action: 'cancel',
    });

    expect(resp.status).toBe(200);
    const [, value] = kvMock.set.mock.calls[0];
    expect(value).toBe('cancel');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 503 — KV write failure
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/agent/confirm — KV failure', () => {
  it('503 quando kv.set lança (KV down)', async () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    kvMock.set.mockRejectedValueOnce(new Error('KV unreachable'));

    const resp = await callConfirm({
      runId: VALID_RUN_ID,
      toolName: TOOL_NAME,
      action: 'confirm',
    });

    expect(resp.status).toBe(503);
    const json = (await resp.json()) as { error: string };
    expect(json.error).toBe('kv_write_failed');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('falha ao escrever KV'),
      expect.anything()
    );

    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 — Edge runtime safety (estática)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Edge runtime safety', () => {
  it('app/api/agent/confirm/route.ts NÃO importa fs/child_process e configura runtime edge', () => {
    const routePath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'app',
      'api',
      'agent',
      'confirm',
      'route.ts'
    );
    const source = readFileSync(routePath, 'utf-8');

    expect(source).toMatch(/export const runtime = ['"]edge['"]/);

    expect(source).not.toMatch(/from\s+['"]fs['"]/);
    expect(source).not.toMatch(/from\s+['"]node:fs['"]/);
    expect(source).not.toMatch(/from\s+['"]child_process['"]/);
    expect(source).not.toMatch(/createHmac\s*\(/);

    // RESOLVED-2 Story 1.5 — sem Dexie em runtime
    const runtimeDbImport =
      /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
    expect(source).not.toMatch(runtimeDbImport);
  });
});
