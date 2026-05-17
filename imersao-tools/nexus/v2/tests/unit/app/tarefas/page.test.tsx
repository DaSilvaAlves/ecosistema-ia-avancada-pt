import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import TarefasPage from '@/app/(app)/tarefas/page';
import { db } from '@/lib/db/client';
import * as tasksRepo from '@/lib/db/repos/tasks';
import type { Task } from '@/types/db';
import { createTask } from '@/lib/db/repos/tasks';
import { createProject } from '@/lib/db/repos/projects';
import { createTag } from '@/lib/db/repos/tags';

/**
 * Nexus v2 — Vista lista de tarefas tests (Story 2.3 / AC10)
 *
 * 10 cenários T1-T10 conforme AC10. Padrão herdado de tests/unit/db/repos/tasks.test.ts
 * (Story 2.1) + Testing Library para queries.
 *
 * Mock de `next/navigation` (router.back); restantes APIs via DB real (fake-indexeddb).
 */

// Mock partilhado de useRouter — back/push capturáveis nos testes via mocks.routerBack.
// `vi.hoisted` corre antes do `vi.mock` (factory hoisting do Vitest).
const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: mocks.routerPush }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa de teste',
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
  await db.tasks.clear();
  await db.projects.clear();
  await db.tags.clear();
}

describe('TarefasPage (Story 2.3 / AC10)', () => {
  beforeEach(async () => {
    await clearAll();
    vi.restoreAllMocks();
    mocks.routerBack.mockClear();
    mocks.routerPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // ─────────────────────────────────────────────────────────────────
  // T1 — Render base com dados
  // ─────────────────────────────────────────────────────────────────
  it('T1 — Render base com dados: 3 tasks + 1 projecto + 2 tags', async () => {
    const projectId = crypto.randomUUID();
    await createProject({
      id: projectId,
      name: 'Projecto Alpha',
      description: '',
      status: 'active',
      startDate: '2026-01-01',
      deadline: null,
      createdAt: Date.now() - 1000,
    });
    const tagA = { id: crypto.randomUUID(), name: 'urgente', color: '#FF006E' };
    const tagB = { id: crypto.randomUUID(), name: 'work', color: '#00F5FF' };
    await createTag(tagA);
    await createTag(tagB);

    await createTask(makeTask({ title: 'Tarefa Alpha', projectId, tags: [tagA.id] }));
    await createTask(makeTask({ title: 'Tarefa Beta' }));
    await createTask(makeTask({ title: 'Tarefa Gamma', tags: [tagB.id] }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa Alpha')).toBeInTheDocument();
      expect(screen.getByText('Tarefa Beta')).toBeInTheDocument();
      expect(screen.getByText('Tarefa Gamma')).toBeInTheDocument();
    });

    // Secção atrasadas escondida (sem dueDate atrasada)
    expect(screen.queryByText(/Atrasadas \(/)).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T2 — Estado loading (useTasks === undefined)
  // ─────────────────────────────────────────────────────────────────
  it('T2 — Estado loading: skeleton visível enquanto useTasks devolve undefined', async () => {
    // No primeiro render Dexie ainda não respondeu → useLiveQuery devolve undefined
    render(<TarefasPage />);

    // Skeleton renderiza com aria-busy
    expect(screen.getByLabelText('A carregar tarefas')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T3 — Estado vazio
  // ─────────────────────────────────────────────────────────────────
  it('T3 — Estado vazio: mensagem "Sem tarefas..." visível', async () => {
    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sem tarefas\. Cria a primeira/)).toBeInTheDocument();
    });

    // Botão "+ Nova" disabled — usar getByRole para evitar ambiguidade com texto noutros nós
    const novaBtn = screen.getByRole('button', { name: /\+ Nova/ });
    expect(novaBtn).toBeDisabled();
  });

  // ─────────────────────────────────────────────────────────────────
  // T4 — Atrasadas destacadas
  // ─────────────────────────────────────────────────────────────────
  it('T4 — Atrasadas destacadas: secção dedicada com contador', async () => {
    // dueDate de ontem (relativo a Date.now())
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');

    await createTask(makeTask({ title: 'Tarefa Atrasada', dueDate: `${yyyy}-${mm}-${dd}` }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText(/Atrasadas \(1\)/)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T5 — Filtro de status
  // ─────────────────────────────────────────────────────────────────
  it('T5 — Filtro de status: select "Feitas" mostra só status=done', async () => {
    await createTask(makeTask({ title: 'Por fazer task', status: 'todo' }));
    await createTask(makeTask({ title: 'Feita task', status: 'done' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Por fazer task')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Filtrar por estado da tarefa');
    fireEvent.change(statusSelect, { target: { value: 'done' } });

    await waitFor(() => {
      expect(screen.queryByText('Por fazer task')).not.toBeInTheDocument();
      expect(screen.getByText('Feita task')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T6 — Pesquisa por título (com debounce)
  // ─────────────────────────────────────────────────────────────────
  it('T6 — Pesquisa por título: input filtra após debounce 200ms', async () => {
    await createTask(makeTask({ title: 'Acabar PRD' }));
    await createTask(makeTask({ title: 'Comprar leite' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Acabar PRD')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Pesquisar tarefas pelo título');
    fireEvent.change(searchInput, { target: { value: 'PRD' } });

    // Aguardar debounce (200ms + margem)
    await waitFor(
      () => {
        expect(screen.queryByText('Comprar leite')).not.toBeInTheDocument();
        expect(screen.getByText('Acabar PRD')).toBeInTheDocument();
      },
      { timeout: 800 }
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // T7 — Marcar done (checkbox)
  // ─────────────────────────────────────────────────────────────────
  it('T7 — Marcar done: checkbox chama setTaskStatus com (id, "done")', async () => {
    const spy = vi.spyOn(tasksRepo, 'setTaskStatus');

    const task = makeTask({ title: 'Tarefa A', status: 'todo' });
    await createTask(task);

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa A')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Marcar tarefa "Tarefa A" como feita/);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(task.id, 'done');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T8a — Apagar com confirm=true → deleteTask chamado
  // ─────────────────────────────────────────────────────────────────
  it('T8a — Apagar com confirm=true: deleteTask chamado', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(tasksRepo, 'deleteTask');

    const task = makeTask({ title: 'Tarefa a apagar' });
    await createTask(task);

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa a apagar')).toBeInTheDocument();
    });

    // Abrir kebab menu
    const kebab = screen.getByLabelText(/Acções para a tarefa "Tarefa a apagar"/);
    fireEvent.click(kebab);

    // Clicar "Apagar"
    const apagarBtn = screen.getByRole('menuitem', { name: 'Apagar' });
    fireEvent.click(apagarBtn);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(task.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T8b — Apagar com confirm=false → deleteTask NÃO chamado (SF3 inline)
  // ─────────────────────────────────────────────────────────────────
  it('T8b — Apagar com confirm=false: deleteTask NÃO chamado', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const deleteSpy = vi.spyOn(tasksRepo, 'deleteTask');

    const task = makeTask({ title: 'Tarefa preservada' });
    await createTask(task);

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa preservada')).toBeInTheDocument();
    });

    const kebab = screen.getByLabelText(/Acções para a tarefa "Tarefa preservada"/);
    fireEvent.click(kebab);
    const apagarBtn = screen.getByRole('menuitem', { name: 'Apagar' });
    fireEvent.click(apagarBtn);

    // confirm chamado mas delete NÃO chamado
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────
  // T9 — Tabs strip (Story 2.4 amendment: Kanban activado, Cal mantém disabled)
  // ─────────────────────────────────────────────────────────────────
  it('T9 — Story 2.4 amendment: Kanban ACTIVO, Calendário mantém disabled', async () => {
    await createTask(makeTask({ title: 'Tarefa X' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa X')).toBeInTheDocument();
    });

    // Kanban agora está ACTIVO (AC1 da Story 2.4)
    const kanbanTab = screen.getByRole('tab', { name: /Ver tarefas em vista kanban/ });
    expect(kanbanTab).not.toBeDisabled();
    expect(kanbanTab).toHaveAttribute('aria-disabled', 'false');

    // Calendário agora está ACTIVO (Story 2.5 AC1 — tab activado)
    const calTab = screen.getByRole('tab', { name: /Ver tarefas em vista calendário/ });
    expect(calTab).not.toBeDisabled();
    expect(calTab).toHaveAttribute('aria-disabled', 'false');

    // Tab Lista permanece a activa por defeito
    const listaTab = screen.getByRole('tab', { name: /Ver tarefas em vista lista/ });
    expect(listaTab).toHaveAttribute('aria-selected', 'true');
    expect(kanbanTab).toHaveAttribute('aria-selected', 'false');
    expect(calTab).toHaveAttribute('aria-selected', 'false');
  });

  // ─────────────────────────────────────────────────────────────────
  // T10 — A11y smoke: interactivos têm aria-label
  // ─────────────────────────────────────────────────────────────────
  it('T10 — Acessibilidade smoke: interactivos visíveis têm aria-label', async () => {
    await createTask(makeTask({ title: 'Tarefa Acessível' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa Acessível')).toBeInTheDocument();
    });

    // Tablist e tabs
    expect(screen.getByRole('tablist', { name: 'Vistas de tarefas' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);

    // Filtros têm aria-label
    expect(screen.getByLabelText('Filtrar por estado da tarefa')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por projecto')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por tag')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por prioridade')).toBeInTheDocument();
    expect(screen.getByLabelText('Pesquisar tarefas pelo título')).toBeInTheDocument();

    // Botão voltar
    expect(screen.getByLabelText('Voltar (Esc)')).toBeInTheDocument();

    // Checkbox da tarefa
    expect(screen.getByLabelText(/Marcar tarefa "Tarefa Acessível"/)).toBeInTheDocument();

    // Kebab menu trigger
    expect(screen.getByLabelText(/Acções para a tarefa "Tarefa Acessível"/)).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T11 — Escape navigation (Nit1 CR Iter 1)
  // ─────────────────────────────────────────────────────────────────
  it('T11 — Escape global: dispara router.back uma vez', async () => {
    await createTask(makeTask({ title: 'Tarefa para Escape' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa para Escape')).toBeInTheDocument();
    });

    // Dispatch Escape ao nível do window (page.tsx adiciona listener em window).
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mocks.routerBack).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────────────────────────
  // T12 — Mutation error: setTaskStatus rejeita → window.alert PT-PT (A1 CR Iter 1)
  // ─────────────────────────────────────────────────────────────────
  it('T12 — setTaskStatus rejeita: console.error + window.alert PT-PT chamados', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(tasksRepo, 'setTaskStatus').mockRejectedValue(new Error('DB write fail'));

    const task = makeTask({ title: 'Tarefa toggle fail', status: 'todo' });
    await createTask(task);

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa toggle fail')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Marcar tarefa "Tarefa toggle fail" como feita/);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Falha ao actualizar estado da tarefa',
        expect.any(Error)
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Não foi possível actualizar o estado da tarefa. Tenta novamente.'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T13 — Mutation error: deleteTask rejeita → window.alert PT-PT (A1 CR Iter 1)
  // ─────────────────────────────────────────────────────────────────
  it('T13 — deleteTask rejeita: console.error + window.alert PT-PT chamados', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(tasksRepo, 'deleteTask').mockRejectedValue(new Error('DB delete fail'));

    const task = makeTask({ title: 'Tarefa delete fail' });
    await createTask(task);

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa delete fail')).toBeInTheDocument();
    });

    // Abrir kebab menu + clicar Apagar.
    const kebab = screen.getByLabelText(/Acções para a tarefa "Tarefa delete fail"/);
    fireEvent.click(kebab);
    const apagarBtn = screen.getByRole('menuitem', { name: 'Apagar' });
    fireEvent.click(apagarBtn);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Falha ao apagar tarefa',
        expect.any(Error)
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Não foi possível apagar a tarefa. Tenta novamente.'
      );
    });
  });
});
