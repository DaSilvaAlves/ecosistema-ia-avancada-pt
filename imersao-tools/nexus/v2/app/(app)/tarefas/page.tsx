'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { listTags } from '@/lib/db/repos/tags';
import { setTaskStatus, deleteTask } from '@/lib/db/repos/tasks';
import { isOverdue } from '@/lib/tarefas/isOverdue';
import { useDebounced } from '@/hooks/useDebounced';
import { TasksHeader } from '@/components/tarefas/TasksHeader';
import { OverdueSection } from '@/components/tarefas/OverdueSection';
import { TasksFilters, type StatusFilter, type PriorityFilter } from '@/components/tarefas/TasksFilters';
import { TasksTable } from '@/components/tarefas/TasksTable';

/**
 * Nexus v2 — Vista lista de tarefas (Story 2.3 / AC1)
 *
 * Rota: /tarefas — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component).
 *
 * Composição:
 *   1. <TasksHeader> — título + tab strip (Lista activa; Kanban/Calendar disabled D2)
 *   2. <OverdueSection> — secção FR13 (só renderiza se há atrasadas)
 *   3. <TasksFilters> — 4 selects + pesquisa (debounce 200ms)
 *   4. Loading skeleton (5 linhas) | Empty state | <TasksTable>
 *
 * APIs consumidas (Story 2.1): useTasks, useProjects, listTags, setTaskStatus, deleteTask.
 * Helper D3: isOverdue (lib/tarefas).
 *
 * 4 [AUTO-DECISION] ratificadas pela @po: D1 sem drag, D2 tabs placeholder, D3 overdue=startOfToday, D4 kebab "Editar" disabled.
 */

export default function TarefasPage(): React.ReactElement {
  const router = useRouter();

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
  const tasks = useTasks({ status: statusFilter, projectId: projectFilter, tag: tagFilter });
  const projects = useProjects();
  // useTags hook ainda não existe (Story 2.6) — useLiveQuery inline via repo
  const tags = useLiveQuery(() => listTags(), []);

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
    }
  }

  async function handleDelete(taskId: string): Promise<void> {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Falha ao apagar tarefa', error);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TasksHeader activeTab="lista" />

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

      {visibleTasks === undefined ? (
        <LoadingSkeleton />
      ) : visibleTasks.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters({ statusFilter, projectFilter, tagFilter, priorityFilter, search, overdueOnly })} />
      ) : (
        <TasksTable
          tasks={visibleTasks}
          projects={projects}
          tags={tags}
          onToggleDone={handleToggleDone}
          onDelete={handleDelete}
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
