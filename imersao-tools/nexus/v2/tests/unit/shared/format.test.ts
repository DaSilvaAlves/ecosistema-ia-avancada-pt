import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
} from '@/lib/shared/format';

/**
 * Nexus v2 — format.ts unit tests (P1.1 — fecha o ficheiro a 0% coverage)
 *
 * `formatCurrency` usa `Intl.NumberFormat('pt-PT')`, cujo output exacto (posição
 * do símbolo €, separador de milhares NBSP vs ponto) varia com a versão do ICU.
 * Os testes assertam **propriedades robustas** (contém o valor decimal por vírgula,
 * contém €) em vez da string exacta — excepto o ramo `!isFinite`, cujo retorno é
 * um literal fixo no código.
 *
 * `formatDateTime` usa `getHours()`/`getMinutes()` (hora LOCAL). Para não depender
 * do fuso do runner (CI=UTC vs local=Europe/Lisbon), os casos válidos assertam o
 * **formato**; os valores exactos ficam para os ramos determinísticos.
 */

describe('formatCurrency', () => {
  it('formata cêntimos com decimal por vírgula e símbolo €', () => {
    const out = formatCurrency(7870);
    expect(out).toMatch(/78,70/);
    expect(out).toContain('€');
  });

  it('formata milhares (123456 cêntimos → 1234,56 euros)', () => {
    const out = formatCurrency(123456);
    expect(out).toMatch(/234,56/);
    expect(out).toContain('€');
  });

  it('zero → "0,00" com símbolo', () => {
    const out = formatCurrency(0);
    expect(out).toMatch(/0,00/);
    expect(out).toContain('€');
  });

  it('valor negativo mantém o sinal', () => {
    const out = formatCurrency(-7870);
    expect(out).toMatch(/78,70/);
    expect(out).toContain('-');
  });

  it('NaN → "€0,00" (ramo !isFinite, literal fixo)', () => {
    expect(formatCurrency(Number.NaN)).toBe('€0,00');
  });

  it('Infinity → "€0,00" (ramo !isFinite)', () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('€0,00');
  });
});

describe('formatDate', () => {
  it('ISO YYYY-MM-DD → DD/MM/YYYY', () => {
    expect(formatDate('2026-03-14')).toBe('14/03/2026');
  });

  it('ISO completo com hora → só a parte da data', () => {
    expect(formatDate('2026-03-14T15:30:00.000Z')).toBe('14/03/2026');
  });

  it('string vazia → ""', () => {
    expect(formatDate('')).toBe('');
  });

  it('formato inválido (não bate a regex) → ""', () => {
    expect(formatDate('14 de Março')).toBe('');
  });

  it('mês/dia de 1 dígito (não bate \\d{2}) → ""', () => {
    expect(formatDate('2026-3-4')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('string vazia → ""', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('data inválida (NaN getTime) → ""', () => {
    expect(formatDateTime('não é uma data')).toBe('');
  });

  it('ISO válido → "DD/MM/YYYY HH:MM" (formato)', () => {
    const out = formatDateTime('2026-03-14T12:00:00');
    expect(out).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });
});

describe('formatDuration', () => {
  it('< 1h → MM:SS', () => {
    expect(formatDuration(125)).toBe('02:05');
  });

  it('>= 1h → HH:MM:SS', () => {
    expect(formatDuration(3725)).toBe('01:02:05');
  });

  it('exactamente 1h → 01:00:00', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
  });

  it('zero → 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('segundos fraccionários são truncados (Math.floor)', () => {
    expect(formatDuration(125.9)).toBe('02:05');
  });

  it('negativo → 00:00 (ramo de guarda)', () => {
    expect(formatDuration(-5)).toBe('00:00');
  });

  it('NaN → 00:00 (ramo !isFinite)', () => {
    expect(formatDuration(Number.NaN)).toBe('00:00');
  });
});
