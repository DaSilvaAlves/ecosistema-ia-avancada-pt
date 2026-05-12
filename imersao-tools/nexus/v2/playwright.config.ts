import { defineConfig, devices } from '@playwright/test';

/**
 * Nexus v2 — Playwright config (Story 0.9)
 *
 * Chromium apenas (ADR-4). baseURL localhost:3001.
 * Em CI, retries 2 + arranca o app antes via webServer.
 *
 * Issue nice-to-have Pax: webServer config adicionado para CI auto-start.
 *
 * Iter 5 (Story 1.10): testIgnore removido. O Playwright aplica testIgnore
 * mesmo quando se passa um path explícito no CLI (verificado em Iter 5: o
 * comando "playwright test tests/e2e/regression/regression.spec.ts --list"
 * devolvia "No tests found" com testIgnore activo). Para evitar que
 * workflows regulares (nexus-v2-ci.yml) corram a regression heavy
 * (50 prompts, 90s+), o script test:e2e em package.json declara
 * explicitamente o scope auth + smoke. A regression suite continua a ser
 * corrida pelo workflow dedicado (e2e-regression.yml) com path explícito.
 */
export default defineConfig({
  testDir: './tests/e2e',
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
