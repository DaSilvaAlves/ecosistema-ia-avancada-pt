import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { BrainDumpParsed } from '@/lib/brain-dump/ai-parser';
import type { BrainDump } from '@/types/db';

/**
 * Nexus v2 — BrainDumpLauncher tests (Stories 5.7 + 5.8 — AC1/AC3/AC4/AC5/AC7)
 *
 * 5.7: pipeline AI (`parseBrainDump` → `createBrainDump(status:'parsed')`).
 * 5.8: re-leitura + re-validação (`getBrainDump` + `BrainDumpParsedSchema`) →
 * approving; orquestração de `persistApprovedItems` (transacção atómica) → toast +
 * fecho; ciclo de vida (dump eliminado, parsedOutput corrompido, batch falhado).
 *
 * Mocks: client de inferência, repos (`brain-dumps`) e o helper de persistência. O
 * modal/approval view são renderizados reais.
 */

const mocks = vi.hoisted(() => ({
  parseBrainDump: vi.fn(),
  createBrainDump: vi.fn(),
  getBrainDump: vi.fn(),
  persistApprovedItems: vi.fn(),
}));

vi.mock('@/lib/brain-dump/parser-cliente', () => ({
  parseBrainDump: (...args: unknown[]) => mocks.parseBrainDump(...args),
}));

vi.mock('@/lib/db/repos/brain-dumps', () => ({
  createBrainDump: (...args: unknown[]) => mocks.createBrainDump(...args),
  getBrainDump: (...args: unknown[]) => mocks.getBrainDump(...args),
}));

vi.mock('@/lib/brain-dump/approval-persistencia', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/lib/brain-dump/approval-persistencia')
  >();
  return {
    ...actual,
    persistApprovedItems: (...args: unknown[]) => mocks.persistApprovedItems(...args),
  };
});

// Importação DEPOIS dos vi.mock (factory hoisting).
import { BrainDumpLauncher } from '@/components/brain-dump/BrainDumpLauncher';

const PARSED: BrainDumpParsed = {
  tarefas: [{ id: 't1', texto: 'comprar tinta' }],
  projectos: [],
  ideias: [{ id: 'i1', texto: 'app de receitas' }],
  decisoes: [],
};

function freshDump(parsedOutput: unknown = PARSED): BrainDump {
  return {
    id: 'dump-1',
    createdAt: Date.now(),
    bodyMarkdown: 'a'.repeat(60),
    parsedOutput,
    status: 'parsed',
  };
}

/** Abre o modal (tecla "B") e escreve texto válido (≥ 50 chars). */
function openAndType(value = 'a'.repeat(60)): void {
  fireEvent.keyDown(window, { key: 'b' });
  const textarea = screen.getByTestId('brain-dump-textarea') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value } });
}

/** Dispara o parse e espera que o approval flow apareça. */
async function structureToApproving(): Promise<void> {
  mocks.parseBrainDump.mockResolvedValue(PARSED);
  mocks.createBrainDump.mockResolvedValue(undefined);
  mocks.getBrainDump.mockResolvedValue(freshDump());
  openAndType();
  fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));
  await waitFor(() => {
    expect(screen.getByTestId('brain-dump-approval')).toBeInTheDocument();
  });
}

beforeEach(() => {
  mocks.parseBrainDump.mockReset();
  mocks.createBrainDump.mockReset();
  mocks.getBrainDump.mockReset();
  mocks.persistApprovedItems.mockReset();
});

afterEach(cleanup);

describe('BrainDumpLauncher — pipeline AI (AC3) + transição approving (AC1)', () => {
  it('abre o modal ao premir "B"', () => {
    render(<BrainDumpLauncher />);
    expect(screen.queryByTestId('brain-dump-modal')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByTestId('brain-dump-modal')).toBeInTheDocument();
  });

  it('em sucesso: persiste, re-lê, re-valida e mostra os controlos de aprovação', async () => {
    render(<BrainDumpLauncher />);
    await structureToApproving();

    expect(mocks.parseBrainDump).toHaveBeenCalledWith('a'.repeat(60));
    expect(mocks.createBrainDump).toHaveBeenCalledTimes(1);
    // O launcher captura o id que criou e re-lê esse mesmo id (não descarta — 5.7 bug).
    const createdId = mocks.createBrainDump.mock.calls[0][0].id as string;
    expect(mocks.getBrainDump).toHaveBeenCalledWith(createdId);
    // Controlos interactivos visíveis (checkboxes), não o display read-only da 5.7.
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('brain-dump-buckets')).not.toBeInTheDocument();
  });

  it('em falha do parse: mostra erro PT-PT e NÃO persiste (zero writes)', async () => {
    mocks.parseBrainDump.mockRejectedValue(
      new Error('Não foi possível estruturar o brain dump (proxy respondeu 429).'),
    );
    render(<BrainDumpLauncher />);
    openAndType();
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-error')).toHaveTextContent(
        /proxy respondeu 429/,
      );
    });
    expect(mocks.createBrainDump).not.toHaveBeenCalled();
    expect(screen.queryByTestId('brain-dump-approval')).not.toBeInTheDocument();
  });
});

describe('BrainDumpLauncher — re-validação (AC1, `[D-5.8-REREAD]`)', () => {
  it('parsedOutput corrompido na re-leitura → erro PT-PT, sem controlos', async () => {
    mocks.parseBrainDump.mockResolvedValue(PARSED);
    mocks.createBrainDump.mockResolvedValue(undefined);
    // getBrainDump devolve parsedOutput de shape inválido.
    mocks.getBrainDump.mockResolvedValue(freshDump({ lixo: true }));
    render(<BrainDumpLauncher />);
    openAndType();
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-error')).toHaveTextContent(
        /dados estão corrompidos/i,
      );
    });
    expect(screen.queryByTestId('brain-dump-approval')).not.toBeInTheDocument();
  });

  it('dump não encontrado na re-leitura → erro PT-PT', async () => {
    mocks.parseBrainDump.mockResolvedValue(PARSED);
    mocks.createBrainDump.mockResolvedValue(undefined);
    mocks.getBrainDump.mockResolvedValue(undefined);
    render(<BrainDumpLauncher />);
    openAndType();
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-error')).toHaveTextContent(
        /não foi encontrado/i,
      );
    });
    expect(screen.queryByTestId('brain-dump-approval')).not.toBeInTheDocument();
  });
});

describe('BrainDumpLauncher — persistência (AC4/AC5)', () => {
  it('happy path: guarda todos → persistApprovedItems com total proposto → toast + fecho', async () => {
    mocks.persistApprovedItems.mockResolvedValue(2);
    render(<BrainDumpLauncher />);
    await structureToApproving();

    fireEvent.click(screen.getByTestId('brain-dump-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-toast')).toBeInTheDocument();
    });
    // Modal fechou.
    expect(screen.queryByTestId('brain-dump-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('brain-dump-toast')).toHaveTextContent('2 itens guardados');

    // persistApprovedItems chamado com (items, id, totalPropostos). O id é o mesmo
    // que foi criado e re-lido (propagação do id — corrige o descarte da 5.7).
    expect(mocks.persistApprovedItems).toHaveBeenCalledTimes(1);
    const createdId = mocks.createBrainDump.mock.calls[0][0].id as string;
    const [items, id, total] = mocks.persistApprovedItems.mock.calls[0];
    expect(id).toBe(createdId);
    expect(total).toBe(2); // 1 tarefa + 1 ideia propostas
    expect(items).toHaveLength(2);
  });

  it('batch falha → estado approvalError, modal permanece aberto, sem toast', async () => {
    mocks.persistApprovedItems.mockRejectedValue(
      new Error('O brain dump foi eliminado.'),
    );
    render(<BrainDumpLauncher />);
    await structureToApproving();

    fireEvent.click(screen.getByTestId('brain-dump-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-approval-error')).toHaveTextContent(
        /foi eliminado/i,
      );
    });
    expect(screen.queryByTestId('brain-dump-toast')).not.toBeInTheDocument();
    // Os controlos continuam visíveis para "Tentar novamente".
    expect(screen.getByTestId('brain-dump-save-button')).toBeInTheDocument();
  });

  it('só guarda os itens seleccionados (rejeição decrementa o payload)', async () => {
    mocks.persistApprovedItems.mockResolvedValue(1);
    render(<BrainDumpLauncher />);
    await structureToApproving();

    // Rejeita a ideia; guarda só a tarefa.
    fireEvent.click(
      screen.getByRole('button', { name: 'Rejeitar item: app de receitas' }),
    );
    fireEvent.click(screen.getByTestId('brain-dump-save-button'));

    await waitFor(() => {
      expect(mocks.persistApprovedItems).toHaveBeenCalledTimes(1);
    });
    const [items, , total] = mocks.persistApprovedItems.mock.calls[0];
    expect(total).toBe(2); // total proposto inalterado
    expect(items).toEqual([{ bucket: 'tarefas', texto: 'comprar tinta' }]);
  });
});
