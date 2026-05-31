/**
 * Story 1.10 + Story 1.12 — E2E Regression Suite (50 prompts PT-PT).
 *
 * Quality gate do cérebro (Epic 1). Story 1.12 (ADR-9) RE-ROTA a suite ao fluxo
 * client-side real: intercepta `/api/anthropic/proxy` (wire SSE Anthropic), o
 * `runAgent` corre no browser e EXECUTA as tools reais contra o Dexie semeado.
 *
 * Conjunto ACTIVO (30 prompts, tools tasks/finance/projects reais) vs DIFERIDO
 * (20 prompts `pending-tool-epic` — dependem de calendar/reminder/eliminar_tarefa,
 * Epic futuro). Decisão Architect Gate Story 1.12 §4.4. Threshold 26/30 (86,7%).
 *
 * Seeding determinístico (`seedRegressionDb`) no `beforeEach` torna as tools com
 * pré-condições (finance/completar) executáveis; `clearRegressionDb` isola cada
 * teste (`mode: 'serial'`). Verificação por UI (ToolCards `success`) + Dexie de
 * domínio (`window.__nexusDB` via `getDomainSnapshot`/`getAgentRunsSnapshot`).
 *
 * Modo CI (default): mock determinístico via `installMockRoute()`.
 * Modo Staging: `USE_REAL_API=true` desactiva o mock — só os prompts ACTIVOS com
 * tag `@real-api` correm contra a Anthropic real.
 *
 * Decisões @po (PO-VALIDATION-STORY-1.10.md): D1 híbrida; D2 pass rate; D3 CI
 * dedicado; D4 p95.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect } from '@playwright/test';

import type { RegressionFixture, PromptResult } from './helpers/types';
import { installMockRoute, uninstallMockRoute } from './helpers/route-handler';
import { loginViaApi } from './helpers/auth';
import { submitPromptAndWait, dismissOnboardingModal } from './helpers/stream-wait';
import { getAgentRunsSnapshot, getDomainSnapshot } from './helpers/dexie-eval';
import { seedRegressionDb, clearRegressionDb, waitForNexusDb } from './helpers/seed-db';
import {
  generateReport,
  PASS_RATE_THRESHOLD,
  CANONICAL_TAGS,
} from './helpers/report-generator';

const FIXTURE_PATH = join(process.cwd(), 'tests/fixtures/prompts-pt-pt.json');
const REPORT_PATH = join(process.cwd(), 'tests/e2e/regression/report/report.json');

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as RegressionFixture;
const useRealApi = process.env.USE_REAL_API === 'true';

// Story 1.12 — split activo/diferido. Diferidos (`pending-tool-epic`) dependem
// de tools ainda não registadas (Epic futuro) e são `test.fixme`.
const PENDING_TAG = 'pending-tool-epic';
const activePrompts = fixture.prompts.filter((p) => !p.tags.includes(PENDING_TAG));
const deferredPrompts = fixture.prompts.filter((p) => p.tags.includes(PENDING_TAG));

const promptsToRun = useRealApi
  ? activePrompts.filter((p) => p.tags.includes('@real-api'))
  : activePrompts;

// Canónicos só entre os prompts EFECTIVAMENTE corridos (R040 ac1, R029 ac2,
// R034/R035 ac4). CodeRabbit Iter 1: derivar de `promptsToRun` (não
// `activePrompts`) para alinhar com o universo executado — em `useRealApi` o
// subconjunto é menor, e `canonicalResults` (afterAll) é filtrado de `results`,
// que só contém prompts corridos.
const canonicalIds = new Set(
  promptsToRun.filter((p) => p.tags.some((t) => CANONICAL_TAGS.includes(t))).map((p) => p.id)
);

const results: PromptResult[] = [];

// Baseline determinístico pós-seed (seedRegressionDb): 1 tarefa, 0 transações,
// 1 cartão, 0 recorrências, 0 prestações. Usado para asserts de domínio no undo.
const SEED_BASELINE = { tasks: 1, transactions: 0 } as const;

test.describe('E2E Regression — activos (fluxo client-side ADR-9)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Login antes de qualquer goto/mock (cookies partilhados com o BrowserContext).
    await loginViaApi(page);

    if (!useRealApi) {
      await installMockRoute(page, { fixturePrompts: fixture.prompts });
    }

    // Pre-set onboarding flag antes de `/` (Story 1.10 Iter 3).
    await page.goto('/login');
    await dismissOnboardingModal(page);

    await page.goto('/');
    // Story 1.12 — espera que o DevDbExposer exponha `window.__nexusDB` (useEffect
    // pós-hidratação), depois isola e semeia: limpa domínio residual e semeia o
    // baseline determinístico que torna as tools reais executáveis.
    await waitForNexusDb(page);
    await clearRegressionDb(page);
    await seedRegressionDb(page);
  });

  test.afterEach(async ({ page }) => {
    if (!useRealApi) {
      await uninstallMockRoute(page);
    }
    // Limpa o domínio semeado/escrito (mode serial acumularia senão).
    await clearRegressionDb(page);
  });

  for (const promptDef of promptsToRun) {
    test(`${promptDef.id} [${promptDef.category}] ${promptDef.prompt.slice(0, 60)}`, async ({ page }) => {
      const start = Date.now();
      let status: PromptResult['status'] = 'PASS';
      let reason: string | undefined;
      let observedToolCount = 0;
      let observedRunStatus: string | null = null;

      try {
        const submitResult = await submitPromptAndWait(page, promptDef.prompt, 8_000);
        observedToolCount = submitResult.toolCardCount;

        if (promptDef.expectedToolCount > 0 && submitResult.toolCardCount < promptDef.expectedToolCount) {
          status = 'FAIL';
          reason = `Expected >= ${promptDef.expectedToolCount} ToolCards, got ${submitResult.toolCardCount}`;
        }

        if (promptDef.expectedToolCount === 0 && !submitResult.hasText) {
          status = 'FAIL';
          reason = 'Expected text response (no tools), but no assistant text rendered';
        }

        if (promptDef.requiresPreview && status === 'PASS') {
          // Story 1.12 — no fluxo client-side o gate de preview AUTO-CONFIRMA
          // dentro do `runAgent` (sem confirmationProvider) → o ToolCard transita
          // preview-required → loading → success quase instantaneamente. Validamos
          // o estado final `success` (o intermédio é invisível à inspecção).
          const finalCard = page.locator('[data-testid="tool-card"][data-state="success"]').first();
          const successCount = await finalCard.count();
          if (successCount === 0) {
            status = 'FAIL';
            reason = 'Preview profile: expected ToolCard to reach success state';
          }
        }

        if (promptDef.expectUndo && status === 'PASS') {
          const undoToast = page.locator('[data-testid="undo-toast"]');
          await undoToast.waitFor({ timeout: 4_000 }).catch(() => {
            status = 'FAIL';
            reason = 'Expected UndoToast to appear, but it did not';
          });
          if (status === 'PASS' && promptDef.tags.includes('ac4-epic1')) {
            const undoButton = undoToast.locator('button:has-text("Anular")');
            if ((await undoButton.count()) > 0) {
              await undoButton.click();
              await page.waitForTimeout(500);
              // AC2 (Story 1.12) — o undo client-side reverte via ClientUndoStore:
              // (a) agent_run marcado 'reverted'; (b) a mutação Dexie de domínio
              // foi revertida (volta ao baseline semeado). Prova real do ADR-9.
              const snapshot = await getAgentRunsSnapshot(page);
              if (snapshot.available && snapshot.lastStatus !== 'reverted') {
                status = 'FAIL';
                reason = `After Undo click, lastStatus is ${snapshot.lastStatus} (expected 'reverted')`;
              }
              if (status === 'PASS') {
                const domain = await getDomainSnapshot(page);
                if (domain.available) {
                  if (promptDef.mockProfile === 'single-task' && domain.tasks !== SEED_BASELINE.tasks) {
                    status = 'FAIL';
                    reason = `After Undo, tasks=${domain.tasks} (expected baseline ${SEED_BASELINE.tasks} — Dexie reverse falhou)`;
                  }
                  if (
                    promptDef.mockProfile === 'single-finance-variable' &&
                    domain.transactions !== SEED_BASELINE.transactions
                  ) {
                    status = 'FAIL';
                    reason = `After Undo, transactions=${domain.transactions} (expected baseline ${SEED_BASELINE.transactions} — Dexie reverse falhou)`;
                  }
                }
              }
            }
          }
        }

        const dexieSnapshot = await getAgentRunsSnapshot(page);
        observedRunStatus = dexieSnapshot.lastStatus;
        if (dexieSnapshot.available && dexieSnapshot.count === 0 && promptDef.expectedToolCount > 0) {
          status = 'FAIL';
          reason = reason ?? 'Dexie agent_runs count is 0 (expected >= 1 after run)';
        }
      } catch (err) {
        status = 'FAIL';
        reason = err instanceof Error ? err.message : String(err);
      }

      const durationMs = Date.now() - start;

      results.push({
        id: promptDef.id,
        category: promptDef.category,
        prompt: promptDef.prompt,
        status,
        durationMs,
        reason,
        observedToolCount,
        observedRunStatus,
      });

      if (promptDef.tags.some((t) => CANONICAL_TAGS.includes(t))) {
        expect.soft(status, `Canonical prompt ${promptDef.id} must PASS (${reason ?? 'ok'})`).toBe('PASS');
      }
    });
  }

  test.afterAll(async () => {
    const report = generateReport({
      results,
      story: fixture.story,
      epic: fixture.epic,
      outputPath: REPORT_PATH,
      canonicalIds,
      useRealApi,
    });

    expect.soft(report.thresholdMet, `Pass rate ${report.passed}/${report.totalPrompts} below threshold ${PASS_RATE_THRESHOLD}`).toBe(true);
    expect.soft(report.canonicalPromptsAllPassed, 'Canonical prompts (ac1/ac2/ac4-epic1) must all PASS').toBe(true);
    expect.soft(report.p95Met, `P95 ${report.p95DurationMs}ms exceeds budget ${report.p95Threshold}ms`).toBe(true);
  });
});

/**
 * DIFERIDOS (Story 1.12 §4.4 Decisão 2/4) — 20 prompts que dependem de tools
 * `calendar`/`reminder`/`eliminar_tarefa` ainda NÃO registadas no v2 (Epic futuro).
 * Marcados `test.fixme` (visíveis no relatório como diferidos, NÃO apagados —
 * No-Invention). Follow-up: quando as tools existirem, remover o `pending-tool-epic`
 * da fixture e estes voltam a correr; restaurar threshold 43/50.
 */
test.describe('E2E Regression — diferidos (pending-tool-epic, Epic futuro)', () => {
  for (const promptDef of deferredPrompts) {
    test.fixme(`${promptDef.id} [${promptDef.category}] ${promptDef.prompt.slice(0, 60)} — requer tool ${promptDef.expectedIntents.join('/')}`, async () => {
      // Intencionalmente vazio: a tool de domínio (calendar/reminder/eliminar_tarefa)
      // ainda não existe no registry v2. Reactivar em follow-up (remover a tag
      // `pending-tool-epic` da fixture) quando o Epic correspondente registar a tool.
    });
  }
});
