/**
 * Story 1.10 — E2E Regression Suite (50 prompts PT-PT).
 *
 * Quality gate final do Epic 1. Bloqueante para Epic 2.
 *
 * Pipeline exercitado: ChatComposer → POST /api/agent/prompt → SSE stream
 * → ToolCards + ChatPanel → Dexie persistence → UndoToast (categoria undo-flow).
 *
 * Modo CI (default): MSW determinístico via `installMockRoute()` — intercepta
 * `POST /api/agent/prompt` e devolve sequência SSE de `mockProfile` do fixture.
 * Modo Staging: `USE_REAL_API=true` desactiva o mock — request vai ao server
 * Anthropic real (apenas prompts com tag `@real-api`).
 *
 * Decisões @po (PO-VALIDATION-STORY-1.10.md, 09/05/2026):
 *  - D1: Opção C híbrida → MSW em CI + 5 `@real-api` em staging
 *  - D2: pass rate `>= 43/50` (PRD §10 linha 431) com zero falhas em canónicos
 *  - D3: workflow CI dedicado bloqueante
 *  - D4: p95 < 2s CI; < 6s staging
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect } from '@playwright/test';

import type { RegressionFixture, PromptResult } from './helpers/types';
import { installMockRoute, uninstallMockRoute } from './helpers/route-handler';
import { loginViaApi } from './helpers/auth';
import { submitPromptAndWait } from './helpers/stream-wait';
import { getAgentRunsSnapshot, clearAgentRuns } from './helpers/dexie-eval';
import {
  generateReport,
  PASS_RATE_THRESHOLD,
  CANONICAL_TAGS,
} from './helpers/report-generator';

const FIXTURE_PATH = join(process.cwd(), 'tests/fixtures/prompts-pt-pt.json');
const REPORT_PATH = join(process.cwd(), 'tests/e2e/regression/report/report.json');

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as RegressionFixture;
const useRealApi = process.env.USE_REAL_API === 'true';

const promptsToRun = useRealApi
  ? fixture.prompts.filter((p) => p.tags.includes('@real-api'))
  : fixture.prompts;

const canonicalIds = new Set(
  fixture.prompts.filter((p) => p.tags.some((t) => CANONICAL_TAGS.includes(t))).map((p) => p.id)
);

const results: PromptResult[] = [];

test.describe.configure({ mode: 'serial' });

test.describe('E2E Regression — 50 prompts PT-PT', () => {
  test.beforeEach(async ({ page }) => {
    // Login DEVE acontecer antes de qualquer page.goto e antes de instalar mocks
    // de rota — `page.request` partilha cookies com o BrowserContext da page,
    // garantindo que o cookie `nexus_session` chega à navegação subsequente
    // (caso contrário middleware.ts redirecciona `/` → `/login`).
    // Iter 2 fix CI PR #14 (10/05/2026): `loginViaApi(request)` em `beforeAll`
    // não funciona porque `APIRequestContext` é independente do `BrowserContext`.
    await loginViaApi(page);

    if (!useRealApi) {
      await installMockRoute(page, { fixturePrompts: fixture.prompts });
    }
    await page.goto('/');
    await clearAgentRuns(page);
  });

  test.afterEach(async ({ page }) => {
    if (!useRealApi) {
      await uninstallMockRoute(page);
    }
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
          const previewCard = page.locator('[data-testid="tool-card"][data-state="preview-required"]');
          const previewCount = await previewCard.count();
          if (previewCount === 0) {
            status = 'FAIL';
            reason = 'Expected preview-required state, but no ToolCard in that state';
          } else {
            const confirmButton = previewCard.first().locator('[data-testid="preview-confirm"]');
            if ((await confirmButton.count()) > 0) {
              await confirmButton.click();
              await page
                .locator('[data-testid="tool-card"][data-state="success"]')
                .first()
                .waitFor({ timeout: 4_000 })
                .catch(() => {
                  status = 'FAIL';
                  reason = 'Preview confirmed but card did not transition to success';
                });
            }
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
              const snapshot = await getAgentRunsSnapshot(page);
              if (snapshot.available && snapshot.lastStatus !== 'reverted') {
                status = 'FAIL';
                reason = `After Undo click, lastStatus is ${snapshot.lastStatus} (expected 'reverted')`;
              }
            }
          }
        }

        const dexieSnapshot = await getAgentRunsSnapshot(page);
        observedRunStatus = dexieSnapshot.lastStatus;
        if (dexieSnapshot.available && dexieSnapshot.count === 0 && promptDef.expectedToolCount > 0) {
          status = 'FAIL';
          reason = reason ?? 'Dexie agentRuns count is 0 (expected >= 1 after run)';
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
