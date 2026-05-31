/**
 * Story 1.12 (ADR-9, Architect Gate §4.4 Decisão 1) — Seed determinístico do
 * Dexie para a suite E2E de regressão.
 *
 * `seedRegressionDb(page)` escreve, via `window.__nexusDB` (exposto pelo
 * `DevDbExposer` em dev/staging), o mínimo de entidades de domínio que torna as
 * tools reais do Epic 2/3 executáveis no fluxo client-side re-rotado:
 *   - categorias  → `criar_financa_variavel`/`recorrente`/`parcelada`, `consultar_categoria`
 *   - 1 conta     → `criar_cartao` (contaId), `consultar_balanco`
 *   - 1 cartão    → `criar_parcelada`, finance com `cartaoNome`
 *   - 1 projecto  → `vincular_tarefa_projecto`, `criar_tarefa` com projecto
 *   - 1 tarefa    → `completar_tarefa`, `vincular_tarefa_projecto`
 *
 * `clearRegressionDb(page)` limpa as tabelas de domínio + chat-log entre testes
 * (`mode: 'serial'` acumularia estado senão — Architect Gate §4.4 regra 3).
 *
 * Regras vinculativas (Architect Gate §4.4 Decisão 1):
 *  - ids/nomes vêm de `seed-constants.ts` (DRY — uma fonte de verdade, partilhada
 *    com os profile builders de `mock-events.ts`);
 *  - idempotente (`bulkPut`);
 *  - o seed é setup, NÃO conta como tool executada — os asserts medem escrita
 *    de domínio ADICIONAL ao seed.
 *
 * Edge-safety (ADR-1): corre client-side via `page.evaluate` (browser), nunca em
 * código `runtime='edge'`.
 */

import type { Page } from '@playwright/test';

import {
  SEED_ACCOUNT_BALANCE_CENTIMOS,
  SEED_ACCOUNT_ID,
  SEED_CARD_ID,
  SEED_CARD_NAME,
  SEED_CATEGORY_NAMES,
  SEED_PROJECT_ID,
  SEED_TASK_ID,
} from './seed-constants';

/** Shape mínimo de uma tabela Dexie usado no seed (evita `any` — NFR15). */
interface SeedTable {
  bulkPut: (items: readonly unknown[]) => Promise<unknown>;
  clear: () => Promise<void>;
}

interface SeedDbShape {
  agent_runs: SeedTable;
  chat_messages: SeedTable;
  categories: SeedTable;
  accounts: SeedTable;
  cards: SeedTable;
  projects: SeedTable;
  tasks: SeedTable;
  transactions: SeedTable;
  financeRecurrences: SeedTable;
  installments: SeedTable;
}

/** Payload serializável passado a `page.evaluate` (construído em Node). */
interface SeedPayload {
  categories: ReadonlyArray<{ name: string; color: string; icon: string; isDefault: boolean }>;
  accounts: ReadonlyArray<{
    id: string;
    name: string;
    type: 'checking';
    balance: number;
    createdAt: number;
  }>;
  cards: ReadonlyArray<{
    id: string;
    name: string;
    accountId: string;
    closingDay: number;
    dueDay: number;
    limit: number | null;
  }>;
  projects: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    status: 'active';
    startDate: string;
    deadline: string | null;
    createdAt: number;
  }>;
  tasks: ReadonlyArray<{
    id: string;
    title: string;
    description: string;
    priority: 'medium';
    status: 'todo';
    dueDate: string | null;
    projectId: string | null;
    tags: string[];
    context: string | null;
    lastWorkedAt: number | null;
    recurrenceId: string | null;
    parentTaskId: string | null;
    createdAt: number;
    updatedAt: number;
  }>;
}

function buildSeedPayload(now: number): SeedPayload {
  return {
    categories: SEED_CATEGORY_NAMES.map((name) => ({
      name,
      color: '#8892A4',
      icon: 'tag',
      isDefault: false,
    })),
    accounts: [
      {
        id: SEED_ACCOUNT_ID,
        name: 'Conta Teste',
        type: 'checking',
        balance: SEED_ACCOUNT_BALANCE_CENTIMOS,
        createdAt: now,
      },
    ],
    cards: [
      {
        id: SEED_CARD_ID,
        name: SEED_CARD_NAME,
        accountId: SEED_ACCOUNT_ID,
        closingDay: 1,
        dueDay: 10,
        limit: null,
      },
    ],
    projects: [
      {
        id: SEED_PROJECT_ID,
        name: 'Projecto Teste',
        description: '',
        status: 'active',
        startDate: '2026-01-01',
        deadline: null,
        createdAt: now,
      },
    ],
    tasks: [
      {
        id: SEED_TASK_ID,
        title: 'Tarefa semeada',
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
      },
    ],
  };
}

/**
 * Aguarda que o `DevDbExposer` (client component, `useEffect`) exponha o
 * singleton Dexie em `window.__nexusDB`. O `page.goto('/')` resolve no evento
 * `load`, mas a hidratação React + o `useEffect` correm depois — sem este wait,
 * `seedRegressionDb` corre antes de `window.__nexusDB` existir. Deve ser chamado
 * após navegar para uma rota `(app)` autenticada.
 */
export async function waitForNexusDb(page: Page, timeoutMs = 15_000): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as { __nexusDB?: unknown }).__nexusDB !== undefined,
    undefined,
    { timeout: timeoutMs }
  );
}

export async function seedRegressionDb(page: Page): Promise<void> {
  await waitForNexusDb(page);
  const payload = buildSeedPayload(Date.now());
  await page.evaluate(async (seed: SeedPayload) => {
    const win = window as unknown as { __nexusDB?: SeedDbShape };
    const db = win.__nexusDB;
    if (!db) {
      throw new Error(
        '[seed] window.__nexusDB não exposto — DevDbExposer não montou (NODE_ENV de produção?)'
      );
    }
    await db.categories.bulkPut(seed.categories);
    await db.accounts.bulkPut(seed.accounts);
    await db.cards.bulkPut(seed.cards);
    await db.projects.bulkPut(seed.projects);
    await db.tasks.bulkPut(seed.tasks);
  }, payload);
}

/**
 * Limpa as tabelas de domínio + chat-log semeadas/escritas durante um teste.
 * Substitui `clearAgentRuns` no fluxo da Story 1.12 (mantém-se compatível —
 * limpa também `agent_runs`). Idempotente.
 */
export async function clearRegressionDb(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const win = window as unknown as { __nexusDB?: SeedDbShape };
    const db = win.__nexusDB;
    if (!db) return;
    await Promise.all([
      db.agent_runs.clear(),
      db.chat_messages.clear(),
      db.tasks.clear(),
      db.projects.clear(),
      db.transactions.clear(),
      db.cards.clear(),
      db.accounts.clear(),
      db.categories.clear(),
      db.financeRecurrences.clear(),
      db.installments.clear(),
    ]);
  });
}
