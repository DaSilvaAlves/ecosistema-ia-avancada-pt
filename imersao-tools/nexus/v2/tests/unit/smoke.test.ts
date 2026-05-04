import { describe, it, expect } from 'vitest';

/**
 * Nexus v2 — Smoke test (Story 0.9)
 *
 * Sanity check mínimo. Garante que a config Vitest funciona.
 */
describe('smoke', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });

  it('jsdom global window existe', () => {
    expect(typeof window).toBe('object');
  });
});
