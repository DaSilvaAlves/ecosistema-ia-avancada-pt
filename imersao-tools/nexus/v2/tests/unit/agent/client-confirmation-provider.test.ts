import { describe, it, expect } from 'vitest';
import { ClientConfirmationProvider } from '@/lib/agent/client-confirmation-provider';

/**
 * Nexus v2 — ClientConfirmationProvider unit tests (Story 1.11 — ADR-9, A3, T7)
 *
 * Cobre AC7 (confirmação in-process sem KV cross-process): o gate de preview
 * cria uma Promise pendente que a UI resolve via `resolve(runId, toolName,
 * action)`. Substitui o `KvConfirmationProvider` no caminho client-side.
 */

describe('ClientConfirmationProvider (AC7)', () => {
  it('resolve "confirm" quando a UI confirma', async () => {
    const provider = new ClientConfirmationProvider();
    const pending = provider.requestConfirmation('run1', 'criar_tarefa');
    expect(provider.pendingCount).toBe(1);

    const resolved = provider.resolve('run1', 'criar_tarefa', 'confirm');
    expect(resolved).toBe(true);
    await expect(pending).resolves.toBe('confirm');
    expect(provider.pendingCount).toBe(0);
  });

  it('resolve "cancel" quando a UI cancela', async () => {
    const provider = new ClientConfirmationProvider();
    const pending = provider.requestConfirmation('run1', 'apagar_tudo');
    provider.resolve('run1', 'apagar_tudo', 'cancel');
    await expect(pending).resolves.toBe('cancel');
  });

  it('resolve() devolve false quando não há pedido pendente (clique tardio)', () => {
    const provider = new ClientConfirmationProvider();
    expect(provider.resolve('run-x', 'tool-x', 'confirm')).toBe(false);
  });

  it('pedidos para pares (runId, toolName) distintos resolvem independentemente', async () => {
    const provider = new ClientConfirmationProvider();
    const p1 = provider.requestConfirmation('run1', 'tool_a');
    const p2 = provider.requestConfirmation('run1', 'tool_b');
    expect(provider.pendingCount).toBe(2);

    provider.resolve('run1', 'tool_b', 'cancel');
    provider.resolve('run1', 'tool_a', 'confirm');
    await expect(p1).resolves.toBe('confirm');
    await expect(p2).resolves.toBe('cancel');
    expect(provider.pendingCount).toBe(0);
  });

  it('re-solicitação do mesmo par rejeita a Promise anterior (não fica pendurada)', async () => {
    const provider = new ClientConfirmationProvider();
    const first = provider.requestConfirmation('run1', 'tool_a');
    const second = provider.requestConfirmation('run1', 'tool_a');

    await expect(first).rejects.toThrow(/substituído por novo pedido/);
    provider.resolve('run1', 'tool_a', 'confirm');
    await expect(second).resolves.toBe('confirm');
  });

  it('cancelAll resolve todos os pendentes como "cancel" e esvazia o mapa', async () => {
    const provider = new ClientConfirmationProvider();
    const p1 = provider.requestConfirmation('run1', 'tool_a');
    const p2 = provider.requestConfirmation('run2', 'tool_b');
    expect(provider.pendingCount).toBe(2);

    provider.cancelAll();
    await expect(p1).resolves.toBe('cancel');
    await expect(p2).resolves.toBe('cancel');
    expect(provider.pendingCount).toBe(0);
  });
});
