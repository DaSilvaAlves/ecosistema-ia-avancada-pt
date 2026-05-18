'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { getProject, updateProject } from '@/lib/db/repos/projects';
import { listTags } from '@/lib/db/repos/tags';
import { useTasks } from '@/hooks/useTasks';
import { ProjectDetailHeader } from '@/components/projectos/ProjectDetailHeader';
import { ProjectFormModal } from '@/components/projectos/ProjectFormModal';
import { ProjectTaskRow } from '@/components/projectos/ProjectTaskRow';
import { KanbanBoard } from '@/components/tarefas/KanbanBoard';
import { STATUS_LABELS_PT, STATUS_SECTION_ORDER } from '@/lib/tarefas/colors';
import type { Project, Tag, Task } from '@/types/db';

/**
 * Nexus v2 — Página /projectos/[id] (Story 2.9 — Vista projecto / FR31)
 *
 * Rota dinâmica: vista detalhada de um projecto individual com:
 *   1. `<ProjectDetailHeader>` — sticky: nome + status badge + datas + progress bar
 *      + botões "Editar" (abre `ProjectFormModal`) e "Esc · Voltar" (router.back).
 *   2. **Tab strip** WAI-ARIA Tabs (Lista | Kanban) — default Lista.
 *      Arrow keys ←/→ navegam entre tabs, Home/End vão para primeiro/último.
 *   3. **Sub-vista Lista** — tasks agrupadas por status na ordem
 *      `STATUS_SECTION_ORDER` (Por fazer / Em curso / Bloqueadas / Concluídas).
 *      Cada secção tem `<h2>` PT-PT + contagem `(N)`. Linha simplificada via
 *      `<ProjectTaskRow>` (A7 — componente novo em vez de `TaskRow`).
 *   4. **Sub-vista Kanban** — `<KanbanBoard>` reutilizado da Story 2.4 com
 *      `tasks` já filtradas por `projectId` via `useTasks({projectId})`.
 *   5. **Estados**: Loading skeleton, Not Found (A9 — via `count()` Dexie),
 *      Empty tasks (A10 — CTA `/tarefas`), Toast de erro.
 *
 * Escape global → `router.back()` (precedente `tarefas/page.tsx:114-120`),
 * suprimido quando o modal está aberto (modal trata o seu próprio Escape).
 *
 * Loading vs Not-Found — Dev Notes §"Loading vs Not-Found" recomenda
 * `db.projects.where('id').equals(id).count()` para distinguir os dois cenários
 * sem flag manual `isLoaded`. Implementação adoptada.
 *
 * Repo isolation: zero `db.tasks.*` directos no JSX. `db.projects.where(...).count()`
 * é uma read-only single-purpose para distinguir loading/not-found (não é uma
 * substituição do `getProject` repo helper).
 *
 * Trace: Story 2.9 ACs 1-15.
 */

type ActiveTab = 'lista' | 'kanban';

export default function ProjectDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  // ─── Reads reactivos ───────────────────────────────────────────
  // Count via Dexie distingue loading (undefined) de not-found (0).
  const projectExists = useLiveQuery(
    () => (id === '' ? Promise.resolve(0) : db.projects.where('id').equals(id).count()),
    [id],
  );
  const project = useLiveQuery(
    () => (id === '' ? Promise.resolve(undefined) : getProject(id)),
    [id],
  );
  const tasks = useTasks({ projectId: id });
  const tags = useLiveQuery(() => listTags(), []);

  // Tags lookup para KanbanBoard
  const tagsLookup = useMemo<Map<string, Tag>>(() => {
    const map = new Map<string, Tag>();
    (tags ?? []).forEach((t) => map.set(t.id, t));
    return map;
  }, [tags]);

  // Tasks agrupadas por status para a sub-vista Lista (memoize evita recompute em cada render)
  const tasksByStatus = useMemo<Record<Task['status'], Task[]>>(() => {
    const groups: Record<Task['status'], Task[]> = {
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };
    (tasks ?? []).forEach((t) => groups[t.status].push(t));
    return groups;
  }, [tasks]);

  // Progress (AC2 / A6) — 0 quando 0 tasks ou tasks indefinidas
  const progress = useMemo<number>(() => {
    if (!tasks || tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  // ─── State UI ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('lista');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Record<ActiveTab, HTMLButtonElement | null>>({
    lista: null,
    kanban: null,
  });

  // ─── Effects ───────────────────────────────────────────────────
  // Escape global → router.back, suprimido se modal aberto.
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (editModalOpen) return;
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, editModalOpen]);

  // Auto-dismiss error toast após 4s
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleOpenEdit = useCallback((): void => {
    setEditModalOpen(true);
  }, []);

  const handleCloseEdit = useCallback((): void => {
    setEditModalOpen(false);
    // Restaurar foco no opener (Edit button) — defer com setTimeout para garantir
    // que o modal removeu o focus trap antes de reaplicar.
    setTimeout(() => {
      editButtonRef.current?.focus();
    }, 0);
  }, []);

  async function handleEditSubmit(updated: Project): Promise<void> {
    try {
      await updateProject(updated.id, {
        name: updated.name,
        description: updated.description,
        status: updated.status,
        startDate: updated.startDate,
        deadline: updated.deadline,
      });
    } catch (error) {
      console.error('Erro ao guardar projecto', error);
      setErrorMessage('Erro ao guardar projecto — tenta novamente.');
      throw error;
    }
  }

  const handleBack = useCallback((): void => {
    router.back();
  }, [router]);

  const handleNavigateToTasks = useCallback((): void => {
    router.push('/tarefas');
  }, [router]);

  const handleNavigateToProjectos = useCallback((): void => {
    router.push('/projectos');
  }, [router]);

  // Tab strip — arrow keys + Home/End (WAI-ARIA Tabs)
  function handleTabKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: ActiveTab,
  ): void {
    const order: ActiveTab[] = ['lista', 'kanban'];
    const currentIdx = order.indexOf(currentTab);
    if (currentIdx === -1) return;

    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % order.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + order.length) % order.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = order.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = order[nextIdx];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  // ─── Estados especiais ─────────────────────────────────────────
  const isLoading = projectExists === undefined;
  const isNotFound = projectExists === 0;

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (isNotFound || project === undefined) {
    return <ProjectNotFound onBack={handleNavigateToProjectos} />;
  }

  // ─── Render principal ──────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ProjectDetailHeader
        project={project}
        progress={progress}
        onEdit={handleOpenEdit}
        onBack={handleBack}
        ref={editButtonRef}
      />

      <div
        role="tablist"
        aria-label="Vistas do projecto"
        style={{
          display: 'flex',
          gap: 4,
          margin: '1rem 1.5rem 0',
          padding: 4,
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          alignSelf: 'flex-start',
        }}
      >
        {(['lista', 'kanban'] as const).map((tab) => (
          <TabButton
            key={tab}
            label={tab === 'lista' ? 'Lista' : 'Kanban'}
            active={activeTab === tab}
            onSelect={() => setActiveTab(tab)}
            onKeyDown={(e) => handleTabKeyDown(e, tab)}
            buttonRef={(el) => {
              tabRefs.current[tab] = el;
            }}
            controlsId={`project-tab-panel-${tab}`}
          />
        ))}
      </div>

      {activeTab === 'lista' && (
        <section
          id="project-tab-panel-lista"
          role="tabpanel"
          aria-label="Vista lista"
          style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <ListView
            tasksByStatus={tasksByStatus}
            tasks={tasks}
            onNavigateToTasks={handleNavigateToTasks}
          />
        </section>
      )}

      {activeTab === 'kanban' && (
        <section
          id="project-tab-panel-kanban"
          role="tabpanel"
          aria-label="Vista Kanban"
          style={{ padding: '1rem 1.5rem 1.5rem' }}
        >
          <KanbanBoard
            tasks={tasks}
            projects={[project]}
            tagsLookup={tagsLookup}
          />
        </section>
      )}

      {editModalOpen && (
        <ProjectFormModal
          mode="edit"
          initialValue={project}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />
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

// ────────────────────────────────────────────────────────────────
// Sub-componentes locais
// ────────────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  active: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
  controlsId: string;
}

function TabButton({ label, active, onSelect, onKeyDown, buttonRef, controlsId }: TabButtonProps): React.ReactElement {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controlsId}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        color: active ? '#04040A' : '#F0F4FF',
        background: active ? '#00F5FF' : 'transparent',
        border: 'none',
        borderRadius: 6,
        padding: '0.4rem 0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 0 12px rgba(0, 245, 255, 0.3)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

interface ListViewProps {
  tasksByStatus: Record<Task['status'], Task[]>;
  tasks: Task[] | undefined;
  onNavigateToTasks: () => void;
}

function ListView({ tasksByStatus, tasks, onNavigateToTasks }: ListViewProps): React.ReactElement {
  if (tasks === undefined) {
    return <TasksLoadingSkeleton />;
  }
  if (tasks.length === 0) {
    return <EmptyTasksState onNavigateToTasks={onNavigateToTasks} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {STATUS_SECTION_ORDER.map((status) => {
        const items = tasksByStatus[status];
        if (items.length === 0) return null;
        return (
          <section
            key={status}
            data-testid={`project-tasks-section-${status}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#8892A4',
                textTransform: 'uppercase',
              }}
            >
              {STATUS_LABELS_PT[status]}{items.length > 0 ? ` (${items.length})` : ''}
            </h2>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {items.map((t) => (
                <ProjectTaskRow key={t.id} task={t} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TasksLoadingSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar tarefas do projecto"
      data-testid="project-tasks-skeleton"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 44,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 8,
            animation: 'project-detail-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes project-detail-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface EmptyTasksStateProps {
  onNavigateToTasks: () => void;
}

function EmptyTasksState({ onNavigateToTasks }: EmptyTasksStateProps): React.ReactElement {
  return (
    <div
      data-testid="project-tasks-empty"
      style={{
        padding: '2rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          color: '#F0F4FF',
        }}
      >
        Sem tarefas neste projecto.
      </p>
      <button
        type="button"
        onClick={onNavigateToTasks}
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
        Ver tarefas em /tarefas
      </button>
    </div>
  );
}

function ProjectDetailSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar projecto"
      data-testid="project-detail-skeleton"
      style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 32 : 16,
            width: i === 0 ? '50%' : `${50 + ((i * 17) % 30)}%`,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 6,
            animation: 'project-detail-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes project-detail-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

interface ProjectNotFoundProps {
  onBack: () => void;
}

function ProjectNotFound({ onBack }: ProjectNotFoundProps): React.ReactElement {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Projecto não encontrado"
      data-testid="project-not-found"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          padding: '2rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            color: '#F0F4FF',
          }}
        >
          Projecto não encontrado.
        </p>
        <button
          type="button"
          onClick={onBack}
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
          Voltar aos projectos
        </button>
      </div>
    </div>
  );
}
