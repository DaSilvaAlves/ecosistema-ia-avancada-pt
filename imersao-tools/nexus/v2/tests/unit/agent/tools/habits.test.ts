import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type { Habit } from '@/types/db';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de hábitos tests (Story 4.10 — FR28)
 *
 * `fake-indexeddb` via `tests/setup.ts`. `ctx.db` real. Tabela `habit_logs`
 * (snake_case — D4 da ratificação). Padrão `finance.test.ts`.
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

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? 'Correr',
    frequency: overrides.frequency ?? 'RRULE:FREQ=DAILY',
    category: overrides.category ?? 'Saúde',
    time: overrides.time,
    metric: overrides.metric,
    archivedAt: overrides.archivedAt,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

beforeEach(async () => {
  await db.habits.clear();
  await db.habit_logs.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('criar_habito (Story 4.10 / FR28)', () => {
  it('as 3 tools têm domain "habits" (D1)', () => {
    expect(tool('criar_habito').domain).toBe('habits');
    expect(tool('registar_habito_concluido').domain).toBe('habits');
    expect(tool('consultar_evolucao_habito').domain).toBe('habits');
  });

  it('cria hábito com frequency RRULE e persiste shape correcto', async () => {
    const t = tool('criar_habito');
    const args = t.argsSchema.parse({
      nome: 'Ler',
      frequencia: 'daily',
      categoria: 'Mente',
    });
    const result = (await t.execute(args, ctx)) as { id: string; mensagem: string };
    expect(result.id).toMatch(UUID_RE);
    const h = (await db.habits.get(result.id)) as Habit;
    expect(h.name).toBe('Ler');
    expect(h.frequency).toContain('FREQ=DAILY');
    expect(h.category).toBe('Mente');
  });

  it('métrica só presente quando unidade + alvo dados', async () => {
    const t = tool('criar_habito');
    const args = t.argsSchema.parse({
      nome: 'Correr',
      metricaUnidade: 'km',
      metricaAlvo: 5,
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    const h = (await db.habits.get(result.id)) as Habit;
    expect(h.metric).toEqual({ unit: 'km', target: 5 });
  });

  it('reverse apaga o hábito', async () => {
    const t = tool('criar_habito');
    const args = t.argsSchema.parse({ nome: 'X' });
    const result = (await t.execute(args, ctx)) as { id: string; mensagem: string };
    await t.reverse!(args, result, ctx);
    expect(await db.habits.get(result.id)).toBeUndefined();
  });
});

describe('registar_habito_concluido (Story 4.10 / FR25)', () => {
  it('cria HabitLog em habit_logs; reverse apaga', async () => {
    const habit = makeHabit({ name: 'Correr' });
    await db.habits.add(habit);
    const t = tool('registar_habito_concluido');
    const args = t.argsSchema.parse({ habito: 'Correr', data: '2026-06-01', valor: 5 });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      habitId: string;
      mensagem: string;
    };
    expect(result.habitId).toBe(habit.id);
    const log = await db.habit_logs.get(result.id);
    expect(log?.date).toBe('2026-06-01');
    expect(log?.value).toBe(5);

    await t.reverse!(args, result, ctx);
    expect(await db.habit_logs.get(result.id)).toBeUndefined();
  });

  it('hábito não encontrado lança Error PT-PT com lista', async () => {
    await db.habits.add(makeHabit({ name: 'Correr' }));
    const t = tool('registar_habito_concluido');
    const args = t.argsSchema.parse({ habito: 'Nadar' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrado/i);
  });

  it('data inválida (2026-02-30) é rejeitada pelo schema', () => {
    const t = tool('registar_habito_concluido');
    expect(() => t.argsSchema.parse({ habito: 'X', data: '2026-02-30' })).toThrow();
  });

  it('hábitos arquivados são ignorados na resolução', async () => {
    await db.habits.add(makeHabit({ name: 'Correr', archivedAt: Date.now() }));
    const t = tool('registar_habito_concluido');
    const args = t.argsSchema.parse({ habito: 'Correr' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrado/i);
  });
});

describe('consultar_evolucao_habito (Story 4.10 / FR28)', () => {
  it('devolve total de registos e recordes (read-only)', async () => {
    const habit = makeHabit({ name: 'Correr' });
    await db.habits.add(habit);
    await db.habit_logs.bulkAdd([
      { id: crypto.randomUUID(), habitId: habit.id, date: '2026-05-01', value: 5 },
      { id: crypto.randomUUID(), habitId: habit.id, date: '2026-05-02', value: 8 },
    ]);
    const t = tool('consultar_evolucao_habito');
    const args = t.argsSchema.parse({ habito: 'Correr' });
    const result = (await t.execute(args, ctx)) as {
      totalRegistos: number;
      bestDayValue: number;
    };
    expect(result.totalRegistos).toBe(2);
    expect(result.bestDayValue).toBe(8);
  });
});
