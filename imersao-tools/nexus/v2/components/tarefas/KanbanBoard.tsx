'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Announcements,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, Project, Tag } from '@/types/db';
import type { TaskStatus } from '@/lib/db/schemas';
import { setTaskStatus } from '@/lib/db/repos/tasks';
import { KanbanColumn, type ColumnId } from '@/components/tarefas/KanbanColumn';

/**
 * Nexus v2 — KanbanBoard (Story 2.4)
 *
 * Vista Kanban orquestra DnD + 4 colunas fixas (TODO/EM CURSO/BLOQUEADAS/FEITAS).
 *
 * Implementação:
 *   - `<DndContext>` com PointerSensor (mouse/touch) + KeyboardSensor (a11y AC5).
 *   - `announcements` PT-PT para screen readers (AC5).
 *   - 4 KanbanColumn fixas mapeadas para os 4 valores de TaskStatus.
 *   - Cards distribuídos por coluna via `useMemo` com base em `task.status` efectivo
 *     (após optimistic overrides).
 *
 * Optimistic UI + Rollback (AC4):
 *   - Estado local `overrides: Record<string, TaskStatus>` armazena moves optimisticos.
 *   - Ao arrastar: aplica override → chama `setTaskStatus(id, novoStatus)` → em erro
 *     remove override + mostra toast PT-PT primitivo.
 *   - Em sucesso: useLiveQuery do parent re-renderiza com novo status real, e o
 *     `useEffect` cleanup remove o override quando `task.status === override`
 *     (evita stale overrides).
 *
 * Repo isolation: usa exclusivamente `setTaskStatus` do `repos/tasks.ts`. Nenhum
 * acesso directo a `db.tasks.*` (anti-padrão Story 2.4).
 *
 * Loading: quando `tasks === undefined` mostra skeleton de 4 colunas.
 *
 * Trace: AC1-AC8, A1-A5 da Story 2.4.
 */

const KANBAN_COLUMNS: { id: ColumnId; label: string; accent: string }[] = [
  { id: 'todo', label: 'Por fazer', accent: '#00F5FF' },
  { id: 'in-progress', label: 'Em curso', accent: '#FFB800' },
  { id: 'blocked', label: 'Bloqueadas', accent: '#FF006E' },
  { id: 'done', label: 'Feitas', accent: '#39FF14' },
];

const COLUMN_LABEL_LOOKUP: Record<ColumnId, string> = {
  todo: 'Por fazer',
  'in-progress': 'Em curso',
  blocked: 'Bloqueadas',
  done: 'Feitas',
};

interface KanbanBoardProps {
  tasks: Task[] | undefined;
  projects: Project[] | undefined;
  tagsLookup: ReadonlyMap<string, Tag>;
  /** Tarefas atrasadas — calculadas no parent; passadas para visibility (não para drag). */
  overdueTasks?: Task[];
  /** TaskStatus que devem ficar ocultos (filtro Status em modo Kanban — A3). */
  hiddenColumns?: ReadonlySet<string>;
  /** Hook opcional de override de `setTaskStatus` — usado em testes para mocking. */
  setTaskStatusFn?: (id: string, status: TaskStatus) => Promise<void>;
}

const COLUMN_IDS: ReadonlySet<string> = new Set<string>(['todo', 'in-progress', 'blocked', 'done']);

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string' && COLUMN_IDS.has(value);
}

// ────────────────────────────────────────────────────────────────────────────
// Drag end handler — extraído como factory para teste isolado (Story 2.4 T7/T8).
// dnd-kit usa pointer events que jsdom não simula bem; testamos a lógica pura.
// ────────────────────────────────────────────────────────────────────────────

export interface DragEndHandlerDeps {
  tasks: Task[];
  overridesRef: { current: Record<string, TaskStatus> };
  /**
   * Mutation token por task-id — incrementa antes de cada `persistStatus` e captura local; após
   * `await`, se o valor actual em `inFlightByTaskRef.current[taskId]` divergir do capturado, esta
   * é uma stale completion/failure (chegou tarde após uma mutação mais recente) e deve ser ignorada.
   *
   * Story 2.4 Iter 2 (CR Major race condition fix): drag rápido do mesmo card pode disparar duas
   * writes assíncronas para o mesmo `taskId`; se a primeira resolver/rejeitar depois da segunda,
   * sem este token o rollback ou error toast aplica-se a um estado já obsoleto.
   */
  inFlightByTaskRef: { current: Record<string, number> };
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, TaskStatus>>>;
  persistStatus: (id: string, status: TaskStatus) => Promise<void>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export function createKanbanDragEndHandler(deps: DragEndHandlerDeps): (event: DragEndEvent) => Promise<void> {
  return async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);

    const { tasks, overridesRef, inFlightByTaskRef, setOverrides, persistStatus, setErrorMessage } = deps;

    function findTask(id: string): Task | undefined {
      return tasks.find((t) => t.id === id);
    }

    let novoStatus: ColumnId | undefined;
    if (isColumnId(overId)) {
      novoStatus = overId;
    } else {
      const overTask = findTask(overId);
      const overStatus = overTask
        ? overridesRef.current[overTask.id] ?? overTask.status
        : undefined;
      if (overStatus !== undefined && isColumnId(overStatus)) {
        novoStatus = overStatus;
      }
    }
    if (novoStatus === undefined) return;

    const task = findTask(taskId);
    if (!task) return;

    const currentEffectiveStatus = overridesRef.current[taskId] ?? task.status;
    if (currentEffectiveStatus === novoStatus) return;

    // Mutation token: incrementar + capturar antes de iniciar a write
    const mutationId = (inFlightByTaskRef.current[taskId] ?? 0) + 1;
    inFlightByTaskRef.current[taskId] = mutationId;

    // Optimistic UI
    setOverrides((prev) => ({ ...prev, [taskId]: novoStatus! }));

    try {
      await persistStatus(taskId, novoStatus);
      // Stale completion guard — se entretanto houve nova mutação para este task,
      // ignorar; o cleanup useEffect tratará da convergência de estado.
      if (inFlightByTaskRef.current[taskId] !== mutationId) return;
    } catch (error) {
      // Stale failure guard — mesmo princípio: não fazer rollback de um estado já obsoleto.
      if (inFlightByTaskRef.current[taskId] !== mutationId) return;
      console.error('Erro ao mover tarefa', error);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setErrorMessage('Erro ao mover tarefa — tenta novamente.');
    }
  };
}

export function KanbanBoard({
  tasks,
  projects,
  tagsLookup,
  hiddenColumns,
  setTaskStatusFn,
}: KanbanBoardProps): React.ReactElement {
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanup de overrides quando Dexie confirma o status (evita stale state)
  useEffect(() => {
    if (!tasks) return;
    setOverrides((prev) => {
      let changed = false;
      const next: Record<string, TaskStatus> = {};
      for (const [taskId, overrideStatus] of Object.entries(prev)) {
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status === overrideStatus) {
          changed = true;
          continue;
        }
        next[taskId] = overrideStatus;
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  // Auto-dismiss do toast de erro após 4s
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // Map projectId → name para passar a cards
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
    [projectNameLookup]
  );

  // Distribuir tasks pelas 4 colunas com base no status efectivo
  const tasksByColumn = useMemo<Record<ColumnId, Task[]>>(() => {
    const init: Record<ColumnId, Task[]> = {
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };
    if (!tasks) return init;
    for (const task of tasks) {
      const effectiveStatus = overrides[task.id] ?? task.status;
      if (isColumnId(effectiveStatus)) {
        init[effectiveStatus].push(task);
      }
    }
    return init;
  }, [tasks, overrides]);

  // Sensors para PointerSensor + KeyboardSensor (a11y AC5)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Helper resolver para anúncios PT-PT
  const findTask = useCallback(
    (taskId: string): Task | undefined => tasks?.find((t) => t.id === taskId),
    [tasks]
  );

  // Announcements PT-PT (WAI-ARIA D&D Authoring Practices)
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const task = findTask(String(active.id));
        if (!task) return undefined;
        const fromLabel = COLUMN_LABEL_LOOKUP[task.status as ColumnId] ?? 'coluna desconhecida';
        return `A mover "${task.title}" de ${fromLabel}.`;
      },
      onDragOver({ active, over }) {
        if (!over) return undefined;
        const task = findTask(String(active.id));
        if (!task) return undefined;
        const overId = String(over.id);
        const toLabel = isColumnId(overId)
          ? COLUMN_LABEL_LOOKUP[overId]
          : COLUMN_LABEL_LOOKUP[(findTask(overId)?.status ?? 'todo') as ColumnId];
        return `${task.title} pode ser largada em ${toLabel}.`;
      },
      onDragEnd({ active, over }) {
        const task = findTask(String(active.id));
        if (!task) return undefined;
        if (!over) return `Tarefa ${task.title} não foi movida.`;
        const overId = String(over.id);
        const toLabel = isColumnId(overId)
          ? COLUMN_LABEL_LOOKUP[overId]
          : COLUMN_LABEL_LOOKUP[(findTask(overId)?.status ?? 'todo') as ColumnId];
        return `Tarefa ${task.title} movida para ${toLabel}.`;
      },
      onDragCancel({ active }) {
        const task = findTask(String(active.id));
        return task ? `Mover ${task.title} cancelado.` : 'Mover cancelado.';
      },
    }),
    [findTask]
  );

  const persistStatus = setTaskStatusFn ?? setTaskStatus;

  // Ref para passar à factory pura sem dependência re-cria handler em cada override change
  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  // Mutation token por task-id (Iter 2 fix — race condition em drag rápido).
  // Cada drag incrementa o token do `taskId` antes de chamar `persistStatus`. Após o `await`,
  // o handler ignora completion/failure se o token entretanto mudou (stale).
  const inFlightByTaskRef = useRef<Record<string, number>>({});

  const handleDragEnd = useMemo(
    () =>
      createKanbanDragEndHandler({
        tasks: tasks ?? [],
        overridesRef,
        inFlightByTaskRef,
        setOverrides,
        persistStatus,
        setErrorMessage,
      }),
    [tasks, persistStatus]
  );

  // Loading skeleton (AC8): 4 colunas com 3 cards placeholder
  if (tasks === undefined) {
    return (
      <div
        aria-busy="true"
        aria-label="A carregar tarefas em vista Kanban"
        style={{
          display: 'flex',
          gap: 12,
          padding: '0 1.5rem 1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.id}
            style={{
              flex: '1 1 0',
              minWidth: 240,
              maxWidth: 360,
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ borderBottom: `2px solid ${col.accent}`, paddingBottom: 8 }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: col.accent,
                  textTransform: 'uppercase',
                }}
              >
                {col.label}
              </span>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 8,
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'kanban-skeleton-pulse 1.6s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ))}
        <style>{`
          @keyframes kanban-skeleton-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Render normal
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        onDragEnd={handleDragEnd}
      >
        <div
          data-testid="kanban-board"
          style={{
            display: 'flex',
            gap: 12,
            padding: '0 1.5rem 1.5rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              accentColor={col.accent}
              tasks={tasksByColumn[col.id]}
              tagsLookup={tagsLookup}
              getProjectName={getProjectName}
              isHidden={hiddenColumns?.has(col.id) ?? false}
            />
          ))}
        </div>
      </DndContext>

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
