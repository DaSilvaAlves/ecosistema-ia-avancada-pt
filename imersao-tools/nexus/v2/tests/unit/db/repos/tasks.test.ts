import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createTask,
  getTask,
  listTasks,
  updateTask,
  setTaskStatus,
  deleteTask,
} from '@/lib/db/repos/tasks';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — tasks repo tests (Story 2.1 / AC11)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('tasks repo', () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it('createTask + getTask roundtrip', async () => {
    const task = makeTask();
    await createTask(task);
    const retrieved = await getTask(task.id);
    expect(retrieved).toEqual(task);
  });

  it('createTask rejeita input inválido (Zod)', async () => {
    const invalid = makeTask({ id: 'not-a-uuid' });
    await expect(createTask(invalid)).rejects.toThrow();
  });

  it('createTask rejeita título vazio com mensagem PT-PT', async () => {
    const invalid = makeTask({ title: '' });
    await expect(createTask(invalid)).rejects.toThrow(/Título é obrigatório/);
  });

  it('listTasks ordena por createdAt desc', async () => {
    const baseTs = Date.now();
    await createTask(makeTask({ createdAt: baseTs - 3000 }));
    await createTask(makeTask({ createdAt: baseTs - 1000 }));
    await createTask(makeTask({ createdAt: baseTs - 2000 }));

    const result = await listTasks();
    expect(result).toHaveLength(3);
    expect(result[0].createdAt).toBe(baseTs - 1000);
    expect(result[1].createdAt).toBe(baseTs - 2000);
    expect(result[2].createdAt).toBe(baseTs - 3000);
  });

  it('listTasks filtra por status', async () => {
    await createTask(makeTask({ status: 'todo' }));
    await createTask(makeTask({ status: 'in-progress' }));
    await createTask(makeTask({ status: 'todo' }));

    const todos = await listTasks({ status: 'todo' });
    expect(todos).toHaveLength(2);
    todos.forEach((t) => expect(t.status).toBe('todo'));
  });

  it('listTasks filtra por projectId', async () => {
    const projectId = crypto.randomUUID();
    await createTask(makeTask({ projectId }));
    await createTask(makeTask({ projectId: null }));
    await createTask(makeTask({ projectId }));

    const matched = await listTasks({ projectId });
    expect(matched).toHaveLength(2);
    matched.forEach((t) => expect(t.projectId).toBe(projectId));
  });

  it('listTasks filtra por projectId === null (sem projecto)', async () => {
    const projectId = crypto.randomUUID();
    await createTask(makeTask({ projectId }));
    await createTask(makeTask({ projectId: null }));

    const orphans = await listTasks({ projectId: null });
    expect(orphans).toHaveLength(1);
    expect(orphans[0].projectId).toBeNull();
  });

  it('listTasks filtra por tag (id) via índice multi-entry *tags', async () => {
    const tagA = crypto.randomUUID();
    const tagB = crypto.randomUUID();
    await createTask(makeTask({ tags: [tagA] }));
    await createTask(makeTask({ tags: [tagB] }));
    await createTask(makeTask({ tags: [tagA, tagB] }));

    const matched = await listTasks({ tag: tagA });
    expect(matched).toHaveLength(2);
    matched.forEach((t) => expect(t.tags).toContain(tagA));
  });

  it('listTasks combina filtros (status + tag)', async () => {
    const tagId = crypto.randomUUID();
    await createTask(makeTask({ status: 'todo', tags: [tagId] }));
    await createTask(makeTask({ status: 'in-progress', tags: [tagId] }));
    await createTask(makeTask({ status: 'todo', tags: [] }));

    const matched = await listTasks({ status: 'todo', tag: tagId });
    expect(matched).toHaveLength(1);
    expect(matched[0].status).toBe('todo');
    expect(matched[0].tags).toContain(tagId);
  });

  it('listTasks respeita opção limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createTask(makeTask({ createdAt: Date.now() - i * 1000 }));
    }
    const result = await listTasks({ limit: 3 });
    expect(result).toHaveLength(3);
  });

  it('updateTask aplica patch parcial', async () => {
    const task = makeTask({ title: 'Antes' });
    await createTask(task);
    await updateTask(task.id, { title: 'Depois', priority: 'high' });

    const updated = await getTask(task.id);
    expect(updated?.title).toBe('Depois');
    expect(updated?.priority).toBe('high');
    expect(updated?.status).toBe(task.status); // resto intacto
  });

  it('updateTask lança erro se id não existe', async () => {
    await expect(
      updateTask('00000000-0000-0000-0000-000000000000', { title: 'X' })
    ).rejects.toThrow(/não encontrada/i);
  });

  it('setTaskStatus muda status e actualiza updatedAt + lastWorkedAt', async () => {
    const task = makeTask({ status: 'todo', lastWorkedAt: null });
    await createTask(task);

    const before = Date.now();
    await setTaskStatus(task.id, 'in-progress');
    const updated = await getTask(task.id);

    expect(updated?.status).toBe('in-progress');
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated?.lastWorkedAt).toBeGreaterThanOrEqual(before);
  });

  it('setTaskStatus para "done" actualiza lastWorkedAt', async () => {
    const task = makeTask({ status: 'in-progress', lastWorkedAt: null });
    await createTask(task);

    await setTaskStatus(task.id, 'done');
    const updated = await getTask(task.id);

    expect(updated?.status).toBe('done');
    expect(updated?.lastWorkedAt).not.toBeNull();
  });

  it('setTaskStatus rejeita status inválido (Zod)', async () => {
    const task = makeTask();
    await createTask(task);
    // @ts-expect-error — intencional: testar validação Zod
    await expect(setTaskStatus(task.id, 'invalid-status')).rejects.toThrow();
  });

  it('setTaskStatus lança erro se id não existe', async () => {
    await expect(
      setTaskStatus('00000000-0000-0000-0000-000000000000', 'done')
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteTask remove a task', async () => {
    const task = makeTask();
    await createTask(task);
    await deleteTask(task.id);
    const after = await getTask(task.id);
    expect(after).toBeUndefined();
  });

  it('deleteTask é idempotente — não lança em id inexistente', async () => {
    await expect(deleteTask('00000000-0000-0000-0000-000000000000')).resolves.toBeUndefined();
  });
});
