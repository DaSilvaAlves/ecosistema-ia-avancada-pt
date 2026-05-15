import { db } from '@/lib/db/client';
import { ProjectSchema, type ProjectStatus } from '@/lib/db/schemas';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — Repository para `projects` (Story 2.1)
 *
 * Encapsula acesso à tabela Dexie `projects`. Stories 2.8 (CRUD), 2.9 (vista
 * projecto) e 2.10 (tools cérebro) reutilizam estes helpers.
 *
 * `archiveProject` é apenas o helper base de mudança de estado. A semântica
 * completa de "arquivar projecto" (UI, filtros) é a Story 2.8 — `Project.status`
 * é `'active'|'paused'|'done'`, sem estado `'archived'` literal.
 */

export interface ListProjectsOptions {
  status?: ProjectStatus;
  limit?: number;
}

const DEFAULT_LIMIT = 100;

export async function createProject(input: Project): Promise<Project> {
  ProjectSchema.parse(input);
  await db.projects.add(input);
  return input;
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function listProjects(opts: ListProjectsOptions = {}): Promise<Project[]> {
  const { status, limit = DEFAULT_LIMIT } = opts;

  const baseCollection =
    status !== undefined ? db.projects.where('status').equals(status) : db.projects.toCollection();
  const results = await baseCollection.toArray();

  return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  const updated = await db.projects.update(id, patch);
  if (updated === 0) {
    throw new Error(`Project ${id} não encontrado — não foi possível actualizar`);
  }
}

/**
 * Helper de "arquivar" — muda status para `'paused'` (mantém o projecto
 * inactivo mas reactivável). Semântica UI completa (filtros, indicador
 * de arquivado) é Story 2.8.
 *
 * Não inventa estado `'archived'` — `Project.status` é literalmente
 * `'active'|'paused'|'done'`. Quem quiser marcar como concluído usa
 * `updateProject(id, { status: 'done' })`.
 */
export async function archiveProject(id: string): Promise<void> {
  const updated = await db.projects.update(id, { status: 'paused' });
  if (updated === 0) {
    throw new Error(`Project ${id} não encontrado — não foi possível arquivar`);
  }
}
