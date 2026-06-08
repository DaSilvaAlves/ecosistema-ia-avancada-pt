import { db } from '@/lib/db/client';
import { JournalEntrySchema } from '@/lib/db/schemas';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — Repository para `journal_entries` (Story 5.1 — FR42/FR44/FR45)
 *
 * Encapsula o acesso à tabela Dexie `journal_entries` (que já existe em
 * `version(1)` com os índices `date, mood` — scaffold Story 0.3, client.ts:93).
 * As Stories 5.3 (CRUD + heatmap), 5.4 (AI estrutura), 5.5 (pesquisa) consomem
 * estes helpers em vez de tocar `db.journal_entries.*` directamente. Padrão
 * herdado de `habits.ts` (Story 4.1).
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança
 * `ZodError` com mensagens PT-PT. Reads não revalidam.
 *
 * `date` é a chave natural de calendário (`YYYY-MM-DD`). Não há índice único
 * `&date` na tabela: a regra "uma entrada por dia" (FR42) é validada no repo
 * (`getJournalEntryByDate`), não pelo schema da tabela — coerente com o padrão
 * de unicidade verificada no repo das tags (Story 2.6).
 */

/**
 * Cria uma entrada de diário. Valida com `JournalEntrySchema` (mood ∈ {1-5},
 * date `YYYY-MM-DD`, corpo não vazio).
 */
export async function createJournalEntry(input: JournalEntry): Promise<JournalEntry> {
  JournalEntrySchema.parse(input);
  await db.journal_entries.add(input);
  return input;
}

export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  return db.journal_entries.get(id);
}

/**
 * Devolve a entrada de diário de um dia específico (`YYYY-MM-DD`), ou
 * `undefined` se não existir (FR42 — entrada do dia). Usa o índice `date`.
 */
export async function getJournalEntryByDate(
  date: string,
): Promise<JournalEntry | undefined> {
  return db.journal_entries.where('date').equals(date).first();
}

/**
 * Lista as entradas num intervalo de datas inclusivo em ambos os extremos —
 * query dominante do heatmap de mood (FR44). Usa o índice `date` (que ordena
 * lexicalmente; o formato `YYYY-MM-DD` garante ordenação cronológica correcta).
 * Devolve ordenado ascendente por data.
 */
export async function listJournalEntriesByDateRange(
  from: string,
  to: string,
): Promise<JournalEntry[]> {
  return db.journal_entries.where('date').between(from, to, true, true).sortBy('date');
}

/**
 * Pesquisa full-text base (FR45) sobre `bodyMarkdown` e `structuredAI`. Esta é
 * a base que a Story 5.5 (pesquisa full-text) refina. Implementação simples
 * case-insensitive em memória — sem índice full-text dedicado (não há FR42-46
 * que exija indexação de texto livre; o volume de entradas de diário é baixo,
 * 1/dia). A Story 5.5 pode introduzir indexação se o volume o justificar.
 */
export async function searchJournalEntries(query: string): Promise<JournalEntry[]> {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];
  const all = await db.journal_entries.toArray();
  return all
    .filter((entry) => {
      const haystack = [
        entry.bodyMarkdown,
        entry.structuredAI?.whatHappened,
        entry.structuredAI?.whatLearned,
        entry.structuredAI?.whatFelt,
      ]
        .filter((s): s is string => typeof s === 'string')
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function updateJournalEntry(
  id: string,
  patch: Partial<JournalEntry>,
): Promise<void> {
  JournalEntrySchema.partial().parse(patch);
  const updated = await db.journal_entries.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Entrada de diário ${id} não encontrada — não foi possível actualizar`,
    );
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journal_entries.delete(id);
}
