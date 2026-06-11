import { describe, it, expect } from 'vitest';
import { canStructure, countWords, STRUCTURE_MIN_CHARS } from '@/lib/brain-dump/input';

/**
 * Nexus v2 — Brain Dump input helpers tests (Story 5.6 — AC2)
 *
 * Funções puras: contagem de palavras + regra de threshold (≥ 50 chars). Pares
 * positivo/negativo, fronteira 49/50, e só-espaços (não-tautológico).
 */

describe('countWords', () => {
  it('devolve 0 para string vazia ou só-espaços', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('\n\t  \n')).toBe(0);
  });

  it('conta palavras separadas por espaços, tabs e quebras de linha', () => {
    expect(countWords('uma')).toBe(1);
    expect(countWords('duas palavras')).toBe(2);
    expect(countWords('uma\tduas\ntrês')).toBe(3);
  });

  it('trata espaços múltiplos como um único separador', () => {
    expect(countWords('  uma    duas   ')).toBe(2);
  });

  it('conta tokens com pontuação como palavras', () => {
    expect(countWords('olá, mundo!')).toBe(2);
  });
});

describe('canStructure', () => {
  it('limiar é 50 caracteres', () => {
    expect(STRUCTURE_MIN_CHARS).toBe(50);
  });

  it('é false abaixo do limiar (fronteira 49 chars)', () => {
    expect(canStructure('a'.repeat(49))).toBe(false);
  });

  it('é true a partir do limiar (fronteira 50 chars)', () => {
    expect(canStructure('a'.repeat(50))).toBe(true);
    expect(canStructure('a'.repeat(120))).toBe(true);
  });

  it('é false para string vazia', () => {
    expect(canStructure('')).toBe(false);
  });

  it('é false para só-espaços, mesmo acima de 50 caracteres (trim)', () => {
    expect(canStructure(' '.repeat(80))).toBe(false);
  });

  it('conta pelo comprimento após trim (ignora espaços nas pontas)', () => {
    expect(canStructure(`   ${'a'.repeat(50)}   `)).toBe(true);
    expect(canStructure(`   ${'a'.repeat(49)}   `)).toBe(false);
  });
});
