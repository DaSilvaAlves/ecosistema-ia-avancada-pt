import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  archiveProject,
} from '@/lib/db/repos/projects';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — projects repo tests (Story 2.1 / AC11)
 */

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Projecto de teste',
    description: '',
    status: 'active',
    startDate: '2026-05-15',
    deadline: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('projects repo', () => {
  beforeEach(async () => {
    await db.projects.clear();
  });

  it('createProject + getProject roundtrip', async () => {
    const project = makeProject();
    await createProject(project);
    const retrieved = await getProject(project.id);
    expect(retrieved).toEqual(project);
  });

  it('createProject rejeita input inválido (Zod)', async () => {
    const invalid = makeProject({ id: 'not-a-uuid' });
    await expect(createProject(invalid)).rejects.toThrow();
  });

  it('createProject rejeita nome vazio com mensagem PT-PT', async () => {
    const invalid = makeProject({ name: '' });
    await expect(createProject(invalid)).rejects.toThrow(/Nome do projecto é obrigatório/);
  });

  it('listProjects retorna ordem desc por createdAt', async () => {
    const baseTs = Date.now();
    await createProject(makeProject({ createdAt: baseTs - 3000 }));
    await createProject(makeProject({ createdAt: baseTs - 1000 }));
    await createProject(makeProject({ createdAt: baseTs - 2000 }));

    const result = await listProjects();
    expect(result).toHaveLength(3);
    expect(result[0].createdAt).toBe(baseTs - 1000);
    expect(result[1].createdAt).toBe(baseTs - 2000);
    expect(result[2].createdAt).toBe(baseTs - 3000);
  });

  it('listProjects filtra por status via índice', async () => {
    await createProject(makeProject({ status: 'active' }));
    await createProject(makeProject({ status: 'paused' }));
    await createProject(makeProject({ status: 'active' }));

    const actives = await listProjects({ status: 'active' });
    expect(actives).toHaveLength(2);
    actives.forEach((p) => expect(p.status).toBe('active'));
  });

  it('updateProject aplica patch parcial', async () => {
    const project = makeProject({ name: 'Antes' });
    await createProject(project);
    await updateProject(project.id, { name: 'Depois', status: 'done' });

    const updated = await getProject(project.id);
    expect(updated?.name).toBe('Depois');
    expect(updated?.status).toBe('done');
    expect(updated?.description).toBe(project.description);
  });

  it('updateProject lança erro se id não existe', async () => {
    await expect(
      updateProject('00000000-0000-0000-0000-000000000000', { name: 'X' })
    ).rejects.toThrow(/não encontrado/i);
  });

  it('archiveProject muda status para "paused"', async () => {
    const project = makeProject({ status: 'active' });
    await createProject(project);
    await archiveProject(project.id);

    const updated = await getProject(project.id);
    expect(updated?.status).toBe('paused');
  });

  it('archiveProject lança erro se id não existe', async () => {
    await expect(archiveProject('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /não encontrado/i
    );
  });
});
