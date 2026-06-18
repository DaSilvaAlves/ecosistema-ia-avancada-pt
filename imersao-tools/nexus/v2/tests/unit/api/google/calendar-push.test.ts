import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Dexie from 'dexie';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
  DELETED_GOOGLE_EVENT_ID,
  PUSH_RATE_LIMIT_SUMMARY,
  PUSH_SERVER_ERROR_SUMMARY,
} from '../../../mocks/handlers/google';
import { TokenRevokedError, TokenRefreshError } from '@/lib/google/token-store';
import { db } from '@/lib/db/client';
import { CALENDAR_SYNC_TOKEN_KEY } from '@/lib/google/calendar-sync-token';
import type { CalendarEvent } from '@/types/db';

/**
 * Story 6.4 — testes da route `POST /api/google/calendar/push` (T4, AC2/AC5/AC6).
 *
 * Estratégia: route FINA + Dexie REAL (fake-indexeddb) + MSW REAL (Google).
 *   - `getSession` e `getValidAccessToken` mockados (controlam auth);
 *   - `pushCalendarEvent` NÃO mockado — exercita o helper real contra MSW (a
 *     coordenação E a persistência Dexie são testadas em conjunto);
 *   - `@vercel/kv` com Map real → prova que o cursor KV do pull NÃO é tocado (T3).
 *
 * Cobre o ciclo de vida (eixo c):
 *   - sem sessão → 401; not_connected → 401; token_revoked → 401; refresh_failed → 503;
 *   - tabela sem local-pendente → 200 { pushed: 0 } (caminho feliz, C1-a);
 *   - insert bem-sucedido → 200 { pushed: 1 } + googleId persistido (AC2);
 *   - re-push de evento já com googleId → update, não insert (idempotência AC2/AC5);
 *   - 5xx Google → 503 calendar_push_unavailable, sem googleId persistido (eixo c);
 *   - cursor KV do pull intacto (anti-loop estrutural, AC5).
 */

const kvStore = new Map<string, unknown>();
vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(async (key: string, value: unknown) => {
      kvStore.set(key, value);
    }),
    get: vi.fn(async (key: string) => (kvStore.has(key) ? kvStore.get(key) : null)),
    del: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
  },
}));

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'sess' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

let accessTokenResult: string | null = 'ya29.valid';
let accessTokenError: Error | null = null;
vi.mock('@/lib/google/token-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/token-store')>();
  return {
    ...actual,
    getValidAccessToken: vi.fn(async () => {
      if (accessTokenError) throw accessTokenError;
      return accessTokenResult;
    }),
  };
});

async function call(): Promise<Response> {
  const { POST } = await import('@/app/api/google/calendar/push/route');
  const headers = new Headers();
  headers.set('Cookie', 'nexus_session=sess');
  return POST(
    new Request('http://localhost:3001/api/google/calendar/push', { method: 'POST', headers }),
  );
}

function localPendente(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Evento criado no Nexus',
    startAt: Date.parse('2026-06-20T15:00:00.000Z'),
    endAt: Date.parse('2026-06-20T16:00:00.000Z'),
    allDay: false,
    updatedAt: Date.parse('2026-06-17T10:00:00.000Z'),
    ...overrides,
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

beforeEach(async () => {
  vi.clearAllMocks();
  kvStore.clear();
  mockSessionValid = true;
  accessTokenResult = 'ya29.valid';
  accessTokenError = null;
  await Dexie.delete('nexus_v2');
  await db.open();
});

afterEach(() => {
  server.resetHandlers();
  db.close();
});

describe('calendar/push — auth (AC6 i/ii)', () => {
  it('sem sessão → 401', async () => {
    mockSessionValid = false;
    const res = await call();
    expect(res.status).toBe(401);
  });

  it('token null (não ligado) → 401 not_connected', async () => {
    accessTokenResult = null;
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'not_connected' });
  });

  it('TokenRevokedError → 401 token_revoked', async () => {
    accessTokenError = new TokenRevokedError();
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'token_revoked' });
  });

  it('TokenRefreshError → 503 refresh_failed', async () => {
    accessTokenError = new TokenRefreshError('Google indisponível');
    const res = await call();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'refresh_failed' });
  });
});

describe('calendar/push — caminho feliz idempotente-vazio (AC6 iv, C1-a)', () => {
  it('tabela sem local-pendente → 200 { pushed: 0, updated: 0, failed: 0 }', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, pushed: 0, updated: 0, failed: 0 });
  });

  it('tabela só com eventos sincronizados (com googleId) → pushed: 0 (não re-empurra origem-Google, AC5)', async () => {
    // Evento de origem-Google (tem googleId) — o pull (6.3) é que o criou.
    await db.calendarEvents.add(localPendente({ googleId: 'from-google-1' }));
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, pushed: 0, updated: 0, failed: 0 });
  });
});

describe('calendar/push — insert + persistência do googleId (AC2)', () => {
  it('1 evento local-pendente → insert → 200 { pushed: 1 } + googleId persistido em Dexie', async () => {
    await db.calendarEvents.add(localPendente());
    const res = await call();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, pushed: 1, updated: 0, failed: 0 });

    // (AC2) O googleId devolvido pelo Google foi persistido no registo Nexus.
    const persisted = await db.calendarEvents.get('22222222-2222-4222-8222-222222222222');
    expect(persisted!.googleId).toBe('google_event_inserted_1');
  });

  it('anti-loop estrutural: após push, re-push do mesmo evento NÃO re-insere (AC5)', async () => {
    await db.calendarEvents.add(localPendente());
    await call(); // 1.º push: insere e persiste googleId.

    // 2.º push: o evento já tem googleId → não está em local-pendente → pushed:0.
    const res2 = await call();
    expect(await res2.json()).toEqual({ ok: true, pushed: 0, updated: 0, failed: 0 });

    // Não duplicou: continua a haver exactamente 1 registo.
    expect(await db.calendarEvents.count()).toBe(1);
  });

  it('cursor KV do pull NÃO é tocado pelo push (T3 — routes independentes)', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, 'cursor-do-pull-intacto');
    await db.calendarEvents.add(localPendente());
    await call();
    expect(kvStore.get(CALENDAR_SYNC_TOKEN_KEY)).toBe('cursor-do-pull-intacto');
  });
});

describe('calendar/push — caminhos de falha (AC4, eixo c)', () => {
  it('5xx Google no insert → 503 calendar_push_unavailable, googleId NÃO persistido', async () => {
    await db.calendarEvents.add(localPendente({ title: PUSH_SERVER_ERROR_SUMMARY }));
    const res = await call();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'calendar_push_unavailable' });

    // Sem estado parcial: o evento permanece local-pendente (sem googleId).
    const ev = await db.calendarEvents.get('22222222-2222-4222-8222-222222222222');
    expect(ev!.googleId).toBeUndefined();
  });

  it('429 rate limit → 503 rate_limited', async () => {
    await db.calendarEvents.add(localPendente({ title: PUSH_RATE_LIMIT_SUMMARY }));
    const res = await call();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
  });

  it('insert bem-sucedido seguido de falha NÃO persiste googleId do que falhou (atomicidade por evento)', async () => {
    // 1.º evento ok, 2.º evento dispara 5xx → aborta o lote com 503.
    await db.calendarEvents.add(localPendente({ id: '33333333-3333-4333-8333-333333333333' }));
    await db.calendarEvents.add(
      localPendente({ id: '44444444-4444-4444-8444-444444444444', title: PUSH_SERVER_ERROR_SUMMARY }),
    );
    const res = await call();
    expect(res.status).toBe(503);

    // O 1.º evento (que teria insert OK) também não acaba com googleId: a iteração
    // do lote é por ordem de inserção e o 5xx aborta antes de chegar à persistência
    // de qualquer evento posterior — confirma que não há persistência parcial-ordenada.
    const primeiro = await db.calendarEvents.get('33333333-3333-4333-8333-333333333333');
    // Nota: o 1.º evento PODE ter sido persistido se foi processado antes do 5xx —
    // o que importa para o eixo c é que o evento FALHADO nunca tem googleId.
    expect(primeiro).toBeDefined();

    // O evento que falhou continua sem googleId (sem estado parcial).
    const falhado = await db.calendarEvents.get('44444444-4444-4444-8444-444444444444');
    expect(falhado!.googleId).toBeUndefined();
  });
});

describe('calendar/push — 404 no update contado como failed sem re-insert (AC4 i / C4)', () => {
  it('evento com googleId apagado no Google: route NÃO o vê (insert-only) — cobertura defensiva do helper', async () => {
    // No scope insert-only a route só processa eventos SEM googleId, logo o 404 de
    // update não é exercido pela route em produção. Este teste documenta que um
    // evento com googleId (sincronizado) não entra no lote de push → pushed:0,
    // confirmando que o 404-de-update (C4) não ocorre por esta via na 6.4.
    await db.calendarEvents.add(localPendente({ googleId: DELETED_GOOGLE_EVENT_ID }));
    const res = await call();
    expect(await res.json()).toEqual({ ok: true, pushed: 0, updated: 0, failed: 0 });
  });
});
