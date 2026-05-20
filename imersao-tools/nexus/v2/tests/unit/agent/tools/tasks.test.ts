import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { Task, Project } from '@/types/db';
// Side-effect import — regista as 7 tools do Epic 2 (Story 2.10).
// Importar o barrel (não `tasks.ts`/`projects.ts` directos) evita
// dupla cadeia de registo e o erro "tool já registada" do registry.
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de tarefas tests (Story 2.10 / AC7 — T1-T17)
 *
 * `fake-indexeddb` carregado via `tests/setup.ts`. Cada tool é obtida via
 * `toolRegistry.get(name)` — o registo acontece 1x no import do barrel
 * (estado real de produção). `beforeEach` limpa as tabelas Dexie para
 * isolamento; o registry mantém-se populado (singleton de processo).
 */

// ── ctx mock ───────────────────────────────────────────────────────
const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};
const ctx: ExecutionContext = {
  userId: 'eurico',
  db,
  kv: mockKv,
  fetch: globalThis.fetch,
  logger: mockLogger,
  runId: 'test-run-id',
};

// ── helpers ────────────────────────────────────────────────────────
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

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Projecto de teste',
    description: '',
    status: 'active',
    startDate: '2026-01-01',
    deadline: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

/** Data ISO YYYY-MM-DD deslocada N dias a partir de hoje. */
function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) {
    throw new Error(`Tool "${name}" não registada no toolRegistry`);
  }
  return t;
};

beforeEach(async () => {
  await db.tasks.clear();
  await db.projects.clear();
});

// ═══════════════════════════════════════════════════════════════════
// criar_tarefa — T1-T4
// ═══════════════════════════════════════════════════════════════════

describe('criar_tarefa', () => {
  it('T1 — sucesso com args mínimos (só titulo)', async () => {
    const t = tool('criar_tarefa');
    const args = t.argsSchema.parse({ titulo: 'Comprar pão' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      titulo: string;
    };

    expect(result.titulo).toBe('Comprar pão');
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    const persisted = await db.tasks.get(result.id);
    expect(persisted?.title).toBe('Comprar pão');
    expect(persisted?.status).toBe('todo');
    expect(persisted?.priority).toBe('medium');
  });

  it('T2 — mapeamento prioridade PT-PT → EN', async () => {
    const t = tool('criar_tarefa');

    const alta = (await t.execute(
      t.argsSchema.parse({ titulo: 'A', prioridade: 'alta' }),
      ctx
    )) as { id: string };
    expect((await db.tasks.get(alta.id))?.priority).toBe('high');

    const baixa = (await t.execute(
      t.argsSchema.parse({ titulo: 'B', prioridade: 'baixa' }),
      ctx
    )) as { id: string };
    expect((await db.tasks.get(baixa.id))?.priority).toBe('low');

    const media = (await t.execute(
      t.argsSchema.parse({ titulo: 'C', prioridade: 'media' }),
      ctx
    )) as { id: string };
    expect((await db.tasks.get(media.id))?.priority).toBe('medium');
  });

  it('T3 — reverse elimina a tarefa criada', async () => {
    const t = tool('criar_tarefa');
    const args = t.argsSchema.parse({ titulo: 'Tarefa temporária' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      titulo: string;
    };
    expect(await db.tasks.get(result.id)).toBeDefined();

    expect(t.reverse).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect(await db.tasks.get(result.id)).toBeUndefined();
  });

  it('T4 — com projecto e tags', async () => {
    const t = tool('criar_tarefa');
    const projectoId = crypto.randomUUID();
    const args = t.argsSchema.parse({
      titulo: 'Tarefa vinculada',
      projecto: projectoId,
      tags: ['id-a', 'id-b'],
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    const persisted = await db.tasks.get(result.id);
    expect(persisted?.projectId).toBe(projectoId);
    expect(persisted?.tags).toEqual(['id-a', 'id-b']);
  });
});

// ═══════════════════════════════════════════════════════════════════
// completar_tarefa — T5-T7
// ═══════════════════════════════════════════════════════════════════

describe('completar_tarefa', () => {
  it('T5 — sucesso: todo → done', async () => {
    const task = makeTask({ status: 'todo' });
    await db.tasks.add(task);

    const t = tool('completar_tarefa');
    const result = (await t.execute(
      t.argsSchema.parse({ id: task.id }),
      ctx
    )) as { id: string; statusAnterior: string };

    expect(result.statusAnterior).toBe('todo');
    expect((await db.tasks.get(task.id))?.status).toBe('done');
    expect((await db.tasks.get(task.id))?.lastWorkedAt).not.toBeNull();
  });

  it('T6 — tarefa não encontrada lança Error PT-PT', async () => {
    const t = tool('completar_tarefa');
    const id = crypto.randomUUID();
    await expect(
      t.execute(t.argsSchema.parse({ id }), ctx)
    ).rejects.toThrow(`Tarefa "${id}" não encontrada`);
  });

  it('T7 — reverse restaura status anterior (in-progress)', async () => {
    const task = makeTask({ status: 'in-progress' });
    await db.tasks.add(task);

    const t = tool('completar_tarefa');
    const args = t.argsSchema.parse({ id: task.id });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      statusAnterior: string;
    };
    expect((await db.tasks.get(task.id))?.status).toBe('done');

    expect(t.reverse).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect((await db.tasks.get(task.id))?.status).toBe('in-progress');
  });
});

// ═══════════════════════════════════════════════════════════════════
// listar_tarefas — T8-T10
// ═══════════════════════════════════════════════════════════════════

describe('listar_tarefas', () => {
  it('T8 — sem filtro retorna todas (até limite)', async () => {
    await db.tasks.bulkAdd([makeTask(), makeTask(), makeTask()]);
    const t = tool('listar_tarefas');
    const result = (await t.execute(t.argsSchema.parse({}), ctx)) as {
      tarefas: unknown[];
      total: number;
    };
    expect(result.total).toBe(3);
    expect(result.tarefas).toHaveLength(3);
  });

  it('T9 — filtro por status', async () => {
    await db.tasks.bulkAdd([
      makeTask({ status: 'todo' }),
      makeTask({ status: 'todo' }),
      makeTask({ status: 'done' }),
    ]);
    const t = tool('listar_tarefas');
    const result = (await t.execute(
      t.argsSchema.parse({ status: 'todo' }),
      ctx
    )) as { tarefas: unknown[]; total: number };
    expect(result.total).toBe(2);
  });

  it('T10 — mapeamento prioridade EN → PT-PT no resultado', async () => {
    await db.tasks.add(makeTask({ priority: 'high' }));
    const t = tool('listar_tarefas');
    const result = (await t.execute(t.argsSchema.parse({}), ctx)) as {
      tarefas: Array<{ prioridade: string }>;
    };
    expect(result.tarefas[0].prioridade).toBe('alta');
  });

  it('T10b — respeita o limite', async () => {
    await db.tasks.bulkAdd([
      makeTask(),
      makeTask(),
      makeTask(),
      makeTask(),
      makeTask(),
    ]);
    const t = tool('listar_tarefas');
    const result = (await t.execute(
      t.argsSchema.parse({ limite: 2 }),
      ctx
    )) as { tarefas: unknown[]; total: number };
    expect(result.tarefas).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// listar_atrasadas — T11-T12
// ═══════════════════════════════════════════════════════════════════

describe('listar_atrasadas', () => {
  it('T11 — só tarefas com prazo ultrapassado e não concluídas', async () => {
    await db.tasks.bulkAdd([
      makeTask({ dueDate: isoDateOffset(-2), status: 'todo' }), // atrasada
      makeTask({ dueDate: isoDateOffset(-1), status: 'todo' }), // atrasada
      makeTask({ dueDate: isoDateOffset(1), status: 'todo' }), // futura — excluída
      makeTask({ dueDate: null, status: 'todo' }), // sem prazo — excluída
      makeTask({ dueDate: isoDateOffset(-3), status: 'done' }), // done — excluída
    ]);
    const t = tool('listar_atrasadas');
    const result = (await t.execute(t.argsSchema.parse({}), ctx)) as {
      tarefas: unknown[];
      total: number;
    };
    expect(result.total).toBe(2);
    expect(result.tarefas).toHaveLength(2);
  });

  it('T12 — respeita o limite', async () => {
    await db.tasks.bulkAdd([
      makeTask({ dueDate: isoDateOffset(-1), status: 'todo' }),
      makeTask({ dueDate: isoDateOffset(-2), status: 'todo' }),
      makeTask({ dueDate: isoDateOffset(-3), status: 'todo' }),
      makeTask({ dueDate: isoDateOffset(-4), status: 'todo' }),
      makeTask({ dueDate: isoDateOffset(-5), status: 'todo' }),
    ]);
    const t = tool('listar_atrasadas');
    const result = (await t.execute(
      t.argsSchema.parse({ limite: 3 }),
      ctx
    )) as { tarefas: unknown[]; total: number };
    expect(result.tarefas).toHaveLength(3);
    expect(result.total).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// vincular_tarefa_projecto — T13-T17
// ═══════════════════════════════════════════════════════════════════

describe('vincular_tarefa_projecto', () => {
  it('T13 — vincula tarefa a projecto existente', async () => {
    const task = makeTask({ projectId: null });
    const project = makeProject();
    await db.tasks.add(task);
    await db.projects.add(project);

    const t = tool('vincular_tarefa_projecto');
    const result = (await t.execute(
      t.argsSchema.parse({ tarefaId: task.id, projectoId: project.id }),
      ctx
    )) as { tarefaId: string; projectoIdNovo: string | null };

    expect(result.projectoIdNovo).toBe(project.id);
    expect((await db.tasks.get(task.id))?.projectId).toBe(project.id);
  });

  it('T14 — desvincula (projectoId null)', async () => {
    const project = makeProject();
    const task = makeTask({ projectId: project.id });
    await db.projects.add(project);
    await db.tasks.add(task);

    const t = tool('vincular_tarefa_projecto');
    await t.execute(
      t.argsSchema.parse({ tarefaId: task.id, projectoId: null }),
      ctx
    );
    expect((await db.tasks.get(task.id))?.projectId).toBeNull();
  });

  it('T15 — tarefa não encontrada lança Error PT-PT', async () => {
    const t = tool('vincular_tarefa_projecto');
    const tarefaId = crypto.randomUUID();
    await expect(
      t.execute(
        t.argsSchema.parse({ tarefaId, projectoId: null }),
        ctx
      )
    ).rejects.toThrow(`Tarefa "${tarefaId}" não encontrada`);
  });

  it('T16 — projecto não encontrado lança Error PT-PT', async () => {
    const task = makeTask();
    await db.tasks.add(task);
    const t = tool('vincular_tarefa_projecto');
    const projectoId = crypto.randomUUID();
    await expect(
      t.execute(
        t.argsSchema.parse({ tarefaId: task.id, projectoId }),
        ctx
      )
    ).rejects.toThrow(`Projecto "${projectoId}" não encontrado`);
  });

  it('T17 — reverse restaura projectId original (null)', async () => {
    const project = makeProject();
    const task = makeTask({ projectId: null });
    await db.projects.add(project);
    await db.tasks.add(task);

    const t = tool('vincular_tarefa_projecto');
    const args = t.argsSchema.parse({
      tarefaId: task.id,
      projectoId: project.id,
    });
    const result = (await t.execute(args, ctx)) as {
      tarefaId: string;
      projectoIdAnterior: string | null;
      projectoIdNovo: string | null;
    };
    expect((await db.tasks.get(task.id))?.projectId).toBe(project.id);

    expect(t.reverse).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect((await db.tasks.get(task.id))?.projectId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// argsSchema validation — T24-T25 (criar/completar tarefa)
// ═══════════════════════════════════════════════════════════════════

describe('argsSchema validation — tarefas', () => {
  it('T24 — criar_tarefa rejeita input inválido', () => {
    const t = tool('criar_tarefa');
    expect(() => t.argsSchema.parse({ titulo: '' })).toThrow();
    expect(() =>
      t.argsSchema.parse({ titulo: 'Válida', prazo: 'não-é-data' })
    ).toThrow();
  });

  it('T25 — completar_tarefa rejeita id não-UUID', () => {
    const t = tool('completar_tarefa');
    expect(() => t.argsSchema.parse({ id: 'não-é-uuid' })).toThrow();
  });
});
