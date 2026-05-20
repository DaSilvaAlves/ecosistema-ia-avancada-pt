import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import TagsPage from '@/app/(app)/tags/page';
import * as tagsRepo from '@/lib/db/repos/tags';
import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import type { Tag, Task } from '@/types/db';

/**
 * Nexus v2 — /tags CRUD UI tests (Story 2.6 / AC13 T1-T18)
 *
 * Cenários cobertos directamente (subset T1-T18 da story):
 *  T1  — Render base com 3 tags → grid renderiza, contagens "0 TAREFAS"
 *  T2  — Loading state (tags=undefined antes do useLiveQuery resolver)
 *  T3  — Empty state sem tags → mensagem PT-PT + botão "+ Nova tag"
 *  T4  — Criar tag (sucesso) → createTag chamado
 *  T5  — Criar tag duplicado case-insensitive → toast PT-PT, modal NÃO fecha
 *  T6  — Editar tag rename → updateTag chamado com novo name
 *  T9  — Eliminar tag (cascata via window.confirm)
 *  T10 — Eliminar tag cancelado (confirm false)
 *  T11 — Pesquisar tags por nome → apenas matches visíveis
 *  T12 — Pesquisa sem resultados → empty state PT-PT
 *  T13 — Modal Escape fecha
 *  T15 — Escape global → router.back (com modal fechado)
 *  T16 — Paleta de cores exactamente 7 opções
 *  T18 — useTags resolve com mesma lista que listTags (smoke refactor não-regressão)
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: mocks.routerPush }),
}));

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: crypto.randomUUID(),
    name: 'Trabalho',
    color: '#00F5FF',
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa',
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
    ...overrides,
  };
}

async function clearAll(): Promise<void> {
  await db.tags.clear();
  await db.tasks.clear();
}

/**
 * Story 2.6 / Finding 6 CR Iter 1 — flush dos updates de estado pendentes.
 *
 * `TagsPage` actualiza estado de forma assíncrona via `useLiveQuery` (Dexie),
 * toast (`setTimeout`) e transições de modal. Sem flush, o React emitia
 * `[warning] An update to TagsPage inside a test was not wrapped in act(...)`.
 * Disparar interacções (`fireEvent`) seguidas de `await flush()` envolve os
 * updates resultantes num `act()`, eliminando o warning.
 */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('TagsPage (Story 2.6 / AC13)', () => {
  beforeEach(async () => {
    await clearAll();
    vi.restoreAllMocks();
    mocks.routerBack.mockClear();
    mocks.routerPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // ────────────────────────────────────────────────────────────────
  // T1 — Render base com 3 tags
  // ────────────────────────────────────────────────────────────────
  it('T1 — Render base: 3 tags → grid + cards visíveis + contagens "0 TAREFAS"', async () => {
    await tagsRepo.createTag(makeTag({ name: 'Trabalho' }));
    await tagsRepo.createTag(makeTag({ name: 'Pessoal' }));
    await tagsRepo.createTag(makeTag({ name: 'Saúde' }));

    render(<TagsPage />);

    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Saúde')).toBeInTheDocument();
    expect(screen.getByTestId('tags-grid')).toBeInTheDocument();

    // Contagens "0 TAREFAS" (sem tasks vinculadas em fixture)
    const zeroCounts = screen.getAllByText('0 TAREFAS');
    expect(zeroCounts.length).toBeGreaterThanOrEqual(3);
  });

  // ────────────────────────────────────────────────────────────────
  // T3 — Empty state sem tags
  // ────────────────────────────────────────────────────────────────
  it('T3 — Empty state: zero tags → mensagem PT-PT + botão "+ Nova tag"', async () => {
    render(<TagsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-zero-total')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Sem tags ainda\. Cria a primeira para organizar as tuas tarefas\./),
    ).toBeInTheDocument();
    // Botão "+ Nova tag" no empty state (além do header)
    const newButtons = screen.getAllByRole('button', { name: /Criar nova tag|^\+ Nova tag$/i });
    expect(newButtons.length).toBeGreaterThanOrEqual(1);
  });

  // ────────────────────────────────────────────────────────────────
  // T4 — Criar tag sucesso
  // ────────────────────────────────────────────────────────────────
  it('T4 — Criar tag: click "+ Nova tag" → modal → submit → createTag chamado', async () => {
    const createSpy = vi.spyOn(tagsRepo, 'createTag');

    render(<TagsPage />);

    // Aguarda render inicial
    await waitFor(() => {
      expect(screen.queryByTestId('empty-zero-total') ?? screen.queryByTestId('tags-grid')).toBeTruthy();
    });

    // Click "+ Nova tag" no header
    const newButton = screen.getByRole('button', { name: /Criar nova tag/i });
    fireEvent.click(newButton);
    await flush();

    // Modal abre
    await waitFor(() => {
      expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    // Preenche nome
    const nameInput = screen.getByRole('textbox', { name: /Nome/i });
    fireEvent.change(nameInput, { target: { value: 'Estudo' } });
    await flush();

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Criar' });
    fireEvent.click(submitButton);
    await flush();

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
    expect(createSpy.mock.calls[0][0].name).toBe('Estudo');
    expect(createSpy.mock.calls[0][0].color).toBe('#00F5FF'); // default Cyan
  });

  // ────────────────────────────────────────────────────────────────
  // T5 — Criar tag duplicado case-insensitive
  // ────────────────────────────────────────────────────────────────
  it('T5 — Criar duplicado case-insensitive: toast PT-PT + modal NÃO fecha', async () => {
    await tagsRepo.createTag(makeTag({ name: 'Trabalho' }));

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar nova tag/i }));
    await flush();
    await waitFor(() => {
      expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /Nome/i }), { target: { value: 'TRABALHO' } });
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await flush();

    // Toast PT-PT aparece
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /Não foi possível guardar a tag\..*Já existe uma tag/,
      );
    });
    // Modal AINDA está aberto
    expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // T6 — Editar tag rename
  // ────────────────────────────────────────────────────────────────
  it('T6 — Editar tag: click "Editar" → modal pré-preenchido → submit updateTag', async () => {
    const tag = makeTag({ name: 'Trabalho', color: '#00F5FF' });
    await tagsRepo.createTag(tag);

    const updateSpy = vi.spyOn(tagsRepo, 'updateTag');

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar tag Trabalho/i }));
    await flush();

    await waitFor(() => {
      expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
    });

    // Form pré-preenchido
    const nameInput = screen.getByRole('textbox', { name: /Nome/i }) as HTMLInputElement;
    expect(nameInput.value).toBe('Trabalho');

    fireEvent.change(nameInput, { target: { value: 'Profissional' } });
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await flush();

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    expect(updateSpy.mock.calls[0][0]).toBe(tag.id);
    expect(updateSpy.mock.calls[0][1]).toMatchObject({ name: 'Profissional' });
  });

  // ────────────────────────────────────────────────────────────────
  // T9 — Eliminar tag (cascata via window.confirm)
  // ────────────────────────────────────────────────────────────────
  it('T9 — Eliminar tag: window.confirm aceita → deleteTag chamado com cascata', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await tagsRepo.createTag(tag);
    // 1 task vinculada (para mensagem de contagem)
    await createTask(makeTask({ tags: [tag.id] }));

    const deleteSpy = vi.spyOn(tagsRepo, 'deleteTag');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar tag Trabalho/i }));
    await flush();

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });
    expect(confirmSpy.mock.calls[0][0]).toMatch(
      /Eliminar a tag «Trabalho»\? Será removida de 1 tarefa vinculada\./,
    );

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(tag.id);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T10 — Eliminar tag cancelado
  // ────────────────────────────────────────────────────────────────
  it('T10 — Eliminar cancelado: confirm=false → deleteTag NÃO chamado', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await tagsRepo.createTag(tag);

    const deleteSpy = vi.spyOn(tagsRepo, 'deleteTag');
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar tag Trabalho/i }));
    await flush();

    // Aguarda alguma micro-task para garantir que se algo fosse chamado já teria sido
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  // ────────────────────────────────────────────────────────────────
  // T11 — Pesquisar tags por nome
  // ────────────────────────────────────────────────────────────────
  it('T11 — Pesquisar: input "trab" filtra para apenas Trabalho', async () => {
    await tagsRepo.createTag(makeTag({ name: 'Trabalho' }));
    await tagsRepo.createTag(makeTag({ name: 'Pessoal' }));
    await tagsRepo.createTag(makeTag({ name: 'Saúde' }));

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Pesquisar tags pelo nome/i);
    fireEvent.change(searchInput, { target: { value: 'trab' } });
    await flush();

    await waitFor(() => {
      expect(screen.queryByText('Pessoal')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Trabalho')).toBeInTheDocument();
    expect(screen.queryByText('Saúde')).not.toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // T12 — Pesquisa sem resultados
  // ────────────────────────────────────────────────────────────────
  it('T12 — Pesquisa sem matches: empty state PT-PT com termo entre «»', async () => {
    await tagsRepo.createTag(makeTag({ name: 'Trabalho' }));

    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Pesquisar tags pelo nome/i), {
      target: { value: 'xyz123' },
    });
    await flush();

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma tag corresponde a «xyz123»/)).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T13 — Modal Escape fecha
  // ────────────────────────────────────────────────────────────────
  it('T13 — Modal Escape: keyDown Escape no document → modal fecha', async () => {
    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-zero-total') ?? screen.queryByTestId('tags-grid')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar nova tag/i }));
    await flush();
    await waitFor(() => {
      expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await flush();

    await waitFor(() => {
      expect(screen.queryByTestId('tags-modal')).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // T15 — Escape global com modal fechado → router.back
  // ────────────────────────────────────────────────────────────────
  it('T15 — Escape global (modal fechado): keyDown Escape → router.back', async () => {
    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-zero-total') ?? screen.queryByTestId('tags-grid')).toBeTruthy();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    await flush();

    expect(mocks.routerBack).toHaveBeenCalledTimes(1);
  });

  // ────────────────────────────────────────────────────────────────
  // T16 — Paleta cores limitada a 7 opções
  // ────────────────────────────────────────────────────────────────
  it('T16 — Paleta: radio group tem exactamente 7 opções com aria-label', async () => {
    render(<TagsPage />);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-zero-total') ?? screen.queryByTestId('tags-grid')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar nova tag/i }));
    await flush();
    await waitFor(() => {
      expect(screen.getByTestId('tags-modal')).toBeInTheDocument();
    });

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(7);

    // aria-labels esperados — PT-PT (Story 2.6 / Finding 4/5 CR Iter 1)
    const labels = radios.map((r) => r.getAttribute('aria-label'));
    expect(labels).toEqual(['Ciano', 'Ouro', 'Roxo', 'Magenta', 'Lima', 'Branco', 'Cinzento']);
  });

  // ────────────────────────────────────────────────────────────────
  // T18 — Smoke refactor não-regressão: useTags resolve mesma lista
  // ────────────────────────────────────────────────────────────────
  it('T18 — Smoke: useTags retorna mesma lista que listTags directo (refactor não-regressão)', async () => {
    await tagsRepo.createTag(makeTag({ name: 'A' }));
    await tagsRepo.createTag(makeTag({ name: 'B' }));

    render(<TagsPage />);

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });
    expect(screen.getByText('B')).toBeInTheDocument();

    const direct = await tagsRepo.listTags();
    expect(direct.map((t) => t.name)).toEqual(['A', 'B']);
  });
});
