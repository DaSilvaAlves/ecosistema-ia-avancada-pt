/**
 * Story 1.10 — Helper de espera de stream SSE completo.
 *
 * Submete um prompt no `ChatComposer` (Story 1.9) e aguarda eventos visuais
 * que indiquem que o stream terminou:
 *  - Pelo menos 1 ToolCard renderizado OU mensagem de texto da resposta
 *  - O input está re-habilitado (não disabled — sinal de stream concluído)
 *
 * Devolve a duração total (ms) entre submit e detecção de fim.
 *
 * Para a categoria `abort-mid-stream`, o caller pode invocar `page.goto('/')`
 * ou similar antes do stream terminar para simular interrupção.
 *
 * **Iter 3 (PR #14) — onboarding bypass:**
 * Em CI fresh page, `localStorage` está vazio e o `OnboardingModal` (Story 0.7,
 * `components/chat/OnboardingModal.tsx`) abre automaticamente cobrindo o
 * ChatPanel com overlay `position: fixed; inset: 0; z-index: 60`. O composer
 * fica acessível ao Playwright (que dispara eventos directos no DOM ignorando
 * z-index), mas o overlay obscurece o LiveAgentBubble visualmente — e os
 * tests de preview confirmam (`[data-testid="preview-confirm"]`) podem ser
 * interceptados pelo modal antes de chegarem ao ToolCard correcto.
 *
 * Solução: pre-set da flag `nexus:onboarding:done` em `localStorage` antes
 * de qualquer interacção. Idempotente — não altera comportamento se já estava
 * set. Ver `helpers/auth.ts` para chamada complementar pós-login.
 */

import type { Page } from '@playwright/test';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface SubmitPromptResult {
  durationMs: number;
  toolCardCount: number;
  hasText: boolean;
  inputReEnabled: boolean;
}

/**
 * Iter 3 — bypass do OnboardingModal (Story 0.7) em CI. O modal lê
 * `localStorage.getItem('nexus:onboarding:done')` no mount e abre se ausente.
 * Pre-setamos a flag para garantir que a UI fica em estado idle limpo.
 *
 * Idempotente, safe-to-call-multiple-times. Falha silenciosa se localStorage
 * não estiver disponível (ex: page ainda em about:blank).
 */
export async function dismissOnboardingModal(page: Page): Promise<void> {
  await page
    .evaluate(() => {
      try {
        window.localStorage.setItem('nexus:onboarding:done', 'true');
      } catch {
        // localStorage indisponível (cross-origin, modo incógnito restritivo) — ignora.
      }
    })
    .catch(() => undefined);
}

export async function submitPromptAndWait(
  page: Page,
  prompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SubmitPromptResult> {
  const start = Date.now();

  // Iter 3 — garantir que o OnboardingModal não está aberto antes de tentar
  // interagir com o composer. Tipicamente já foi feito em `beforeEach`, mas
  // a chamada aqui é defensiva e idempotente.
  await dismissOnboardingModal(page);

  const composer = page.locator('[data-testid="chat-composer-input"]').first();
  if (await composer.count() === 0) {
    const fallback = page.locator('textarea, input[type="text"]').last();
    await fallback.fill(prompt);
    await fallback.press('Enter');
  } else {
    await composer.fill(prompt);
    await composer.press('Enter');
  }

  await page
    .waitForFunction(
      () => {
        const cards = document.querySelectorAll('[data-testid="tool-card"]');
        const text = document.querySelector('[data-testid="assistant-message-text"]');
        const input = document.querySelector(
          'textarea[data-testid="chat-composer-input"], input[data-testid="chat-composer-input"]'
        );
        const inputEnabled = !input || !(input as HTMLInputElement).disabled;
        return (cards.length > 0 || (text && text.textContent && text.textContent.length > 0)) && inputEnabled;
      },
      { timeout: timeoutMs }
    )
    .catch(() => {
      /* timeout — caller decide como tratar */
    });

  const toolCardCount = await page.locator('[data-testid="tool-card"]').count();
  const hasText = (await page.locator('[data-testid="assistant-message-text"]').count()) > 0;
  const inputReEnabled = await page
    .locator('[data-testid="chat-composer-input"]')
    .first()
    .isEnabled()
    .catch(() => true);

  return {
    durationMs: Date.now() - start,
    toolCardCount,
    hasText,
    inputReEnabled,
  };
}
