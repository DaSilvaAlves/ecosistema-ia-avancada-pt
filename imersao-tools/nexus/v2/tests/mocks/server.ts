/**
 * Nexus v2 — MSW server (Story 0.9)
 *
 * Inicializa MSW para uso em testes Vitest. `setupServer()` corre em Node.
 * Para uso em Playwright, configurar via `page.route` ou ambiente test
 * com fetch interceptado.
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
