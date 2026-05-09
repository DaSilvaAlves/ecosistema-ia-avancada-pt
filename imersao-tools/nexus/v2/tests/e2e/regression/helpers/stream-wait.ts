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
 */

import type { Page } from '@playwright/test';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface SubmitPromptResult {
  durationMs: number;
  toolCardCount: number;
  hasText: boolean;
  inputReEnabled: boolean;
}

export async function submitPromptAndWait(
  page: Page,
  prompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SubmitPromptResult> {
  const start = Date.now();

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
