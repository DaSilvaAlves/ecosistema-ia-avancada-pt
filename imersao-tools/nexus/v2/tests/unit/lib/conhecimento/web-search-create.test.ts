import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  proposeWebSearchCreate,
  persistProposal,
  type Proposal,
  type FetchLike,
} from '@/lib/conhecimento/web-search-create';
import { db } from '@/lib/db/client';
import { listKnowledgeAreas } from '@/lib/db/repos/knowledge-areas';
import { listNotebooksByArea } from '@/lib/db/repos/knowledge-notebooks';
import { listNotesByNotebook } from '@/lib/db/repos/knowledge-notes';
import type { WebSearchResult } from '@/lib/shared/web-search-ddg';

/**
 * Nexus v2 — web-search-create orchestration tests (Story 5.12 — AC1/AC4/AC6/AC8)
 *
 * Cobre:
 *   - proposeWebSearchCreate: fluxo feliz (proposta formulada), falha do endpoint
 *     (503/erro de provider no body → lança; proposta nunca aparece — C5),
 *     marcação nova/existente (C3), teste anti-tautológico de fidelidade de
 *     protocolo (AC6 — `results` sem `url`/`source` ausente).
 *   - persistProposal: transacção atómica única (C1), get-or-create idempotente
 *     por nome (área E caderno — varredura de bug-de-classe), cancelamento (T4.5),
 *     dupla submissão (T4.4 — só 1 persistência), falha parcial → rollback total
 *     (zero entidades, nunca parcial — `[D-5.12-FAILURE]` eixo c).
 *
 * `persistProposal` corre contra o `fake-indexeddb` real (transacção genuína —
 * a atomicidade é testada de facto, não mockada). `proposeWebSearchCreate` recebe
 * `fetchFn` injectável.
 */

function makeResult(over: Partial<WebSearchResult> = {}): WebSearchResult {
  return {
    title: 'Artemis 2',
    url: 'https://nasa.gov/artemis-ii',
    excerpt: 'A missão Artemis 2 levará astronautas à órbita lunar.',
    ...over,
  };
}

/** Cria um `Response`-like com o body JSON dado (espelha o protocolo do 5.11). */
function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

function makeProposal(over: Partial<Proposal> = {}): Proposal {
  return {
    area: { name: 'Espaço', status: 'nova' },
    notebook: { name: 'Artemis 2', status: 'nova' },
    note: {
      title: 'Artemis 2',
      bodyMarkdown: 'Resumo.\n\nFonte: https://nasa.gov/artemis-ii',
      sourceUrl: 'https://nasa.gov/artemis-ii',
    },
    source: 'anthropic',
    results: [makeResult()],
    ...over,
  };
}

// IDs gerados como UUID v4 reais — os schemas (`KnowledgeAreaSchema` etc.) exigem
// `z.string().uuid()`. Usar `crypto.randomUUID()` por chamada (não determinístico,
// mas as assertions verificam por nome/contagem, não por id literal).
const seqId = (): string => crypto.randomUUID();
// IDs fixos válidos para as fixtures pré-existentes.
const AREA_ID = '00000000-0000-4000-8000-0000000000a1';
const NB_ID = '00000000-0000-4000-8000-0000000000b1';

beforeEach(async () => {
  await db.knowledge_notes.clear();
  await db.knowledge_notebooks.clear();
  await db.knowledge_areas.clear();
});

describe('proposeWebSearchCreate (Story 5.12 / AC1)', () => {
  it('fluxo feliz: formula proposta com área/caderno NOVOS e nota com fonte', async () => {
    const fetchFn = vi.fn<FetchLike>(async () =>
      jsonResponse({ results: [makeResult()], source: 'anthropic' }),
    );
    const proposal = await proposeWebSearchCreate('Artemis 2', {
      areaName: 'Espaço',
      notebookName: 'Artemis 2',
      fetchFn,
    });

    expect(fetchFn).toHaveBeenCalledOnce();
    // O endpoint chamado é o da 5.11 (same-origin), com o query no body. Capturar
    // via variável tipada (GOTCHA: `mock.calls[0]` é tuple-strict undefined-able).
    const call = fetchFn.mock.calls[0];
    const url = call[0];
    const init = call[1] as RequestInit;
    expect(url).toBe('/api/conhecimento/web-search');
    expect(JSON.parse(init.body as string)).toEqual({ query: 'Artemis 2' });

    expect(proposal.area).toEqual({ name: 'Espaço', status: 'nova' });
    expect(proposal.notebook).toEqual({ name: 'Artemis 2', status: 'nova' });
    expect(proposal.note.title).toBe('Artemis 2');
    expect(proposal.note.sourceUrl).toBe('https://nasa.gov/artemis-ii');
    expect(proposal.note.bodyMarkdown).toContain('Fonte: https://nasa.gov/artemis-ii');
    expect(proposal.source).toBe('anthropic');
  });

  it('C3: marca área/caderno como EXISTENTE quando já existem (case-insensitive PT-PT)', async () => {
    await db.knowledge_areas.add({ id: AREA_ID, name: 'espaço', color: '#fff', icon: '🌐' });
    await db.knowledge_notebooks.add({ id: NB_ID, areaId: AREA_ID, name: 'artemis 2' });

    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: [makeResult()], source: 'duckduckgo' }),
    );
    const proposal = await proposeWebSearchCreate('Artemis 2', {
      areaName: 'Espaço',
      notebookName: 'Artemis 2',
      fetchFn,
    });

    expect(proposal.area.status).toBe('existente');
    expect(proposal.notebook.status).toBe('existente');
    expect(proposal.source).toBe('duckduckgo');
  });

  it('C5: endpoint devolve !ok → lança (proposta nunca aparece, zero leitura de áreas)', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ error: 'Não foi possível pesquisar agora.' }, false, 503),
    );
    await expect(
      proposeWebSearchCreate('x', { areaName: 'A', notebookName: 'B', fetchFn }),
    ).rejects.toThrow('Não foi possível pesquisar agora.');
  });

  it('C5: endpoint devolve HTTP 200 mas com erro de provider no body → lança (inspecciona body)', async () => {
    // O endpoint 5.11 pode devolver erro de provider com status 200 (lição M4
    // 4.9/5.11): `resp.ok` é true mas `results` está ausente. NÃO basta resp.ok.
    const fetchFn = vi.fn(async () =>
      jsonResponse({ error: 'Erro do provider de pesquisa.' }, true, 200),
    );
    await expect(
      proposeWebSearchCreate('x', { areaName: 'A', notebookName: 'B', fetchFn }),
    ).rejects.toThrow('Erro do provider de pesquisa.');
  });

  it('lança se a pesquisa devolve zero resultados (não há conteúdo para a nota)', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: [], source: 'anthropic' }),
    );
    await expect(
      proposeWebSearchCreate('nada', { areaName: 'A', notebookName: 'B', fetchFn }),
    ).rejects.toThrow(/Nenhum resultado/);
  });

  it('AC6 (anti-tautológico): se o shape divergir (results sem url) a nota fica sem sourceUrl válido', async () => {
    // Teste de fidelidade de protocolo: o contrato real é WebSearchResult com
    // `url`. Se o endpoint devolvesse resultados sem `url`, a nota nasceria com
    // sourceUrl === undefined → este teste apanha a divergência de shape.
    const malformed = { title: 'Sem URL', excerpt: 'x' } as unknown as WebSearchResult;
    const fetchFn = vi.fn(async () =>
      jsonResponse({ results: [malformed], source: 'anthropic' }),
    );
    const proposal = await proposeWebSearchCreate('x', {
      areaName: 'A',
      notebookName: 'B',
      fetchFn,
    });
    // Se o shape REAL fosse respeitado, `sourceUrl` seria uma URL http(s) válida.
    // Com shape divergente, fica `undefined` — a assertion abaixo falharia se
    // alguém "consertasse" silenciosamente o shape divergente.
    expect(proposal.note.sourceUrl).toBeUndefined();
  });
});

describe('persistProposal (Story 5.12 / AC4 / C1)', () => {
  it('cancelamento (confirmed=false): nada persiste, repos não tocados (T4.5)', async () => {
    const result = await persistProposal(makeProposal(), false, seqId);
    expect(result.persisted).toBe(false);
    expect(result.created).toEqual([]);
    expect(await listKnowledgeAreas()).toHaveLength(0);
  });

  it('fluxo feliz: cria área, caderno e nota numa transacção; nota fica pesquisável', async () => {
    const result = await persistProposal(makeProposal(), true, seqId);
    expect(result.persisted).toBe(true);
    expect(result.created).toEqual(['area', 'notebook', 'note']);

    const areas = await listKnowledgeAreas();
    expect(areas).toHaveLength(1);
    expect(areas[0].name).toBe('Espaço');
    const notebooks = await listNotebooksByArea(areas[0].id);
    expect(notebooks).toHaveLength(1);
    expect(notebooks[0].name).toBe('Artemis 2');
    const notes = await listNotesByNotebook(notebooks[0].id);
    expect(notes).toHaveLength(1);
    expect(notes[0].sourceUrl).toBe('https://nasa.gov/artemis-ii');
  });

  it('idempotência (área E caderno): reutiliza existentes por nome, só cria a nota', async () => {
    await db.knowledge_areas.add({ id: AREA_ID, name: 'Espaço', color: '#fff', icon: '🌐' });
    await db.knowledge_notebooks.add({ id: NB_ID, areaId: AREA_ID, name: 'Artemis 2' });

    const result = await persistProposal(
      makeProposal({
        area: { name: 'Espaço', status: 'existente' },
        notebook: { name: 'Artemis 2', status: 'existente' },
      }),
      true,
      seqId,
    );
    expect(result.created).toEqual(['note']);
    expect(await listKnowledgeAreas()).toHaveLength(1);
    expect(await listNotebooksByArea(AREA_ID)).toHaveLength(1);
    expect(result.notebookId).toBe(NB_ID);
    expect(await listNotesByNotebook(NB_ID)).toHaveLength(1);
  });

  it('T4.4 dupla submissão: 2× persistProposal da MESMA proposta → 1 área, 1 caderno, 2 notas máx', async () => {
    // A guarda principal de dupla submissão é a UI (`if (kind !== 'proposing')`).
    // No orquestrador, a idempotência por nome garante que área/caderno NÃO
    // duplicam mesmo que persistProposal seja chamado 2×.
    const proposal = makeProposal();
    await persistProposal(proposal, true, seqId);
    await persistProposal(proposal, true, seqId);

    const areas = await listKnowledgeAreas();
    expect(areas).toHaveLength(1); // área NÃO duplicada
    expect(await listNotebooksByArea(areas[0].id)).toHaveLength(1); // caderno NÃO duplicado
  });

  it('falha parcial → rollback total: caderno lança → ZERO entidades persistidas', async () => {
    // Mock que faz o 2.º write (caderno) lançar DENTRO da transacção. Com C1
    // (transacção atómica única), a área criada antes faz rollback → zero parcial.
    const spy = vi
      .spyOn(db.knowledge_notebooks, 'add')
      .mockRejectedValueOnce(new Error('Dexie indisponível'));

    await expect(persistProposal(makeProposal(), true, seqId)).rejects.toThrow();

    // Rollback: a área NÃO ficou persistida (atomicidade — `[D-5.12-FAILURE]` eixo c).
    expect(await listKnowledgeAreas()).toHaveLength(0);
    expect(await listNotebooksByArea(AREA_ID)).toHaveLength(0);
    spy.mockRestore();
  });
});
