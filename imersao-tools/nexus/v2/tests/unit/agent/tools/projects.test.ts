import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { Task } from '@/types/db';
// Side-effect import — regista as 7 tools do Epic 2 (Story 2.10).
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de projectos tests (Story 2.10 / AC7 — T18-T23)
 *
 * `fake-indexeddb` carregado via `tests/setup.ts`. Cobre `criar_projecto`,
 * `consultar_projecto`, integração com o `toolRegistry` (T22-T23) e
 * validação de argsSchemas.
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
// criar_projecto — T18-T19
// ═══════════════════════════════════════════════════════════════════

describe('criar_projecto', () => {
  it('T18 — sucesso: status active, datas correctas', async () => {
    const t = tool('criar_projecto');
    const args = t.argsSchema.parse({ nome: 'Alpha', prazo: '2026-12-31' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      nome: string;
    };

    expect(result.nome).toBe('Alpha');
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    const persisted = await db.projects.get(result.id);
    expect(persisted?.status).toBe('active');
    expect(persisted?.deadline).toBe('2026-12-31');
    expect(persisted?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('T19 — reverse elimina o projecto criado', async () => {
    const t = tool('criar_projecto');
    const args = t.argsSchema.parse({ nome: 'Temporário' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      nome: string;
    };
    expect(await db.projects.get(result.id)).toBeDefined();

    expect(t.reverse).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect(await db.projects.get(result.id)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// consultar_projecto — T20-T21
// ═══════════════════════════════════════════════════════════════════

describe('consultar_projecto', () => {
  it('T20 — sucesso: contagem de tarefas e concluídas', async () => {
    const t = tool('criar_projecto');
    const created = (await t.execute(
      t.argsSchema.parse({ nome: 'Beta', descricao: 'Projecto Beta' }),
      ctx
    )) as { id: string };

    await db.tasks.bulkAdd([
      makeTask({ projectId: created.id, status: 'done' }),
      makeTask({ projectId: created.id, status: 'todo' }),
      makeTask({ projectId: created.id, status: 'in-progress' }),
      makeTask({ projectId: null }), // sem projecto — não conta
    ]);

    const consultar = tool('consultar_projecto');
    const result = (await consultar.execute(
      consultar.argsSchema.parse({ id: created.id }),
      ctx
    )) as {
      id: string;
      nome: string;
      descricao: string;
      status: string;
      totalTarefas: number;
      tarefasConcluidas: number;
    };

    expect(result.nome).toBe('Beta');
    expect(result.descricao).toBe('Projecto Beta');
    expect(result.status).toBe('active');
    expect(result.totalTarefas).toBe(3);
    expect(result.tarefasConcluidas).toBe(1);
  });

  it('T21 — projecto não encontrado lança Error PT-PT', async () => {
    const t = tool('consultar_projecto');
    const id = crypto.randomUUID();
    await expect(
      t.execute(t.argsSchema.parse({ id }), ctx)
    ).rejects.toThrow(`Projecto "${id}" não encontrado`);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Integração com toolRegistry — T22-T23
// ═══════════════════════════════════════════════════════════════════

describe('toolRegistry integration', () => {
  it('T22 — 13 tools registadas após import do barrel (7 Epic 2 + 6 Epic 3)', () => {
    // Story 3.11: o barrel passou a importar `./finance` (6 tools domínio 'finance').
    expect(toolRegistry.all()).toHaveLength(13);
    expect(toolRegistry.byDomain('tasks')).toHaveLength(7);
    expect(toolRegistry.byDomain('finance')).toHaveLength(6);

    const nomes = toolRegistry.all().map((t) => t.name).sort();
    expect(nomes).toEqual([
      'completar_tarefa',
      'consultar_balanco',
      'consultar_categoria',
      'consultar_projecto',
      'criar_cartao',
      'criar_financa_recorrente',
      'criar_financa_variavel',
      'criar_parcelada',
      'criar_projecto',
      'criar_tarefa',
      'listar_atrasadas',
      'listar_tarefas',
      'vincular_tarefa_projecto',
    ]);
  });

  it('T23 — toAnthropicTools não lança para as 7 tools', () => {
    const shapes = toolRegistry.toAnthropicTools(
      toolRegistry.byDomain('tasks')
    );
    expect(shapes).toHaveLength(7);
    for (const shape of shapes) {
      expect(shape.input_schema.type).toBe('object');
      expect(typeof shape.name).toBe('string');
      expect(shape.description.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// argsSchema validation — projectos
// ═══════════════════════════════════════════════════════════════════

describe('argsSchema validation — projectos', () => {
  it('criar_projecto rejeita nome vazio e prazo inválido', () => {
    const t = tool('criar_projecto');
    expect(() => t.argsSchema.parse({ nome: '' })).toThrow();
    expect(() =>
      t.argsSchema.parse({ nome: 'Válido', prazo: 'amanhã' })
    ).toThrow();
  });

  it('consultar_projecto rejeita id não-UUID', () => {
    const t = tool('consultar_projecto');
    expect(() => t.argsSchema.parse({ id: 'xpto' })).toThrow();
  });
});
