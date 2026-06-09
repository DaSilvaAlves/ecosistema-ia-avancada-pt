import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import type { JournalEntry } from '@/types/db';
import { JournalEntryModal } from '@/components/diario/JournalEntryModal';
import { estruturarDiario } from '@/lib/diario/estruturar-cliente';

/**
 * Nexus v2 — JournalEntryModal tests (Story 5.3 + Story 5.4)
 *
 * Estados de render distintos (`react-component-test-criteria.md`):
 *   (5.3) C1 — criar (vazio): título "Nova entrada", data editável, sem Apagar.
 *         C2 — editar (pré-preenchido): título "Editar entrada", data read-only,
 *              mood pré-seleccionado, botão Apagar presente.
 *         C3 — validação: submeter sem mood → erro; com mood mas corpo vazio → erro.
 *         C4 — selector de mood (radiogroup): 5 radios, clicar marca aria-checked.
 *         C5 — guardar (edição): onSubmit chamado com o payload da entrada.
 *         C6 — apagar com confirmação: window.confirm true → onDelete chamado.
 *   (5.4) C7 — idle/threshold: botão "Estruturar com AI" desactivado < 100 chars,
 *              ausente em criação.
 *         C8 — idle-active: botão activo em edição com > 100 chars.
 *         C9 — loading: clique → estado a estruturar (estruturarDiario pendente).
 *         C10 — preview: 3 buckets + Aceitar/Ignorar visíveis.
 *         C11 — accepted: Aceitar → onAcceptStructure chamado com structuredAI.
 *         C12 — ignored: Ignorar → onAcceptStructure NÃO chamado, volta a idle.
 *         C13 — error: estruturarDiario rejeita → mensagem PT-PT (role=alert).
 */

// Mock do helper cliente — o modal importa `estruturarDiario` directamente.
vi.mock('@/lib/diario/estruturar-cliente', () => ({
  estruturarDiario: vi.fn(),
}));
const mockEstruturar = vi.mocked(estruturarDiario);

const TODAY = '2026-06-09';
const FROM = '2025-12-15';

const EXISTING: JournalEntry = {
  id: 'j-edit-1',
  date: '2026-06-05',
  mood: 3,
  bodyMarkdown: 'Dia tranquilo.',
};

/** Entrada com corpo > 100 chars (activa o botão de estruturação — AC1). */
const LONG_BODY = 'Hoje foi um dia muito intenso de trabalho no Nexus. '.repeat(3);
const EXISTING_LONG: JournalEntry = {
  id: 'j-long-1',
  date: '2026-06-05',
  mood: 4,
  bodyMarkdown: LONG_BODY,
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
    onAcceptStructure: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { props, ...render(<JournalEntryModal {...props} />) };
}

describe('JournalEntryModal (Story 5.3 / AC2)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockEstruturar.mockReset();
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

  // ════════════════════════════════════════════════════════════════════════
  // Story 5.4 — estruturação AI (AC1/AC3/AC4/AC6)
  // ════════════════════════════════════════════════════════════════════════

  const PROPOSAL = {
    whatHappened: 'trabalhei no Nexus',
    whatLearned: 'a estruturar diários',
    whatFelt: 'produtivo',
  };

  // ── C7 — idle / threshold ──
  it('C7 — botão "Estruturar com AI" ausente em criação (entrada não persistida)', () => {
    renderModal();
    expect(
      screen.queryByRole('button', { name: /Estruturar/ }),
    ).not.toBeInTheDocument();
  });

  it('C7b — botão desactivado em edição com corpo <= 100 chars', () => {
    renderModal({ existingEntry: EXISTING }); // body "Dia tranquilo." curto
    const btn = screen.getByRole('button', { name: /Estruturar com AI \(desactivado/ });
    expect(btn).toBeDisabled();
  });

  it('C7c — botão ausente em edição se onAcceptStructure não for fornecido', () => {
    renderModal({ existingEntry: EXISTING_LONG, onAcceptStructure: undefined });
    expect(
      screen.queryByRole('button', { name: /Estruturar/ }),
    ).not.toBeInTheDocument();
  });

  // ── C8 — idle-active ──
  it('C8 — botão activo em edição com corpo > 100 chars', () => {
    renderModal({ existingEntry: EXISTING_LONG });
    const btn = screen.getByRole('button', { name: 'Estruturar a entrada com AI' });
    expect(btn).toBeEnabled();
  });

  // ── C9 — loading ──
  it('C9 — clicar mostra estado loading (estruturarDiario pendente)', async () => {
    let resolve!: (v: typeof PROPOSAL) => void;
    mockEstruturar.mockReturnValue(new Promise((r) => (resolve = r)));
    renderModal({ existingEntry: EXISTING_LONG });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() =>
      expect(screen.getByText(/está a organizar/)).toBeInTheDocument(),
    );
    // Resolve dentro de act para evitar update fora de act ao terminar o teste.
    await act(async () => {
      resolve(PROPOSAL);
    });
  });

  // ── C10 — preview ──
  it('C10 — preview mostra os 3 buckets e botões Aceitar/Ignorar', async () => {
    mockEstruturar.mockResolvedValue(PROPOSAL);
    renderModal({ existingEntry: EXISTING_LONG });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() => expect(screen.getByTestId('ai-preview')).toBeInTheDocument());
    expect(screen.getByText('trabalhei no Nexus')).toBeInTheDocument();
    expect(screen.getByText('a estruturar diários')).toBeInTheDocument();
    expect(screen.getByText('produtivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceitar estrutura proposta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ignorar estrutura proposta' })).toBeInTheDocument();
  });

  // ── C11 — accepted ──
  it('C11 — Aceitar chama onAcceptStructure(id, structuredAI) e fecha o preview', async () => {
    mockEstruturar.mockResolvedValue(PROPOSAL);
    const { props } = renderModal({ existingEntry: EXISTING_LONG });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() => expect(screen.getByTestId('ai-preview')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar estrutura proposta' }));
    await waitFor(() =>
      expect(props.onAcceptStructure).toHaveBeenCalledWith('j-long-1', PROPOSAL),
    );
    // Preview fecha; estrutura guardada passa a estar visível (leitura).
    await waitFor(() => expect(screen.queryByTestId('ai-preview')).not.toBeInTheDocument());
    expect(screen.getByTestId('ai-saved')).toBeInTheDocument();
  });

  // ── C12 — ignored ──
  it('C12 — Ignorar NÃO chama onAcceptStructure e volta a idle', async () => {
    mockEstruturar.mockResolvedValue(PROPOSAL);
    const { props } = renderModal({ existingEntry: EXISTING_LONG });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() => expect(screen.getByTestId('ai-preview')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar estrutura proposta' }));
    await waitFor(() => expect(screen.queryByTestId('ai-preview')).not.toBeInTheDocument());
    expect(props.onAcceptStructure).not.toHaveBeenCalled();
    // Botão de estruturar volta a aparecer (idle).
    expect(
      screen.getByRole('button', { name: 'Estruturar a entrada com AI' }),
    ).toBeInTheDocument();
  });

  // ── C13 — error (AC4) ──
  it('C13 — estruturarDiario rejeita → mensagem de erro PT-PT (role=alert), sem persistir', async () => {
    mockEstruturar.mockRejectedValue(new Error('Proxy respondeu 500'));
    const { props } = renderModal({ existingEntry: EXISTING_LONG });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() => expect(screen.getByTestId('ai-error')).toHaveTextContent('Proxy respondeu 500'));
    expect(props.onAcceptStructure).not.toHaveBeenCalled();
  });

  it('C13b — Aceitar com onAcceptStructure que lança (entrada apagada) → error, não silencia', async () => {
    mockEstruturar.mockResolvedValue(PROPOSAL);
    const onAcceptStructure = vi
      .fn()
      .mockRejectedValue(new Error('Entrada de diário j-long-1 não encontrada'));
    renderModal({ existingEntry: EXISTING_LONG, onAcceptStructure });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar a entrada com AI' }));
    await waitFor(() => expect(screen.getByTestId('ai-preview')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar estrutura proposta' }));
    await waitFor(() =>
      expect(screen.getByTestId('ai-error')).toHaveTextContent('não encontrada'),
    );
  });

  it('C14 — estrutura guardada (savedStructure) visível ao abrir entrada já estruturada', () => {
    renderModal({
      existingEntry: { ...EXISTING_LONG, structuredAI: PROPOSAL },
    });
    expect(screen.getByTestId('ai-saved')).toBeInTheDocument();
    expect(screen.getByText('trabalhei no Nexus')).toBeInTheDocument();
  });
});
