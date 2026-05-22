import { describe, it, expect, beforeEach } from 'vitest';
import Dexie, { type Table } from 'dexie';
import { NexusDB } from '@/lib/db/client';
import type { Transaction, Recurrence } from '@/types/db';

/**
 * Nexus v2 — Schema upgrade test v2 → v3 (Story 3.1 / AC15)
 *
 * Mitigação do risco "incremento version(3) mal-formado propaga-se às Stories
 * 3.2-3.11". Dexie é aditivo: `this.version(3).stores({...})` preserva os dados
 * de version(1) + version(2). Este teste prova-o concretamente.
 *
 * Padrão `NexusDBV1Only` da Story 2.1 replicado como `NexusDBV2Only` — honest
 * mock conforme `mock-protocol-fidelity.md`: réplica LITERAL de version(1) +
 * version(2), sem version(3).
 *
 * Estratégia:
 * 1. Abrir a DB `nexus_v2` numa Dexie que SÓ conhece version(1) + version(2),
 *    espelhando o estado pré-Story 3.1 (era assim em main antes deste push).
 * 2. Inserir dados em `transactions` (version(1)) e `recurrences` (version(2)) —
 *    as duas tabelas reutilizadas pelo Epic 3.
 * 3. Reabrir como `NexusDB` (version(1) + version(2) + version(3)). Dexie
 *    detecta a versão antiga e aplica o upgrade aditivo (accounts, cards,
 *    installments, categories novas e vazias).
 * 4. Verificar que os dados de version(1)/version(2) sobrevivem e que as 4
 *    tabelas novas existem e estão vazias.
 *
 * Contagem de tabelas: version(2) tem 15 tabelas (13 de version(1) + 2 de
 * version(2)). version(3) adiciona 4 → total 19.
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

/**
 * Réplica da NexusDB SÓ com version(1) + version(2) — para emular o estado
 * pré-Story 3.1. Mesmo nome `nexus_v2` para Dexie reconhecer como upgrade
 * da mesma DB.
 */
class NexusDBV2Only extends Dexie {
  transactions!: Table<Transaction, string>;
  recurrences!: Table<Recurrence, string>;

  constructor() {
    super('nexus_v2');
    this.version(1).stores({
      tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt',
      projects: 'id, status, createdAt',
      transactions: 'id, accountId, cardId, category, date, recurrenceId, [accountId+date]',
      habits: 'id, frequency, category, createdAt',
      habit_logs: 'id, habitId, date, [habitId+date]',
      goals: 'id, status, deadline',
      reminders: 'id, fireAt, status, [status+fireAt]',
      journal_entries: 'id, date, mood',
      knowledge_areas: 'id, name',
      knowledge_notebooks: 'id, areaId',
      knowledge_notes: 'id, notebookId, *tags, updatedAt',
      agent_runs: 'id, timestamp, [timestamp+status]',
      chat_messages: 'id, conversationId, timestamp, [conversationId+timestamp]',
    });
    this.version(2).stores({
      recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]',
      tags: 'id, name',
    });
  }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    amount: -2500,
    category: 'Mercearia',
    description: 'Existia antes da Story 3.1',
    date: '2026-05-15',
    accountId: null,
    cardId: null,
    recurrenceId: null,
    installmentId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeRecurrence(overrides: Partial<Recurrence> = {}): Recurrence {
  return {
    id: crypto.randomUUID(),
    rule: 'FREQ=MONTHLY',
    startDate: '2026-05-15',
    endDate: null,
    ownerType: 'transaction',
    ownerId: crypto.randomUUID(),
    ...overrides,
  };
}

describe('schema upgrade v2 → v3 (Story 3.1, AC15)', () => {
  beforeEach(async () => {
    await Dexie.delete('nexus_v2');
  });

  it('preserva transactions e recurrences ao fazer upgrade de version(2) para version(3)', async () => {
    // 1. Abrir como v2-only (estado pré-Story 3.1) e inserir dados.
    const oldDB = new NexusDBV2Only();
    await oldDB.open();
    expect(oldDB.verno).toBe(2);

    const tx = makeTransaction({ description: 'Sobrevivente' });
    const recurrence = makeRecurrence();

    await oldDB.transactions.add(tx);
    await oldDB.recurrences.add(recurrence);

    expect(await oldDB.transactions.count()).toBe(1);
    expect(await oldDB.recurrences.count()).toBe(1);

    oldDB.close();

    // 2. Reabrir como NexusDB completa (v1 + v2 + v3 + v4) — Dexie aplica upgrade aditivo.
    const newDB = new NexusDB();
    await newDB.open();
    expect(newDB.verno).toBe(4);

    // 3. Dados de version(1) e version(2) sobrevivem intactos.
    expect(await newDB.transactions.count()).toBe(1);
    const restoredTx = await newDB.transactions.get(tx.id);
    expect(restoredTx).toEqual(tx);

    expect(await newDB.recurrences.count()).toBe(1);
    const restoredRecurrence = await newDB.recurrences.get(recurrence.id);
    expect(restoredRecurrence).toEqual(recurrence);

    // 4. As 4 tabelas novas de version(3) existem e estão vazias.
    expect(await newDB.accounts.count()).toBe(0);
    expect(await newDB.cards.count()).toBe(0);
    expect(await newDB.installments.count()).toBe(0);
    expect(await newDB.categories.count()).toBe(0);

    newDB.close();
  });

  it('aceita escritas nas novas tabelas (accounts, cards, installments, categories) após upgrade', async () => {
    // Setup: estado pré-upgrade com dados em transactions.
    const oldDB = new NexusDBV2Only();
    await oldDB.open();
    await oldDB.transactions.add(makeTransaction());
    oldDB.close();

    // Upgrade para v3.
    const newDB = new NexusDB();
    await newDB.open();

    const accountId = crypto.randomUUID();
    await newDB.accounts.add({
      id: accountId,
      name: 'Conta pós-upgrade',
      type: 'checking',
      balance: 100000,
      createdAt: Date.now(),
    });

    const cardId = crypto.randomUUID();
    await newDB.cards.add({
      id: cardId,
      name: 'Cartão pós-upgrade',
      accountId,
      closingDay: 25,
      dueDay: 10,
      limit: 500000,
    });

    await newDB.installments.add({
      id: crypto.randomUUID(),
      cardId,
      totalAmount: 120000,
      installments: 12,
      startDate: '2026-05-15',
      description: 'Compra parcelada pós-upgrade',
    });

    await newDB.categories.add({
      name: 'Mercearia',
      color: '#39FF14',
      icon: 'shopping-cart',
      isDefault: true,
    });

    expect(await newDB.accounts.count()).toBe(1);
    expect(await newDB.cards.count()).toBe(1);
    expect(await newDB.installments.count()).toBe(1);
    expect(await newDB.categories.count()).toBe(1);

    // Índice composto [cardId+startDate] funcional na nova tabela installments.
    const byCard = await newDB.installments
      .where('[cardId+startDate]')
      .between([cardId, Dexie.minKey], [cardId, Dexie.maxKey])
      .toArray();
    expect(byCard).toHaveLength(1);

    newDB.close();
  });

  it('o índice composto [cardId+date] adicionado a transactions em version(3) é funcional', async () => {
    const newDB = new NexusDB();
    await newDB.open();
    expect(newDB.verno).toBe(4);

    const cardId = crypto.randomUUID();
    await newDB.transactions.add(makeTransaction({ cardId, date: '2026-05-10' }));
    await newDB.transactions.add(makeTransaction({ cardId, date: '2026-05-20' }));
    await newDB.transactions.add(makeTransaction({ cardId: null, date: '2026-05-15' }));

    // Query pelo índice composto [cardId+date] — usado pela vista cartões (Story 3.8).
    const byCardAndDate = await newDB.transactions
      .where('[cardId+date]')
      .between([cardId, '2026-05-01'], [cardId, '2026-05-31'])
      .toArray();
    expect(byCardAndDate).toHaveLength(2);
    byCardAndDate.forEach((t) => expect(t.cardId).toBe(cardId));

    newDB.close();
  });

  it('NexusDB em base limpa abre directamente em version(4) com todas as 20 tabelas', async () => {
    const db = new NexusDB();
    await db.open();
    expect(db.verno).toBe(4);

    // 13 de version(1) + 2 de version(2) + 4 de version(3) + 1 de version(4) = 20.
    expect(db.tables).toHaveLength(20);

    // As 15 tabelas de version(2).
    expect(await db.tasks.count()).toBe(0);
    expect(await db.projects.count()).toBe(0);
    expect(await db.recurrences.count()).toBe(0);
    expect(await db.tags.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.habits.count()).toBe(0);
    expect(await db.habit_logs.count()).toBe(0);
    expect(await db.goals.count()).toBe(0);
    expect(await db.reminders.count()).toBe(0);
    expect(await db.journal_entries.count()).toBe(0);
    expect(await db.knowledge_areas.count()).toBe(0);
    expect(await db.knowledge_notebooks.count()).toBe(0);
    expect(await db.knowledge_notes.count()).toBe(0);
    expect(await db.agent_runs.count()).toBe(0);
    expect(await db.chat_messages.count()).toBe(0);

    // As 4 tabelas novas de version(3).
    expect(await db.accounts.count()).toBe(0);
    expect(await db.cards.count()).toBe(0);
    expect(await db.installments.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);

    // A tabela nova de version(4) — Story 3.4 (recorrências financeiras).
    expect(await db.financeRecurrences.count()).toBe(0);

    db.close();
  });
});
