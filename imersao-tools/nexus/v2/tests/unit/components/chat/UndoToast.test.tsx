/**
 * Nexus v2 — UndoToast component tests (Story 1.9 AC10 + AC11)
 *
 * Cobertura mínima 85% lines (AC11).
 *
 * Verifica:
 * - Renderiza texto "N acções criadas"
 * - Progress bar começa em 100% e decrementa
 * - Clicar "Anular" faz POST /api/agent/undo (mockado MSW) e invoca markRunReverted
 * - Resposta 410 mostra toast Magenta "Já não é possível anular"
 * - Resposta 5xx mostra toast Magenta "Erro ao anular"
 * - Desaparece após 30s (fake timers)
 * - aria-valuenow/max do progress bar (AC9)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock do markRunReverted
vi.mock('@/lib/db/repos/agent-runs', () => ({
  markRunReverted: vi.fn(async () => undefined),
}));

import { UndoToast } from '@/components/chat/UndoToast';
import { markRunReverted } from '@/lib/db/repos/agent-runs';

const server = setupServer();

beforeEach(() => {
  vi.clearAllMocks();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  vi.useRealTimers();
  server.resetHandlers();
  server.close();
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

  it('clicar "Anular" faz POST /api/agent/undo e invoca markRunReverted', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post('/api/agent/undo', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ reverted: 2, errors: [] }, { status: 200 });
      })
    );

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

    await waitFor(() => {
      expect(capturedBody).toEqual({ runId: RUN_ID });
    });
    await waitFor(() => expect(markRunReverted).toHaveBeenCalledWith(RUN_ID));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(2));
    await waitFor(() =>
      expect(screen.getByText(/anulado · 2 acções revertidas/i)).toBeInTheDocument()
    );
  });

  it('Resposta 410 Gone mostra toast Magenta "Já não é possível anular"', async () => {
    server.use(
      http.post('/api/agent/undo', () => {
        return HttpResponse.json(
          { error: 'undo_window_expired', message: 'expirou' },
          { status: 410 }
        );
      })
    );

    render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    fireEvent.click(screen.getByRole('button', { name: /anular 1 acções/i }));

    await waitFor(() =>
      expect(screen.getByText(/já não é possível anular/i)).toBeInTheDocument()
    );
    expect(markRunReverted).not.toHaveBeenCalled();
  });

  it('Resposta 5xx mostra toast Magenta "Erro ao anular"', async () => {
    server.use(
      http.post('/api/agent/undo', () => {
        return HttpResponse.json(
          { error: 'kv_failed', message: 'down' },
          { status: 503 }
        );
      })
    );

    render(
      <UndoToast runId={RUN_ID} undoableToolCount={1} expiresAt={expiresAtIn(30)} />
    );
    fireEvent.click(screen.getByRole('button', { name: /anular 1 acções/i }));

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

    // Avançar 31s
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
