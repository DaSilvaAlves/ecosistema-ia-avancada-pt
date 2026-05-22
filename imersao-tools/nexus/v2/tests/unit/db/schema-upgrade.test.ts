import { describe, it, expect, beforeEach } from 'vitest';
import Dexie, { type Table } from 'dexie';
import { NexusDB } from '@/lib/db/client';
import type { Task, Project } from '@/types/db';

/**
 * Nexus v2 — Schema upgrade test (Story 2.1 / AC13)
 *
 * Mitigação principal do risco AR2 (architecture-v2.md L1217 — "Dexie schema
 * migration falhar mid-upgrade"). Dexie é aditivo: `this.version(N+1).stores({...})`
 * preserva os dados de versões anteriores. Este teste prova-o concretamente.
 *
 * Estratégia:
 * 1. Abrir a DB `nexus_v2` numa Dexie minimalista que SÓ conhece `version(1)`,
 *    espelhando o estado pré-Story 2.1 (era assim que existia em main antes deste push).
 * 2. Inserir dados (tarefa + projecto) e fechar.
 * 3. Reabrir como `NexusDB` (Story 3.4: agora em `version(4)`). Dexie detecta
 *    a versão antiga e aplica os upgrades aditivos encadeados (v1→v2 recurrences
 *    + tags; v2→v3 accounts + cards + installments + categories; v3→v4
 *    financeRecurrences), mantendo todos os dados de `version(1)`.
 * 4. Verificar que os dados antigos sobrevivem e que as novas tabelas existem
 *    e estão vazias.
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

/**
 * Réplica da NexusDB SÓ com version(1) — para emular o estado pré-Story 2.1.
 * Mesmo nome `nexus_v2` para Dexie reconhecer como upgrade da mesma DB.
 */
class NexusDBV1Only extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;

  constructor() {
    super('nexus_v2');
    this.version(1).stores({
      tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt',
      projects: 'id, status, createdAt',
      transactions: 'id, accountId, cardId, category, date, recurrenceId, [accountId+date]',
      habits: 'id, frequency, category, createdAt',
      habit_logs: 'id, habitId, date, [habitId+date]',
      goals: 'id, status, deadline',
      reminders: 'id, fireAt, status, [status+fireAt]',
      journal_entries: 'id, date, mood',
      knowledge_areas: 'id, name',
      knowledge_notebooks: 'id, areaId',
      knowledge_notes: 'id, notebookId, *tags, updatedAt',
      agent_runs: 'id, timestamp, [timestamp+status]',
      chat_messages: 'id, conversationId, timestamp, [conversationId+timestamp]',
    });
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa pré-upgrade',
    description: 'Existia antes da Story 2.1',
    priority: 'high',
    status: 'in-progress',
    dueDate: null,
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: now,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Projecto pré-upgrade',
    description: '',
    status: 'active',
    startDate: '2026-05-15',
    deadline: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('schema upgrade v1 → v2 (Story 2.1, AC13)', () => {
  beforeEach(async () => {
    // Apagar qualquer instância anterior — começamos sempre do zero.
    await Dexie.delete('nexus_v2');
  });

  it('preserva tasks e projects ao fazer upgrade de version(1) para version(2)', async () => {
    // 1. Abrir como v1-only (estado pré-Story 2.1) e inserir dados.
    const oldDB = new NexusDBV1Only();
    await oldDB.open();
    expect(oldDB.verno).toBe(1);

    const task = makeTask({ title: 'Sobrevivente' });
    const project = makeProject({ name: 'Projecto sobrevivente' });

    await oldDB.tasks.add(task);
    await oldDB.projects.add(project);

    expect(await oldDB.tasks.count()).toBe(1);
    expect(await oldDB.projects.count()).toBe(1);

    oldDB.close();

    // 2. Reabrir como NexusDB completa — Dexie detecta upgrade aditivo desde v1.
    //    Story 3.4: NexusDB está agora em version(4); o upgrade aplica v1→v2→v3→v4.
    const newDB = new NexusDB();
    await newDB.open();
    expect(newDB.verno).toBe(4);

    // 3. Dados originais sobrevivem.
    expect(await newDB.tasks.count()).toBe(1);
    const restoredTask = await newDB.tasks.get(task.id);
    expect(restoredTask).toEqual(task);

    expect(await newDB.projects.count()).toBe(1);
    const restoredProject = await newDB.projects.get(project.id);
    expect(restoredProject).toEqual(project);

    // 4. Novas tabelas existem e estão vazias.
    expect(await newDB.recurrences.count()).toBe(0);
    expect(await newDB.tags.count()).toBe(0);
    expect(await newDB.financeRecurrences.count()).toBe(0);

    newDB.close();
  });

  it('aceita escritas nas novas tabelas (recurrences, tags) após upgrade', async () => {
    // Setup: estado pré-upgrade com dados em tasks.
    const oldDB = new NexusDBV1Only();
    await oldDB.open();
    await oldDB.tasks.add(makeTask());
    oldDB.close();

    // Upgrade para v2.
    const newDB = new NexusDB();
    await newDB.open();

    // Escrita directa nas novas tabelas funciona.
    const recurrenceId = crypto.randomUUID();
    await newDB.recurrences.add({
      id: recurrenceId,
      rule: 'FREQ=WEEKLY',
      startDate: '2026-05-15',
      endDate: null,
      ownerType: 'task',
      ownerId: crypto.randomUUID(),
    });

    const tagId = crypto.randomUUID();
    await newDB.tags.add({
      id: tagId,
      name: 'Pós-upgrade',
      color: '#00F5FF',
    });

    expect(await newDB.recurrences.count()).toBe(1);
    expect(await newDB.tags.count()).toBe(1);

    // Índice composto [ownerType+ownerId] funcional na nova tabela.
    const byOwner = await newDB.recurrences
      .where('[ownerType+ownerId]')
      .equals(['task', (await newDB.recurrences.get(recurrenceId))!.ownerId])
      .toArray();
    expect(byOwner).toHaveLength(1);

    newDB.close();
  });

  it('NexusDB em base limpa abre directamente em version(4) com todas as 20 tabelas', async () => {
    const db = new NexusDB();
    await db.open();
    expect(db.verno).toBe(4);

    // 13 de version(1) + 2 de version(2) + 4 de version(3) + 1 de version(4)
    // = 20 tabelas. Story 3.4 — asserção de contagem total: o título afirma
    // "20 tabelas" e a verificação prova-o explicitamente.
    expect(db.tables).toHaveLength(20);

    // As 15 tabelas de version(2) (13 de version(1) + 2 de version(2)).
    expect(await db.tasks.count()).toBe(0);
    expect(await db.projects.count()).toBe(0);
    expect(await db.recurrences.count()).toBe(0);
    expect(await db.tags.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.habits.count()).toBe(0);
    expect(await db.habit_logs.count()).toBe(0);
    expect(await db.goals.count()).toBe(0);
    expect(await db.reminders.count()).toBe(0);
    expect(await db.journal_entries.count()).toBe(0);
    expect(await db.knowledge_areas.count()).toBe(0);
    expect(await db.knowledge_notebooks.count()).toBe(0);
    expect(await db.knowledge_notes.count()).toBe(0);
    expect(await db.agent_runs.count()).toBe(0);
    expect(await db.chat_messages.count()).toBe(0);

    // As 4 tabelas novas de version(3) — Story 3.1 (CodeRabbit #10).
    expect(await db.accounts.count()).toBe(0);
    expect(await db.cards.count()).toBe(0);
    expect(await db.installments.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);

    // A tabela nova de version(4) — Story 3.4 (recorrências financeiras).
    expect(await db.financeRecurrences.count()).toBe(0);

    db.close();
  });
});
