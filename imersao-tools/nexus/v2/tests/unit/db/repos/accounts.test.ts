import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createAccount,
  getAccount,
  listAccounts,
  updateAccount,
  updateBalance,
  deleteAccount,
} from '@/lib/db/repos/accounts';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — accounts repo tests (Story 3.1 / AC13)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: crypto.randomUUID(),
    name: 'Conta à ordem',
    type: 'checking',
    balance: 100000, // €1.000,00 em cêntimos
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('accounts repo', () => {
  beforeEach(async () => {
    await db.accounts.clear();
  });

  it('createAccount + getAccount roundtrip', async () => {
    const account = makeAccount();
    await createAccount(account);
    const retrieved = await getAccount(account.id);
    expect(retrieved).toEqual(account);
  });

  it('createAccount rejeita input inválido (Zod)', async () => {
    const invalid = makeAccount({ id: 'not-a-uuid' });
    await expect(createAccount(invalid)).rejects.toThrow();
  });

  it('createAccount rejeita nome vazio com mensagem PT-PT', async () => {
    const invalid = makeAccount({ name: '' });
    await expect(createAccount(invalid)).rejects.toThrow(/Nome da conta é obrigatório/);
  });

  it('createAccount rejeita balance decimal (cêntimos devem ser inteiros)', async () => {
    const invalid = makeAccount({ balance: 100.5 });
    await expect(createAccount(invalid)).rejects.toThrow(/inteiro em cêntimos/);
  });

  it('listAccounts ordena por createdAt desc', async () => {
    const base = Date.now();
    await createAccount(makeAccount({ createdAt: base - 3000 }));
    await createAccount(makeAccount({ createdAt: base - 1000 }));
    await createAccount(makeAccount({ createdAt: base - 2000 }));

    const result = await listAccounts();
    expect(result).toHaveLength(3);
    expect(result[0].createdAt).toBe(base - 1000);
    expect(result[2].createdAt).toBe(base - 3000);
  });

  it('updateAccount aplica patch parcial', async () => {
    const account = makeAccount({ name: 'Antes' });
    await createAccount(account);
    await updateAccount(account.id, { name: 'Depois', type: 'savings' });

    const updated = await getAccount(account.id);
    expect(updated?.name).toBe('Depois');
    expect(updated?.type).toBe('savings');
    expect(updated?.balance).toBe(account.balance);
  });

  it('updateAccount lança erro se id não existe', async () => {
    await expect(
      updateAccount('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('updateBalance aplica delta positivo em cêntimos', async () => {
    const account = makeAccount({ balance: 100000 });
    await createAccount(account);

    await updateBalance(account.id, 25000);
    const updated = await getAccount(account.id);
    expect(updated?.balance).toBe(125000);
  });

  it('updateBalance aplica delta negativo (saída) em cêntimos', async () => {
    const account = makeAccount({ balance: 100000 });
    await createAccount(account);

    await updateBalance(account.id, -30000);
    const updated = await getAccount(account.id);
    expect(updated?.balance).toBe(70000);
  });

  it('updateBalance acumula múltiplos deltas', async () => {
    const account = makeAccount({ balance: 0 });
    await createAccount(account);

    await updateBalance(account.id, 5000);
    await updateBalance(account.id, 3000);
    await updateBalance(account.id, -1000);

    const updated = await getAccount(account.id);
    expect(updated?.balance).toBe(7000);
  });

  it('updateBalance lança Error PT-PT se a conta não existir', async () => {
    await expect(
      updateBalance('00000000-0000-0000-0000-000000000000', 1000),
    ).rejects.toThrow(/Conta .* não encontrada/);
  });

  // Story 3.1 Iter 2 (CodeRabbit #11) — `delta` é cêntimos: deve ser inteiro.
  it('updateBalance rejeita delta não-inteiro (cêntimos devem ser inteiros)', async () => {
    const account = makeAccount({ balance: 100000 });
    await createAccount(account);

    await expect(updateBalance(account.id, 1.5)).rejects.toThrow(
      /inteiro em cêntimos/,
    );
    await expect(updateBalance(account.id, -0.5)).rejects.toThrow(
      /inteiro em cêntimos/,
    );

    // O saldo permanece intacto após as tentativas inválidas.
    const unchanged = await getAccount(account.id);
    expect(unchanged?.balance).toBe(100000);
  });

  // Story 3.1 Iter 2 (CodeRabbit #1) — updateAccount valida o patch parcial.
  it('updateAccount rejeita patch inválido (balance decimal)', async () => {
    const account = makeAccount();
    await createAccount(account);

    await expect(
      updateAccount(account.id, { balance: 99.99 }),
    ).rejects.toThrow(/inteiro em cêntimos/);
  });

  it('updateAccount rejeita patch com type fora do enum', async () => {
    const account = makeAccount();
    await createAccount(account);

    await expect(
      // @ts-expect-error — type inválido testado em runtime
      updateAccount(account.id, { type: 'investimento' }),
    ).rejects.toThrow();
  });

  it('deleteAccount remove a conta', async () => {
    const account = makeAccount();
    await createAccount(account);
    await deleteAccount(account.id);
    expect(await getAccount(account.id)).toBeUndefined();
  });

  it('deleteAccount é idempotente — não lança em id inexistente', async () => {
    await expect(
      deleteAccount('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
