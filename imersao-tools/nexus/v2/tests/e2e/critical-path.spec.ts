/**
 * Story 9.2 — E2E Playwright Caminho Crítico.
 *
 * Suite leve e dedicada que percorre o caminho crítico completo do produto num
 * único fluxo de página, para correr no gate CI regular (`nexus-v2-ci.yml`), NÃO
 * na suite pesada de 50 prompts (`e2e-regression.yml`):
 *
 *   1. LOGIN            — sessão autenticada via `loginViaApi` (API bypass; o cookie
 *                         `nexus_session` é partilhado com o `BrowserContext` da page —
 *                         F-CONCERNS-2 / Story 1.10 Iter 2).
 *   2. PRIMEIRO PROMPT  — submetido pelo `ChatComposer` real; resulta em `criar_tarefa`
 *                         (profile `single-task`, tool `criar_tarefa` → título
 *                         "tarefa de teste").
 *   3. TAREFA VIA UI    — o `ToolCard` atinge `success` (execução client-side ADR-9) e
 *                         a tarefa é visível na vista Kanban de `/tarefas`
 *                         (`kanban-card-{id}` — id determinístico lido de Dexie).
 *   4. PERSISTÊNCIA     — `page.reload()` + re-navegação; a tarefa continua visível,
 *                         provando persistência real em IndexedDB/Dexie (não apenas
 *                         estado React/Zustand em memória).
 *
 * Reutiliza integralmente o padrão ADR-8 (AC2 — zero mock paralelo): `installMockRoute`
 * / `mock-events.ts` (`single-task`) interceptam `/api/anthropic/proxy` com o wire SSE
 * REAL da Anthropic. Nenhum segundo mock é introduzido.
 *
 * Fidelidade de protocolo (AC3 — `mock-protocol-fidelity.md`): o profile `single-task`
 * fragmenta os args de `criar_tarefa` em ≥2 chunks `input_json_delta` (com `input` vazio
 * no `content_block_start`), tal como a Anthropic real (SDK issue #960). A asserção
 * `createdTask.title === 'tarefa de teste'` FALHARIA se o mock divergisse do wire real
 * (ex: emitir o `input` completo no start) — o `runAgent` client-side, que só reconstrói
 * args a partir dos deltas, produziria args vazios e `criar_tarefa` falharia o Zod
 * `titulo.min(1)`. É a asserção que prova a fidelidade.
 *
 * `USE_REAL_API` (AC4): quando `true`, o mock não é instalado e o fluxo corre contra a
 * Anthropic real (validação manual/staging, nunca CI regular). Aí o título é escolhido
 * pelo LLM real, pelo que a asserção de título exacto (fidelidade do mock) é ignorada —
 * o caminho determinístico `kanban-card-{id}` mantém-se em ambos os modos.
 */

import { test, expect, type Page } from '@playwright/test';

import type { RegressionPrompt } from './regression/helpers/types';
import { loginViaApi } from './regression/helpers/auth';
import { installMockRoute, uninstallMockRoute } from './regression/helpers/route-handler';
import { submitPromptAndWait, dismissOnboardingModal } from './regression/helpers/stream-wait';
import { waitForNexusDb } from './regression/helpers/seed-db';

const useRealApi = process.env.USE_REAL_API === 'true';

// Prompt do caminho crítico. O `installMockRoute` faz match do texto submetido
// contra `fixture.prompt` — o texto em si é arbitrário desde que a fixture o
// registe. O profile `single-task` cria SEMPRE a tarefa com título "tarefa de teste"
// (mock-events.ts `singleTask()`), independentemente do texto do prompt.
const CRITICAL_PATH_PROMPT = 'Cria uma tarefa de teste do caminho crítico';

// Título fixado pelo profile `single-task` (mock-events.ts → `criar_tarefa` titulo).
const EXPECTED_TASK_TITLE = 'tarefa de teste';

// Fixture mínima inline (AC2) — reutiliza o profile `single-task` já existente; não
// cria mock novo. Passada como array de 1 elemento a `installMockRoute`, exactamente
// como `regression.spec.ts` passa `fixture.prompts`.
const criticalPathFixture: RegressionPrompt = {
  id: 'CP001',
  category: 'single-intent-task',
  prompt: CRITICAL_PATH_PROMPT,
  expectedIntents: ['tasks'],
  expectedToolCount: 1,
  requiresPreview: false,
  expectUndo: false,
  tags: [],
  mockProfile: 'single-task',
};

interface CreatedTask {
  id: string;
  title: string;
  status: string;
}

/**
 * Lê a tarefa criada directamente do Dexie via `window.__nexusDB` (exposto pelo
 * `DevDbExposer` em dev/staging). O `BrowserContext` de cada teste Playwright arranca
 * com IndexedDB vazio, logo após o fluxo existe exactamente 1 tarefa — devolvemos a
 * mais recente por `createdAt` de forma defensiva. Não é um mock (é um read de estado),
 * pelo que não viola AC2.
 */
async function readCreatedTask(page: Page): Promise<CreatedTask | null> {
  return page.evaluate(async () => {
    const win = window as unknown as {
      __nexusDB?: {
        tasks: {
          toArray: () => Promise<Array<{ id: string; title: string; status: string; createdAt?: number }>>;
        };
      };
    };
    const db = win.__nexusDB;
    if (!db) return null;
    const all = await db.tasks.toArray();
    if (all.length === 0) return null;
    const sorted = [...all].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const t = sorted[sorted.length - 1];
    return { id: t.id, title: t.title, status: t.status };
  });
}

/** Activa a vista Kanban em `/tarefas` (a page abre por defeito em `lista`). */
async function openKanbanView(page: Page): Promise<void> {
  await page.getByRole('tab', { name: /kanban/i }).click();
}

test.describe('E2E Caminho Crítico — login → prompt → tarefa via UI → persistência (Story 9.2)', () => {
  test('cria tarefa pelo chat, vê-a em /tarefas e confirma persistência após reload', async ({
    page,
  }) => {
    // ── 1. LOGIN ──────────────────────────────────────────────────────────────
    // `loginViaApi(page)` antes de qualquer goto/mock — o cookie de sessão é
    // partilhado com o `BrowserContext` (senão o middleware redirecciona a `/login`).
    await loginViaApi(page);

    // ── Mock ADR-8 (AC2/AC4) ──────────────────────────────────────────────────
    if (!useRealApi) {
      await installMockRoute(page, { fixturePrompts: [criticalPathFixture] });
    }

    // Pre-set da flag de onboarding antes de `/` (Story 1.10 Iter 3) — persiste em
    // localStorage por todo o fluxo (mesma origin), incl. após reload.
    await page.goto('/login');
    await dismissOnboardingModal(page);

    // ── 2. PRIMEIRO PROMPT (ChatComposer real) ────────────────────────────────
    await page.goto('/');
    await waitForNexusDb(page);
    const submitResult = await submitPromptAndWait(page, CRITICAL_PATH_PROMPT, 10_000);
    expect(submitResult.toolCardCount, 'esperado ≥1 ToolCard após o prompt').toBeGreaterThanOrEqual(1);

    // ── 3. CRIAR TAREFA VIA UI ─────────────────────────────────────────────────
    // ToolCard `success` = `criar_tarefa` executou client-side (ADR-9) contra Dexie.
    const successCard = page.locator('[data-testid="tool-card"][data-state="success"]').first();
    await expect(successCard, 'ToolCard deve atingir estado success').toBeVisible({ timeout: 8_000 });

    // Id determinístico da tarefa criada (lido de Dexie) — asserção principal.
    const createdTask = await readCreatedTask(page);
    expect(createdTask, 'a tarefa criada deve existir em Dexie').not.toBeNull();
    const taskId = createdTask!.id;
    expect(taskId, 'a tarefa criada deve ter id').toBeTruthy();

    // AC3 — fidelidade de protocolo (`mock-protocol-fidelity.md`): só válida em modo
    // mock (em `USE_REAL_API` o título é decidido pelo LLM real). Prova que os args
    // fragmentados em `input_json_delta` foram reconstruídos correctamente pelo
    // runAgent client-side — divergência do wire real produziria args vazios e
    // `criar_tarefa` falharia o Zod `titulo.min(1)`.
    if (!useRealApi) {
      expect(
        createdTask!.title,
        'título deve bater com o valor fragmentado no wire SSE (fidelidade AC3)'
      ).toBe(EXPECTED_TASK_TITLE);
    } else {
      expect(createdTask!.title.length, 'LLM real deve criar tarefa com título não vazio').toBeGreaterThan(0);
    }

    const expectedTitle = useRealApi ? createdTask!.title : EXPECTED_TASK_TITLE;

    // Navegar para /tarefas e activar Kanban — confirmar o card determinístico.
    await page.goto('/tarefas');
    await openKanbanView(page);
    const cardBeforeReload = page.locator(`[data-testid="kanban-card-${taskId}"]`);
    await expect(cardBeforeReload, 'card da tarefa visível na vista Kanban').toBeVisible({
      timeout: 8_000,
    });
    await expect(cardBeforeReload).toContainText(expectedTitle);

    // ── 4. VERIFICAR PERSISTÊNCIA (reload → prova IndexedDB/Dexie) ──────────────
    await page.reload();
    // Após reload o estado React reinicia (a page volta à tab `lista`); reactivar
    // Kanban. Se a tarefa só vivesse em memória React/Zustand, teria desaparecido.
    await openKanbanView(page);
    const cardAfterReload = page.locator(`[data-testid="kanban-card-${taskId}"]`);
    await expect(cardAfterReload, 'card ainda visível após reload — persistência Dexie').toBeVisible({
      timeout: 8_000,
    });
    await expect(cardAfterReload).toContainText(expectedTitle);

    if (!useRealApi) {
      await uninstallMockRoute(page);
    }
  });
});
