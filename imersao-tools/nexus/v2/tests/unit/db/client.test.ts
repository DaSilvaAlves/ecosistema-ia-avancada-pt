import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { NexusDB } from '@/lib/db/client';
import { migrateV1ToV2 } from '@/lib/db/migrations';

/**
 * Nexus v2 — DB client unit tests (Story 0.3)
 *
 * Verifica:
 *  - NexusDB instancia sem erros sob fake-indexeddb
 *  - Tabelas core respondem a count() em DB vazia
 *  - migration v1→v2 é idempotente
 */

describe('NexusDB', () => {
  let db: NexusDB;

  beforeEach(async () => {
    // Reset entre testes
    if (typeof indexedDB !== 'undefined' && 'deleteDatabase' in indexedDB) {
      try {
        indexedDB.deleteDatabase('nexus_v2');
      } catch {
        /* ignore */
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    db = new NexusDB();
    await db.open();
  });

  it('instancia sem erros', () => {
    expect(db).toBeDefined();
    expect(db.name).toBe('nexus_v2');
  });

  it('todas as tabelas core respondem a count() em DB vazia', async () => {
    expect(await db.tasks.count()).toBe(0);
    expect(await db.projects.count()).toBe(0);
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
  });

  it('aceita um insert na tabela tasks', async () => {
    await db.tasks.add({
      id: 'test-id',
      title: 'Tarefa de teste',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: null,
      projectId: null,
      tags: [],
      context: null,
      lastWorkedAt: null,
      recurrenceId: null,
      parentTaskId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(await db.tasks.count()).toBe(1);
    const task = await db.tasks.get('test-id');
    expect(task?.title).toBe('Tarefa de teste');
  });
});

describe('migrateV1ToV2', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('retorna no-data quando localStorage não tem nexus_tasks', async () => {
    const result = await migrateV1ToV2();
    expect(result.status).toBe('no-data');
    expect(result.migrated).toBe(0);
  });

  it('é idempotente — segunda chamada retorna already-done', async () => {
    await migrateV1ToV2();
    const second = await migrateV1ToV2();
    expect(second.status).toBe('already-done');
    expect(second.migrated).toBe(0);
  });

  it('migra tarefas v1 para v2 quando flag ausente', async () => {
    // Story 2.2 — `createTask` valida `TaskSchema` (id deve ser UUID).
    // V1Tasks com id não-UUID vão para `skipped` (AC6). Aqui usamos UUID
    // válido para cobrir o caminho de migration bem-sucedida.
    localStorage.setItem(
      'nexus_tasks',
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          text: 'tarefa v1',
          done: false,
          priority: 'high',
          list: 'default',
          createdAt: 1000,
        },
      ]),
    );

    // Reset DB para esta migration
    indexedDB.deleteDatabase('nexus_v2');

    const result = await migrateV1ToV2();
    expect(result.status).toBe('success');
    expect(result.migrated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(localStorage.getItem('nexus_v1_migrated_to_v2')).toBe('true');
  });
});
