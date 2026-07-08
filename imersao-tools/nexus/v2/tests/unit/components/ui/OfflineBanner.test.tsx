/**
 * Nexus v2 — OfflineBanner tests (Story 9.5 AC3, AC10 eixo c)
 *
 * Componente de fronteira (react-component-test-criteria.md) elevado a teste
 * exigido pelo risco de UX/confiança. Cobre os 2 estados de render distintos +
 * a transição de reconexão:
 *   1. Online  → não renderiza nada (return null)
 *   2. Offline → banner visível com role="alert" + aria-live="polite" + mensagem
 *   3. Reconexão (offline → online) → banner desaparece (AC10 eixo c)
 *
 * navigator.onLine mockado; transições via window.dispatchEvent — o hook
 * `useOnlineStatus` (não mockado) é exercido de ponta a ponta com o componente.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

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

describe('OfflineBanner', () => {
  it('online: não renderiza nada (return null)', () => {
    setNavigatorOnLine(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offline: renderiza banner acessível com mensagem PT-PT', () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent(
      'Sem ligação à internet — a mostrar os teus dados locais.'
    );
  });

  it('reconexão: banner desaparece quando o evento online dispara (AC10 eixo c)', () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
