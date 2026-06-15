import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import {
  WebSearchCreateProposal,
  type WebSearchCreateState,
} from '@/components/conhecimento/WebSearchCreateProposal';
import type { Proposal } from '@/lib/conhecimento/web-search-create';

/**
 * Nexus v2 — WebSearchCreateProposal tests (Story 5.12 — AC3/AC8/AC11)
 *
 * 6 estados de render distintos (`react-component-test-criteria.md` → teste
 * OBRIGATÓRIO, 1 cenário por estado):
 *   I1 — idle → mensagem de convite.
 *   I2 — searching → skeleton (aria-busy); sem proposta/botões.
 *   I3 — proposing → proposta (área+caderno+nota+URL+badge); C3 distinção
 *        visual nova/existente; botões Confirmar/Cancelar com aria-label PT-PT.
 *   I4 — confirming → progresso "A criar…"; botões DESACTIVADOS (C4 — guarda de
 *        dupla submissão visível no `disabled`).
 *   I5 — done → sucesso PT-PT com nome da nota e caderno.
 *   I6 — error → mensagem real PT-PT, role="alert".
 *   + interacções: Confirmar/Cancelar chamam os callbacks; em confirming não
 *     disparam (botão disabled).
 */

function makeProposal(over: Partial<Proposal> = {}): Proposal {
  return {
    area: { name: 'Espaço', status: 'nova' },
    notebook: { name: 'Artemis 2', status: 'existente' },
    note: {
      title: 'Missão lunar tripulada',
      bodyMarkdown: 'A missão Artemis 2.\n\nFonte: https://nasa.gov/artemis-ii',
      sourceUrl: 'https://nasa.gov/artemis-ii',
    },
    source: 'anthropic',
    results: [],
    ...over,
  };
}

function renderState(state: WebSearchCreateState, over: Partial<{ onConfirm: () => void; onCancel: () => void }> = {}) {
  return render(
    <WebSearchCreateProposal
      state={state}
      onConfirm={over.onConfirm ?? vi.fn()}
      onCancel={over.onCancel ?? vi.fn()}
    />,
  );
}

describe('WebSearchCreateProposal (Story 5.12 / AC8)', () => {
  afterEach(() => cleanup());

  it('I1 — idle: mensagem de convite', () => {
    renderState({ kind: 'idle' });
    expect(screen.getByTestId('wsc-idle')).toBeInTheDocument();
    expect(screen.queryByTestId('wsc-proposal')).not.toBeInTheDocument();
  });

  it('I2 — searching: skeleton (aria-busy), sem proposta nem botões', () => {
    renderState({ kind: 'searching' });
    expect(screen.getByTestId('wsc-searching')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('wsc-proposal')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('I3 — proposing: mostra área, caderno, nota, URL e badge de provider', () => {
    renderState({ kind: 'proposing', proposal: makeProposal() });
    expect(screen.getByTestId('wsc-proposal')).toBeInTheDocument();
    expect(screen.getByText('Espaço')).toBeInTheDocument();
    expect(screen.getByText('Artemis 2')).toBeInTheDocument(); // nome do caderno
    expect(screen.getByText('Missão lunar tripulada')).toBeInTheDocument(); // título da nota
    expect(screen.getByText('ANTHROPIC')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://nasa.gov/artemis-ii' }),
    ).toHaveAttribute('href', 'https://nasa.gov/artemis-ii');
    expect(screen.getByLabelText('Confirmar e criar a nota')).toBeEnabled();
    expect(screen.getByLabelText('Cancelar criação da nota')).toBeEnabled();
  });

  it('C3 — proposing: distingue visualmente área NOVA vs caderno EXISTENTE', () => {
    renderState({ kind: 'proposing', proposal: makeProposal() });
    // Área = nova, caderno = existente (makeProposal default).
    expect(screen.getByTestId('status-badge-nova')).toHaveTextContent('NOVA');
    expect(screen.getByTestId('status-badge-existente')).toHaveTextContent('REUTILIZAR');
  });

  it('I4 — confirming: progresso "A criar…" e botões DESACTIVADOS (C4)', () => {
    renderState({ kind: 'confirming', proposal: makeProposal() });
    expect(screen.getByTestId('wsc-confirming')).toHaveTextContent('A criar…');
    expect(screen.getByLabelText('Confirmar e criar a nota')).toBeDisabled();
    expect(screen.getByLabelText('Cancelar criação da nota')).toBeDisabled();
  });

  it('I5 — done: sucesso PT-PT com nome da nota e caderno', () => {
    renderState({ kind: 'done', notebookName: 'Artemis 2', noteTitle: 'Artemis 2' });
    const done = screen.getByTestId('wsc-done');
    expect(done).toHaveTextContent('Artemis 2');
    expect(done).toHaveTextContent('criada em');
    expect(done).toHaveAttribute('role', 'status');
  });

  it('I6 — error: mensagem real PT-PT, role="alert"', () => {
    renderState({ kind: 'error', message: 'Não foi possível criar a nota. X' });
    const err = screen.getByTestId('wsc-error');
    expect(err).toHaveTextContent('Não foi possível criar a nota. X');
    expect(err).toHaveAttribute('role', 'alert');
  });

  it('interacção: Confirmar e Cancelar chamam os callbacks em proposing', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderState({ kind: 'proposing', proposal: makeProposal() }, { onConfirm, onCancel });
    fireEvent.click(screen.getByLabelText('Confirmar e criar a nota'));
    fireEvent.click(screen.getByLabelText('Cancelar criação da nota'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('C4: em confirming o botão Confirmar está disabled → clicar não dispara onConfirm', () => {
    const onConfirm = vi.fn();
    renderState({ kind: 'confirming', proposal: makeProposal() }, { onConfirm });
    fireEvent.click(screen.getByLabelText('Confirmar e criar a nota'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
