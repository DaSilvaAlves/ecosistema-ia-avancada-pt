import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { NexusDB } from '@/lib/db/client';

/**
 * Nexus v2 — Dexie smoke test (Story 0.9 AC5)
 *
 * Verifica que `NexusDB` instancia sob fake-indexeddb e suporta CRUD básico
 * sem browser real.
 */

describe('Dexie smoke', () => {
  beforeEach(() => {
    // Reset DB
    if (typeof indexedDB !== 'undefined' && 'deleteDatabase' in indexedDB) {
      try {
        indexedDB.deleteDatabase('nexus_v2');
      } catch {
        /* ignore */
      }
    }
  });

  it('NexusDB instancia + add/get/delete numa tarefa', async () => {
    const db = new NexusDB();
    await db.open();

    const taskId = 'smoke-task-1';
    await db.tasks.add({
      id: taskId,
      title: 'Tarefa smoke',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: null,
      projectId: null,
      tags: ['smoke'],
      context: null,
      lastWorkedAt: null,
      recurrenceId: null,
      parentTaskId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const retrieved = await db.tasks.get(taskId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Tarefa smoke');
    expect(retrieved?.tags).toEqual(['smoke']);

    await db.tasks.delete(taskId);
    const deletedCheck = await db.tasks.get(taskId);
    expect(deletedCheck).toBeUndefined();
  });
});
