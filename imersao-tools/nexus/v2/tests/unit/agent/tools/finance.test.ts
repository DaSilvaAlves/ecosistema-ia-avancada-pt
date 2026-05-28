import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import { seedDefaultCategories } from '@/lib/financas/seedCategories';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { Account, Card, Transaction } from '@/types/db';
// Side-effect import — regista as 13 tools (7 Epic 2 + 6 Epic 3).
// Importar o barrel (não `finance.ts` directo) evita dupla cadeia de registo.
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de finanças tests (Story 3.11 / AC7 — 23 cenários)
 *
 * `fake-indexeddb` carregado via `tests/setup.ts`. Cada tool é obtida via
 * `toolRegistry.get(name)` — o registo acontece 1x no import do barrel.
 * `beforeEach` limpa as tabelas de finanças + semeia categorias default PT
 * (necessárias para o fuzzy match) e cria uma conta + cartão de teste.
 *
 * Mock fidelity (AC11 / lição A1 Epic 1): os testes exercem o contrato REAL via
 * `fake-indexeddb` (não mock manual de `db.*`). O AC4 canónico (T1) valida o
 * shape exacto de `Transaction` persistido — `amount` com sinal, `category`
 * string, SEM `direction`/`categoryId`/`updatedAt`.
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) {
    throw new Error(`Tool "${name}" não registada no toolRegistry`);
  }
  return t;
};

// ── helpers ────────────────────────────────────────────────────────
function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: crypto.randomUUID(),
    name: 'Conta Principal',
    type: 'checking',
    balance: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID(),
    name: 'Cartão Teste',
    accountId: 'conta-test-id',
    closingDay: 25,
    dueDay: 5,
    limit: null,
    ...overrides,
  };
}

let conta: Account;
let cartaoMillennium: Card;

beforeEach(async () => {
  await db.transactions.clear();
  await db.categories.clear();
  await db.cards.clear();
  await db.accounts.clear();
  await db.financeRecurrences.clear();
  await db.recurrences.clear();
  await db.installments.clear();
  await seedDefaultCategories();
  // id UUID real — `criar_cartao.argsSchema.contaId` exige `z.string().uuid()`.
  conta = makeAccount({ name: 'Conta Principal', balance: 100000 });
  await db.accounts.add(conta);
  cartaoMillennium = makeCard({ name: 'Millennium', accountId: conta.id });
  await db.cards.add(cartaoMillennium);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// criar_finança_variavel — T1-T6, T24
// ═══════════════════════════════════════════════════════════════════

describe('criar_finança_variavel', () => {
  it('T1 — sucesso AC4 canónico: "paguei €78,70 no supermercado com cartão Millennium"', async () => {
    // AC4 do Epic 3: o utilizador diz "supermercado"; o LLM (classifier/executor)
    // faz o mapeamento semântico → categoria canónica 'Mercearia' e chama a tool
    // com `categoriaNome: 'Mercearia'`. O matcher da tool resolve variantes/case
    // dos nomes canónicos (substring) — NÃO faz mapeamento semântico de
    // vocabulário arbitrário (isso é trabalho do LLM). Ver DEV-DECISION D-FUZZY.
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 7870,
      direction: 'out',
      categoriaNome: 'Mercearia',
      cartaoNome: 'Millennium',
      data: '2026-05-25',
    });
    const result = (await t.execute(args, ctx)) as { id: string; mensagem: string };

    expect(result.id).toMatch(UUID_RE);
    expect(result.mensagem).toContain('€78,70');
    expect(result.mensagem).toContain('Mercearia');
    expect(result.mensagem).toContain('Millennium');

    const tx = (await db.transactions.get(result.id)) as Transaction;
    expect(tx.amount).toBe(-7870); // saída → sinal negativo
    expect(tx.category).toBe('Mercearia'); // string canónica, NÃO categoryId
    expect(tx.cardId).toBe(cartaoMillennium.id);
    expect(tx.date).toBe('2026-05-25');
    // Schema canónico: sem campos fantasma
    expect(tx).not.toHaveProperty('direction');
    expect(tx).not.toHaveProperty('categoryId');
    expect(tx).not.toHaveProperty('updatedAt');
  });

  it('T2 — categoria não encontrada lança Error PT-PT e não persiste', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 5000,
      direction: 'out',
      categoriaNome: 'eletrodomesticos',
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/Categoria não encontrada/);
    expect(await db.transactions.toArray()).toHaveLength(0);
  });

  it('T3 — cartão ambíguo lança Error PT-PT e não persiste', async () => {
    await db.cards.add(makeCard({ name: 'Visa Gold', accountId: conta.id }));
    await db.cards.add(makeCard({ name: 'Visa Platinum', accountId: conta.id }));
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 5000,
      direction: 'out',
      categoriaNome: 'lazer',
      cartaoNome: 'Visa',
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/Cartão ambíguo/);
    expect(await db.transactions.toArray()).toHaveLength(0);
  });

  it('T4 — cartão não encontrado lança Error PT-PT e não persiste', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 5000,
      direction: 'out',
      categoriaNome: 'lazer',
      cartaoNome: 'CartaoInexistente',
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/Cartão não encontrado/);
    expect(await db.transactions.toArray()).toHaveLength(0);
  });

  it('T5 — reverse elimina a transação criada', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 7870,
      direction: 'out',
      categoriaNome: 'mercearia',
      cartaoNome: 'Millennium',
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    expect(await db.transactions.get(result.id)).toBeDefined();
    expect(t.reverse).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect(await db.transactions.get(result.id)).toBeUndefined();
  });

  it('T6 — sem cartão (entrada de salário) grava cardId null', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 150000,
      direction: 'in',
      categoriaNome: 'serviços',
      cartaoNome: null,
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    const tx = (await db.transactions.get(result.id)) as Transaction;
    expect(tx.cardId).toBeNull();
    expect(tx.amount).toBe(150000); // entrada → positivo
  });

  it('T24 — entrada (direction "in") grava amount positivo', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 5000,
      direction: 'in',
      categoriaNome: 'serviços',
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    const tx = (await db.transactions.get(result.id)) as Transaction;
    expect(tx.amount).toBe(5000);
  });

  it('T26 — contaId inexistente lança Error PT-PT e não persiste (CR Iter 1)', async () => {
    const t = tool('criar_financa_variavel');
    const args = t.argsSchema.parse({
      montante: 5000,
      direction: 'out',
      categoriaNome: 'lazer',
      contaId: crypto.randomUUID(), // conta que não existe
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/Conta .* não encontrada/);
    expect(await db.transactions.toArray()).toHaveLength(0);
  });

  it('T27 — argsSchema rejeita data de calendário inválida (CR Iter 1)', () => {
    const t = tool('criar_financa_variavel');
    expect(() =>
      t.argsSchema.parse({
        montante: 100,
        direction: 'out',
        categoriaNome: 'lazer',
        data: '2026-02-30', // passa o regex mas não é data real
      })
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// criar_finança_recorrente — T7, T8
// ═══════════════════════════════════════════════════════════════════

describe('criar_finança_recorrente', () => {
  it('T7 — sucesso: cross-link canónico (ownerType transaction, ownerId === frId)', async () => {
    const t = tool('criar_financa_recorrente');
    const args = t.argsSchema.parse({
      montante: 75000,
      direction: 'out',
      categoriaNome: 'habitação',
      recorrencia: { frequency: 'monthly', interval: 1, dayOfMonth: 1 },
      dataInicio: '2026-06-01',
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      recurrenceId: string;
    };
    expect(result.id).toMatch(UUID_RE);
    expect(result.recurrenceId).toMatch(UUID_RE);
    expect(result.id).not.toBe(result.recurrenceId);

    const rec = await db.recurrences.get(result.recurrenceId);
    expect(rec?.ownerType).toBe('transaction');
    expect(rec?.ownerId).toBe(result.id); // cross-link exigido por runFinanceRecurrenceEngine
    expect(rec?.rule).toContain('FREQ=MONTHLY');
    expect(rec?.rule).toContain('BYMONTHDAY=1');
    expect(rec?.startDate).toBe('2026-06-01');

    const fr = await db.financeRecurrences.get(result.id);
    expect(fr?.amount).toBe(-75000); // saída
    expect(fr?.category).toBe('Habitação'); // string canónica
    expect(fr?.recurrenceId).toBe(result.recurrenceId);
    expect(fr).not.toHaveProperty('updatedAt');
  });

  it('T8 — reverse elimina financeRecurrence + recurrence', async () => {
    const t = tool('criar_financa_recorrente');
    const args = t.argsSchema.parse({
      montante: 75000,
      direction: 'out',
      categoriaNome: 'habitação',
      recorrencia: { frequency: 'monthly', interval: 1, dayOfMonth: 1 },
      dataInicio: '2026-06-01',
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      recurrenceId: string;
    };
    expect(await db.financeRecurrences.get(result.id)).toBeDefined();
    expect(await db.recurrences.get(result.recurrenceId)).toBeDefined();

    await t.reverse!(args, result, ctx);
    expect(await db.financeRecurrences.get(result.id)).toBeUndefined();
    expect(await db.recurrences.get(result.recurrenceId)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// criar_cartao — T9, T10, T11
// ═══════════════════════════════════════════════════════════════════

describe('criar_cartao', () => {
  it('T9 — sucesso: grava exactamente os 6 campos canónicos de Card', async () => {
    const t = tool('criar_cartao');
    const args = t.argsSchema.parse({
      nome: 'Visa Platinum',
      contaId: conta.id,
      fechamentoDia: 25,
      vencimentoDia: 5,
      limiteEuros: 1000,
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      nome: string;
      mensagem: string;
    };
    const card = (await db.cards.get(result.id)) as Card;

    expect(Object.keys(card).sort()).toEqual([
      'accountId',
      'closingDay',
      'dueDay',
      'id',
      'limit',
      'name',
    ]);
    expect(card.closingDay).toBe(25);
    expect(card.dueDay).toBe(5);
    expect(card.limit).toBe(100000); // €1000 × 100
    expect(result.nome).toBe('Visa Platinum');
    expect(result.mensagem).toContain('Visa Platinum');
  });

  it('T10 — conta não encontrada lança Error PT-PT e não persiste', async () => {
    const t = tool('criar_cartao');
    const args = t.argsSchema.parse({
      nome: 'Visa',
      contaId: crypto.randomUUID(),
      fechamentoDia: 10,
      vencimentoDia: 20,
    });
    const cardsBefore = (await db.cards.toArray()).length;
    await expect(t.execute(args, ctx)).rejects.toThrow(/Conta .* não encontrada/);
    expect((await db.cards.toArray()).length).toBe(cardsBefore);
  });

  it('T11 — reverse elimina o cartão criado', async () => {
    const t = tool('criar_cartao');
    const args = t.argsSchema.parse({
      nome: 'Visa Temp',
      contaId: conta.id,
      fechamentoDia: 10,
      vencimentoDia: 20,
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    expect(await db.cards.get(result.id)).toBeDefined();
    await t.reverse!(args, result, ctx);
    expect(await db.cards.get(result.id)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// criar_parcelada — T12, T13, T14
// ═══════════════════════════════════════════════════════════════════

describe('criar_parcelada', () => {
  it('T12 — sucesso: cria installment + 12 transactions (saída negativa)', async () => {
    const t = tool('criar_parcelada');
    const args = t.argsSchema.parse({
      cartaoNome: 'Millennium',
      totalMontante: 120000,
      parcelas: 12,
      descricao: 'Compra Worten',
      categoriaNome: 'lazer',
      dataInicio: '2026-06-01',
    });
    const result = (await t.execute(args, ctx)) as {
      installmentId: string;
      nParcelas: number;
    };
    expect(result.nParcelas).toBe(12);

    const inst = await db.installments.get(result.installmentId);
    expect(inst?.totalAmount).toBe(120000);
    expect(inst?.installments).toBe(12);

    const txs = await db.transactions
      .filter((t2) => t2.installmentId === result.installmentId)
      .toArray();
    expect(txs).toHaveLength(12);
    expect(txs.every((t2) => t2.amount === -10000)).toBe(true); // €1200/12 = €100 saída
    expect(txs.every((t2) => t2.category === 'Lazer')).toBe(true);
  });

  it('T25 — split não-divisível: soma das parcelas === -totalMontante (CR Iter 1)', async () => {
    const t = tool('criar_parcelada');
    // 10000 / 3 = [3334, 3333, 3333] — resto distribuído, nenhum cêntimo perdido.
    const args = t.argsSchema.parse({
      cartaoNome: 'Millennium',
      totalMontante: 10000,
      parcelas: 3,
      descricao: 'Compra com resto',
      categoriaNome: 'lazer',
      dataInicio: '2026-06-01',
    });
    const result = (await t.execute(args, ctx)) as { installmentId: string };
    const txs = await db.transactions
      .filter((t2) => t2.installmentId === result.installmentId)
      .toArray();
    expect(txs).toHaveLength(3);
    const soma = txs.reduce((s, t2) => s + t2.amount, 0);
    expect(soma).toBe(-10000); // soma exacta, sem cêntimos perdidos/inventados
    expect(txs.map((t2) => t2.amount).sort((a, b) => a - b)).toEqual([
      -3334, -3333, -3333,
    ].sort((a, b) => a - b));
  });

  it('T13 — atomicidade: falha em bulkAdd faz rollback do installment', async () => {
    const t = tool('criar_parcelada');
    const args = t.argsSchema.parse({
      cartaoNome: 'Millennium',
      totalMontante: 120000,
      parcelas: 12,
      descricao: 'Compra que falha',
      categoriaNome: 'lazer',
      dataInicio: '2026-06-01',
    });
    const spy = vi
      .spyOn(db.transactions, 'bulkAdd')
      .mockRejectedValueOnce(new Error('falha simulada de IndexedDB'));

    await expect(t.execute(args, ctx)).rejects.toThrow();
    expect(await db.installments.toArray()).toHaveLength(0); // rollback
    spy.mockRestore();
  });

  it('T14 — reverse elimina installment + todas as transactions', async () => {
    const t = tool('criar_parcelada');
    const args = t.argsSchema.parse({
      cartaoNome: 'Millennium',
      totalMontante: 120000,
      parcelas: 12,
      descricao: 'Compra reversível',
      categoriaNome: 'lazer',
      dataInicio: '2026-06-01',
    });
    const result = (await t.execute(args, ctx)) as { installmentId: string };
    await t.reverse!(args, result, ctx);
    expect(await db.installments.get(result.installmentId)).toBeUndefined();
    const remaining = await db.transactions
      .filter((t2) => t2.installmentId === result.installmentId)
      .count();
    expect(remaining).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// consultar_balanço — T15, T16
// ═══════════════════════════════════════════════════════════════════

describe('consultar_balanço', () => {
  it('T15 — sem args: agrega todas as contas', async () => {
    await db.accounts.clear();
    await db.accounts.add(makeAccount({ name: 'A', balance: 50000 }));
    await db.accounts.add(makeAccount({ name: 'B', balance: 30000 }));
    const t = tool('consultar_balanco');
    const result = (await t.execute(t.argsSchema.parse({}), ctx)) as {
      totalCentimos: number;
      contas: unknown[];
    };
    expect(result.totalCentimos).toBe(80000);
    expect(result.contas).toHaveLength(2);
  });

  it('T16 — conta específica: filtra por nome', async () => {
    await db.accounts.clear();
    await db.accounts.add(makeAccount({ name: 'Millennium', balance: 50000 }));
    await db.accounts.add(makeAccount({ name: 'Revolut', balance: 30000 }));
    const t = tool('consultar_balanco');
    const result = (await t.execute(
      t.argsSchema.parse({ contaNome: 'Millennium' }),
      ctx
    )) as { totalCentimos: number; contas: { nome: string }[] };
    expect(result.totalCentimos).toBe(50000);
    expect(result.contas).toHaveLength(1);
    expect(result.contas[0].nome).toBe('Millennium');
  });
});

// ═══════════════════════════════════════════════════════════════════
// consultar_categoria — T17, T18
// ═══════════════════════════════════════════════════════════════════

describe('consultar_categoria', () => {
  function txn(overrides: Partial<Transaction>): Transaction {
    return {
      id: crypto.randomUUID(),
      amount: -5000,
      category: 'Mercearia',
      description: '',
      date: '2026-04-15',
      accountId: null,
      cardId: null,
      recurrenceId: null,
      installmentId: null,
      createdAt: Date.now(),
      ...overrides,
    };
  }

  it('T17 — mês corrente: conta só as transações do mês', async () => {
    const mesCorrente = new Date().toISOString().slice(0, 7);
    await db.transactions.bulkAdd([
      txn({ category: 'Mercearia', amount: -5000, date: `${mesCorrente}-05` }),
      txn({ category: 'Mercearia', amount: -5000, date: `${mesCorrente}-15` }),
      txn({ category: 'Mercearia', amount: -5000, date: `${mesCorrente}-25` }),
      txn({ category: 'Mercearia', amount: -9999, date: '2020-01-15' }), // mês antigo — não conta
    ]);
    const t = tool('consultar_categoria');
    const result = (await t.execute(
      t.argsSchema.parse({ categoriaNome: 'mercearia' }),
      ctx
    )) as { totalCentimos: number; count: number; mesIso: string };
    expect(result.count).toBe(3);
    expect(result.totalCentimos).toBe(-15000); // soma com sinal (3 × -5000)
    expect(result.mesIso).toBe(mesCorrente);
  });

  it('T18 — mês específico: filtra correctamente', async () => {
    await db.transactions.bulkAdd([
      txn({ category: 'Mercearia', amount: -5000, date: '2026-04-10' }),
      txn({ category: 'Mercearia', amount: -3000, date: '2026-04-20' }),
      txn({ category: 'Mercearia', amount: -1000, date: '2026-05-01' }), // outro mês
    ]);
    const t = tool('consultar_categoria');
    const result = (await t.execute(
      t.argsSchema.parse({ categoriaNome: 'mercearia', mesIso: '2026-04' }),
      ctx
    )) as { totalCentimos: number; count: number };
    expect(result.count).toBe(2);
    expect(result.totalCentimos).toBe(-8000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Registry + Anthropic shape + argsSchema validation — T19-T22
// ═══════════════════════════════════════════════════════════════════

describe('registo no toolRegistry', () => {
  it('T19 — 13 tools registadas após import do barrel (7 + 6)', () => {
    expect(toolRegistry.byDomain('finance')).toHaveLength(6);
    expect(toolRegistry.all().length).toBe(13);
  });

  it('T20 — toAnthropicTools não lança para as 6 tools de finanças', () => {
    const financeTools = toolRegistry.byDomain('finance');
    expect(() => toolRegistry.toAnthropicTools(financeTools)).not.toThrow();
    expect(toolRegistry.toAnthropicTools(financeTools)).toHaveLength(6);
  });

  it('T21 — argsSchema rejeita montante negativo', () => {
    const t = tool('criar_financa_variavel');
    expect(() =>
      t.argsSchema.parse({ montante: -100, direction: 'out', categoriaNome: 'lazer' })
    ).toThrow();
  });

  it('T22 — argsSchema rejeita data inválida', () => {
    const t = tool('criar_financa_variavel');
    expect(() =>
      t.argsSchema.parse({
        montante: 100,
        direction: 'out',
        categoriaNome: 'lazer',
        data: 'não-é-data',
      })
    ).toThrow();
  });
});
