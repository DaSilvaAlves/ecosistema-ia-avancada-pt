import { describe, it, expect } from 'vitest';
import {
  applyDirection,
  centsToInputValue,
  directionOf,
  parseCurrencyInput,
} from '@/lib/financas/currencyInput';

/**
 * Nexus v2 — currencyInput tests (Story 3.3 / AC13)
 *
 * Helpers de entrada/edição monetária PT-PT: string de euros ↔ cêntimos
 * inteiros, e conversão direção↔sinal de `Transaction.amount`.
 */

describe('parseCurrencyInput', () => {
  it('converte vírgula decimal (78,70 → 7870)', () => {
    expect(parseCurrencyInput('78,70')).toBe(7870);
  });

  it('converte forma agrupada com ponto de milhar (1.234,56 → 123456)', () => {
    expect(parseCurrencyInput('1.234,56')).toBe(123456);
  });

  it('converte valor sem decimais (100 → 10000)', () => {
    expect(parseCurrencyInput('100')).toBe(10000);
  });

  it('completa uma única casa decimal para cêntimos (1234,5 → 123450)', () => {
    expect(parseCurrencyInput('1234,5')).toBe(123450);
  });

  it('converte forma agrupada sem decimais (1.200 → 120000)', () => {
    expect(parseCurrencyInput('1.200')).toBe(120000);
  });

  it('converte múltiplos grupos de milhar (1.234.567,89 → 123456789)', () => {
    expect(parseCurrencyInput('1.234.567,89')).toBe(123456789);
  });

  it('aceita espaços em redor e zero (" 0 " → 0)', () => {
    expect(parseCurrencyInput(' 0 ')).toBe(0);
  });

  it('rejeita string vazia', () => {
    expect(() => parseCurrencyInput('')).toThrow(/introduz um montante/);
    expect(() => parseCurrencyInput('   ')).toThrow(/introduz um montante/);
  });

  it('rejeita texto não-numérico', () => {
    expect(() => parseCurrencyInput('abc')).toThrow(/Valor inválido/);
  });

  it('rejeita ponto como separador decimal (12.34) — PT-PT usa vírgula', () => {
    expect(() => parseCurrencyInput('12.34')).toThrow(/Valor inválido/);
  });

  it('rejeita input negativo — a magnitude é sempre não-negativa', () => {
    expect(() => parseCurrencyInput('-5')).toThrow(/Valor inválido/);
    expect(() => parseCurrencyInput('-1,00')).toThrow(/Valor inválido/);
  });

  it('rejeita mais de duas casas decimais (1,234)', () => {
    expect(() => parseCurrencyInput('1,234')).toThrow(/Valor inválido/);
  });
});

describe('centsToInputValue', () => {
  it('converte cêntimos para string editável (7870 → "78,70")', () => {
    expect(centsToInputValue(7870)).toBe('78,70');
  });

  it('formata zero como "0,00"', () => {
    expect(centsToInputValue(0)).toBe('0,00');
  });

  it('preenche cêntimos de um dígito com zero à esquerda (5 → "0,05")', () => {
    expect(centsToInputValue(5)).toBe('0,05');
  });

  it('não usa símbolo nem separador de milhar (123456 → "1234,56")', () => {
    expect(centsToInputValue(123456)).toBe('1234,56');
  });

  it('rejeita cêntimos negativos', () => {
    expect(() => centsToInputValue(-100)).toThrow(/Montante inválido/);
  });

  it('rejeita input não-inteiro', () => {
    expect(() => centsToInputValue(1.5)).toThrow(/Montante inválido/);
  });
});

describe('round-trip parseCurrencyInput ↔ centsToInputValue', () => {
  it('parseCurrencyInput(centsToInputValue(c)) === c para vários valores', () => {
    for (const cents of [0, 5, 99, 100, 7870, 120000, 123456, 999999]) {
      expect(parseCurrencyInput(centsToInputValue(cents))).toBe(cents);
    }
  });
});

describe('applyDirection', () => {
  it('saída produz amount negativo', () => {
    expect(applyDirection(7870, 'saida')).toBe(-7870);
  });

  it('entrada produz amount positivo', () => {
    expect(applyDirection(7870, 'entrada')).toBe(7870);
  });

  it('zero permanece zero em qualquer direção', () => {
    expect(applyDirection(0, 'saida')).toBe(0);
    expect(applyDirection(0, 'entrada')).toBe(0);
  });

  it('rejeita cêntimos negativos (a direção é a única fonte do sinal)', () => {
    expect(() => applyDirection(-1, 'saida')).toThrow(/Cêntimos inválidos/);
  });

  it('rejeita cêntimos não-inteiros', () => {
    expect(() => applyDirection(1.5, 'entrada')).toThrow(/Cêntimos inválidos/);
  });
});

describe('directionOf', () => {
  it('infere saída a partir de amount negativo', () => {
    expect(directionOf(-7870)).toBe('saida');
  });

  it('infere entrada a partir de amount positivo', () => {
    expect(directionOf(7870)).toBe('entrada');
  });

  it('trata zero como entrada (consistente com applyDirection)', () => {
    expect(directionOf(0)).toBe('entrada');
  });

  it('é o inverso de applyDirection para magnitudes não-nulas', () => {
    for (const cents of [5, 100, 7870, 123456]) {
      expect(directionOf(applyDirection(cents, 'saida'))).toBe('saida');
      expect(directionOf(applyDirection(cents, 'entrada'))).toBe('entrada');
    }
  });
});
