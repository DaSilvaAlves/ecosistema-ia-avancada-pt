import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createHabit,
  getHabit,
  listHabits,
  updateHabit,
  deleteHabit,
  archiveHabit,
  restoreHabit,
} from '@/lib/db/repos/habits';
import { createHabitLog, listHabitLogsByHabit } from '@/lib/db/repos/habit-logs';
import type { Habit } from '@/types/db';

/**
 * Nexus v2 — habits repo tests (Story 4.1 / AC8)
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: crypto.randomUUID(),
    name: 'Leitura diária',
    frequency: 'FREQ=DAILY',
    category: 'Pessoal',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('habits repo', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.habit_logs.clear();
  });

  it('createHabit + getHabit roundtrip', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    expect(await getHabit(habit.id)).toEqual(habit);
  });

  it('createHabit aceita time opcional e metric opcional', async () => {
    const habit = makeHabit({ time: '07:30', metric: { unit: 'páginas', target: 20 } });
    await createHabit(habit);
    const got = await getHabit(habit.id);
    expect(got?.time).toBe('07:30');
    expect(got?.metric).toEqual({ unit: 'páginas', target: 20 });
  });

  it('createHabit rejeita id não-UUID', async () => {
    await expect(createHabit(makeHabit({ id: 'nope' }))).rejects.toThrow();
  });

  it('createHabit rejeita nome vazio com mensagem PT-PT', async () => {
    await expect(createHabit(makeHabit({ name: '' }))).rejects.toThrow(
      /Nome do hábito é obrigatório/,
    );
  });

  it('createHabit rejeita time em formato inválido', async () => {
    await expect(createHabit(makeHabit({ time: '25:00' }))).rejects.toThrow(
      /HH:MM/,
    );
    await expect(createHabit(makeHabit({ time: '7h30' }))).rejects.toThrow(/HH:MM/);
  });

  it('listHabits ordena por createdAt desc', async () => {
    const base = Date.now();
    await createHabit(makeHabit({ createdAt: base - 3000 }));
    await createHabit(makeHabit({ createdAt: base - 1000 }));
    await createHabit(makeHabit({ createdAt: base - 2000 }));
    const result = await listHabits();
    expect(result.map((h) => h.createdAt)).toEqual([
      base - 1000,
      base - 2000,
      base - 3000,
    ]);
  });

  it('updateHabit aplica patch parcial', async () => {
    const habit = makeHabit({ name: 'Antes' });
    await createHabit(habit);
    await updateHabit(habit.id, { name: 'Depois', category: 'Saúde' });
    const got = await getHabit(habit.id);
    expect(got?.name).toBe('Depois');
    expect(got?.category).toBe('Saúde');
  });

  it('updateHabit lança se id não existe', async () => {
    await expect(
      updateHabit('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toThrow(/não encontrado/i);
  });

  it('deleteHabit remove o hábito', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await deleteHabit(habit.id);
    expect(await getHabit(habit.id)).toBeUndefined();
  });

  // Teste NÃO-TAUTOLÓGICO de cascata (AC7) — prova que os logs são eliminados,
  // não apenas que o hábito desaparece.
  it('deleteHabit elimina em cascata os habit_logs do hábito', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await createHabitLog({
      id: crypto.randomUUID(),
      habitId: habit.id,
      date: '2026-05-01',
    });
    await createHabitLog({
      id: crypto.randomUUID(),
      habitId: habit.id,
      date: '2026-05-02',
    });
    await createHabitLog({
      id: crypto.randomUUID(),
      habitId: habit.id,
      date: '2026-05-03',
    });
    expect(await listHabitLogsByHabit(habit.id)).toHaveLength(3);

    await deleteHabit(habit.id);

    expect(await getHabit(habit.id)).toBeUndefined();
    expect(await listHabitLogsByHabit(habit.id)).toHaveLength(0);
  });

  it('deleteHabit não afecta logs de outros hábitos', async () => {
    const a = makeHabit();
    const b = makeHabit();
    await createHabit(a);
    await createHabit(b);
    await createHabitLog({ id: crypto.randomUUID(), habitId: a.id, date: '2026-05-01' });
    await createHabitLog({ id: crypto.randomUUID(), habitId: b.id, date: '2026-05-01' });

    await deleteHabit(a.id);

    expect(await listHabitLogsByHabit(a.id)).toHaveLength(0);
    expect(await listHabitLogsByHabit(b.id)).toHaveLength(1);
  });

  // ── Story 4.2 — archive / restore (AC4) ──

  it('archiveHabit define archivedAt (epoch ms positivo)', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    expect((await getHabit(habit.id))?.archivedAt).toBeUndefined();

    const before = Date.now();
    await archiveHabit(habit.id);
    const got = await getHabit(habit.id);

    expect(got?.archivedAt).toBeTypeOf('number');
    expect(got?.archivedAt).toBeGreaterThanOrEqual(before);
  });

  it('archiveHabit preserva o histórico de logs (não cascade)', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await createHabitLog({ id: crypto.randomUUID(), habitId: habit.id, date: '2026-05-01' });
    await createHabitLog({ id: crypto.randomUUID(), habitId: habit.id, date: '2026-05-02' });

    await archiveHabit(habit.id);

    // Arquivar NÃO apaga logs (semântica distinta de deleteHabit).
    expect(await listHabitLogsByHabit(habit.id)).toHaveLength(2);
    expect(await getHabit(habit.id)).toBeDefined();
  });

  it('restoreHabit remove a chave archivedAt (volta a undefined)', async () => {
    const habit = makeHabit();
    await createHabit(habit);
    await archiveHabit(habit.id);
    expect((await getHabit(habit.id))?.archivedAt).toBeTypeOf('number');

    await restoreHabit(habit.id);

    const got = await getHabit(habit.id);
    expect(got?.archivedAt).toBeUndefined();
    // Prova não-tautológica: a propriedade foi mesmo removida do objecto,
    // não apenas lida como undefined (um `update({ archivedAt: undefined })`
    // deixaria a chave antiga na DB — ver comentário no repo).
    expect(Object.prototype.hasOwnProperty.call(got ?? {}, 'archivedAt')).toBe(false);
  });

  it('archiveHabit lança se o hábito não existe', async () => {
    await expect(
      archiveHabit('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(/não encontrado/i);
  });

  it('restoreHabit lança se o hábito não existe', async () => {
    await expect(
      restoreHabit('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(/não encontrado/i);
  });

  // ── Story 4.2 Iter 2 (CR CRITICAL) — clear do time no edit (AC5) ──
  //
  // O bug do CR Iter 1: ao limpar o horário, o handler antigo NÃO incluía a
  // chave `time` no patch (chave ausente) e a Dexie ignora chaves ausentes —
  // o `time` antigo persistia. A correcção inclui SEMPRE a chave `time` no
  // patch (com `undefined` quando limpo), e a Dexie remove a chave nesse caso.
  // Os 2 testes abaixo provam a distinção real ausente-vs-undefined.

  // Teste NÃO-TAUTOLÓGICO: chave PRESENTE com `undefined` → a Dexie REMOVE a
  // chave (prova com `hasOwnProperty`). É o mecanismo que limpa o horário no
  // edit numa única escrita atómica.
  it('updateHabit({ time: undefined }) REMOVE a chave time (clear atómico)', async () => {
    const habit = makeHabit({ time: '07:30' });
    await createHabit(habit);
    expect((await getHabit(habit.id))?.time).toBe('07:30');

    await updateHabit(habit.id, { name: 'Correr', time: undefined });

    const got = await getHabit(habit.id);
    expect(got?.name).toBe('Correr');
    expect(got?.time).toBeUndefined();
    // Prova de remoção real da chave (não basta ser undefined na leitura).
    expect(Object.prototype.hasOwnProperty.call(got ?? {}, 'time')).toBe(false);
  });

  // Contraprova do bug do CR Iter 1: chave AUSENTE no patch → a Dexie ignora-a
  // e o `time` antigo PERSISTE. É exactamente o que o handler antigo fazia ao
  // limpar o horário. Este teste falharia se o patch removesse a chave por si.
  it('updateHabit sem a chave time NÃO toca o time antigo (contraprova do bug do CR Iter 1)', async () => {
    const habit = makeHabit({ time: '07:30' });
    await createHabit(habit);

    await updateHabit(habit.id, { name: 'Correr' }); // chave `time` ausente

    const got = await getHabit(habit.id);
    expect(got?.name).toBe('Correr');
    // O `time` antigo persiste — o bug do edit branch quando a chave fica fora.
    expect(got?.time).toBe('07:30');
  });
});
