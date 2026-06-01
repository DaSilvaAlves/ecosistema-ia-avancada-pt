import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type { Reminder } from '@/types/db';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de lembretes tests (Story 4.10 — FR38 + AC4 epic)
 *
 * `fake-indexeddb` via `tests/setup.ts`. `ctx.db` real. Padrão `finance.test.ts`.
 */

const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};
const ctx: ExecutionContext = {
  userId: 'eurico',
  db,
  kv: mockKv,
  fetch: globalThis.fetch,
  logger: mockLogger,
  runId: 'test-run-id',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) throw new Error(`Tool "${name}" não registada`);
  return t;
};

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    text: overrides.text ?? 'Pagar a luz',
    fireAt: overrides.fireAt ?? Date.UTC(2026, 5, 5, 10, 0),
    recurrenceId: overrides.recurrenceId ?? null,
    channels: overrides.channels ?? ['push'],
    status: overrides.status ?? 'pending',
  };
}

beforeEach(async () => {
  await db.reminders.clear();
  await db.recurrences.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('criar_lembrete (Story 4.10 / FR38 + AC4 epic)', () => {
  it('as 3 tools têm domain "habits" (D1)', () => {
    expect(tool('criar_lembrete').domain).toBe('habits');
    expect(tool('listar_lembretes').domain).toBe('habits');
    expect(tool('cancelar_lembrete').domain).toBe('habits');
  });

  it('AC4 canónico: "lembra-me sexta às 10h de pagar a luz" → lembrete correcto', async () => {
    const t = tool('criar_lembrete');
    const args = t.argsSchema.parse({
      texto: 'Pagar a luz',
      quandoIso: '2026-06-05T10:00',
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      recurrenceId: string | null;
      mensagem: string;
    };
    expect(result.id).toMatch(UUID_RE);
    expect(result.recurrenceId).toBeNull();
    const r = (await db.reminders.get(result.id)) as Reminder;
    expect(r.text).toBe('Pagar a luz');
    expect(r.fireAt).toBe(Date.UTC(2026, 5, 5, 10, 0));
    expect(r.status).toBe('pending');
    expect(r.channels).toEqual(['push']);
  });

  it('lembrete recorrente cria recurrences (ownerType reminder); reverse apaga ambos', async () => {
    const t = tool('criar_lembrete');
    const args = t.argsSchema.parse({
      texto: 'Reunião semanal',
      quandoIso: '2026-06-05T09:00',
      recorrencia: { frequency: 'weekly', interval: 1 },
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      recurrenceId: string | null;
    };
    expect(result.recurrenceId).not.toBeNull();
    const rec = await db.recurrences.get(result.recurrenceId!);
    expect(rec?.ownerType).toBe('reminder');
    expect(rec?.ownerId).toBe(result.id);

    await t.reverse!(args, result, ctx);
    expect(await db.reminders.get(result.id)).toBeUndefined();
    expect(await db.recurrences.get(result.recurrenceId!)).toBeUndefined();
  });

  it('data-hora inválida (2026-02-30) é rejeitada pelo argsSchema (CR Iter 1)', () => {
    const t = tool('criar_lembrete');
    // Validação de instante real vive no refine do argsSchema (consistência
    // com habits/finance), não só no execute.
    expect(() =>
      t.argsSchema.parse({ texto: 'X', quandoIso: '2026-02-30T10:00' })
    ).toThrow();
  });

  it('hora/minuto fora de gama (T25:99) rejeitados pelo argsSchema (CR Iter 1)', () => {
    const t = tool('criar_lembrete');
    expect(() =>
      t.argsSchema.parse({ texto: 'X', quandoIso: '2026-06-05T25:99' })
    ).toThrow();
  });
});

describe('listar_lembretes (Story 4.10 / FR38)', () => {
  it('lista pendentes ordenados por fireAt (read-only)', async () => {
    await db.reminders.add(makeReminder({ text: 'B', fireAt: 2000, status: 'pending' }));
    await db.reminders.add(makeReminder({ text: 'A', fireAt: 1000, status: 'pending' }));
    await db.reminders.add(makeReminder({ text: 'C', fireAt: 3000, status: 'cancelled' }));
    const t = tool('listar_lembretes');
    const args = t.argsSchema.parse({ estado: 'pending' });
    const result = (await t.execute(args, ctx)) as {
      total: number;
      lembretes: Array<{ texto: string }>;
    };
    expect(result.total).toBe(2);
    expect(result.lembretes.map((l) => l.texto)).toEqual(['A', 'B']);
  });
});

describe('cancelar_lembrete (Story 4.10 / FR38)', () => {
  it('soft-cancel (status cancelled); reverse restaura previousStatus', async () => {
    const reminder = makeReminder({ text: 'Pagar a luz', status: 'pending' });
    await db.reminders.add(reminder);
    const t = tool('cancelar_lembrete');
    const args = t.argsSchema.parse({ lembrete: 'Pagar a luz' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      previousStatus: string;
    };
    expect(result.previousStatus).toBe('pending');
    expect((await db.reminders.get(reminder.id))?.status).toBe('cancelled');

    await t.reverse!(args, result, ctx);
    expect((await db.reminders.get(reminder.id))?.status).toBe('pending');
  });

  it('lembrete ambíguo lança Error', async () => {
    await db.reminders.add(makeReminder({ text: 'Pagar a luz', status: 'pending' }));
    await db.reminders.add(makeReminder({ text: 'Pagar a luz da garagem', status: 'pending' }));
    const t = tool('cancelar_lembrete');
    const args = t.argsSchema.parse({ lembrete: 'Pagar a luz' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/ambíguo/i);
  });

  it('lembrete não encontrado lança Error PT-PT', async () => {
    const t = tool('cancelar_lembrete');
    const args = t.argsSchema.parse({ lembrete: 'Inexistente' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrado/i);
  });
});
