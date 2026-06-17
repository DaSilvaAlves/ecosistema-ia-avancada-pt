import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { EXPIRED_SYNC_TOKEN } from '../../../mocks/handlers/google';
import { db } from '@/lib/db/client';
import {
  syncCalendarEvents,
  CalendarAuthError,
  CalendarSyncError,
} from '@/lib/google/calendar';

/**
 * Story 6.3 — helper puro de sync pull (`syncCalendarEvents`) (T2, AC1/AC3/AC4/AC5).
 *
 * Estratégia: Dexie REAL (fake-indexeddb via setup) + MSW handlers REAIS da
 * Calendar API (protocolo camelCase, `status:'cancelled'`, 410 Gone). Cobre o
 * ciclo de vida:
 *   - sync incremental (com syncToken) → upsert confirmados + delete cancelado;
 *   - full resync (sem syncToken) → paginação por nextPageToken;
 *   - all-day (start.date) → allDay:true;
 *   - idempotência por googleId (re-sync não duplica);
 *   - cancelado de googleId inexistente → no-op gracioso (deleted contabilizado);
 *   - 410 Gone → full resync automático (fullResync:true);
 *   - 401 → CalendarAuthError; 5xx → CalendarSyncError.
 */

const CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(async () => {
  await Dexie.delete('nexus_v2');
  await db.open();
});

afterEach(() => {
  db.close();
});

describe('syncCalendarEvents — sync incremental (AC1/AC3/AC4)', () => {
  it('upsert de eventos confirmed + remoção de cancelled numa só página', async () => {
    const result = await syncCalendarEvents('ya29.token', 'valid-sync-token');

    // 2 confirmed (reunião + all-day), 1 cancelled.
    expect(result.upserted).toBe(2);
    expect(result.deleted).toBe(1);
    expect(result.fullResync).toBe(false);
    expect(result.nextSyncToken).toBe('sync-token-after-incremental');

    const all = await db.calendarEvents.toArray();
    expect(all).toHaveLength(2);

    const reuniao = await db.calendarEvents
      .where('googleId')
      .equals('google_event_incremental_1')
      .first();
    expect(reuniao).toBeDefined();
    expect(reuniao!.title).toBe('Reunião com Paulo (actualizada)');
    expect(reuniao!.allDay).toBe(false);
    expect(reuniao!.startAt).toBe(Date.parse('2026-06-20T15:00:00+01:00'));
  });

  it('evento all-day (start.date) → allDay:true, meia-noite UTC', async () => {
    await syncCalendarEvents('ya29.token', 'valid-sync-token');
    const allDay = await db.calendarEvents
      .where('googleId')
      .equals('google_event_allday_1')
      .first();
    expect(allDay).toBeDefined();
    expect(allDay!.allDay).toBe(true);
    expect(allDay!.startAt).toBe(Date.parse('2026-06-25T00:00:00.000Z'));
  });
});

describe('syncCalendarEvents — idempotência por googleId (AC3)', () => {
  it('re-sync do mesmo evento actualiza, não duplica', async () => {
    await syncCalendarEvents('ya29.token', 'valid-sync-token');
    const firstId = (await db.calendarEvents
      .where('googleId')
      .equals('google_event_incremental_1')
      .first())!.id;

    // Segundo sync com os mesmos items.
    await syncCalendarEvents('ya29.token', 'valid-sync-token');

    const matches = await db.calendarEvents
      .where('googleId')
      .equals('google_event_incremental_1')
      .toArray();
    expect(matches).toHaveLength(1);
    // O id Nexus é preservado (não regenerado).
    expect(matches[0].id).toBe(firstId);
  });
});

describe('syncCalendarEvents — cancelado de googleId inexistente (AC4, eixo b)', () => {
  it('cancelar um evento nunca sincronizado é no-op gracioso (deleted contabilizado, sem erro)', async () => {
    server.use(
      http.get(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({
          kind: 'calendar#events',
          items: [{ id: 'never-synced-google-id', status: 'cancelled' }],
          nextSyncToken: 'tok',
        }),
      ),
    );
    const result = await syncCalendarEvents('ya29.token', 'valid-sync-token');
    expect(result.deleted).toBe(1);
    expect(result.upserted).toBe(0);
    expect(await db.calendarEvents.count()).toBe(0);
  });
});

describe('syncCalendarEvents — full resync com paginação (AC1)', () => {
  it('sem syncToken → itera nextPageToken até nextSyncToken final', async () => {
    const result = await syncCalendarEvents('ya29.token', null);

    // Página 1 (1 evento) + página 2 (1 evento).
    expect(result.upserted).toBe(2);
    expect(result.fullResync).toBe(true);
    expect(result.nextSyncToken).toBe('sync-token-after-full-resync');

    expect(await db.calendarEvents.count()).toBe(2);
    expect(
      await db.calendarEvents.where('googleId').equals('google_event_full_1').first(),
    ).toBeDefined();
    expect(
      await db.calendarEvents.where('googleId').equals('google_event_full_2').first(),
    ).toBeDefined();
  });
});

describe('syncCalendarEvents — 410 Gone → full resync automático (AC5)', () => {
  it('syncToken expirado → degrada para full resync, fullResync:true', async () => {
    const result = await syncCalendarEvents('ya29.token', EXPIRED_SYNC_TOKEN);

    // O 410 dispara um full resync (sem syncToken) → 2 eventos das 2 páginas.
    expect(result.fullResync).toBe(true);
    expect(result.upserted).toBe(2);
    expect(result.nextSyncToken).toBe('sync-token-after-full-resync');
    expect(await db.calendarEvents.count()).toBe(2);
  });
});

describe('syncCalendarEvents — caminhos de falha (eixo c, AC8)', () => {
  it('401 → CalendarAuthError, sem persistir', async () => {
    server.use(
      http.get(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 401, message: 'Invalid Credentials' } }, { status: 401 }),
      ),
    );
    await expect(syncCalendarEvents('ya29.bad', 'valid-sync-token')).rejects.toBeInstanceOf(
      CalendarAuthError,
    );
    expect(await db.calendarEvents.count()).toBe(0);
  });

  it('5xx Google → CalendarSyncError, sem persistir cursor parcial', async () => {
    server.use(
      http.get(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 503 } }, { status: 503 }),
      ),
    );
    await expect(syncCalendarEvents('ya29.token', 'valid-sync-token')).rejects.toBeInstanceOf(
      CalendarSyncError,
    );
  });

  it('falha a meio da paginação não devolve nextSyncToken (atomicidade — cursor não persistido)', async () => {
    let calls = 0;
    server.use(
      http.get(CALENDAR_EVENTS_ENDPOINT, ({ request }) => {
        calls++;
        const url = new URL(request.url);
        // Página 1 OK (com nextPageToken), página 2 falha com 503.
        if (!url.searchParams.get('pageToken')) {
          return HttpResponse.json({
            items: [
              {
                id: 'page1-ev',
                status: 'confirmed',
                summary: 'Pág 1',
                start: { dateTime: '2026-07-01T09:00:00Z' },
                end: { dateTime: '2026-07-01T10:00:00Z' },
                updated: '2026-06-16T08:00:00.000Z',
              },
            ],
            nextPageToken: 'p2',
          });
        }
        return HttpResponse.json({ error: { code: 503 } }, { status: 503 });
      }),
    );

    // Atomicidade (CodeRabbit major): a falha na página 2 propaga ANTES de o helper
    // produzir um SyncResult. Capturamos a rejeição e provamos que NENHUM resultado
    // (logo, nenhum nextSyncToken da página 1) foi devolvido — o helper nunca
    // persiste cursor (é a route quem o faz, só com o SyncResult final), portanto
    // um cursor parcial da página 1 é impossível de propagar.
    let result: Awaited<ReturnType<typeof syncCalendarEvents>> | undefined;
    let caught: unknown;
    try {
      result = await syncCalendarEvents('ya29.token', null);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(CalendarSyncError);
    expect(result).toBeUndefined(); // nenhum SyncResult → nenhum nextSyncToken propagado
    expect(calls).toBe(2);
  });
});

describe('syncCalendarEvents — FALSIFICÁVEL: fidelidade de protocolo (AC7, mock-protocol-fidelity)', () => {
  it('se o Google usar next_sync_token (snake_case errado), o helper NÃO persiste o cursor', async () => {
    // Handler com a chave ERRADA (snake_case) — protocolo real é camelCase.
    server.use(
      http.get(CALENDAR_EVENTS_ENDPOINT, () =>
        HttpResponse.json({
          items: [
            {
              id: 'ev-x',
              status: 'confirmed',
              summary: 'X',
              start: { dateTime: '2026-07-01T09:00:00Z' },
              end: { dateTime: '2026-07-01T10:00:00Z' },
              updated: '2026-06-16T08:00:00.000Z',
            },
          ],
          // chave incorrecta — o helper lê `nextSyncToken`, não isto.
          next_sync_token: 'wrong-snake-case',
        }),
      ),
    );
    const result = await syncCalendarEvents('ya29.token', 'valid-sync-token');
    // O cursor fica null porque a chave camelCase real está ausente — prova que o
    // helper depende do shape REAL (se aceitasse snake_case, este teste falharia).
    expect(result.nextSyncToken).toBeNull();
  });
});
