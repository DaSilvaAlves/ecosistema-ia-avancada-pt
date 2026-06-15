import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type { JournalEntry, BrainDump } from '@/types/db';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de diário + brain dump tests (Story 5.13 — FR46+FR50)
 *
 * `fake-indexeddb` via `tests/setup.ts`. `ctx.db` real. Padrão `habits.test.ts`.
 * Cobre T1-T11 (diário T1-T8, brain dump T9-T11).
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

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    date: overrides.date ?? '2026-06-01',
    mood: overrides.mood ?? 3,
    bodyMarkdown: overrides.bodyMarkdown ?? 'corpo de teste',
    structuredAI: overrides.structuredAI,
  };
}

beforeEach(async () => {
  await db.journal_entries.clear();
  await db.brain_dumps.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('domínio das 4 tools de journal (D-5.13-DOMAIN=A)', () => {
  it('criar_entrada_diario / consultar_diario / pesquisar_diario / brain_dump têm domain "journal"', () => {
    expect(tool('criar_entrada_diario').domain).toBe('journal');
    expect(tool('consultar_diario').domain).toBe('journal');
    expect(tool('pesquisar_diario').domain).toBe('journal');
    expect(tool('brain_dump').domain).toBe('journal');
  });
});

describe('criar_entrada_diario (T1-T4)', () => {
  it('T1 — sucesso: entrada criada com date, mood e bodyMarkdown correctos', async () => {
    const t = tool('criar_entrada_diario');
    const args = t.argsSchema.parse({
      data: '2026-06-15',
      bodyMarkdown: 'tive reunião produtiva',
      mood: 4,
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      data: string;
      mensagem: string;
    };
    expect(result.id).toMatch(UUID_RE);
    expect(result.data).toBe('2026-06-15');
    const e = (await db.journal_entries.get(result.id)) as JournalEntry;
    expect(e.date).toBe('2026-06-15');
    expect(e.mood).toBe(4);
    expect(e.bodyMarkdown).toBe('tive reunião produtiva');
  });

  it('T1b — sem data usa hoje (default)', async () => {
    const t = tool('criar_entrada_diario');
    const hoje = new Date().toISOString().slice(0, 10);
    const args = t.argsSchema.parse({ bodyMarkdown: 'hoje', mood: 3 });
    const result = (await t.execute(args, ctx)) as { data: string };
    expect(result.data).toBe(hoje);
  });

  it('T2 — duplicado: entrada já existe para a data → erro PT-PT, nenhuma criada', async () => {
    await db.journal_entries.add(makeEntry({ date: '2026-06-10' }));
    const t = tool('criar_entrada_diario');
    const args = t.argsSchema.parse({
      data: '2026-06-10',
      bodyMarkdown: 'outra',
      mood: 2,
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/já existe uma entrada/i);
    expect(await db.journal_entries.where('date').equals('2026-06-10').count()).toBe(1);
  });

  it('T3 — mood fora de range (6) → Zod lança', () => {
    const t = tool('criar_entrada_diario');
    expect(() =>
      t.argsSchema.parse({ data: '2026-06-01', bodyMarkdown: 'x', mood: 6 }),
    ).toThrow();
  });

  it('T4 — reverse: entrada criada → reverse → get retorna undefined', async () => {
    const t = tool('criar_entrada_diario');
    const args = t.argsSchema.parse({
      data: '2026-06-02',
      bodyMarkdown: 'reversível',
      mood: 3,
    });
    const result = (await t.execute(args, ctx)) as { id: string; data: string; mensagem: string };
    await t.reverse!(args, result, ctx);
    expect(await db.journal_entries.get(result.id)).toBeUndefined();
  });
});

describe('consultar_diario (T5-T6)', () => {
  it('T5 — intervalo: 3 entradas no range, 1 fora → retorna as 3', async () => {
    await db.journal_entries.bulkAdd([
      makeEntry({ date: '2026-05-01' }),
      makeEntry({ date: '2026-05-15' }),
      makeEntry({ date: '2026-05-31' }),
      makeEntry({ date: '2026-06-10' }), // fora
    ]);
    const t = tool('consultar_diario');
    const args = t.argsSchema.parse({ dataInicio: '2026-05-01', dataFim: '2026-05-31' });
    const result = (await t.execute(args, ctx)) as {
      entradas: unknown[];
      total: number;
    };
    expect(result.total).toBe(3);
    expect(result.entradas).toHaveLength(3);
  });

  it('T6 — sem args: últimas 7 (ou menos se DB pequena)', async () => {
    await db.journal_entries.bulkAdd([
      makeEntry({ date: '2026-01-01' }),
      makeEntry({ date: '2026-02-01' }),
    ]);
    const t = tool('consultar_diario');
    const args = t.argsSchema.parse({});
    const result = (await t.execute(args, ctx)) as {
      entradas: Array<{ date: string }>;
      total: number;
    };
    expect(result.total).toBe(2);
    // ordem desc por date (mais recente primeiro)
    expect(result.entradas[0].date).toBe('2026-02-01');
  });

  it('T6b — DB vazia → total 0, mensagem PT-PT', async () => {
    const t = tool('consultar_diario');
    const args = t.argsSchema.parse({});
    const result = (await t.execute(args, ctx)) as { total: number; mensagem: string };
    expect(result.total).toBe(0);
    expect(result.mensagem).toMatch(/não encontrei/i);
  });
});

describe('pesquisar_diario (T7-T8)', () => {
  it('T7 — match: 2 entradas contêm "reunião", 1 não → retorna as 2', async () => {
    await db.journal_entries.bulkAdd([
      makeEntry({ date: '2026-06-01', bodyMarkdown: 'reunião com cliente' }),
      makeEntry({ date: '2026-06-02', bodyMarkdown: 'outra reunião importante' }),
      makeEntry({ date: '2026-06-03', bodyMarkdown: 'fui correr ao parque' }),
    ]);
    const t = tool('pesquisar_diario');
    const args = t.argsSchema.parse({ query: 'reunião' });
    const result = (await t.execute(args, ctx)) as {
      resultados: Array<{ excerpt: string }>;
      total: number;
    };
    expect(result.total).toBe(2);
    expect(result.resultados).toHaveLength(2);
  });

  it('T8 — sem match: query sem resultados → total 0, mensagem PT-PT', async () => {
    await db.journal_entries.add(makeEntry({ bodyMarkdown: 'corri ao parque' }));
    const t = tool('pesquisar_diario');
    const args = t.argsSchema.parse({ query: 'inexistentexyz' });
    const result = (await t.execute(args, ctx)) as { total: number; mensagem: string };
    expect(result.total).toBe(0);
    expect(result.mensagem).toMatch(/não encontrei/i);
  });
});

describe('brain_dump (T9-T11 — B1 + R1)', () => {
  it('T9 — sucesso B1: BrainDump criado com status "pending", parsedOutput undefined', async () => {
    const t = tool('brain_dump');
    const args = t.argsSchema.parse({ texto: 'ideias soltas sobre o projecto X' });
    const result = (await t.execute(args, ctx)) as {
      brainDumpId: string;
      mensagem: string;
    };
    expect(result.brainDumpId).toMatch(UUID_RE);
    const dump = (await db.brain_dumps.get(result.brainDumpId)) as BrainDump;
    expect(dump.status).toBe('pending');
    expect(dump.bodyMarkdown).toBe('ideias soltas sobre o projecto X');
    expect(dump.parsedOutput).toBeUndefined();
    // R1: resultSchema inclui mensagem PT-PT (executor injecta como tool_result).
    expect(result.mensagem).toMatch(/brain dump/i);
  });

  it('T9b — não reversível e requiresPreview false (B1)', () => {
    const t = tool('brain_dump');
    expect(t.reversible).toBe(false);
    expect(t.requiresPreview).toBe(false);
    expect(t.reverse).toBeUndefined();
  });

  it('T10 — texto vazio: Zod lança (.min(1))', () => {
    const t = tool('brain_dump');
    expect(() => t.argsSchema.parse({ texto: '' })).toThrow();
  });

  it('T11 — mock-fidelidade: o resultado tem a forma exacta do resultSchema (flui para tool_result)', async () => {
    // R1: a tool NÃO escreve em chat_messages; devolve { brainDumpId, mensagem }
    // que o executor injecta como tool_result. Anti-tautológico: valida que o
    // resultado passa o resultSchema real (shape que o executor serializa).
    const t = tool('brain_dump');
    const args = t.argsSchema.parse({ texto: 'algo' });
    const result = await t.execute(args, ctx);
    expect(() => t.resultSchema.parse(result)).not.toThrow();
    const parsed = t.resultSchema.parse(result) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(['brainDumpId', 'mensagem']);
    // a tool não criou nenhuma ChatMessage (R2 rejeitada)
    expect(await db.chat_messages.count()).toBe(0);
  });
});
