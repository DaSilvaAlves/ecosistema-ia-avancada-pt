import { describe, it, expect } from 'vitest';
import {
  STRUCTURE_THRESHOLD,
  shouldSuggestStructure,
  StructuredDiarioResponseSchema,
  parseStructuredDiario,
  hasStructuredContent,
} from '@/lib/diario/ai-estrutura';

/**
 * Nexus v2 — ai-estrutura (helper puro) unit tests (Story 5.4 — AC1/AC5)
 *
 * Funções puras → cobertura-alvo ~100% (NFR17). Sem mock de `fetch`.
 */

describe('shouldSuggestStructure (AC1 — threshold 100 chars)', () => {
  it('exactamente 100 caracteres NÃO activa (estritamente > 100)', () => {
    expect(shouldSuggestStructure('a'.repeat(100))).toBe(false);
  });

  it('99 caracteres NÃO activa', () => {
    expect(shouldSuggestStructure('a'.repeat(99))).toBe(false);
  });

  it('101 caracteres activa', () => {
    expect(shouldSuggestStructure('a'.repeat(101))).toBe(true);
  });

  it('string vazia NÃO activa', () => {
    expect(shouldSuggestStructure('')).toBe(false);
  });

  it('string só de espaços NÃO activa (conta após trim)', () => {
    expect(shouldSuggestStructure(' '.repeat(200))).toBe(false);
  });

  it('texto com espaços no início/fim conta o conteúdo após trim', () => {
    // 101 chars de conteúdo + espaços à volta → activa.
    expect(shouldSuggestStructure('   ' + 'a'.repeat(101) + '   ')).toBe(true);
    // 100 chars de conteúdo + espaços → NÃO activa (trim remove os espaços).
    expect(shouldSuggestStructure('   ' + 'a'.repeat(100) + '   ')).toBe(false);
  });

  it('unicode PT-PT com acentos conta cada caracter (101 chars acentuados)', () => {
    const acentuado = 'á'.repeat(101);
    expect(acentuado.length).toBe(101);
    expect(shouldSuggestStructure(acentuado)).toBe(true);
    expect(shouldSuggestStructure('á'.repeat(100))).toBe(false);
  });

  it('STRUCTURE_THRESHOLD é 100', () => {
    expect(STRUCTURE_THRESHOLD).toBe(100);
  });
});

describe('StructuredDiarioResponseSchema (.strict()) — AC5', () => {
  it('aceita os 3 campos presentes', () => {
    const value = { whatHappened: 'fui ao mercado', whatLearned: 'a poupar', whatFelt: 'feliz' };
    expect(StructuredDiarioResponseSchema.parse(value)).toEqual(value);
  });

  it('aceita objecto vazio (todos os campos opcionais)', () => {
    expect(StructuredDiarioResponseSchema.parse({})).toEqual({});
  });

  it('aceita apenas 1 bucket (AI omite os que o texto não suporta)', () => {
    expect(StructuredDiarioResponseSchema.parse({ whatHappened: 'só factos' })).toEqual({
      whatHappened: 'só factos',
    });
  });

  it('REJEITA campo renomeado (whatHappened → happened) — contrato falsificável', () => {
    expect(StructuredDiarioResponseSchema.safeParse({ happened: 'x' }).success).toBe(false);
  });

  it('REJEITA campo extra (whatPlanned) por .strict()', () => {
    const value = { whatHappened: 'x', whatPlanned: 'y' };
    expect(StructuredDiarioResponseSchema.safeParse(value).success).toBe(false);
  });

  it('REJEITA tipo errado (whatHappened number)', () => {
    expect(StructuredDiarioResponseSchema.safeParse({ whatHappened: 42 }).success).toBe(false);
  });
});

describe('parseStructuredDiario — lança PT-PT em shape inválido (AC4/AC5)', () => {
  it('devolve o objecto validado quando o shape é correcto', () => {
    expect(parseStructuredDiario({ whatFelt: 'cansado' })).toEqual({ whatFelt: 'cansado' });
  });

  it('lança Error PT-PT quando o campo é renomeado', () => {
    expect(() => parseStructuredDiario({ happened: 'x' })).toThrow(
      /formato inesperado/,
    );
  });

  it('lança quando o valor não é um objecto', () => {
    expect(() => parseStructuredDiario('não é objecto')).toThrow(/formato inesperado/);
    expect(() => parseStructuredDiario(null)).toThrow(/formato inesperado/);
  });
});

describe('hasStructuredContent', () => {
  it('true quando pelo menos um bucket tem conteúdo', () => {
    expect(hasStructuredContent({ whatHappened: 'algo' })).toBe(true);
    expect(hasStructuredContent({ whatFelt: 'triste' })).toBe(true);
  });

  it('false para objecto vazio', () => {
    expect(hasStructuredContent({})).toBe(false);
  });

  it('false quando todos os buckets são strings só de espaços', () => {
    expect(hasStructuredContent({ whatHappened: '   ', whatLearned: '' })).toBe(false);
  });
});
