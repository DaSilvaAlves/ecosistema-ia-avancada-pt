'use client';

import type { Project } from '@/types/db';
import { ProjectCard } from '@/components/projectos/ProjectCard';

/**
 * Nexus v2 — ProjectsGrid (Story 2.8 / AC3 + AC7)
 *
 * Grid CSS responsivo de cards: `repeat(auto-fill, minmax(280px, 1fr))`.
 *
 * Estados (AC7):
 *   - Loading (`projects === undefined`): 6 cards skeleton com pulse animation.
 *   - Empty (zero-total vs filtro-vazio): mensagens PT-PT discriminadas via
 *     `hasAnyProject` prop.
 *   - Normal: array de `<ProjectCard>`.
 *
 * `taskCountsByProject` injectado pelo parent (calculado uma vez via group by
 * sobre `useTasks()`).
 */

interface ProjectsGridProps {
  projects: Project[] | undefined;
  taskCountsByProject: Record<string, { active: number; done: number }>;
  hasAnyProject: boolean;
  onEdit: (project: Project) => void;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  onMarkDone: (id: string) => void;
  onNewProject: () => void;
  /**
   * Story 2.9 (AC10) — callback para navegar para `/projectos/[id]`.
   * Opcional para preservar compatibilidade com qualquer consumidor que
   * ainda não tenha a vista detalhada activa.
   */
  onView?: (id: string) => void;
}

export function ProjectsGrid({
  projects,
  taskCountsByProject,
  hasAnyProject,
  onEdit,
  onArchive,
  onReactivate,
  onMarkDone,
  onNewProject,
  onView,
}: ProjectsGridProps): React.ReactElement {
  if (projects === undefined) {
    return <LoadingSkeleton />;
  }

  if (projects.length === 0) {
    return <EmptyState hasAnyProject={hasAnyProject} onNewProject={onNewProject} />;
  }

  return (
    <div
      data-testid="projects-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        padding: '0 1.5rem 1.5rem',
      }}
    >
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          counts={taskCountsByProject[p.id] ?? { active: 0, done: 0 }}
          onEdit={onEdit}
          onArchive={onArchive}
          onReactivate={onReactivate}
          onMarkDone={onMarkDone}
          onView={onView}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar projectos"
      data-testid="projects-skeleton"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        padding: '0 1.5rem 1.5rem',
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 180,
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              style={{
                height: j === 0 ? 18 : 12,
                width: j === 0 ? '70%' : `${60 + ((j * 13) % 30)}%`,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                backgroundSize: '200% 100%',
                borderRadius: 4,
                animation: 'projects-skeleton-pulse 1.6s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes projects-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface EmptyStateProps {
  hasAnyProject: boolean;
  onNewProject: () => void;
}

function EmptyState({ hasAnyProject, onNewProject }: EmptyStateProps): React.ReactElement {
  if (!hasAnyProject) {
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
          Sem projectos. Cria o primeiro com <strong>+ Novo projecto</strong>.
        </p>
        <button
          type="button"
          onClick={onNewProject}
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
          + Novo projecto
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
        Nenhum projecto neste estado.
      </p>
    </div>
  );
}
