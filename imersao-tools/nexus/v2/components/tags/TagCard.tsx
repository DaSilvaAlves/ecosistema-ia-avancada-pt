'use client';

import { memo, type CSSProperties } from 'react';
import type { Tag } from '@/types/db';
import { getColorLabel } from '@/lib/tags/colors';

/**
 * Nexus v2 — TagCard (Story 2.6 / AC8)
 *
 * Card individual de tag no grid `/tags`. Layout:
 *   - Chip de cor (12×12 round) com `aria-label="Cor: {label}"`.
 *   - Nome (Inter 0.95rem 700).
 *   - Contagem de uso `{N} TAREFAS` ou `1 TAREFA` (JetBrains Mono 0.65rem).
 *   - Botões "Editar" (secondary) e "Eliminar" (Magenta destructive).
 *
 * `window.confirm` é tratado pelo parent (page) que tem acesso à contagem
 * via Promise.all sobre `countTasksForTag` (A8). O TagCard só dispara
 * `onDelete(tag.id)` — a confirmação cascata-aware vive na page.
 *
 * `React.memo` para evitar re-renders desnecessários quando outras tags mudam.
 */

interface TagCardProps {
  tag: Tag;
  taskCount: number;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

function formatTagCount(n: number): string {
  return n === 1 ? '1 TAREFA' : `${n} TAREFAS`;
}

function TagCardImpl({ tag, taskCount, onEdit, onDelete }: TagCardProps): React.ReactElement {
  const colorLabel = getColorLabel(tag.color);
  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: '0.85rem',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.2s',
  };

  return (
    <article
      role="article"
      aria-label={`Tag ${tag.name}, ${colorLabel}, ${formatTagCount(taskCount).toLowerCase()}`}
      data-testid={`tag-card-${tag.id}`}
      style={cardStyle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-label={`Cor: ${colorLabel}`}
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: tag.color,
            flexShrink: 0,
          }}
        />
        <h3
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#F0F4FF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            lineHeight: 1.3,
          }}
          title={tag.name}
        >
          {tag.name}
        </h3>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#8892A4',
        }}
      >
        {formatTagCount(taskCount)}
      </span>

      <div
        style={{
          display: 'flex',
          gap: 6,
          paddingTop: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <button
          type="button"
          onClick={() => onEdit(tag)}
          aria-label={`Editar tag ${tag.name}`}
          style={{
            flex: 1,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#F0F4FF',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '0.4rem 0.7rem',
            cursor: 'pointer',
          }}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(tag)}
          aria-label={`Eliminar tag ${tag.name}`}
          style={{
            flex: 1,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#FF006E',
            background: 'rgba(255, 0, 110, 0.08)',
            border: '1px solid rgba(255, 0, 110, 0.24)',
            borderRadius: 6,
            padding: '0.4rem 0.7rem',
            cursor: 'pointer',
          }}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

export const TagCard = memo(TagCardImpl);
