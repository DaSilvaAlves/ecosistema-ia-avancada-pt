import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';
import { searchKnowledgeNotes } from '@/lib/conhecimento/pesquisa';
import type {
  KnowledgeArea,
  KnowledgeNotebook,
  KnowledgeNote,
} from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de conhecimento (Story 5.13 — FR57)
 *
 * Regista 5 tools de domínio `'knowledge'` (`[D-5.13-DOMAIN]`=A, Aria
 * 15/06/2026) no `toolRegistry`:
 *   - `criar_area`                  — cria uma área de conhecimento
 *   - `criar_caderno`               — cria um caderno dentro de uma área
 *   - `criar_nota`                  — cria uma nota dentro de um caderno
 *   - `pesquisar_conhecimento`      — pesquisa full-text nas notas (helper 5.10)
 *   - `pesquisar_web_e_criar_nota`  — pesquisa web (endpoint 5.11) + cria nota
 *
 * Edge-safety (ADR-1, DEV-DECISION D1; ADR-9 executor client-side): NÃO importa
 * `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*` NEM
 * `@/lib/conhecimento/web-search-create.ts` (que importa `db` estaticamente).
 * Persistência via `ctx.db`. O único helper importado é PURO e Edge-safe:
 * `searchKnowledgeNotes` de `lib/conhecimento/pesquisa.ts` (Story 5.10).
 *
 * Decisão ratificada (`@architect` Gate de Entrada, Aria 15/06/2026):
 *   - `[D-5.13-WEB-SEARCH-TOOL]`=W1: `pesquisar_web_e_criar_nota` faz
 *     `ctx.fetch('/api/conhecimento/web-search')` (endpoint 5.11, cookie
 *     same-origin automático no browser — ADR-9) e persiste a cascata
 *     área→caderno→nota numa ÚNICA `ctx.db.transaction('rw', [3 stores], …)`
 *     replicando a lógica de `persistProposal` (5.12) via `ctx.db`.
 *     `requiresPreview: true`, `reversible: false`.
 *
 * Condições do gate de saída honradas:
 *   - C1: persistência da cascata numa única transacção `'rw'` atómica (rollback
 *     total na falha). Nunca writes soltos.
 *   - C2: falha de pesquisa inspecciona o CORPO (`!resp.ok` OU `results`
 *     ausente/não-array/vazio OU `error`), não só `resp.ok` (lição M4 4.9/5.11)
 *     → lança `Error` PT-PT, zero writes.
 *   - C3: get-or-create idempotente por nome (`nameMatches` localeCompare PT-PT)
 *     para área E caderno; IDs resolvidos DENTRO da transacção.
 *   - C4: sem import de `@/lib/db/client`/repos/`web-search-create.ts`.
 *
 * NOTA NOMES ASCII: nomes ASCII puro — válidos contra `TOOL_NAME_PATTERN`
 * (`registry.ts:27`) + Anthropic spec. Semântica PT-PT nas `description`.
 *
 * Trace: PRD-NEXUS-V2.md §6.10 (FR57); architecture-v2.md §7.4; Story 5.12
 * (`web-search-create.ts`) lógica replicada via `ctx.db`.
 *
 * Constitution: Article IV (No Invention), V (PT-PT), VI (imports `@/...`).
 */

function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

/** Cor por defeito das áreas criadas pelo cérebro (espelha DEFAULT_TAG_COLOR). */
const DEFAULT_AREA_COLOR = '#8892A4';
/** Ícone por defeito das áreas criadas via pesquisa web (espelha 5.12). */
const WEB_AREA_ICON = '🌐';
/** Comprimento máximo do corpo markdown da nota antes da fonte (espelha 5.12). */
const MAX_BODY_LENGTH = 2000;
/** URL do endpoint de pesquisa web (5.11) — relativa, same-origin. */
const WEB_SEARCH_URL = '/api/conhecimento/web-search';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Match exacto de nome após `trim`, case-insensitive PT-PT (`[D-5.12-PERSIST]`,
 * espelha `web-search-create.ts:122-128`). `localeCompare` com
 * `sensitivity: 'accent'` trata "Espaço" === "espaço" mas distingue acentos.
 */
function nameMatches(a: string, b: string): boolean {
  return (
    a.trim().localeCompare(b.trim(), 'pt-PT', { sensitivity: 'accent' }) === 0
  );
}

/**
 * Resolve uma área pelo nome (match case-insensitive PT-PT). 0 matches → Error
 * PT-PT com a lista de áreas disponíveis.
 */
async function resolveAreaByNome(
  nome: string,
  ctx: ExecutionContext,
): Promise<KnowledgeArea> {
  const areas = await ctx.db.knowledge_areas.toArray();
  const match = areas.find((a) => nameMatches(a.name, nome));
  if (match === undefined) {
    const lista = areas.map((a) => a.name).join(', ');
    throw new Error(
      `Área não encontrada: "${nome}". Áreas disponíveis: ${lista || '(nenhuma)'}.`,
    );
  }
  return match;
}

/** Shape da resposta do endpoint 5.11 (reutiliza o shape validado da 5.12). */
interface WebSearchResultShape {
  title: string;
  url: string;
  excerpt: string;
}
interface WebSearchResponseBody {
  results?: WebSearchResultShape[];
  source?: 'anthropic' | 'duckduckgo';
  error?: string;
}

/** Compõe o corpo markdown da nota (excerto + fonte), espelha 5.12. */
function buildNoteBody(result: WebSearchResultShape): string {
  const parts: string[] = [];
  const excerpt = result.excerpt.trim();
  if (excerpt !== '') {
    parts.push(
      excerpt.length > MAX_BODY_LENGTH ? excerpt.slice(0, MAX_BODY_LENGTH) : excerpt,
    );
  }
  parts.push(`Fonte: ${result.url}`);
  return parts.join('\n\n');
}

// ═══════════════════════════════════════════════════════════════════
// argsSchemas + resultSchemas
// ═══════════════════════════════════════════════════════════════════

const CriarAreaArgs = z.object({
  nome: z.string().min(1).max(200),
  cor: z.string().regex(HEX_COLOR_RE, 'cor deve ser hex #rrggbb').default(DEFAULT_AREA_COLOR),
  icone: z.string().default('📁'),
});

const CriarCadernoArgs = z.object({
  nomeArea: z.string().min(1),
  nomeCaderno: z.string().min(1).max(200),
});

const CriarNotaArgs = z.object({
  nomeArea: z.string().min(1),
  nomeCaderno: z.string().min(1),
  titulo: z.string().min(1).max(500),
  conteudo: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const PesquisarConhecimentoArgs = z.object({
  query: z.string().min(1),
  nomeArea: z.string().nullable().default(null),
});

const PesquisarWebECriarNotaArgs = z.object({
  query: z.string().min(1),
  nomeArea: z.string().min(1),
  nomeCaderno: z.string().min(1),
  tituloNota: z.string().nullable().default(null),
});

type CriarAreaResult = { id: string; nome: string; mensagem: string };
type CriarCadernoResult = {
  id: string;
  areaId: string;
  nomeCaderno: string;
  mensagem: string;
};
type CriarNotaResult = {
  id: string;
  notebookId: string;
  titulo: string;
  mensagem: string;
};
type NotaResumo = {
  id: string;
  titulo: string;
  nomeArea: string;
  nomeCaderno: string;
  excerpt: string;
  updatedAt: number;
};
type PesquisarConhecimentoResult = {
  resultados: NotaResumo[];
  total: number;
  mensagem: string;
};
type PesquisarWebECriarNotaResult = {
  noteId: string;
  notebookId: string;
  sourceUrl: string;
  mensagem: string;
};

const CriarAreaResultSchema = z.object({
  id: z.string(),
  nome: z.string(),
  mensagem: z.string(),
});
const CriarCadernoResultSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  nomeCaderno: z.string(),
  mensagem: z.string(),
});
const CriarNotaResultSchema = z.object({
  id: z.string(),
  notebookId: z.string(),
  titulo: z.string(),
  mensagem: z.string(),
});
const NotaResumoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  nomeArea: z.string(),
  nomeCaderno: z.string(),
  excerpt: z.string(),
  updatedAt: z.number(),
});
const PesquisarConhecimentoResultSchema = z.object({
  resultados: z.array(NotaResumoSchema),
  total: z.number(),
  mensagem: z.string(),
});
const PesquisarWebECriarNotaResultSchema = z.object({
  noteId: z.string(),
  notebookId: z.string(),
  sourceUrl: z.string(),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// criar_area (FR57) — reversible (delete; recém-criada, sem filhos)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarAreaArgs>, CriarAreaResult>({
    name: 'criar_area',
    description:
      'Cria uma nova área de conhecimento. Use para "cria área…", "nova área de conhecimento sobre…", "adiciona área X".',
    domain: 'knowledge',
    argsSchema: CriarAreaArgs,
    resultSchema: CriarAreaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      // Check de duplicado por nome (case-insensitive PT-PT) — MESMO padrão
      // idempotente que `criar_caderno` (varredura de bug-de-classe A2, T3.4).
      const areas = await ctx.db.knowledge_areas.toArray();
      if (areas.some((a) => nameMatches(a.name, args.nome))) {
        throw new Error(
          `Área "${args.nome}" já existe. Usa um nome diferente ou consulta as áreas existentes.`,
        );
      }
      const id = crypto.randomUUID();
      const area: KnowledgeArea = {
        id,
        name: args.nome.trim(),
        color: args.cor,
        icon: args.icone,
      };
      await ctx.db.knowledge_areas.add(area);
      return { id, nome: args.nome, mensagem: `Área "${args.nome}" criada.` };
    },
    reverse: async (_args, result, ctx) => {
      // Reverse sobre uma área recém-criada (sem filhos). NÃO aplica a cascata
      // `deleteKnowledgeArea` — se entretanto ganhou filhos, só apaga a área.
      await ctx.db.knowledge_areas.delete(result.id);
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// criar_caderno (FR57) — reversible (delete)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarCadernoArgs>, CriarCadernoResult>({
    name: 'criar_caderno',
    description:
      'Cria um caderno dentro de uma área de conhecimento. Use para "cria caderno X na área Y", "novo caderno para…", "adiciona caderno sobre…".',
    domain: 'knowledge',
    argsSchema: CriarCadernoArgs,
    resultSchema: CriarCadernoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const area = await resolveAreaByNome(args.nomeArea, ctx);
      const notebooks = await ctx.db.knowledge_notebooks
        .where('areaId')
        .equals(area.id)
        .toArray();
      // Check de duplicado por nome dentro da área (MESMO padrão de `criar_area`).
      if (notebooks.some((nb) => nameMatches(nb.name, args.nomeCaderno))) {
        throw new Error(
          `Caderno "${args.nomeCaderno}" já existe na área "${area.name}". Usa um nome diferente.`,
        );
      }
      const id = crypto.randomUUID();
      const notebook: KnowledgeNotebook = {
        id,
        areaId: area.id,
        name: args.nomeCaderno.trim(),
      };
      await ctx.db.knowledge_notebooks.add(notebook);
      return {
        id,
        areaId: area.id,
        nomeCaderno: args.nomeCaderno,
        mensagem: `Caderno "${args.nomeCaderno}" criado na área "${args.nomeArea}".`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.knowledge_notebooks.delete(result.id);
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// criar_nota (FR57) — reversible (delete)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarNotaArgs>, CriarNotaResult>({
    name: 'criar_nota',
    description:
      'Cria uma nota dentro de um caderno de conhecimento. Use para "cria nota sobre X no caderno Y", "regista esta informação em…", "adiciona nota: …".',
    domain: 'knowledge',
    argsSchema: CriarNotaArgs,
    resultSchema: CriarNotaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const area = await resolveAreaByNome(args.nomeArea, ctx);
      const notebooks = await ctx.db.knowledge_notebooks
        .where('areaId')
        .equals(area.id)
        .toArray();
      const caderno = notebooks.find((nb) => nameMatches(nb.name, args.nomeCaderno));
      if (caderno === undefined) {
        throw new Error(
          `Caderno "${args.nomeCaderno}" não encontrado na área "${area.name}". Usa 'criar_caderno' primeiro.`,
        );
      }
      const id = crypto.randomUUID();
      const nota: KnowledgeNote = {
        id,
        notebookId: caderno.id,
        title: args.titulo.trim(),
        bodyMarkdown: args.conteudo,
        tags: args.tags,
        updatedAt: Date.now(),
      };
      await ctx.db.knowledge_notes.add(nota);
      return {
        id,
        notebookId: caderno.id,
        titulo: args.titulo,
        mensagem: `Nota "${args.titulo}" criada no caderno "${args.nomeCaderno}" (área "${args.nomeArea}").`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.knowledge_notes.delete(result.id);
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// pesquisar_conhecimento (FR57 / FR53) — read-only (helper puro 5.10)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof PesquisarConhecimentoArgs>, PesquisarConhecimentoResult>({
    name: 'pesquisar_conhecimento',
    description:
      'Pesquisa full-text nas notas de conhecimento. Use para "pesquisa nas notas sobre…", "encontra notas de…", "o que sei sobre X?".',
    domain: 'knowledge',
    argsSchema: PesquisarConhecimentoArgs,
    resultSchema: PesquisarConhecimentoResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const [allNotes, areas, notebooks] = await Promise.all([
        ctx.db.knowledge_notes.toArray(),
        ctx.db.knowledge_areas.toArray(),
        ctx.db.knowledge_notebooks.toArray(),
      ]);
      const notebookById = new Map(notebooks.map((nb) => [nb.id, nb]));
      const areaById = new Map(areas.map((a) => [a.id, a]));

      // Filtro pré-pesquisa por área (resolve área → cadernos → notas).
      let candidatas = allNotes;
      if (args.nomeArea !== null) {
        const area = areas.find((a) => nameMatches(a.name, args.nomeArea as string));
        if (area === undefined) {
          throw new Error(
            `Área não encontrada: "${args.nomeArea}". Áreas disponíveis: ${areas.map((a) => a.name).join(', ') || '(nenhuma)'}.`,
          );
        }
        const cadernoIds = new Set(
          notebooks.filter((nb) => nb.areaId === area.id).map((nb) => nb.id),
        );
        candidatas = allNotes.filter((n) => cadernoIds.has(n.notebookId));
      }

      const matched = searchKnowledgeNotes(candidatas, args.query);
      const resultados: NotaResumo[] = matched.map((n) => {
        const nb = notebookById.get(n.notebookId);
        const area = nb !== undefined ? areaById.get(nb.areaId) : undefined;
        return {
          id: n.id,
          titulo: n.title,
          nomeArea: area?.name ?? '(área desconhecida)',
          nomeCaderno: nb?.name ?? '(caderno desconhecido)',
          excerpt: n.bodyMarkdown.slice(0, 150),
          updatedAt: n.updatedAt,
        };
      });
      return {
        resultados,
        total: resultados.length,
        mensagem:
          resultados.length === 0
            ? `Não encontrei notas de conhecimento com "${args.query}".`
            : `Encontrei ${resultados.length} nota${resultados.length === 1 ? '' : 's'} de conhecimento com "${args.query}".`,
      };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// pesquisar_web_e_criar_nota (FR57 / FR56) — `[D-5.13-WEB-SEARCH-TOOL]`=W1
// requiresPreview: true; persistência inline numa única transacção atómica.
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<
    z.infer<typeof PesquisarWebECriarNotaArgs>,
    PesquisarWebECriarNotaResult
  >({
    name: 'pesquisar_web_e_criar_nota',
    description:
      'Pesquisa na web e cria automaticamente uma nota com o resultado numa área/caderno. Use para "pesquisa X e cria área Y com caderno Z", "procura informação sobre… e guarda".',
    domain: 'knowledge',
    argsSchema: PesquisarWebECriarNotaArgs,
    resultSchema: PesquisarWebECriarNotaResultSchema,
    requiresPreview: true,
    reversible: false,
    execute: async (args, ctx) => {
      // (1) Pesquisa web via endpoint 5.11 (cookie de sessão same-origin
      // automático no browser — ADR-9). NÃO toca REC-SSRF-2 (interno ao 5.11).
      const resp = await ctx.fetch(WEB_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: args.query }),
      });

      // (2) C2 — inspecciona o CORPO, não só `resp.ok`. O endpoint pode devolver
      // erro de provider com HTTP 200 (lição M4 4.9/5.11). Falha → zero writes.
      const data = (await resp.json().catch(() => null)) as WebSearchResponseBody | null;
      if (!resp.ok || data === null || !Array.isArray(data.results)) {
        throw new Error(
          data?.error ?? 'Não foi possível pesquisar agora. Tenta de novo mais tarde.',
        );
      }
      if (data.results.length === 0) {
        throw new Error(
          `Nenhum resultado para «${args.query}» — não há conteúdo para criar a nota.`,
        );
      }

      const top = data.results[0];
      const noteTitle = (args.tituloNota ?? top.title).trim() || top.title;
      const noteBody = buildNoteBody(top);
      const sourceUrl = top.url;

      let noteId = '';
      let notebookId = '';

      // (3) C1 — persistência da cascata área→caderno→nota numa ÚNICA transacção
      // `'rw'` atómica sobre os 3 stores. Get-or-create idempotente por nome para
      // área E caderno (C3, bug-de-classe A2); IDs resolvidos DENTRO da transacção
      // (sem stale, lição M3). Falha → rollback total automático (zero entidades).
      await ctx.db.transaction(
        'rw',
        [ctx.db.knowledge_areas, ctx.db.knowledge_notebooks, ctx.db.knowledge_notes],
        async () => {
          // (a) Área: get-or-create idempotente por nome.
          const areas = await ctx.db.knowledge_areas.toArray();
          let area = areas.find((a) => nameMatches(a.name, args.nomeArea));
          if (area === undefined) {
            area = {
              id: crypto.randomUUID(),
              name: args.nomeArea.trim(),
              color: DEFAULT_AREA_COLOR,
              icon: WEB_AREA_ICON,
            };
            await ctx.db.knowledge_areas.add(area);
          }

          // (b) Caderno: MESMO padrão idempotente, dentro da área resolvida.
          const notebooks = await ctx.db.knowledge_notebooks
            .where('areaId')
            .equals(area.id)
            .toArray();
          let notebook = notebooks.find((nb) => nameMatches(nb.name, args.nomeCaderno));
          if (notebook === undefined) {
            notebook = {
              id: crypto.randomUUID(),
              areaId: area.id,
              name: args.nomeCaderno.trim(),
            };
            await ctx.db.knowledge_notebooks.add(notebook);
          }
          notebookId = notebook.id;

          // (c) Nota: sempre nova (sem dedupe por sourceUrl — `[D-5.12-PERSIST]`).
          const nota: KnowledgeNote = {
            id: crypto.randomUUID(),
            notebookId: notebook.id,
            title: noteTitle,
            bodyMarkdown: noteBody,
            tags: [],
            sourceUrl,
            updatedAt: Date.now(),
          };
          await ctx.db.knowledge_notes.add(nota);
          noteId = nota.id;
        },
      );

      return {
        noteId,
        notebookId,
        sourceUrl,
        mensagem: `Pesquisei "${args.query}" e criei a nota "${noteTitle}" no caderno "${args.nomeCaderno}" (área "${args.nomeArea}").`,
      };
    },
  }),
);
