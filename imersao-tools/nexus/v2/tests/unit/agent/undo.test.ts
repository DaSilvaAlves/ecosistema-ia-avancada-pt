import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteUndoEntry,
  getUndoEntry,
  registerUndoEntry,
  UNDO_TTL_SECONDS,
} from '@/lib/agent/undo';
import type { ToolCall } from '@/lib/agent/schemas';
import type { VercelKV } from '@/lib/agent/tools/types';

/**
 * Story 1.7 — Undo module tests.
 *
 * Cobre `registerUndoEntry`, `getUndoEntry`, `deleteUndoEntry` + constante
 * `UNDO_TTL_SECONDS`. Mock pattern `vi.mock('@vercel/kv')` (RESOLVED-1
 * Architect Aria — alinhado Stories 1.4-1.6).
 *
 * NÃO mockamos `lib/agent/undo.ts` — é a unit under test. Mockamos apenas
 * o cliente KV (`@vercel/kv` singleton) para validar contrato de função
 * (`registerUndoEntry chama kv.set com chave correcta + ex: 30`).
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};
const kvClient = kv as unknown as VercelKV;

const VALID_RUN_ID = '11111111-1111-4111-8111-111111111111';
const VALID_TOOL_CALL: ToolCall = {
  toolName: 'tool_test_one',
  args: { x: 'hello' },
  result: { ok: true, echo: 'hello' },
  durationMs: 5,
  reverted: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: KV ops succeed silently
  kvMock.set.mockResolvedValue('OK');
  kvMock.get.mockResolvedValue(null);
  kvMock.del.mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UNDO_TTL_SECONDS', () => {
  it('exporta 30 (PRD §6.1 FR6 + Epic 1 AC4)', () => {
    expect(UNDO_TTL_SECONDS).toBe(30);
  });
});

describe('registerUndoEntry', () => {
  it('chama kv.set com chave canónica e ex: 30', async () => {
    await registerUndoEntry(VALID_RUN_ID, [VALID_TOOL_CALL], kvClient);

    expect(kvMock.set).toHaveBeenCalledTimes(1);
    const [key, value, opts] = kvMock.set.mock.calls[0];
    expect(key).toBe(`nexus:undo:run:${VALID_RUN_ID}`);
    expect(opts).toEqual({ ex: 30 });

    // Payload validado contra UndoEntrySchema
    expect(value).toMatchObject({
      runId: VALID_RUN_ID,
      toolCalls: [VALID_TOOL_CALL],
      timestamp: expect.any(Number),
      expiresAt: expect.any(Number),
    });
  });

  it('expiresAt = timestamp + UNDO_TTL_SECONDS * 1000', async () => {
    const fixedNow = 1700000000000;
    vi.setSystemTime(fixedNow);

    await registerUndoEntry(VALID_RUN_ID, [VALID_TOOL_CALL], kvClient);

    const [, value] = kvMock.set.mock.calls[0];
    expect(value.timestamp).toBe(fixedNow);
    expect(value.expiresAt).toBe(fixedNow + 30 * 1000);
  });

  it('lança fail-loud em PT-PT quando runId não é UUID', async () => {
    await expect(
      registerUndoEntry('not-a-uuid', [VALID_TOOL_CALL], kvClient)
    ).rejects.toThrow(/Payload de undo corrupto/);
    expect(kvMock.set).not.toHaveBeenCalled();
  });

  it('aceita array vazio de toolCalls (caller deve filtrar antes — defesa secundária)', async () => {
    // Edge case: Story 1.7 spec diz caller só chama esta fn se
    // reversibleToolCalls.length > 0, mas este test garante que o módulo
    // não rejeita silenciosamente um array vazio (Zod array() permite [])
    await registerUndoEntry(VALID_RUN_ID, [], kvClient);
    expect(kvMock.set).toHaveBeenCalledTimes(1);
    const [, value] = kvMock.set.mock.calls[0];
    expect(value.toolCalls).toEqual([]);
  });

  it('propaga erro de KV (best-effort no caller — registerUndoEntry é estrito)', async () => {
    kvMock.set.mockRejectedValueOnce(new Error('KV down'));
    await expect(
      registerUndoEntry(VALID_RUN_ID, [VALID_TOOL_CALL], kvClient)
    ).rejects.toThrow('KV down');
  });
});

describe('getUndoEntry', () => {
  it('retorna null quando KV retorna null (TTL expirou ou nunca existiu)', async () => {
    kvMock.get.mockResolvedValueOnce(null);

    const result = await getUndoEntry(VALID_RUN_ID, kvClient);

    expect(result).toBeNull();
    expect(kvMock.get).toHaveBeenCalledWith(
      `nexus:undo:run:${VALID_RUN_ID}`
    );
  });

  it('retorna null quando KV retorna undefined', async () => {
    kvMock.get.mockResolvedValueOnce(undefined);
    const result = await getUndoEntry(VALID_RUN_ID, kvClient);
    expect(result).toBeNull();
  });

  it('retorna UndoEntry validada quando shape é correcto', async () => {
    const stored = {
      runId: VALID_RUN_ID,
      timestamp: 1700000000000,
      toolCalls: [VALID_TOOL_CALL],
      expiresAt: 1700000030000,
    };
    kvMock.get.mockResolvedValueOnce(stored);

    const result = await getUndoEntry(VALID_RUN_ID, kvClient);

    expect(result).toEqual(stored);
  });

  it('lança fail-loud em PT-PT quando KV retorna shape corrupto (Zod fail)', async () => {
    kvMock.get.mockResolvedValueOnce({
      runId: 'not-a-uuid',
      timestamp: 'not-a-number',
      toolCalls: 'not-an-array',
    });

    await expect(getUndoEntry(VALID_RUN_ID, kvClient)).rejects.toThrow(
      /Payload de undo corrupto no readback/
    );
  });

  it('mensagem de erro inclui runId para ops debug', async () => {
    kvMock.get.mockResolvedValueOnce({ runId: 'invalid' });

    await expect(getUndoEntry(VALID_RUN_ID, kvClient)).rejects.toThrow(
      new RegExp(`runId=${VALID_RUN_ID}`)
    );
  });
});

describe('deleteUndoEntry', () => {
  it('chama kv.del com chave canónica', async () => {
    await deleteUndoEntry(VALID_RUN_ID, kvClient);

    expect(kvMock.del).toHaveBeenCalledTimes(1);
    expect(kvMock.del).toHaveBeenCalledWith(
      `nexus:undo:run:${VALID_RUN_ID}`
    );
  });

  it('idempotência — chamada dupla não lança (kv.del em chave inexistente é no-op)', async () => {
    kvMock.del.mockResolvedValue(0);

    await deleteUndoEntry(VALID_RUN_ID, kvClient);
    await deleteUndoEntry(VALID_RUN_ID, kvClient);

    expect(kvMock.del).toHaveBeenCalledTimes(2);
    // Sem throw — idempotência respeitada
  });
});
