import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 4.8 — testes do mirror cookie-auth `/api/push/schedule` (AC3.2/AC6).
 *
 * Cobre auth (401), validação de body, branches de erro do store, e a filtragem
 * `sent` do GET (consumido pela reconciliação). Mock de `getSession` e do store.
 * Padrão alinhado com `tests/unit/api/agent/undo.test.ts` (CR Iter 1 #4).
 */

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'test-session-id' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

vi.mock('@/lib/push/schedule-store', async (importOriginal) => {
  // Reutiliza o ScheduleEntrySchema real (validação de input do PUT).
  const actual = await importOriginal<typeof import('@/lib/push/schedule-store')>();
  return {
    ScheduleEntrySchema: actual.ScheduleEntrySchema,
    putSchedule: vi.fn(async () => undefined),
    deleteSchedule: vi.fn(async () => undefined),
    listSchedules: vi.fn(async () => []),
  };
});

import { putSchedule, deleteSchedule, listSchedules } from '@/lib/push/schedule-store';

const putMock = putSchedule as unknown as ReturnType<typeof vi.fn>;
const delMock = deleteSchedule as unknown as ReturnType<typeof vi.fn>;
const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;

const ID = '11111111-1111-4111-8111-111111111111';
const PENDING: ScheduleEntry = { id: ID, fireAt: 1717200000000, text: 'Pagar a luz', status: 'pending' };

async function call(
  method: 'PUT' | 'DELETE' | 'GET',
  body?: unknown,
  hasCookie = true,
): Promise<Response> {
  mockSessionValid = hasCookie;
  const mod = await import('@/app/api/push/schedule/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');
  const req = new Request('http://localhost:3001/api/push/schedule', {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return mod[method](req);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  putMock.mockResolvedValue(undefined);
  delMock.mockResolvedValue(undefined);
  listMock.mockResolvedValue([]);
});

describe('PUT /api/push/schedule', () => {
  it('401 sem sessão', async () => {
    const resp = await call('PUT', PENDING, false);
    expect(resp.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('400 com status diferente de pending', async () => {
    const resp = await call('PUT', { ...PENDING, status: 'sent' });
    expect(resp.status).toBe(400);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('400 com payload inválido', async () => {
    const resp = await call('PUT', { id: 'x', fireAt: -1, text: '', status: 'pending' });
    expect(resp.status).toBe(400);
  });

  it('200 e chama putSchedule no happy path', async () => {
    const resp = await call('PUT', PENDING);
    expect(resp.status).toBe(200);
    expect(putMock).toHaveBeenCalledWith(PENDING);
  });

  it('500 quando o store lança', async () => {
    putMock.mockRejectedValueOnce(new Error('kv down'));
    const resp = await call('PUT', PENDING);
    expect(resp.status).toBe(500);
  });
});

describe('DELETE /api/push/schedule', () => {
  it('401 sem sessão', async () => {
    const resp = await call('DELETE', { id: ID }, false);
    expect(resp.status).toBe(401);
    expect(delMock).not.toHaveBeenCalled();
  });

  it('400 com id inválido', async () => {
    const resp = await call('DELETE', { id: 'not-uuid' });
    expect(resp.status).toBe(400);
  });

  it('200 e chama deleteSchedule no happy path', async () => {
    const resp = await call('DELETE', { id: ID });
    expect(resp.status).toBe(200);
    expect(delMock).toHaveBeenCalledWith(ID);
  });

  it('500 quando o store lança', async () => {
    delMock.mockRejectedValueOnce(new Error('kv down'));
    const resp = await call('DELETE', { id: ID });
    expect(resp.status).toBe(500);
  });
});

describe('GET /api/push/schedule', () => {
  it('401 sem sessão', async () => {
    const resp = await call('GET', undefined, false);
    expect(resp.status).toBe(401);
  });

  it('devolve apenas os ids sent (filtra pending)', async () => {
    listMock.mockResolvedValue([
      PENDING,
      { id: '22222222-2222-4222-8222-222222222222', fireAt: 1717300000000, text: 'X', status: 'sent' },
    ]);
    const resp = await call('GET');
    expect(resp.status).toBe(200);
    const json = (await resp.json()) as { sent: string[] };
    expect(json.sent).toEqual(['22222222-2222-4222-8222-222222222222']);
  });
});
