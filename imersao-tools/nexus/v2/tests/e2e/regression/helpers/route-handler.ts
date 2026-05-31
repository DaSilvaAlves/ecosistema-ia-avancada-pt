/**
 * Story 1.12 (ADR-9, Architect Gate §4.4) — Playwright route handler que intercepta
 * `/api/anthropic/proxy` (re-rota da Story 1.10, que interceptava `/api/agent/prompt`).
 *
 * No fluxo client-side (ADR-9) o `useAgentStream` corre `runAgent` no browser, que
 * fala com `/api/anthropic/proxy` (pass-through do wire SSE Anthropic) e EXECUTA as
 * tools reais contra o Dexie semeado. Logo este handler:
 *   - intercepta o proxy (não o endpoint Edge `/api/agent/prompt`, já morto no client);
 *   - discrimina **classifier** (non-stream → JSON) de **executor** (stream → SSE)
 *     pelo `body.stream`, tal como o proxy real perante a Anthropic;
 *   - emite o **wire SSE real da Anthropic** (`mock-protocol-fidelity.md`), deixando
 *     o `runAgent` gerar os `ExecutorSSEEvent` + executar as tools de verdade.
 *
 * Estado por teste (closure, `mode: 'serial'`): cada run faz 1 chamada classifier +
 * N chamadas executor (1 por iteração do tool loop). `executorCallByPrompt` conta
 * as chamadas executor por prompt para servir o turno certo do profile.
 *
 * `/api/agent/confirm` NÃO é mais mockado: no client-side o gate de preview
 * auto-confirma dentro do `runAgent` (sem `confirmationProvider` injectado) — não
 * há POST HTTP a `/api/agent/confirm`.
 */

import type { Page, Route, Request } from '@playwright/test';

import type { RegressionPrompt } from './types';
import {
  buildAbortProfile,
  buildClassifierResponseBody,
  buildEmptyEndTurnSseBody,
  buildExecutorSseBody,
  getProfileDef,
  type MockProfileDef,
} from './mock-events';

export interface InstallMockRouteOptions {
  fixturePrompts: RegressionPrompt[];
}

interface AnthropicProxyBody {
  stream?: boolean;
  messages?: Array<{ role?: string; content?: unknown }>;
}

/**
 * Extrai o prompt do utilizador do body do proxy. Tanto o classifier
 * (`messages: [{role:'user', content: <prompt>}]`) como o executor (primeira
 * mensagem `{role:'user', content: <prompt>}`, seguida de assistant/tool_result)
 * têm o prompt como a 1ª mensagem `user` com `content` string.
 */
function extractPrompt(body: AnthropicProxyBody): string | null {
  for (const m of body.messages ?? []) {
    if (m.role === 'user' && typeof m.content === 'string') {
      return m.content;
    }
  }
  return null;
}

/**
 * Resolve o `MockProfileDef` de uma fixture. `abort-during-stream` é
 * parametrizado pelo `expectedToolCount` + domínio (DEV-DECISION D-ABORT) — os
 * restantes vêm de `getProfileDef` (que lança para profiles diferidos).
 */
function resolveProfileDef(fixture: RegressionPrompt): MockProfileDef {
  if (fixture.mockProfile === 'abort-during-stream') {
    const domain = fixture.expectedIntents.includes('finance') ? 'finance' : 'tasks';
    return buildAbortProfile(fixture.expectedToolCount, domain);
  }
  return getProfileDef(fixture.mockProfile);
}

export async function installMockRoute(
  page: Page,
  options: InstallMockRouteOptions
): Promise<void> {
  const { fixturePrompts } = options;

  const promptByText = new Map<string, RegressionPrompt>();
  for (const p of fixturePrompts) {
    promptByText.set(p.prompt, p);
  }

  // Contador de chamadas executor por prompt — serve o turno certo do profile.
  const executorCallByPrompt = new Map<string, number>();

  await page.route('**/api/anthropic/proxy', async (route: Route, request: Request) => {
    let body: AnthropicProxyBody;
    try {
      body = JSON.parse(request.postData() ?? '{}') as AnthropicProxyBody;
    } catch {
      await route.fulfill({ status: 400, contentType: 'text/plain', body: 'invalid JSON' });
      return;
    }

    const prompt = extractPrompt(body);
    const fixture = prompt !== null ? promptByText.get(prompt) : undefined;
    if (!fixture) {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: `[mock-proxy] Nenhuma fixture corresponde ao prompt: ${(prompt ?? '').slice(0, 80)}`,
      });
      return;
    }

    const profile = resolveProfileDef(fixture);

    // Executor (stream:true) → wire SSE real, um turno por chamada.
    if (body.stream === true) {
      const i = executorCallByPrompt.get(fixture.prompt) ?? 0;
      executorCallByPrompt.set(fixture.prompt, i + 1);
      const turn = profile.executorTurns[i];
      const sse = turn ? buildExecutorSseBody(turn) : buildEmptyEndTurnSseBody();
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
        body: sse,
      });
      return;
    }

    // Classifier (non-stream) → resposta JSON da Anthropic Messages API.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildClassifierResponseBody(profile),
    });
  });
}

export async function uninstallMockRoute(page: Page): Promise<void> {
  await page.unroute('**/api/anthropic/proxy');
}
