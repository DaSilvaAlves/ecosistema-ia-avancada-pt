import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';

/**
 * Nexus v2 — MarkdownEditor tests (Story 5.2 — AC7 / react-component-test-criteria.md)
 *
 * Estados de render distintos (contagem registada no gate @qa):
 *   C1 — conteúdo: markdown inicial renderiza formatação.
 *   C2 — edição: paste de markdown emite onChange com markdown serializado.
 *   C3 — vazio: placeholder visível (data-placeholder).
 *   C4 — read-only: editable=false → contenteditable=false.
 *   C5 — a11y: aria-label aplicado à área editável.
 *
 * O round-trip de serialização markdown é testado em separado no helper puro
 * (`tests/unit/lib/editor/markdown.test.ts`).
 */
describe('MarkdownEditor (Story 5.2 / AC7)', () => {
  afterEach(() => cleanup());

  function getEditorEl(container: HTMLElement): HTMLElement {
    const el = container.querySelector('.nexus-md-editor');
    if (!el) throw new Error('editor não renderizado');
    return el as HTMLElement;
  }

  // ── C1 — conteúdo ──
  it('C1 — renderiza markdown inicial com formatação (negrito)', async () => {
    const { container } = render(
      <MarkdownEditor value="Texto **negrito**" onChange={vi.fn()} ariaLabel="Editor" />,
    );
    await waitFor(() => {
      const el = getEditorEl(container);
      expect(el.querySelector('strong')).not.toBeNull();
      expect(el.textContent).toContain('negrito');
    });
  });

  // ── C2 — edição emite onChange ──
  it('C2 — paste de markdown emite onChange com markdown serializado', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value="" onChange={onChange} ariaLabel="Editor" />,
    );
    const el = await waitFor(() => getEditorEl(container));
    fireEvent.paste(el, {
      clipboardData: {
        getData: (type: string) => (type === 'text/plain' ? 'linha **forte**' : ''),
        types: ['text/plain'],
      },
    });
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const lastArg = onChange.mock.calls[onChange.mock.calls.length - 1][0] as string;
      expect(lastArg).toContain('**forte**');
    });
  });

  // ── C3 — vazio: placeholder ──
  it('C3 — value vazio mostra placeholder (data-placeholder)', async () => {
    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={vi.fn()}
        placeholder="Escreve aqui…"
        ariaLabel="Editor"
      />,
    );
    await waitFor(() => {
      const ph = container.querySelector('[data-placeholder="Escreve aqui…"]');
      expect(ph).not.toBeNull();
    });
  });

  // ── C4 — read-only ──
  it('C4 — editable=false torna o editor read-only (contenteditable=false)', async () => {
    const { container } = render(
      <MarkdownEditor value="conteúdo" onChange={vi.fn()} editable={false} ariaLabel="Editor" />,
    );
    await waitFor(() => {
      const el = getEditorEl(container);
      expect(el.getAttribute('contenteditable')).toBe('false');
    });
  });

  // ── C5 — a11y ──
  it('C5 — aplica aria-label à área editável', async () => {
    render(
      <MarkdownEditor value="" onChange={vi.fn()} ariaLabel="Diário de hoje" />,
    );
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Diário de hoje' })).toBeInTheDocument();
    });
  });
});
