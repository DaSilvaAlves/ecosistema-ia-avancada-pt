import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  tokenize,
  matchesAllTerms,
  buildHaystack,
  rankByRecency,
  searchEntries,
  highlightMatches,
  extractExcerpt,
} from '@/lib/diario/pesquisa';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — pesquisa.ts helper puro tests (Story 5.5 — AC7)
 *
 * Cobertura ~100% do helper: normalização NFD/diacríticos PT-PT, tokenização AND
 * multi-termo, matching em bodyMarkdown + structuredAI.*, highlight, excerpt,
 * ranking por recência. Testes não-tautológicos (diacríticos cruzados, AND real).
 */

let counter = 0;
function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: `j-${++counter}`,
    date: '2026-06-07',
    mood: 3,
    bodyMarkdown: 'Hoje foi um dia produtivo.',
    ...overrides,
  };
}

describe('normalizeText', () => {
  it('remove diacríticos PT-PT, lowercase e trim', () => {
    expect(normalizeText('  Mãe ')).toBe('mae');
    expect(normalizeText('CORAÇÃO')).toBe('coracao');
    expect(normalizeText('São João')).toBe('sao joao');
  });

  it('string vazia → ""', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('tokenize', () => {
  it('divide por espaço e normaliza cada termo', () => {
    expect(tokenize('aprendi hoje')).toEqual(['aprendi', 'hoje']);
    expect(tokenize('Mãe Pai')).toEqual(['mae', 'pai']);
  });

  it('colapsa espaços múltiplos e ignora vazios', () => {
    expect(tokenize('  aprendi    hoje  ')).toEqual(['aprendi', 'hoje']);
  });

  it('query vazia → []', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('matchesAllTerms', () => {
  it('AND: bate só quando todos os termos presentes', () => {
    expect(matchesAllTerms('aprendi muito hoje', ['aprendi', 'hoje'])).toBe(true);
    expect(matchesAllTerms('aprendi muito ontem', ['aprendi', 'hoje'])).toBe(false);
  });

  it('1 de 2 termos → false', () => {
    expect(matchesAllTerms('só aprendi', ['aprendi', 'hoje'])).toBe(false);
  });

  it('diacríticos: termo "mae" bate haystack "mãe" e vice-versa', () => {
    expect(matchesAllTerms('falei com a minha mãe', ['mae'])).toBe(true);
    expect(matchesAllTerms('falei com a minha mae', ['mae'])).toBe(true);
  });

  it('termos vazios → false; haystack vazio → false', () => {
    expect(matchesAllTerms('texto', [])).toBe(false);
    expect(matchesAllTerms('', ['x'])).toBe(false);
  });
});

describe('buildHaystack', () => {
  it('concatena bodyMarkdown + structuredAI.*', () => {
    const entry = makeEntry({
      bodyMarkdown: 'corpo',
      structuredAI: { whatHappened: 'aconteceu', whatLearned: 'aprendi', whatFelt: 'senti' },
    });
    expect(buildHaystack(entry)).toBe('corpo aconteceu aprendi senti');
  });

  it('ignora campos ausentes de structuredAI', () => {
    const entry = makeEntry({ bodyMarkdown: 'corpo', structuredAI: { whatLearned: 'X' } });
    expect(buildHaystack(entry)).toBe('corpo X');
  });

  it('sem structuredAI → só bodyMarkdown', () => {
    expect(buildHaystack(makeEntry({ bodyMarkdown: 'corpo' }))).toBe('corpo');
  });
});

describe('rankByRecency', () => {
  it('ordena desc por date sem mutar a prop', () => {
    const entries = [
      makeEntry({ date: '2026-06-01' }),
      makeEntry({ date: '2026-06-10' }),
      makeEntry({ date: '2026-06-05' }),
    ];
    const snapshot = entries.map((e) => e.date);
    const ranked = rankByRecency(entries);
    expect(ranked.map((e) => e.date)).toEqual(['2026-06-10', '2026-06-05', '2026-06-01']);
    expect(entries.map((e) => e.date)).toEqual(snapshot);
  });
});

describe('searchEntries', () => {
  it('query vazia → []', () => {
    expect(searchEntries([makeEntry()], '')).toEqual([]);
    expect(searchEntries([makeEntry()], '   ')).toEqual([]);
  });

  it('1 termo case-insensitive bate bodyMarkdown', () => {
    const entries = [
      makeEntry({ date: '2026-06-01', bodyMarkdown: 'Reunião sobre o ORÇAMENTO' }),
      makeEntry({ date: '2026-06-02', bodyMarkdown: 'Dia normal' }),
    ];
    const result = searchEntries(entries, 'orçamento');
    expect(result).toHaveLength(1);
    expect(result[0]!.date).toBe('2026-06-01');
  });

  it('2 termos AND: bate só quando ambos presentes', () => {
    const entries = [
      makeEntry({ date: '2026-06-01', bodyMarkdown: 'aprendi muito hoje' }),
      makeEntry({ date: '2026-06-02', bodyMarkdown: 'aprendi ontem' }),
    ];
    const both = searchEntries(entries, 'aprendi hoje');
    expect(both.map((e) => e.date)).toEqual(['2026-06-01']);
    const none = searchEntries(entries, 'aprendi amanhã');
    expect(none).toEqual([]);
  });

  it('match em structuredAI.* além de bodyMarkdown', () => {
    const entries = [
      makeEntry({
        date: '2026-06-03',
        bodyMarkdown: 'corpo neutro',
        structuredAI: { whatLearned: 'orçamento participativo' },
      }),
    ];
    expect(searchEntries(entries, 'orçamento')).toHaveLength(1);
  });

  it('diacríticos PT-PT: "mae" bate "mãe"', () => {
    const entries = [makeEntry({ bodyMarkdown: 'Liguei à minha mãe' })];
    expect(searchEntries(entries, 'mae')).toHaveLength(1);
    expect(searchEntries([makeEntry({ bodyMarkdown: 'a minha mae' })], 'mãe')).toHaveLength(1);
  });

  it('resultados ordenados desc por date', () => {
    const entries = [
      makeEntry({ date: '2026-06-01', bodyMarkdown: 'projecto' }),
      makeEntry({ date: '2026-06-05', bodyMarkdown: 'projecto' }),
    ];
    expect(searchEntries(entries, 'projecto').map((e) => e.date)).toEqual([
      '2026-06-05',
      '2026-06-01',
    ]);
  });
});

describe('highlightMatches', () => {
  it('1 match → 3 segmentos (não-match / match / não-match)', () => {
    const segs = highlightMatches('antes alvo depois', 'alvo');
    expect(segs).toEqual([
      { text: 'antes ', isMatch: false },
      { text: 'alvo', isMatch: true },
      { text: ' depois', isMatch: false },
    ]);
  });

  it('preserva capitalização e acentos originais no segmento', () => {
    const segs = highlightMatches('A minha Mãe ligou', 'mae');
    const match = segs.find((s) => s.isMatch);
    expect(match?.text).toBe('Mãe');
  });

  it('múltiplos termos: destaca ambos', () => {
    const segs = highlightMatches('aprendi muito hoje', 'aprendi hoje');
    const matches = segs.filter((s) => s.isMatch).map((s) => s.text);
    expect(matches).toContain('aprendi');
    expect(matches).toContain('hoje');
  });

  it('sem match → 1 segmento isMatch:false', () => {
    expect(highlightMatches('texto sem alvo', 'inexistente')).toEqual([
      { text: 'texto sem alvo', isMatch: false },
    ]);
  });

  it('query vazia → 1 segmento isMatch:false', () => {
    expect(highlightMatches('qualquer texto', '')).toEqual([
      { text: 'qualquer texto', isMatch: false },
    ]);
  });

  it('texto vazio → 1 segmento vazio isMatch:false', () => {
    expect(highlightMatches('', 'alvo')).toEqual([{ text: '', isMatch: false }]);
  });

  it('texto em NFD destaca o termo sem desalinhar índices', () => {
    const nfdText = 'a minha mãe'.normalize('NFD');
    const segs = highlightMatches(nfdText, 'mae');
    const match = segs.find((s) => s.isMatch);
    // O segmento destacado é a palavra completa (NFC) — sem cortar o acento.
    expect(match?.text.normalize('NFC')).toBe('mãe');
  });
});

describe('extractExcerpt', () => {
  it('texto curto (≤ maxLen) devolve tudo sem reticências', () => {
    expect(extractExcerpt('texto curto', ['texto'])).toBe('texto curto');
  });

  it('match no início: reticências só no fim', () => {
    const text = 'alvo ' + 'x'.repeat(200);
    const ex = extractExcerpt(text, ['alvo'], 50);
    expect(ex.startsWith('alvo')).toBe(true);
    expect(ex.endsWith('…')).toBe(true);
    expect(ex.startsWith('…')).toBe(false);
  });

  it('match no meio: reticências em ambos os extremos', () => {
    const text = 'a'.repeat(100) + ' alvo ' + 'b'.repeat(100);
    const ex = extractExcerpt(text, ['alvo'], 40);
    expect(ex.startsWith('…')).toBe(true);
    expect(ex.endsWith('…')).toBe(true);
    expect(ex).toContain('alvo');
  });

  it('match no fim: reticências só no início', () => {
    const text = 'x'.repeat(200) + ' alvo';
    const ex = extractExcerpt(text, ['alvo'], 50);
    expect(ex.startsWith('…')).toBe(true);
    expect(ex.endsWith('alvo')).toBe(true);
  });

  it('multi-termo: centra no primeiro match no haystack', () => {
    const text = 'inicio ' + 'z'.repeat(200) + ' beta ' + 'y'.repeat(50) + ' alfa';
    // 'alfa' aparece depois de 'beta' no texto; o primeiro match é 'beta'.
    const ex = extractExcerpt(text, ['alfa', 'beta'], 40);
    expect(ex).toContain('beta');
  });

  it('sem match → início do texto truncado com reticências', () => {
    const text = 'x'.repeat(200);
    const ex = extractExcerpt(text, ['inexistente'], 50);
    expect(ex.endsWith('…')).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(51);
  });

  it('texto vazio → ""', () => {
    expect(extractExcerpt('', ['alvo'])).toBe('');
  });

  it('texto em NFD (base + combinante separados) alinha o excerto correctamente', () => {
    // "ção" decomposto: 'c' + 'a' + combining tilde + 'o' + combining cedilla.
    const nfdText = 'orientação'.normalize('NFD') + ' ' + 'z'.repeat(200);
    const ex = extractExcerpt(nfdText, ['orientacao'], 40);
    // O excerto começa pela palavra-alvo (forma NFC) e não corta a meio do acento.
    expect(ex.normalize('NFC').startsWith('orientação')).toBe(true);
  });
});
