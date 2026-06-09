import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { JournalEntry } from '@/types/db';
import { JournalEntryModal } from '@/components/diario/JournalEntryModal';

/**
 * Nexus v2 — JournalEntryModal tests (Story 5.3 — AC2/AC5/AC7)
 *
 * Estados de render distintos (`react-component-test-criteria.md`):
 *   C1 — criar (vazio): título "Nova entrada", data editável, sem mood, sem Apagar.
 *   C2 — editar (pré-preenchido): título "Editar entrada", data read-only, mood
 *        pré-seleccionado, botão Apagar presente.
 *   C3 — validação: submeter sem mood → erro; com mood mas corpo vazio → erro.
 *   C4 — selector de mood (radiogroup): 5 radios, clicar marca aria-checked.
 *   C5 — guardar (edição): onSubmit chamado com o payload da entrada.
 *   C6 — apagar com confirmação: window.confirm true → onDelete chamado.
 */

const TODAY = '2026-06-09';
const FROM = '2025-12-15';

const EXISTING: JournalEntry = {
  id: 'j-edit-1',
  date: '2026-06-05',
  mood: 3,
  bodyMarkdown: 'Dia tranquilo.',
};

function renderModal(overrides: Partial<React.ComponentProps<typeof JournalEntryModal>> = {}) {
  const props = {
    date: TODAY,
    existingEntry: undefined,
    minDate: FROM,
    maxDate: TODAY,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { props, ...render(<JournalEntryModal {...props} />) };
}

describe('JournalEntryModal (Story 5.3 / AC2)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ── C1 — criar ──
  it('C1 — criar: título "Nova entrada", data editável = hoje, sem botão Apagar', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Nova entrada' })).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/Data/) as HTMLInputElement;
    expect(dateInput.value).toBe(TODAY);
    expect(dateInput).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Apagar entrada' })).not.toBeInTheDocument();
  });

  // ── C2 — editar ──
  it('C2 — editar: título "Editar entrada", data read-only, mood pré-seleccionado, Apagar', () => {
    renderModal({ existingEntry: EXISTING });
    expect(screen.getByRole('heading', { name: 'Editar entrada' })).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/Data/) as HTMLInputElement;
    expect(dateInput.value).toBe('2026-06-05');
    expect(dateInput).toBeDisabled();
    // Mood 3 pré-seleccionado.
    expect(screen.getByRole('radio', { name: 'Humor 3 de 5 — Neutro' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Apagar entrada' })).toBeInTheDocument();
  });

  // ── C3 — validação ──
  it('C3 — validação: sem mood → erro; com mood mas corpo vazio → erro distinto', () => {
    renderModal();
    // Submit sem mood.
    fireEvent.submit(screen.getByRole('button', { name: 'Criar' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Escolhe um humor de 1 a 5.');
    // Escolhe mood; corpo continua vazio.
    fireEvent.click(screen.getByRole('radio', { name: 'Humor 4 de 5 — Bom' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Criar' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Escreve algo no corpo da entrada.');
  });

  // ── C4 — radiogroup ──
  it('C4 — selector de mood é radiogroup com 5 radios; clicar marca aria-checked', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    fireEvent.click(screen.getByRole('radio', { name: 'Humor 5 de 5 — Muito bom' }));
    expect(screen.getByRole('radio', { name: 'Humor 5 de 5 — Muito bom' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  // ── C5 — guardar (edição) ──
  it('C5 — guardar em edição chama onSubmit com o payload da entrada', async () => {
    const { props } = renderModal({ existingEntry: EXISTING });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1));
    expect(props.onSubmit).toHaveBeenCalledWith({
      id: 'j-edit-1',
      date: '2026-06-05',
      mood: 3,
      bodyMarkdown: 'Dia tranquilo.',
    });
  });

  // ── C6 — apagar com confirmação ──
  it('C6 — apagar com window.confirm=true chama onDelete com o id', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { props } = renderModal({ existingEntry: EXISTING });
    fireEvent.click(screen.getByRole('button', { name: 'Apagar entrada' }));
    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith('j-edit-1'));
  });

  it('C6b — apagar com window.confirm=false NÃO chama onDelete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { props } = renderModal({ existingEntry: EXISTING });
    fireEvent.click(screen.getByRole('button', { name: 'Apagar entrada' }));
    expect(props.onDelete).not.toHaveBeenCalled();
  });
});
