import { db } from '@/lib/db/client';
import { TaskSchema, TaskStatusSchema, type TaskStatus } from '@/lib/db/schemas';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — Repository para `tasks` (Story 2.1)
 *
 * Encapsula acesso à tabela Dexie `tasks`. Stories 2.2-2.10 do Epic 2 devem usar
 * estes helpers em vez de tocar `db.tasks.*` directamente. Padrão herdado da
 * Story 1.1 (`agent-runs.ts`).
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança ZodError
 * com mensagens PT-PT. Reads não revalidam (assume integridade do DB local).
 */

export interface ListTasksOptions {
  status?: TaskStatus;
  projectId?: string | null;
  tag?: string; // tag id — PO Q1: Task.tags guarda IDs, não nomes
  limit?: number;
}

const DEFAULT_LIMIT = 200;

export async function createTask(input: Task): Promise<Task> {
  TaskSchema.parse(input);
  await db.tasks.add(input);
  return input;
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

/**
 * Lista tarefas filtradas por status/projectId/tag.
 *
 * Filtro `tag` recebe **tag id** (PO Q1, AC6) — `Task.tags: string[]` guarda
 * ids, não nomes. Lookup via índice multi-entry `*tags` (`db.tasks.where('tags').anyOf([tagId])`).
 *
 * Quando múltiplos filtros são passados, aplicam-se em conjunto (AND).
 * Resultado ordenado descendente por `createdAt`.
 */
export async function listTasks(opts: ListTasksOptions = {}): Promise<Task[]> {
  const { status, projectId, tag, limit = DEFAULT_LIMIT } = opts;

  let results: Task[];
  if (tag !== undefined) {
    // Índice multi-entry *tags — Dexie devolve uma linha por match em algum dos
    // elementos do array; precisamos de deduplicar.
    const matched = await db.tasks.where('tags').anyOf([tag]).toArray();
    const seen = new Set<string>();
    results = matched.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  } else {
    results = await db.tasks.toArray();
  }

  const filtered = results.filter((t) => {
    if (status !== undefined && t.status !== status) return false;
    if (projectId !== undefined && t.projectId !== projectId) return false;
    return true;
  });

  return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const updated = await db.tasks.update(id, patch);
  if (updated === 0) {
    throw new Error(`Task ${id} não encontrada — não foi possível actualizar`);
  }
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  TaskStatusSchema.parse(status);
  const patch: Partial<Task> = { status, updatedAt: Date.now() };
  if (status === 'in-progress' || status === 'done') {
    patch.lastWorkedAt = Date.now();
  }
  const updated = await db.tasks.update(id, patch);
  if (updated === 0) {
    throw new Error(`Task ${id} não encontrada — não foi possível mudar status`);
  }
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}
