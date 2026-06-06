import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 4.9 — testes da extensão do `GET /api/push/schedule` (AC8, C9).
 *
 * O GET passa a devolver `{ sent: string[], pending: [{ id, fireAt }] }`, onde
 * `pending` = entradas adiadas por SNOOZE (D-SNOOZE-CONTRACT — filtro
 * `status === 'pending' && typeof snoozedAt === 'number'`). C9 prova que uma
 * entrada `pending` SEM `snoozedAt` (lembrete normal ainda-não-accionado) NÃO
 * aparece no array `pending` (corrige M2 do CR PR #58 — antes re-rotulava
 * lembretes normais como adiados) e que uma `pending` COM `snoozedAt` aparece. O
 * campo `sent` mantém o comportamento anterior (não-breaking —
 * `fetchSentReminderIds` só lê `json.sent`). Mock de `getSession` e do store.
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
  const actual = await importOriginal<typeof import('@/lib/push/schedule-store')>();
  return {
    ScheduleEntrySchema: actual.ScheduleEntrySchema,
    putSchedule: vi.fn(async () => undefined),
    deleteSchedule: vi.fn(async () => undefined),
    listSchedules: vi.fn(async () => []),
  };
});

import { listSchedules } from '@/lib/push/schedule-store';

const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;

// Lembrete `pending` NORMAL — sem `snoozedAt`. NÃO deve aparecer no array `pending`
// da resposta (D-SNOOZE-CONTRACT). Antes da correcção, aparecia → bug M2.
const PENDING_NORMAL: ScheduleEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  fireAt: 1717200000000,
  text: 'A',
  status: 'pending',
};
// Lembrete adiado por SNOOZE — `pending` COM `snoozedAt`. DEVE aparecer.
const SNOOZED: ScheduleEntry = {
  id: '33333333-3333-4333-8333-333333333333',
  fireAt: 1717300000000,
  text: 'B',
  status: 'pending',
  snoozedAt: 1717250000000,
};
const SENT: ScheduleEntry = {
  id: '22222222-2222-4222-8222-222222222222',
  fireAt: 1717100000000,
  text: 'C',
  status: 'sent',
};

async function callGet(hasCookie = true): Promise<Response> {
  mockSessionValid = hasCookie;
  const mod = await import('@/app/api/push/schedule/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');
  const req = new Request('http://localhost:3001/api/push/schedule', { method: 'GET', headers });
  return mod.GET(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  listMock.mockResolvedValue([]);
});

describe('GET /api/push/schedule — extensão pending (Story 4.9 C9, D-SNOOZE-CONTRACT)', () => {
  // C9 + M2 — só as entradas adiadas por snooze (com `snoozedAt`) aparecem no
  // array `pending`. O lembrete `pending` NORMAL (PENDING_NORMAL, sem `snoozedAt`)
  // NÃO aparece. Este teste FALHARIA se o filtro regredisse para `status==='pending'`
  // (M2 voltaria — lembretes normais re-rotulados como adiados).
  it('C9 — só snoozes (com snoozedAt) entram em pending; normais NÃO; sent inalterado', async () => {
    listMock.mockResolvedValue([PENDING_NORMAL, SENT, SNOOZED]);
    const resp = await callGet();
    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      sent: string[];
      pending: Array<{ id: string; fireAt: number }>;
    };
    // sent mantém o comportamento anterior (só ids dos sent).
    expect(json.sent).toEqual([SENT.id]);
    // pending traz SÓ a entrada adiada por snooze — o lembrete normal está excluído.
    expect(json.pending).toEqual([{ id: SNOOZED.id, fireAt: SNOOZED.fireAt }]);
    // Garantia explícita anti-M2: o normal não consta.
    expect(json.pending.map((p) => p.id)).not.toContain(PENDING_NORMAL.id);
  });

  it('pending vazio quando só há pending normais (sem snoozedAt) e sent', async () => {
    listMock.mockResolvedValue([PENDING_NORMAL, SENT]);
    const resp = await callGet();
    const json = (await resp.json()) as { sent: string[]; pending: unknown[] };
    expect(json.sent).toEqual([SENT.id]);
    expect(json.pending).toEqual([]);
  });

  it('401 sem sessão (auth inalterada)', async () => {
    const resp = await callGet(false);
    expect(resp.status).toBe(401);
  });

  it('500 quando o store lança', async () => {
    listMock.mockRejectedValueOnce(new Error('kv down'));
    const resp = await callGet();
    expect(resp.status).toBe(500);
  });
});
