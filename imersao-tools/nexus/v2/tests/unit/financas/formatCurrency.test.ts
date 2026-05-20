import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/financas/formatCurrency';

/**
 * Nexus v2 — formatCurrency tests (Story 3.1 / AC16)
 *
 * Formato-alvo PT-PT: `€1.234,56` — símbolo prefixado, ponto separador de
 * milhar, vírgula separador decimal. Input é inteiro em cêntimos.
 */

describe('formatCurrency', () => {
  it('formata valor zero como €0,00', () => {
    expect(formatCurrency(0)).toBe('€0,00');
  });

  it('formata valor positivo com separador de milhar (123456 → €1.234,56)', () => {
    expect(formatCurrency(123456)).toBe('€1.234,56');
  });

  it('formata valor negativo com sinal antes do símbolo (-100 → -€1,00)', () => {
    expect(formatCurrency(-100)).toBe('-€1,00');
  });

  it('formata valor sem cêntimos como inteiro de euros (100 → €1,00)', () => {
    expect(formatCurrency(100)).toBe('€1,00');
  });

  it('formata valor com cêntimos não-zero e euros zero (99 → €0,99)', () => {
    expect(formatCurrency(99)).toBe('€0,99');
  });

  it('formata valor grande com separador de milhar (1000000 → €10.000,00)', () => {
    expect(formatCurrency(1000000)).toBe('€10.000,00');
  });

  it('formata valor com múltiplos separadores de milhar (123456789 → €1.234.567,89)', () => {
    expect(formatCurrency(123456789)).toBe('€1.234.567,89');
  });

  it('formata valor negativo grande (-123456 → -€1.234,56)', () => {
    expect(formatCurrency(-123456)).toBe('-€1.234,56');
  });

  it('formata cêntimos de um único dígito com zero à esquerda (5 → €0,05)', () => {
    expect(formatCurrency(5)).toBe('€0,05');
  });
});
