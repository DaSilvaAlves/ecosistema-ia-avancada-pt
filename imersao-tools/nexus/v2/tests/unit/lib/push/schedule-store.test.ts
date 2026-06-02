import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteSchedule,
  listSchedules,
  markScheduleSent,
  putSchedule,
  type ScheduleEntry,
} from '@/lib/push/schedule-store';

/**
 * Story 4.8 — testes do mirror de agenda `schedule-store.ts` (AC3.2/AC7).
 *
 * Mock pattern `vi.mock('@vercel/kv')` — alinhado com Stories 4.7/1.7/1.8.
 * Não mockamos o módulo sob teste; só o cliente KV, validando o contrato (hash
 * `nexus:push:schedule`, field = id — DEV-DECISION D-KV-HASH).
 */

vi.mock('@vercel/kv', () => ({
  kv: {
    hset: vi.fn(),
    hdel: vi.fn(),
    hgetall: vi.fn(),
  },
}));

import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  hset: ReturnType<typeof vi.fn>;
  hdel: ReturnType<typeof vi.fn>;
  hgetall: ReturnType<typeof vi.fn>;
};

const KEY = 'nexus:push:schedule';
const ID = '11111111-1111-4111-8111-111111111111';

const ENTRY: ScheduleEntry = {
  id: ID,
  fireAt: 1717200000000,
  text: 'Pagar a luz',
  status: 'pending',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('putSchedule', () => {
  it('faz hset na chave de hash com o field = id', async () => {
    await putSchedule(ENTRY);
    expect(kvMock.hset).toHaveBeenCalledWith(KEY, { [ID]: ENTRY });
  });
});

describe('deleteSchedule', () => {
  it('faz hdel do field correspondente ao id', async () => {
    await deleteSchedule(ID);
    expect(kvMock.hdel).toHaveBeenCalledWith(KEY, ID);
  });
});

describe('markScheduleSent', () => {
  it('faz hset preservando fireAt/text e mudando status para sent', async () => {
    await markScheduleSent(ENTRY);
    expect(kvMock.hset).toHaveBeenCalledWith(KEY, {
      [ID]: { ...ENTRY, status: 'sent' },
    });
  });
});

describe('listSchedules', () => {
  it('devolve [] quando o hash não existe', async () => {
    kvMock.hgetall.mockResolvedValueOnce(null);
    expect(await listSchedules()).toEqual([]);
  });

  it('devolve as entradas válidas do hash', async () => {
    const other: ScheduleEntry = {
      id: '22222222-2222-4222-8222-222222222222',
      fireAt: 1717300000000,
      text: 'Reunião',
      status: 'sent',
    };
    kvMock.hgetall.mockResolvedValueOnce({ [ID]: ENTRY, [other.id]: other });
    const result = await listSchedules();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(ENTRY);
    expect(result).toContainEqual(other);
  });

  it('descarta entradas malformadas sem bloquear as válidas', async () => {
    kvMock.hgetall.mockResolvedValueOnce({
      [ID]: ENTRY,
      bad: { id: 'not-a-uuid', fireAt: -1, text: '', status: 'cancelled' },
    });
    const result = await listSchedules();
    expect(result).toEqual([ENTRY]);
  });
});
