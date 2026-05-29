import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TabStrip, type TabDescriptor } from '@/components/ui/TabStrip';

/**
 * Nexus v2 — TabStrip tests (Story 4.2 — AC2/AC11, D-3.5-2, a11y)
 *
 * Componente trivial mas o roving tabindex é a11y crítica (débito D-3.5-2):
 * estes testes provam o comportamento real do teclado, não espelham o código.
 */

const TABS: TabDescriptor[] = [
  { key: 'active', label: 'Activos' },
  { key: 'archived', label: 'Arquivados' },
  { key: 'all', label: 'Todos' },
];

function renderStrip(activeTab = 'active') {
  const onTabChange = vi.fn();
  render(
    <TabStrip
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      ariaLabel="Vistas"
    />,
  );
  return { onTabChange };
}

describe('TabStrip (Story 4.2 / AC2)', () => {
  afterEach(() => cleanup());

  it('renderiza um role="tab" por descriptor dentro de role="tablist"', () => {
    renderStrip();
    expect(screen.getByRole('tablist', { name: 'Vistas' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('roving tabindex: só a tab activa tem tabindex 0; as restantes -1', () => {
    renderStrip('archived');
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1'); // active
    expect(tabs[1]).toHaveAttribute('tabindex', '0'); // archived (activa)
    expect(tabs[2]).toHaveAttribute('tabindex', '-1'); // all
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight move foco/selecção para a tab seguinte', () => {
    const { onTabChange } = renderStrip('active');
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith('archived');
    expect(tabs[1]).toHaveFocus();
  });

  it('ArrowLeft move foco/selecção para a tab anterior', () => {
    const { onTabChange } = renderStrip('archived');
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(onTabChange).toHaveBeenCalledWith('active');
    expect(tabs[0]).toHaveFocus();
  });

  it('ArrowRight na última tab faz wrap para a primeira', () => {
    const { onTabChange } = renderStrip('all');
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith('active');
    expect(tabs[0]).toHaveFocus();
  });

  it('ArrowLeft na primeira tab faz wrap para a última', () => {
    const { onTabChange } = renderStrip('active');
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(onTabChange).toHaveBeenCalledWith('all');
    expect(tabs[2]).toHaveFocus();
  });

  it('Home/End saltam para a primeira/última tab', () => {
    const { onTabChange } = renderStrip('archived');
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(onTabChange).toHaveBeenCalledWith('all');
    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(onTabChange).toHaveBeenCalledWith('active');
  });

  it('clique numa tab chama onTabChange com a key respectiva', () => {
    const { onTabChange } = renderStrip('active');
    fireEvent.click(screen.getByRole('tab', { name: 'Todos' }));
    expect(onTabChange).toHaveBeenCalledWith('all');
  });
});
