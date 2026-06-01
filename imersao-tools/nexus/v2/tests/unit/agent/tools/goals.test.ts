import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type { Goal } from '@/types/db';
// Side-effect import — regista as 22 tools (13 Epic 2/3 + 9 Epic 4).
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de metas tests (Story 4.10 — FR41)
 *
 * `fake-indexeddb` via `tests/setup.ts`. `ctx.db` real (contrato real, não mock —
 * lição A1 Epic 1). Padrão `finance.test.ts`.
 */

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) throw new Error(`Tool "${name}" não registada`);
  return t;
};

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Ler 12 livros',
    description: overrides.description,
    type: overrides.type ?? 'numeric',
    target: overrides.target ?? 12,
    current: overrides.current ?? 0,
    deadline: overrides.deadline ?? null,
    status: overrides.status ?? 'active',
    milestones: overrides.milestones ?? [],
    progressLog: overrides.progressLog,
  };
}

beforeEach(async () => {
  await db.goals.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('criar_meta (Story 4.10 / FR41)', () => {
  it('domain é "habits" (D-DOMAIN Opção A)', () => {
    expect(tool('criar_meta').domain).toBe('habits');
    expect(tool('actualizar_meta').domain).toBe('habits');
    expect(tool('consultar_metas').domain).toBe('habits');
  });

  it('cria uma meta numérica e persiste o shape correcto', async () => {
    const t = tool('criar_meta');
    const args = t.argsSchema.parse({ titulo: 'Correr 100km', tipo: 'numeric', alvo: 100 });
    const result = (await t.execute(args, ctx)) as { id: string; mensagem: string };

    expect(result.id).toMatch(UUID_RE);
    expect(result.mensagem).toContain('Correr 100km');
    const g = (await db.goals.get(result.id)) as Goal;
    expect(g.type).toBe('numeric');
    expect(g.target).toBe(100);
    expect(g.current).toBe(0);
    expect(g.status).toBe('active');
    expect(g.milestones).toEqual([]);
  });

  it('meta booleana fixa target=1', async () => {
    const t = tool('criar_meta');
    const args = t.argsSchema.parse({ titulo: 'Parar de fumar', tipo: 'boolean' });
    const result = (await t.execute(args, ctx)) as { id: string };
    const g = (await db.goals.get(result.id)) as Goal;
    expect(g.target).toBe(1);
    expect(g.type).toBe('boolean');
  });

  it('reverse apaga a meta criada', async () => {
    const t = tool('criar_meta');
    const args = t.argsSchema.parse({ titulo: 'X', alvo: 5 });
    const result = (await t.execute(args, ctx)) as { id: string; mensagem: string };
    expect(await db.goals.get(result.id)).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect(await db.goals.get(result.id)).toBeUndefined();
  });
});

describe('actualizar_meta (Story 4.10 / FR41)', () => {
  it('actualiza current + adiciona ao progressLog; reverse restaura', async () => {
    const goal = makeGoal({ current: 0, target: 12, progressLog: undefined });
    await db.goals.add(goal);
    const t = tool('actualizar_meta');
    const args = t.argsSchema.parse({ meta: 'Ler 12 livros', novoValor: 5 });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      previousCurrent: number;
      previousStatus: string;
    };

    const updated = (await db.goals.get(goal.id)) as Goal;
    expect(updated.current).toBe(5);
    expect(updated.progressLog).toHaveLength(1);
    expect(updated.progressLog![0].value).toBe(5);
    expect(result.previousCurrent).toBe(0);

    await t.reverse!(args, result, ctx);
    const reverted = (await db.goals.get(goal.id)) as Goal;
    expect(reverted.current).toBe(0);
    expect(reverted.progressLog).toBeUndefined();
  });

  it('marcarAlcancada → status achieved (+ current=target para numeric)', async () => {
    const goal = makeGoal({ current: 3, target: 12, status: 'active' });
    await db.goals.add(goal);
    const t = tool('actualizar_meta');
    const args = t.argsSchema.parse({ meta: 'Ler 12 livros', marcarAlcancada: true });
    const result = (await t.execute(args, ctx)) as { id: string; previousStatus: string };

    const updated = (await db.goals.get(goal.id)) as Goal;
    expect(updated.status).toBe('achieved');
    expect(updated.current).toBe(12);
    expect(result.previousStatus).toBe('active');

    await t.reverse!(args, result, ctx);
    const reverted = (await db.goals.get(goal.id)) as Goal;
    expect(reverted.status).toBe('active');
    expect(reverted.current).toBe(3);
  });

  it('meta não encontrada lança Error PT-PT', async () => {
    const t = tool('actualizar_meta');
    const args = t.argsSchema.parse({ meta: 'Inexistente', novoValor: 1 });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrada/i);
  });

  it('sem novoValor nem marcarAlcancada lança Error', async () => {
    await db.goals.add(makeGoal());
    const t = tool('actualizar_meta');
    const args = t.argsSchema.parse({ meta: 'Ler 12 livros' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/Nada a actualizar/i);
  });
});

describe('consultar_metas (Story 4.10 / FR41)', () => {
  it('devolve metas activas com percentagem (read-only)', async () => {
    await db.goals.add(makeGoal({ title: 'A', current: 6, target: 12, status: 'active' }));
    await db.goals.add(makeGoal({ title: 'B', status: 'achieved' }));
    const t = tool('consultar_metas');
    const args = t.argsSchema.parse({ estado: 'active' });
    const result = (await t.execute(args, ctx)) as {
      total: number;
      metas: Array<{ titulo: string; percentagem: number }>;
    };
    expect(result.total).toBe(1);
    expect(result.metas[0].titulo).toBe('A');
    expect(result.metas[0].percentagem).toBe(50);
  });

  it('estado default active; sem metas → total 0', async () => {
    const t = tool('consultar_metas');
    const args = t.argsSchema.parse({});
    const result = (await t.execute(args, ctx)) as { total: number };
    expect(result.total).toBe(0);
  });
});
