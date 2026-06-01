import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { ReminderFormModal } from '@/components/lembretes/ReminderFormModal';

/**
 * Nexus v2 — ReminderFormModal tests (Story 4.6 — AC1/AC9)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — modo create renderiza campos vazios, recorrência opcional vazia.
 *   C2 — modo edit pré-preenche campos (texto, fireAt → datetime-local, RRULE).
 *   C3 — submissão com texto vazio ou fireAt inválido mostra erro de validação
 *        (sem chamar onSubmit).
 */

const noopHandlers = {
  onClose: vi.fn(),
  onSubmit: vi.fn(async () => undefined),
};

describe('ReminderFormModal (Story 4.6 / AC1)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — create vazio ──
  it('C1 — create: renderiza campos vazios e título "Novo lembrete"', () => {
    render(<ReminderFormModal mode="create" {...noopHandlers} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novo lembrete' })).toBeInTheDocument();
    expect((screen.getByLabelText(/Texto/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Data\/hora/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Recorrência/) as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  // ── C2 — edit pré-preenchido ──
  it('C2 — edit: pré-preenche texto, data/hora (datetime-local) e RRULE', () => {
    const fireAt = new Date('2026-06-01T15:00:00').getTime();
    render(
      <ReminderFormModal
        mode="edit"
        initialValue={{ text: 'Pagar a renda', fireAt, rrule: 'FREQ=MONTHLY' }}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Editar lembrete' })).toBeInTheDocument();
    expect((screen.getByLabelText(/Texto/) as HTMLInputElement).value).toBe('Pagar a renda');
    // datetime-local recebe `YYYY-MM-DDTHH:MM` em hora local. Em vez de comparar
    // com um literal (timezone-brittle), reconverte o valor do input de volta a
    // epoch ms — `<input type="datetime-local">` interpreta o valor como hora
    // local, o mesmo fuso de `new Date('...')` da fixture — e prova o roundtrip
    // exacto (minuto truncado) independentemente do fuso do runner (CR Iter 1).
    const fireAtInput = screen.getByLabelText(/Data\/hora/) as HTMLInputElement;
    const expectedFireAtMinute = Math.floor(fireAt / 60_000) * 60_000;
    expect(new Date(fireAtInput.value).getTime()).toBe(expectedFireAtMinute);
    expect((screen.getByLabelText(/Recorrência/) as HTMLInputElement).value).toBe('FREQ=MONTHLY');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('C2b — edit: submissão válida converte datetime-local de volta para epoch ms e chama onSubmit', async () => {
    const fireAt = new Date('2026-06-01T15:00:00').getTime();
    const onSubmit = vi.fn(async () => undefined);
    render(
      <ReminderFormModal
        mode="edit"
        initialValue={{ text: 'Pagar a renda', fireAt, rrule: '' }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      text: 'Pagar a renda',
      fireAt,
      rrule: '',
    });
  });

  // ── C3 — erro de validação ──
  it('C3 — submissão com texto vazio mostra erro e NÃO chama onSubmit', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <ReminderFormModal
        mode="create"
        initialValue={{ fireAt: new Date('2026-06-01T15:00:00').getTime() }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    // Texto vazio (default), fireAt válido — submeter.
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() =>
      expect(screen.getByText(/Texto do lembrete é obrigatório/)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('C3b — submissão com data/hora vazia mostra erro e NÃO chama onSubmit', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(
      <ReminderFormModal
        mode="create"
        initialValue={{ text: 'Tem texto' }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() =>
      expect(screen.getByText(/Data\/hora é obrigatória/)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('C3c — Escape chama onClose', () => {
    const onClose = vi.fn();
    render(<ReminderFormModal mode="create" onClose={onClose} onSubmit={vi.fn(async () => undefined)} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
