import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainDumpModal } from '@/components/brain-dump/BrainDumpModal';
import type { BrainDumpParsed } from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — BrainDumpModal tests (Stories 5.6 + 5.7 — AC7)
 *
 * 5.6: 6 cenários de input + foco inicial na textarea. O threshold/contagem é
 * coberto em separado no helper puro (`tests/unit/lib/brain-dump/input.test.ts`).
 * 5.7: estados `aiState` (idle/loading/parsed/error ⇒ ≥3 ⇒ obrigatório) — overlay
 * em loading, 4 buckets + contadores em parsed, mensagem PT-PT em error,
 * `aria-expanded` dos colapsáveis (não-vazio expandido, vazio colapsado).
 */

const PLACEHOLDER =
  'Vomita ideias 10 minutos seguidos. Sem censura. A AI organiza depois.';

function setup(overrides: Partial<Parameters<typeof BrainDumpModal>[0]> = {}) {
  const onClose = vi.fn();
  const onStructure = vi.fn();
  render(
    <BrainDumpModal
      isOpen
      onClose={onClose}
      onStructure={onStructure}
      {...overrides}
    />,
  );
  return { onClose, onStructure };
}

describe('BrainDumpModal', () => {
  it('não renderiza quando isOpen é false', () => {
    render(
      <BrainDumpModal isOpen={false} onClose={vi.fn()} onStructure={vi.fn()} />,
    );
    expect(screen.queryByTestId('brain-dump-modal')).not.toBeInTheDocument();
  });

  it('(i) mostra o placeholder exacto quando o input está vazio', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    expect(textarea).toHaveAttribute('placeholder', PLACEHOLDER);
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('(ii) inibe o botão "Estruturar com AI" abaixo de 50 caracteres', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(49) } });
    expect(screen.getByRole('button', { name: /^estruturar com ai/i })).toBeDisabled();
  });

  it('(iii) activa o botão "Estruturar com AI" com ≥ 50 caracteres', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(50) } });
    expect(screen.getByRole('button', { name: 'Estruturar com AI' })).toBeEnabled();
  });

  it('(iv) clicar "Estruturar" com input válido invoca onStructure com o markdown', () => {
    const { onStructure } = setup();
    const markdown = 'Ideia solta '.repeat(6); // > 50 chars
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: markdown } });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));
    expect(onStructure).toHaveBeenCalledTimes(1);
    expect(onStructure).toHaveBeenCalledWith(markdown);
  });

  it('(iv-neg) não invoca onStructure quando o input é insuficiente', () => {
    const { onStructure } = setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'curto' } });
    fireEvent.click(screen.getByRole('button', { name: /estruturar com ai/i }));
    expect(onStructure).not.toHaveBeenCalled();
  });

  it('(v) Escape e o botão de fechar invocam onClose', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar Brain Dump' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('(vi) expõe role="dialog" + aria-modal + aria-label', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Brain Dump — captura de ideias');
  });

  it('(a11y) foca a textarea ao abrir', () => {
    setup();
    expect(screen.getByTestId('brain-dump-textarea')).toHaveFocus();
  });
});

/** Domínio parseado de referência para os testes de display (Story 5.7). */
function parsedFixture(): BrainDumpParsed {
  return {
    tarefas: [
      { id: 't1', texto: 'ligar ao contabilista' },
      { id: 't2', texto: 'comprar tinta' },
    ],
    projectos: [{ id: 'p1', texto: 'renovar o escritório' }],
    ideias: [],
    decisoes: [{ id: 'd1', texto: 'mudar de banco?' }],
  };
}

describe('BrainDumpModal — estados aiState (Story 5.7, AC4/AC5/AC6)', () => {
  it('(idle) mostra o input sem overlay, sem buckets, sem erro', () => {
    setup();
    expect(screen.queryByTestId('brain-dump-loading-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('brain-dump-buckets')).not.toBeInTheDocument();
    expect(screen.queryByTestId('brain-dump-error')).not.toBeInTheDocument();
  });

  it('(loading) mostra overlay "A estruturar…" com role=status e textarea readonly', () => {
    setup({ aiState: { kind: 'loading' } });
    const overlay = screen.getByTestId('brain-dump-loading-overlay');
    expect(overlay).toHaveAttribute('role', 'status');
    expect(overlay).toHaveTextContent('A estruturar…');
    expect(screen.getByTestId('brain-dump-textarea')).toHaveAttribute('readonly');
  });

  it('(loading) desactiva o botão "Estruturar com AI" mesmo com texto válido', () => {
    setup({ aiState: { kind: 'loading' } });
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(60) } });
    expect(
      screen.getByRole('button', { name: /^estruturar com ai/i }),
    ).toBeDisabled();
  });

  it('(error) mostra a mensagem PT-PT com role=alert, sem buckets', () => {
    setup({
      aiState: {
        kind: 'error',
        message: 'Não foi possível estruturar o brain dump (proxy respondeu 429).',
      },
    });
    const error = screen.getByTestId('brain-dump-error');
    expect(error).toHaveAttribute('role', 'alert');
    expect(error).toHaveTextContent(/proxy respondeu 429/);
    expect(screen.queryByTestId('brain-dump-buckets')).not.toBeInTheDocument();
  });

  it('(parsed) mostra os 4 buckets com contadores correctos', () => {
    setup({ aiState: { kind: 'parsed', parsed: parsedFixture() } });
    expect(screen.getByTestId('brain-dump-buckets')).toBeInTheDocument();
    expect(screen.getByTestId('brain-dump-count-tarefas')).toHaveTextContent('(2)');
    expect(screen.getByTestId('brain-dump-count-projectos')).toHaveTextContent('(1)');
    expect(screen.getByTestId('brain-dump-count-ideias')).toHaveTextContent('(0)');
    expect(screen.getByTestId('brain-dump-count-decisoes')).toHaveTextContent('(1)');
  });

  it('(parsed) lista os itens de um bucket não-vazio', () => {
    setup({ aiState: { kind: 'parsed', parsed: parsedFixture() } });
    expect(screen.getByText('ligar ao contabilista')).toBeInTheDocument();
    expect(screen.getByText('comprar tinta')).toBeInTheDocument();
    expect(screen.getByText('renovar o escritório')).toBeInTheDocument();
  });

  it('(parsed, a11y) bucket não-vazio default expandido, vazio default colapsado', () => {
    setup({ aiState: { kind: 'parsed', parsed: parsedFixture() } });
    const tarefasToggle = screen.getByRole('button', { name: /tarefas propostas/i });
    const ideiasToggle = screen.getByRole('button', { name: /ideias soltas/i });
    expect(tarefasToggle).toHaveAttribute('aria-expanded', 'true');
    expect(ideiasToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('(parsed, a11y) clicar no cabeçalho alterna aria-expanded', () => {
    setup({ aiState: { kind: 'parsed', parsed: parsedFixture() } });
    const ideiasToggle = screen.getByRole('button', { name: /ideias soltas/i });
    expect(ideiasToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(ideiasToggle);
    expect(ideiasToggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('(parsed) sem itens em nenhum bucket → mensagem informativa, não preview vazio', () => {
    const empty: BrainDumpParsed = {
      tarefas: [],
      projectos: [],
      ideias: [],
      decisoes: [],
    };
    setup({ aiState: { kind: 'parsed', parsed: empty } });
    expect(screen.getByTestId('brain-dump-empty-hint')).toHaveTextContent(
      /não encontrou itens/i,
    );
  });

  it('(parsed) NÃO mostra controlos item-a-item (checkbox/editar/guardar) — isso é a 5.8', () => {
    setup({ aiState: { kind: 'parsed', parsed: parsedFixture() } });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /guardar \d+ itens/i }),
    ).not.toBeInTheDocument();
  });
});
