import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import type {
  KnowledgeArea,
  KnowledgeNotebook,
  KnowledgeNote,
} from '@/types/db';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de conhecimento tests (Story 5.13 — FR57)
 *
 * `fake-indexeddb` via `tests/setup.ts`. `ctx.db` real. Padrão `habits.test.ts`.
 * Cobre T12-T27 (CRUD T12-T20, pesquisa T21-T22, web T23-T25, registry T26-T27).
 * Para `pesquisar_web_e_criar_nota` injecta um `ctx.fetch` fake com o shape REAL
 * da resposta do endpoint 5.11 (`{ results, source }`) — mock-fidelidade.
 */

const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};

const baseCtx: Omit<ExecutionContext, 'fetch'> = {
  userId: 'eurico',
  db,
  kv: mockKv,
  logger: mockLogger,
  runId: 'test-run-id',
};
const ctx: ExecutionContext = { ...baseCtx, fetch: globalThis.fetch };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) throw new Error(`Tool "${name}" não registada`);
  return t;
};

/** Constrói um `ctx` com `fetch` fake que devolve `body` com `status`. */
function ctxWithFetch(body: unknown, status = 200): ExecutionContext {
  const fakeFetch = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  ) as unknown as typeof fetch;
  return { ...baseCtx, fetch: fakeFetch };
}

async function seedAreaCaderno(
  areaName: string,
  cadernoName: string,
): Promise<{ area: KnowledgeArea; caderno: KnowledgeNotebook }> {
  const area: KnowledgeArea = {
    id: crypto.randomUUID(),
    name: areaName,
    color: '#8892A4',
    icon: '📁',
  };
  await db.knowledge_areas.add(area);
  const caderno: KnowledgeNotebook = {
    id: crypto.randomUUID(),
    areaId: area.id,
    name: cadernoName,
  };
  await db.knowledge_notebooks.add(caderno);
  return { area, caderno };
}

beforeEach(async () => {
  await db.knowledge_areas.clear();
  await db.knowledge_notebooks.clear();
  await db.knowledge_notes.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('domínio das 5 tools de knowledge (D-5.13-DOMAIN=A)', () => {
  it('criar_area / criar_caderno / criar_nota / pesquisar_conhecimento / pesquisar_web_e_criar_nota têm domain "knowledge"', () => {
    expect(tool('criar_area').domain).toBe('knowledge');
    expect(tool('criar_caderno').domain).toBe('knowledge');
    expect(tool('criar_nota').domain).toBe('knowledge');
    expect(tool('pesquisar_conhecimento').domain).toBe('knowledge');
    expect(tool('pesquisar_web_e_criar_nota').domain).toBe('knowledge');
  });
});

describe('criar_area (T12-T14)', () => {
  it('T12 — sucesso: área criada com name, color, icon', async () => {
    const t = tool('criar_area');
    const args = t.argsSchema.parse({ nome: 'IA', cor: '#FF0000', icone: '🤖' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      nome: string;
      mensagem: string;
    };
    expect(result.id).toMatch(UUID_RE);
    const a = (await db.knowledge_areas.get(result.id)) as KnowledgeArea;
    expect(a.name).toBe('IA');
    expect(a.color).toBe('#FF0000');
    expect(a.icon).toBe('🤖');
  });

  it('T12b — defaults de cor e ícone aplicados', async () => {
    const t = tool('criar_area');
    const args = t.argsSchema.parse({ nome: 'Espaço' });
    const result = (await t.execute(args, ctx)) as { id: string };
    const a = (await db.knowledge_areas.get(result.id)) as KnowledgeArea;
    expect(a.color).toBe('#8892A4');
    expect(a.icon).toBe('📁');
  });

  it('T13 — duplicado (case-insensitive PT-PT): "ia" vs "IA" → erro, nenhuma criada', async () => {
    await db.knowledge_areas.add({
      id: crypto.randomUUID(),
      name: 'IA',
      color: '#000000',
      icon: '📁',
    });
    const t = tool('criar_area');
    const args = t.argsSchema.parse({ nome: 'ia' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/já existe/i);
    expect(await db.knowledge_areas.count()).toBe(1);
  });

  it('T14 — reverse: área criada → reverse → eliminada', async () => {
    const t = tool('criar_area');
    const args = t.argsSchema.parse({ nome: 'Temp' });
    const result = (await t.execute(args, ctx)) as { id: string; nome: string; mensagem: string };
    await t.reverse!(args, result, ctx);
    expect(await db.knowledge_areas.get(result.id)).toBeUndefined();
  });

  it('T14b — reverse recusa se a área já tiver cadernos (Finding 3): Error, área e caderno intactos', async () => {
    const tArea = tool('criar_area');
    const argsArea = tArea.argsSchema.parse({ nome: 'Temp' });
    const resultArea = (await tArea.execute(argsArea, ctx)) as {
      id: string;
      nome: string;
      mensagem: string;
    };
    // entretanto a área ganha um caderno filho
    const tCaderno = tool('criar_caderno');
    const argsCaderno = tCaderno.argsSchema.parse({ nomeArea: 'Temp', nomeCaderno: 'Filho' });
    const resultCaderno = (await tCaderno.execute(argsCaderno, ctx)) as { id: string };
    // reverse da área recusa (alinhado com cascata 5.9 — exclusiva da UI de gestão)
    await expect(tArea.reverse!(argsArea, resultArea, ctx)).rejects.toThrow(
      /não posso desfazer/i,
    );
    expect(await db.knowledge_areas.get(resultArea.id)).toBeDefined();
    expect(await db.knowledge_notebooks.get(resultCaderno.id)).toBeDefined();
  });

  it('T13b — nome só com espaços: Zod lança (.trim().min(1), Finding 2)', () => {
    const t = tool('criar_area');
    expect(() => t.argsSchema.parse({ nome: '   ' })).toThrow();
  });
});

describe('criar_caderno (T15-T17)', () => {
  it('T15 — sucesso: área existe → caderno criado com areaId correcto', async () => {
    const { area } = await seedAreaCaderno('IA', 'OutroCaderno');
    const t = tool('criar_caderno');
    const args = t.argsSchema.parse({ nomeArea: 'IA', nomeCaderno: 'LLMs' });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      areaId: string;
      nomeCaderno: string;
    };
    expect(result.areaId).toBe(area.id);
    const nb = (await db.knowledge_notebooks.get(result.id)) as KnowledgeNotebook;
    expect(nb.name).toBe('LLMs');
    expect(nb.areaId).toBe(area.id);
  });

  it('T16 — área não encontrada → erro PT-PT', async () => {
    const t = tool('criar_caderno');
    const args = t.argsSchema.parse({ nomeArea: 'InexistenteXYZ', nomeCaderno: 'X' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrada/i);
  });

  it('T16b — caderno duplicado na mesma área → erro PT-PT', async () => {
    await seedAreaCaderno('IA', 'LLMs');
    const t = tool('criar_caderno');
    const args = t.argsSchema.parse({ nomeArea: 'IA', nomeCaderno: 'llms' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/já existe/i);
  });

  it('T17 — reverse: caderno criado → reverse → eliminado', async () => {
    await seedAreaCaderno('IA', 'Outro');
    const t = tool('criar_caderno');
    const args = t.argsSchema.parse({ nomeArea: 'IA', nomeCaderno: 'Novo' });
    const result = (await t.execute(args, ctx)) as { id: string; areaId: string; nomeCaderno: string; mensagem: string };
    await t.reverse!(args, result, ctx);
    expect(await db.knowledge_notebooks.get(result.id)).toBeUndefined();
  });

  it('T17b — reverse recusa se o caderno já tiver notas (Finding 3): Error, caderno e nota intactos', async () => {
    await seedAreaCaderno('IA', 'Outro');
    const tCaderno = tool('criar_caderno');
    const argsCaderno = tCaderno.argsSchema.parse({ nomeArea: 'IA', nomeCaderno: 'Novo' });
    const resultCaderno = (await tCaderno.execute(argsCaderno, ctx)) as {
      id: string;
      areaId: string;
      nomeCaderno: string;
      mensagem: string;
    };
    // o caderno ganha uma nota filha
    const tNota = tool('criar_nota');
    const argsNota = tNota.argsSchema.parse({
      nomeArea: 'IA',
      nomeCaderno: 'Novo',
      titulo: 'Filha',
      conteudo: 'corpo',
    });
    const resultNota = (await tNota.execute(argsNota, ctx)) as { id: string };
    await expect(tCaderno.reverse!(argsCaderno, resultCaderno, ctx)).rejects.toThrow(
      /não posso desfazer/i,
    );
    expect(await db.knowledge_notebooks.get(resultCaderno.id)).toBeDefined();
    expect(await db.knowledge_notes.get(resultNota.id)).toBeDefined();
  });
});

describe('criar_nota (T18-T20)', () => {
  it('T18 — sucesso: área + caderno existem → nota criada com campos exactos', async () => {
    const { caderno } = await seedAreaCaderno('IA', 'Frontend');
    const t = tool('criar_nota');
    const args = t.argsSchema.parse({
      nomeArea: 'IA',
      nomeCaderno: 'Frontend',
      titulo: 'React Hooks',
      conteudo: 'useState e useEffect',
      tags: ['react'],
    });
    const result = (await t.execute(args, ctx)) as {
      id: string;
      notebookId: string;
      titulo: string;
    };
    expect(result.notebookId).toBe(caderno.id);
    const n = (await db.knowledge_notes.get(result.id)) as KnowledgeNote;
    expect(n.title).toBe('React Hooks');
    expect(n.bodyMarkdown).toBe('useState e useEffect');
    expect(n.tags).toEqual(['react']);
    expect(typeof n.updatedAt).toBe('number');
  });

  it('T18b — tags default []', async () => {
    await seedAreaCaderno('IA', 'Frontend');
    const t = tool('criar_nota');
    const args = t.argsSchema.parse({
      nomeArea: 'IA',
      nomeCaderno: 'Frontend',
      titulo: 'Sem tags',
      conteudo: 'corpo',
    });
    const result = (await t.execute(args, ctx)) as { id: string };
    const n = (await db.knowledge_notes.get(result.id)) as KnowledgeNote;
    expect(n.tags).toEqual([]);
  });

  it('T19 — caderno não encontrado: resolve área mas caderno não existe → erro PT-PT', async () => {
    await seedAreaCaderno('IA', 'Frontend');
    const t = tool('criar_nota');
    const args = t.argsSchema.parse({
      nomeArea: 'IA',
      nomeCaderno: 'CadernoInexistente',
      titulo: 'X',
      conteudo: 'y',
    });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrado/i);
  });

  it('T20 — reverse: nota criada → reverse → eliminada', async () => {
    await seedAreaCaderno('IA', 'Frontend');
    const t = tool('criar_nota');
    const args = t.argsSchema.parse({
      nomeArea: 'IA',
      nomeCaderno: 'Frontend',
      titulo: 'Reversível',
      conteudo: 'corpo',
    });
    const result = (await t.execute(args, ctx)) as { id: string; notebookId: string; titulo: string; mensagem: string };
    await t.reverse!(args, result, ctx);
    expect(await db.knowledge_notes.get(result.id)).toBeUndefined();
  });
});

describe('pesquisar_conhecimento (T21-T22)', () => {
  async function seedNotes() {
    const { area, caderno } = await seedAreaCaderno('IA', 'Frontend');
    const outra = await seedAreaCaderno('Espaço', 'Artemis');
    await db.knowledge_notes.bulkAdd([
      {
        id: crypto.randomUUID(),
        notebookId: caderno.id,
        title: 'React Hooks',
        bodyMarkdown: 'useState e React context',
        tags: [],
        updatedAt: 1,
      },
      {
        id: crypto.randomUUID(),
        notebookId: caderno.id,
        title: 'React Router',
        bodyMarkdown: 'navegação com React',
        tags: [],
        updatedAt: 2,
      },
      {
        id: crypto.randomUUID(),
        notebookId: outra.caderno.id,
        title: 'Foguetão',
        bodyMarkdown: 'propulsão e órbita',
        tags: [],
        updatedAt: 3,
      },
    ]);
    return { area, caderno };
  }

  it('T21 — match: 2 notas contêm "React", 1 não → retorna 2 com nomeArea/nomeCaderno', async () => {
    await seedNotes();
    const t = tool('pesquisar_conhecimento');
    const args = t.argsSchema.parse({ query: 'React' });
    const result = (await t.execute(args, ctx)) as {
      resultados: Array<{ nomeArea: string; nomeCaderno: string }>;
      total: number;
    };
    expect(result.total).toBe(2);
    expect(result.resultados.every((r) => r.nomeArea === 'IA')).toBe(true);
    expect(result.resultados.every((r) => r.nomeCaderno === 'Frontend')).toBe(true);
  });

  it('T22 — filtro por área: só pesquisa na área especificada', async () => {
    await seedNotes();
    const t = tool('pesquisar_conhecimento');
    // "propulsão" só existe na área Espaço; filtrar por IA não devolve nada.
    const args = t.argsSchema.parse({ query: 'propulsão', nomeArea: 'IA' });
    const result = (await t.execute(args, ctx)) as { total: number };
    expect(result.total).toBe(0);

    const args2 = t.argsSchema.parse({ query: 'propulsão', nomeArea: 'Espaço' });
    const result2 = (await t.execute(args2, ctx)) as { total: number };
    expect(result2.total).toBe(1);
  });

  it('T22b — nomeArea inexistente → erro PT-PT', async () => {
    await seedNotes();
    const t = tool('pesquisar_conhecimento');
    const args = t.argsSchema.parse({ query: 'x', nomeArea: 'NaoExisteXYZ' });
    await expect(t.execute(args, ctx)).rejects.toThrow(/não encontrada/i);
  });
});

describe('pesquisar_web_e_criar_nota (T23-T25 — W1)', () => {
  const okBody = {
    results: [
      {
        title: 'Artemis 2',
        url: 'https://example.com/artemis',
        excerpt: 'A missão Artemis 2 leva astronautas à órbita lunar.',
      },
    ],
    source: 'duckduckgo' as const,
  };

  it('requiresPreview true e reversible false (W1)', () => {
    const t = tool('pesquisar_web_e_criar_nota');
    expect(t.requiresPreview).toBe(true);
    expect(t.reversible).toBe(false);
  });

  it('T23 — sucesso: cria área+caderno+nota com sourceUrl e corpo excerto+fonte', async () => {
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({
      query: 'Artemis 2',
      nomeArea: 'Espaço',
      nomeCaderno: 'Artemis 2',
    });
    const result = (await t.execute(args, ctxWithFetch(okBody))) as {
      noteId: string;
      notebookId: string;
      sourceUrl: string;
    };
    expect(result.sourceUrl).toBe('https://example.com/artemis');
    const n = (await db.knowledge_notes.get(result.noteId)) as KnowledgeNote;
    expect(n.sourceUrl).toBe('https://example.com/artemis');
    expect(n.bodyMarkdown).toContain('Artemis 2 leva astronautas');
    expect(n.bodyMarkdown).toContain('Fonte: https://example.com/artemis');
    // área + caderno criados em cascata
    expect(await db.knowledge_areas.count()).toBe(1);
    expect(await db.knowledge_notebooks.count()).toBe(1);
  });

  it('T23b — reutiliza área+caderno existentes (get-or-create idempotente, C3)', async () => {
    await seedAreaCaderno('Espaço', 'Artemis 2');
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({
      query: 'Artemis 2',
      nomeArea: 'espaço', // case-insensitive PT-PT
      nomeCaderno: 'artemis 2',
    });
    await t.execute(args, ctxWithFetch(okBody));
    // não duplica área nem caderno
    expect(await db.knowledge_areas.count()).toBe(1);
    expect(await db.knowledge_notebooks.count()).toBe(1);
    expect(await db.knowledge_notes.count()).toBe(1);
  });

  it('T24 — fetch falha (503): erro PT-PT, nenhuma nota/área/caderno criados', async () => {
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({
      query: 'x',
      nomeArea: 'A',
      nomeCaderno: 'B',
    });
    await expect(
      t.execute(args, ctxWithFetch({ error: 'Serviço indisponível.' }, 503)),
    ).rejects.toThrow(/indisponível/i);
    expect(await db.knowledge_areas.count()).toBe(0);
    expect(await db.knowledge_notebooks.count()).toBe(0);
    expect(await db.knowledge_notes.count()).toBe(0);
  });

  it('T25 — anti-tautológico: results ausente no corpo (HTTP 200) → nota NÃO criada', async () => {
    // C2: inspecciona o CORPO, não só resp.ok. O endpoint pode devolver erro de
    // provider com HTTP 200 (lição M4 4.9/5.11). Se o shape divergir (sem
    // `results`), a tool tem de falhar — senão criaria nota com lixo.
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({
      query: 'x',
      nomeArea: 'A',
      nomeCaderno: 'B',
    });
    await expect(
      t.execute(args, ctxWithFetch({ source: 'anthropic' }, 200)),
    ).rejects.toThrow();
    expect(await db.knowledge_notes.count()).toBe(0);
  });

  it('T25b — anti-tautológico: results vazio (HTTP 200) → erro, nota NÃO criada', async () => {
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({ query: 'x', nomeArea: 'A', nomeCaderno: 'B' });
    await expect(
      t.execute(args, ctxWithFetch({ results: [], source: 'duckduckgo' }, 200)),
    ).rejects.toThrow(/nenhum resultado/i);
    expect(await db.knowledge_notes.count()).toBe(0);
  });

  it('T25c — item malformado filtrado (Finding 4): 1 item title:"" + 1 válido → cria a nota do válido', async () => {
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({
      query: 'Artemis 2',
      nomeArea: 'Espaço',
      nomeCaderno: 'Artemis 2',
    });
    const mixedBody = {
      results: [
        { title: '', url: 'https://example.com/lixo', excerpt: 'sem título' }, // inválido (title vazio)
        {
          title: 'Artemis 2 válido',
          url: 'https://example.com/artemis',
          excerpt: 'A missão Artemis 2.',
        },
      ],
      source: 'duckduckgo' as const,
    };
    const result = (await t.execute(args, ctxWithFetch(mixedBody))) as {
      noteId: string;
      sourceUrl: string;
    };
    // escolheu o primeiro VÁLIDO (não o malformado)
    expect(result.sourceUrl).toBe('https://example.com/artemis');
    const n = (await db.knowledge_notes.get(result.noteId)) as KnowledgeNote;
    expect(n.title).toBe('Artemis 2 válido');
    expect(await db.knowledge_notes.count()).toBe(1);
  });

  it('T25d — todos os itens inválidos (Finding 4): url malformada → Error + zero writes', async () => {
    const t = tool('pesquisar_web_e_criar_nota');
    const args = t.argsSchema.parse({ query: 'x', nomeArea: 'A', nomeCaderno: 'B' });
    const allInvalidBody = {
      results: [
        { title: 'Sem URL', url: 'não-é-url', excerpt: 'a' },
        { title: '', url: 'https://ok.com', excerpt: 'b' },
      ],
      source: 'duckduckgo' as const,
    };
    await expect(t.execute(args, ctxWithFetch(allInvalidBody))).rejects.toThrow(
      /não têm título\/url válidos/i,
    );
    expect(await db.knowledge_areas.count()).toBe(0);
    expect(await db.knowledge_notebooks.count()).toBe(0);
    expect(await db.knowledge_notes.count()).toBe(0);
  });
});

describe('Tool Registry — Epic 5 (T26-T27)', () => {
  it('T26 — toolRegistry.all().length === 31 após import', () => {
    expect(toolRegistry.all().length).toBe(31);
    expect(toolRegistry.byDomain('journal')).toHaveLength(4);
    expect(toolRegistry.byDomain('knowledge')).toHaveLength(5);
  });

  it('T27 — toAnthropicTools para as 9 tools do Epic 5 não lança', () => {
    const epic5 = toolRegistry
      .byDomain('journal')
      .concat(toolRegistry.byDomain('knowledge'));
    expect(epic5).toHaveLength(9);
    expect(() => toolRegistry.toAnthropicTools(epic5)).not.toThrow();
    expect(toolRegistry.toAnthropicTools(epic5)).toHaveLength(9);
  });
});
