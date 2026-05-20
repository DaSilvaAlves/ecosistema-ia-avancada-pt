import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createTag, deleteTag, getTag } from '@/lib/db/repos/tags';
import { createTask, getTask } from '@/lib/db/repos/tasks';
import type { Tag, Task } from '@/types/db';

/**
 * Nexus v2 — tags repo deleteTag CASCATA tests (Story 2.6 / AC2)
 *
 * Foco do AC2: deleteTag remove o tagId dos arrays Task.tags em todas as
 * tasks vinculadas, numa transacção Dexie 'rw' atómica.
 *
 * Tests T9 do AC13 — caso crítico em fake-indexeddb.
 */

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: crypto.randomUUID(),
    name: 'Trabalho',
    color: '#00F5FF',
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa',
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

describe('tags repo / deleteTag cascata (Story 2.6 AC2)', () => {
  beforeEach(async () => {
    await db.tags.clear();
    await db.tasks.clear();
  });

  it('T9 — deleteTag remove tagId de todas as tasks vinculadas + elimina tag', async () => {
    const tagA = makeTag({ name: 'TagA', color: '#00F5FF' });
    const tagB = makeTag({ name: 'TagB', color: '#39FF14' });
    await createTag(tagA);
    await createTag(tagB);

    // 2 tasks vinculadas a tagA (uma só com A, outra com A + B)
    const t1 = makeTask({ title: 'Só com A', tags: [tagA.id] });
    const t2 = makeTask({ title: 'Com A e B', tags: [tagA.id, tagB.id] });
    // 1 task NÃO vinculada (só B)
    const t3 = makeTask({ title: 'Só com B', tags: [tagB.id] });
    await createTask(t1);
    await createTask(t2);
    await createTask(t3);

    await deleteTag(tagA.id);

    // Tag eliminada
    expect(await getTag(tagA.id)).toBeUndefined();
    // Tag B inalterada
    expect(await getTag(tagB.id)).toBeDefined();

    // Tasks: tagA removido dos arrays, restantes preservados
    const t1After = await getTask(t1.id);
    const t2After = await getTask(t2.id);
    const t3After = await getTask(t3.id);

    expect(t1After?.tags).toEqual([]);
    expect(t2After?.tags).toEqual([tagB.id]);
    expect(t3After?.tags).toEqual([tagB.id]);
  });

  it('deleteTag em tag sem tasks vinculadas — só elimina a tag', async () => {
    const tag = makeTag();
    await createTag(tag);

    // 1 task sem essa tag
    const t1 = makeTask({ tags: [] });
    await createTask(t1);

    await deleteTag(tag.id);

    expect(await getTag(tag.id)).toBeUndefined();
    const t1After = await getTask(t1.id);
    expect(t1After?.tags).toEqual([]);
  });

  it('deleteTag actualiza updatedAt das tasks afectadas', async () => {
    const tag = makeTag();
    await createTag(tag);

    const originalUpdated = Date.now() - 10000; // 10s atrás
    const t1 = makeTask({ tags: [tag.id], updatedAt: originalUpdated });
    await createTask(t1);

    const before = Date.now();
    await deleteTag(tag.id);
    const after = Date.now();

    const t1After = await getTask(t1.id);
    expect(t1After?.updatedAt).toBeGreaterThanOrEqual(before);
    expect(t1After?.updatedAt).toBeLessThanOrEqual(after);
    expect(t1After?.updatedAt).toBeGreaterThan(originalUpdated);
  });

  it('deleteTag em id inexistente não lança (idempotência leve)', async () => {
    // Não há tag com este id; transacção passa por list (0 results) + delete (no-op)
    const fakeId = crypto.randomUUID();
    await expect(deleteTag(fakeId)).resolves.toBeUndefined();
  });
});
