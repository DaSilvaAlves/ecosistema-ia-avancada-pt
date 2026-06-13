import { describe, it, expect } from 'vitest';
import {
  buildKnowledgeHaystack,
  rankByUpdatedAt,
  searchKnowledgeNotes,
  normalizeText,
  tokenize,
  matchesAllTerms,
  highlightMatches,
  extractExcerpt,
} from '@/lib/conhecimento/pesquisa';
import type { KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — conhecimento/pesquisa.ts helper puro tests (Story 5.10 — AC8)
 *
 * Cobertura ~100% das funções NOVAS (`buildKnowledgeHaystack`, `rankByUpdatedAt`,
 * `searchKnowledgeNotes`) + verificação dos re-exports da 5.5. Testes
 * não-tautológicos: diacríticos cruzados PT-PT, AND multi-termo real, haystack
 * com/sem `sourceUrl`, ordenação por `updatedAt`.
 */

let counter = 0;
function makeNote(overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: `n-${++counter}`,
    notebookId: 'nb-1',
    title: 'Nota de teste',
    bodyMarkdown: 'Corpo da nota.',
    tags: [],
    updatedAt: 1_000,
    ...overrides,
  };
}

describe('buildKnowledgeHaystack', () => {
  it('concatena title + bodyMarkdown + sourceUrl', () => {
    const note = makeNote({
      title: 'React 19',
      bodyMarkdown: 'Aprendi sobre hooks',
      sourceUrl: 'https://react.dev',
    });
    expect(buildKnowledgeHaystack(note)).toBe(
      'React 19 Aprendi sobre hooks https://react.dev',
    );
  });

  it('sem sourceUrl → sem trailing "undefined" nem espaço residual', () => {
    const note = makeNote({ title: 'A', bodyMarkdown: 'B', sourceUrl: undefined });
    expect(buildKnowledgeHaystack(note)).toBe('A B');
    expect(buildKnowledgeHaystack(note)).not.toContain('undefined');
  });
});

describe('rankByUpdatedAt', () => {
  it('ordena desc por updatedAt (epoch ms) sem mutar a prop', () => {
    const notes = [
      makeNote({ updatedAt: 100 }),
      makeNote({ updatedAt: 300 }),
      makeNote({ updatedAt: 200 }),
    ];
    const snapshot = notes.map((n) => n.updatedAt);
    const ranked = rankByUpdatedAt(notes);
    expect(ranked.map((n) => n.updatedAt)).toEqual([300, 200, 100]);
    // Não muta o array original.
    expect(notes.map((n) => n.updatedAt)).toEqual(snapshot);
  });
});

describe('searchKnowledgeNotes', () => {
  it('query vazia → []', () => {
    expect(searchKnowledgeNotes([makeNote()], '')).toEqual([]);
    expect(searchKnowledgeNotes([makeNote()], '   ')).toEqual([]);
  });

  it('1 termo case-insensitive bate em title', () => {
    const notes = [
      makeNote({ updatedAt: 100, title: 'Reunião sobre ORÇAMENTO' }),
      makeNote({ updatedAt: 200, title: 'Nota irrelevante' }),
    ];
    const result = searchKnowledgeNotes(notes, 'orçamento');
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe('Reunião sobre ORÇAMENTO');
  });

  it('1 termo bate em bodyMarkdown', () => {
    const notes = [
      makeNote({ title: 'Título neutro', bodyMarkdown: 'aprendi sobre Suspense' }),
    ];
    expect(searchKnowledgeNotes(notes, 'suspense')).toHaveLength(1);
  });

  it('1 termo bate em sourceUrl', () => {
    const notes = [
      makeNote({
        title: 'Título neutro',
        bodyMarkdown: 'corpo neutro',
        sourceUrl: 'https://kentcdodds.com/blog',
      }),
    ];
    expect(searchKnowledgeNotes(notes, 'kentcdodds')).toHaveLength(1);
  });

  it('2 termos AND: bate só quando ambos presentes; só 1 → []', () => {
    const notes = [
      makeNote({ updatedAt: 100, title: 'React', bodyMarkdown: 'aprendi hooks hoje' }),
      makeNote({ updatedAt: 200, title: 'React', bodyMarkdown: 'aprendi ontem' }),
    ];
    const both = searchKnowledgeNotes(notes, 'aprendi hooks');
    expect(both).toHaveLength(1);
    expect(both[0]!.bodyMarkdown).toBe('aprendi hooks hoje');
    const none = searchKnowledgeNotes(notes, 'aprendi inexistente');
    expect(none).toEqual([]);
  });

  it('diacríticos PT-PT: "area" bate título "Área X" e vice-versa', () => {
    const comAcento = [makeNote({ title: 'Área de Trabalho' })];
    expect(searchKnowledgeNotes(comAcento, 'area')).toHaveLength(1);
    const semAcento = [makeNote({ title: 'Area de Trabalho' })];
    expect(searchKnowledgeNotes(semAcento, 'área')).toHaveLength(1);
  });

  it('resultados ordenados desc por updatedAt', () => {
    const notes = [
      makeNote({ updatedAt: 100, bodyMarkdown: 'projecto' }),
      makeNote({ updatedAt: 500, bodyMarkdown: 'projecto' }),
      makeNote({ updatedAt: 300, bodyMarkdown: 'projecto' }),
    ];
    expect(
      searchKnowledgeNotes(notes, 'projecto').map((n) => n.updatedAt),
    ).toEqual([500, 300, 100]);
  });

  it('nenhuma nota corresponde → []', () => {
    const notes = [makeNote({ title: 'A', bodyMarkdown: 'B' })];
    expect(searchKnowledgeNotes(notes, 'inexistente')).toEqual([]);
  });
});

describe('re-exports da 5.5 (sem duplicação — R11/T2.5)', () => {
  it('normalizeText, tokenize, matchesAllTerms estão disponíveis no sub-módulo', () => {
    expect(normalizeText('  Área ')).toBe('area');
    expect(tokenize('aprendi React')).toEqual(['aprendi', 'react']);
    expect(matchesAllTerms('aprendi react hoje', ['aprendi', 'react'])).toBe(true);
  });

  it('highlightMatches e extractExcerpt estão disponíveis no sub-módulo', () => {
    const segs = highlightMatches('antes alvo depois', 'alvo');
    expect(segs.find((s) => s.isMatch)?.text).toBe('alvo');
    expect(extractExcerpt('texto curto', ['texto'])).toBe('texto curto');
  });
});
