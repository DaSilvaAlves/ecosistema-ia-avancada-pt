/**
 * Story 1.10 — Helper de autenticação Playwright.
 *
 * F-CONCERNS-2 (resolvido 09/05/2026 por Quinn @qa) + Iter 2 (10/05/2026 por Dex @dev):
 *
 * Decisão original — usar `loginViaApi` como default. Razão histórica:
 * 1. `/api/auth/login` (`route.ts`) só depende de `bcrypt.compare(password, hash)`
 *    + `createSession()` (fallback graceful sem KV — `lib/auth/session.ts:58-61`)
 * 2. `getSession()` em dev mode (sem `KV_REST_API_URL`) aceita qualquer cookie não-vazio
 *    (`lib/auth/session.ts:80-83`) — cookie criado em CI é válido em requests subsequentes
 * 3. `loginViaUi` é mais lento (DOM render + navegação + redirect) e tem o mesmo dep
 *    no bcrypt — não resolve nada que `loginViaApi` não resolva
 *
 * **Iter 2 — fix CI vermelho de PR #14 (10/05/2026):**
 * O sintoma reportado pelo CI run 25601188406 não foi 401 (login funcionou — server
 * imprimiu `[auth] KV não configurado — sessão em memória apenas`, prova que
 * `createSession()` correu). O sintoma real foi `locator.fill: timeout 30000ms` ao
 * tentar interagir com `chat-composer-input` — porque a `page` redirecciona para
 * `/login` (middleware.ts:30) por **não ter o cookie `nexus_session`**.
 *
 * Causa: O `loginViaApi(request)` original usava `APIRequestContext` (fixture
 * `request` do `beforeAll`), cujo storage state é independente do `BrowserContext`
 * de cada `page`. Consequência: o `Set-Cookie` da response 200 do login fica no
 * contexto do `request`, mas a `page` criada para cada teste **não vê** o cookie.
 *
 * **Fix aplicado:** assinatura passa a aceitar `page: Page`. Internamente usa
 * `page.request.post(...)` — esse `request` partilha storage state com o
 * `BrowserContext` da `page` (Playwright docs: "page.request shares cookie storage
 * with the browser context of the Page"). O cookie `nexus_session` Set-Cookie da
 * response fica acessível imediatamente na `page` que vem a seguir, e o middleware
 * deixa passar para `(app)/page.tsx` em vez de redirect para `/login`.
 *
 * Spec actualizado em `regression.spec.ts`: `loginViaApi(request)` em `beforeAll`
 * → `loginViaApi(page)` em `beforeEach`. Custo extra: ~50ms por teste (login HTTP
 * é fast vs UI), aceitável face a determinismo recuperado.
 *
 * Pré-requisitos:
 *  - Dev server arrancado (Playwright `webServer` faz isto automaticamente)
 *  - `NEXUS_PASSWORD_HASH` válido no env do server (workflow CI usa hash de
 *    `nexus-test-password`)
 *  - `TEST_PASSWORD` definido no env do test runner (sincronizado com hash)
 */

import type { Page } from '@playwright/test';

const DEFAULT_TEST_PASSWORD = 'nexus-test-password';

/**
 * Faz login via `POST /api/auth/login` usando `page.request` para que o cookie
 * `nexus_session` da response Set-Cookie seja partilhado com o `BrowserContext`
 * da `page` (caso contrário a navegação subsequente para `/` é redireccionada
 * pelo middleware para `/login`).
 *
 * Chamar em `beforeEach` (não em `beforeAll`) — cada `page` tem o seu próprio
 * `BrowserContext` por default no Playwright e não há partilha de storage entre
 * eles.
 */
export async function loginViaApi(page: Page): Promise<void> {
  const password = process.env.TEST_PASSWORD ?? DEFAULT_TEST_PASSWORD;
  const response = await page.request.post('/api/auth/login', {
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
