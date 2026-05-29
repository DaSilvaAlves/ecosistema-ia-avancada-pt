import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createHabit } from '@/lib/db/repos/habits';
import {
  createHabitLog,
  getHabitLog,
  listHabitLogsByHabit,
  updateHabitLog,
  deleteHabitLog,
} from '@/lib/db/repos/habit-logs';
import type { Habit, HabitLog } from '@/types/db';

/**
 * Nexus v2 — habit_logs repo tests (Story 4.1 / AC8)
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: crypto.randomUUID(),
    name: 'Correr',
    frequency: 'FREQ=DAILY',
    category: 'Saúde',
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeLog(habitId: string, overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id: crypto.randomUUID(),
    habitId,
    date: '2026-05-01',
    ...overrides,
  };
}

describe('habit_logs repo', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.habit_logs.clear();
  });

  it('createHabitLog + getHabitLog roundtrip (hábito existente)', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    const log = makeLog(habit.id);
    await createHabitLog(log);
    expect(await getHabitLog(log.id)).toEqual(log);
  });

  it('createHabitLog lança se o hábito não existe (log órfão)', async () => {
    const log = makeLog(crypto.randomUUID());
    await expect(createHabitLog(log)).rejects.toThrow(/não encontrado/i);
  });

  it('createHabitLog exige value quando o hábito tem metric (FR27)', async () => {
    const habit = makeHabit({ metric: { unit: 'km', target: 5 } });
    await createHabit(habit);
    await expect(createHabitLog(makeLog(habit.id))).rejects.toThrow(/exige um valor/);
  });

  it('createHabitLog aceita value quando o hábito tem metric', async () => {
    const habit = makeHabit({ metric: { unit: 'km', target: 5 } });
    await createHabit(habit);
    const log = makeLog(habit.id, { value: 7 });
    await createHabitLog(log);
    expect((await getHabitLog(log.id))?.value).toBe(7);
  });

  it('createHabitLog rejeita date não-ISO', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await expect(
      createHabitLog(makeLog(habit.id, { date: '01/05/2026' })),
    ).rejects.toThrow(/ISO 8601/);
  });

  it('listHabitLogsByHabit sem range devolve todos, ordenados por data', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await createHabitLog(makeLog(habit.id, { date: '2026-05-03' }));
    await createHabitLog(makeLog(habit.id, { date: '2026-05-01' }));
    await createHabitLog(makeLog(habit.id, { date: '2026-05-02' }));
    const logs = await listHabitLogsByHabit(habit.id);
    expect(logs.map((l) => l.date)).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
  });

  it('listHabitLogsByHabit com range filtra pelo índice [habitId+date]', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await createHabitLog(makeLog(habit.id, { date: '2026-04-30' }));
    await createHabitLog(makeLog(habit.id, { date: '2026-05-01' }));
    await createHabitLog(makeLog(habit.id, { date: '2026-05-15' }));
    await createHabitLog(makeLog(habit.id, { date: '2026-06-01' }));
    const logs = await listHabitLogsByHabit(habit.id, {
      from: '2026-05-01',
      to: '2026-05-31',
    });
    expect(logs.map((l) => l.date)).toEqual(['2026-05-01', '2026-05-15']);
  });

  it('listHabitLogsByHabit isola por habitId', async () => {
    const a = makeHabit();
    const b = makeHabit();
    await createHabit(a);
    await createHabit(b);
    await createHabitLog(makeLog(a.id, { date: '2026-05-01' }));
    await createHabitLog(makeLog(b.id, { date: '2026-05-01' }));
    expect(await listHabitLogsByHabit(a.id)).toHaveLength(1);
  });

  it('updateHabitLog aplica patch parcial', async () => {
    const habit = makeHabit({ metric: { unit: 'km', target: 5 } });
    await createHabit(habit);
    const log = makeLog(habit.id, { value: 5 });
    await createHabitLog(log);
    await updateHabitLog(log.id, { value: 8 });
    expect((await getHabitLog(log.id))?.value).toBe(8);
  });

  it('deleteHabitLog remove o registo', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    const log = makeLog(habit.id);
    await createHabitLog(log);
    await deleteHabitLog(log.id);
    expect(await getHabitLog(log.id)).toBeUndefined();
  });
});
