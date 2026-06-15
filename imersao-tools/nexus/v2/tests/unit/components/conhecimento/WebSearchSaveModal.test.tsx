import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  WebSearchSaveModal,
  type WebSearchNoteDraft,
} from '@/components/conhecimento/WebSearchSaveModal';
import type { KnowledgeArea, KnowledgeNotebook } from '@/types/db';
import type { WebSearchResult } from '@/lib/shared/web-search-ddg';

/**
 * Nexus v2 — WebSearchSaveModal tests (Story 5.11 — AC5)
 *
 * Modal de guardar resultado web como nota. Cobre: pré-preenchimento (título +
 * fonte), selector área→caderno em cascata, submit com o draft correcto, e o
 * caminho de falha (onSubmit lança → mensagem de erro, modal não fecha — eixo c
 * internal-state-contract-gate.md).
 */

const RESULT: WebSearchResult = {
  title: 'Artemis 2',
  url: 'https://nasa.gov/artemis-ii',
  excerpt: 'Missão tripulada à órbita lunar.',
};

const AREAS: KnowledgeArea[] = [
  { id: 'a1', name: 'Espaço', icon: '🚀', color: '#00F5FF' },
  { id: 'a2', name: 'Trabalho', icon: '💼', color: '#9D00FF' },
];

const NOTEBOOKS: KnowledgeNotebook[] = [
  { id: 'nb1', areaId: 'a1', name: 'Missões NASA' },
  { id: 'nb2', areaId: 'a2', name: 'Reuniões' },
];

describe('WebSearchSaveModal (Story 5.11 / AC5)', () => {
  afterEach(() => cleanup());

  it('pré-preenche título e mostra a fonte (sourceUrl)', () => {
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Título da nota')).toHaveValue('Artemis 2');
    expect(screen.getByText('Fonte: https://nasa.gov/artemis-ii')).toBeInTheDocument();
  });

  it('selector caderno desactivado até escolher área; cascata filtra cadernos da área', () => {
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    const notebookSelect = screen.getByLabelText('Caderno de destino');
    expect(notebookSelect).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Área de destino'), { target: { value: 'a1' } });
    expect(notebookSelect).not.toBeDisabled();
    // Só o caderno da área a1 está disponível.
    expect(screen.getByRole('option', { name: 'Missões NASA' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Reuniões' })).not.toBeInTheDocument();
  });

  it('submit chama onSubmit com notebookId, título, corpo (excerto+fonte) e sourceUrl', async () => {
    let captured: WebSearchNoteDraft | null = null;
    const onSubmit = vi.fn(async (draft: WebSearchNoteDraft) => {
      captured = draft;
    });
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Área de destino'), { target: { value: 'a1' } });
    fireEvent.change(screen.getByLabelText('Caderno de destino'), { target: { value: 'nb1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const draft = captured as WebSearchNoteDraft | null;
    expect(draft).not.toBeNull();
    expect(draft!.notebookId).toBe('nb1');
    expect(draft!.title).toBe('Artemis 2');
    expect(draft!.sourceUrl).toBe('https://nasa.gov/artemis-ii');
    expect(draft!.bodyMarkdown).toContain('Missão tripulada à órbita lunar.');
    expect(draft!.bodyMarkdown).toContain('Fonte: https://nasa.gov/artemis-ii');
  });

  it('exige caderno antes de submeter (erro PT-PT, onSubmit não chamado)', () => {
    const onSubmit = vi.fn();
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escolhe um caderno de destino.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('onSubmit lança → mensagem de erro visível, modal não fecha (falha não silenciosa)', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Caderno nb1 não encontrado');
    });
    const onClose = vi.fn();
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Área de destino'), { target: { value: 'a1' } });
    fireEvent.change(screen.getByLabelText('Caderno de destino'), { target: { value: 'nb1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Caderno nb1 não encontrado'),
    );
    // O modal NÃO se fecha sozinho num erro — o parent só fecha em sucesso.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sem áreas → aviso PT-PT (não há onde guardar)', () => {
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={[]}
        notebooks={[]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/Ainda não tens áreas/)).toBeInTheDocument();
  });

  // Cobertura adicional exigida na re-abertura do gate de SAÍDA (CR Major PR #72,
  // finding 5): Escape, backdrop click e validação de título vazio.
  it('Escape fecha o modal (onClose)', () => {
    const onClose = vi.fn();
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click no backdrop fecha; click no conteúdo interno NÃO fecha (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );
    // Click no conteúdo interno (heading) não propaga para o backdrop.
    fireEvent.click(screen.getByRole('heading', { name: 'Guardar como nota' }));
    expect(onClose).not.toHaveBeenCalled();
    // Click no backdrop (o overlay do dialog) fecha.
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('título vazio/só-espaços → erro PT-PT, onSubmit não chamado', () => {
    const onSubmit = vi.fn();
    render(
      <WebSearchSaveModal
        result={RESULT}
        areas={AREAS}
        notebooks={NOTEBOOKS}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Título da nota'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(screen.getByRole('alert')).toHaveTextContent('O título da nota é obrigatório.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
