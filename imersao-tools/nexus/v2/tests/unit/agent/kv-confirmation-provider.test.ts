import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONFIRM_POLL_INTERVAL_MS,
  CONFIRM_TTL_SECONDS,
  KV_CONFIRM_NAMESPACE,
  KvConfirmationProvider,
} from '@/lib/agent/kv-confirmation-provider';
import type { VercelKV } from '@/lib/agent/tools/types';

/**
 * Story 1.8 — KvConfirmationProvider tests (AC10).
 *
 * Cobre:
 *   - Constantes exportadas (CONFIRM_TTL_SECONDS, CONFIRM_POLL_INTERVAL_MS,
 *     KV_CONFIRM_NAMESPACE) com valores canónicos
 *   - `requestConfirmation` resolve 'confirm' no 1º poll
 *   - `requestConfirmation` resolve 'cancel' no 1º poll
 *   - `requestConfirmation` faz polling até KV retornar valor
 *   - `requestConfirmation` retorna 'cancel' após timeout
 *   - `requestConfirmation` apaga entrada KV após resolução (kvMock.del invocado)
 *
 * Pattern `vi.mock('@vercel/kv')` (RESOLVED-1 Story 1.7 — alinhado Stories 1.4-1.7).
 * `vi.useFakeTimers()` para controlar `setTimeout` no polling loop.
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};
const kvClient = kv as unknown as VercelKV;

const VALID_RUN_ID = '11111111-1111-4111-8111-111111111111';
const TOOL_NAME = 'criar_tarefa';
const EXPECTED_KEY = `${KV_CONFIRM_NAMESPACE}:${VALID_RUN_ID}:${TOOL_NAME}`;

beforeEach(() => {
  vi.clearAllMocks();
  kvMock.get.mockResolvedValue(null);
  kvMock.del.mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// Constantes exportadas (AC7)
// ─────────────────────────────────────────────────────────────────────────────

describe('KvConfirmationProvider — constantes', () => {
  it('CONFIRM_TTL_SECONDS exporta 60 (ADR-7)', () => {
    expect(CONFIRM_TTL_SECONDS).toBe(60);
  });

  it('CONFIRM_POLL_INTERVAL_MS exporta 250 (ADR-7)', () => {
    expect(CONFIRM_POLL_INTERVAL_MS).toBe(250);
  });

  it('KV_CONFIRM_NAMESPACE exporta "nexus:agent:confirm" (ADR-6)', () => {
    expect(KV_CONFIRM_NAMESPACE).toBe('nexus:agent:confirm');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requestConfirmation — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('KvConfirmationProvider.requestConfirmation — resolução imediata', () => {
  it('resolve "confirm" quando KV retorna "confirm" no 1º poll', async () => {
    kvMock.get.mockResolvedValueOnce('confirm');
    const provider = new KvConfirmationProvider(kvClient);

    const result = await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(result).toBe('confirm');
    expect(kvMock.get).toHaveBeenCalledTimes(1);
    expect(kvMock.get).toHaveBeenCalledWith(EXPECTED_KEY);
  });

  it('resolve "cancel" quando KV retorna "cancel" no 1º poll', async () => {
    kvMock.get.mockResolvedValueOnce('cancel');
    const provider = new KvConfirmationProvider(kvClient);

    const result = await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(result).toBe('cancel');
    expect(kvMock.get).toHaveBeenCalledTimes(1);
  });

  it('apaga entrada KV após resolução ("confirm")', async () => {
    kvMock.get.mockResolvedValueOnce('confirm');
    const provider = new KvConfirmationProvider(kvClient);

    await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(kvMock.del).toHaveBeenCalledTimes(1);
    expect(kvMock.del).toHaveBeenCalledWith(EXPECTED_KEY);
  });

  it('apaga entrada KV após resolução ("cancel")', async () => {
    kvMock.get.mockResolvedValueOnce('cancel');
    const provider = new KvConfirmationProvider(kvClient);

    await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(kvMock.del).toHaveBeenCalledWith(EXPECTED_KEY);
  });

  it('cleanup del falha tolerada (best-effort) — retorna valor mesmo assim', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    kvMock.get.mockResolvedValueOnce('confirm');
    kvMock.del.mockRejectedValueOnce(new Error('KV down'));
    const provider = new KvConfirmationProvider(kvClient);

    const result = await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(result).toBe('confirm');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('cleanup del falhou'),
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it('chave KV usa namespace + runId + toolName (ADR-7)', async () => {
    kvMock.get.mockResolvedValueOnce('confirm');
    const provider = new KvConfirmationProvider(kvClient);

    await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(kvMock.get).toHaveBeenCalledWith(
      `nexus:agent:confirm:${VALID_RUN_ID}:${TOOL_NAME}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requestConfirmation — polling até resolução
// ─────────────────────────────────────────────────────────────────────────────

describe('KvConfirmationProvider.requestConfirmation — polling', () => {
  it('faz polling até KV retornar valor (3 polls: null, null, "confirm")', async () => {
    vi.useFakeTimers();
    kvMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('confirm');

    const provider = new KvConfirmationProvider(kvClient);
    const promise = provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    // Avançar tempo para libertar setTimeout entre polls.
    // Cada poll: get → setTimeout(250ms) → get próximo
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_INTERVAL_MS * 3);

    const result = await promise;

    expect(result).toBe('confirm');
    expect(kvMock.get).toHaveBeenCalledTimes(3);
    expect(kvMock.del).toHaveBeenCalledWith(EXPECTED_KEY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requestConfirmation — timeout
// ─────────────────────────────────────────────────────────────────────────────

describe('KvConfirmationProvider.requestConfirmation — timeout', () => {
  it('retorna "cancel" após timeout (KV sempre retorna null)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.useFakeTimers();
    kvMock.get.mockResolvedValue(null);

    const provider = new KvConfirmationProvider(kvClient);
    const promise = provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    // Avançar tempo para além do TTL — provider deve dar timeout.
    await vi.advanceTimersByTimeAsync((CONFIRM_TTL_SECONDS + 1) * 1000);

    const result = await promise;

    expect(result).toBe('cancel');
    // logger.error invocado com mensagem de timeout (Vercel logs observability)
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('timeout aguardando confirmação'),
      expect.objectContaining({
        runId: VALID_RUN_ID,
        toolName: TOOL_NAME,
        ttlSeconds: CONFIRM_TTL_SECONDS,
      })
    );

    errorSpy.mockRestore();
  });

  it('em timeout NÃO chama del (entry expira por TTL natural)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.useFakeTimers();
    kvMock.get.mockResolvedValue(null);

    const provider = new KvConfirmationProvider(kvClient);
    const promise = provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    await vi.advanceTimersByTimeAsync((CONFIRM_TTL_SECONDS + 1) * 1000);
    await promise;

    expect(kvMock.del).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requestConfirmation — defensive try/catch em kvClient.get (CR Iter 1 fix)
// ─────────────────────────────────────────────────────────────────────────────

describe('KvConfirmationProvider.requestConfirmation — defensive errors', () => {
  it('retorna "cancel" + log error quando kvClient.get throws (transient KV error)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    kvMock.get.mockRejectedValueOnce(new Error('Upstash throttled'));
    // del é best-effort — pode ser invocado, irrelevante neste assert principal.
    const provider = new KvConfirmationProvider(kvClient);

    const result = await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(result).toBe('cancel');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('KV read failed'),
      expect.objectContaining({
        runId: VALID_RUN_ID,
        toolName: TOOL_NAME,
        error: 'Upstash throttled',
      })
    );

    errorSpy.mockRestore();
  });

  it('NÃO escapa erro mesmo se cleanup del também falhar (best-effort)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    kvMock.get.mockRejectedValueOnce(new Error('KV down'));
    kvMock.del.mockRejectedValueOnce(new Error('KV still down'));
    const provider = new KvConfirmationProvider(kvClient);

    // Não throw — devolve 'cancel' silenciosamente mesmo com double failure.
    const result = await provider.requestConfirmation(VALID_RUN_ID, TOOL_NAME);

    expect(result).toBe('cancel');

    errorSpy.mockRestore();
  });
});
