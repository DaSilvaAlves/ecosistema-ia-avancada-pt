/**
 * Story 1.10 — Helper de autenticação Playwright.
 *
 * F-CONCERNS-2 (resolvido 09/05/2026 por Quinn @qa):
 * Decisão — usar `loginViaApi` como default no spec; `loginViaUi` mantido como
 * helper alternativo. Razão:
 *
 * 1. `/api/auth/login` (`route.ts`) só depende de `bcrypt.compare(password, hash)`
 *    + `createSession()` (que tem fallback graceful sem KV — `lib/auth/session.ts:58-61`)
 * 2. `getSession()` em dev mode (sem `KV_REST_API_URL`) aceita qualquer cookie não-vazio
 *    (`lib/auth/session.ts:80-83`) — logo cookie criado em CI é válido em requests subsequentes
 * 3. Bloqueador real descoberto: `NEXUS_PASSWORD_HASH` no workflow CI era placeholder de
 *    zeros (`$2a$10$xxxx...`) — bcrypt.compare retornava false. Corrigido em
 *    `.github/workflows/e2e-regression.yml` com hash válido para `nexus-test-password`
 * 4. `loginViaUi` é mais lento (DOM render + navegação + redirect) e tem o mesmo dep
 *    no bcrypt — não resolve nada que `loginViaApi` não resolva
 *
 * O TODO de `auth.spec.ts:36-44` skipped refere-se ao `proxy Anthropic` — não ao login.
 *
 * Pré-requisitos:
 *  - Dev server arrancado (Playwright `webServer` faz isto automaticamente)
 *  - `NEXUS_PASSWORD_HASH` válido no env do server (workflow CI usa hash de
 *    `nexus-test-password`)
 *  - `TEST_PASSWORD` definido no env do test runner (sincronizado com hash)
 */

import type { APIRequestContext, Page } from '@playwright/test';

const DEFAULT_TEST_PASSWORD = 'nexus-test-password';

export async function loginViaApi(request: APIRequestContext): Promise<void> {
  const password = process.env.TEST_PASSWORD ?? DEFAULT_TEST_PASSWORD;
  const response = await request.post('/api/auth/login', {
    data: { password },
  });
  if (!response.ok()) {
    throw new Error(
      `[auth] Login failed (${response.status()}): ${await response.text()}. ` +
        `Confirma TEST_PASSWORD e NEXUS_PASSWORD_HASH no env.`
    );
  }
}

export async function loginViaUi(page: Page): Promise<void> {
  const password = process.env.TEST_PASSWORD ?? DEFAULT_TEST_PASSWORD;
  await page.goto('/login');
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Entrar")');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
}
