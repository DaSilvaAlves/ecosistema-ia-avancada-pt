import { describe, it, expect } from 'vitest';
import { formatPtDate } from '@/lib/diario/mood-scale';

/**
 * Nexus v2 — mood-scale `formatPtDate` tests (Story 5.3 — F3 CR Iter 1)
 *
 * Cobre o caminho feliz (ISO bem-formado) e o ramo defensivo (input malformado
 * devolve a string original em vez de `"undefined/undefined/undefined"`).
 * Par positivo/negativo — não-tautológico.
 */
describe('formatPtDate', () => {
  it('converte ISO YYYY-MM-DD para DD/MM/YYYY (PT-PT)', () => {
    expect(formatPtDate('2026-06-09')).toBe('09/06/2026');
    expect(formatPtDate('2025-01-31')).toBe('31/01/2025');
  });

  it('devolve a string original quando o input não é ISO bem-formado (defensivo)', () => {
    // Sem o guard, estes produziam "undefined/.../..." em vez de devolver o input.
    expect(formatPtDate('')).toBe('');
    expect(formatPtDate('2026')).toBe('2026');
    expect(formatPtDate('2026-06')).toBe('2026-06');
    expect(formatPtDate('lixo')).toBe('lixo');
    expect(formatPtDate('2026--09')).toBe('2026--09');
  });
});
