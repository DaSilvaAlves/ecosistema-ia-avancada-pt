import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  CalendarAuthError,
  CalendarSyncError,
} from '@/lib/google/calendar';
import { CalendarPushError } from '@/lib/google/calendar-push';

/**
 * Story 6.5 — testes do cron diário `POST /api/cron/sync` (T4, AC2/AC3/AC4).
 *
 * Estratégia: a route é um ORQUESTRADOR de helpers de domínio ([D-6.5-ORCHESTRATION]
 * — import directo, NÃO fetch HTTP). Mockamos os helpers de domínio (token,
 * `syncCalendarEvents`, `pushCalendarEvent`, cursor KV, Dexie) e `getServerEnv`
 * (CRON_SECRET) para testar APENAS a coordenação + auth do cron. Não há Dexie real
 * nem MSW: a fidelidade do pull/push está coberta pelos testes da 6.3/6.4 em main.
 *
 * Cenários obrigatórios da story:
 *   - sem Authorization → 401; Bearer errado → 401; CRON_SECRET ausente → 503;
 *   - pull OK + push OK → 200 com contadores (shape C5);
 *   - idempotência (pull zeros + push zeros) → 200 com zeros;
 *   - push parcial (failed > 0) → 200, ok:true (failed não derruba ok);
 *   - pull falha por token revogado → push `skipped` (curto-circuito);
 *   - pull falha transitória → push corre na mesma;
 *   - dupla invocação imediata → sem efeito colateral;
 *   - stub Gmail `null` presente na resposta.
 */

let mockCronSecret: string | undefined = 'test-cron-secret';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ CRON_SECRET: mockCronSecret })),
}));

// Token: `getValidAccessToken` é importado pela route. Mantemos as classes de erro
// reais (importOriginal) para o `instanceof` da route funcionar.
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

// Pull helper — classes de erro reais preservadas para o `instanceof` da route.
vi.mock('@/lib/google/calendar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/calendar')>();
  return {
    ...actual,
    syncCalendarEvents: vi.fn(),
  };
});

// Push helper — classes de erro reais preservadas.
vi.mock('@/lib/google/calendar-push', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/calendar-push')>();
  return {
    ...actual,
    pushCalendarEvent: vi.fn(),
  };
});

// Estado mutável partilhado pelas factories de mock (hoisted). `vi.mock` é içado
// para o topo do ficheiro, logo as factories NÃO podem referenciar variáveis
// top-level comuns — `vi.hoisted` resolve isto criando-as antes do hoist.
const { kvStore, pendentesRef, updateMock } = vi.hoisted(() => ({
  kvStore: new Map<string, unknown>(),
  pendentesRef: { current: [] as Array<{ id: string; googleId?: string }> },
  updateMock: vi.fn(async () => 1),
}));

// Cursor KV — Map real para provar persistência atómica do cursor sem @vercel/kv.
vi.mock('@/lib/google/calendar-sync-token', () => ({
  CALENDAR_SYNC_TOKEN_KEY: 'nexus:google:calendar:syncToken',
  getCalendarSyncToken: vi.fn(async () => {
    const v = kvStore.get('nexus:google:calendar:syncToken');
    return typeof v === 'string' ? v : null;
  }),
  setCalendarSyncToken: vi.fn(async (token: string) => {
    kvStore.set('nexus:google:calendar:syncToken', token);
  }),
  deleteCalendarSyncToken: vi.fn(async () => {
    kvStore.delete('nexus:google:calendar:syncToken');
  }),
}));

// Dexie — só a tabela `calendarEvents` precisa de `.filter(...).toArray()` e
// `.update(...)`. Um stub controlável chega (sem fake-indexeddb).
vi.mock('@/lib/db/client', () => ({
  db: {
    calendarEvents: {
      filter: (predicate: (e: { googleId?: string }) => boolean) => ({
        toArray: async () => pendentesRef.current.filter(predicate),
      }),
      update: updateMock,
    },
  },
}));

import { getValidAccessToken } from '@/lib/google/token-store';
import { syncCalendarEvents } from '@/lib/google/calendar';
import { pushCalendarEvent } from '@/lib/google/calendar-push';

const tokenMock = getValidAccessToken as unknown as ReturnType<typeof vi.fn>;
const pullMock = syncCalendarEvents as unknown as ReturnType<typeof vi.fn>;
const pushMock = pushCalendarEvent as unknown as ReturnType<typeof vi.fn>;

const SECRET = 'test-cron-secret';

async function callCron(auth?: string): Promise<Response> {
  const { POST } = await import('@/app/api/cron/sync/route');
  const headers = new Headers();
  if (auth !== undefined) headers.set('Authorization', auth);
  const req = new Request('http://localhost:3001/api/cron/sync', {
    method: 'POST',
    headers,
  });
  return POST(req);
}

/** Resultado de sucesso típico do `syncCalendarEvents` (shape real da 6.3). */
function pullOk(over: Partial<{ upserted: number; deleted: number; skipped: number; nextSyncToken: string | null; fullResync: boolean }> = {}) {
  return {
    upserted: 0,
    deleted: 0,
    skipped: 0,
    nextSyncToken: 'next-token',
    fullResync: false,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  kvStore.clear();
  mockCronSecret = SECRET;
  accessTokenResult = 'ya29.valid';
  accessTokenError = null;
  pendentesRef.current = [];
  // Defaults: pull e push "vazios" bem-sucedidos.
  pullMock.mockResolvedValue(pullOk());
  pushMock.mockResolvedValue({
    googleId: 'g-1',
    etag: 'e',
    updatedAt: 1,
    inserted: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cron/sync — auth (AC2 i)', () => {
  it('503 quando CRON_SECRET ausente (fail-closed)', async () => {
    mockCronSecret = undefined;
    const res = await callCron(`Bearer ${SECRET}`);
    expect(res.status).toBe(503);
    expect(tokenMock).not.toHaveBeenCalled();
  });

  it('401 sem header Authorization', async () => {
    const res = await callCron(undefined);
    expect(res.status).toBe(401);
    expect(pullMock).not.toHaveBeenCalled();
  });

  it('401 com Bearer errado', async () => {
    const res = await callCron('Bearer wrong-secret');
    expect(res.status).toBe(401);
    expect(pullMock).not.toHaveBeenCalled();
  });

  it('200 com Bearer correcto', async () => {
    const res = await callCron(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
  });
});

describe('cron/sync — pull OK + push OK (AC2/AC3)', () => {
  it('pull (upserted:3) + push (pushed:2) → 200 com contadores correctos (shape C5)', async () => {
    pullMock.mockResolvedValue(pullOk({ upserted: 3 }));
    pendentesRef.current = [
      { id: 'a' },
      { id: 'b' },
    ];
    pushMock.mockResolvedValue({ googleId: 'g', etag: 'e', updatedAt: 1, inserted: true });

    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      ok: boolean;
      calendar: {
        pull: { upserted: number; deleted: number; skipped: number; fullResync: boolean };
        push: { pushed: number; updated: number; failed: number };
      };
      gmail: null;
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.calendar.pull).toEqual({ upserted: 3, deleted: 0, skipped: 0, fullResync: false });
    expect(json.calendar.push).toEqual({ pushed: 2, updated: 0, failed: 0 });
    expect(json.gmail).toBeNull();
  });

  it('sequência SERIAL: o pull corre antes do push', async () => {
    const order: string[] = [];
    pullMock.mockImplementation(async () => {
      order.push('pull');
      return pullOk();
    });
    pendentesRef.current = [{ id: 'a' }];
    pushMock.mockImplementation(async () => {
      order.push('push');
      return { googleId: 'g', etag: 'e', updatedAt: 1, inserted: true };
    });
    await callCron(`Bearer ${SECRET}`);
    expect(order).toEqual(['pull', 'push']);
  });

  it('persiste o cursor do pull atomicamente (nextSyncToken → KV)', async () => {
    pullMock.mockResolvedValue(pullOk({ nextSyncToken: 'cursor-novo' }));
    await callCron(`Bearer ${SECRET}`);
    expect(kvStore.get('nexus:google:calendar:syncToken')).toBe('cursor-novo');
  });
});

describe('cron/sync — idempotência (AC3)', () => {
  it('pull zeros + sem locais-pendente → 200 com zeros', async () => {
    pullMock.mockResolvedValue(pullOk({ upserted: 0, deleted: 0, skipped: 0 }));
    pendentesRef.current = [];
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      ok: boolean;
      calendar: { pull: { upserted: number }; push: { pushed: number; updated: number; failed: number } };
    };
    expect(json.ok).toBe(true);
    expect(json.calendar.pull).toMatchObject({ upserted: 0, deleted: 0, skipped: 0 });
    expect(json.calendar.push).toEqual({ pushed: 0, updated: 0, failed: 0 });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('dupla invocação imediata → segunda corrida produz zeros sem efeito colateral', async () => {
    // 1.ª: um local-pendente é empurrado e ganha googleId (simulado removendo-o da lista).
    pendentesRef.current = [{ id: 'a' }];
    pushMock.mockResolvedValue({ googleId: 'g-a', etag: 'e', updatedAt: 1, inserted: true });
    const res1 = await callCron(`Bearer ${SECRET}`);
    const json1 = (await res1.json()) as { calendar: { push: { pushed: number } } };
    expect(json1.calendar.push.pushed).toBe(1);

    // Simula que o evento passou a sincronizado (a route real persiste googleId).
    pendentesRef.current = [{ id: 'a', googleId: 'g-a' }];
    const res2 = await callCron(`Bearer ${SECRET}`);
    const json2 = (await res2.json()) as { calendar: { push: { pushed: number; updated: number; failed: number } } };
    expect(json2.calendar.push).toEqual({ pushed: 0, updated: 0, failed: 0 });
  });
});

describe('cron/sync — falha parcial do push (AC4)', () => {
  it('push parcial (1 ok + 1 falha 404) → 200, ok:true, failed:1 (failed não derruba ok)', async () => {
    pendentesRef.current = [{ id: 'a' }, { id: 'b' }];
    const { CalendarPushNotFoundError } = await import('@/lib/google/calendar-push');
    pushMock
      .mockResolvedValueOnce({ googleId: 'g-a', etag: 'e', updatedAt: 1, inserted: true })
      .mockRejectedValueOnce(new CalendarPushNotFoundError());

    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { ok: boolean; calendar: { push: { pushed: number; failed: number } } };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.calendar.push).toEqual({ pushed: 1, updated: 0, failed: 1 });
  });

  it('push aborta por 5xx → 200 (nunca 5xx) com { error } e ok:false', async () => {
    pendentesRef.current = [{ id: 'a' }];
    pushMock.mockRejectedValue(new CalendarPushError('Google 503'));
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { ok: boolean; calendar: { push: { error: string } } };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.calendar.push).toEqual({ error: 'calendar_push_unavailable' });
  });
});

describe('cron/sync — falha do pull (AC4 / D-6.5-PARTIAL-FAILURE)', () => {
  it('pull token revogado → push SKIPPED (curto-circuito), 200 ok:false', async () => {
    accessTokenError = new TokenRevokedError();
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      ok: boolean;
      calendar: { pull: { error: string }; push: { skipped: boolean } };
    };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.calendar.pull).toEqual({ error: 'token_revoked' });
    expect(json.calendar.push).toEqual({ skipped: true });
    // O push NÃO correu (não leu locais-pendente).
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('pull not_connected → push SKIPPED (curto-circuito)', async () => {
    accessTokenResult = null;
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      calendar: { pull: { error: string }; push: { skipped: boolean } };
    };
    expect(json.calendar.pull).toEqual({ error: 'not_connected' });
    expect(json.calendar.push).toEqual({ skipped: true });
  });

  it('pull falha TRANSITÓRIA (calendar_unavailable) → push CORRE na mesma', async () => {
    pullMock.mockRejectedValue(new CalendarSyncError('Google 503'));
    pendentesRef.current = [{ id: 'a' }];
    pushMock.mockResolvedValue({ googleId: 'g-a', etag: 'e', updatedAt: 1, inserted: true });

    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      ok: boolean;
      calendar: { pull: { error: string }; push: { pushed: number } };
    };
    expect(json.calendar.pull).toEqual({ error: 'calendar_unavailable' });
    expect(json.calendar.push).toMatchObject({ pushed: 1 });
    expect(json.ok).toBe(false); // pull com erro → ok:false, mas push correu
  });

  it('pull auth rejeitada pela Calendar API (401) → token_revoked → push SKIPPED', async () => {
    pullMock.mockRejectedValue(new CalendarAuthError());
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      calendar: { pull: { error: string }; push: { skipped: boolean } };
    };
    expect(json.calendar.pull).toEqual({ error: 'token_revoked' });
    expect(json.calendar.push).toEqual({ skipped: true });
  });
});

describe('cron/sync — classes de erro do push (AC4, eixo c)', () => {
  it('push 429 rate limit → { error: rate_limited }, 200, ok:false', async () => {
    pendentesRef.current = [{ id: 'a' }];
    const { CalendarPushRateLimitError } = await import('@/lib/google/calendar-push');
    pushMock.mockRejectedValue(new CalendarPushRateLimitError());
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { ok: boolean; calendar: { push: { error: string } } };
    expect(res.status).toBe(200);
    expect(json.ok).toBe(false);
    expect(json.calendar.push).toEqual({ error: 'rate_limited' });
  });

  it('push 401 da Calendar API → { error: token_revoked }', async () => {
    pendentesRef.current = [{ id: 'a' }];
    const { CalendarPushAuthError } = await import('@/lib/google/calendar-push');
    pushMock.mockRejectedValue(new CalendarPushAuthError());
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { calendar: { push: { error: string } } };
    expect(json.calendar.push).toEqual({ error: 'token_revoked' });
  });

  it('push token null (não-ligado) → { error: not_connected }', async () => {
    // Pull bem-sucedido mas o token deixa de existir entre fases (caso-limite).
    pullMock.mockResolvedValue(pullOk());
    pendentesRef.current = [{ id: 'a' }];
    let calls = 0;
    tokenMock.mockImplementation(async () => {
      calls += 1;
      return calls === 1 ? 'ya29.valid' : null; // pull ok, push sem token
    });
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { calendar: { push: { error: string } } };
    expect(json.calendar.push).toEqual({ error: 'not_connected' });
  });

  it('push TokenRefreshError → { error: refresh_failed }', async () => {
    pullMock.mockResolvedValue(pullOk());
    pendentesRef.current = [{ id: 'a' }];
    let calls = 0;
    tokenMock.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return 'ya29.valid'; // pull ok
      throw new TokenRefreshError('Google indisponível'); // push refresh falha
    });
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { calendar: { push: { error: string } } };
    expect(json.calendar.push).toEqual({ error: 'refresh_failed' });
  });

  it('push de evento já sincronizado (inserted:false) conta como `updated`', async () => {
    pendentesRef.current = [{ id: 'a' }];
    pushMock.mockResolvedValue({ googleId: 'g-a', etag: 'e', updatedAt: 1, inserted: false });
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { calendar: { push: { pushed: number; updated: number } } };
    expect(json.calendar.push).toMatchObject({ pushed: 0, updated: 1 });
  });
});

describe('cron/sync — erro inesperado (200-sempre, nunca 5xx)', () => {
  it('erro não-mapeado no pull → catch top-level devolve 200 com internal_error', async () => {
    // Um erro genérico (não uma das classes tratadas) propaga até ao catch da POST.
    pullMock.mockRejectedValue(new Error('boom inesperado'));
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as {
      ok: boolean;
      calendar: { pull: { error: string }; push: { error: string } };
    };
    expect(res.status).toBe(200); // NUNCA 5xx
    expect(json.ok).toBe(false);
    expect(json.calendar.pull).toEqual({ error: 'internal_error' });
    expect(json.calendar.push).toEqual({ error: 'internal_error' });
  });
});

describe('cron/sync — stub Gmail (AC2 v / D-6.5-GMAIL-TRIGGER)', () => {
  it('resposta inclui sempre gmail: null (extensibilidade 6.8)', async () => {
    const res = await callCron(`Bearer ${SECRET}`);
    const json = (await res.json()) as { gmail: null };
    expect(json.gmail).toBeNull();
    expect('gmail' in json).toBe(true);
  });
});
