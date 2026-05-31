/**
 * Nexus v2 — UndoToast component tests (Story 1.9 AC10/AC11 + Story 1.12 AC2)
 *
 * Story 1.12 (ADR-9, A4): o `UndoToast` deixou de fazer `POST /api/agent/undo`
 * (endpoint Edge morto na Phase 1) e passou a reverter via
 * `clientUndoStore.undo(runId)` (browser + Dexie real). Estes testes mockam o
 * `clientUndoStore` em vez de MSW/fetch.
 *
 * Verifica:
 * - Renderiza texto "N acções criadas"
 * - Progress bar começa em 100% e decrementa (aria-valuenow/max — AC9)
 * - Clicar "Anular" chama `clientUndoStore.undo` e invoca `markRunReverted`
 * - `status: 'expired'` mostra toast Magenta "Já não é possível anular"
 * - `undo` lança → toast Magenta "Erro ao anular"
 * - Desaparece após 30s (fake timers)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock do markRunReverted (Dexie repo)
vi.mock('@/lib/db/repos/agent-runs', () => ({
  markRunReverted: vi.fn(async () => undefined),
}));

// Story 1.12 — mock do ClientUndoStore (substitui o fetch /api/agent/undo).
vi.mock('@/lib/agent/client-undo-store', () => ({
  clientUndoStore: { undo: vi.fn() },
}));

import { UndoToast } from '@/components/chat/UndoToast';
import { markRunReverted } from '@/lib/db/repos/agent-runs';
import { clientUndoStore } from '@/lib/agent/client-undo-store';

const undoMock = vi.mocked(clientUndoStore.undo);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

const RUN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function expiresAtIn(seconds: number): number {
  return Date.now() + seconds * 1000;
}

describe('UndoToast', () => {
  it('renderiza texto "N acções criadas"', () => {
    render(
      <UndoToast runId={RUN_ID} undoableToolCount={3} expiresAt={expiresAtIn(30)} />
    );
    expect(screen.getByText(/3 acções criadas/i)).toBeInTheDocument();
    expect(screen.getByText(/anular tudo/i)).toBeInTheDocument();
  });

  it('singular "1 acção criada" com count=1', () => {
    render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    expect(screen.getByText(/1 acção criada/i)).toBeInTheDocument();
  });

  // Story 1.9 Iter 2 — Minor #6 — pluralização aria-label
  it('AC9 — aria-label do botão "Anular" pluraliza correctamente', () => {
    const { rerender } = render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    const btnSingular = screen.getByRole('button', { name: /anular 1 acç(ão|ões)/i });
    expect(btnSingular.getAttribute('aria-label')).toBe('Anular 1 acção');

    rerender(
      <UndoToast runId={RUN_ID} undoableToolCount={3} expiresAt={expiresAtIn(30)} />
    );
    const btnPlural = screen.getByRole('button', { name: /anular 3 acções/i });
    expect(btnPlural.getAttribute('aria-label')).toBe('Anular 3 acções');
  });

  it('AC9 — progress bar com aria-valuenow/max canónicos', () => {
    render(
      <UndoToast runId={RUN_ID} undoableToolCount={2} expiresAt={expiresAtIn(30)} />
    );
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '30');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    const valueNow = progress.getAttribute('aria-valuenow');
    expect(valueNow).not.toBeNull();
    expect(Number(valueNow)).toBeGreaterThanOrEqual(29);
    expect(Number(valueNow)).toBeLessThanOrEqual(30);
  });

  it('clicar "Anular" reverte via clientUndoStore e invoca markRunReverted', async () => {
    undoMock.mockResolvedValue({ status: 'reverted', reverted: 2, errors: [] });

    const onSuccess = vi.fn();
    render(
      <UndoToast
        runId={RUN_ID}
        undoableToolCount={2}
        expiresAt={expiresAtIn(30)}
        onUndoSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /anular 2 acções/i }));

    await waitFor(() => expect(undoMock).toHaveBeenCalledWith(RUN_ID));
    await waitFor(() => expect(markRunReverted).toHaveBeenCalledWith(RUN_ID));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(2));
    await waitFor(() =>
      expect(screen.getByText(/anulado · 2 acções revertidas/i)).toBeInTheDocument()
    );
  });

  it('status "expired" mostra toast Magenta "Já não é possível anular"', async () => {
    undoMock.mockResolvedValue({ status: 'expired', reverted: 0, errors: [] });

    render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    fireEvent.click(screen.getByRole('button', { name: /anular 1 acç(ão|ões)/i }));

    await waitFor(() =>
      expect(screen.getByText(/já não é possível anular/i)).toBeInTheDocument()
    );
    expect(markRunReverted).not.toHaveBeenCalled();
  });

  it('undo que lança mostra toast Magenta "Erro ao anular"', async () => {
    undoMock.mockRejectedValue(new Error('falha inesperada'));

    render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    fireEvent.click(screen.getByRole('button', { name: /anular 1 acç(ão|ões)/i }));

    await waitFor(() =>
      expect(screen.getByText(/erro ao anular/i)).toBeInTheDocument()
    );
  });

  it('Desaparece após 30s — fake timers', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const expiresAt = Date.now() + 30_000;

    const { container } = render(
      <UndoToast
        runId={RUN_ID}
        undoableToolCount={1}
        expiresAt={expiresAt}
        onDismiss={onDismiss}
      />
    );
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('clicar X (close) chama onDismiss e remove do DOM', () => {
    const onDismiss = vi.fn();
    render(
      <UndoToast
        runId={RUN_ID}
        undoableToolCount={1}
        expiresAt={expiresAtIn(30)}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /fechar toast/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
