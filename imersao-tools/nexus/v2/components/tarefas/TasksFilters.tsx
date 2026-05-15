'use client';

import type { Project, Tag } from '@/types/db';
import type { TaskPriority, TaskStatus } from '@/lib/db/schemas';

/**
 * Nexus v2 — TasksFilters (Story 2.3 / AC4)
 *
 * 4 selects (Status, Projecto, Tag, Prioridade) + input pesquisa.
 *
 * Status/Projecto/Tag passam para useTasks (server-side filter via Dexie).
 * Prioridade + Pesquisa são client-side (useTasks não tem param priority/search).
 *
 * Pesquisa: <input type="search"> com debounce 200ms (page.tsx aplica).
 */

export type StatusFilter = TaskStatus | undefined;
export type PriorityFilter = TaskPriority | undefined;

interface TasksFiltersProps {
  status: StatusFilter;
  onStatusChange: (next: StatusFilter) => void;
  projectId: string | null | undefined;
  onProjectChange: (next: string | null | undefined) => void;
  projects: Project[] | undefined;
  tagId: string | undefined;
  onTagChange: (next: string | undefined) => void;
  tags: Tag[] | undefined;
  priority: PriorityFilter;
  onPriorityChange: (next: PriorityFilter) => void;
  search: string;
  onSearchChange: (next: string) => void;
}

const SELECT_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  color: '#F0F4FF',
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  padding: '0.45rem 0.7rem',
  cursor: 'pointer',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#8892A4',
  textTransform: 'uppercase',
};

export function TasksFilters({
  status,
  onStatusChange,
  projectId,
  onProjectChange,
  projects,
  tagId,
  onTagChange,
  tags,
  priority,
  onPriorityChange,
  search,
  onSearchChange,
}: TasksFiltersProps): React.ReactElement {
  return (
    <div
      role="search"
      aria-label="Filtros e pesquisa de tarefas"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
        margin: '1rem 1.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
      }}
    >
      <label style={LABEL_STYLE}>
        Status
        <select
          aria-label="Filtrar por estado da tarefa"
          value={status ?? ''}
          onChange={(e) => onStatusChange((e.target.value as StatusFilter) || undefined)}
          style={SELECT_STYLE}
        >
          <option value="">Todas</option>
          <option value="todo">Por fazer</option>
          <option value="in-progress">Em curso</option>
          <option value="blocked">Bloqueadas</option>
          <option value="done">Feitas</option>
        </select>
      </label>

      <label style={LABEL_STYLE}>
        Projecto
        <select
          aria-label="Filtrar por projecto"
          value={projectId === null ? '__none__' : (projectId ?? '')}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') onProjectChange(undefined);
            else if (v === '__none__') onProjectChange(null);
            else onProjectChange(v);
          }}
          style={SELECT_STYLE}
        >
          <option value="">Todos</option>
          <option value="__none__">Sem projecto</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label style={LABEL_STYLE}>
        Tag
        <select
          aria-label="Filtrar por tag"
          value={tagId ?? ''}
          onChange={(e) => onTagChange(e.target.value || undefined)}
          style={SELECT_STYLE}
        >
          <option value="">Todas</option>
          {(tags ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label style={LABEL_STYLE}>
        Prioridade
        <select
          aria-label="Filtrar por prioridade"
          value={priority ?? ''}
          onChange={(e) => onPriorityChange((e.target.value as PriorityFilter) || undefined)}
          style={SELECT_STYLE}
        >
          <option value="">Todas</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </label>

      <label style={{ ...LABEL_STYLE, flex: 1, minWidth: 180 }}>
        Pesquisar
        <input
          type="search"
          aria-label="Pesquisar tarefas pelo título"
          placeholder="Pesquisar tarefas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            ...SELECT_STYLE,
            width: '100%',
            cursor: 'text',
          }}
        />
      </label>
    </div>
  );
}
