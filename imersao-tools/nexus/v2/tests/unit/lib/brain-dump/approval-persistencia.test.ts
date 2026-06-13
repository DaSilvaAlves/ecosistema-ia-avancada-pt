import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import {
  persistApprovedItems,
  computeNewStatus,
  SYSTEM_AREA_ID,
  INBOX_NOTEBOOK_ID,
  DECISAO_TAG_ID,
  type ApprovedItem,
} from '@/lib/brain-dump/approval-persistencia';
import { createBrainDump, getBrainDump } from '@/lib/db/repos/brain-dumps';
import type { BrainDump } from '@/types/db';
import type { BrainDumpParsed } from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — approval-persistencia tests (Story 5.8 — AC3/AC4/AC7)
 *
 * Testes contra Dexie REAL (fake-indexeddb): só assim se prova a atomicidade da
 * transacção `'rw'` multi-store e o rollback (`[D-5.8-BATCH]`). Os repos não são
 * mockados — verifica-se o efeito real nas tabelas (entidades criadas / revertidas)
 * e que os repos correctos são chamados com os campos correctos.
 *
 * `mock-protocol-fidelity.md`: usar os repos reais faz qualquer mudança de
 * assinatura quebrar estes testes (mais forte que mockar).
 */

const PARSED: BrainDumpParsed = {
  tarefas: [{ id: 't1', texto: 'comprar tinta' }],
  projectos: [{ id: 'p1', texto: 'renovar escritório' }],
  ideias: [{ id: 'i1', texto: 'app de receitas' }],
  decisoes: [{ id: 'd1', texto: 'mudar de banco?' }],
};

function makeBrainDump(overrides: Partial<BrainDump> = {}): BrainDump {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    bodyMarkdown: 'texto livre do brain dump',
    parsedOutput: PARSED,
    status: 'parsed',
    ...overrides,
  };
}

/** Gerador de ids determinístico para entidades criadas. */
function seqIdFn(): () => string {
  let n = 0;
  return () => `11111111-1111-4111-8111-00000000000${(++n).toString(16).padStart(1, '0')}`;
}

beforeEach(async () => {
  await db.tasks.clear();
  await db.projects.clear();
  await db.knowledge_areas.clear();
  await db.knowledge_notebooks.clear();
  await db.knowledge_notes.clear();
  await db.tags.clear();
  await db.brain_dumps.clear();
});

describe('computeNewStatus (`[D-5.8-STATUS-TRANSITION]`)', () => {
  it('fully_approved quando guardados === propostos', () => {
    expect(computeNewStatus(4, 4)).toBe('fully_approved');
  });

  it('partially_approved quando 1 ≤ guardados < propostos', () => {
    expect(computeNewStatus(1, 4)).toBe('partially_approved');
    expect(computeNewStatus(3, 4)).toBe('partially_approved');
  });

  it('lança se guardados < 1 (invariante — botão desactivado a 0)', () => {
    expect(() => computeNewStatus(0, 4)).toThrow(/pelo menos um item/i);
  });
});

describe('persistApprovedItems — happy path (AC3/AC4)', () => {
  it('persiste cada bucket no repo correcto com os campos esperados', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    const items: ApprovedItem[] = [
      { bucket: 'tarefas', texto: 'comprar tinta' },
      { bucket: 'projectos', texto: 'renovar escritório' },
      { bucket: 'ideias', texto: 'app de receitas' },
      { bucket: 'decisoes', texto: 'mudar de banco?' },
    ];

    const count = await persistApprovedItems(items, dump.id, 4, { idFn: seqIdFn() });
    expect(count).toBe(4);

    // Tarefa simples (sem tag).
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(2); // tarefa + decisão (ambas são Task)
    const tarefa = tasks.find((t) => t.title === 'comprar tinta');
    expect(tarefa).toMatchObject({
      title: 'comprar tinta',
      description: '',
      priority: 'medium',
      status: 'todo',
      projectId: null,
      tags: [],
    });

    // Decisão → Task com a tag de sistema `decisao`.
    const decisao = tasks.find((t) => t.title === 'mudar de banco?');
    expect(decisao?.tags).toEqual([DECISAO_TAG_ID]);

    // Projecto.
    const projects = await db.projects.toArray();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: 'renovar escritório',
      description: '',
      status: 'active',
      deadline: null,
    });

    // Nota/ideia no caderno _inbox.
    const notes = await db.knowledge_notes.toArray();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      title: 'app de receitas',
      notebookId: INBOX_NOTEBOOK_ID,
      bodyMarkdown: '',
      tags: [],
    });
  });

  it('transiciona status para fully_approved dentro da transacção (atomicidade)', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    await persistApprovedItems(
      [
        { bucket: 'tarefas', texto: 'comprar tinta' },
        { bucket: 'projectos', texto: 'renovar escritório' },
        { bucket: 'ideias', texto: 'app de receitas' },
        { bucket: 'decisoes', texto: 'mudar de banco?' },
      ],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );

    const fresh = await getBrainDump(dump.id);
    expect(fresh?.status).toBe('fully_approved');
  });

  it('transiciona para partially_approved quando guardados < propostos', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    const count = await persistApprovedItems(
      [{ bucket: 'tarefas', texto: 'comprar tinta' }],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );
    expect(count).toBe(1);
    const fresh = await getBrainDump(dump.id);
    expect(fresh?.status).toBe('partially_approved');
  });
});

describe('persistApprovedItems — sistema idempotente (`[D-5.8-INBOX]`/`[D-5.8-TAG-DECISAO]`)', () => {
  it('cria área de sistema + _inbox com IDs determinísticos fixos', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    await persistApprovedItems(
      [{ bucket: 'ideias', texto: 'app de receitas' }],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );

    const area = await db.knowledge_areas.get(SYSTEM_AREA_ID);
    expect(area).toMatchObject({ id: SYSTEM_AREA_ID, name: 'Sistema' });
    const inbox = await db.knowledge_notebooks.get(INBOX_NOTEBOOK_ID);
    expect(inbox).toMatchObject({ id: INBOX_NOTEBOOK_ID, areaId: SYSTEM_AREA_ID });
  });

  it('cria a tag de sistema `decisao` com id UUID fixo e slug ASCII no name', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    await persistApprovedItems(
      [{ bucket: 'decisoes', texto: 'mudar de banco?' }],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );

    const tag = await db.tags.get(DECISAO_TAG_ID);
    expect(tag).toMatchObject({ id: DECISAO_TAG_ID, name: 'decisao' });
  });

  it('idempotente entre dumps: 2 dumps com decisões NÃO duplicam a tag (createTag lançaria)', async () => {
    const dump1 = makeBrainDump();
    const dump2 = makeBrainDump();
    await createBrainDump(dump1);
    await createBrainDump(dump2);

    await persistApprovedItems(
      [{ bucket: 'decisoes', texto: 'decisão 1' }],
      dump1.id,
      1,
      { idFn: () => crypto.randomUUID() },
    );
    // Segundo dump não deve lançar por tag duplicada (get-or-create por id).
    await persistApprovedItems(
      [{ bucket: 'decisoes', texto: 'decisão 2' }],
      dump2.id,
      1,
      { idFn: () => crypto.randomUUID() },
    );

    const tags = await db.tags.toArray();
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBe(DECISAO_TAG_ID);
  });

  it('idempotente entre dumps: 2 dumps com ideias NÃO duplicam o _inbox', async () => {
    const dump1 = makeBrainDump();
    const dump2 = makeBrainDump();
    await createBrainDump(dump1);
    await createBrainDump(dump2);

    await persistApprovedItems(
      [{ bucket: 'ideias', texto: 'ideia 1' }],
      dump1.id,
      1,
      { idFn: () => crypto.randomUUID() },
    );
    await persistApprovedItems(
      [{ bucket: 'ideias', texto: 'ideia 2' }],
      dump2.id,
      1,
      { idFn: () => crypto.randomUUID() },
    );

    expect(await db.knowledge_notebooks.toArray()).toHaveLength(1);
    expect(await db.knowledge_areas.toArray()).toHaveLength(1);
    expect(await db.knowledge_notes.toArray()).toHaveLength(2);
  });

  it('só garante a tag se há decisões; só garante o _inbox se há ideias', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    await persistApprovedItems(
      [{ bucket: 'tarefas', texto: 'só uma tarefa' }],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );

    expect(await db.tags.toArray()).toHaveLength(0);
    expect(await db.knowledge_notebooks.toArray()).toHaveLength(0);
    expect(await db.knowledge_areas.toArray()).toHaveLength(0);
  });
});

describe('persistApprovedItems — caminhos de falha e rollback (eixo c — `[D-5.8-BATCH]`)', () => {
  it('rollback total se updateBrainDump lança (dump eliminado) — zero entidades', async () => {
    // Não cria o brain dump → updateBrainDump lança "não encontrado" dentro da
    // transacção → rollback de todos os writes de entidades.
    const fakeId = crypto.randomUUID();

    await expect(
      persistApprovedItems(
        [
          { bucket: 'tarefas', texto: 'comprar tinta' },
          { bucket: 'ideias', texto: 'app de receitas' },
        ],
        fakeId,
        4,
        { idFn: seqIdFn() },
      ),
    ).rejects.toThrow(/não encontrado/i);

    // Rollback: nenhuma entidade nem sistema criados.
    expect(await db.tasks.toArray()).toHaveLength(0);
    expect(await db.knowledge_notes.toArray()).toHaveLength(0);
    expect(await db.knowledge_notebooks.toArray()).toHaveLength(0);
    expect(await db.knowledge_areas.toArray()).toHaveLength(0);
  });

  it('rollback total se um item lança (texto que falha o schema) — status inalterado', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    // Um id de entidade inválido (não-UUID) faz createTask lançar via Zod → rollback.
    await expect(
      persistApprovedItems(
        [{ bucket: 'tarefas', texto: 'comprar tinta' }],
        dump.id,
        4,
        { idFn: () => 'id-nao-uuid' },
      ),
    ).rejects.toThrow();

    expect(await db.tasks.toArray()).toHaveLength(0);
    const fresh = await getBrainDump(dump.id);
    expect(fresh?.status).toBe('parsed'); // inalterado
  });

  it('lança se nenhum item válido (todos com texto vazio) — sem writes', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    await expect(
      persistApprovedItems(
        [
          { bucket: 'tarefas', texto: '   ' },
          { bucket: 'ideias', texto: '' },
        ],
        dump.id,
        4,
      ),
    ).rejects.toThrow(/pelo menos um item/i);

    expect(await db.tasks.toArray()).toHaveLength(0);
    const fresh = await getBrainDump(dump.id);
    expect(fresh?.status).toBe('parsed');
  });

  it('ignora itens com texto vazio mas persiste os restantes (defensivo `[D-5.8-EDIT-INLINE]`)', async () => {
    const dump = makeBrainDump();
    await createBrainDump(dump);

    const count = await persistApprovedItems(
      [
        { bucket: 'tarefas', texto: 'comprar tinta' },
        { bucket: 'tarefas', texto: '   ' }, // ignorado
      ],
      dump.id,
      4,
      { idFn: seqIdFn() },
    );

    expect(count).toBe(1);
    expect(await db.tasks.toArray()).toHaveLength(1);
  });
});
