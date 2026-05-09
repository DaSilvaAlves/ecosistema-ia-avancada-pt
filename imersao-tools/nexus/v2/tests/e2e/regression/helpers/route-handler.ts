/**
 * Story 1.10 — Playwright route handler para mockar `/api/agent/prompt`.
 *
 * Intercepta o endpoint interno do Nexus (não `api.anthropic.com`) e devolve
 * um stream SSE determinístico baseado no `mockProfile` do prompt fixture.
 *
 * Activado por `installMockRoute(page, fixturePrompts)` antes de cada test.
 * Em modo `USE_REAL_API=true` (staging, subset `@real-api`), NÃO é instalado
 * — Playwright deixa o request ir directo ao server real.
 *
 * O matcher é por `prompt` exacto (campo do JSON body). Se o request não
 * mapear nenhum prompt do fixture, o handler responde 404 para falhar
 * explicitamente (evita silenciosos pass-throughs em testes mal alinhados).
 */

import type { Page } from '@playwright/test';

import type { RegressionPrompt } from './types';
import { buildMockSseEvents, serializeSseEvents } from './mock-events';

interface PromptRequestBody {
  prompt: string;
}

export interface InstallMockRouteOptions {
  fixturePrompts: RegressionPrompt[];
  /**
   * Quando true, o handler simula abort: emite `meta` + `tool_start` e fecha
   * o stream sem `done`. Usado para a categoria `abort-mid-stream`.
   *
   * Detectado automaticamente por categoria do prompt — não precisa ser
   * passado por turn. Mantido aqui para override de teste.
   */
  forceAbort?: boolean;
}

export async function installMockRoute(page: Page, options: InstallMockRouteOptions): Promise<void> {
  const { fixturePrompts } = options;

  const promptByText = new Map<string, RegressionPrompt>();
  for (const p of fixturePrompts) {
    promptByText.set(p.prompt, p);
  }

  await page.route('**/api/agent/prompt', async (route, request) => {
    let body: PromptRequestBody | null = null;
    try {
      body = JSON.parse(request.postData() ?? '{}') as PromptRequestBody;
    } catch {
      await route.fulfill({ status: 400, body: 'invalid JSON' });
      return;
    }

    const promptText = body?.prompt ?? '';
    const fixture = promptByText.get(promptText);

    if (!fixture) {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: `[mock-route] No fixture matches prompt: ${promptText.slice(0, 80)}`,
      });
      return;
    }

    const runId = `run_${fixture.id}_${Date.now()}`;
    const events = buildMockSseEvents(fixture.mockProfile, runId);
    const ssePayload = serializeSseEvents(events);

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      },
      body: ssePayload,
    });
  });
}

export async function uninstallMockRoute(page: Page): Promise<void> {
  await page.unroute('**/api/agent/prompt');
}
