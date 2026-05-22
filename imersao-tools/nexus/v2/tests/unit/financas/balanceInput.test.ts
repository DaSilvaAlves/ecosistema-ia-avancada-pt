import { describe, expect, it } from 'vitest';
import {
  balanceToInput,
  parseBalanceInput,
  parseCardLimit,
} from '@/lib/financas/balanceInput';

/**
 * Nexus v2 — Testes de `lib/financas/balanceInput.ts` (Story 3.5, AC11)
 *
 * Cobre as 3 funções puras de entrada de saldo de conta e limite de cartão:
 * `parseBalanceInput` (magnitude + sinal), `balanceToInput` (decomposição
 * inversa) e `parseCardLimit` (limite opcional → `null`).
 */

describe('parseBalanceInput', () => {
  it('aplica sinal positivo a uma magnitude com negative=false', () => {
    expect(parseBalanceInput('1.234,56', false)).toBe(123456);
    expect(parseBalanceInput('100', false)).toBe(10000);
    expect(parseBalanceInput('78,70', false)).toBe(7870);
  });

  it('aplica sinal negativo a uma magnitude com negative=true', () => {
    expect(parseBalanceInput('1.234,56', true)).toBe(-123456);
    expect(parseBalanceInput('1,00', true)).toBe(-100);
  });

  it('devolve 0 exacto (sem -0) para magnitude zero em ambos os sinais', () => {
    const zeroPositive = parseBalanceInput('0', false);
    const zeroNegative = parseBalanceInput('0,00', true);
    expect(zeroPositive).toBe(0);
    expect(zeroNegative).toBe(0);
    // Garante que o sinal negativo não produz -0 (negative zero).
    expect(Object.is(zeroNegative, -0)).toBe(false);
    expect(Object.is(zeroNegative, 0)).toBe(true);
  });

  it('parseia a forma agrupada PT-PT (separador de milhar ponto)', () => {
    expect(parseBalanceInput('1.000.000,00', false)).toBe(100000000);
  });

  it('lança em string vazia ou mal-formada', () => {
    expect(() => parseBalanceInput('', false)).toThrow();
    expect(() => parseBalanceInput('abc', false)).toThrow();
    expect(() => parseBalanceInput('12.34', false)).toThrow();
  });
});

describe('balanceToInput', () => {
  it('decompõe um saldo positivo em magnitude + negative=false', () => {
    expect(balanceToInput(123456)).toEqual({ magnitude: '1234,56', negative: false });
  });

  it('decompõe um saldo negativo em magnitude + negative=true', () => {
    expect(balanceToInput(-100)).toEqual({ magnitude: '1,00', negative: true });
  });

  it('decompõe zero em magnitude 0,00 + negative=false', () => {
    expect(balanceToInput(0)).toEqual({ magnitude: '0,00', negative: false });
  });

  it('faz round-trip com parseBalanceInput (positivo, negativo, zero)', () => {
    for (const cents of [123456, -123456, 0, -100, 50099]) {
      const { magnitude, negative } = balanceToInput(cents);
      expect(parseBalanceInput(magnitude, negative)).toBe(cents);
    }
  });
});

describe('parseCardLimit', () => {
  it('devolve null para string vazia ou só espaços', () => {
    expect(parseCardLimit('')).toBeNull();
    expect(parseCardLimit('   ')).toBeNull();
  });

  it('converte um limite válido em cêntimos', () => {
    expect(parseCardLimit('2.500,00')).toBe(250000);
    expect(parseCardLimit('1000')).toBe(100000);
  });

  it('lança em string não-vazia mas mal-formada', () => {
    expect(() => parseCardLimit('abc')).toThrow();
    expect(() => parseCardLimit('2,500')).toThrow();
  });
});
