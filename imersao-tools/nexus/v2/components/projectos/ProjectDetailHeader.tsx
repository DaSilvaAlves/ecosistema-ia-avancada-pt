'use client';

import { forwardRef, type CSSProperties } from 'react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — ProjectDetailHeader (Story 2.9 / AC2)
 *
 * Header sticky da vista detalhada `/projectos/[id]` — apresenta:
 *   - `<h1>` com nome do projecto (Inter weight 800 1.6rem, `#F0F4FF`)
 *   - Status badge JetBrains Mono uppercase PT-PT (ACTIVO/PAUSADO/CONCLUÍDO)
 *     com cores Cyan/Gold/Lime (precedente `ProjectCard.tsx`)
 *   - Datas: 📅 Iniciado DD/MM/YYYY + (se deadline) ⏰ Prazo DD/MM/YYYY
 *     (formato PT-PT via `format(parseISO(...), 'dd/MM/yyyy', { locale: pt })`)
 *   - Progress bar Lime — `role="progressbar"` + `aria-valuenow` + labels (AC12)
 *   - Botão "Editar" (secondary — não cyan primary) — `forwardRef` para
 *     restaurar foco no opener ao fechar modal (AC9)
 *   - Botão "Esc · Voltar" — chama `onBack` que faz `router.back()`
 *
 * Header sticky `top: 0`, `background: rgba(4, 4, 10, 0.92)`,
 * `backdrop-filter: blur(12px)`, `z-index: 10` (precedente `TasksHeader.tsx`).
 *
 * Trace: Story 2.9 AC2, AC9, AC11, AC12.
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

interface ProjectDetailHeaderProps {
  project: Project;
  /** Percentagem 0-100 (integer) — calculada no parent via `useMemo` (AC2/A6). */
  progress: number;
  onEdit: () => void;
  onBack: () => void;
}

function formatDateBR(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: pt });
  } catch {
    return iso;
  }
}

export const ProjectDetailHeader = forwardRef<HTMLButtonElement, ProjectDetailHeaderProps>(
  function ProjectDetailHeader({ project, progress, onEdit, onBack }, editButtonRef): React.ReactElement {
    const accentColor = STATUS_COLOR[project.status];

    const headerStyle: CSSProperties = {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(4, 4, 10, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    };

    return (
      <header style={headerStyle} data-testid="project-detail-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#F0F4FF',
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
                title={project.name}
              >
                {project.name}
              </h1>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: accentColor,
                  background: `${accentColor}1f`,
                  border: `1px solid ${accentColor}4d`,
                  borderRadius: 20,
                  padding: '0.2rem 0.6rem',
                }}
                data-testid="project-status-badge"
              >
                {STATUS_LABEL_PT[project.status]}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              ref={editButtonRef}
              type="button"
              onClick={onEdit}
              aria-label={`Editar projecto ${project.name}`}
              data-testid="project-edit-button"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#F0F4FF',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: '0.55rem 1.1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar (Esc)"
              data-testid="project-back-button"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#F0F4FF',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: '0.5rem 0.9rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              Esc · Voltar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                color: '#8892A4',
                letterSpacing: '0.04em',
              }}
              data-testid="project-progress-label"
            >
              {progress}% concluído
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso do projecto"
            data-testid="project-progress-bar"
            style={{
              height: 6,
              width: '100%',
              background: 'rgba(57, 255, 20, 0.12)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, progress))}%`,
                background: '#39FF14',
                boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </header>
    );
  },
);
