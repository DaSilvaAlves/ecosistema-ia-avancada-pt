import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPendingSchedules } from '@/lib/push/schedule-client';

/**
 * Story 4.9 — testes do helper client `fetchPendingSchedules()` (AC9, C10).
 *
 * Lê `json.pending` do `GET /api/push/schedule`; devolve `[]` em qualquer falha
 * (best-effort — padrão `fetchSentReminderIds`). Mock de `fetch` global.
 */

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

describe('fetchPendingSchedules — Story 4.9 C10', () => {
  it('C10 — extrai json.pending com {id, fireAt}', async () => {
    const pending = [
      { id: '11111111-1111-4111-8111-111111111111', fireAt: 1717200000000 },
      { id: '22222222-2222-4222-8222-222222222222', fireAt: 1717300000000 },
    ];
    fetchMock.mockResolvedValue(jsonResponse({ sent: [], pending }));
    const result = await fetchPendingSchedules();
    expect(result).toEqual(pending);
    expect(fetchMock).toHaveBeenCalledWith('/api/push/schedule', { method: 'GET' });
  });

  it('C10 — devolve [] quando a resposta não é ok', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false));
    expect(await fetchPendingSchedules()).toEqual([]);
  });

  it('C10 — devolve [] quando fetch lança', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    expect(await fetchPendingSchedules()).toEqual([]);
  });

  it('C10 — devolve [] quando pending não é array', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sent: [], pending: 'oops' }));
    expect(await fetchPendingSchedules()).toEqual([]);
  });

  it('C10 — filtra entradas malformadas (sem id ou fireAt não-número)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        pending: [
          { id: '11111111-1111-4111-8111-111111111111', fireAt: 123 },
          { id: 42, fireAt: 999 }, // id não-string
          { id: 'x', fireAt: 'nope' }, // fireAt não-número
          null,
        ],
      }),
    );
    const result = await fetchPendingSchedules();
    expect(result).toEqual([{ id: '11111111-1111-4111-8111-111111111111', fireAt: 123 }]);
  });
});
