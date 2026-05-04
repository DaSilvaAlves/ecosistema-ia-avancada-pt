import { describe, it, expect } from 'vitest';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

/**
 * Nexus v2 — Auth password unit tests (Story 0.6)
 *
 * Verifica que `verifyPassword` retorna true para password correcta,
 * false para password errada, e false para inputs vazios.
 */

describe('verifyPassword', () => {
  it('retorna true quando password e hash correspondem', async () => {
    const hash = await hashPassword('correcta-secreta-123');
    expect(await verifyPassword('correcta-secreta-123', hash)).toBe(true);
  });

  it('retorna false quando password está errada', async () => {
    const hash = await hashPassword('correcta-secreta-123');
    expect(await verifyPassword('errada-456', hash)).toBe(false);
  });

  it('retorna false quando password está vazia', async () => {
    const hash = await hashPassword('algo');
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('retorna false quando hash está vazio', async () => {
    expect(await verifyPassword('algo', '')).toBe(false);
  });

  it('retorna false quando hash é inválido (não bcrypt)', async () => {
    expect(await verifyPassword('algo', 'not-a-bcrypt-hash')).toBe(false);
  });
});
