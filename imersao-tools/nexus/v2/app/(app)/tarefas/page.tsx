'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTags } from '@/hooks/useTags';
import { setTaskStatus, deleteTask } from '@/lib/db/repos/tasks';
import { isOverdue } from '@/lib/tarefas/isOverdue';
import { useDebounced } from '@/hooks/useDebounced';
import { TasksHeader, type ActiveTab } from '@/components/tarefas/TasksHeader';
import { OverdueSection } from '@/components/tarefas/OverdueSection';
import { TasksFilters, type StatusFilter, type PriorityFilter } from '@/components/tarefas/TasksFilters';
import { TasksTable } from '@/components/tarefas/TasksTable';
import { KanbanBoard } from '@/components/tarefas/KanbanBoard';
import { CalendarBoard } from '@/components/tarefas/CalendarBoard';
import type { Tag } from '@/types/db';
import type { TaskStatus } from '@/lib/db/schemas';

/**
 * Nexus v2 — Página /tarefas (Story 2.3 lista + Story 2.4 Kanban)
 *
 * Rota: /tarefas — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component).
 *
 * Composição:
 *   1. <TasksHeader> — título + tab strip (Lista|Kanban activos, Calendário disabled)
 *   2. <OverdueSection> — secção FR13 (só renderiza se há atrasadas)
 *   3. <TasksFilters> — 4 selects + pesquisa (debounce 200ms) — mode-aware
 *   4. Vista condicional por activeTab:
 *      - 'lista'  → Loading skeleton | Empty state | <TasksTable>
 *      - 'kanban' → <KanbanBoard> (Story 2.4 — drag-and-drop entre colunas)
 *
 * APIs consumidas: useTasks, useProjects, useTags (Story 2.6), setTaskStatus, deleteTask.
 * Helper D3 (Story 2.3 Iter 1 Uma A3): isOverdue (lib/tarefas).
 *
 * 4 [AUTO-DECISION] ratificadas pela @po: D1 sem drag em Lista, D2 tabs placeholder Cal, D3 overdue=startOfToday, D4 kebab "Editar" disabled.
 * Story 2.4 ratificações: A1 sem drag intra-coluna; A2 sem arquivamento auto FEITAS; A3 filtro status oculta colunas; A4 "+Nova" mantém disabled; A5 KeyboardSensor dnd-kit.
 */

export default function TarefasPage(): React.ReactElement {
  const router = useRouter();

  // Story 3.10 AC7 — a chamada a `useRecurrenceEngine()` foi removida desta
  // page. O motor passa a ser activado uma única vez por dia pelo
  // `<DailyEngineProvider>` em `app/(app)/layout.tsx`. `useTasks()` /
  // `useLiveQuery` continuam a reflectir as novas instâncias reactivamente.

  // Vista activa (Story 2.4 AC1)
  const [activeTab, setActiveTab] = useState<ActiveTab>('lista');

  // Filtros server-side (Dexie via repos)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [projectFilter, setProjectFilter] = useState<string | null | undefined>(undefined);
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined);

  // Filtros client-side
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(undefined);
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounced(searchRaw, 200);
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Reads reactivos
  // Em modo Kanban (Story 2.4 A3) e Calendário (Story 2.5 A3): filtro Status NÃO é
  // aplicado a useTasks — todas as tarefas são carregadas e o filtro Status oculta
  // colunas (Kanban) ou chips (Calendário), mantendo a estrutura visual estável.
  // Em modo Lista: filtro Status é aplicado normalmente via repo Dexie.
  const effectiveStatusForQuery =
    activeTab === 'kanban' || activeTab === 'calendario' ? undefined : statusFilter;
  const tasks = useTasks({ status: effectiveStatusForQuery, projectId: projectFilter, tag: tagFilter });
  const projects = useProjects();
  const tags = useTags();

  // Tags lookup para acesso O(1) em cards (Story 2.4) e linhas (Story 2.3)
  const tagsLookup = useMemo<Map<string, Tag>>(() => {
    const map = new Map<string, Tag>();
    (tags ?? []).forEach((t) => map.set(t.id, t));
    return map;
  }, [tags]);

  // Filtros client-side aplicados via useMemo (priority + search + overdue)
  const visibleTasks = useMemo(() => {
    if (!tasks) return undefined;
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priorityFilter !== undefined && t.priority !== priorityFilter) return false;
      if (q !== '' && !t.title.toLowerCase().includes(q)) return false;
      if (overdueOnly && !isOverdue(t)) return false;
      return true;
    });
  }, [tasks, priorityFilter, search, overdueOnly]);

  // Subset overdue (para secção dedicada, sem aplicar filtros client-side)
  const overdueTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => isOverdue(t));
  }, [tasks]);

  // Hidden columns para modo Kanban (Story 2.4 A3)
  // Quando filtro Status está activo em Kanban, oculta as outras 3 colunas.
  const hiddenColumns = useMemo<ReadonlySet<string>>(() => {
    if (activeTab !== 'kanban' || statusFilter === undefined) return new Set();
    const all = ['todo', 'in-progress', 'blocked', 'done'] as const;
    return new Set(all.filter((s) => s !== statusFilter));
  }, [activeTab, statusFilter]);

  // Hidden statuses para modo Calendário (Story 2.5 A3)
  // Quando filtro Status está activo em Calendário, oculta chips fora desse status;
  // os 7 dias mantêm-se visíveis (calendário tem sempre 7 dias por definição UX).
  const hiddenStatuses = useMemo<ReadonlySet<TaskStatus>>(() => {
    if (activeTab !== 'calendario' || statusFilter === undefined) return new Set();
    const all: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];
    return new Set(all.filter((s) => s !== statusFilter));
  }, [activeTab, statusFilter]);

  // Escape key → router.back (AC8)
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router]);

  async function handleToggleDone(taskId: string, checked: boolean): Promise<void> {
    try {
      await setTaskStatus(taskId, checked ? 'done' : 'todo');
    } catch (error) {
      console.error('Falha ao actualizar estado da tarefa', error);
      window.alert('Não foi possível actualizar o estado da tarefa. Tenta novamente.');
    }
  }

  async function handleDelete(taskId: string): Promise<void> {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Falha ao apagar tarefa', error);
      window.alert('Não foi possível apagar a tarefa. Tenta novamente.');
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TasksHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <OverdueSection
        overdueTasks={overdueTasks}
        onShowAll={() => setOverdueOnly(true)}
      />

      <TasksFilters
        status={statusFilter}
        onStatusChange={setStatusFilter}
        projectId={projectFilter}
        onProjectChange={setProjectFilter}
        projects={projects}
        tagId={tagFilter}
        onTagChange={setTagFilter}
        tags={tags}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        search={searchRaw}
        onSearchChange={setSearchRaw}
      />

      {overdueOnly && (
        <div
          style={{
            margin: '0 1.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: '#FF006E',
          }}
        >
          <span>FILTRO ACTIVO · APENAS ATRASADAS</span>
          <button
            type="button"
            onClick={() => setOverdueOnly(false)}
            aria-label="Remover filtro de atrasadas"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 0, 110, 0.4)',
              color: '#FF006E',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Limpar ×
          </button>
        </div>
      )}

      {activeTab === 'lista' && (
        visibleTasks === undefined ? (
          <LoadingSkeleton />
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters({ statusFilter, projectFilter, tagFilter, priorityFilter, search, overdueOnly })}
          />
        ) : (
          <TasksTable
            tasks={visibleTasks}
            projects={projects}
            tags={tags}
            onToggleDone={handleToggleDone}
            onDelete={handleDelete}
          />
        )
      )}

      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={visibleTasks}
          projects={projects}
          tagsLookup={tagsLookup}
          overdueTasks={overdueTasks}
          hiddenColumns={hiddenColumns}
        />
      )}

      {activeTab === 'calendario' && (
        <CalendarBoard
          tasks={visibleTasks}
          projects={projects}
          tagsLookup={tagsLookup}
          hiddenStatuses={hiddenStatuses}
        />
      )}
    </div>
  );
}

function hasActiveFilters(args: {
  statusFilter: StatusFilter;
  projectFilter: string | null | undefined;
  tagFilter: string | undefined;
  priorityFilter: PriorityFilter;
  search: string;
  overdueOnly: boolean;
}): boolean {
  return (
    args.statusFilter !== undefined ||
    args.projectFilter !== undefined ||
    args.tagFilter !== undefined ||
    args.priorityFilter !== undefined ||
    args.search.trim() !== '' ||
    args.overdueOnly
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar tarefas"
      style={{
        margin: '0 1.5rem 1.5rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 48,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 8,
            animation: 'tarefas-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes tarefas-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }): React.ReactElement {
  return (
    <div
      style={{
        margin: '0 1.5rem 1.5rem',
        padding: '3rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 1rem 0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '1rem',
          color: '#F0F4FF',
        }}
      >
        {hasFilters
          ? 'Nenhuma tarefa corresponde aos filtros activos.'
          : 'Sem tarefas. Cria a primeira pelo chat ou pelo botão "+ Nova" (em construção).'}
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Em construção · Disponível numa story futura"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#4A5568',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          padding: '0.55rem 1.2rem',
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
      >
        + Nova
        <span
          aria-hidden="true"
          style={{
            marginLeft: 6,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.55rem',
            color: '#4A5568',
          }}
        >
          ◐
        </span>
      </button>
    </div>
  );
}
