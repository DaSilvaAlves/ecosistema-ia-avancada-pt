import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AreaTree } from '@/components/conhecimento/AreaTree';
import {
  SYSTEM_AREA_ID,
  INBOX_NOTEBOOK_ID,
} from '@/lib/brain-dump/approval-persistencia';
import type { KnowledgeArea, KnowledgeNotebook } from '@/types/db';

/**
 * Nexus v2 — AreaTree tests (Story 5.9 — AC17, ≥3 estados de render)
 *
 * Estados de render distintos (`react-component-test-criteria.md`, ≥3 obrigatório):
 * loading (`areas` undefined) / vazia (0 áreas) / lista de áreas (colapsadas) /
 * área expandida com cadernos. Cobre também os guards de sistema na árvore (área
 * de sistema e `_inbox` com botões eliminar/editar desactivados — C3).
 */

const userArea: KnowledgeArea = {
  id: '11111111-1111-4000-8000-000000000001',
  name: 'Aprendizagens',
  color: '#00F5FF',
  icon: '🎓',
};
const systemArea: KnowledgeArea = {
  id: SYSTEM_AREA_ID,
  name: 'Sistema',
  color: '#8892A4',
  icon: '📥',
};
const userNotebook: KnowledgeNotebook = {
  id: '22222222-2222-4000-8000-000000000001',
  areaId: userArea.id,
  name: 'React 19',
};
const inboxNotebook: KnowledgeNotebook = {
  id: INBOX_NOTEBOOK_ID,
  areaId: SYSTEM_AREA_ID,
  name: 'Caixa de entrada',
};

function setup(
  overrides: Partial<Parameters<typeof AreaTree>[0]> = {},
): Record<string, ReturnType<typeof vi.fn>> {
  const handlers = {
    onToggleArea: vi.fn(),
    onSelectNotebook: vi.fn(),
    onCreateArea: vi.fn(),
    onEditArea: vi.fn(),
    onDeleteArea: vi.fn(),
    onCreateNotebook: vi.fn(),
    onEditNotebook: vi.fn(),
    onDeleteNotebook: vi.fn(),
  };
  render(
    <AreaTree
      areas={[userArea]}
      expandedAreaIds={new Set()}
      notebooksByArea={new Map()}
      selectedNotebookId={null}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

afterEach(cleanup);

describe('AreaTree — estados de render (AC17)', () => {
  it('(loading) areas undefined mostra o skeleton aria-busy', () => {
    setup({ areas: undefined });
    expect(screen.getByLabelText('A carregar áreas')).toBeInTheDocument();
  });

  it('(vazia) 0 áreas mostra mensagem de estado vazio', () => {
    setup({ areas: [] });
    expect(screen.getByText(/Sem áreas/)).toBeInTheDocument();
  });

  it('(lista) renderiza as áreas colapsadas com botão expandir', () => {
    setup();
    expect(
      screen.getByRole('button', { name: /Expandir área Aprendizagens/ }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('(expandida) mostra os cadernos da área expandida', () => {
    setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
    });
    expect(
      screen.getByRole('button', { name: /Colapsar área Aprendizagens/ }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('React 19')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Novo caderno' })).toBeInTheDocument();
  });

  it('(expandida, cadernos a carregar) sem entrada em notebooksByArea mostra "a carregar…"', () => {
    setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map(), // área expandida mas cadernos ainda undefined
    });
    expect(screen.getByText('a carregar…')).toBeInTheDocument();
  });

  it('(caderno seleccionado) destaca o caderno via aria-current=true', () => {
    setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
      selectedNotebookId: userNotebook.id,
    });
    expect(screen.getByText('React 19')).toHaveAttribute('aria-current', 'true');
  });
});

describe('AreaTree — interacções', () => {
  it('toggle de área emite onToggleArea', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: /Expandir área Aprendizagens/ }));
    expect(h.onToggleArea).toHaveBeenCalledWith(userArea.id);
  });

  it('selecção de caderno emite onSelectNotebook', () => {
    const h = setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
    });
    fireEvent.click(screen.getByText('React 19'));
    expect(h.onSelectNotebook).toHaveBeenCalledWith(userNotebook);
  });

  it('+ Nova área emite onCreateArea', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: '+ Nova área' }));
    expect(h.onCreateArea).toHaveBeenCalledTimes(1);
  });

  it('editar/eliminar área emitem onEditArea/onDeleteArea com a área', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Editar área Aprendizagens' }));
    expect(h.onEditArea).toHaveBeenCalledWith(userArea);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar área Aprendizagens' }));
    expect(h.onDeleteArea).toHaveBeenCalledWith(userArea);
  });

  it('+ Novo caderno emite onCreateNotebook com a área', () => {
    const h = setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Novo caderno' }));
    expect(h.onCreateNotebook).toHaveBeenCalledWith(userArea);
  });

  it('editar/eliminar caderno emitem onEditNotebook/onDeleteNotebook com o caderno', () => {
    const h = setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Editar caderno React 19' }));
    expect(h.onEditNotebook).toHaveBeenCalledWith(userNotebook);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar caderno React 19' }));
    expect(h.onDeleteNotebook).toHaveBeenCalledWith(userNotebook);
  });
});

describe('AreaTree — guards de sistema (C3)', () => {
  it('área de sistema tem eliminar E editar desactivados', () => {
    setup({ areas: [systemArea] });
    expect(
      screen.getByRole('button', { name: 'Eliminar área Sistema' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Editar área Sistema' }),
    ).toBeDisabled();
  });

  it('área de utilizador NÃO tem eliminar/editar desactivados (caso negativo)', () => {
    setup();
    expect(
      screen.getByRole('button', { name: 'Eliminar área Aprendizagens' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Editar área Aprendizagens' }),
    ).not.toBeDisabled();
  });

  it('caderno _inbox tem eliminar E editar desactivados', () => {
    setup({
      areas: [systemArea],
      expandedAreaIds: new Set([SYSTEM_AREA_ID]),
      notebooksByArea: new Map([[SYSTEM_AREA_ID, [inboxNotebook]]]),
    });
    expect(
      screen.getByRole('button', { name: 'Eliminar caderno Caixa de entrada' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Editar caderno Caixa de entrada' }),
    ).toBeDisabled();
  });

  it('caderno de utilizador NÃO tem eliminar/editar desactivados (caso negativo)', () => {
    setup({
      expandedAreaIds: new Set([userArea.id]),
      notebooksByArea: new Map([[userArea.id, [userNotebook]]]),
    });
    expect(
      screen.getByRole('button', { name: 'Eliminar caderno React 19' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Editar caderno React 19' }),
    ).not.toBeDisabled();
  });
});
