import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.3 — persistência do cursor de sync ([D-6.3-SYNC-TOKEN]) (T3, AC2).
 *
 * KV em memória (Map). Cobre os ramos de `getCalendarSyncToken`:
 *   - ausente → null;
 *   - forma string directa → devolve a string;
 *   - forma { syncToken } → extrai a string (forma ratificada como válida);
 *   - forma inesperada (corrompida) → null (força full resync);
 * e o round-trip set/get/delete na chave KV DEDICADA (separada dos tokens OAuth).
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

import {
  getCalendarSyncToken,
  setCalendarSyncToken,
  deleteCalendarSyncToken,
  CALENDAR_SYNC_TOKEN_KEY,
} from '@/lib/google/calendar-sync-token';

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();
});

describe('getCalendarSyncToken — formas de leitura', () => {
  it('ausente → null', async () => {
    expect(await getCalendarSyncToken()).toBeNull();
  });

  it('string directa → devolve a string', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, 'cursor-abc');
    expect(await getCalendarSyncToken()).toBe('cursor-abc');
  });

  it('forma { syncToken } → extrai a string', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, { syncToken: 'cursor-obj' });
    expect(await getCalendarSyncToken()).toBe('cursor-obj');
  });

  it('forma inesperada/corrompida → null (força full resync)', async () => {
    kvStore.set(CALENDAR_SYNC_TOKEN_KEY, { algo: 'inesperado' });
    expect(await getCalendarSyncToken()).toBeNull();
  });
});

describe('set / delete — round-trip na chave dedicada', () => {
  it('set grava; get devolve; delete remove', async () => {
    await setCalendarSyncToken('novo-cursor');
    expect(kvStore.get(CALENDAR_SYNC_TOKEN_KEY)).toBe('novo-cursor');
    expect(await getCalendarSyncToken()).toBe('novo-cursor');

    await deleteCalendarSyncToken();
    expect(kvStore.has(CALENDAR_SYNC_TOKEN_KEY)).toBe(false);
    expect(await getCalendarSyncToken()).toBeNull();
  });

  it('a chave é dedicada e separada dos tokens OAuth ([D-6.3-SYNC-TOKEN])', () => {
    expect(CALENDAR_SYNC_TOKEN_KEY).toBe('nexus:google:calendar:syncToken');
    expect(CALENDAR_SYNC_TOKEN_KEY).not.toBe('nexus:google:tokens');
  });
});
