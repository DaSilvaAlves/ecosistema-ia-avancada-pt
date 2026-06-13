import { test, expect } from '@playwright/test';

/**
 * Nexus v2 — Auth E2E tests (Story 0.6)
 *
 * Verifica:
 *  - Aceder `/` sem cookie → redirect `/login`
 *  - Página de login renderiza com glass card e logo NEXUS
 *  - Submeter password errada → mensagem Magenta visível
 *
 * Testes de password correcta dependem de ambiente com NEXUS_PASSWORD_HASH
 * configurado — corre em CI com env de test.
 */

test('redirige para /login quando sem cookie de sessão', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('página de login mostra logo NEXUS e input password', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('NEXUS')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

// P1.2 (reactivado): selector inequívoco via data-testid="login-error" no
// componente. `getByRole('alert')` resolvia a 2 elementos (Next.js route
// announcer + o nosso <p role="alert">) e falhava em strict mode.
// Mensagem aceita ambos os cenários: 401 "incorrecta" (com NEXUS_PASSWORD_HASH)
// ou 500 "não configurado" (CI/local sem hash) — o erro inline aparece nos dois.
test('password errada mostra erro inline', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="password"]', 'definitivamente-errada-xyz-123');
  await page.click('button:has-text("Entrar")');
  await expect(page.getByTestId('login-error')).toContainText(
    /incorrecta|configurado/i,
  );
});

// P1.2 (reactivado, contrato corrigido): a barreira de segurança efectiva para
// um request SEM cookie ao proxy é o MIDDLEWARE de auth, não o route handler.
// O middleware intercepta `/api/anthropic/proxy` (não está nas exceptions) e
// devolve redirect 307 → /login antes de o handler correr. O 401 do próprio
// handler (`getSession`) só ocorre com cookie presente mas sessão inválida no
// Vercel KV — inacessível em local/CI sem KV (aí `getSession` aceita qualquer
// cookie não-vazio), motivo pelo qual o teste original assumia 401 e era skipped.
// Testamos a camada determinística: não-autenticado não chega ao proxy.
test('proxy Anthropic bloqueia request sem cookie (redirect /login)', async ({
  request,
}) => {
  const resp = await request.post('/api/anthropic/proxy', {
    data: {
      messages: [{ role: 'user', content: 'olá' }],
      model: 'claude-haiku-4-5-20251001',
    },
    maxRedirects: 0,
  });
  expect(resp.status()).toBe(307);
  expect(resp.headers()['location']).toContain('/login');
});
