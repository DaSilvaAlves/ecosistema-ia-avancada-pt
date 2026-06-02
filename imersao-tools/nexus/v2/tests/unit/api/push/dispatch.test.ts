import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 4.8 — testes do disparo agendado `POST /api/push/dispatch` (AC2/AC4/AC7).
 *
 * Cobre:
 *   - 503 quando CRON_SECRET não está configurado (fail-closed)
 *   - 401 sem Bearer / com Bearer errado
 *   - janela de disparo NÃO-TAUTOLÓGICA: futuro NÃO dispara; vencido dispara 1×
 *   - `sent`/futuro ignorados (base da idempotência AC4)
 *   - disparado é marcado `sent` (transição que impede re-disparo)
 *
 * Mockamos `send-notification` e `schedule-store` (testamos a orquestração +
 * auth do endpoint), e `env` para controlar o CRON_SECRET. Padrão de invocação
 * de route handler alinhado com `tests/unit/api/agent/undo.test.ts`.
 */

let mockCronSecret: string | undefined = 'test-cron-secret';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ CRON_SECRET: mockCronSecret })),
}));

vi.mock('@/lib/push/send-notification', () => ({
  sendPushNotification: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/lib/push/schedule-store', () => ({
  listSchedules: vi.fn(async () => []),
  markScheduleSent: vi.fn(async () => undefined),
}));

import { sendPushNotification } from '@/lib/push/send-notification';
import { listSchedules, markScheduleSent } from '@/lib/push/schedule-store';

const sendMock = sendPushNotification as unknown as ReturnType<typeof vi.fn>;
const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;
const markMock = markScheduleSent as unknown as ReturnType<typeof vi.fn>;

const NOW = 1717200000000;
const SECRET = 'test-cron-secret';

function entry(over: Partial<ScheduleEntry>): ScheduleEntry {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    fireAt: NOW - 1000,
    text: 'Pagar a luz',
    status: 'pending',
    ...over,
  };
}

async function callDispatch(auth?: string): Promise<Response> {
  const { POST } = await import('@/app/api/push/dispatch/route');
  const headers = new Headers();
  if (auth !== undefined) headers.set('Authorization', auth);
  const req = new Request('http://localhost:3001/api/push/dispatch', {
    method: 'POST',
    headers,
  });
  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockCronSecret = SECRET;
  sendMock.mockResolvedValue({ ok: true });
  listMock.mockResolvedValue([]);
  markMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/push/dispatch — auth', () => {
  it('503 quando CRON_SECRET não está configurado', async () => {
    mockCronSecret = undefined;
    const resp = await callDispatch(`Bearer ${SECRET}`);
    expect(resp.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('401 sem header Authorization', async () => {
    const resp = await callDispatch(undefined);
    expect(resp.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('401 com Bearer errado', async () => {
    const resp = await callDispatch('Bearer wrong-secret');
    expect(resp.status).toBe(401);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('200 com Bearer correcto', async () => {
    const resp = await callDispatch(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
  });
});

describe('POST /api/push/dispatch — janela de disparo (não-tautológico)', () => {
  it('NÃO dispara um lembrete com fireAt no futuro', async () => {
    listMock.mockResolvedValue([entry({ fireAt: NOW + 60_000 })]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number; total: number };
    expect(sendMock).not.toHaveBeenCalled();
    expect(markMock).not.toHaveBeenCalled();
    expect(json.dispatched).toBe(0);
    expect(json.total).toBe(0);
  });

  it('dispara EXACTAMENTE uma vez um lembrete vencido pending e marca-o sent', async () => {
    const due = entry({ fireAt: NOW - 1000 });
    listMock.mockResolvedValue([due]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number };
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      title: 'Lembrete',
      body: 'Pagar a luz',
      data: { reminderId: due.id },
    });
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(due);
    expect(json.dispatched).toBe(1);
  });

  it('dispara no limite exacto fireAt === now', async () => {
    listMock.mockResolvedValue([entry({ fireAt: NOW })]);
    await callDispatch(`Bearer ${SECRET}`);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('ignora lembretes já sent (base da idempotência AC4)', async () => {
    listMock.mockResolvedValue([entry({ status: 'sent', fireAt: NOW - 5000 })]);
    await callDispatch(`Bearer ${SECRET}`);
    expect(sendMock).not.toHaveBeenCalled();
    expect(markMock).not.toHaveBeenCalled();
  });

  it('não marca sent quando o envio falha (deixa pending para retry)', async () => {
    sendMock.mockResolvedValue({ ok: false, reason: 'no_subscription' });
    listMock.mockResolvedValue([entry({ fireAt: NOW - 1000 })]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number; failed: number };
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(markMock).not.toHaveBeenCalled();
    expect(json.dispatched).toBe(0);
    expect(json.failed).toBe(1);
  });

  it('dispara só os devidos numa lista mista (vencido sim, futuro não)', async () => {
    listMock.mockResolvedValue([
      entry({ id: '11111111-1111-4111-8111-111111111111', fireAt: NOW - 1000 }),
      entry({ id: '22222222-2222-4222-8222-222222222222', fireAt: NOW + 1000 }),
    ]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number };
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(json.dispatched).toBe(1);
  });
});
