'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import {
  archiveProject,
  createProject,
  updateProject,
} from '@/lib/db/repos/projects';
import type { Project } from '@/types/db';
import {
  ProjectsHeader,
  type ProjectTab,
} from '@/components/projectos/ProjectsHeader';
import { ProjectsGrid } from '@/components/projectos/ProjectsGrid';
import { ProjectFormModal } from '@/components/projectos/ProjectFormModal';

/**
 * Nexus v2 — Página /projectos (Story 2.8 — CRUD projectos)
 *
 * Rota: /projectos — App Router page com 'use client' (Dexie via useLiveQuery).
 *
 * Composição:
 *   1. <ProjectsHeader> — título sticky + tab strip (Activos/Pausados/Concluídos/Todos)
 *      + "+ Novo projecto" + "Esc · Voltar"
 *   2. <ProjectsGrid> — grid CSS responsivo com cards (loading/empty/normal)
 *   3. <ProjectFormModal> condicional — criar/editar com Zod validation + focus trap
 *
 * Acções inline por card (kebab menu): Editar, Arquivar, Reactivar, Marcar como concluído.
 * Delete fora-de-scope (Story 2.8 [AUTO-DECISION] A5).
 *
 * Contadores por card (A6): `useTasks()` global + `useMemo` group by projectId.
 *
 * Repo isolation: zero `db.projects.*` directos — apenas `createProject`, `updateProject`,
 * `archiveProject` do repo Story 2.1.
 */

type ModalState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

const TAB_TO_STATUS: Record<ProjectTab, Project['status'] | undefined> = {
  activos: 'active',
  pausados: 'paused',
  concluidos: 'done',
  todos: undefined,
};

export default function ProjectosPage(): React.ReactElement {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProjectTab>('activos');
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  // Reads reactivos
  const projects = useProjects({ status: TAB_TO_STATUS[activeTab] });
  const allProjects = useProjects(); // sem filtro — para `hasAnyProject` discriminar empty states
  const tasks = useTasks();

  // Contadores por projecto (A6) — single useTasks() + group by, não N+1
  const taskCountsByProject = useMemo<Record<string, { active: number; done: number }>>(() => {
    const map: Record<string, { active: number; done: number }> = {};
    if (!tasks) return map;
    for (const t of tasks) {
      if (t.projectId === null) continue;
      const bucket = map[t.projectId] ?? { active: 0, done: 0 };
      if (t.status === 'done') bucket.done += 1;
      else bucket.active += 1;
      map[t.projectId] = bucket;
    }
    return map;
  }, [tasks]);

  const hasAnyProject = (allProjects?.length ?? 0) > 0;

  // Escape global → router.back (precedente tarefas/page.tsx)
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      // Só dispara se o modal NÃO estiver aberto (modal trata o seu próprio Escape)
      if (modal !== null) return;
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, modal]);

  // Auto-dismiss error toast após 4s
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // Restaurar foco no opener ao fechar modal
  function closeModal(): void {
    setModal(null);
    if (openerEl !== null) {
      setTimeout(() => openerEl.focus(), 0);
      setOpenerEl(null);
    }
  }

  const handleNewProject = useCallback((): void => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) setOpenerEl(active);
    }
    setModal({ mode: 'create' });
  }, []);

  const handleEdit = useCallback((project: Project): void => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) setOpenerEl(active);
    }
    setModal({ mode: 'edit', project });
  }, []);

  async function handleSubmitModal(input: Project): Promise<void> {
    try {
      if (modal?.mode === 'create') {
        await createProject(input);
      } else if (modal?.mode === 'edit') {
        const patch: Partial<Project> = {
          name: input.name,
          description: input.description,
          status: input.status,
          startDate: input.startDate,
          deadline: input.deadline,
        };
        await updateProject(input.id, patch);
      }
    } catch (error) {
      console.error('Erro ao guardar projecto', error);
      setErrorMessage('Erro ao guardar projecto — tenta novamente.');
      throw error;
    }
  }

  const handleArchive = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveProject(id);
    } catch (error) {
      console.error('Erro ao arquivar projecto', error);
      setErrorMessage('Erro ao arquivar projecto — tenta novamente.');
    }
  }, []);

  const handleReactivate = useCallback(async (id: string): Promise<void> => {
    try {
      await updateProject(id, { status: 'active' });
    } catch (error) {
      console.error('Erro ao reactivar projecto', error);
      setErrorMessage('Erro ao actualizar projecto — tenta novamente.');
    }
  }, []);

  const handleMarkDone = useCallback(async (id: string): Promise<void> => {
    try {
      await updateProject(id, { status: 'done' });
    } catch (error) {
      console.error('Erro ao marcar projecto como concluído', error);
      setErrorMessage('Erro ao actualizar projecto — tenta novamente.');
    }
  }, []);

  // Story 2.9 (AC10) — navegação para vista detalhada `/projectos/[id]`.
  const handleView = useCallback(
    (id: string): void => {
      router.push(`/projectos/${id}`);
    },
    [router],
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ProjectsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewProject={handleNewProject}
      />

      <ProjectsGrid
        projects={projects}
        taskCountsByProject={taskCountsByProject}
        hasAnyProject={hasAnyProject}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onReactivate={handleReactivate}
        onMarkDone={handleMarkDone}
        onNewProject={handleNewProject}
        onView={handleView}
      />

      {modal !== null && (
        <ProjectFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.project : undefined}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
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
