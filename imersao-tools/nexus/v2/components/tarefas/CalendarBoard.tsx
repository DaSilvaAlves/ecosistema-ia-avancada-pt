'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Project, Tag, Task } from '@/types/db';
import type { TaskStatus } from '@/lib/db/schemas';
import { updateTask as updateTaskRepo } from '@/lib/db/repos/tasks';
import { CalendarDay } from '@/components/tarefas/CalendarDay';
import {
  getNextWeek,
  getPreviousWeek,
  getWeekRange,
  type WeekRange,
} from '@/lib/tarefas/weekRange';

/**
 * Nexus v2 — CalendarBoard (Story 2.5 — AC1-AC9)
 *
 * Vista calendário semanal: grid de 7 colunas (Seg→Dom) com drag-and-drop entre
 * dias para alterar `Task.dueDate`. Reaproveita 1:1 o padrão consolidado da
 * Story 2.4 (Kanban):
 *   - `<DndContext>` com PointerSensor + KeyboardSensor + announcements PT-PT.
 *   - Factory pura `createCalendarDragEndHandler` para teste sem pointer events.
 *   - Optimistic UI via `overridesRef: useRef<Record<string, string>>` (taskId → ISO).
 *   - **Mutation token por task-id** (`inFlightByTaskRef`) — incrementa+captura
 *     antes do `await updateTask`; após, ignora completion/failure se token
 *     actual divergir. Precedente: `KanbanBoard.tsx:85-91,132-138,286-289` (Iter 2 fix).
 *   - Cleanup automático de overrides via `useEffect` em `tasks` (quando Dexie
 *     confirma o `dueDate`, o override é removido).
 *
 * Navegação semanal: setas Anterior/Seguinte + botão Hoje + label PT-PT.
 *
 * Repo isolation: apenas `updateTask` do `repos/tasks.ts`. Zero `db.tasks.*`.
 *
 * Timezone safety (A9): `dueDate` persistido como `YYYY-MM-DD` em local time via
 * `formatDueDateIso(date)` — nunca `toISOString()`.
 *
 * A1: tasks com `dueDate === null` não aparecem (sem espaço lógico no grid).
 * A3: filtro Status filtra chips visíveis mas mantém os 7 dias.
 * A6: drag entre semanas fora-de-scope; utilizador navega primeiro, depois arrasta.
 */

interface CalendarBoardProps {
  tasks: Task[] | undefined;
  projects: Project[] | undefined;
  tagsLookup: ReadonlyMap<string, Tag>;
  /** Statuses ocultos pelo filtro Status (A3) — chips com este status não aparecem. */
  hiddenStatuses?: ReadonlySet<TaskStatus>;
  /** Hook opcional de override de `updateTask` — testes. */
  updateTaskFn?: (id: string, patch: Partial<Task>) => Promise<void>;
  /** Hook opcional de override do anchor inicial — testes deterministas (`vi.setSystemTime`). */
  initialAnchor?: Date;
}

// ────────────────────────────────────────────────────────────────────────────
// Drag end handler — factory pura (padrão Story 2.4 Iter 1 + Iter 2 fix).
// ────────────────────────────────────────────────────────────────────────────

export interface CalendarDragEndHandlerDeps {
  tasks: Task[];
  /** Override actual taskId → novoIso (optimistic). Mutado in-place. */
  overridesRef: { current: Record<string, string> };
  /**
   * Mutation token por task-id (Story 2.4 Iter 2 fix race condition).
   *
   * Incrementa antes de cada `updateTask` e captura local; após o `await`,
   * o handler compara token capturado vs actual — se divergir, é stale e ignora
   * (nem rollback nem cleanup). Coerente com `KanbanBoard.tsx:85-91,132-138,286-289`.
   */
  inFlightByTaskRef: { current: Record<string, number> };
  /** Força re-render do board (usado depois de mutar overridesRef). */
  rerender: () => void;
  setErrorMessage: (msg: string | null) => void;
  /** Persistência — injectável para testes (`vi.spyOn(tasksRepo, 'updateTask')`). */
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
}

export function createCalendarDragEndHandler(
  deps: CalendarDragEndHandlerDeps,
): (event: DragEndEvent) => Promise<void> {
  return async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over) return; // drop fora de qualquer dia → ignorar
    const taskId = String(active.id);
    const novoIso = String(over.id); // 'YYYY-MM-DD'

    const task = deps.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const dueAtual = deps.overridesRef.current[taskId] ?? task.dueDate;
    if (dueAtual === novoIso) return; // mesmo dia → ignorar

    // Mutation token: incrementar + capturar antes da write (AC5b)
    const mutationId = (deps.inFlightByTaskRef.current[taskId] ?? 0) + 1;
    deps.inFlightByTaskRef.current[taskId] = mutationId;

    // Optimistic UI: o chip move-se imediatamente para o novo dia
    deps.overridesRef.current[taskId] = novoIso;
    deps.rerender();

    try {
      await deps.updateTask(taskId, { dueDate: novoIso, lastWorkedAt: Date.now() });
      // Stale completion → uma mutação mais recente está em curso/concluída.
      // Não fazer cleanup explícito — o useEffect sobre `tasks` converge o estado.
      if (deps.inFlightByTaskRef.current[taskId] !== mutationId) return;
    } catch (error) {
      // Stale failure → ignorar rollback; a mutação mais recente vai resolver.
      if (deps.inFlightByTaskRef.current[taskId] !== mutationId) return;
      console.error('Erro ao mover tarefa entre dias', error);
      delete deps.overridesRef.current[taskId];
      deps.rerender();
      deps.setErrorMessage('Erro ao mover tarefa — tenta novamente.');
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function CalendarBoard({
  tasks,
  projects,
  tagsLookup,
  hiddenStatuses,
  updateTaskFn,
  initialAnchor,
}: CalendarBoardProps): React.ReactElement {
  const [currentWeek, setCurrentWeek] = useState<WeekRange>(() =>
    getWeekRange(initialAnchor ?? new Date()),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, forceRerenderTick] = useState(0);
  const rerender = useCallback(() => forceRerenderTick((n) => n + 1), []);

  // Overrides + mutation token — refs estáveis ao longo da vida do componente
  const overridesRef = useRef<Record<string, string>>({});
  const inFlightByTaskRef = useRef<Record<string, number>>({});

  // Cleanup de overrides quando Dexie confirma o dueDate (padrão Story 2.4 Note #4)
  useEffect(() => {
    if (!tasks) return;
    let changed = false;
    for (const [taskId, overrideIso] of Object.entries(overridesRef.current)) {
      const t = tasks.find((x) => x.id === taskId);
      if (t && t.dueDate === overrideIso) {
        delete overridesRef.current[taskId];
        changed = true;
      }
    }
    if (changed) rerender();
  }, [tasks, rerender]);

  // Auto-dismiss do toast de erro após 4s (Story 2.4 Completion Note #5)
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // Lookup projecto → name (O(1) em chips)
  const projectNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    (projects ?? []).forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  const getProjectName = useCallback(
    (projectId: string | null): string | undefined => {
      if (projectId === null) return undefined;
      return projectNameLookup.get(projectId);
    },
    [projectNameLookup],
  );

  // Agrupar tasks por `dueDate` ISO date string (com overrides aplicados, A3 hidden status)
  const tasksByDay = useMemo<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = {};
    if (!tasks) return map;
    const overrides = overridesRef.current;
    for (const task of tasks) {
      if (hiddenStatuses?.has(task.status)) continue; // A3 filtra chips, não dias
      const effectiveIso = overrides[task.id] ?? task.dueDate;
      if (effectiveIso === null) continue; // A1 — sem dueDate, sem chip
      const bucket = map[effectiveIso];
      if (bucket === undefined) {
        map[effectiveIso] = [task];
      } else {
        bucket.push(task);
      }
    }
    return map;
    // Re-render do `forceRerenderTick` cobre actualização de overridesRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, hiddenStatuses, forceRerenderTick]);

  // Sensors (PointerSensor + KeyboardSensor a11y) — padrão Story 2.4
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Announcements PT-PT (WAI-ARIA D&D Authoring Practices) — AC6
  const findTask = useCallback(
    (taskId: string): Task | undefined => tasks?.find((t) => t.id === taskId),
    [tasks],
  );

  const findDayLabel = useCallback(
    (iso: string): string => {
      const day = currentWeek.days.find((d) => d.iso === iso);
      return day !== undefined ? day.longLabel : iso;
    },
    [currentWeek],
  );

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const task = findTask(String(active.id));
        if (!task) return undefined;
        const fromIso = overridesRef.current[task.id] ?? task.dueDate ?? '';
        const fromLabel = findDayLabel(fromIso);
        return `A mover "${task.title}" de ${fromLabel}.`;
      },
      onDragOver({ active, over }) {
        if (!over) return undefined;
        const task = findTask(String(active.id));
        if (!task) return undefined;
        const toLabel = findDayLabel(String(over.id));
        return `"${task.title}" sobre ${toLabel}.`;
      },
      onDragEnd({ active, over }) {
        const task = findTask(String(active.id));
        if (!task) return undefined;
        if (!over) return `Tarefa "${task.title}" não foi movida.`;
        const toLabel = findDayLabel(String(over.id));
        return `Tarefa "${task.title}" movida para ${toLabel}.`;
      },
      onDragCancel({ active }) {
        const task = findTask(String(active.id));
        return task ? `Movimentação de "${task.title}" cancelada.` : 'Movimentação cancelada.';
      },
    }),
    [findTask, findDayLabel],
  );

  const persistTask = updateTaskFn ?? updateTaskRepo;

  // Handler memoizado — só recria quando `tasks` ou `persistTask` mudam
  const handleDragEnd = useMemo(
    () =>
      createCalendarDragEndHandler({
        tasks: tasks ?? [],
        overridesRef,
        inFlightByTaskRef,
        rerender,
        setErrorMessage,
        updateTask: persistTask,
      }),
    [tasks, persistTask, rerender],
  );

  // Estado: anchor "hoje" para `currentWeek.days[*].isToday` deve actualizar quando
  // a semana muda? Não — `getWeekRange` é chamado com a referenceToday default (hoje real)
  // apenas no momento da navegação. Para single-user pessoal usado em sessões curtas
  // isto é suficiente (precedente isOverdue startOfToday).

  function handlePrev(): void {
    setCurrentWeek((wr) => getPreviousWeek(wr));
  }

  function handleNext(): void {
    setCurrentWeek((wr) => getNextWeek(wr));
  }

  function handleToday(): void {
    setCurrentWeek(getWeekRange(new Date()));
  }

  const isOnCurrentWeek = useMemo(() => {
    const today = getWeekRange(new Date());
    return today.start.getTime() === currentWeek.start.getTime();
  }, [currentWeek]);

  // Total de chips visíveis na semana (para mensagem "Nenhuma tarefa")
  const totalVisibleChips = useMemo(() => {
    return currentWeek.days.reduce((acc, d) => acc + (tasksByDay[d.iso]?.length ?? 0), 0);
  }, [currentWeek, tasksByDay]);

  // Loading skeleton (AC9): 7 colunas com 2 chips placeholder cada
  if (tasks === undefined) {
    return (
      <div
        aria-busy="true"
        aria-label="A carregar tarefas em vista calendário"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 1.5rem 1.5rem',
        }}
      >
        <div style={{ height: 48 }} />
        <div
          data-testid="calendar-skeleton"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div
              key={dayIdx}
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                minHeight: 120,
                padding: '0.6rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {Array.from({ length: 2 }).map((_, chipIdx) => (
                <div
                  key={chipIdx}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    background:
                      'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'calendar-skeleton-pulse 1.6s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <style>{`
          @keyframes calendar-skeleton-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 1.5rem 1.5rem',
      }}
    >
      <CalendarNavHeader
        weekLabel={currentWeek.weekLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        isOnCurrentWeek={isOnCurrentWeek}
      />

      <DndContext sensors={sensors} accessibility={{ announcements }} onDragEnd={handleDragEnd}>
        <div
          data-testid="calendar-board"
          role="grid"
          aria-label={`Calendário semanal — ${currentWeek.weekLabel}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          {currentWeek.days.map((day) => (
            <CalendarDay
              key={day.iso}
              day={day}
              tasks={tasksByDay[day.iso] ?? []}
              tagsLookup={tagsLookup}
              getProjectName={getProjectName}
              overridesRef={overridesRef}
            />
          ))}
        </div>
      </DndContext>

      {totalVisibleChips === 0 && (
        <p
          role="status"
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            color: '#8892A4',
            fontStyle: 'italic',
          }}
        >
          Nenhuma tarefa nesta semana — usa as setas para navegar ou muda os filtros.
        </p>
      )}

      {errorMessage !== null && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '0.7rem 1.2rem',
            background: 'rgba(255, 0, 110, 0.15)',
            border: '1px solid rgba(255, 0, 110, 0.4)',
            borderRadius: 8,
            color: '#FF006E',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: nav header (AC3)
// ────────────────────────────────────────────────────────────────────────────

interface CalendarNavHeaderProps {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isOnCurrentWeek: boolean;
}

function CalendarNavHeader({
  weekLabel,
  onPrev,
  onNext,
  onToday,
  isOnCurrentWeek,
}: CalendarNavHeaderProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0 1rem',
        gap: '1rem',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Semana anterior"
        style={navButtonStyle()}
      >
        ← Semana anterior
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#F0F4FF',
            letterSpacing: '-0.01em',
          }}
        >
          {weekLabel}
        </h2>
        <button
          type="button"
          onClick={onToday}
          aria-label="Voltar à semana actual"
          aria-pressed={isOnCurrentWeek}
          disabled={isOnCurrentWeek}
          style={{
            ...navButtonStyle(),
            opacity: isOnCurrentWeek ? 0.5 : 1,
            cursor: isOnCurrentWeek ? 'default' : 'pointer',
            color: isOnCurrentWeek ? '#00F5FF' : '#F0F4FF',
            borderColor: isOnCurrentWeek
              ? 'rgba(0, 245, 255, 0.4)'
              : 'rgba(255, 255, 255, 0.12)',
          }}
        >
          Hoje
        </button>
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label="Semana seguinte"
        style={navButtonStyle()}
      >
        Semana seguinte →
      </button>
    </div>
  );
}

function navButtonStyle(): React.CSSProperties {
  return {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#F0F4FF',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    padding: '0.45rem 0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
}
