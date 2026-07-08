/**
 * Nexus v2 — Header tests (Story 9.5 AC2)
 *
 * O indicador de estado de rede deixou de ser hardcoded ("● online" Lime que
 * mentia sempre) e passa a reflectir `useOnlineStatus()`:
 *   - online  → "● online"  a Lime  (#39FF14)
 *   - offline → "● offline" a Magenta (#FF006E)
 *
 * navigator.onLine mockado; o hook `useOnlineStatus` (não mockado) é exercido de
 * ponta a ponta. Cobre os 2 estados do indicador + a transição.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { Header } from '@/components/ui/Header';

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  cleanup();
  setNavigatorOnLine(true);
  vi.restoreAllMocks();
});

describe('Header — indicador honesto de rede (AC2)', () => {
  it('online: mostra "● online" a Lime', () => {
    setNavigatorOnLine(true);
    render(<Header />);

    const indicator = screen.getByTestId('network-status');
    expect(indicator).toHaveTextContent('● online');
    expect(indicator).toHaveStyle({ color: '#39FF14' });
    // Sem banner offline montado quando online.
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('offline: mostra "● offline" a Magenta e monta o banner', () => {
    setNavigatorOnLine(false);
    render(<Header />);

    const indicator = screen.getByTestId('network-status');
    expect(indicator).toHaveTextContent('● offline');
    expect(indicator).toHaveStyle({ color: '#FF006E' });
    // OfflineBanner (irmão do header) aparece quando offline.
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
  });

  it('transição online → offline actualiza o indicador', () => {
    setNavigatorOnLine(true);
    render(<Header />);
    expect(screen.getByTestId('network-status')).toHaveTextContent('● online');

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('network-status')).toHaveTextContent('● offline');
  });
});
