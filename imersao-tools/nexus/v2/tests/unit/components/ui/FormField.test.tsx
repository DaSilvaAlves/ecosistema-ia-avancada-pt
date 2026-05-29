import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FormField } from '@/components/ui/FormField';

/**
 * Nexus v2 — FormField tests (Story 4.2 — AC1/AC11, D-3.5-3)
 *
 * Componente trivial (apresentacional) — estes testes cobrem o contrato:
 * label ligado ao input, slot renderizado, indicador `*` em required, e o
 * `<span role="alert">` de erro quando presente.
 */

describe('FormField (Story 4.2 / AC1)', () => {
  afterEach(() => cleanup());

  it('renderiza label ligado ao input (htmlFor → id) e o children', () => {
    render(
      <FormField id="campo-nome" label="Nome">
        <input id="campo-nome" />
      </FormField>,
    );
    // O label tem de estar associado ao input com o mesmo id.
    const input = screen.getByLabelText('Nome');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'campo-nome');
  });

  it('mostra indicador visual quando required', () => {
    render(
      <FormField id="c" label="Categoria" required>
        <input id="c" />
      </FormField>,
    );
    // O `*` é aria-hidden mas presente no DOM do label.
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renderiza erro com role="alert" e id derivado quando error presente', () => {
    render(
      <FormField id="c" label="Categoria" error="Categoria é obrigatória">
        <input id="c" />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Categoria é obrigatória');
    expect(alert).toHaveAttribute('id', 'c-error');
  });

  it('não renderiza alert quando error ausente', () => {
    render(
      <FormField id="c" label="Categoria">
        <input id="c" />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('helper só aparece quando não há erro (erro tem prioridade)', () => {
    const { rerender } = render(
      <FormField id="c" label="Categoria" helper="dica útil">
        <input id="c" />
      </FormField>,
    );
    expect(screen.getByText('dica útil')).toBeInTheDocument();

    rerender(
      <FormField id="c" label="Categoria" helper="dica útil" error="erro!">
        <input id="c" />
      </FormField>,
    );
    expect(screen.queryByText('dica útil')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('erro!');
  });
});
