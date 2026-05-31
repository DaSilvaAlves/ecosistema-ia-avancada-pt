import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import { UNDO_TTL_SECONDS } from '@/lib/agent/undo';
import { ClientUndoStore } from '@/lib/agent/client-undo-store';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type { ToolCall } from '@/lib/agent/schemas';
import type { Category } from '@/types/db';
// Side-effect import — regista as tools do Epic 2/3 no registry singleton.
import '@/lib/agent/tools';

/**
 * Nexus v2 — ClientUndoStore tests (Story 1.12 — ADR-9 A4, AC2)
 *
 * `fake-indexeddb` via `tests/setup.ts`. Prova que o undo client-side reverte
 * mutações Dexie reais dentro da janela de 30s e NÃO reverte após (espelha o
 * contrato do endpoint `/api/agent/undo`, mas no browser com Dexie real).
 */

const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};
const execCtx: ExecutionContext = {
  userId: 'eurico',
  db,
  kv: mockKv,
  fetch: globalThis.fetch,
  logger: mockLogger,
  runId: 'test-run',
};

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) throw new Error(`Tool "${name}" não registada`);
  return t;
};

function toolCall(overrides: Partial<ToolCall> & Pick<ToolCall, 'toolName' | 'result'>): ToolCall {
  return {
    args: {},
    durationMs: 10,
    reverted: false,
    ...overrides,
  };
}

const CATEGORIA: Category = { name: 'Alimentação', color: '#8892A4', icon: 'tag', isDefault: false };

let store: ClientUndoStore;

beforeEach(async () => {
  await db.tasks.clear();
  await db.transactions.clear();
  await db.categories.clear();
  await db.categories.add(CATEGORIA);
  store = new ClientUndoStore();
});

afterEach(() => {
  store.clear();
  vi.useRealTimers();
});

describe('ClientUndoStore — register + undo dentro da janela', () => {
  it('reverte uma criação de tarefa (criar_tarefa.reverse → db.tasks.delete)', async () => {
    const criar = tool('criar_tarefa');
    const args = criar.argsSchema.parse({ titulo: 'Tarefa a reverter' });
    const result = (await criar.execute(args, execCtx)) as { id: string };
    expect(await db.tasks.get(result.id)).toBeDefined();

    await store.register('run-1', [toolCall({ toolName: 'criar_tarefa', args, result })]);
    expect(store.has('run-1')).toBe(true);

    const undo = await store.undo('run-1');
    expect(undo.status).toBe('reverted');
    expect(undo.reverted).toBe(1);
    expect(undo.errors).toHaveLength(0);
    expect(await db.tasks.get(result.id)).toBeUndefined();
    expect(store.has('run-1')).toBe(false);
  });

  it('reverte uma transação financeira (criar_financa_variavel.reverse)', async () => {
    const criar = tool('criar_financa_variavel');
    const args = criar.argsSchema.parse({
      montante: 5230,
      direction: 'out',
      categoriaNome: 'Alimentação',
      descricao: 'compra',
    });
    const result = (await criar.execute(args, execCtx)) as { id: string };
    expect(await db.transactions.count()).toBe(1);

    await store.register('run-fin', [toolCall({ toolName: 'criar_financa_variavel', args, result })]);
    const undo = await store.undo('run-fin');

    expect(undo.status).toBe('reverted');
    expect(await db.transactions.count()).toBe(0);
  });

  it('reverte múltiplas tool calls em ORDEM REVERSA', async () => {
    const criar = tool('criar_tarefa');
    const a = (await criar.execute(criar.argsSchema.parse({ titulo: 'A' }), execCtx)) as { id: string };
    const b = (await criar.execute(criar.argsSchema.parse({ titulo: 'B' }), execCtx)) as { id: string };
    expect(await db.tasks.count()).toBe(2);

    await store.register('run-multi', [
      toolCall({ toolName: 'criar_tarefa', result: a }),
      toolCall({ toolName: 'criar_tarefa', result: b }),
    ]);
    const undo = await store.undo('run-multi');

    expect(undo.reverted).toBe(2);
    expect(await db.tasks.count()).toBe(0);
  });
});

describe('ClientUndoStore — expiração da janela (30s)', () => {
  it('NÃO reverte após UNDO_TTL_SECONDS — undo devolve "expired"', async () => {
    const criar = tool('criar_tarefa');
    const args = criar.argsSchema.parse({ titulo: 'Tarefa expirável' });
    const result = (await criar.execute(args, execCtx)) as { id: string };

    vi.useFakeTimers();
    await store.register('run-exp', [toolCall({ toolName: 'criar_tarefa', args, result })]);
    // Avança a janela completa → o timer apaga a entrada.
    vi.advanceTimersByTime(UNDO_TTL_SECONDS * 1000 + 100);
    vi.useRealTimers();

    const undo = await store.undo('run-exp');
    expect(undo.status).toBe('expired');
    expect(undo.reverted).toBe(0);
    // A tarefa permanece — não foi revertida.
    expect(await db.tasks.get(result.id)).toBeDefined();
  });
});

describe('ClientUndoStore — at-most-once + best-effort', () => {
  it('segundo undo do mesmo run devolve "expired" (at-most-once)', async () => {
    const criar = tool('criar_tarefa');
    const result = (await criar.execute(criar.argsSchema.parse({ titulo: 'X' }), execCtx)) as { id: string };
    await store.register('run-once', [toolCall({ toolName: 'criar_tarefa', result })]);

    const first = await store.undo('run-once');
    expect(first.status).toBe('reverted');
    const second = await store.undo('run-once');
    expect(second.status).toBe('expired');
  });

  it('tool não registada → erro em errors[] (best-effort, não lança)', async () => {
    await store.register('run-bad', [
      toolCall({ toolName: 'tool_inexistente', result: { id: 'x' } }),
    ]);
    const undo = await store.undo('run-bad');
    expect(undo.status).toBe('reverted');
    expect(undo.errors).toHaveLength(1);
    expect(undo.errors[0].toolName).toBe('tool_inexistente');
  });

  it('undo de run inexistente devolve "expired" sem lançar', async () => {
    const undo = await store.undo('run-nunca-registado');
    expect(undo.status).toBe('expired');
    expect(undo.reverted).toBe(0);
  });

  it('cancel limpa a janela (undo subsequente devolve "expired")', async () => {
    const result = { id: 'task-x' };
    await store.register('run-cancel', [toolCall({ toolName: 'criar_tarefa', result })]);
    store.cancel('run-cancel');
    expect(store.has('run-cancel')).toBe(false);
    const undo = await store.undo('run-cancel');
    expect(undo.status).toBe('expired');
  });
});
