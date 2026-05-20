'use client';

import type { Tag } from '@/types/db';
import { TagCard } from '@/components/tags/TagCard';

/**
 * Nexus v2 — TagsGrid (Story 2.6 / AC7)
 *
 * Grid CSS responsivo de cards: `repeat(auto-fill, minmax(220px, 1fr))`.
 *
 * Estados (AC7):
 *   - Loading (`tags === undefined`): 6 cards skeleton com pulse animation.
 *   - Empty (zero-total vs filtro-vazio): mensagens PT-PT discriminadas via
 *     `hasAnyTag` prop.
 *   - Normal: array de `<TagCard>`.
 *
 * `taskCounts` injectado pelo parent (calculado via `Promise.all` sobre
 * `countTasksForTag` em `useLiveQuery`).
 */

interface TagsGridProps {
  tags: Tag[] | undefined;
  taskCounts: Record<string, number>;
  hasAnyTag: boolean;
  search: string;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onNewTag: () => void;
}

export function TagsGrid({
  tags,
  taskCounts,
  hasAnyTag,
  search,
  onEdit,
  onDelete,
  onNewTag,
}: TagsGridProps): React.ReactElement {
  if (tags === undefined) {
    return <LoadingSkeleton />;
  }

  if (tags.length === 0) {
    return <EmptyState hasAnyTag={hasAnyTag} search={search} onNewTag={onNewTag} />;
  }

  return (
    <div
      data-testid="tags-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12,
        padding: '0 1.5rem 1.5rem',
      }}
    >
      {tags.map((t) => (
        <TagCard
          key={t.id}
          tag={t}
          taskCount={taskCounts[t.id] ?? 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar tags"
      data-testid="tags-skeleton"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12,
        padding: '0 1.5rem 1.5rem',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 120,
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {Array.from({ length: 3 }).map((_, j) => (
            <div
              key={j}
              style={{
                height: j === 0 ? 16 : 10,
                width: j === 0 ? '70%' : `${50 + ((j * 17) % 30)}%`,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                backgroundSize: '200% 100%',
                borderRadius: 4,
                animation: 'tags-skeleton-pulse 1.6s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes tags-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface EmptyStateProps {
  hasAnyTag: boolean;
  search: string;
  onNewTag: () => void;
}

function EmptyState({ hasAnyTag, search, onNewTag }: EmptyStateProps): React.ReactElement {
  if (!hasAnyTag) {
    return (
      <div
        data-testid="empty-zero-total"
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
          Sem tags ainda. Cria a primeira para organizar as tuas tarefas.
        </p>
        <button
          type="button"
          onClick={onNewTag}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#04040A',
            background: '#00F5FF',
            border: 'none',
            borderRadius: 6,
            padding: '0.55rem 1.2rem',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
          }}
        >
          + Nova tag
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="empty-filter"
      style={{
        margin: '0 1.5rem 1.5rem',
        padding: '2rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          color: '#8892A4',
        }}
      >
        {search.trim() === ''
          ? 'Nenhuma tag corresponde aos filtros actuais.'
          : `Nenhuma tag corresponde a «${search.trim()}».`}
      </p>
    </div>
  );
}
