/**
 * Story 1.10 — Helper para validação Dexie via `page.evaluate()`.
 * Story 1.12 (ADR-9, F2) — `window.__nexusDB` passa a ser exposto pelo
 * `DevDbExposer` (dev/staging) → estas asserções deixam de ser inertes.
 *
 * Antes da Story 1.12, `window.__nexusDB` nunca era exposto, logo
 * `getAgentRunsSnapshot().available` era sempre `false` e os asserts de Dexie
 * (incl. `lastStatus === 'reverted'` do undo) não corriam. A Story 1.12
 * (decisão Architect Gate §3-F2) expõe o singleton via `DevDbExposer` em
 * `app/(app)/layout.tsx` quando `NODE_ENV !== 'production'`.
 *
 * Correcção crítica Story 1.12: a tabela de runs do `NexusDB` chama-se
 * `agent_runs` (snake_case — `lib/db/client.ts:80,97`), NÃO `agentRuns`. O
 * helper original acedia a `db.agentRuns` (camelCase, inexistente) — só não
 * partia porque `window.__nexusDB` nunca estava exposto. Agora que está, lê-se
 * `db.agent_runs`.
 */

import type { Page } from '@playwright/test';

export type AgentRunStatusOnPage =
  | 'started'
  | 'streaming'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'aborted'
  | 'reverted'
  | 'success';

export interface DexieAgentRunSnapshot {
  available: boolean;
  count: number;
  lastStatus: AgentRunStatusOnPage | null;
}

/**
 * Shape mínimo do `window.__nexusDB` que estes helpers acedem. Evita `any`
 * (Constitution Art. V / NFR15): só declara os métodos Dexie usados.
 */
interface NexusTable {
  count: () => Promise<number>;
  clear: () => Promise<void>;
  orderBy: (key: string) => {
    last: () => Promise<{ status?: string } | undefined>;
  };
}

interface NexusDbWindowShape {
  agent_runs: NexusTable;
  tasks: NexusTable;
  transactions: NexusTable;
  cards: NexusTable;
  financeRecurrences: NexusTable;
  installments: NexusTable;
}

export async function getAgentRunsSnapshot(page: Page): Promise<DexieAgentRunSnapshot> {
  return page.evaluate(async () => {
    const win = window as unknown as { __nexusDB?: NexusDbWindowShape };
    const db = win.__nexusDB;
    if (!db) {
      return { available: false, count: 0, lastStatus: null };
    }
    const count = await db.agent_runs.count();
    const last = await db.agent_runs.orderBy('timestamp').last();
    return {
      available: true,
      count,
      lastStatus: (last?.status as AgentRunStatusOnPage | undefined) ?? null,
    };
  });
}

export async function clearAgentRuns(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const win = window as unknown as { __nexusDB?: NexusDbWindowShape };
    if (win.__nexusDB) {
      await win.__nexusDB.agent_runs.clear();
    }
  });
}

/**
 * Story 1.12 (F2) — snapshot dos contadores de tabelas de DOMÍNIO. Prova que a
 * execução client-side real (ADR-9) escreveu mesmo em Dexie após uma run — o
 * coração da re-rota do AC1. As asserções da suite comparam estes contadores
 * com o baseline semeado (`seedRegressionDb`) para confirmar escrita adicional.
 */
export interface DexieDomainSnapshot {
  available: boolean;
  tasks: number;
  transactions: number;
  cards: number;
  financeRecurrences: number;
  installments: number;
}

export async function getDomainSnapshot(page: Page): Promise<DexieDomainSnapshot> {
  return page.evaluate(async () => {
    const win = window as unknown as { __nexusDB?: NexusDbWindowShape };
    const db = win.__nexusDB;
    if (!db) {
      return {
        available: false,
        tasks: 0,
        transactions: 0,
        cards: 0,
        financeRecurrences: 0,
        installments: 0,
      };
    }
    const [tasks, transactions, cards, financeRecurrences, installments] =
      await Promise.all([
        db.tasks.count(),
        db.transactions.count(),
        db.cards.count(),
        db.financeRecurrences.count(),
        db.installments.count(),
      ]);
    return {
      available: true,
      tasks,
      transactions,
      cards,
      financeRecurrences,
      installments,
    };
  });
}
