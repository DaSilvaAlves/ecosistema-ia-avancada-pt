import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 6.16 (T5.1/T5.3/T5.4/T5.5, AC1/AC3/AC4/AC5) — despacho de lembretes via
 * canal `telegram` no dispatcher unificado `POST /api/push/dispatch`.
 *
 * Estratégia de mock:
 *   - `env`/`schedule-store`/`send-notification` mockados via `vi.mock` (mesma
 *     técnica do `dispatch.test.ts` da 4.8 — testa a orquestração + auth).
 *   - `sendMessage` (Telegram) corre REAL contra o handler MSW `sendMessage`
 *     (`telegram.ts`, shape real `{ok:true,result:Message}`) — protocol fidelity
 *     C14 (`mock-protocol-fidelity.md`). Um handler de captura regista os corpos
 *     entregues para asserções. NÃO mockamos `bot-api` → o teste falharia se o
 *     shape do protocolo divergisse.
 *
 * AC2 (push Epic 4 sem regressão) é coberto por `dispatch.test.ts` (intocado).
 */

let mockCronSecret: string | undefined = 'test-cron-secret';
let mockChatId: string | undefined = '987654321';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({
    CRON_SECRET: mockCronSecret,
    TELEGRAM_CHAT_ID: mockChatId,
    TELEGRAM_BOT_TOKEN: '7654321:AAExampleBotTokenForTests',
  })),
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

const sendPushMock = sendPushNotification as unknown as ReturnType<typeof vi.fn>;
const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;
const markMock = markScheduleSent as unknown as ReturnType<typeof vi.fn>;

const NOW = 1717200000000;
const SECRET = 'test-cron-secret';
const CHAT_ID = '987654321';

/** Captura os `sendMessage` reais entregues à Bot API (via MSW). */
const sentMessages: Array<{ chat_id: unknown; text: string }> = [];

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

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mockCronSecret = SECRET;
  mockChatId = CHAT_ID;
  // `bot-api.ts` lê `process.env.TELEGRAM_BOT_TOKEN` directamente (não via env mock).
  process.env.TELEGRAM_BOT_TOKEN = '7654321:AAExampleBotTokenForTests';
  sentMessages.length = 0;
  sendPushMock.mockResolvedValue({ ok: true });
  listMock.mockResolvedValue([]);
  markMock.mockResolvedValue(undefined);
  // Handler de captura — precede o default de telegram.ts (server.use first-match).
  server.use(
    http.post('https://api.telegram.org/bot:token/sendMessage', async ({ request }) => {
      const body = (await request.json()) as { chat_id?: unknown; text?: unknown };
      sentMessages.push({ chat_id: body.chat_id, text: String(body.text) });
      return HttpResponse.json({
        ok: true,
        result: { message_id: 7, chat: { id: body.chat_id, type: 'private' }, text: body.text },
      });
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  server.close();
});

describe('dispatch telegram — AC1 (lembrete só-telegram chega via sendMessage)', () => {
  it('channels:[telegram] vencido → sendMessage 1× com chatId + texto exacto; push NÃO chamado', async () => {
    const due = entry({ channels: ['telegram'], fireAt: NOW - 1000 });
    listMock.mockResolvedValue([due]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number };
    expect(resp.status).toBe(200);
    expect(sentMessages).toHaveLength(1);
    expect(String(sentMessages[0].chat_id)).toBe(CHAT_ID);
    expect(sentMessages[0].text).toBe('Pagar a luz');
    expect(sendPushMock).not.toHaveBeenCalled();
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(due);
    expect(json.dispatched).toBe(1);
  });
});

describe('dispatch telegram — AC5 (duplo canal push + telegram)', () => {
  it('channels:[push,telegram] → sendPushNotification 1× E sendMessage 1×; sent após ambos', async () => {
    const due = entry({ channels: ['push', 'telegram'], fireAt: NOW - 1000 });
    listMock.mockResolvedValue([due]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(sendPushMock).toHaveBeenCalledTimes(1);
    expect(sentMessages).toHaveLength(1);
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(due);
  });
});

describe('dispatch telegram — AC3 (idempotência sent)', () => {
  it('channels:[telegram] já sent → sendMessage NÃO chamado', async () => {
    listMock.mockResolvedValue([
      entry({ channels: ['telegram'], status: 'sent', fireAt: NOW - 5000 }),
    ]);
    await callDispatch(`Bearer ${SECRET}`);
    expect(sentMessages).toHaveLength(0);
    expect(markMock).not.toHaveBeenCalled();
  });
});

describe('dispatch telegram — AC4 (fallback: sendMessage falha)', () => {
  it('sendMessage falha no lembrete A → lembrete B tentado; endpoint 200; A fica pending (não marca sent)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // 1.ª chamada falha (rede), 2.ª tem êxito → discrimina por contador.
    let calls = 0;
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', async ({ request }) => {
        calls += 1;
        if (calls === 1) return HttpResponse.error();
        const body = (await request.json()) as { chat_id?: unknown; text?: unknown };
        sentMessages.push({ chat_id: body.chat_id, text: String(body.text) });
        return HttpResponse.json({
          ok: true,
          result: { message_id: 8, chat: { id: body.chat_id, type: 'private' }, text: body.text },
        });
      }),
    );
    const a = entry({ id: '11111111-1111-4111-8111-111111111111', channels: ['telegram'], fireAt: NOW - 2000, text: 'Lembrete A' });
    const b = entry({ id: '22222222-2222-4222-8222-222222222222', channels: ['telegram'], fireAt: NOW - 1000, text: 'Lembrete B' });
    listMock.mockResolvedValue([a, b]);

    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number; failed: number; total: number };
    expect(resp.status).toBe(200);
    // 2 tentativas (A falhou, B tentado) — o lote NÃO abortou em A.
    expect(calls).toBe(2);
    // B entregue com êxito.
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].text).toBe('Lembrete B');
    // A falhou → não marcado sent; B êxito → marcado sent (1×).
    expect(markMock).toHaveBeenCalledTimes(1);
    expect(markMock).toHaveBeenCalledWith(b);
    expect(json.total).toBe(2);
    expect(json.dispatched).toBe(1);
    expect(json.failed).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('TELEGRAM_CHAT_ID ausente → sendMessage NÃO chamado, canal falhado gracioso (C11)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockChatId = undefined;
    listMock.mockResolvedValue([entry({ channels: ['telegram'], fireAt: NOW - 1000 })]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number; failed: number };
    expect(resp.status).toBe(200);
    expect(sentMessages).toHaveLength(0);
    expect(markMock).not.toHaveBeenCalled();
    expect(json.dispatched).toBe(0);
    expect(json.failed).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('dispatch telegram — C3 (silent-loss guard: duplo canal, telegram falha)', () => {
  it('channels:[push,telegram], push OK mas telegram falha → NÃO marca sent (fica pending)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendPushMock.mockResolvedValue({ ok: true });
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', () => HttpResponse.error()),
    );
    const due = entry({ channels: ['push', 'telegram'], fireAt: NOW - 1000 });
    listMock.mockResolvedValue([due]);
    const resp = await callDispatch(`Bearer ${SECRET}`);
    const json = (await resp.json()) as { dispatched: number; failed: number };
    expect(resp.status).toBe(200);
    // push tentado, telegram falhou → sent NÃO marcado (silent-loss guard M1).
    expect(sendPushMock).toHaveBeenCalledTimes(1);
    expect(markMock).not.toHaveBeenCalled();
    expect(json.dispatched).toBe(0);
    expect(json.failed).toBe(1);
    errSpy.mockRestore();
  });
});

describe('dispatch telegram — CR Iter 1 F3 (dedup de canais)', () => {
  it('channels:[telegram,telegram] → sendMessage 1× (sem duplicado no mesmo tick)', async () => {
    listMock.mockResolvedValue([
      entry({ channels: ['telegram', 'telegram'], fireAt: NOW - 1000 }),
    ]);
    await callDispatch(`Bearer ${SECRET}`);
    expect(sentMessages).toHaveLength(1);
  });
});

describe('dispatch telegram — C1/AC2 (retrocompatibilidade: channels ausente = push)', () => {
  it('entrada sem channels (legado 4.8) → só push, sendMessage NÃO chamado', async () => {
    listMock.mockResolvedValue([entry({ fireAt: NOW - 1000 })]); // sem channels
    const resp = await callDispatch(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(sendPushMock).toHaveBeenCalledTimes(1);
    expect(sentMessages).toHaveLength(0);
    expect(markMock).toHaveBeenCalledTimes(1);
  });
});
