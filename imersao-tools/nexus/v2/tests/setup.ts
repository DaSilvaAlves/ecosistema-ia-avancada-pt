/**
 * Nexus v2 — Vitest setup (Story 0.9)
 *
 * Carrega `fake-indexeddb/auto` para que `db = new NexusDB()` funcione em jsdom
 * sem browser. Carrega matchers de `@testing-library/jest-dom` para assertions
 * tipo `.toBeInTheDocument()`.
 */
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
