import { test, expect } from '@playwright/test';

/**
 * Nexus v2 — E2E smoke test (Story 0.9)
 *
 * Verifica que a app responde e redirige para `/login` quando sem sessão.
 */

test('GET / redirige para /login quando sem cookie', async ({ page }) => {
  const response = await page.goto('/');
  // Aceita 200 (já em /login após redirect) ou 302
  expect([200, 302, 307]).toContain(response?.status() ?? 200);
  await expect(page).toHaveURL(/\/login$/);
});

test('logo NEXUS visível em /login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('NEXUS')).toBeVisible();
});
