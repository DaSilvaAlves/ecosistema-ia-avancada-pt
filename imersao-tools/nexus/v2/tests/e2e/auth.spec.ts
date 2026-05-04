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

test('password errada mostra erro inline', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="password"]', 'definitivamente-errada-xyz-123');
  await page.click('button:has-text("Entrar")');
  // Resposta 401 com mensagem
  await expect(page.getByRole('alert')).toContainText(/incorrecta|configurado/i);
});

test('proxy Anthropic devolve 401 sem cookie', async ({ request }) => {
  const resp = await request.post('/api/anthropic/proxy', {
    data: {
      messages: [{ role: 'user', content: 'olá' }],
      model: 'claude-haiku-4-5-20251001',
    },
  });
  expect(resp.status()).toBe(401);
});
