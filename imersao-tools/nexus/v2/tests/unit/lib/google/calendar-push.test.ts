import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
  DELETED_GOOGLE_EVENT_ID,
  PUSH_NOT_FOUND_SUMMARY,
  PUSH_RATE_LIMIT_SUMMARY,
  PUSH_SERVER_ERROR_SUMMARY,
} from '../../../mocks/handlers/google';
import {
  pushCalendarEvent,
  CalendarPushAuthError,
  CalendarPushError,
  CalendarPushNotFoundError,
  CalendarPushRateLimitError,
} from '@/lib/google/calendar-push';
import type { CalendarEvent } from '@/types/db';

/**
 * Story 6.4 — helper puro de push (`pushCalendarEvent`) (T2/T3, AC1/AC2/AC3/AC4/AC5).
 *
 * Estratégia: MSW handlers REAIS da Calendar API (protocolo camelCase: insert POST
 * 201, update PUT 200, 404, 429, 5xx). Helper SEM Dexie (recebe accessToken por
 * parâmetro — AC1 iv) → ~100% testável. Cobre:
 *   - insert (sem googleId) → POST → PushResult com googleId do Google;
 *   - update (com googleId) → PUT full replace → PushResult (inserted:false);
 *   - all-day → start.date / end.date (YYYY-MM-DD);
 *   - mapeamento epoch ms → ISO 8601 (dateTime);
 *   - 404 no update → CalendarPushNotFoundError;
 *   - 429 → CalendarPushRateLimitError; 5xx → CalendarPushError; 401 → CalendarPushAuthError;
 *   - falsificável (AC7): resposta sem `id` → CalendarPushError (não persiste googleId undefined).
 */

const CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** Evento local-pendente (sem googleId) — classe que a 6.6 produzirá. */
function localPendente(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Reunião com Paulo',
    startAt: Date.parse('2026-06-20T15:00:00.000Z'),
    endAt: Date.parse('2026-06-20T16:00:00.000Z'),
    allDay: false,
    updatedAt: Date.parse('2026-06-17T10:00:00.000Z'),
    ...overrides,
  };
}

describe('pushCalendarEvent — insert de evento local-pendente (AC1 i / AC3)', () => {
  it('sem googleId → POST events.insert → PushResult com googleId do Google', async () => {
    const result = await pushCalendarEvent('ya29.token', localPendente());

    expect(result.inserted).toBe(true);
    expect(result.googleId).toBe('google_event_inserted_1');
    expect(result.etag).toBe('"insert-etag-3387"');
    expect(result.updatedAt).toBe(Date.parse('2026-06-17T12:00:00.000Z'));
  });

  it('mapeia title→summary e startAt/endAt (epoch ms)→start/end.dateTime ISO 8601 (AC3)', async () => {
    // Captura o corpo enviado ao Google para asserir o mapeamento.
    let captured: { summary?: string; start?: { dateTime?: string }; end?: { dateTime?: string } } | null = null;
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json(
          {
            id: 'g1',
            etag: '"e"',
            status: 'confirmed',
            updated: '2026-06-17T12:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    await pushCalendarEvent('ya29.token', localPendente());

    expect(captured).not.toBeNull();
    expect(captured!.summary).toBe('Reunião com Paulo');
    expect(captured!.start!.dateTime).toBe('2026-06-20T15:00:00.000Z');
    expect(captured!.end!.dateTime).toBe('2026-06-20T16:00:00.000Z');
  });

  it('evento all-day → start.date / end.date (YYYY-MM-DD), sem dateTime (AC3)', async () => {
    let captured: { start?: { date?: string; dateTime?: string }; end?: { date?: string } } | null = null;
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json(
          { id: 'g-allday', etag: '"e"', status: 'confirmed', updated: '2026-06-17T12:00:00.000Z' },
          { status: 201 },
        );
      }),
    );

    await pushCalendarEvent(
      'ya29.token',
      localPendente({
        allDay: true,
        startAt: Date.parse('2026-06-25T00:00:00.000Z'),
        endAt: Date.parse('2026-06-26T00:00:00.000Z'),
      }),
    );

    expect(captured).not.toBeNull();
    expect(captured!.start!.date).toBe('2026-06-25');
    expect(captured!.start!.dateTime).toBeUndefined();
    expect(captured!.end!.date).toBe('2026-06-26');
  });
});

describe('pushCalendarEvent — update de evento sincronizado (AC1 ii)', () => {
  it('com googleId → PUT events.update full replace → PushResult inserted:false', async () => {
    const result = await pushCalendarEvent(
      'ya29.token',
      localPendente({ googleId: 'existing-google-id' }),
    );

    expect(result.inserted).toBe(false);
    // O handler PUT ecoa o eventId do path como `id`.
    expect(result.googleId).toBe('existing-google-id');
    expect(result.etag).toBe('"update-etag-9912"');
  });

  it('PUT envia o eventId no path (mapeamento da URL de update)', async () => {
    let putUrl = '';
    server.use(
      http.put(`${CALENDAR_EVENTS_ENDPOINT}/:eventId`, ({ request, params }) => {
        putUrl = request.url;
        return HttpResponse.json({
          id: params.eventId as string,
          etag: '"e"',
          status: 'confirmed',
          updated: '2026-06-17T13:30:00.000Z',
        });
      }),
    );

    await pushCalendarEvent('ya29.token', localPendente({ googleId: 'gid-xyz' }));
    expect(putUrl).toContain('/events/gid-xyz');
  });
});

describe('pushCalendarEvent — caminhos de falha (AC4)', () => {
  it('404 no update (evento apagado no Google) → CalendarPushNotFoundError (AC4 i)', async () => {
    await expect(
      pushCalendarEvent('ya29.token', localPendente({ googleId: DELETED_GOOGLE_EVENT_ID })),
    ).rejects.toBeInstanceOf(CalendarPushNotFoundError);
  });

  it('429 rate limit → CalendarPushRateLimitError (AC4 ii)', async () => {
    await expect(
      pushCalendarEvent('ya29.token', localPendente({ title: PUSH_RATE_LIMIT_SUMMARY })),
    ).rejects.toBeInstanceOf(CalendarPushRateLimitError);
  });

  it('5xx Google → CalendarPushError (AC4 iii)', async () => {
    await expect(
      pushCalendarEvent('ya29.token', localPendente({ title: PUSH_SERVER_ERROR_SUMMARY })),
    ).rejects.toBeInstanceOf(CalendarPushError);
  });

  it('401 access token rejeitado → CalendarPushAuthError', async () => {
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 401, message: 'Invalid Credentials' } }, { status: 401 }),
      ),
    );
    await expect(pushCalendarEvent('ya29.bad', localPendente())).rejects.toBeInstanceOf(
      CalendarPushAuthError,
    );
  });

  it('falha de rede no insert → CalendarPushError (sem estado parcial)', async () => {
    server.use(http.post(CALENDAR_EVENTS_ENDPOINT, () => HttpResponse.error()));
    await expect(pushCalendarEvent('ya29.token', localPendente())).rejects.toBeInstanceOf(
      CalendarPushError,
    );
  });

  it('404 no update via summary sentinela → CalendarPushNotFoundError', async () => {
    await expect(
      pushCalendarEvent(
        'ya29.token',
        localPendente({ googleId: 'some-id', title: PUSH_NOT_FOUND_SUMMARY }),
      ),
    ).rejects.toBeInstanceOf(CalendarPushNotFoundError);
  });
});

describe('pushCalendarEvent — ramos defensivos do mapeamento da resposta', () => {
  it('resposta sem `updated` → updatedAt cai para agora (fallback defensivo)', async () => {
    const antes = Date.now();
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, () =>
        // Resposta válida (tem `id`) mas SEM `updated` nem `etag`.
        HttpResponse.json({ id: 'g-sem-updated', status: 'confirmed' }, { status: 201 }),
      ),
    );

    const result = await pushCalendarEvent('ya29.token', localPendente());
    expect(result.googleId).toBe('g-sem-updated');
    expect(result.etag).toBe('');
    expect(result.updatedAt).toBeGreaterThanOrEqual(antes);
  });

  it('404 num insert (POST) → CalendarPushError (não NotFound — 404 só é NotFound no update)', async () => {
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 404 } }, { status: 404 }),
      ),
    );
    await expect(pushCalendarEvent('ya29.token', localPendente())).rejects.toBeInstanceOf(
      CalendarPushError,
    );
  });
});

describe('pushCalendarEvent — fidelidade de protocolo falsificável (AC7)', () => {
  it('resposta sem `id` (shape errado) → CalendarPushError, NÃO persiste googleId undefined', async () => {
    // Handler que devolve `eventId` (camelCase errado) em vez de `id`.
    server.use(
      http.post(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json(
          { eventId: 'wrong-key', etag: '"e"', status: 'confirmed', updated: '2026-06-17T12:00:00.000Z' },
          { status: 201 },
        ),
      ),
    );

    // Se o helper aceitasse o shape errado, devolveria googleId undefined e a
    // idempotência (AC2) falharia. O teste prova que lança em vez disso.
    await expect(pushCalendarEvent('ya29.token', localPendente())).rejects.toBeInstanceOf(
      CalendarPushError,
    );
  });
});
