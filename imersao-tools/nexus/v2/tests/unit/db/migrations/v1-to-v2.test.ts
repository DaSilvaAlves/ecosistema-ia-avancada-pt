import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { migrateV1ToV2, MIGRATION_FLAG_KEY } from '@/lib/db/migrations/v1-to-v2';
import * as tasksRepo from '@/lib/db/repos/tasks';

/**
 * Nexus v2 — migration v1 → v2 tests (Story 2.2 / AC9, AC11)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 *
 * 6 cenários AC9:
 *  1. Happy path — N v1 válidas → todas via createTask
 *  2. Idempotência — flag já marcado retorna already-done
 *  3. No-data — sem nexus_tasks no localStorage
 *  4. Tarefa inválida (id não-UUID) — skipped++, restantes continuam, console.warn 1x
 *  5. SSR guard — window === undefined retorna failed
 *  6. localStorage v1 intacto após sucesso (rollback strategy preservada)
 */

const V1_TASKS_KEY = 'nexus_tasks';

interface V1TaskFixture {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  list: string;
  createdAt: number;
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'blocked' | 'done';
  context?: string;
  lastWorkedAt?: number;
}

function makeV1Task(overrides: Partial<V1TaskFixture> = {}): V1TaskFixture {
  return {
    id: crypto.randomUUID(),
    text: 'Tarefa v1',
    done: false,
    priority: 'medium',
    list: 'inbox',
    createdAt: Date.now() - 60_000,
    ...overrides,
  };
}

describe('migrateV1ToV2', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('migra N tarefas v1 válidas via createTask e marca flag', async () => {
    const v1Tasks = [
      makeV1Task({ text: 'Tarefa A' }),
      makeV1Task({ text: 'Tarefa B', done: true }),
      makeV1Task({ text: 'Tarefa C', priority: 'high' }),
    ];
    localStorage.setItem(V1_TASKS_KEY, JSON.stringify(v1Tasks));

    const createTaskSpy = vi.spyOn(tasksRepo, 'createTask');

    const result = await migrateV1ToV2();

    expect(result).toEqual({
      migrated: 3,
      skipped: 0,
      status: 'success',
    });
    expect(createTaskSpy).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');

    // Verificar que as tarefas estão persistidas no Dexie via createTask
    const persisted = await db.tasks.toArray();
    expect(persisted).toHaveLength(3);
    const titles = persisted.map((t) => t.title).sort();
    expect(titles).toEqual(['Tarefa A', 'Tarefa B', 'Tarefa C']);
  });

  it('é idempotente — segunda chamada retorna already-done sem tocar repos', async () => {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    // Mesmo com dados em nexus_tasks, não devem ser migrados
    localStorage.setItem(V1_TASKS_KEY, JSON.stringify([makeV1Task()]));

    const createTaskSpy = vi.spyOn(tasksRepo, 'createTask');

    const result = await migrateV1ToV2();

    expect(result).toEqual({
      migrated: 0,
      skipped: 0,
      status: 'already-done',
    });
    expect(createTaskSpy).not.toHaveBeenCalled();
    const persisted = await db.tasks.toArray();
    expect(persisted).toHaveLength(0);
  });

  it('sem dados v1 — retorna no-data e marca flag', async () => {
    // localStorage sem nexus_tasks
    const createTaskSpy = vi.spyOn(tasksRepo, 'createTask');

    const result = await migrateV1ToV2();

    expect(result).toEqual({
      migrated: 0,
      skipped: 0,
      status: 'no-data',
    });
    expect(createTaskSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
  });

  it('tarefa inválida (id não-UUID) — skipped++, restantes continuam, warn PT-PT 1 vez', async () => {
    const invalidTask = makeV1Task({ id: 'not-a-uuid', text: 'Inválida' });
    const validA = makeV1Task({ text: 'Válida A' });
    const validB = makeV1Task({ text: 'Válida B' });
    localStorage.setItem(V1_TASKS_KEY, JSON.stringify([invalidTask, validA, validB]));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await migrateV1ToV2();

    expect(result.migrated).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.status).toBe('success');
    expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warnMessage = warnSpy.mock.calls[0][0];
    expect(warnMessage).toContain('Tarefa ignorada na migration');
    expect(warnMessage).toContain('not-a-uuid');

    const persisted = await db.tasks.toArray();
    expect(persisted).toHaveLength(2);
    const titles = persisted.map((t) => t.title).sort();
    expect(titles).toEqual(['Válida A', 'Válida B']);
  });

  it('SSR guard — window undefined retorna failed', async () => {
    vi.stubGlobal('window', undefined);

    const result = await migrateV1ToV2();

    expect(result).toEqual({
      migrated: 0,
      skipped: 0,
      status: 'failed',
      error: 'No window (SSR)',
    });
  });

  it('localStorage v1 (nexus_tasks) permanece intacto após sucesso (AC5)', async () => {
    const v1Tasks = [
      makeV1Task({ text: 'Original A' }),
      makeV1Task({ text: 'Original B' }),
    ];
    const serialized = JSON.stringify(v1Tasks);
    localStorage.setItem(V1_TASKS_KEY, serialized);

    const result = await migrateV1ToV2();

    expect(result.status).toBe('success');
    expect(result.migrated).toBe(2);
    // Rollback strategy: dados v1 originais permanecem em localStorage
    expect(localStorage.getItem(V1_TASKS_KEY)).toBe(serialized);
  });
});
