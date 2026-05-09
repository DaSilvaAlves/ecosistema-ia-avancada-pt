/**
 * Story 1.10 — Helper para validação Dexie via `page.evaluate()`.
 *
 * GAP-2 (documentado no draft 1.10): O singleton Dexie em `lib/db/client.ts`
 * pode não estar exposto em `window.__nexusDB` em produção. Esta suite assume
 * que o dev/staging build expõe o singleton (via dev-only assignment em
 * `app/layout.tsx` quando `process.env.NODE_ENV !== 'production'`).
 *
 * Caso o singleton não esteja exposto, o helper retorna `null` em vez de
 * lançar — caller decide se isso é blocker ou pass-through.
 */

import type { Page } from '@playwright/test';

export type AgentRunStatusOnPage =
  | 'started'
  | 'streaming'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'aborted'
  | 'reverted';

export interface DexieAgentRunSnapshot {
  available: boolean;
  count: number;
  lastStatus: AgentRunStatusOnPage | null;
}

export async function getAgentRunsSnapshot(page: Page): Promise<DexieAgentRunSnapshot> {
  return page.evaluate(async () => {
    const win = window as unknown as {
      __nexusDB?: {
        agentRuns: {
          count: () => Promise<number>;
          orderBy: (k: string) => {
            last: () => Promise<{ status?: string } | undefined>;
          };
        };
      };
    };
    const db = win.__nexusDB;
    if (!db) {
      return { available: false, count: 0, lastStatus: null };
    }
    const count = await db.agentRuns.count();
    const last = await db.agentRuns.orderBy('startedAt').last();
    return {
      available: true,
      count,
      lastStatus: (last?.status as AgentRunStatusOnPage | undefined) ?? null,
    };
  });
}

export async function clearAgentRuns(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const win = window as unknown as {
      __nexusDB?: {
        agentRuns: { clear: () => Promise<void> };
      };
    };
    if (win.__nexusDB) {
      await win.__nexusDB.agentRuns.clear();
    }
  });
}
