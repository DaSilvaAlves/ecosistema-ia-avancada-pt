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
 *
 * **Iter 3 (PR #14) — fix protocolo SSE alinhado com `executor.ts`:**
 * - Emitir `meta(start)` com `phase: 'start'` + prompt + modelClassifier +
 *   modelExecutor + startedAt + classifierResult: null
 * - Emitir `meta(classified)` separado (executor real emite ambos)
 * - `text_delta` usa campo `delta` (não `text`)
 * - `done` inclui intents + inputTokens + outputTokens + durationMs + totals
 * - Stream termina com `data: [DONE]\n\n` (executor.ts/route.ts L176)
 *
 * Sem estes alinhamentos, `useAgentStream` (Story 1.9) não persistia o run
 * em Dexie e `MessageList.reduceLiveBubble` rejeitava a stream toda
 * (retornava `null`), fazendo `submitPromptAndWait.waitForFunction` ficar
 * 30s à espera de tool-cards/assistant-text que nunca renderizavam.
 *
 * **Preview profiles — gate cross-process simulation simplificado:**
 * Mockamos `/api/agent/confirm` para responder 200, mas a stream principal
 * envia tudo o de uma vez (incluindo `preview_request` + `preview_confirmed`
 * + `tool_complete`) — porque `route.fulfill` é one-shot (não streaming).
 *
 * O spec valida o flow preview detectando o evento `preview_request` no
 * events array exposto pelo `useAgentStream` (via `page.evaluate`), em vez
 * de procurar o ToolCard em `data-state="preview-required"` (que é estado
 * transitório invisível à inspecção pós-stream).
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

    const startedAt = Date.now();
    const runId = `run_${fixture.id}_${startedAt}`;
    // Iter 3 — passamos `prompt` + `startedAt` para o builder porque o
    // protocolo real (`executor.ts` L506-510) inclui esses campos no
    // `meta(start)`. Sem eles, o `useAgentStream` consumer não persiste o
    // run em Dexie correctamente e o `MessageList.reduceLiveBubble` rejeita
    // a stream toda. Ver `mock-events.ts` doc para causa raiz Iter 3.
    const events = buildMockSseEvents({
      profile: fixture.mockProfile,
      runId,
      prompt: promptText,
      startedAt,
    });
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

  // Iter 3 — mock de `/api/agent/confirm`. O ChatPanel envia POST quando
  // utilizador clica preview-confirm. Devolvemos 200 OK silencioso — o
  // executor mock já incluiu `preview_confirmed` + `tool_complete` no
  // payload SSE inicial (one-shot fulfill — `route.fulfill` não suporta
  // streaming bidirecional). O spec valida o gate via inspecção do events
  // array do `useAgentStream` (ver helpers/preview-eval.ts), não via
  // observação visual do ToolCard em `preview-required` (estado transitório).
  await page.route('**/api/agent/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

export async function uninstallMockRoute(page: Page): Promise<void> {
  await page.unroute('**/api/agent/prompt');
  await page.unroute('**/api/agent/confirm');
}
