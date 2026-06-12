import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import { createProject } from '@/lib/db/repos/projects';
import { createKnowledgeNote } from '@/lib/db/repos/knowledge-notes';
import {
  getKnowledgeNotebook,
  createKnowledgeNotebook,
} from '@/lib/db/repos/knowledge-notebooks';
import {
  getKnowledgeArea,
  createKnowledgeArea,
} from '@/lib/db/repos/knowledge-areas';
import { getTag, createTag } from '@/lib/db/repos/tags';
import { updateBrainDump } from '@/lib/db/repos/brain-dumps';
import type { BrainDumpBucket } from '@/lib/brain-dump/ai-parser';
import type { BrainDumpStatus } from '@/lib/db/schemas';

/**
 * Nexus v2 — Helper de orquestração de persistência do Brain Dump approval flow
 * (Story 5.8 — FR49, AC3/AC4)
 *
 * Persiste os itens aprovados item-a-item como entidades reais (Tarefas, Projectos,
 * Notas/Ideias, Tarefas-decisão) numa **única transacção Dexie `'rw'`** atómica
 * (all-or-nothing), e transiciona o `status` do brain dump dentro da mesma
 * transacção (atomicidade `status`↔entidades).
 *
 * Decisões ratificadas pelo Architect Gate de Entrada (Aria, 12/06/2026):
 * - `[D-5.8-BATCH]=(A)`: UMA transacção `'rw'` sobre os 7 stores (todos têm de
 *   constar na lista, senão Dexie lança `TransactionInactiveError`). Os repos
 *   (`createTask`, etc.) associam-se à transacção activa via zona assíncrona do
 *   Dexie. Falha de qualquer write → rollback total → zero entidades, zero sistema,
 *   `status` inalterado.
 * - `[D-5.8-INBOX]`: o caderno `_inbox` e a sua área de sistema pai usam UUIDs
 *   **determinísticos hard-coded** (NÃO `crypto.randomUUID`), porque têm de ser
 *   reencontráveis de forma estável entre dumps/sessões — senão criar-se-iam N
 *   cadernos `_inbox`. Get-or-create idempotente por id DENTRO da transacção.
 * - `[D-5.8-TAG-DECISAO]`: a tag de sistema `decisao` tem id UUID determinístico
 *   fixo; o slug ASCII `'decisao'` (sem cedilha — `external-contract-identifiers.md`)
 *   vive no `name`, não no `id`. Get-or-create por id (`createTag` lança em
 *   duplicado por `name`).
 * - `[D-5.8-STATUS-TRANSITION]`: `fully_approved` ⇔ guardados === propostos;
 *   `partially_approved` ⇔ 1 ≤ guardados < propostos.
 * - `[D-5.8-EDIT-INLINE]`: `texto` é o texto final (editado in-place se editado);
 *   `texto.trim()` vazio → o chamador NÃO inclui o item (defensivo: revalidado aqui).
 *
 * Edge/browser-safe (ADR-1 / NFR5): só Dexie + repos + `crypto.randomUUID`. Sem
 * `@anthropic-ai/sdk`, sem `ANTHROPIC_API_KEY`.
 *
 * Constitution:
 * - Article IV (No Invention): usa os repos existentes, não toca o schema (AC8).
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...`.
 */

/**
 * IDs de sistema determinísticos (UUID v4-shaped — versão 4, variant 8 — passam
 * `z.string().uuid()`). NÃO `crypto.randomUUID()`: têm de ser estáveis para que o
 * `_inbox`/área/tag sejam reencontrados (get-or-create idempotente) entre dumps.
 * São contrato — a Story 5.9 (CRUD áreas/cadernos) deve tratar a área de sistema e
 * o `_inbox` como entidades de sistema não elimináveis.
 */
export const SYSTEM_AREA_ID = '00000000-0000-4000-8000-000000000001';
export const INBOX_NOTEBOOK_ID = '00000000-0000-4000-8000-000000000002';
export const DECISAO_TAG_ID = '00000000-0000-4000-8000-000000000003';

/** Item aprovado a persistir — bucket + texto final (editado in-place se editado). */
export interface ApprovedItem {
  bucket: BrainDumpBucket;
  texto: string;
}

/** Opções injectáveis para testes determinísticos (gerador de ids de entidade). */
export interface PersistApprovedItemsOpts {
  /**
   * Gerador de ids das entidades criadas (default `crypto.randomUUID`). Os IDs de
   * sistema (`SYSTEM_AREA_ID`/`INBOX_NOTEBOOK_ID`/`DECISAO_TAG_ID`) NÃO usam este
   * gerador — são constantes determinísticas por design.
   */
  idFn?: () => string;
}

/**
 * Garante (idempotentemente, DENTRO da transacção activa) a tag de sistema
 * `decisao`. Get-or-create por id — `createTag` lança em duplicado por `name`
 * case-insensitive, logo nunca se chama cegamente. Só é invocada quando há ≥1 item
 * de decisão a persistir.
 */
async function garantirTagDecisao(): Promise<void> {
  const existing = await getTag(DECISAO_TAG_ID);
  if (existing === undefined) {
    await createTag({ id: DECISAO_TAG_ID, name: 'decisao', color: '#FF006E' });
  }
}

/**
 * Garante (idempotentemente, DENTRO da transacção activa) a área de sistema e o
 * caderno `_inbox`. `createKnowledgeNote` lança se o `notebookId` não existir e
 * `createKnowledgeNotebook` lança se a `areaId` pai não existir — logo garante-se a
 * área primeiro. Só é invocada quando há ≥1 item de ideia a persistir.
 */
async function garantirInbox(): Promise<void> {
  const inbox = await getKnowledgeNotebook(INBOX_NOTEBOOK_ID);
  if (inbox === undefined) {
    const area = await getKnowledgeArea(SYSTEM_AREA_ID);
    if (area === undefined) {
      await createKnowledgeArea({
        id: SYSTEM_AREA_ID,
        name: 'Sistema',
        color: '#8892A4',
        icon: '📥',
      });
    }
    await createKnowledgeNotebook({
      id: INBOX_NOTEBOOK_ID,
      areaId: SYSTEM_AREA_ID,
      name: 'Caixa de entrada',
    });
  }
}

/**
 * Calcula o novo `status` do brain dump a partir da contagem de itens guardados vs
 * propostos (`[D-5.8-STATUS-TRANSITION]`). Exportado para teste directo do critério.
 *
 * `fully_approved` ⇔ guardados === propostos; `partially_approved` ⇔
 * 1 ≤ guardados < propostos. O chamador garante guardados ≥ 1 (botão desactivado a
 * 0 — AC2); este helper assume o invariante e lança se for violado (defesa em
 * profundidade contra um caminho que nunca devia chegar aqui com 0).
 */
export function computeNewStatus(
  guardados: number,
  propostos: number,
): Extract<BrainDumpStatus, 'partially_approved' | 'fully_approved'> {
  if (guardados < 1) {
    throw new Error(
      'Não há itens seleccionados para guardar — selecciona pelo menos um item.',
    );
  }
  return guardados >= propostos ? 'fully_approved' : 'partially_approved';
}

/**
 * Cria uma entidade real para um item aprovado, por bucket (`[D-5.8-INBOX]`/
 * `[D-5.8-TAG-DECISAO]` já garantidos pelo chamador). `textoFinal` é o texto final
 * já validado (não-vazio). Os campos espelham as interfaces reais lidas dos repos:
 * `Task`/`Project`/`KnowledgeNote` (`types/db.ts`; verificados em código).
 */
async function persistirItem(
  item: ApprovedItem,
  textoFinal: string,
  idFn: () => string,
): Promise<void> {
  const now = Date.now();
  switch (item.bucket) {
    case 'tarefas':
      await createTask({
        id: idFn(),
        title: textoFinal,
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: null,
        projectId: null,
        tags: [],
        context: null,
        lastWorkedAt: null,
        recurrenceId: null,
        parentTaskId: null,
        createdAt: now,
        updatedAt: now,
      });
      return;
    case 'projectos':
      await createProject({
        id: idFn(),
        name: textoFinal,
        description: '',
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        deadline: null,
        createdAt: now,
      });
      return;
    case 'ideias':
      await createKnowledgeNote({
        id: idFn(),
        notebookId: INBOX_NOTEBOOK_ID,
        title: textoFinal,
        bodyMarkdown: '',
        tags: [],
        updatedAt: now,
      });
      return;
    case 'decisoes':
      await createTask({
        id: idFn(),
        title: textoFinal,
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: null,
        projectId: null,
        tags: [DECISAO_TAG_ID],
        context: null,
        lastWorkedAt: null,
        recurrenceId: null,
        parentTaskId: null,
        createdAt: now,
        updatedAt: now,
      });
      return;
    default: {
      // Exaustividade: um bucket desconhecido é um erro de contrato, não silêncio.
      const _exhaustive: never = item.bucket;
      throw new Error(`Bucket desconhecido: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Persiste os itens aprovados como entidades reais e transiciona o `status` do
 * brain dump — tudo numa **única transacção Dexie `'rw'`** atómica (`[D-5.8-BATCH]`).
 *
 * Sequência DENTRO da transacção:
 *   1. Garante sistema idempotentemente, só para os buckets presentes (tag `decisao`
 *      se há decisões; área+`_inbox` se há ideias).
 *   2. Cria cada entidade via repo correcto por bucket.
 *   3. `updateBrainDump(brainDumpId, { status })` — DEPOIS dos writes, dentro da
 *      mesma transacção (atomicidade `status`↔entidades; impossível `fully_approved`
 *      sem as N entidades, ou N entidades sem `status` actualizado).
 *
 * Falha de qualquer passo (repo lança, `updateBrainDump` lança, Dexie indisponível)
 * → rollback automático → zero entidades, zero sistema, `status` inalterado. Lança
 * `Error` PT-PT — o chamador mapeia ao estado `error` da UI (AC5).
 *
 * @param items itens aprovados (já filtrados pelo chamador: só seleccionados, texto
 *   não-vazio). Itens com `texto.trim()` vazio são ignorados defensivamente aqui
 *   (mesma razão do CR Iter 1 Major da 5.7 — nunca persistir linha vazia).
 * @param brainDumpId id do brain dump a transicionar.
 * @param totalPropostos total de itens propostos (soma dos `.length` dos 4 buckets
 *   do `parsedOutput` re-validado) — determina `fully` vs `partially`.
 * @returns número de itens efectivamente criados.
 */
export async function persistApprovedItems(
  items: ApprovedItem[],
  brainDumpId: string,
  totalPropostos: number,
  opts: PersistApprovedItemsOpts = {},
): Promise<number> {
  const idFn = opts.idFn ?? (() => crypto.randomUUID());

  // Filtro defensivo: só itens com texto final não-vazio (`[D-5.8-EDIT-INLINE]`).
  const validItems = items
    .map((item) => ({ item, textoFinal: item.texto.trim() }))
    .filter(({ textoFinal }) => textoFinal.length > 0);

  if (validItems.length === 0) {
    throw new Error(
      'Não há itens seleccionados para guardar — selecciona pelo menos um item.',
    );
  }

  const novoStatus = computeNewStatus(validItems.length, totalPropostos);
  const precisaInbox = validItems.some(({ item }) => item.bucket === 'ideias');
  const precisaTagDecisao = validItems.some(
    ({ item }) => item.bucket === 'decisoes',
  );

  await db.transaction(
    'rw',
    [
      db.tasks,
      db.projects,
      db.knowledge_areas,
      db.knowledge_notebooks,
      db.knowledge_notes,
      db.tags,
      db.brain_dumps,
    ],
    async () => {
      // (1) Garantia de sistema idempotente — só para os buckets presentes.
      if (precisaTagDecisao) await garantirTagDecisao();
      if (precisaInbox) await garantirInbox();

      // (2) Cria cada entidade via repo correcto.
      for (const { item, textoFinal } of validItems) {
        await persistirItem(item, textoFinal, idFn);
      }

      // (3) Transição de status DEPOIS dos writes, dentro da mesma transacção.
      await updateBrainDump(brainDumpId, { status: novoStatus });
    },
  );

  return validItems.length;
}
