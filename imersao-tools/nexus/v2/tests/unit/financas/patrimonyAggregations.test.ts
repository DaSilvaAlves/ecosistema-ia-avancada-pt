import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_TYPE_LABELS,
  aggregateByAccountType,
  computeTotalPatrimony,
} from '@/lib/financas/patrimonyAggregations';
import type { Account } from '@/types/db';

/**
 * Story 3.9 — Tests para `lib/financas/patrimonyAggregations.ts`
 *
 * Foco (AC10):
 *   - `computeTotalPatrimony`: misto com negativo, só negativos, vazio, zero.
 *   - `aggregateByAccountType`: agrupamento, filtragem de tipos sem contas,
 *     subtotais com sinal, ordenação grupos por |sub| desc, ordenação interna
 *     por balance desc, invariante cross-função, saldo negativo de grupo,
 *     vazio, labels PT-PT.
 */

function makeAccount(
  partial: Partial<Account> & Pick<Account, 'balance' | 'type'>,
): Account {
  return {
    id: partial.id ?? 'acc-' + Math.random().toString(36).slice(2),
    name: partial.name ?? 'Conta',
    type: partial.type,
    balance: partial.balance,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

describe('patrimonyAggregations — computeTotalPatrimony', () => {
  it('soma misto com negativo: [+100000, +50000, -20000] → 130000', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100000 }),
      makeAccount({ type: 'savings', balance: 50000 }),
      makeAccount({ type: 'cash', balance: -20000 }),
    ];
    expect(computeTotalPatrimony(accounts)).toBe(130000);
  });

  it('só negativos: [-50000, -30000] → -80000', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: -50000 }),
      makeAccount({ type: 'cash', balance: -30000 }),
    ];
    expect(computeTotalPatrimony(accounts)).toBe(-80000);
  });

  it('vazio: [] → 0', () => {
    expect(computeTotalPatrimony([])).toBe(0);
  });

  it('zero: [0] → 0', () => {
    expect(computeTotalPatrimony([makeAccount({ type: 'checking', balance: 0 })])).toBe(0);
  });

  it('precisão: cêntimos inteiros sem float arithmetic', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 7870 }), // €78,70
      makeAccount({ type: 'savings', balance: 12345 }), // €123,45
      makeAccount({ type: 'cash', balance: 99 }), // €0,99
    ];
    expect(computeTotalPatrimony(accounts)).toBe(20314); // exacto, sem 0.000...01
  });
});

describe('patrimonyAggregations — aggregateByAccountType', () => {
  it('agrupamento correcto: 2 checking + 1 savings → 2 grupos com contagens correctas', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100000, name: 'Principal' }),
      makeAccount({ type: 'checking', balance: 50000, name: 'Secundária' }),
      makeAccount({ type: 'savings', balance: 30000, name: 'Poupança' }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result).toHaveLength(2);
    const checking = result.find((g) => g.type === 'checking');
    const savings = result.find((g) => g.type === 'savings');
    expect(checking?.count).toBe(2);
    expect(savings?.count).toBe(1);
  });

  it('filtragem: tipo sem contas não aparece (nenhum cash → sem grupo Dinheiro)', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100000 }),
      makeAccount({ type: 'savings', balance: 50000 }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result.find((g) => g.type === 'cash')).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it('subtotais correctos: subtotalCents === Σ balances do grupo (com sinal)', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100000 }),
      makeAccount({ type: 'checking', balance: 50000 }),
      makeAccount({ type: 'checking', balance: -20000 }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result[0].subtotalCents).toBe(130000); // 100k + 50k - 20k
  });

  it('ordenação de grupos: descendente por Math.abs(subtotalCents)', () => {
    const accounts = [
      makeAccount({ type: 'cash', balance: 1000 }), // |1000|
      makeAccount({ type: 'savings', balance: 100000 }), // |100000|
      makeAccount({ type: 'checking', balance: -50000 }), // |50000|
    ];
    const result = aggregateByAccountType(accounts);
    expect(result[0].type).toBe('savings'); // 100000
    expect(result[1].type).toBe('checking'); // 50000 (negativo, mas |sub|)
    expect(result[2].type).toBe('cash'); // 1000
  });

  it('ordenação interna: contas dentro do grupo por balance desc', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 50000, name: 'B' }),
      makeAccount({ type: 'checking', balance: 100000, name: 'A' }),
      makeAccount({ type: 'checking', balance: -10000, name: 'C' }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result[0].accounts.map((a) => a.balance)).toEqual([100000, 50000, -10000]);
  });

  it('invariante cross-função: Σ grupo.subtotalCents === computeTotalPatrimony(allAccounts)', () => {
    const inputs: Account[][] = [
      [
        makeAccount({ type: 'checking', balance: 100000 }),
        makeAccount({ type: 'savings', balance: 50000 }),
        makeAccount({ type: 'cash', balance: -20000 }),
      ],
      [
        makeAccount({ type: 'checking', balance: -50000 }),
        makeAccount({ type: 'cash', balance: 25000 }),
      ],
      [
        makeAccount({ type: 'savings', balance: 100000 }),
        makeAccount({ type: 'savings', balance: 200000 }),
        makeAccount({ type: 'savings', balance: 300000 }),
      ],
      [],
    ];
    for (const accs of inputs) {
      const groups = aggregateByAccountType(accs);
      const sumGroups = groups.reduce((s, g) => s + g.subtotalCents, 0);
      expect(sumGroups).toBe(computeTotalPatrimony(accs));
    }
  });

  it('saldo negativo de grupo: tipo com todas as contas a descoberto', () => {
    const accounts = [
      makeAccount({ type: 'cash', balance: -10000 }),
      makeAccount({ type: 'cash', balance: -5000 }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('cash');
    expect(result[0].subtotalCents).toBe(-15000);
    expect(result[0].accounts).toHaveLength(2);
  });

  it('vazio: [] → []', () => {
    expect(aggregateByAccountType([])).toEqual([]);
  });

  it('labels PT-PT correctos: checking → Conta à ordem, savings → Poupança, cash → Dinheiro', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100 }),
      makeAccount({ type: 'savings', balance: 100 }),
      makeAccount({ type: 'cash', balance: 100 }),
    ];
    const result = aggregateByAccountType(accounts);
    const checking = result.find((g) => g.type === 'checking');
    const savings = result.find((g) => g.type === 'savings');
    const cash = result.find((g) => g.type === 'cash');
    expect(checking?.labelPT).toBe('Conta à ordem');
    expect(savings?.labelPT).toBe('Poupança');
    expect(cash?.labelPT).toBe('Dinheiro');
  });

  it('ACCOUNT_TYPE_LABELS exporta os 3 mapeamentos canónicos', () => {
    expect(ACCOUNT_TYPE_LABELS.checking).toBe('Conta à ordem');
    expect(ACCOUNT_TYPE_LABELS.savings).toBe('Poupança');
    expect(ACCOUNT_TYPE_LABELS.cash).toBe('Dinheiro');
  });

  it('um único tipo: 3 contas de checking → 1 grupo', () => {
    const accounts = [
      makeAccount({ type: 'checking', balance: 100000 }),
      makeAccount({ type: 'checking', balance: 50000 }),
      makeAccount({ type: 'checking', balance: 30000 }),
    ];
    const result = aggregateByAccountType(accounts);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    expect(result[0].subtotalCents).toBe(180000);
  });
});
