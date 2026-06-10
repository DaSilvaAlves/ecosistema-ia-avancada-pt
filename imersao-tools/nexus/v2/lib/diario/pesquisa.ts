import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — Pesquisa full-text diário (Story 5.5 — FR45)
 *
 * Helper PURO (sem `import` do Dexie) com a lógica de matching/ranking/highlight
 * que a `searchJournalEntries` (`lib/db/repos/journal-entries.ts`) delega. O
 * EPIC-5 §5 exige "lógica de pesquisa/indexação em helper puro `lib/diario/**`"
 * — por isso o repo só faz `toArray()` e chama estas funções.
 *
 * Sem indexação dedicada: o volume de entradas é baixo (1/dia), o matching
 * in-memory é suficiente (decisão herdada da `searchJournalEntries` e documentada
 * no seu docstring). Sem índice full-text.
 *
 * Tokenização multi-termo AND + normalização NFD para diacríticos PT-PT
 * (`"mae"` bate `"mãe"`). Sem OR, sem NEAR — não há FR que o exija.
 *
 * Reutilização pela Story 5.10 (PLANEADO — pesquisa de `knowledge_notes`):
 * `normalizeText` e `tokenize` são genéricas (operam sobre `string`, sem
 * acoplamento a `JournalEntry`) e podem ser importadas directamente. As funções
 * `buildHaystack`/`searchEntries` são específicas de `JournalEntry`.
 */

/** Segmento de texto para renderização com highlight. */
export interface HighlightSegment {
  /** Fatia do texto original (preservando a capitalização original). */
  text: string;
  /** `true` se esta fatia corresponde a um termo de pesquisa. */
  isMatch: boolean;
}

/**
 * Normaliza texto para matching insensível a maiúsculas e diacríticos PT-PT:
 * NFD decompõe os caracteres acentuados, `/\p{M}/gu` remove as marcas
 * combinantes (acentos, til, cedilha decomposta), lowercase + trim.
 *
 * A flag `u` em `\p{M}` é obrigatória (Unicode property escapes) — suportada em
 * todos os runtimes alvo do Nexus (Edge + browser modernos).
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Divide a query em termos normalizados, filtrando termos vazios. Espaços
 * múltiplos colapsam. `tokenize("aprendi  hoje")` → `["aprendi", "hoje"]`.
 */
export function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/**
 * AND: todos os termos têm de estar presentes no haystack. O haystack é
 * normalizado aqui; os `terms` assumem-se já normalizados (vindos de `tokenize`).
 * Lista de termos vazia → `false` (query vazia não bate nada).
 */
export function matchesAllTerms(haystack: string, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const normalizedHaystack = normalizeText(haystack);
  if (normalizedHaystack === '') return false;
  return terms.every((term) => normalizedHaystack.includes(term));
}

/**
 * Concatena os campos pesquisáveis de uma entrada (corpo + estrutura AI) num só
 * haystack. NÃO normaliza — `matchesAllTerms` normaliza ao comparar. Coerente
 * com o haystack original da `searchJournalEntries` (`journal-entries.ts:73-78`).
 */
export function buildHaystack(entry: JournalEntry): string {
  return [
    entry.bodyMarkdown,
    entry.structuredAI?.whatHappened,
    entry.structuredAI?.whatLearned,
    entry.structuredAI?.whatFelt,
  ]
    .filter((s): s is string => typeof s === 'string')
    .join(' ');
}

/** Ordena desc por `date` (`YYYY-MM-DD` ordena lexicalmente) — cópia, não muta. */
export function rankByRecency(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Pesquisa multi-termo AND sobre as entradas, ordenada por recência. Função
 * pura — recebe as entradas já carregadas (o repo faz o `toArray()`). Query
 * vazia (sem termos) → `[]`.
 */
export function searchEntries(entries: JournalEntry[], query: string): JournalEntry[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const matched = entries.filter((entry) => matchesAllTerms(buildHaystack(entry), terms));
  return rankByRecency(matched);
}

/**
 * Divide `text` em segmentos `{ text, isMatch }[]` para renderização com
 * highlight. Multi-termo (coerente com a pesquisa AND): destaca qualquer
 * ocorrência de qualquer termo da query. Case-insensitive e diacrítico-insensível
 * (PT-PT): o matching é feito sobre a forma normalizada mas os segmentos
 * preservam o texto ORIGINAL (incluindo acentos e capitalização).
 *
 * Sem match / query vazia → `[{ text, isMatch: false }]` (um único segmento).
 */
export function highlightMatches(text: string, query: string): HighlightSegment[] {
  const terms = tokenize(query);
  if (terms.length === 0 || text === '') {
    return [{ text, isMatch: false }];
  }

  // NFC primeiro: garante que base + combinante já decompostos no texto de
  // entrada (NFD) ficam fundidos num só code point, para `Array.from` dar uma
  // posição por carácter. Depois normaliza char-a-char (NFD + remoção de marcas)
  // — assim `normalizedChars` e `original` alinham posição-a-posição.
  const nfcText = text.normalize('NFC');
  const original = Array.from(nfcText);
  const normalizedChars = original.map((char) =>
    char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(),
  );

  // Marca quais posições (em índices de char original) pertencem a um match.
  const isMatchAt = new Array<boolean>(original.length).fill(false);
  for (const term of terms) {
    if (term.length === 0) continue;
    for (let start = 0; start + term.length <= normalizedChars.length; start++) {
      let hit = true;
      for (let k = 0; k < term.length; k++) {
        if (normalizedChars[start + k] !== term[k]) {
          hit = false;
          break;
        }
      }
      if (hit) {
        for (let k = 0; k < term.length; k++) isMatchAt[start + k] = true;
      }
    }
  }

  // Agrupa posições consecutivas com o mesmo `isMatch` num só segmento.
  const segments: HighlightSegment[] = [];
  let current = '';
  let currentMatch = isMatchAt[0] ?? false;
  for (let i = 0; i < original.length; i++) {
    if (isMatchAt[i] === currentMatch) {
      current += original[i];
    } else {
      segments.push({ text: current, isMatch: currentMatch });
      current = original[i];
      currentMatch = isMatchAt[i];
    }
  }
  if (current !== '') segments.push({ text: current, isMatch: currentMatch });
  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

/**
 * Extrai ~`maxLen` chars de `text` em redor do primeiro match de qualquer termo
 * de `terms` (coerente com a pesquisa multi-termo AND — `[DEV-D-5.5-EXCERPT]`).
 *
 * `[DEV-D-5.5-EXCERPT]`: O AC1/OBS-5.5-1 referia `extractExcerpt(text, term)`
 * (single-term), mas a pesquisa é multi-termo AND. Decisão: a assinatura aceita
 * `terms: string[]` (já normalizados via `tokenize`) e centra o excerto no
 * PRIMEIRO match no haystack entre todos os termos — coerente com o uso
 * multi-termo do `highlightMatches`. Se nenhum termo bater (não deve acontecer
 * pós-filtragem) → devolve o início do texto truncado.
 *
 * Adiciona `"…"` nos extremos quando o texto foi truncado.
 */
export function extractExcerpt(text: string, terms: string[], maxLen = 100): string {
  if (text === '') return '';

  // NFC primeiro: funde base + combinante (caso o texto já venha em NFD) para
  // dar uma posição por carácter em `Array.from`.
  const nfcText = text.normalize('NFC');
  const chars = Array.from(nfcText);
  if (chars.length <= maxLen) return nfcText;

  // Forma normalizada char-a-char, alinhada posição-a-posição com `chars` (cada
  // carácter NFC vira a sua forma sem acentos/lowercase, possivelmente ''). O
  // join dá uma string normalizada cujo `indexOf` mapeia 1:1 ao índice de char
  // quando os termos não contêm marcas (garantido por `tokenize`).
  const normalizedChars = chars.map((char) =>
    char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(),
  );
  const normalized = normalizedChars.join('');

  // Primeiro match (índice mais baixo, em char index) entre todos os termos.
  let matchIndex = -1;
  for (const term of terms) {
    if (term.length === 0) continue;
    const idx = normalized.indexOf(term);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
    }
  }

  // Sem match → início do texto.
  if (matchIndex === -1) {
    return `${chars.slice(0, maxLen).join('').trimEnd()}…`;
  }

  // Centra a janela no match (índices de char).
  const half = Math.floor(maxLen / 2);
  const end = Math.min(chars.length, Math.max(0, matchIndex - half) + maxLen);
  const start = Math.max(0, end - maxLen);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < chars.length ? '…' : '';
  return `${prefix}${chars.slice(start, end).join('').trim()}${suffix}`;
}
