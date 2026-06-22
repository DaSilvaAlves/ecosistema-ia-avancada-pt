import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 6.16 (T5.6-T5.9, AC6-AC9) — endpoint de briefing matinal
 * `POST /api/telegram/briefing`.
 *
 * Estratégia de mock:
 *   - `env` mockado (`CRON_SECRET`, `TELEGRAM_CHAT_ID`, janela horária).
 *   - `@vercel/kv` mockado (marcador `last_sent` da idempotência diária C9).
 *   - `schedule-store.listSchedules` mockado (lembretes do dia C10).
 *   - `sendMessage` REAL via MSW (shape `{ok:true,result:Message}`) — protocol
 *     fidelity C14. NÃO mockamos `bot-api`.
 *   - A janela horária + a data de Lisboa são lógica REAL de `briefing.ts`
 *     (`Intl`/DST) — controladas por `vi.setSystemTime`. Junho = Lisboa UTC+1
 *     (WEST), por isso UTC 07:00 = Lisboa 08:00 (dentro de `[7,9[`).
 */

let mockCronSecret: string | undefined = 'test-cron-secret';
let mockChatId: string | undefined = '987654321';
let mockHourStart: number | undefined;
let mockHourEnd: number | undefined;
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({
    CRON_SECRET: mockCronSecret,
    TELEGRAM_CHAT_ID: mockChatId,
    TELEGRAM_BOT_TOKEN: '7654321:AAExampleBotTokenForTests',
    BRIEFING_HOUR_START: mockHourStart,
    BRIEFING_HOUR_END: mockHourEnd,
  })),
}));

vi.mock('@vercel/kv', () => ({
  kv: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('@/lib/push/schedule-store', () => ({
  listSchedules: vi.fn(async () => []),
}));

import { kv } from '@vercel/kv';
import { listSchedules } from '@/lib/push/schedule-store';

const kvMock = kv as unknown as { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
const listMock = listSchedules as unknown as ReturnType<typeof vi.fn>;

const SECRET = 'test-cron-secret';
const CHAT_ID = '987654321';

// Junho 2026 → Lisboa UTC+1. UTC 07:00 = Lisboa 08:00 (dentro de [7,9[).
const INSIDE_WINDOW = Date.UTC(2026, 5, 23, 7, 0, 0); // 2026-06-23 07:00 UTC = 08:00 Lisboa
const OUTSIDE_WINDOW = Date.UTC(2026, 5, 23, 12, 0, 0); // 13:00 Lisboa
const TODAY_LISBON = '2026-06-23';
const YESTERDAY_LISBON = '2026-06-22';

const sentMessages: Array<{ chat_id: unknown; text: string }> = [];

function entry(over: Partial<ScheduleEntry>): ScheduleEntry {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    fireAt: INSIDE_WINDOW,
    text: 'Pagar a luz',
    status: 'pending',
    ...over,
  };
}

async function callBriefing(auth?: string): Promise<Response> {
  const { POST } = await import('@/app/api/telegram/briefing/route');
  const headers = new Headers();
  if (auth !== undefined) headers.set('Authorization', auth);
  const req = new Request('http://localhost:3001/api/telegram/briefing', {
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
  vi.setSystemTime(INSIDE_WINDOW);
  mockCronSecret = SECRET;
  mockChatId = CHAT_ID;
  mockHourStart = undefined;
  mockHourEnd = undefined;
  // `bot-api.ts` lê `process.env.TELEGRAM_BOT_TOKEN` directamente (não via env mock).
  process.env.TELEGRAM_BOT_TOKEN = '7654321:AAExampleBotTokenForTests';
  sentMessages.length = 0;
  kvMock.get.mockResolvedValue(null);
  kvMock.set.mockResolvedValue(undefined);
  listMock.mockResolvedValue([]);
  server.use(
    http.post('https://api.telegram.org/bot:token/sendMessage', async ({ request }) => {
      const body = (await request.json()) as { chat_id?: unknown; text?: unknown };
      sentMessages.push({ chat_id: body.chat_id, text: String(body.text) });
      return HttpResponse.json({
        ok: true,
        result: { message_id: 9, chat: { id: body.chat_id, type: 'private' }, text: body.text },
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

describe('briefing — auth (AC9, fail-closed)', () => {
  it('503 quando CRON_SECRET ausente', async () => {
    mockCronSecret = undefined;
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(503);
    expect(sentMessages).toHaveLength(0);
  });

  it('401 sem header Authorization', async () => {
    const resp = await callBriefing(undefined);
    expect(resp.status).toBe(401);
    expect(sentMessages).toHaveLength(0);
  });

  it('401 com Bearer errado', async () => {
    const resp = await callBriefing('Bearer wrong-secret');
    expect(resp.status).toBe(401);
    expect(sentMessages).toHaveLength(0);
  });
});

describe('briefing — janela horária (AC7, C8 Europe/Lisbon)', () => {
  it('dentro da janela [7,9[ → sendMessage chamado', async () => {
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: true, sent: true });
    expect(sentMessages).toHaveLength(1);
  });

  it('fora da janela → sendMessage NÃO chamado, {ok:false,reason:outside_window} 200', async () => {
    vi.setSystemTime(OUTSIDE_WINDOW);
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: false, reason: 'outside_window' });
    expect(sentMessages).toHaveLength(0);
  });

  it('janela configurável: BRIEFING_HOUR_START/END override → 13h Lisboa dentro de [12,14[', async () => {
    mockHourStart = 12;
    mockHourEnd = 14;
    vi.setSystemTime(OUTSIDE_WINDOW); // 13h Lisboa
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: true, sent: true });
    expect(sentMessages).toHaveLength(1);
  });
});

describe('briefing — idempotência diária (AC8, C9)', () => {
  it('last_sent = hoje (Lisboa) → sendMessage NÃO chamado, {ok:false,reason:already_sent}', async () => {
    kvMock.get.mockResolvedValue(TODAY_LISBON);
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: false, reason: 'already_sent' });
    expect(sentMessages).toHaveLength(0);
    expect(kvMock.set).not.toHaveBeenCalled();
  });

  it('last_sent = ontem → sendMessage chamado E last_sent gravado com a data de hoje', async () => {
    kvMock.get.mockResolvedValue(YESTERDAY_LISBON);
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(sentMessages).toHaveLength(1);
    expect(kvMock.set).toHaveBeenCalledWith('nexus:telegram:briefing:last_sent', TODAY_LISBON);
  });

  it('last_sent ausente (primeiro envio) → sendMessage chamado', async () => {
    kvMock.get.mockResolvedValue(null);
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(sentMessages).toHaveLength(1);
    expect(kvMock.set).toHaveBeenCalledWith('nexus:telegram:briefing:last_sent', TODAY_LISBON);
  });
});

describe('briefing — conteúdo (AC6/C10) e chatId (C11)', () => {
  it('inclui lembretes do dia (fonte server-side) no texto', async () => {
    listMock.mockResolvedValue([
      entry({ id: '11111111-1111-4111-8111-111111111111', text: 'Reunião dentista', fireAt: INSIDE_WINDOW }),
    ]);
    await callBriefing(`Bearer ${SECRET}`);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].text).toContain('Reunião dentista');
    expect(String(sentMessages[0].chat_id)).toBe(CHAT_ID);
    expect(sentMessages[0].text.length).toBeGreaterThan(0);
  });

  it('sem lembretes → texto não-vazio (cabeçalho + linha honesta), nunca string vazia', async () => {
    listMock.mockResolvedValue([]);
    await callBriefing(`Bearer ${SECRET}`);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].text.length).toBeGreaterThan(0);
    expect(sentMessages[0].text).toContain('app');
  });

  it('TELEGRAM_CHAT_ID ausente → sendMessage NÃO chamado, {ok:false,reason:no_chat_id} 200, last_sent não gravado', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockChatId = undefined;
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: false, reason: 'no_chat_id' });
    expect(sentMessages).toHaveLength(0);
    expect(kvMock.set).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('briefing — fallback de entrega (C9 silent-loss guard)', () => {
  it('sendMessage falha → {ok:false,reason:send_failed} 200, last_sent NÃO gravado (re-envio possível)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', () => HttpResponse.error()),
    );
    const resp = await callBriefing(`Bearer ${SECRET}`);
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({ ok: false, reason: 'send_failed' });
    expect(kvMock.set).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
