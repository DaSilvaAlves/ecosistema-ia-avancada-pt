import { z } from 'zod';

/**
 * Nexus v2 — Helper PURO de estruturação AI do diário (Story 5.4 — FR43, AC1/AC5)
 *
 * Funções puras (sem I/O, sem chamada de API, sem estado) que suportam a feature
 * de estruturação AI do diário:
 *   - `shouldSuggestStructure` — threshold de 100 caracteres (AC1).
 *   - `StructuredDiarioResponseSchema` — validação Zod `.strict()` do JSON de
 *     domínio devolvido pela AI, mapeado 1:1 a `JournalEntry.structuredAI?`.
 *   - `parseStructuredDiario` — parse defensivo de um valor desconhecido para o
 *     shape de domínio, lançando PT-PT em caso de shape inválido (suporta AC5).
 *
 * Vive aqui (módulo puro partilhado) para ser testável ~100% (NFR17) sem mockar
 * `fetch`. O helper client-side `estruturar-cliente.ts` (que faz a chamada ao
 * proxy) importa daqui o schema e o parse. O `JournalEntryModal` importa daqui o
 * threshold. Single source of truth do contrato de domínio.
 *
 * Edge/browser-safe (ADR-1): só `zod` + lógica de string. Sem `fs`/`crypto`/
 * `child_process`, sem `@anthropic-ai/sdk`, sem `ANTHROPIC_API_KEY`.
 *
 * `[D-5.4-ENDPOINT]` (Architect Gate de entrada, Aria 10/06/2026): o shape de
 * domínio `{ whatHappened?; whatLearned?; whatFelt? }` mapeia 1:1 ao campo
 * `JournalEntry.structuredAI?` (`types/db.ts:228`) — zero transformação de nomes.
 *
 * Constitution:
 * - Article IV (No Invention): o shape espelha exactamente `structuredAI?`.
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...` (este módulo só importa `zod`).
 */

/**
 * Threshold de caracteres acima do qual a estruturação AI faz sentido (FR43:
 * "Cérebro AI propõe estrutura ao texto livre quando > 100 caracteres").
 */
export const STRUCTURE_THRESHOLD = 100;

/**
 * Decide se o texto livre da entrada é suficientemente longo para a AI propor
 * uma estrutura (AC1). Função pura: usa o comprimento do texto após `trim()`
 * (espaços em branco no início/fim não contam — uma entrada só de espaços não
 * deve activar o botão).
 *
 * Estritamente `> 100` (não `>=`): exactamente 100 caracteres NÃO activa, 101 sim.
 */
export function shouldSuggestStructure(bodyMarkdown: string): boolean {
  return bodyMarkdown.trim().length > STRUCTURE_THRESHOLD;
}

/**
 * Schema Zod `.strict()` do JSON de domínio que a AI devolve. Os 3 campos são
 * **todos opcionais** — a AI pode omitir um bucket se o texto não tiver conteúdo
 * relevante para ele (ex: relato factual sem emoção → só `whatHappened`).
 *
 * `.strict()` (não `.passthrough()`): um campo renomeado ou extra (ex: a AI
 * devolver `happened` em vez de `whatHappened`, ou acrescentar `whatPlanned`)
 * faz o parse **falhar** em vez de ser silenciosamente ignorado/aceite. Isto é o
 * que satisfaz AC5 (`mock-protocol-fidelity.md`): o contrato é falsificável.
 */
export const StructuredDiarioResponseSchema = z
  .object({
    whatHappened: z.string().optional(),
    whatLearned: z.string().optional(),
    whatFelt: z.string().optional(),
  })
  .strict();

/**
 * O shape de domínio da resposta AI — idêntico a `JournalEntry.structuredAI?`
 * (`types/db.ts:228`). Inferido do schema para manter uma única fonte de verdade.
 */
export type StructuredDiarioResponse = z.infer<typeof StructuredDiarioResponseSchema>;

/**
 * Valida um valor desconhecido (já parseado de JSON) contra o shape de domínio.
 * Lança `Error` com mensagem PT-PT se o shape for inválido — o helper cliente
 * apanha o throw e mapeia-o ao estado `error` da UI (AC4). NÃO devolve um objecto
 * parcial/vazio silenciosamente: um shape inválido é um erro, não um preview vazio.
 *
 * `[D-5.4-ENDPOINT]` Escolha 3 — o resultado mapeia 1:1 a `structuredAI?`.
 */
export function parseStructuredDiario(value: unknown): StructuredDiarioResponse {
  const result = StructuredDiarioResponseSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      'Resposta de estruturação inválida — a AI devolveu um formato inesperado.',
    );
  }
  return result.data;
}

/**
 * Indica se a resposta estruturada tem pelo menos um bucket com conteúdo não
 * vazio. Usado pela UI para decidir se há proposta para mostrar (uma resposta
 * `{}` ou com todos os campos em branco não é uma proposta útil — tratar como
 * "sem proposta", não como preview vazio silencioso).
 */
export function hasStructuredContent(structured: StructuredDiarioResponse): boolean {
  return (
    (structured.whatHappened?.trim().length ?? 0) > 0 ||
    (structured.whatLearned?.trim().length ?? 0) > 0 ||
    (structured.whatFelt?.trim().length ?? 0) > 0
  );
}
