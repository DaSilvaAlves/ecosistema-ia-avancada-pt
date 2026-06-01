import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deletePushSubscription,
  getPushSubscription,
  savePushSubscription,
  type PushSubscriptionRecord,
} from '@/lib/push/subscriptions-store';

/**
 * Story 4.7 — testes do helper KV `subscriptions-store.ts` (AC7).
 *
 * Mock pattern `vi.mock('@vercel/kv')` — alinhado com Stories 1.7/1.8
 * (`tests/unit/agent/undo.test.ts`). Não mockamos o módulo sob teste; só o
 * cliente KV, para validar o contrato (chave correcta + argumentos).
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

const KEY = 'nexus:push:subscription:singleton';

const SAMPLE: PushSubscriptionRecord = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  createdAt: 1717200000000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('savePushSubscription', () => {
  it('chama kv.set com a chave singleton e o registo', async () => {
    await savePushSubscription(SAMPLE);
    expect(kvMock.set).toHaveBeenCalledWith(KEY, SAMPLE);
  });
});

describe('getPushSubscription', () => {
  it('devolve o registo quando o KV o tem', async () => {
    kvMock.get.mockResolvedValueOnce(SAMPLE);
    const result = await getPushSubscription();
    expect(kvMock.get).toHaveBeenCalledWith(KEY);
    expect(result).toEqual(SAMPLE);
  });

  it('devolve null quando o KV devolve null', async () => {
    kvMock.get.mockResolvedValueOnce(null);
    const result = await getPushSubscription();
    expect(result).toBeNull();
  });
});

describe('deletePushSubscription', () => {
  it('chama kv.del com a chave singleton', async () => {
    await deletePushSubscription();
    expect(kvMock.del).toHaveBeenCalledWith(KEY);
  });
});
