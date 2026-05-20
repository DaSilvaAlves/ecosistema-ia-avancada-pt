import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import {
  buildRecurrenceConfig,
  buildRRule,
  generateTaskInstances,
  runRecurrenceEngine,
  type RecurrenceType,
} from '@/lib/shared/recurrence';
import type { Recurrence, Task } from '@/types/db';

/**
 * Nexus v2 — recurrence engine tests (Story 2.7 / AC13)
 *
 * T1-T11: lógica do motor — 6 tipos FR10, idempotência, horizonte, endDate,
 * herança de campos, tolerância a erros.
 *
 * Instante de referência fixado via parâmetro `nowMs` do motor (não fake timers
 * — combinar fake timers com Dexie/IndexedDB quebra as operações async).
 * `2026-06-01` é uma Segunda-feira — útil para verificar byweekday.
 */

const NOW_MS = new Date('2026-06-01T09:00:00.000Z').getTime(); // Segunda-feira

function makeMotherTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa recorrente',
    description: 'Descrição da tarefa',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-06-01',
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: NOW_MS,
    updatedAt: NOW_MS,
    ...overrides,
  };
}

function makeRecurrence(
  type: RecurrenceType,
  ownerId: string,
  opts: {
    startDate?: string;
    endDate?: string | null;
    weekday?: number;
    monthday?: number;
  } = {},
): Recurrence {
  const config = buildRecurrenceConfig(type, {
    startDate: opts.startDate ?? '2026-06-01',
    endDate: opts.endDate ?? null,
    weekday: opts.weekday,
    monthday: opts.monthday,
  });
  return {
    id: crypto.randomUUID(),
    rule: buildRRule(config).toString(),
    startDate: config.startDate,
    endDate: config.endDate ?? null,
    ownerType: 'task',
    ownerId,
  };
}

describe('recurrence engine — Story 2.7', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.recurrences.clear();
  });

  // T1 — buildRecurrenceConfig todos os 6 tipos
  it('T1 — buildRecurrenceConfig retorna config correcta para os 6 tipos', () => {
    expect(buildRecurrenceConfig('daily', { startDate: '2026-06-01' })).toMatchObject({
      freq: 'DAILY',
    });
    expect(
      buildRecurrenceConfig('weekly', { startDate: '2026-06-01', weekday: 2 }),
    ).toMatchObject({ freq: 'WEEKLY', byweekday: [2] });
    expect(
      buildRecurrenceConfig('monthly', { startDate: '2026-06-01', monthday: 15 }),
    ).toMatchObject({ freq: 'MONTHLY', bymonthday: [15] });
    expect(buildRecurrenceConfig('weekdays', { startDate: '2026-06-01' })).toMatchObject({
      freq: 'WEEKLY',
      byweekday: [0, 1, 2, 3, 4],
    });
    expect(buildRecurrenceConfig('weekends', { startDate: '2026-06-01' })).toMatchObject({
      freq: 'WEEKLY',
      byweekday: [5, 6],
    });
    expect(
      buildRecurrenceConfig('monthly-specific-day', { startDate: '2026-06-01', monthday: 9 }),
    ).toMatchObject({ freq: 'MONTHLY', bymonthday: [9] });
  });

  // T2 — buildRecurrenceConfig tipo inválido
  it('T2 — buildRecurrenceConfig lança Error PT-PT para tipo inválido', () => {
    expect(() =>
      buildRecurrenceConfig('yearly' as RecurrenceType, { startDate: '2026-06-01' }),
    ).toThrow('Tipo de recorrência inválido: yearly');
  });

  // T2b (CR Iter 2 #6) — 'weekly' sem weekday lança erro descritivo
  it('T2b — buildRecurrenceConfig "weekly" sem weekday lança erro PT-PT', () => {
    expect(() => buildRecurrenceConfig('weekly', { startDate: '2026-06-01' })).toThrow(
      /Recorrência semanal exige um dia da semana válido/,
    );
  });

  // T2c (CR Iter 2 #6) — 'weekly' com weekday fora de 0-6 lança erro
  it('T2c — buildRecurrenceConfig "weekly" com weekday inválido lança erro PT-PT', () => {
    expect(() =>
      buildRecurrenceConfig('weekly', { startDate: '2026-06-01', weekday: 9 }),
    ).toThrow(/Recorrência semanal exige um dia da semana válido/);
  });

  // T2d (CR Iter 2 #6) — 'monthly' sem monthday lança erro descritivo
  it('T2d — buildRecurrenceConfig "monthly" sem monthday lança erro PT-PT', () => {
    expect(() => buildRecurrenceConfig('monthly', { startDate: '2026-06-01' })).toThrow(
      /Recorrência mensal exige um dia do mês válido/,
    );
  });

  // T2e (CR Iter 2 #6) — 'monthly-specific-day' com monthday fora de 1-31 lança erro
  it('T2e — buildRecurrenceConfig "monthly-specific-day" com monthday inválido lança erro', () => {
    expect(() =>
      buildRecurrenceConfig('monthly-specific-day', {
        startDate: '2026-06-01',
        monthday: 0,
      }),
    ).toThrow(/Recorrência mensal exige um dia do mês válido/);
  });

  // T3 — diária horizonte 90 dias
  it('T3 — generateTaskInstances diária gera ~90 instâncias no horizonte de 90 dias', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('daily', mother.id);
    await db.recurrences.add(rec);

    const result = await generateTaskInstances(rec, 90, NOW_MS);

    // Horizonte de 90 dias a partir de hoje (inclusivo) — entre 90 e 91 ocorrências.
    expect(result.created).toBeGreaterThanOrEqual(90);
    expect(result.created).toBeLessThanOrEqual(91);
    expect(result.skipped).toBe(0);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(children.length).toBe(result.created);
  });

  // T4 — idempotência
  it('T4 — generateTaskInstances é idempotente: 2ª corrida não cria duplicados', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('daily', mother.id);
    await db.recurrences.add(rec);

    const first = await generateTaskInstances(rec, 30, NOW_MS);
    const second = await generateTaskInstances(rec, 30, NOW_MS);

    expect(second.created).toBe(0);
    expect(second.skipped).toBe(first.created);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(children.length).toBe(first.created);
  });

  // T5 — com endDate
  it('T5 — generateTaskInstances respeita endDate (não gera após a data de fim)', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('daily', mother.id, {
      startDate: '2026-06-01',
      endDate: '2026-06-10',
    });
    await db.recurrences.add(rec);

    const result = await generateTaskInstances(rec, 90, NOW_MS);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();

    expect(children.every((c) => c.dueDate !== null && c.dueDate <= '2026-06-10')).toBe(true);
    expect(result.created).toBeLessThanOrEqual(10);
  });

  // T6 — dias úteis
  it('T6 — generateTaskInstances dias úteis gera apenas Seg-Sex', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('weekdays', mother.id);
    await db.recurrences.add(rec);

    await generateTaskInstances(rec, 14, NOW_MS);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();

    expect(children.length).toBeGreaterThan(0);
    for (const child of children) {
      const day = new Date(`${child.dueDate}T00:00:00.000Z`).getUTCDay(); // 0=Dom..6=Sáb
      expect(day).toBeGreaterThanOrEqual(1); // Seg
      expect(day).toBeLessThanOrEqual(5); // Sex
    }
  });

  // T7 — fim-de-semana
  it('T7 — generateTaskInstances fim-de-semana gera apenas Sáb+Dom', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('weekends', mother.id);
    await db.recurrences.add(rec);

    await generateTaskInstances(rec, 21, NOW_MS);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();

    expect(children.length).toBeGreaterThan(0);
    for (const child of children) {
      const day = new Date(`${child.dueDate}T00:00:00.000Z`).getUTCDay();
      expect(day === 0 || day === 6).toBe(true); // Dom ou Sáb
    }
  });

  // T8 — mensal dia 15
  it('T8 — generateTaskInstances mensal dia 15 gera apenas no dia 15', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('monthly', mother.id, { monthday: 15 });
    await db.recurrences.add(rec);

    await generateTaskInstances(rec, 90, NOW_MS);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();

    expect(children.length).toBeGreaterThan(0);
    for (const child of children) {
      expect(child.dueDate?.slice(8, 10)).toBe('15');
    }
  });

  // T9 — herança de campos
  it('T9 — instância filha herda campos da mãe; status todo; context null', async () => {
    const mother = makeMotherTask({
      title: 'Revisão semanal',
      description: 'Rever metas',
      priority: 'high',
      projectId: 'proj-1',
      tags: ['tag-a', 'tag-b'],
      context: 'contexto da mãe',
    });
    await db.tasks.add(mother);
    const rec = makeRecurrence('daily', mother.id);
    await db.recurrences.add(rec);

    await generateTaskInstances(rec, 3, NOW_MS);
    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();

    expect(children.length).toBeGreaterThan(0);
    const child = children[0];
    expect(child.title).toBe('Revisão semanal');
    expect(child.description).toBe('Rever metas');
    expect(child.priority).toBe('high');
    expect(child.projectId).toBe('proj-1');
    expect(child.tags).toEqual(['tag-a', 'tag-b']);
    expect(child.status).toBe('todo');
    expect(child.context).toBeNull();
    expect(child.lastWorkedAt).toBeNull();
    expect(child.parentTaskId).toBe(mother.id);
    expect(child.recurrenceId).toBe(rec.id);
  });

  // T9b — task-mãe inexistente não gera nada
  it('T9b — generateTaskInstances retorna zeros se a task-mãe não existir', async () => {
    const rec = makeRecurrence('daily', crypto.randomUUID());
    await db.recurrences.add(rec);
    const result = await generateTaskInstances(rec, 30, NOW_MS);
    expect(result).toEqual({ created: 0, skipped: 0 });
  });

  // T10 — runRecurrenceEngine conta correcta
  it('T10 — runRecurrenceEngine agrega contadores de várias recorrências', async () => {
    const m1 = makeMotherTask();
    const m2 = makeMotherTask();
    await db.tasks.bulkAdd([m1, m2]);
    await db.recurrences.bulkAdd([
      makeRecurrence('daily', m1.id),
      makeRecurrence('daily', m2.id),
    ]);

    const first = await runRecurrenceEngine(NOW_MS);
    expect(first.created).toBeGreaterThan(0);
    expect(first.errors).toBe(0);

    const second = await runRecurrenceEngine(NOW_MS);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(first.created);
  });

  // T10b — runRecurrenceEngine ignora recorrências non-task
  it('T10b — runRecurrenceEngine processa apenas ownerType task', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    await db.recurrences.add(makeRecurrence('daily', mother.id));
    // recorrência de outro ownerType — deve ser ignorada.
    await db.recurrences.add({
      id: crypto.randomUUID(),
      rule: 'FREQ=DAILY',
      startDate: '2026-06-01',
      endDate: null,
      ownerType: 'habit',
      ownerId: crypto.randomUUID(),
    });

    const result = await runRecurrenceEngine(NOW_MS);
    expect(result.errors).toBe(0);
    expect(result.created).toBeGreaterThan(0);
  });

  // T11 — tolerância a erros
  it('T11 — runRecurrenceEngine tolera erro numa recorrência e processa as restantes', async () => {
    const good = makeMotherTask();
    await db.tasks.add(good);
    await db.recurrences.add(makeRecurrence('daily', good.id));
    // recorrência com rule corrompida — RRule.fromString lança.
    await db.recurrences.add({
      id: crypto.randomUUID(),
      rule: 'ISTO-NAO-E-UMA-RRULE-VALIDA',
      startDate: '2026-06-01',
      endDate: null,
      ownerType: 'task',
      ownerId: crypto.randomUUID(),
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runRecurrenceEngine(NOW_MS);
    consoleSpy.mockRestore();

    expect(result.errors).toBe(1);
    expect(result.created).toBeGreaterThan(0); // a recorrência válida foi processada
  });

  // T11b (CR Iter 2 #7) — janela normalizada apanha a ocorrência de hoje
  // independentemente da hora a que o motor corre.
  it('T11b — gera a ocorrência de hoje ao correr a meio do dia (janela normalizada)', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    // Recorrência diária a começar exactamente hoje (2026-06-01).
    const rec = makeRecurrence('daily', mother.id, { startDate: '2026-06-01' });
    await db.recurrences.add(rec);

    // Motor corre às 09:00 — antes do fix, a ocorrência de hoje (à meia-noite)
    // ficava fora da janela `from`.
    const midday = new Date('2026-06-01T09:00:00.000Z').getTime();
    await generateTaskInstances(rec, 3, midday);

    const dueDates = (await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray())
      .map((t) => t.dueDate)
      .sort();
    // Horizonte de 3 dias inclui hoje e os 2 dias seguintes.
    expect(dueDates).toEqual(['2026-06-01', '2026-06-02', '2026-06-03']);
  });

  // T11c (CR Iter 2 #7) — correr ao início e a meio do mesmo dia é idempotente
  // (a janela normalizada impede duplicação por `between(..., true)` inclusivo).
  it('T11c — correr o motor à meia-noite e a meio do mesmo dia não duplica', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeRecurrence('daily', mother.id, { startDate: '2026-06-01' });
    await db.recurrences.add(rec);

    const midnight = new Date('2026-06-01T00:00:00.000Z').getTime();
    const evening = new Date('2026-06-01T23:30:00.000Z').getTime();

    const first = await generateTaskInstances(rec, 5, midnight);
    const second = await generateTaskInstances(rec, 5, evening);

    expect(first.created).toBe(5);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(5);
  });
});
