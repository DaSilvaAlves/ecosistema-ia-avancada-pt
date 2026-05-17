'use client';

import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — ProjectCard (Story 2.8 / AC4)
 *
 * Card individual de projecto no grid `/projectos`. Layout:
 *   - Accent stripe top 2px colorida por status (Cyan/Gold/Lime).
 *   - Nome (Inter 1rem 700, truncado ~30 char).
 *   - Descrição (Inter 0.85rem 400, truncada 2 linhas).
 *   - Status badge (JetBrains Mono uppercase PT-PT).
 *   - Datas (📅 Iniciado, ⏰ Prazo opcional) formatadas dd/MM/yyyy.
 *   - Contadores (▣ X tarefas activas · ✓ Y concluídas) com plurais PT-PT.
 *   - Menu kebab `⋯` com WAI-ARIA Menu Authoring Practices.
 *
 * Acções condicionais ao status actual:
 *   - active: Editar, Arquivar, Marcar como concluído
 *   - paused: Editar, Reactivar, Marcar como concluído
 *   - done: Editar, Arquivar
 *
 * `React.memo` para evitar re-renders desnecessários quando outros cards mudam.
 */

const STATUS_COLOR: Record<Project['status'], string> = {
  active: '#00F5FF',
  paused: '#FFB800',
  done: '#39FF14',
};

const STATUS_LABEL_PT: Record<Project['status'], string> = {
  active: 'ACTIVO',
  paused: 'PAUSADO',
  done: 'CONCLUÍDO',
};

interface ProjectCardProps {
  project: Project;
  counts: { active: number; done: number };
  onEdit: (project: Project) => void;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  onMarkDone: (id: string) => void;
}

function formatCount(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatDateBR(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: pt });
  } catch {
    return iso;
  }
}

function ProjectCardImpl({
  project,
  counts,
  onEdit,
  onArchive,
  onReactivate,
  onMarkDone,
}: ProjectCardProps): React.ReactElement {
  const accentColor = STATUS_COLOR[project.status];
  const activeLabel = formatCount(counts.active, 'tarefa activa', 'tarefas activas');
  const doneLabel = formatCount(counts.done, 'concluída', 'concluídas');

  const cardStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.2s',
  };

  return (
    <article
      role="article"
      aria-label={`Projecto ${project.name}, estado ${STATUS_LABEL_PT[project.status].toLowerCase()}, ${activeLabel}, ${doneLabel}`}
      data-testid={`project-card-${project.id}`}
      data-status={project.status}
      style={cardStyle}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accentColor,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#F0F4FF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            lineHeight: 1.3,
          }}
          title={project.name}
        >
          {project.name}
        </h3>
        <KebabMenu
          project={project}
          onEdit={() => onEdit(project)}
          onArchive={() => onArchive(project.id)}
          onReactivate={() => onReactivate(project.id)}
          onMarkDone={() => onMarkDone(project.id)}
        />
      </div>

      {project.description !== '' && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 400,
            color: '#8892A4',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: accentColor,
            background: `${accentColor}1f`,
            border: `1px solid ${accentColor}4d`,
            borderRadius: 20,
            padding: '0.15rem 0.5rem',
          }}
        >
          {STATUS_LABEL_PT[project.status]}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: '#8892A4',
            letterSpacing: '0.02em',
          }}
        >
          📅 Iniciado {formatDateBR(project.startDate)}
        </span>
        {project.deadline !== null && (
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              color: '#8892A4',
              letterSpacing: '0.02em',
            }}
          >
            ⏰ Prazo {formatDateBR(project.deadline)}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: '#00F5FF',
          letterSpacing: '0.02em',
        }}
      >
        <span aria-label={activeLabel}>▣ {activeLabel}</span>
        <span style={{ color: '#4A5568' }}>·</span>
        <span aria-label={doneLabel}>✓ {doneLabel}</span>
      </div>
    </article>
  );
}

export const ProjectCard = memo(ProjectCardImpl);

// ────────────────────────────────────────────────────────────────────────────
// KebabMenu — WAI-ARIA Menu Authoring Practices (replicado de TaskKebabMenu)
// ────────────────────────────────────────────────────────────────────────────

interface KebabMenuProps {
  project: Project;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  onMarkDone: () => void;
}

function KebabMenu({ project, onEdit, onArchive, onReactivate, onMarkDone }: KebabMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent): void {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: { label: string; action: () => void }[] = [
    { label: 'Editar', action: onEdit },
  ];
  if (project.status === 'active' || project.status === 'done') {
    items.push({ label: 'Arquivar', action: onArchive });
  }
  if (project.status === 'paused') {
    items.push({ label: 'Reactivar', action: onReactivate });
  }
  if (project.status !== 'done') {
    items.push({ label: 'Marcar como concluído', action: onMarkDone });
  }

  function handleItemClick(action: () => void): void {
    action();
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Acções do projecto ${project.name}`}
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#8892A4',
          background: 'transparent',
          border: 'none',
          borderRadius: 4,
          padding: '0.1rem 0.4rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ⋯
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Menu de acções do projecto ${project.name}`}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            minWidth: 180,
            background: 'rgba(4, 4, 10, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            zIndex: 20,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(it.action)}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.82rem',
                color: '#F0F4FF',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '0.5rem 0.7rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
