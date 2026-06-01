import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GoalProgressBar } from '@/components/metas/GoalProgressBar';

/**
 * Nexus v2 — GoalProgressBar tests (Story 4.5 — AC5)
 *
 * 2 cenários fronteira (`react-component-test-criteria.md` — recomendado):
 *   - percentage < 100 → barra Cyan, sem indicador "Alcançado!".
 *   - percentage >= 100 → indicador "Alcançado!" presente.
 */

describe('GoalProgressBar (Story 4.5 / AC5)', () => {
  afterEach(() => cleanup());

  it('abaixo de 100%: role progressbar com aria-valuenow e sem "Alcançado!"', () => {
    render(<GoalProgressBar percentage={50} label="Em 5 dias" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar.getAttribute('aria-label')).toContain('50%');
    expect(screen.queryByText(/Alcançado!/)).not.toBeInTheDocument();
  });

  it('>= 100%: mostra indicador "Alcançado!" (não-só-cor) e aria-valuenow 100', () => {
    render(<GoalProgressBar percentage={120} />);
    const bar = screen.getByRole('progressbar');
    // Clamp a 100 mesmo recebendo 120.
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(/Alcançado!/)).toBeInTheDocument();
  });
});
