import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { KanbanBoard, createKanbanDragEndHandler } from '@/components/tarefas/KanbanBoard';
import TarefasPage from '@/app/(app)/tarefas/page';
import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import { createProject } from '@/lib/db/repos/projects';
import type { Task, Tag } from '@/types/db';
import type { TaskStatus } from '@/lib/db/schemas';
import type { DragEndEvent } from '@dnd-kit/core';

/**
 * Nexus v2 — Vista Kanban tests (Story 2.4 / AC10)
 *
 * 10 cenários T1-T10 conforme AC10:
 *  T1  — Render base com dados
 *  T2  — Estado loading (tasks=undefined)
 *  T3  — Empty state por coluna
 *  T4  — Atrasadas visíveis (tinting magenta)
 *  T5  — Filtro projecto reduz cards (integração via TarefasPage)
 *  T6  — Filtro status oculta colunas (hiddenColumns prop)
 *  T7  — onDragEnd handler chama persistStatus(id, novoStatus) 1x
 *  T8  — Rollback em erro: handler restaura override + dispara errorMessage
 *  T9  — Tab switch (Lista ↔ Kanban) em TarefasPage
 *  T10 — Acessibilidade smoke (ARIA attrs)
 *
 * Padrão herdado de Story 2.3 page.test.tsx — fake-indexeddb via tests/setup.ts;
 * next/navigation mock via vi.hoisted.
 *
 * Drag (T7/T8): chamamos `createKanbanDragEndHandler` directamente (factory pura
 * exposta pelo KanbanBoard) — evita simulação de pointer events em jsdom que
 * @dnd-kit não suporta de forma fiável. Padrão documentado nos Dev Notes da
 * Story 2.4.
 */

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

describe('KanbanBoard (Story 2.4 / AC10)', () => {
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
  it('T1 — Render base: 8 tasks distribuídas pelas 4 colunas + contadores', () => {
    const tasks: Task[] = [
      makeTask({ title: 'Todo A', status: 'todo' }),
      makeTask({ title: 'Todo B', status: 'todo' }),
      makeTask({ title: 'Todo C', status: 'todo' }),
      makeTask({ title: 'Em Curso A', status: 'in-progress' }),
      makeTask({ title: 'Em Curso B', status: 'in-progress' }),
      makeTask({ title: 'Bloq A', status: 'blocked' }),
      makeTask({ title: 'Feita A', status: 'done' }),
      makeTask({ title: 'Feita B', status: 'done' }),
    ];

    render(
      <KanbanBoard tasks={tasks} projects={[]} tagsLookup={new Map<string, Tag>()} />
    );

    // 4 colunas presentes via aria-label
    expect(screen.getByRole('region', { name: /Coluna Por fazer, 3 tarefas/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Coluna Em curso, 2 tarefas/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Coluna Bloqueadas, 1 tarefa/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Coluna Feitas, 2 tarefas/ })).toBeInTheDocument();

    // Cards distribuídos
    expect(screen.getByText('Todo A')).toBeInTheDocument();
    expect(screen.getByText('Em Curso A')).toBeInTheDocument();
    expect(screen.getByText('Bloq A')).toBeInTheDocument();
    expect(screen.getByText('Feita A')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T2 — Estado loading
  // ─────────────────────────────────────────────────────────────────
  it('T2 — Loading: tasks=undefined renderiza 4 colunas skeleton sem board', () => {
    const { container } = render(
      <KanbanBoard tasks={undefined} projects={undefined} tagsLookup={new Map<string, Tag>()} />
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
    // 4 labels visíveis no skeleton
    expect(screen.getByText('Por fazer')).toBeInTheDocument();
    expect(screen.getByText('Em curso')).toBeInTheDocument();
    expect(screen.getByText('Bloqueadas')).toBeInTheDocument();
    expect(screen.getByText('Feitas')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T3 — Empty state por coluna
  // ─────────────────────────────────────────────────────────────────
  it('T3 — Empty: colunas sem tasks mostram "Sem tarefas"', () => {
    const tasks: Task[] = [
      makeTask({ title: 'Apenas Todo', status: 'todo' }),
      makeTask({ title: 'Apenas Done', status: 'done' }),
    ];

    render(
      <KanbanBoard tasks={tasks} projects={[]} tagsLookup={new Map<string, Tag>()} />
    );

    const emptyTexts = screen.getAllByText('Sem tarefas');
    expect(emptyTexts).toHaveLength(2);

    expect(screen.getByText('Apenas Todo')).toBeInTheDocument();
    expect(screen.getByText('Apenas Done')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T4 — Atrasadas visíveis
  // ─────────────────────────────────────────────────────────────────
  it('T4 — Atrasada: card com dueDate=ontem tem aria-label "atrasada"', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const overdueDate = `${yyyy}-${mm}-${dd}`;

    const tasks: Task[] = [
      makeTask({ title: 'Tarefa Atrasada', status: 'todo', dueDate: overdueDate }),
    ];

    render(
      <KanbanBoard tasks={tasks} projects={[]} tagsLookup={new Map<string, Tag>()} />
    );

    const card = screen.getByText('Tarefa Atrasada').closest('[data-testid^="kanban-card-"]');
    expect(card).not.toBeNull();
    expect(card?.getAttribute('aria-label')).toContain('atrasada');
  });

  // ─────────────────────────────────────────────────────────────────
  // T5 — Filtro projecto (integração TarefasPage)
  // ─────────────────────────────────────────────────────────────────
  it('T5 — Filtro projecto: select projecto X reduz cards visíveis no Kanban', async () => {
    const projectAlphaId = crypto.randomUUID();
    const projectBetaId = crypto.randomUUID();
    await createProject({
      id: projectAlphaId,
      name: 'Projecto Alpha',
      description: '',
      status: 'active',
      startDate: '2026-01-01',
      deadline: null,
      createdAt: Date.now() - 1000,
    });
    await createProject({
      id: projectBetaId,
      name: 'Projecto Beta',
      description: '',
      status: 'active',
      startDate: '2026-01-01',
      deadline: null,
      createdAt: Date.now() - 1000,
    });

    await createTask(makeTask({ title: 'Task Alpha', projectId: projectAlphaId, status: 'todo' }));
    await createTask(makeTask({ title: 'Task Beta', projectId: projectBetaId, status: 'todo' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
      expect(screen.getByText('Task Beta')).toBeInTheDocument();
    });

    // Mudar para tab Kanban
    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista kanban/ }));

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    // Filtrar por Projecto Alpha
    const projectSelect = screen.getByLabelText('Filtrar por projecto');
    fireEvent.change(projectSelect, { target: { value: projectAlphaId } });

    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Task Beta')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T6 — Filtro status oculta colunas
  // ─────────────────────────────────────────────────────────────────
  it('T6 — Filtro status: hiddenColumns oculta as 3 outras colunas (display:none + aria-hidden)', () => {
    const tasks: Task[] = [
      makeTask({ title: 'Em Curso', status: 'in-progress' }),
      makeTask({ title: 'Todo', status: 'todo' }),
    ];

    render(
      <KanbanBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        hiddenColumns={new Set(['todo', 'blocked', 'done'])}
      />
    );

    const colTodo = document.querySelector('[data-column-id="todo"]') as HTMLElement;
    const colBlocked = document.querySelector('[data-column-id="blocked"]') as HTMLElement;
    const colDone = document.querySelector('[data-column-id="done"]') as HTMLElement;
    const colInProgress = document.querySelector('[data-column-id="in-progress"]') as HTMLElement;

    expect(colTodo.getAttribute('aria-hidden')).toBe('true');
    expect(colBlocked.getAttribute('aria-hidden')).toBe('true');
    expect(colDone.getAttribute('aria-hidden')).toBe('true');
    expect(colTodo.style.display).toBe('none');
    expect(colBlocked.style.display).toBe('none');
    expect(colDone.style.display).toBe('none');

    expect(colInProgress.getAttribute('aria-hidden')).toBe('false');
    expect(colInProgress.style.display).not.toBe('none');
  });

  // ─────────────────────────────────────────────────────────────────
  // T7 — setTaskStatus chamado no drag (factory pura)
  // ─────────────────────────────────────────────────────────────────
  it('T7 — onDragEnd: chama persistStatus(id, novoStatus) 1x + actualiza overrides', async () => {
    const taskId = 'task-uuid-1';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Drag Me', status: 'todo' })];

    const persistStatus = vi.fn().mockResolvedValue(undefined);
    const setOverridesFn = vi.fn();
    const setErrorMessageFn = vi.fn();

    const handler = createKanbanDragEndHandler({
      tasks,
      overridesRef: { current: {} },
      setOverrides: setOverridesFn as React.Dispatch<React.SetStateAction<Record<string, TaskStatus>>>,
      persistStatus,
      setErrorMessage: setErrorMessageFn as React.Dispatch<React.SetStateAction<string | null>>,
    });

    await handler({
      active: { id: taskId },
      over: { id: 'in-progress' },
    } as DragEndEvent);

    expect(persistStatus).toHaveBeenCalledTimes(1);
    expect(persistStatus).toHaveBeenCalledWith(taskId, 'in-progress');

    // Optimistic UI: setOverrides foi chamado para aplicar o override
    expect(setOverridesFn).toHaveBeenCalled();
    expect(setErrorMessageFn).not.toHaveBeenCalled();
  });

  it('T7b — onDragEnd: ignora drop na mesma coluna (sem chamada persist)', async () => {
    const taskId = 'task-uuid-2';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Same Column', status: 'todo' })];
    const persistStatus = vi.fn().mockResolvedValue(undefined);

    const handler = createKanbanDragEndHandler({
      tasks,
      overridesRef: { current: {} },
      setOverrides: vi.fn() as React.Dispatch<React.SetStateAction<Record<string, TaskStatus>>>,
      persistStatus,
      setErrorMessage: vi.fn() as React.Dispatch<React.SetStateAction<string | null>>,
    });

    await handler({
      active: { id: taskId },
      over: { id: 'todo' }, // mesma coluna
    } as DragEndEvent);

    expect(persistStatus).not.toHaveBeenCalled();
  });

  it('T7c — onDragEnd: ignora over=null (drop fora de coluna)', async () => {
    const taskId = 'task-uuid-3';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'No Drop', status: 'todo' })];
    const persistStatus = vi.fn();

    const handler = createKanbanDragEndHandler({
      tasks,
      overridesRef: { current: {} },
      setOverrides: vi.fn() as React.Dispatch<React.SetStateAction<Record<string, TaskStatus>>>,
      persistStatus,
      setErrorMessage: vi.fn() as React.Dispatch<React.SetStateAction<string | null>>,
    });

    await handler({
      active: { id: taskId },
      over: null,
    } as unknown as DragEndEvent);

    expect(persistStatus).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────
  // T8 — Rollback em erro
  // ─────────────────────────────────────────────────────────────────
  it('T8 — persistStatus rejeita: rollback override + errorMessage PT-PT', async () => {
    const taskId = 'task-uuid-4';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Rollback Me', status: 'todo' })];

    const persistStatus = vi.fn().mockRejectedValue(new Error('DB offline'));
    const setOverridesCalls: unknown[] = [];
    const setErrorMessageCalls: (string | null | ((p: string | null) => string | null))[] = [];

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createKanbanDragEndHandler({
      tasks,
      overridesRef: { current: {} },
      setOverrides: ((updater: unknown) => {
        setOverridesCalls.push(updater);
      }) as React.Dispatch<React.SetStateAction<Record<string, TaskStatus>>>,
      persistStatus,
      setErrorMessage: ((value: string | null | ((p: string | null) => string | null)) => {
        setErrorMessageCalls.push(value);
      }) as React.Dispatch<React.SetStateAction<string | null>>,
    });

    await handler({
      active: { id: taskId },
      over: { id: 'done' },
    } as DragEndEvent);

    expect(persistStatus).toHaveBeenCalledTimes(1);

    // 2 chamadas a setOverrides: 1 para aplicar override + 1 para remover (rollback)
    expect(setOverridesCalls.length).toBeGreaterThanOrEqual(2);

    // Validar rollback: ao chamar a 2ª updater com estado {taskId: 'done'} obtém-se {}
    const rollbackUpdater = setOverridesCalls[1] as (prev: Record<string, TaskStatus>) => Record<string, TaskStatus>;
    expect(rollbackUpdater({ [taskId]: 'done' })).toEqual({});

    // errorMessage PT-PT disparado
    expect(setErrorMessageCalls).toContain('Erro ao mover tarefa — tenta novamente.');

    consoleErrorSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────
  // T9 — Tab switch via TarefasPage
  // ─────────────────────────────────────────────────────────────────
  it('T9 — Tab switch: Lista ↔ Kanban alterna vistas em TarefasPage', async () => {
    await createTask(makeTask({ title: 'Switchable', status: 'todo' }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Switchable')).toBeInTheDocument();
    });

    // Inicial: vista Lista (sem KanbanBoard)
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();

    // Clicar tab Kanban
    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista kanban/ }));

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    // Voltar para Lista
    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista lista/ }));

    await waitFor(() => {
      expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T10 — Acessibilidade smoke
  // ─────────────────────────────────────────────────────────────────
  it('T10 — A11y smoke: colunas têm aria-label PT-PT + cards têm aria-roledescription', () => {
    const tasks: Task[] = [makeTask({ title: 'A11y Card', status: 'todo' })];

    render(
      <KanbanBoard tasks={tasks} projects={[]} tagsLookup={new Map<string, Tag>()} />
    );

    // Coluna com aria-label PT-PT
    expect(screen.getByRole('region', { name: /Coluna Por fazer, 1 tarefa$/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Coluna Em curso, 0 tarefas$/ })).toBeInTheDocument();

    // Card aria-roledescription PT-PT
    const card = screen.getByText('A11y Card').closest('[data-testid^="kanban-card-"]');
    expect(card?.getAttribute('aria-roledescription')).toBe('Cartão de tarefa arrastável');
    expect(card?.getAttribute('tabindex')).toBe('0');

    // Board container present
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
  });
});
