import { z } from 'zod';

/**
 * Nexus v2 — Helper PURO de parsing AI do Brain Dump (Story 5.7 — FR48, AC1)
 *
 * Funções puras (sem I/O, sem chamada de API, sem estado) que suportam o parser
 * de texto livre → 4 buckets:
 *   - `BrainDumpWireSchema` — wire shape da resposta AI (`.strict()`): 4 buckets
 *     OBRIGATÓRIOS, cada um array de strings. A AI devolve TEXTOS, não ids.
 *   - `BrainDumpParsedSchema` — shape de DOMÍNIO persistido (`.strict()`): mesmos
 *     4 buckets, itens `{ id, texto }`. É o seam que a Story 5.8 consome.
 *   - `BrainDumpParsed` — tipo de domínio inferido.
 *   - `parseBrainDumpWire(value)` — parse defensivo do wire, throw PT-PT em shape
 *     inválido (suporta AC4).
 *   - `enrichWithIds(wire, idFn?)` — enriquecimento puro wire → domínio (atribui
 *     ids no cliente; `idFn` injectável para testes determinísticos).
 *   - `hasParsedContent(parsed)` — ≥1 bucket não-vazio (decide se há proposta).
 *
 * Vive aqui (módulo puro partilhado) para ser testável ~100% (NFR17) sem mockar
 * `fetch`. O helper client-side `parser-cliente.ts` (que faz a chamada ao proxy)
 * importa daqui o parse e o enrich. Single source of truth do contrato.
 *
 * Edge/browser-safe (ADR-1 / NFR5): só `zod` + `crypto.randomUUID` + lógica de
 * string. Sem `fs`/`child_process`, sem `@anthropic-ai/sdk`, sem `ANTHROPIC_API_KEY`.
 *
 * `[D-5.7-SHAPE]` (Architect Gate de entrada, Aria 12/06/2026): separação
 * wire/domínio. A AI gera textos (um LLM não é fonte fiável de unicidade de ids);
 * os ids são atribuídos no cliente via `enrichWithIds`. Os 4 buckets são SEMPRE
 * presentes (arrays vazios permitidos) — divergência deliberada face ao diário
 * (campos opcionais) porque a 5.8 itera os 4 e o display mostra contador "(N)".
 *
 * `[D-5.7-SHAPE]` / `external-contract-identifiers.md`: os nomes dos buckets são
 * identificadores de contrato interno do `parsedOutput` — ASCII, sem acentos nem
 * cedilha (`tarefas`, `projectos`, `ideias`, `decisoes`).
 *
 * Constitution:
 * - Article IV (No Invention): o shape de domínio é o contrato da 5.8, não inventa.
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...` (este módulo só importa `zod`).
 */

/** Os 4 buckets do contrato (ASCII — `external-contract-identifiers.md`). */
export const BRAIN_DUMP_BUCKETS = ['tarefas', 'projectos', 'ideias', 'decisoes'] as const;

export type BrainDumpBucket = (typeof BRAIN_DUMP_BUCKETS)[number];

/**
 * Wire shape da resposta AI. Os 4 buckets são OBRIGATÓRIOS (arrays vazios
 * permitidos); cada item é uma string não-vazia — a AI devolve textos,
 * NÃO ids (`[D-5.7-SHAPE]`).
 *
 * `.trim().min(1)` (não `.min(1)` simples): o `.trim()` transforma a string ANTES
 * da verificação de comprimento, pelo que um item whitespace-only (`"   "`) é
 * rejeitado e os itens válidos ficam sem espaços nas pontas. Sem o trim, um item
 * em branco passava o schema, era persistido, contado por `hasParsedContent` e
 * mostrado como linha vazia no preview read-only (CR Iter 1 Major).
 *
 * `.strict()` (não `.passthrough()`): um bucket renomeado (ex: `tasks` em vez de
 * `tarefas`) ou um campo extra faz o parse FALHAR. É o mecanismo que satisfaz AC7
 * (`mock-protocol-fidelity.md`): o contrato wire é falsificável.
 */
export const BrainDumpWireSchema = z
  .object({
    tarefas: z.array(z.string().trim().min(1)),
    projectos: z.array(z.string().trim().min(1)),
    ideias: z.array(z.string().trim().min(1)),
    decisoes: z.array(z.string().trim().min(1)),
  })
  .strict();

/** Wire shape inferido (resposta crua da AI, antes do enriquecimento de ids). */
export type BrainDumpWire = z.infer<typeof BrainDumpWireSchema>;

/**
 * Item de domínio: id (atribuído no cliente) + texto (gerado pela AI). O `texto`
 * usa `.trim().min(1)` (mesma razão do wire): rejeita whitespace-only no shape
 * persistido/consumido pela 5.8 (CR Iter 1 Major).
 */
export const BrainDumpItemSchema = z
  .object({
    id: z.string().min(1),
    texto: z.string().trim().min(1),
  })
  .strict();

export type BrainDumpItem = z.infer<typeof BrainDumpItemSchema>;

/**
 * Shape de DOMÍNIO persistido em `BrainDump.parsedOutput` e consumido pela 5.8.
 * Mesmos 4 buckets obrigatórios; itens `{ id, texto }`. `.strict()` — falsificável.
 */
export const BrainDumpParsedSchema = z
  .object({
    tarefas: z.array(BrainDumpItemSchema),
    projectos: z.array(BrainDumpItemSchema),
    ideias: z.array(BrainDumpItemSchema),
    decisoes: z.array(BrainDumpItemSchema),
  })
  .strict();

/** Tipo de domínio — o contrato entre a 5.7 (escrita) e a 5.8 (leitura). */
export type BrainDumpParsed = z.infer<typeof BrainDumpParsedSchema>;

/**
 * Valida um valor desconhecido (já parseado de JSON) contra o WIRE shape. Lança
 * `Error` com mensagem PT-PT se o shape for inválido — o helper cliente apanha o
 * throw e mapeia-o ao estado `error` da UI (AC4). NÃO devolve um objecto
 * parcial/vazio silenciosamente: um shape inválido é um erro, não um preview vazio.
 */
export function parseBrainDumpWire(value: unknown): BrainDumpWire {
  const result = BrainDumpWireSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      'Resposta de estruturação inválida — a AI devolveu um formato inesperado.',
    );
  }
  return result.data;
}

/**
 * Enriquece o wire (textos) com ids gerados no cliente, devolvendo o shape de
 * domínio (`[D-5.7-SHAPE]`). Função pura: o `idFn` é injectável (default
 * `crypto.randomUUID`) para testes determinísticos. Não muta o input.
 */
export function enrichWithIds(
  wire: BrainDumpWire,
  idFn: () => string = () => crypto.randomUUID(),
): BrainDumpParsed {
  const toItems = (textos: string[]): BrainDumpItem[] =>
    textos.map((texto) => ({ id: idFn(), texto }));

  return {
    tarefas: toItems(wire.tarefas),
    projectos: toItems(wire.projectos),
    ideias: toItems(wire.ideias),
    decisoes: toItems(wire.decisoes),
  };
}

/**
 * Indica se o output parseado tem pelo menos um bucket com conteúdo. Usado pela UI
 * para decidir se há proposta para mostrar (uma resposta com os 4 buckets vazios
 * não é uma proposta útil — tratar como "sem itens", não como preview vazio
 * silencioso; AC4). Aceita wire ou domínio (ambos têm os 4 buckets como arrays).
 */
export function hasParsedContent(
  parsed: BrainDumpParsed | BrainDumpWire,
): boolean {
  return BRAIN_DUMP_BUCKETS.some((bucket) => parsed[bucket].length > 0);
}
