import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createBrainDump,
  getBrainDump,
  listBrainDumps,
  listBrainDumpsByStatus,
  updateBrainDump,
  deleteBrainDump,
} from '@/lib/db/repos/brain-dumps';
import type { BrainDump } from '@/types/db';

/**
 * Nexus v2 — brain_dumps repo tests (Story 5.1 / AC8)
 *
 * Cobre CRUD + validação Zod (status fora do conjunto, createdAt não-positivo,
 * bodyMarkdown vazio) + ordenação DESC por createdAt + filtro por status.
 */

function makeDump(overrides: Partial<BrainDump> = {}): BrainDump {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    bodyMarkdown: 'Comprar pão. Ligar ao João. Ideia: app de receitas.',
    status: 'pending',
    ...overrides,
  };
}

describe('brain-dumps repo', () => {
  beforeEach(async () => {
    await db.brain_dumps.clear();
  });

  it('createBrainDump + getBrainDump roundtrip', async () => {
    const dump = makeDump();
    await createBrainDump(dump);
    expect(await getBrainDump(dump.id)).toEqual(dump);
  });

  it('createBrainDump aceita parsedOutput opcional (4 buckets AI)', async () => {
    const dump = makeDump({
      status: 'parsed',
      parsedOutput: { tasks: ['Comprar pão'], projects: [], ideas: ['app receitas'], decisions: [] },
    });
    await createBrainDump(dump);
    expect((await getBrainDump(dump.id))?.parsedOutput).toBeDefined();
  });

  it('createBrainDump rejeita bodyMarkdown vazio com mensagem PT-PT', async () => {
    await expect(createBrainDump(makeDump({ bodyMarkdown: '' }))).rejects.toThrow(
      /O corpo do brain dump é obrigatório/,
    );
  });

  it('createBrainDump rejeita status fora do conjunto', async () => {
    await expect(
      createBrainDump(makeDump({ status: 'aprovado' as unknown as BrainDump['status'] })),
    ).rejects.toThrow();
  });

  it('createBrainDump rejeita createdAt não-positivo', async () => {
    await expect(createBrainDump(makeDump({ createdAt: 0 }))).rejects.toThrow(
      /createdAt deve ser epoch ms positivo/,
    );
  });

  it('listBrainDumps devolve ordenado por createdAt desc (historial)', async () => {
    const base = Date.now();
    await createBrainDump(makeDump({ createdAt: base - 3000 }));
    await createBrainDump(makeDump({ createdAt: base - 1000 }));
    await createBrainDump(makeDump({ createdAt: base - 2000 }));

    const result = await listBrainDumps();
    expect(result.map((d) => d.createdAt)).toEqual([base - 1000, base - 2000, base - 3000]);
  });

  it('listBrainDumpsByStatus filtra pelo estado, ordenado desc', async () => {
    const base = Date.now();
    await createBrainDump(makeDump({ status: 'pending', createdAt: base - 1000 }));
    await createBrainDump(makeDump({ status: 'parsed', createdAt: base - 2000 }));
    await createBrainDump(makeDump({ status: 'parsed', createdAt: base - 500 }));

    const parsed = await listBrainDumpsByStatus('parsed');
    expect(parsed).toHaveLength(2);
    expect(parsed.map((d) => d.createdAt)).toEqual([base - 500, base - 2000]);
  });

  it('updateBrainDump aplica patch parcial (transição de status)', async () => {
    const dump = makeDump({ status: 'pending' });
    await createBrainDump(dump);
    await updateBrainDump(dump.id, { status: 'parsed' });
    expect((await getBrainDump(dump.id))?.status).toBe('parsed');
  });

  it('updateBrainDump lança se id não existe', async () => {
    await expect(
      updateBrainDump('00000000-0000-0000-0000-000000000000', { status: 'parsed' }),
    ).rejects.toThrow(/não encontrado/i);
  });

  it('deleteBrainDump remove o brain dump (folha — sem cascata)', async () => {
    const dump = makeDump();
    await createBrainDump(dump);
    await deleteBrainDump(dump.id);
    expect(await getBrainDump(dump.id)).toBeUndefined();
  });
});
