import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';
import { searchEntries } from '@/lib/diario/pesquisa';
import type { JournalEntry, BrainDump } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de diário + brain dump (Story 5.13 — FR46 + FR50)
 *
 * Regista 4 tools de domínio `'journal'` (`[D-5.13-DOMAIN]`=A, Aria 15/06/2026)
 * no `toolRegistry`:
 *   - `criar_entrada_diario` — cria uma entrada de diário (mood + corpo) num dia
 *   - `consultar_diario`      — consulta entradas por intervalo de datas
 *   - `pesquisar_diario`      — pesquisa full-text nas entradas (helper puro 5.5)
 *   - `brain_dump`            — regista um brain dump (`status:'pending'`, B1)
 *
 * O classifier agrupa brain dump dentro de `journal`
 * (`classifier-system.ts:31`) — por isso `brain_dump` vive aqui com
 * `domain:'journal'`.
 *
 * Edge-safety (ADR-1, DEV-DECISION D1 da Story 2.10; ADR-9 executor
 * client-side): NÃO importa `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*`.
 * Persistência via `ctx.db`. O único helper importado é PURO e Edge-safe:
 * `searchEntries` de `lib/diario/pesquisa.ts` (sem Dexie, Story 5.5).
 *
 * Decisões ratificadas (`@architect` Gate de Entrada, Aria 15/06/2026):
 *   - `[D-5.13-BRAIN-DUMP-SCOPE]`=B1: `brain_dump` só regista o texto num
 *     `BrainDump` com `status:'pending'`, `parsedOutput` undefined. NÃO corre
 *     parser AI nem persiste tarefas/projectos/notas finais (5.7/5.8 fazem-no).
 *   - `[D-5.13-CHAT-RETRO]`=R1: o `resultSchema` inclui `mensagem` PT-PT; o
 *     executor injecta o resultado como `tool_result` e o Sonnet responde no
 *     loop. NÃO há escrita directa em `chat_messages` pela tool (R2 rejeitada).
 *
 * NOTA NOMES ASCII: nomes ASCII puro — válidos contra `TOOL_NAME_PATTERN`
 * (`registry.ts:27`) + Anthropic spec. Semântica PT-PT nas `description`.
 *
 * Trace: PRD-NEXUS-V2.md §6.8 (FR46), §6.9 (FR50); architecture-v2.md §7.4;
 * Story 4.10 (`habits.ts`) padrão replicado.
 *
 * Constitution: Article IV (No Invention), V (PT-PT), VI (imports `@/...`).
 */

function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sentinelas ISO para o lado ausente de um intervalo aberto em `consultar_diario`
 * (Finding 1 CR Iter 1, Aria 16/06/2026). `date` é sempre `YYYY-MM-DD`, logo a
 * comparação lexicográfica = comparação cronológica; estas sentinelas ficam fora
 * de qualquer data real plausível sem truncar resultados.
 */
const SENTINEL_MIN = '0000-01-01';
const SENTINEL_MAX = '9999-12-31';

/** Comprimento do excerto devolvido nas consultas/pesquisas (AC1). */
const EXCERPT_LENGTH = 150;

function excerptOf(bodyMarkdown: string): string {
  return bodyMarkdown.slice(0, EXCERPT_LENGTH);
}

// ═══════════════════════════════════════════════════════════════════
// argsSchemas + resultSchemas
// ═══════════════════════════════════════════════════════════════════

const CriarEntradaDiarioArgs = z.object({
  data: z
    .string()
    .regex(ISO_DATE_RE, 'data deve ser YYYY-MM-DD')
    .default(() => new Date().toISOString().slice(0, 10)),
  bodyMarkdown: z.string().trim().min(1, 'o corpo da entrada é obrigatório'),
  mood: z.number().int().min(1).max(5),
});

const ConsultarDiarioArgs = z.object({
  dataInicio: z.string().regex(ISO_DATE_RE).nullable().default(null),
  dataFim: z.string().regex(ISO_DATE_RE).nullable().default(null),
});

const PesquisarDiarioArgs = z.object({
  query: z.string().trim().min(1, 'a pesquisa não pode estar vazia'),
});

const BrainDumpArgs = z.object({
  texto: z
    .string()
    .trim()
    .min(1, 'o texto do brain dump é obrigatório')
    .describe('Texto livre do brain dump (ideias, pensamentos, tarefas não estruturadas)'),
});

type CriarEntradaDiarioResult = { id: string; data: string; mensagem: string };
type EntradaResumo = { id: string; date: string; mood: number; excerpt: string };
type ConsultarDiarioResult = { entradas: EntradaResumo[]; total: number; mensagem: string };
type PesquisarDiarioResult = { resultados: EntradaResumo[]; total: number; mensagem: string };
type BrainDumpResult = { brainDumpId: string; mensagem: string };

const EntradaResumoSchema = z.object({
  id: z.string(),
  date: z.string(),
  mood: z.number(),
  excerpt: z.string(),
});

const CriarEntradaDiarioResultSchema = z.object({
  id: z.string(),
  data: z.string(),
  mensagem: z.string(),
});
const ConsultarDiarioResultSchema = z.object({
  entradas: z.array(EntradaResumoSchema),
  total: z.number(),
  mensagem: z.string(),
});
const PesquisarDiarioResultSchema = z.object({
  resultados: z.array(EntradaResumoSchema),
  total: z.number(),
  mensagem: z.string(),
});
const BrainDumpResultSchema = z.object({
  brainDumpId: z.string(),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// criar_entrada_diario (FR46) — reversible (delete)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarEntradaDiarioArgs>, CriarEntradaDiarioResult>({
    name: 'criar_entrada_diario',
    description:
      'Cria uma entrada de diário para o dia especificado (ou hoje). Use para "regista no diário", "escreve no diário de hoje", "entrada de diário: …".',
    domain: 'journal',
    argsSchema: CriarEntradaDiarioArgs,
    resultSchema: CriarEntradaDiarioResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      // Check de duplicado via índice `date` (`client.ts:95`) — MESMO índice que
      // `consultar_diario` usa (varredura de bug-de-classe A2 Epic 4, T1.4).
      const existente = await ctx.db.journal_entries
        .where('date')
        .equals(args.data)
        .first();
      if (existente !== undefined) {
        throw new Error(
          `Já existe uma entrada de diário para ${args.data}. Usa 'actualizar diário' ou especifica outra data.`,
        );
      }
      const id = crypto.randomUUID();
      const entry: JournalEntry = {
        id,
        date: args.data,
        mood: args.mood as JournalEntry['mood'],
        bodyMarkdown: args.bodyMarkdown,
      };
      await ctx.db.journal_entries.add(entry);
      return {
        id,
        data: args.data,
        mensagem: `Entrada de diário criada para ${args.data} com mood ${args.mood}/5.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.journal_entries.delete(result.id);
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// consultar_diario (FR46) — read-only
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ConsultarDiarioArgs>, ConsultarDiarioResult>({
    name: 'consultar_diario',
    description:
      'Consulta entradas de diário por intervalo de datas. Use para "o que escrevi semana passada", "mostra o diário de Maio", "ver entradas de diário".',
    domain: 'journal',
    argsSchema: ConsultarDiarioArgs,
    resultSchema: ConsultarDiarioResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      // Intervalo aberto (Finding 1 CR Iter 1): usa `.between(...)` sempre que
      // PELO MENOS UM dos limites estiver presente — o lado ausente usa a
      // sentinela ISO. Só cai nas "últimas 7" quando AMBOS são null (fallback).
      // Preserva a intenção unilateral do utilizador ("desde Maio", "até 10 Jun").
      let entries: JournalEntry[];
      if (args.dataInicio !== null || args.dataFim !== null) {
        const lo = args.dataInicio ?? SENTINEL_MIN;
        const hi = args.dataFim ?? SENTINEL_MAX;
        entries = await ctx.db.journal_entries
          .where('date')
          .between(lo, hi, true, true)
          .sortBy('date');
      } else {
        entries = await ctx.db.journal_entries
          .orderBy('date')
          .reverse()
          .limit(7)
          .toArray();
      }
      const entradas: EntradaResumo[] = entries.map((e) => ({
        id: e.id,
        date: e.date,
        mood: e.mood,
        excerpt: excerptOf(e.bodyMarkdown),
      }));
      return {
        entradas,
        total: entradas.length,
        mensagem:
          entradas.length === 0
            ? 'Não encontrei entradas de diário no período indicado.'
            : `Encontrei ${entradas.length} entrada${entradas.length === 1 ? '' : 's'} de diário.`,
      };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// pesquisar_diario (FR46 / FR45) — read-only (helper puro 5.5)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof PesquisarDiarioArgs>, PesquisarDiarioResult>({
    name: 'pesquisar_diario',
    description:
      'Pesquisa full-text nas entradas de diário. Use para "pesquisa no diário sobre…", "encontra entradas com…", "o que escrevi sobre X?".',
    domain: 'journal',
    argsSchema: PesquisarDiarioArgs,
    resultSchema: PesquisarDiarioResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const all = await ctx.db.journal_entries.toArray();
      const matched = searchEntries(all, args.query);
      const resultados: EntradaResumo[] = matched.map((e) => ({
        id: e.id,
        date: e.date,
        mood: e.mood,
        excerpt: excerptOf(e.bodyMarkdown),
      }));
      return {
        resultados,
        total: resultados.length,
        mensagem:
          resultados.length === 0
            ? `Não encontrei entradas no diário com "${args.query}".`
            : `Encontrei ${resultados.length} entrada${resultados.length === 1 ? '' : 's'} no diário com "${args.query}".`,
      };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// brain_dump (FR50) — `[D-5.13-BRAIN-DUMP-SCOPE]`=B1 — não reversível
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof BrainDumpArgs>, BrainDumpResult>({
    name: 'brain_dump',
    description:
      'Regista um brain dump (texto livre de ideias não estruturadas). Use para "faz brain dump de…", "vomita ideias sobre…", "preciso organizar estes pensamentos: …".',
    domain: 'journal',
    argsSchema: BrainDumpArgs,
    resultSchema: BrainDumpResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      // B1: só regista o texto. NÃO corre o parser AI (5.7) nem persiste
      // entidades finais (5.8). `parsedOutput` fica undefined; `status:'pending'`
      // é o valor canónico da máquina de estados (`types/db.ts:256-266`).
      const id = crypto.randomUUID();
      const dump: BrainDump = {
        id,
        createdAt: Date.now(),
        bodyMarkdown: args.texto,
        status: 'pending',
      };
      await ctx.db.brain_dumps.add(dump);
      // R1: a mensagem flui para `tool_result`; o Sonnet responde no loop. Sem
      // escrita directa em `chat_messages` (R2 rejeitada).
      return {
        brainDumpId: id,
        mensagem:
          'Brain dump registado. Vai a Brain Dump para rever e aprovar os itens detectados.',
      };
    },
  }),
);
