import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from '@testing-library/react';

/**
 * Nexus v2 — KnowledgePage: abort da pesquisa web ao desligar o modo web
 * (Story 5.11 / FR55 — CR Major "Abort active web-search requests when web
 * mode is turned off").
 *
 * Antes deste fix, o `AbortController` da pesquisa web só era cancelado no
 * unmount. Ao desligar o modo web (toggle ou Escape) com um request em curso,
 * a chamada Anthropic/DDG ficava a correr — desperdício de chamada externa e
 * `setState` sobre estado já escondido. O `useEffect` reactivo a `webSearchMode`
 * (em `page.tsx`) aborta o request na transição para `false` e limpa
 * `webIsSearching`.
 *
 * Estratégia: `fetch` mockado devolve uma promise que nunca resolve (request
 * pendente) e captura o `signal` recebido. Isto fixa `webIsSearching === true`
 * (sinal observável: nó com `aria-label="A pesquisar na web"`). Ao desligar o
 * modo web, asserta-se:
 *   - `signal.aborted === true` (o `AbortController` foi de facto abortado);
 *   - o nó de loading desaparece (`webIsSearching` voltou a `false`).
 *
 * Cobre os dois caminhos de desligar o modo (toggle e Escape) e um caso
 * negativo (ligar o modo não aborta indevidamente / não corre em loop).
 *
 * Padrão (precedente patrimonio/page.test.tsx Story 3.9): mock dos hooks
 * Dexie + `next/navigation`; zero acesso a Dexie real. `fetch` via
 * `vi.stubGlobal` (precedente tests/unit/api Story 5.11).
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useKnowledgeAreas: vi.fn(),
  useTags: vi.fn(),
  useLiveQuery: vi.fn(),
  searchNotes: vi.fn(),
  listAllNotebooks: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack }),
}));

vi.mock('@/hooks/useKnowledgeAreas', () => ({
  useKnowledgeAreas: () => mocks.useKnowledgeAreas(),
}));

vi.mock('@/hooks/useTags', () => ({
  useTags: () => mocks.useTags(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => mocks.useLiveQuery(fn),
}));

vi.mock('@/lib/db/repos/knowledge-notes', () => ({
  createKnowledgeNote: vi.fn(),
  updateKnowledgeNote: vi.fn(),
  deleteKnowledgeNote: vi.fn(),
  listNotesByNotebook: vi.fn(),
  listNotesByTag: vi.fn(),
  searchNotes: (...args: unknown[]) => mocks.searchNotes(...args),
}));

vi.mock('@/lib/db/repos/knowledge-areas', () => ({
  createKnowledgeArea: vi.fn(),
  updateKnowledgeArea: vi.fn(),
  deleteKnowledgeArea: vi.fn(),
}));

vi.mock('@/lib/db/repos/knowledge-notebooks', () => ({
  createKnowledgeNotebook: vi.fn(),
  updateKnowledgeNotebook: vi.fn(),
  deleteKnowledgeNotebook: vi.fn(),
  listNotebooksByArea: vi.fn(),
  listAllNotebooks: (...args: unknown[]) => mocks.listAllNotebooks(...args),
}));

// Importação tem de vir DEPOIS dos `vi.mock` (factory hoisting do Vitest).
import KnowledgePage from '@/app/(app)/knowledge/page';

/** Captura o `AbortSignal` passado ao fetch da pesquisa web. */
let capturedSignal: AbortSignal | null = null;

/**
 * `fetch` mockado: nunca resolve (request pendente), o que mantém
 * `webIsSearching === true` até o abort. Capta o `signal` para assertar o
 * abort observado pelo `AbortController`.
 */
function makePendingFetch(): typeof fetch {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    capturedSignal = init?.signal ?? null;
    return new Promise<Response>(() => {
      /* nunca resolve — simula request web em curso */
    });
  }) as unknown as typeof fetch;
}

/** Liga o modo web e submete uma pesquisa (deixa o request pendente). */
function enterWebModeAndSearch(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Alternar pesquisa web' }));
  const input = screen.getByRole('searchbox', { name: 'Pesquisar na web' });
  fireEvent.change(input, { target: { value: 'inteligência artificial' } });
  fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
}

describe('KnowledgePage — abort da pesquisa web ao desligar o modo (Story 5.11 / CR Major)', () => {
  beforeEach(() => {
    mocks.routerBack.mockReset();
    mocks.useKnowledgeAreas.mockReset().mockReturnValue([]);
    mocks.useTags.mockReset().mockReturnValue([]);
    mocks.useLiveQuery.mockReset().mockReturnValue([]);
    mocks.searchNotes.mockReset().mockResolvedValue([]);
    mocks.listAllNotebooks.mockReset().mockResolvedValue([]);
    capturedSignal = null;
    vi.stubGlobal('fetch', makePendingFetch());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('aborta o request e limpa webIsSearching ao desligar o modo web via toggle', async () => {
    render(<KnowledgePage />);

    enterWebModeAndSearch();

    // Request em curso: estado de loading visível e signal ainda não abortado.
    expect(await screen.findByLabelText('A pesquisar na web')).toBeInTheDocument();
    expect(capturedSignal).not.toBeNull();
    expect(capturedSignal?.aborted).toBe(false);

    // Desliga o modo web (mesmo botão toggle, agora pressed).
    fireEvent.click(screen.getByRole('button', { name: 'Alternar pesquisa web' }));

    // O AbortController foi abortado e o estado de loading desapareceu.
    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
    expect(screen.queryByLabelText('A pesquisar na web')).not.toBeInTheDocument();
  });

  it('aborta o request ao desligar o modo web via Escape (query web já vazia)', async () => {
    render(<KnowledgePage />);

    enterWebModeAndSearch();
    expect(await screen.findByLabelText('A pesquisar na web')).toBeInTheDocument();

    // Limpa a query web para que o primeiro Escape saia do modo web (AC3/AC6).
    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar na web' }), {
      target: { value: '' },
    });
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    await waitFor(() => expect(capturedSignal?.aborted).toBe(true));
    expect(screen.queryByLabelText('A pesquisar na web')).not.toBeInTheDocument();
  });

  it('ligar o modo web não aborta indevidamente nem corre em loop (caso negativo)', async () => {
    render(<KnowledgePage />);

    // Liga o modo web sem submeter qualquer pesquisa: nenhum AbortController criado.
    fireEvent.click(screen.getByRole('button', { name: 'Alternar pesquisa web' }));

    // O input web está visível (modo web activo) e nenhum fetch foi disparado.
    expect(
      screen.getByRole('searchbox', { name: 'Pesquisar na web' }),
    ).toBeInTheDocument();
    expect(capturedSignal).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
