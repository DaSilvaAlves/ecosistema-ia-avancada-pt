import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { GoalFormModal } from '@/components/metas/GoalFormModal';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — GoalFormModal tests (Story 4.5 — AC4/AC11)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — create renderiza campos vazios e título "Nova meta".
 *   C2 — edit pré-preenche título, tipo, alvo e milestones.
 *   C3 — submissão com título vazio mostra erro e NÃO chama onSubmit.
 */

const noopHandlers = {
  onClose: vi.fn(),
  onSubmit: vi.fn(async () => undefined),
};

describe('GoalFormModal (Story 4.5 / AC4)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — create vazio ──
  it('C1 — create: campos vazios e título "Nova meta"', () => {
    render(<GoalFormModal mode="create" {...noopHandlers} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nova meta' })).toBeInTheDocument();
    expect((screen.getByLabelText(/Título/) as HTMLInputElement).value).toBe('');
    // Tipo default numeric → campo Alvo visível.
    expect(screen.getByLabelText(/Alvo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  // ── C2 — edit pré-preenchido ──
  it('C2 — edit: pré-preenche título, alvo e milestones', () => {
    const initial: Partial<Goal> = {
      title: 'Ler 12 livros',
      type: 'numeric',
      target: 12,
      milestones: [{ at: 6, reached: true, note: 'Metade' }],
    };
    render(<GoalFormModal mode="edit" initialValue={initial} {...noopHandlers} />);
    expect(screen.getByRole('heading', { name: 'Editar meta' })).toBeInTheDocument();
    expect((screen.getByLabelText(/Título/) as HTMLInputElement).value).toBe('Ler 12 livros');
    expect((screen.getByLabelText(/Alvo/) as HTMLInputElement).value).toBe('12');
    expect((screen.getByLabelText(/Nota do milestone 1/) as HTMLInputElement).value).toBe('Metade');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('C2b — edit: alterar tipo para Booleana oculta o campo Alvo', () => {
    render(
      <GoalFormModal
        mode="edit"
        initialValue={{ title: 'Correr maratona', type: 'numeric', target: 42 }}
        {...noopHandlers}
      />,
    );
    expect(screen.getByLabelText(/Alvo/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Tipo/), { target: { value: 'boolean' } });
    expect(screen.queryByLabelText(/Alvo/)).not.toBeInTheDocument();
  });

  // ── C3 — erro de validação ──
  it('C3 — título vazio mostra erro e NÃO chama onSubmit', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(<GoalFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);
    // Título vazio (default), tipo numeric mas sem alvo — submeter.
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() =>
      expect(screen.getByText(/Título da meta é obrigatório/)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('C3b — submissão válida (boolean) chama onSubmit com patch', async () => {
    const onSubmit = vi.fn((_input: Partial<Goal>) => Promise.resolve());
    render(<GoalFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Parar de fumar' } });
    fireEvent.change(screen.getByLabelText(/Tipo/), { target: { value: 'boolean' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const patch = onSubmit.mock.calls[0][0];
    expect(patch.title).toBe('Parar de fumar');
    expect(patch.type).toBe('boolean');
    expect(patch.target).toBe(1);
  });

  it('C3c — Escape chama onClose', () => {
    const onClose = vi.fn();
    render(<GoalFormModal mode="create" onClose={onClose} onSubmit={vi.fn(async () => undefined)} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
