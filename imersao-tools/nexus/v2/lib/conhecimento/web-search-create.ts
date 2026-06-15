import { db } from '@/lib/db/client';
import { createKnowledgeArea, listKnowledgeAreas } from '@/lib/db/repos/knowledge-areas';
import {
  createKnowledgeNotebook,
  listNotebooksByArea,
} from '@/lib/db/repos/knowledge-notebooks';
import { createKnowledgeNote } from '@/lib/db/repos/knowledge-notes';
import { DEFAULT_TAG_COLOR } from '@/lib/tags/colors';
import type { WebSearchResult } from '@/lib/shared/web-search-ddg';
import type { WebSearchProvider } from '@/components/conhecimento/WebSearchResults';

/**
 * Nexus v2 — Orquestração "pesquisa web e cria nota" (Story 5.12 — FR56)
 *
 * Módulo PURO de orquestração do fluxo multi-passo: pesquisa web (endpoint 5.11)
 * → proposta de cascata área/caderno/nota → persistência atómica condicional.
 * Vive client-side (importa os repos Dexie directamente, como
 * `lib/brain-dump/approval-persistencia.ts`), testável independentemente da UI.
 *
 * Decisões ratificadas pelo Architect Gate de Entrada (Aria, 15/06/2026) —
 * NÃO-reabríveis:
 * - `[D-5.12-SCOPE-vs-5.13]=Opção C`: fluxo inteiramente client-side, modo
 *   especial da página `/knowledge`. NÃO toca `lib/agent/tools/index.ts` nem o
 *   classifier. A tool `pesquisar_web_e_criar_nota` é trabalho da 5.13.
 * - `[D-5.12-PREVIEW]=P3 consolidado`: 1 proposta para as N entidades, preview
 *   via UI dedicada (`WebSearchCreateProposal`), fora do executor.
 * - `[D-5.12-PERSIST]`: reutilizar área/caderno por nome (get-or-create
 *   idempotente, case-insensitive PT-PT via `localeCompare`) DENTRO de UMA
 *   transacção Dexie `'rw'` atómica única sobre os 3 stores; nota sempre nova
 *   (sem dedupe por `sourceUrl`); IDs via `crypto.randomUUID()`.
 * - `[D-5.12-FAILURE]`: análise dos 3 eixos vinculativa — falha de fetch aborta
 *   limpo (proposta nunca aparece); falha de persistência → rollback total
 *   (zero entidades, nunca parcial); a proposta carrega NOMES, não IDs (os IDs
 *   resolvem-se na transacção, evitando referências stale — lição M3 da 4.9).
 *
 * Condições do gate de saída honradas:
 * - C1: persistência é UMA transacção `'rw'` com os 3 stores na lista (não três
 *   `await create...` soltos). Falha a meio → rollback total.
 * - C3: a `Proposal` distingue `status: 'nova' | 'existente'` por área e caderno
 *   (o componente mostra-o visualmente antes de confirmar).
 * - C5: a falha do fetch é detectada inspeccionando o CORPO da resposta
 *   (`!resp.ok` OU `results` ausente OU campo `error` no body), não só `resp.ok`
 *   — o endpoint 5.11 pode devolver erro de provider (lição M4 4.9/5.11).
 *
 * Edge/browser-safe: só `fetch` + Dexie + `crypto.randomUUID`. Sem
 * `@anthropic-ai/sdk`, sem `ANTHROPIC_API_KEY`.
 *
 * Constitution:
 * - Article IV (No Invention): reutiliza o endpoint 5.11 e os repos 5.9.
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...`.
 */

/** URL do endpoint de pesquisa web (5.11) — relativa, same-origin. */
const WEB_SEARCH_URL = '/api/conhecimento/web-search';

/** Comprimento máximo do corpo markdown da nota antes de fonte (defensivo). */
const MAX_BODY_LENGTH = 2000;

/** Tipo de fetch injectável para testes determinísticos (default `fetch`). */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/** Sugestões de hierarquia fornecidas pelo utilizador no acionamento (AC1). */
export interface ProposalOpts {
  /** Nome da área de destino (ex: "Espaço"). */
  areaName: string;
  /** Nome do caderno de destino (ex: "Artemis 2"). */
  notebookName: string;
  /** Título da nota a criar. Se omitido, usa o título do 1.º resultado. */
  noteTitle?: string;
  /** `fetch` injectável (testes). Default: `fetch` global. */
  fetchFn?: FetchLike;
  /** `AbortSignal` opcional para cancelar o fetch (UI). */
  signal?: AbortSignal;
}

/** Estado de uma entidade na proposta: vai ser criada nova ou reutilizada. */
export type EntityStatus = 'nova' | 'existente';

/** Proposta consolidada de cascata área→caderno→nota (carrega NOMES, não IDs). */
export interface Proposal {
  area: { name: string; status: EntityStatus };
  notebook: { name: string; status: EntityStatus };
  note: {
    title: string;
    bodyMarkdown: string;
    sourceUrl: string;
  };
  /** Provider que devolveu os resultados (badge na UI). */
  source: WebSearchProvider | null;
  /** Resultados crus de pesquisa (para contexto, ordenados como vieram). */
  results: WebSearchResult[];
}

/** Resultado da persistência — sempre indica o que foi (ou não) criado. */
export interface PersistResult {
  /** `true` se a cascata foi persistida; `false` se `confirmed === false`. */
  persisted: boolean;
  /** Entidades efectivamente criadas nesta transacção (não reutilizadas). */
  created: Array<'area' | 'notebook' | 'note'>;
  /** id do caderno onde a nota ficou (para o link em `/knowledge`). */
  notebookId?: string;
  /** id da nota criada. */
  noteId?: string;
}

/** Shape da resposta do endpoint 5.11 (reutiliza shapes validados — não inventa). */
interface WebSearchResponseBody {
  results?: WebSearchResult[];
  source?: WebSearchProvider;
  error?: string;
}

/**
 * Match exacto de nome após `trim`, case-insensitive PT-PT (`[D-5.12-PERSIST]`).
 * `localeCompare` com `sensitivity: 'accent'` trata "Espaço" === "espaço" como
 * iguais mas distingue acentos (decisão consciente: "Area" !== "Área").
 */
function nameMatches(a: string, b: string): boolean {
  return (
    a.trim().localeCompare(b.trim(), 'pt-PT', {
      sensitivity: 'accent',
    }) === 0
  );
}

/**
 * Compõe o corpo markdown da nota a partir do 1.º resultado (excerto + fonte),
 * espelhando `buildInitialBody` do `WebSearchSaveModal` (5.11) — não reinventar.
 * Trunca defensivamente o excerto a `MAX_BODY_LENGTH` (o endpoint já limita, mas
 * a robustez é barata).
 */
function buildNoteBody(result: WebSearchResult): string {
  const parts: string[] = [];
  const excerpt = result.excerpt.trim();
  if (excerpt !== '') {
    parts.push(excerpt.length > MAX_BODY_LENGTH ? excerpt.slice(0, MAX_BODY_LENGTH) : excerpt);
  }
  parts.push(`Fonte: ${result.url}`);
  return parts.join('\n\n');
}

/**
 * (1) Pesquisa web + (2) formulação da proposta de entidades (AC1).
 *
 * Chama `/api/conhecimento/web-search` (5.11, same-origin) com o `query`. A falha
 * de fetch é detectada **inspeccionando o corpo** (C5/`[D-5.12-FAILURE]` eixo c):
 * `!resp.ok` OU corpo ausente/inválido OU `results` não-array OU `results` vazio
 * → **lança** `Error` PT-PT — a proposta NUNCA aparece, zero writes. NÃO silencia.
 *
 * Com os resultados, lê as áreas/cadernos existentes (`listKnowledgeAreas` /
 * `listNotebooksByArea`) para marcar a área/caderno propostos como `nova` ou
 * `existente` (C3 — o utilizador vê se vai criar ou reutilizar). A proposta
 * carrega NOMES, não IDs — os IDs resolvem-se na transacção de `persistProposal`
 * (evita referências stale, `[D-5.12-FAILURE]` eixo b).
 */
export async function proposeWebSearchCreate(
  query: string,
  opts: ProposalOpts,
): Promise<Proposal> {
  const trimmedQuery = query.trim();
  if (trimmedQuery === '') {
    throw new Error('A pesquisa não pode estar vazia.');
  }
  const areaName = opts.areaName.trim();
  const notebookName = opts.notebookName.trim();
  if (areaName === '') {
    throw new Error('O nome da área é obrigatório.');
  }
  if (notebookName === '') {
    throw new Error('O nome do caderno é obrigatório.');
  }

  const fetchFn = opts.fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init));

  const resp = await fetchFn(WEB_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: trimmedQuery }),
    signal: opts.signal,
  });

  // C5 — inspecciona o CORPO, não só `resp.ok`. O endpoint pode devolver erro de
  // provider (web_search_tool_result_error vem HTTP 200 — lição M4 4.9/5.11).
  const data = (await resp.json().catch(() => null)) as WebSearchResponseBody | null;
  if (!resp.ok || data === null || !Array.isArray(data.results)) {
    throw new Error(
      data?.error ?? 'Não foi possível pesquisar agora. Tenta de novo mais tarde.',
    );
  }
  if (data.results.length === 0) {
    throw new Error(`Nenhum resultado para «${trimmedQuery}» — não há conteúdo para criar a nota.`);
  }

  const top = data.results[0];

  // Marca área/caderno como nova/existente lendo o estado actual (C3). Esta
  // leitura é só para o PREVIEW; a verdade (get-or-create) reavalia-se DENTRO da
  // transacção de persistência (`[D-5.12-FAILURE]` eixo b — sem ids stale).
  const existingAreas = await listKnowledgeAreas();
  const matchedArea = existingAreas.find((a) => nameMatches(a.name, areaName));
  let notebookStatus: EntityStatus = 'nova';
  if (matchedArea !== undefined) {
    const existingNotebooks = await listNotebooksByArea(matchedArea.id);
    if (existingNotebooks.some((nb) => nameMatches(nb.name, notebookName))) {
      notebookStatus = 'existente';
    }
  }

  const noteTitle = (opts.noteTitle ?? top.title).trim() || top.title;

  return {
    area: { name: areaName, status: matchedArea !== undefined ? 'existente' : 'nova' },
    notebook: { name: notebookName, status: notebookStatus },
    note: {
      title: noteTitle,
      bodyMarkdown: buildNoteBody(top),
      sourceUrl: top.url,
    },
    source: data.source ?? null,
    results: data.results,
  };
}

/**
 * (4) Persistência condicional em cascata (AC4, C1).
 *
 * Se `confirmed === false`: retorna sem tocar nos repos (zero writes, sem
 * resíduo — `[D-5.12-FAILURE]` cancelamento). Se `confirmed === true`: persiste
 * Área → Caderno → Nota numa **única transacção Dexie `'rw'`** atómica sobre os 3
 * stores (C1). Get-or-create idempotente por nome DENTRO da transacção
 * (`[D-5.12-PERSIST]`): área e caderno seguem o MESMO padrão idempotente
 * (varredura de bug-de-classe A1/A2 Epic 5 — não só um deles). A nota é sempre
 * criada nova.
 *
 * Falha de qualquer write (Dexie indisponível, validação) → rollback automático
 * → zero entidades (nunca estado parcial — `[D-5.12-FAILURE]` eixo c). Lança
 * `Error` PT-PT que o chamador mapeia ao estado `error` da UI.
 *
 * @param idFn gerador de ids injectável (testes); default `crypto.randomUUID`.
 */
export async function persistProposal(
  proposal: Proposal,
  confirmed: boolean,
  idFn: () => string = () => crypto.randomUUID(),
): Promise<PersistResult> {
  if (!confirmed) {
    return { persisted: false, created: [] };
  }

  const created: Array<'area' | 'notebook' | 'note'> = [];
  let notebookId = '';
  let noteId = '';

  await db.transaction(
    'rw',
    [db.knowledge_areas, db.knowledge_notebooks, db.knowledge_notes],
    async () => {
      // (a) Área: get-or-create idempotente por nome (case-insensitive PT-PT).
      const areas = await listKnowledgeAreas();
      let area = areas.find((a) => nameMatches(a.name, proposal.area.name));
      if (area === undefined) {
        area = await createKnowledgeArea({
          id: idFn(),
          name: proposal.area.name.trim(),
          color: DEFAULT_TAG_COLOR,
          icon: '🌐',
        });
        created.push('area');
      }

      // (b) Caderno: MESMO padrão idempotente por nome, dentro da área resolvida.
      const notebooks = await listNotebooksByArea(area.id);
      let notebook = notebooks.find((nb) => nameMatches(nb.name, proposal.notebook.name));
      if (notebook === undefined) {
        notebook = await createKnowledgeNotebook({
          id: idFn(),
          areaId: area.id,
          name: proposal.notebook.name.trim(),
        });
        created.push('notebook');
      }
      notebookId = notebook.id;

      // (c) Nota: sempre nova (sem dedupe por sourceUrl — `[D-5.12-PERSIST]`).
      const note = await createKnowledgeNote({
        id: idFn(),
        notebookId: notebook.id,
        title: proposal.note.title,
        bodyMarkdown: proposal.note.bodyMarkdown,
        tags: [],
        sourceUrl: proposal.note.sourceUrl,
        updatedAt: Date.now(),
      });
      created.push('note');
      noteId = note.id;
    },
  );

  return { persisted: true, created, notebookId, noteId };
}
