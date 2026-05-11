import { defineConfig, devices } from '@playwright/test';

/**
 * Nexus v2 — Playwright config (Story 0.9)
 *
 * Chromium apenas (ADR-4). baseURL `localhost:3001`.
 * Em CI, retries 2 + arranca o app antes via `webServer`.
 *
 * Issue nice-to-have Pax: `webServer` config adicionado para CI auto-start.
 *
 * testIgnore excluí a regression suite do default `playwright test` — essa
 * suite tem o seu próprio workflow dedicado (`e2e-regression.yml`) com env
 * vars específicas (NEXUS_PASSWORD_HASH válido, TEST_PASSWORD). Workflows
 * regulares (nexus-v2-ci.yml) correm só auth/smoke (não precisam de login).
 * Para correr regression localmente: `npx playwright test tests/e2e/regression/regression.spec.ts`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/regression/**'],
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
