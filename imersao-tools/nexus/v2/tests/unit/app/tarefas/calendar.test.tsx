import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import {
  CalendarBoard,
  createCalendarDragEndHandler,
  type CalendarDragEndHandlerDeps,
} from '@/components/tarefas/CalendarBoard';
import TarefasPage from '@/app/(app)/tarefas/page';
import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import type { Task, Tag } from '@/types/db';
import type { DragEndEvent } from '@dnd-kit/core';

/**
 * Nexus v2 — Vista Calendário tests (Story 2.5 / AC11)
 *
 * 12 cenários T1-T11 + T13 conforme AC11:
 *  T1  — Render base com tasks distribuídas pelos 7 dias
 *  T2  — Loading skeleton (tasks=undefined)
 *  T3  — Task sem dueDate não aparece (A1)
 *  T4  — Cor do chip por estado (done/overdue/futuro, precedência done > overdue)
 *  T5  — Filtro projecto reduz chips visíveis (integração TarefasPage)
 *  T6  — Filtro status mantém 7 dias visíveis (A3)
 *  T7  — updateTask chamado no drag (factory pura) + override aplicado
 *  T7b — Mesmo dia: updateTask NÃO chamado
 *  T7c — over=null: updateTask NÃO chamado
 *  T8  — Rollback em erro: override removido + errorMessage PT-PT
 *  T9  — Tab switch Lista ↔ Calendário em TarefasPage
 *  T10 — Week navigation (← → + Hoje) actualiza weekLabel
 *  T11 — A11y smoke: dias com aria-label PT-PT + chips com role/aria-roledescription
 *  T13 — Mutation token race condition (AC5b) — stale completion ignorada
 *
 * Drag (T7/T7b/T7c/T8/T13): chamamos `createCalendarDragEndHandler` directamente
 * (factory pura) — evita simulação de pointer events em jsdom que @dnd-kit não
 * suporta. Padrão herdado da Story 2.4 (kanban.test.tsx).
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: mocks.routerPush }),
}));

// Sexta-feira, 15 de Maio de 2026 (a meio da semana 11-17 Maio)
const TODAY = new Date(2026, 4, 15);
const SEMANA_ISOS = [
  '2026-05-11', // Seg
  '2026-05-12', // Ter
  '2026-05-13', // Qua
  '2026-05-14', // Qui
  '2026-05-15', // Sex (TODAY)
  '2026-05-16', // Sáb
  '2026-05-17', // Dom
];

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

function makeDeps(overrides?: Partial<CalendarDragEndHandlerDeps>): CalendarDragEndHandlerDeps {
  return {
    tasks: [],
    overridesRef: { current: {} },
    inFlightByTaskRef: { current: {} },
    rerender: vi.fn(),
    setErrorMessage: vi.fn(),
    updateTask: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('CalendarBoard (Story 2.5 / AC11)', () => {
  beforeEach(async () => {
    await clearAll();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
    mocks.routerBack.mockClear();
    mocks.routerPush.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // ─────────────────────────────────────────────────────────────────
  // T1 — Render base com dados
  // ─────────────────────────────────────────────────────────────────
  it('T1 — Render base: 7 tasks distribuídas pelos 7 dias da semana actual', () => {
    const tasks: Task[] = SEMANA_ISOS.map((iso, i) =>
      makeTask({ title: `Tarefa ${i + 1}`, dueDate: iso, status: 'todo' }),
    );

    render(
      <CalendarBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    // Cada uma das 7 tarefas aparece exactamente 1 vez
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(`Tarefa ${i}`)).toBeInTheDocument();
    }
    // Board está visível
    expect(screen.getByTestId('calendar-board')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T2 — Loading skeleton
  // ─────────────────────────────────────────────────────────────────
  it('T2 — Loading: tasks=undefined renderiza skeleton sem calendar-board', () => {
    const { container } = render(
      <CalendarBoard
        tasks={undefined}
        projects={undefined}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-board')).not.toBeInTheDocument();
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T3 — Task sem dueDate não aparece (A1)
  // ─────────────────────────────────────────────────────────────────
  it('T3 — Task com dueDate=null não renderiza chip no calendário (A1)', () => {
    const tasks: Task[] = [
      makeTask({ title: 'Sem prazo', dueDate: null }),
      makeTask({ title: 'Com prazo', dueDate: '2026-05-13' }),
    ];

    render(
      <CalendarBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    expect(screen.queryByText('Sem prazo')).not.toBeInTheDocument();
    expect(screen.getByText('Com prazo')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T4 — Cor do chip por estado (precedência done > overdue > futuro)
  // ─────────────────────────────────────────────────────────────────
  it('T4 — Chip color: done=Lime, overdue=Magenta, futuro=Cyan, done sobrepõe overdue', () => {
    const tasks: Task[] = [
      // Done (mesmo que overdue, precedência manda Lime)
      makeTask({ title: 'Done Past', dueDate: '2026-05-12', status: 'done' }),
      // Overdue (passado e não feito)
      makeTask({ title: 'Overdue Past', dueDate: '2026-05-12', status: 'todo' }),
      // Futuro
      makeTask({ title: 'Futuro', dueDate: '2026-05-16', status: 'todo' }),
    ];

    render(
      <CalendarBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    const doneChip = screen.getByText('Done Past').closest('[data-testid^="calendar-card-"]');
    const overdueChip = screen.getByText('Overdue Past').closest('[data-testid^="calendar-card-"]');
    const futuroChip = screen.getByText('Futuro').closest('[data-testid^="calendar-card-"]');

    expect(doneChip?.getAttribute('data-color')).toBe('done');
    expect(overdueChip?.getAttribute('data-color')).toBe('overdue');
    expect(futuroChip?.getAttribute('data-color')).toBe('futuro');
  });

  // ─────────────────────────────────────────────────────────────────
  // T5 — Filtro projecto (integração TarefasPage)
  // ─────────────────────────────────────────────────────────────────
  it('T5 — Filtro projecto em modo Calendário reduz chips visíveis', async () => {
    vi.useRealTimers(); // TarefasPage usa useLiveQuery — precisa de timers reais
    const projectAlphaId = crypto.randomUUID();
    const projectBetaId = crypto.randomUUID();
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await db.projects.bulkAdd([
      { id: projectAlphaId, name: 'Projecto Alpha', description: '', status: 'active', startDate: '2026-01-01', deadline: null, createdAt: Date.now() - 1000 },
      { id: projectBetaId, name: 'Projecto Beta', description: '', status: 'active', startDate: '2026-01-01', deadline: null, createdAt: Date.now() - 1000 },
    ]);
    await createTask(makeTask({ title: 'Task Alpha', projectId: projectAlphaId, dueDate: isoToday }));
    await createTask(makeTask({ title: 'Task Beta', projectId: projectBetaId, dueDate: isoToday }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Task Alpha')).toBeInTheDocument();
      expect(screen.getByText('Task Beta')).toBeInTheDocument();
    });

    // Mudar para tab Calendário
    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista calendário/ }));
    await waitFor(() => {
      expect(screen.getByTestId('calendar-board')).toBeInTheDocument();
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
  // T6 — Filtro status mantém 7 dias visíveis (A3)
  // ─────────────────────────────────────────────────────────────────
  it('T6 — Filtro status oculta chips fora do filtro mas mantém 7 dias visíveis (A3)', () => {
    const tasks: Task[] = [
      makeTask({ title: 'EmCurso A', dueDate: '2026-05-13', status: 'in-progress' }),
      makeTask({ title: 'EmCurso B', dueDate: '2026-05-15', status: 'in-progress' }),
      makeTask({ title: 'Todo X', dueDate: '2026-05-14', status: 'todo' }),
    ];

    render(
      <CalendarBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        hiddenStatuses={new Set(['todo', 'blocked', 'done'])}
        initialAnchor={TODAY}
      />,
    );

    // Os 7 dias da semana continuam no DOM
    for (const iso of SEMANA_ISOS) {
      expect(document.querySelector(`[data-day-iso="${iso}"]`)).toBeInTheDocument();
    }
    // Apenas chips in-progress visíveis
    expect(screen.getByText('EmCurso A')).toBeInTheDocument();
    expect(screen.getByText('EmCurso B')).toBeInTheDocument();
    expect(screen.queryByText('Todo X')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T7 — updateTask chamado no drag (factory pura)
  // ─────────────────────────────────────────────────────────────────
  it('T7 — onDragEnd: chama updateTask(id, {dueDate, lastWorkedAt}) 1x + aplica override', async () => {
    const taskId = 'task-uuid-1';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Drag Me', dueDate: '2026-05-12' })];

    const updateTask = vi.fn().mockResolvedValue(undefined);
    const overridesRef = { current: {} as Record<string, string> };
    const inFlightByTaskRef = { current: {} as Record<string, number> };
    const rerender = vi.fn();
    const setErrorMessage = vi.fn();

    const handler = createCalendarDragEndHandler({
      tasks,
      overridesRef,
      inFlightByTaskRef,
      rerender,
      setErrorMessage,
      updateTask,
    });

    await handler({
      active: { id: taskId },
      over: { id: '2026-05-15' },
    } as DragEndEvent);

    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(updateTask).toHaveBeenCalledWith(
      taskId,
      expect.objectContaining({
        dueDate: '2026-05-15',
        lastWorkedAt: expect.any(Number),
      }),
    );
    expect(overridesRef.current[taskId]).toBe('2026-05-15');
    expect(inFlightByTaskRef.current[taskId]).toBe(1);
    expect(rerender).toHaveBeenCalled();
    expect(setErrorMessage).not.toHaveBeenCalled();
  });

  it('T7b — onDragEnd: mesmo dia não chama updateTask', async () => {
    const taskId = 'task-uuid-2';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Same Day', dueDate: '2026-05-15' })];
    const updateTask = vi.fn().mockResolvedValue(undefined);

    const handler = createCalendarDragEndHandler(makeDeps({ tasks, updateTask }));

    await handler({
      active: { id: taskId },
      over: { id: '2026-05-15' }, // mesmo dia
    } as DragEndEvent);

    expect(updateTask).not.toHaveBeenCalled();
  });

  it('T7c — onDragEnd: over=null não chama updateTask', async () => {
    const taskId = 'task-uuid-3';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'No Drop', dueDate: '2026-05-12' })];
    const updateTask = vi.fn();

    const handler = createCalendarDragEndHandler(makeDeps({ tasks, updateTask }));

    await handler({
      active: { id: taskId },
      over: null,
    } as unknown as DragEndEvent);

    expect(updateTask).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────
  // T8 — Rollback em erro
  // ─────────────────────────────────────────────────────────────────
  it('T8 — updateTask rejeita: rollback override + errorMessage PT-PT', async () => {
    const taskId = 'task-uuid-4';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Rollback Me', dueDate: '2026-05-12' })];

    const updateTask = vi.fn().mockRejectedValue(new Error('DB offline'));
    const overridesRef = { current: {} as Record<string, string> };
    const inFlightByTaskRef = { current: {} as Record<string, number> };
    const rerender = vi.fn();
    const setErrorMessage = vi.fn();

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createCalendarDragEndHandler({
      tasks,
      overridesRef,
      inFlightByTaskRef,
      rerender,
      setErrorMessage,
      updateTask,
    });

    await handler({
      active: { id: taskId },
      over: { id: '2026-05-15' },
    } as DragEndEvent);

    expect(updateTask).toHaveBeenCalledTimes(1);
    // Override foi aplicado e depois removido no rollback
    expect(overridesRef.current[taskId]).toBeUndefined();
    expect(setErrorMessage).toHaveBeenCalledWith('Erro ao mover tarefa — tenta novamente.');

    consoleErrorSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────
  // T9 — Tab switch
  // ─────────────────────────────────────────────────────────────────
  it('T9 — Tab switch: Lista ↔ Calendário alterna vistas em TarefasPage', async () => {
    vi.useRealTimers();
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await createTask(makeTask({ title: 'Switchable', dueDate: iso }));

    render(<TarefasPage />);

    await waitFor(() => {
      expect(screen.getByText('Switchable')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('calendar-board')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista calendário/ }));

    await waitFor(() => {
      expect(screen.getByTestId('calendar-board')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Ver tarefas em vista lista/ }));

    await waitFor(() => {
      expect(screen.queryByTestId('calendar-board')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // T10 — Week navigation (← → + Hoje)
  // ─────────────────────────────────────────────────────────────────
  it('T10 — Week nav: ← recua 7 dias, → avança, Hoje regressa à semana actual', () => {
    render(
      <CalendarBoard
        tasks={[]}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    // Semana inicial: 11-17 Maio 2026
    expect(screen.getByText(/Semana de 11 de [Mm]aio de 2026/)).toBeInTheDocument();

    // Avançar uma semana → 18-24 Maio
    fireEvent.click(screen.getByRole('button', { name: 'Semana seguinte' }));
    expect(screen.getByText(/Semana de 18 de [Mm]aio de 2026/)).toBeInTheDocument();

    // Recuar duas semanas → 4-10 Maio
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(screen.getByText(/Semana de 4 de [Mm]aio de 2026/)).toBeInTheDocument();

    // Hoje → volta para a semana actual (11-17 Maio, TODAY=15)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar à semana actual' }));
    expect(screen.getByText(/Semana de 11 de [Mm]aio de 2026/)).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // T11 — A11y smoke
  // ─────────────────────────────────────────────────────────────────
  it('T11 — A11y smoke: dias têm aria-label PT-PT longo + chips têm role/aria-roledescription', () => {
    const tasks: Task[] = [makeTask({ title: 'A11y Chip', dueDate: '2026-05-13' })];

    render(
      <CalendarBoard
        tasks={tasks}
        projects={[]}
        tagsLookup={new Map<string, Tag>()}
        initialAnchor={TODAY}
      />,
    );

    // Aria-label do dia inclui longLabel PT-PT
    const day = document.querySelector('[data-day-iso="2026-05-13"]') as HTMLElement;
    expect(day).not.toBeNull();
    expect(day.getAttribute('aria-label')).toMatch(/Quarta-feira/);
    expect(day.getAttribute('aria-label')).toMatch(/1 tarefa/);

    // Chip tem role="button" + aria-roledescription
    const chip = screen.getByText('A11y Chip').closest('[data-testid^="calendar-card-"]') as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.getAttribute('role')).toBe('button');
    expect(chip.getAttribute('aria-roledescription')).toBe('Cartão de tarefa arrastável');
    expect(chip.getAttribute('tabindex')).toBe('0');

    // Grid tem aria-label PT-PT
    const grid = screen.getByTestId('calendar-board');
    expect(grid.getAttribute('aria-label')).toMatch(/Calendário semanal/);
  });

  // ─────────────────────────────────────────────────────────────────
  // T13 — Mutation token race condition (AC5b)
  // ─────────────────────────────────────────────────────────────────
  it('T13 — Mutation token: drag rápido sequencial, stale completion/failure ignorada (AC5b)', async () => {
    const taskId = 'task-race';
    const tasks: Task[] = [makeTask({ id: taskId, title: 'Race', dueDate: '2026-05-12' })];

    let resolve1: (() => void) | undefined;
    let reject1: ((err: Error) => void) | undefined;
    let resolve2: (() => void) | undefined;

    const updateTask = vi
      .fn<(id: string, patch: Partial<Task>) => Promise<void>>()
      .mockImplementationOnce(
        () =>
          new Promise<void>((res, rej) => {
            resolve1 = res;
            reject1 = rej;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((res) => {
            resolve2 = res;
          }),
      );

    const overridesRef = { current: {} as Record<string, string> };
    const inFlightByTaskRef = { current: {} as Record<string, number> };
    const rerender = vi.fn();
    const setErrorMessage = vi.fn();

    const handler = createCalendarDragEndHandler({
      tasks,
      overridesRef,
      inFlightByTaskRef,
      rerender,
      setErrorMessage,
      updateTask,
    });

    // 1ª mutação D1=2026-05-12 → D2=2026-05-15 (não await — promise pendente)
    const p1 = handler({
      active: { id: taskId },
      over: { id: '2026-05-15' },
    } as DragEndEvent);

    expect(inFlightByTaskRef.current[taskId]).toBe(1);
    expect(overridesRef.current[taskId]).toBe('2026-05-15');

    // 2ª mutação D2→D3=2026-05-16 (token incrementa para 2, override actualiza)
    const p2 = handler({
      active: { id: taskId },
      over: { id: '2026-05-16' },
    } as DragEndEvent);

    expect(inFlightByTaskRef.current[taskId]).toBe(2);
    expect(overridesRef.current[taskId]).toBe('2026-05-16');

    // Cenário A: a 1ª completion REJEITA tarde — sem mutation token, faria rollback
    // do override que agora aponta a D3. Com token, rejeição é stale → ignorada.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    reject1!(new Error('Stale failure'));
    await p1.catch(() => undefined);
    await Promise.resolve();
    await Promise.resolve();

    // Override D3 preservado, setErrorMessage NÃO disparado (stale failure ignorada)
    expect(overridesRef.current[taskId]).toBe('2026-05-16');
    expect(setErrorMessage).not.toHaveBeenCalled();

    // Cenário B: a 2ª completion resolve normalmente — token captado=2 = actual=2 → válida.
    resolve2!();
    await p2;
    await Promise.resolve();

    // Sem erro disparado e o override mantém-se até cleanup useEffect (que não corre aqui).
    expect(setErrorMessage).not.toHaveBeenCalled();
    expect(updateTask).toHaveBeenCalledTimes(2);
    expect(updateTask).toHaveBeenNthCalledWith(
      1,
      taskId,
      expect.objectContaining({ dueDate: '2026-05-15' }),
    );
    expect(updateTask).toHaveBeenNthCalledWith(
      2,
      taskId,
      expect.objectContaining({ dueDate: '2026-05-16' }),
    );

    consoleErrorSpy.mockRestore();
    // resolve1 nunca é chamado neste cenário — testámos o caminho de stale failure
    void resolve1;
  });
});
