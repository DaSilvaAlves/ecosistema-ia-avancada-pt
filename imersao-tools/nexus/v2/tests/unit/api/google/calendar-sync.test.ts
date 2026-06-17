import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenRevokedError, TokenRefreshError } from '@/lib/google/token-store';
import {
  CalendarAuthError,
  CalendarSyncError,
  type SyncResult,
} from '@/lib/google/calendar';
import { CALENDAR_SYNC_TOKEN_KEY } from '@/lib/google/calendar-sync-token';

/**
 * Story 6.3 — testes da route `POST /api/google/calendar/sync` (T4, AC2/AC5/AC6/AC8).
 *
 * Estratégia: route FINA testada em isolamento.
 *   - `getSession` e `getValidAccessToken` mockados (controlam auth);
 *   - `syncCalendarEvents` (helper) mockado (a reconciliação é testada no
 *     calendar.test.ts — aqui valida-se a COORDENAÇÃO);
 *   - `@vercel/kv` com Map real → valida a persistência do cursor ([D-6.3-SYNC-TOKEN]):
 *     gravado após sucesso; apagado no full resync; chave dedicada separada dos tokens.
 *
 * Cobre o ciclo de vida (eixo c):
 *   - sem sessão → 401;
 *   - not_connected (token null) → 401;
 *   - token_revoked (TokenRevokedError / CalendarAuthError) → 401;
 *   - refresh_failed (TokenRefreshError) → 503;
 *   - calendar_unavailable (CalendarSyncError 5xx) → 503, cursor intacto;
 *   - sucesso incremental → 200 + cursor persistido;
 *   - sucesso full resync → 200 + cursor antigo apagado + novo gravado.
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

let syncResult: SyncResult = {
  upserted: 2,
  deleted: 1,
  skipped: 0,
  nextSyncToken: 'new-cursor',
  fullResync: false,
};
let syncError: Error | null = null;
vi.mock('@/lib/google/calendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/calendar')>();
  return {
    ...actual,
    syncCalendarEvents: vi.fn(async () => {
      if (syncError) throw syncError;
      return syncResult;
    }),
  };
});

async function call(): Promise<Response> {
  const { POST } = await import('@/app/api/google/calendar/sync/route');
  const headers = new Headers();
  headers.set('Cookie', 'nexus_session=sess');
  return POST(
    new Request('http://localhost:3001/api/google/calendar/sync', { method: 'POST', headers }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  kvStore.clear();
  mockSessionValid = true;
  accessTokenResult = 'ya29.valid';
  accessTokenError = null;
  syncResult = { upserted: 2, deleted: 1, skipped: 0, nextSyncToken: 'new-cursor', fullResync: false };
  syncError = null;
});

describe('calendar/sync — auth (AC6)', () => {
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

describe('calendar/sync — sucesso + persistência do cursor (AC2)', () => {
  it('sync incremental bem-sucedido → 200 + cursor persistido na chave dedicada', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      ok: true,
      eventsProcessed: 3,
      upserted: 2,
      deleted: 1,
      skipped: 0,
      fullResync: false,
    });
    // Cursor gravado na chave KV DEDICADA ([D-6.3-SYNC-TOKEN]).
    expect(kvStore.get(CALENDAR_SYNC_TOKEN_KEY)).toBe('new-cursor');
    // NUNCA toca na chave dos tokens OAuth.
    expect(kvStore.has('nexus:google:tokens')).toBe(false);
  });

  it('passa o cursor guardado ao helper no próximo sync', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, 'cursor-anterior');
    const calendar = await import('@/lib/google/calendar');
    await call();
    expect(calendar.syncCalendarEvents).toHaveBeenCalledWith('ya29.valid', 'cursor-anterior');
  });
});

describe('calendar/sync — full resync apaga cursor antigo antes de gravar (AC5)', () => {
  it('fullResync:true → cursor antigo apagado, novo gravado', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, 'cursor-velho-expirado');
    syncResult = {
      upserted: 5,
      deleted: 0,
      skipped: 0,
      nextSyncToken: 'cursor-pos-full-resync',
      fullResync: true,
    };
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).fullResync).toBe(true);
    expect(kvStore.get(CALENDAR_SYNC_TOKEN_KEY)).toBe('cursor-pos-full-resync');
  });
});

describe('calendar/sync — caminhos de falha do helper (AC8, eixo c)', () => {
  it('CalendarAuthError → 401 token_revoked', async () => {
    syncError = new CalendarAuthError();
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'token_revoked' });
  });

  it('CalendarSyncError (5xx) → 503 e cursor anterior intacto (sem persistência parcial)', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, 'cursor-intacto');
    syncError = new CalendarSyncError('Google 503');
    const res = await call();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'calendar_unavailable' });
    // Cursor anterior NÃO foi tocado (nunca 200 { ok: false } — anti-padrão M4 4.9).
    expect(kvStore.get(CALENDAR_SYNC_TOKEN_KEY)).toBe('cursor-intacto');
  });
});
