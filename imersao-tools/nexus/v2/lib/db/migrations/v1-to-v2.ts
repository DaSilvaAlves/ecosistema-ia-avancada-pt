import { createTask } from '@/lib/db/repos/tasks';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — Migration localStorage v1 → IndexedDB v2
 *
 * Story 0.3 — skeleton conforme architecture-v2.md §4.4.
 * Story 2.2 — refactor: escrita via `createTask()` de `repos/tasks.ts` (Story 2.1).
 *
 * Idempotente: corre uma vez, marca flag em localStorage.
 *
 * Esta migration corre apenas no client (precisa de localStorage + IndexedDB).
 * Componentes top-level chamam `migrateV1ToV2()` no primeiro mount client-side.
 *
 * Story 2.2 substitui `db.tasks.bulkAdd()` por loop com `createTask()` por tarefa:
 * - validação Zod individual (TaskSchema) — tarefas inválidas vão para `skipped`
 * - mensagens de erro PT-PT consistentes via repo
 * - single source of truth: `createTask` é o único caminho de escrita
 *
 * Não há transacção Dexie wrapping o loop — uma transacção contornaria a
 * validação Zod por item ao agrupar adds. Idempotência continua garantida
 * pelo flag `nexus_v1_migrated_to_v2` (marcado só após o loop completo).
 *
 * localStorage v1 mantém-se intacto (Epic 8 Story 8.10 limpa).
 */

const MIGRATION_FLAG_KEY = 'nexus_v1_migrated_to_v2';

interface V1Task {
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

export interface MigrationResult {
  migrated: number;
  skipped: number;
  status: 'success' | 'already-done' | 'no-data' | 'failed';
  error?: string;
}

/**
 * Migra dados de localStorage v1 para Dexie 4 v2.
 *
 * Idempotente — verifica flag `nexus_v1_migrated_to_v2`. Se `true`, retorna
 * `{ migrated: 0, skipped: 0, status: 'already-done' }`.
 *
 * Tarefas inválidas (falha `TaskSchema`) são contadas em `skipped` com
 * `console.warn` em PT-PT — não bloqueiam as válidas.
 *
 * localStorage v1 mantém-se intacto (Epic 8 Story 8.10 limpa).
 */
export async function migrateV1ToV2(): Promise<MigrationResult> {
  if (typeof window === 'undefined') {
    return { migrated: 0, skipped: 0, status: 'failed', error: 'No window (SSR)' };
  }

  if (window.localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return { migrated: 0, skipped: 0, status: 'already-done' };
  }

  let v1Tasks: V1Task[] = [];
  try {
    v1Tasks = JSON.parse(window.localStorage.getItem('nexus_tasks') ?? '[]') as V1Task[];
  } catch {
    v1Tasks = [];
  }

  if (v1Tasks.length === 0) {
    window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { migrated: 0, skipped: 0, status: 'no-data' };
  }

  const tasksV2: Task[] = v1Tasks.map((t) => ({
    id: t.id,
    title: t.text,
    description: '',
    priority: t.priority,
    status: t.status ?? (t.done ? 'done' : 'todo'),
    dueDate: t.dueDate ?? null,
    projectId: null,
    tags: [],
    context: t.context ?? null,
    lastWorkedAt: t.lastWorkedAt ?? null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: t.createdAt,
    updatedAt: Date.now(),
  }));

  let migrated = 0;
  let skipped = 0;
  for (const task of tasksV2) {
    try {
      await createTask(task);
      migrated++;
    } catch (error) {
      skipped++;
      console.warn(
        `Tarefa ignorada na migration (id: "${task.id}"): ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`
      );
    }
  }

  window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  return { migrated, skipped, status: 'success' };
}

export { MIGRATION_FLAG_KEY };
