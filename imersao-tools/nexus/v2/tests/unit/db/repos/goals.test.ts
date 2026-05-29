import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createGoal,
  getGoal,
  listGoals,
  updateGoal,
  deleteGoal,
} from '@/lib/db/repos/goals';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — goals repo tests (Story 4.1 / AC8)
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: crypto.randomUUID(),
    title: 'Ler 24 livros',
    type: 'numeric',
    target: 24,
    current: 0,
    deadline: '2026-12-31',
    status: 'active',
    milestones: [
      { at: 6, reached: false },
      { at: 12, reached: false, note: 'Metade' },
    ],
    ...overrides,
  };
}

describe('goals repo', () => {
  beforeEach(async () => {
    await db.goals.clear();
  });

  it('createGoal + getGoal roundtrip preserva milestones embebidos', async () => {
    const goal = makeGoal();
    await createGoal(goal);
    const got = await getGoal(goal.id);
    expect(got).toEqual(goal);
    expect(got?.milestones).toHaveLength(2);
  });

  it('createGoal aceita description opcional', async () => {
    const goal = makeGoal({ description: 'Hábito de leitura' });
    await createGoal(goal);
    expect((await getGoal(goal.id))?.description).toBe('Hábito de leitura');
  });

  it('createGoal aceita goal booleano sem milestones', async () => {
    const goal = makeGoal({ type: 'boolean', target: 1, milestones: [] });
    await createGoal(goal);
    expect((await getGoal(goal.id))?.type).toBe('boolean');
  });

  it('createGoal rejeita id não-UUID', async () => {
    await expect(createGoal(makeGoal({ id: 'x' }))).rejects.toThrow();
  });

  it('createGoal rejeita título vazio com mensagem PT-PT', async () => {
    await expect(createGoal(makeGoal({ title: '' }))).rejects.toThrow(
      /Título da meta é obrigatório/,
    );
  });

  it('createGoal rejeita type fora do enum', async () => {
    // @ts-expect-error — type inválido testado em runtime
    await expect(createGoal(makeGoal({ type: 'percentagem' }))).rejects.toThrow();
  });

  it('createGoal rejeita milestone com at não-numérico', async () => {
    await expect(
      // @ts-expect-error — at inválido testado em runtime
      createGoal(makeGoal({ milestones: [{ at: 'seis', reached: false }] })),
    ).rejects.toThrow();
  });

  it('listGoals sem filtro devolve todas', async () => {
    await createGoal(makeGoal({ status: 'active' }));
    await createGoal(makeGoal({ status: 'achieved' }));
    expect(await listGoals()).toHaveLength(2);
  });

  it('listGoals filtra por status', async () => {
    await createGoal(makeGoal({ status: 'active' }));
    await createGoal(makeGoal({ status: 'achieved' }));
    await createGoal(makeGoal({ status: 'active' }));
    expect(await listGoals('active')).toHaveLength(2);
    expect(await listGoals('achieved')).toHaveLength(1);
  });

  it('listGoals ordena por deadline asc, nulls no fim', async () => {
    await createGoal(makeGoal({ deadline: '2026-12-31' }));
    await createGoal(makeGoal({ deadline: null }));
    await createGoal(makeGoal({ deadline: '2026-06-30' }));
    const result = await listGoals();
    expect(result.map((g) => g.deadline)).toEqual([
      '2026-06-30',
      '2026-12-31',
      null,
    ]);
  });

  it('updateGoal actualiza o array de milestones inteiro (read-modify-write)', async () => {
    const goal = makeGoal();
    await createGoal(goal);
    const updated = goal.milestones.map((m) =>
      m.at === 6 ? { ...m, reached: true } : m,
    );
    await updateGoal(goal.id, { milestones: updated, current: 6 });
    const got = await getGoal(goal.id);
    expect(got?.milestones.find((m) => m.at === 6)?.reached).toBe(true);
    expect(got?.current).toBe(6);
  });

  it('updateGoal lança se id não existe', async () => {
    await expect(
      updateGoal('00000000-0000-0000-0000-000000000000', { current: 1 }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteGoal remove a meta (milestones embebidos morrem com o registo)', async () => {
    const goal = makeGoal();
    await createGoal(goal);
    await deleteGoal(goal.id);
    expect(await getGoal(goal.id)).toBeUndefined();
  });
});
