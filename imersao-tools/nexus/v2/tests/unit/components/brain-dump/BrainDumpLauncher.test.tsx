import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { BrainDumpParsed } from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — BrainDumpLauncher tests (Story 5.7 — AC3/AC4)
 *
 * O pipeline AI real vive aqui (`[D-5.7-PERSIST]`): `onStructure` → `parseBrainDump`
 * (client de inferência) → em sucesso `createBrainDump(status:'parsed')` + estado
 * `parsed`; em falha estado `error` e ZERO writes (sem dump `pending` órfão).
 *
 * Mocks: o client de inferência (`parser-cliente`) e o repo (`brain-dumps`). O modal
 * é renderizado real (verificamos overlay/buckets/erro através dele).
 */

const mocks = vi.hoisted(() => ({
  parseBrainDump: vi.fn(),
  createBrainDump: vi.fn(),
}));

vi.mock('@/lib/brain-dump/parser-cliente', () => ({
  parseBrainDump: (...args: unknown[]) => mocks.parseBrainDump(...args),
}));

vi.mock('@/lib/db/repos/brain-dumps', () => ({
  createBrainDump: (...args: unknown[]) => mocks.createBrainDump(...args),
}));

// Importação DEPOIS dos vi.mock (factory hoisting).
import { BrainDumpLauncher } from '@/components/brain-dump/BrainDumpLauncher';

const PARSED: BrainDumpParsed = {
  tarefas: [{ id: 't1', texto: 'comprar tinta' }],
  projectos: [],
  ideias: [],
  decisoes: [],
};

/** Abre o modal (tecla "B") e escreve texto válido (≥ 50 chars). */
function openAndType(value = 'a'.repeat(60)): HTMLTextAreaElement {
  fireEvent.keyDown(window, { key: 'b' });
  const textarea = screen.getByTestId('brain-dump-textarea') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value } });
  return textarea;
}

beforeEach(() => {
  mocks.parseBrainDump.mockReset();
  mocks.createBrainDump.mockReset();
});

afterEach(cleanup);

describe('BrainDumpLauncher — pipeline AI (AC3)', () => {
  it('abre o modal ao premir "B"', () => {
    render(<BrainDumpLauncher />);
    expect(screen.queryByTestId('brain-dump-modal')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByTestId('brain-dump-modal')).toBeInTheDocument();
  });

  it('em sucesso: persiste com createBrainDump(status:"parsed") e mostra os buckets', async () => {
    mocks.parseBrainDump.mockResolvedValue(PARSED);
    mocks.createBrainDump.mockResolvedValue(undefined);
    render(<BrainDumpLauncher />);

    openAndType();
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-buckets')).toBeInTheDocument();
    });
    expect(mocks.parseBrainDump).toHaveBeenCalledWith('a'.repeat(60));
    expect(mocks.createBrainDump).toHaveBeenCalledTimes(1);
    const written = mocks.createBrainDump.mock.calls[0][0];
    expect(written).toMatchObject({
      bodyMarkdown: 'a'.repeat(60),
      parsedOutput: PARSED,
      status: 'parsed',
    });
    expect(typeof written.id).toBe('string');
    expect(typeof written.createdAt).toBe('number');
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
    expect(screen.queryByTestId('brain-dump-buckets')).not.toBeInTheDocument();
  });

  it('mostra o overlay "A estruturar…" enquanto o parse está pendente', async () => {
    let resolveParse!: (value: BrainDumpParsed) => void;
    mocks.parseBrainDump.mockReturnValue(
      new Promise<BrainDumpParsed>((resolve) => {
        resolveParse = resolve;
      }),
    );
    mocks.createBrainDump.mockResolvedValue(undefined);
    render(<BrainDumpLauncher />);

    openAndType();
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));

    await waitFor(() => {
      expect(screen.getByTestId('brain-dump-loading-overlay')).toBeInTheDocument();
    });

    resolveParse(PARSED);
    await waitFor(() => {
      expect(screen.queryByTestId('brain-dump-loading-overlay')).not.toBeInTheDocument();
    });
  });
});
