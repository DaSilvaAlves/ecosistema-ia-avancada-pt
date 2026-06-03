import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 4.9 — testes do endpoint de acção `POST /api/push/action` (AC7, C7/C8).
 *
 * Cobre auth (`CRON_SECRET` Bearer, 401/503), validação de body, `marcar-feito`
 * (→ `markScheduleSent`) e `snooze` (→ `putSchedule` com novo `fireAt` mantendo
 * `pending` — D-RECON-SNOOZE-KEEP). Mocks de `env` e `schedule-store`, alinhado
 * com `tests/unit/api/push/dispatch.test.ts`.
 */

let mockCronSecret: string | undefined = 'test-cron-secret';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ CRON_SECRET: mockCronSecret })),
}));

vi.mock('@/lib/push/schedule-store', () => ({
  listSchedules: vi.fn(async () => []),
  markScheduleSent: vi.fn(async () => undefined),
  putSchedule: vi.fn(async () => undefined),
}));

import { listSchedules, markScheduleSent, putSchedule } from '@/lib/push/schedule-store';

const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;
const markMock = markScheduleSent as unknown as ReturnType<typeof vi.fn>;
const putMock = putSchedule as unknown as ReturnType<typeof vi.fn>;

const NOW = 1717200000000;
const SECRET = 'test-cron-secret';
const ID = '11111111-1111-4111-8111-111111111111';

function entry(over: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return { id: ID, fireAt: NOW - 1000, text: 'Pagar a luz', status: 'pending', ...over };
}

async function call(body?: unknown, auth?: string): Promise<Response> {
  const { POST } = await import('@/app/api/push/action/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (auth !== undefined) headers.set('Authorization', auth);
  const req = new Request('http://localhost:3001/api/push/action', {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockCronSecret = SECRET;
  listMock.mockResolvedValue([entry()]);
  markMock.mockResolvedValue(undefined);
  putMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/push/action — auth', () => {
  it('503 quando CRON_SECRET não está configurado', async () => {
    mockCronSecret = undefined;
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(503);
    expect(markMock).not.toHaveBeenCalled();
  });

  it('C7 — 401 sem CRON_SECRET correcto', async () => {
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, 'Bearer wrong');
    expect(resp.status).toBe(401);
    expect(markMock).not.toHaveBeenCalled();
  });

  it('401 sem header Authorization', async () => {
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, undefined);
    expect(resp.status).toBe(401);
  });
});

describe('POST /api/push/action — validação', () => {
  it('400 com body não-JSON', async () => {
    const { POST } = await import('@/app/api/push/action/route');
    const req = new Request('http://localhost:3001/api/push/action', {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` }),
      body: 'not-json{',
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });

  it('400 com action inválida', async () => {
    const resp = await call({ reminderId: ID, action: 'apagar' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(400);
  });

  it('400 com reminderId não-UUID', async () => {
    const resp = await call({ reminderId: 'x', action: 'snooze' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(400);
  });
});

describe('POST /api/push/action — marcar-feito (C7)', () => {
  it('C7 — marca a entrada sent no mirror KV', async () => {
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(entry());
    expect(putMock).not.toHaveBeenCalled();
  });

  it('200 applied:false quando a entrada já não existe no mirror', async () => {
    listMock.mockResolvedValue([]);
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, `Bearer ${SECRET}`);
    const json = (await resp.json()) as { ok: boolean; applied: boolean };
    expect(resp.status).toBe(200);
    expect(json.applied).toBe(false);
    expect(markMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/push/action — snooze (C8)', () => {
  // C8 — SF-1: fireAt re-escrito; status mantém `pending` (NÃO transita para sent).
  it('C8 — reescreve fireAt = now + 10min e MANTÉM status pending', async () => {
    const resp = await call(
      { reminderId: ID, action: 'snooze', snoozeMinutes: 10 },
      `Bearer ${SECRET}`,
    );
    expect(resp.status).toBe(200);
    expect(putMock).toHaveBeenCalledTimes(1);
    const written = putMock.mock.calls[0][0] as ScheduleEntry;
    expect(written.fireAt).toBe(NOW + 10 * 60_000);
    expect(written.status).toBe('pending');
    expect(written.id).toBe(ID);
    expect(written.text).toBe('Pagar a luz');
    // SF-1 — não transita para sent.
    expect(markMock).not.toHaveBeenCalled();
  });

  it('snooze sem snoozeMinutes usa 10 por defeito', async () => {
    const resp = await call({ reminderId: ID, action: 'snooze' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    const written = putMock.mock.calls[0][0] as ScheduleEntry;
    expect(written.fireAt).toBe(NOW + 10 * 60_000);
  });

  it('500 quando o store lança', async () => {
    putMock.mockRejectedValueOnce(new Error('kv down'));
    const resp = await call({ reminderId: ID, action: 'snooze' }, `Bearer ${SECRET}`);
    expect(resp.status).toBe(500);
  });
});
