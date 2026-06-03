import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 4.9 — testes do endpoint de acção `POST /api/push/action` (AC7, C7/C8).
 *
 * Auth por **cookie de sessão** (`getSession`, D-ACTION-AUTH-COOKIE) — não Bearer.
 * O Service Worker chama este endpoint same-origin no browser autenticado, pelo
 * que o cookie de sessão é enviado automaticamente. Cobre auth (401 sem sessão,
 * 200 com sessão), validação de body, `marcar-feito` (→ `markScheduleSent`) e
 * `snooze` (→ `putSchedule` com novo `fireAt` mantendo `pending` — SF-1,
 * D-RECON-SNOOZE-KEEP). Mock de `getSession` alinhado com `schedule-get-extension.test.ts`.
 */

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'test-session-id' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
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
const ID = '11111111-1111-4111-8111-111111111111';

function entry(over: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return { id: ID, fireAt: NOW - 1000, text: 'Pagar a luz', status: 'pending', ...over };
}

/**
 * Chama o POST. Por defeito envia o cookie de sessão (auth same-origin do SW).
 * `withCookie: false` simula um pedido não-autenticado (sem cookie de sessão).
 */
async function call(body?: unknown, withCookie = true): Promise<Response> {
  const { POST } = await import('@/app/api/push/action/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (withCookie) headers.set('Cookie', 'nexus_session=test-session-id');
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
  mockSessionValid = true;
  listMock.mockResolvedValue([entry()]);
  markMock.mockResolvedValue(undefined);
  putMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/push/action — auth por cookie de sessão (D-ACTION-AUTH-COOKIE)', () => {
  it('C7 — 401 sem sessão válida (cookie ausente)', async () => {
    mockSessionValid = false;
    const resp = await call({ reminderId: ID, action: 'marcar-feito' }, false);
    expect(resp.status).toBe(401);
    // Não toca o mirror sem auth.
    expect(markMock).not.toHaveBeenCalled();
    expect(putMock).not.toHaveBeenCalled();
  });

  it('200 com sessão válida — a auth real (cookie) deixa passar', async () => {
    mockSessionValid = true;
    const resp = await call({ reminderId: ID, action: 'marcar-feito' });
    expect(resp.status).toBe(200);
    expect(markMock).toHaveBeenCalledTimes(1);
  });

  // Fidelidade de auth: o endpoint NÃO depende de `Authorization: Bearer`. Com
  // sessão válida e SEM header Authorization, o pedido tem de passar (200). Este
  // teste FALHARIA se o endpoint regredisse para exigir Bearer (daria 401 aqui).
  it('200 com sessão válida e SEM header Authorization (falharia se exigisse Bearer)', async () => {
    mockSessionValid = true;
    const { POST } = await import('@/app/api/push/action/route');
    const headers = new Headers({
      'Content-Type': 'application/json',
      Cookie: 'nexus_session=test-session-id',
    });
    // Sem `Authorization` deliberadamente.
    expect(headers.has('Authorization')).toBe(false);
    const req = new Request('http://localhost:3001/api/push/action', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reminderId: ID, action: 'marcar-feito' }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(200);
    expect(markMock).toHaveBeenCalledTimes(1);
  });

  // Fidelidade de auth (negativo): mesmo com um `Authorization: Bearer` presente,
  // se a sessão for inválida o endpoint rejeita — prova que o Bearer já não é
  // aceite como credencial (a auth é só por cookie de sessão).
  it('401 quando a sessão é inválida, mesmo com header Bearer presente', async () => {
    mockSessionValid = false;
    const { POST } = await import('@/app/api/push/action/route');
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: 'Bearer qualquer-secret',
    });
    const req = new Request('http://localhost:3001/api/push/action', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reminderId: ID, action: 'marcar-feito' }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(401);
    expect(markMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/push/action — validação', () => {
  it('400 com body não-JSON', async () => {
    const { POST } = await import('@/app/api/push/action/route');
    const req = new Request('http://localhost:3001/api/push/action', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        Cookie: 'nexus_session=test-session-id',
      }),
      body: 'not-json{',
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });

  it('400 com action inválida', async () => {
    const resp = await call({ reminderId: ID, action: 'apagar' });
    expect(resp.status).toBe(400);
  });

  it('400 com reminderId não-UUID', async () => {
    const resp = await call({ reminderId: 'x', action: 'snooze' });
    expect(resp.status).toBe(400);
  });
});

describe('POST /api/push/action — marcar-feito (C7)', () => {
  it('C7 — marca a entrada sent no mirror KV', async () => {
    const resp = await call({ reminderId: ID, action: 'marcar-feito' });
    expect(resp.status).toBe(200);
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(entry());
    expect(putMock).not.toHaveBeenCalled();
  });

  it('200 applied:false quando a entrada já não existe no mirror', async () => {
    listMock.mockResolvedValue([]);
    const resp = await call({ reminderId: ID, action: 'marcar-feito' });
    const json = (await resp.json()) as { ok: boolean; applied: boolean };
    expect(resp.status).toBe(200);
    expect(json.applied).toBe(false);
    expect(markMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/push/action — snooze (C8)', () => {
  // C8 — SF-1: fireAt re-escrito; status mantém `pending` (NÃO transita para sent).
  it('C8 — reescreve fireAt = now + 10min e MANTÉM status pending', async () => {
    const resp = await call({ reminderId: ID, action: 'snooze', snoozeMinutes: 10 });
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
    const resp = await call({ reminderId: ID, action: 'snooze' });
    expect(resp.status).toBe(200);
    const written = putMock.mock.calls[0][0] as ScheduleEntry;
    expect(written.fireAt).toBe(NOW + 10 * 60_000);
  });

  it('500 quando o store lança', async () => {
    putMock.mockRejectedValueOnce(new Error('kv down'));
    const resp = await call({ reminderId: ID, action: 'snooze' });
    expect(resp.status).toBe(500);
  });
});
