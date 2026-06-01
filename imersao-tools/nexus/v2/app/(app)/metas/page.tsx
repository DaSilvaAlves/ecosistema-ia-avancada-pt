'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoals } from '@/hooks/useGoals';
import {
  createGoal,
  getGoal,
  updateGoal,
  deleteGoal,
} from '@/lib/db/repos/goals';
import type { Goal } from '@/types/db';
import { TabStrip, type TabDescriptor } from '@/components/ui/TabStrip';
import { GoalFormModal } from '@/components/metas/GoalFormModal';
import { GoalsList } from '@/components/metas/GoalsList';
import { GoalView } from '@/components/metas/GoalView';

/**
 * Nexus v2 — Página /metas (Story 4.5 — FR39/FR40)
 *
 * Rota: /metas — App Router page com 'use client' (Dexie via useLiveQuery exige
 * client component). Camada de UI sobre os repos/hooks da Story 4.1.
 *
 * Composição:
 *   1. Cabeçalho — título "Metas" + botão "+ Nova meta" (só na tab Activas).
 *   2. TabStrip (roving tabindex, Story 4.2) — "Activas" | "Alcançadas" | "Canceladas".
 *   3. GoalsList por tab (useGoals(status)).
 *   4. GoalFormModal (criar/editar) e GoalView (vista de detalhe).
 *
 * Repo isolation: zero `db.*` directos — apenas funções dos repos (padrão
 * `lembretes/page.tsx`). `todayISO` calculado uma vez aqui (UTC) e passado aos
 * componentes (determinismo dos helpers de progresso).
 */

type Tab = Goal['status']; // 'active' | 'achieved' | 'cancelled'

type ModalState =
  | { kind: 'create' }
  | { kind: 'edit'; goal: Goal }
  | { kind: 'view'; goal: Goal | null | undefined }
  | null;

const TABS: TabDescriptor[] = [
  { key: 'active', label: 'Activas' },
  { key: 'achieved', label: 'Alcançadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

/** `YYYY-MM-DD` UTC de hoje (mesma convenção dos helpers de hábitos). */
function todayISOUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MetasPage(): React.ReactElement {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('active');
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  // `todayISO` estável durante a montagem da page (não recalcula a cada render).
  const todayISO = useMemo(() => todayISOUTC(), []);

  const goals = useGoals(tab);

  // Escape global → router.back. Só dispara com o modal fechado (cada modal
  // trata o seu próprio Escape). Precedente `lembretes/page.tsx`.
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (modal !== null) return;
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, modal]);

  // Auto-dismiss do toast de erro após 4s.
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  function closeModal(): void {
    setModal(null);
    if (openerEl !== null) {
      setTimeout(() => openerEl.focus(), 0);
      setOpenerEl(null);
    }
  }

  function rememberOpener(): void {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) setOpenerEl(active);
    }
  }

  const handleNew = useCallback((): void => {
    rememberOpener();
    setModal({ kind: 'create' });
  }, []);

  const handleEdit = useCallback((goal: Goal): void => {
    rememberOpener();
    setModal({ kind: 'edit', goal });
  }, []);

  // Ver: lê estado fresco do goal (getGoal) — o histórico/milestones podem ter
  // mudado desde o último render da lista.
  const handleView = useCallback(async (goal: Goal): Promise<void> => {
    rememberOpener();
    setModal({ kind: 'view', goal: undefined }); // loading
    try {
      const fresh = await getGoal(goal.id);
      setModal({ kind: 'view', goal: fresh ?? null });
    } catch (error) {
      console.error('Erro ao abrir meta', error);
      setErrorMessage('Erro ao abrir a meta — tenta novamente.');
      setModal(null);
    }
  }, []);

  // AC10 — criar: id/current/status/milestones definidos aqui; o resto vem do modal.
  async function handleCreate(input: Partial<Goal>): Promise<void> {
    try {
      await createGoal({
        id: crypto.randomUUID(),
        title: input.title ?? '',
        description: input.description,
        type: input.type ?? 'numeric',
        target: input.target ?? 0,
        current: 0,
        deadline: input.deadline ?? null,
        status: 'active',
        milestones: input.milestones ?? [],
      });
    } catch (error) {
      console.error('Erro ao criar meta', error);
      setErrorMessage('Erro ao criar meta — tenta novamente.');
      throw error;
    }
  }

  // AC10 — editar: aplica o patch do modal (não toca current/status — geridos no GoalView).
  async function handleEditSubmit(goal: Goal, patch: Partial<Goal>): Promise<void> {
    try {
      await updateGoal(goal.id, patch);
    } catch (error) {
      console.error('Erro ao guardar meta', error);
      setErrorMessage('Erro ao guardar meta — tenta novamente.');
      throw error;
    }
  }

  async function handleSubmit(input: Partial<Goal>): Promise<void> {
    if (modal?.kind === 'create') {
      await handleCreate(input);
    } else if (modal?.kind === 'edit') {
      await handleEditSubmit(modal.goal, input);
    }
  }

  // AC8 — apagar com confirmação PT-PT explícita (hard-delete).
  const handleDelete = useCallback(async (goal: Goal): Promise<void> => {
    const confirmed = window.confirm(
      `Apagar "${goal.title}"? Esta acção é permanente e não pode ser desfeita.`,
    );
    if (!confirmed) return;
    try {
      await deleteGoal(goal.id);
    } catch (error) {
      console.error('Erro ao apagar meta', error);
      setErrorMessage('Erro ao apagar meta — tenta novamente.');
    }
  }, []);

  // AC10 — update de progresso: actualiza `current` + adiciona entrada ao progressLog.
  const handleUpdateProgress = useCallback(
    async (goalId: string, currentGoal: Goal, value: number, note?: string): Promise<void> => {
      try {
        const entry = { date: todayISO, value, note };
        const nextLog = [...(currentGoal.progressLog ?? []), entry];
        await updateGoal(goalId, { current: value, progressLog: nextLog });
        // Refresca o goal aberto no GoalView.
        const fresh = await getGoal(goalId);
        setModal({ kind: 'view', goal: fresh ?? null });
      } catch (error) {
        console.error('Erro ao actualizar progresso', error);
        setErrorMessage('Erro ao actualizar progresso — tenta novamente.');
      }
    },
    [todayISO],
  );

  // AC10 — toggle milestone (read-modify-write do array embebido).
  const handleToggleMilestone = useCallback(
    async (goalId: string, currentGoal: Goal, index: number): Promise<void> => {
      try {
        const next = currentGoal.milestones.map((m, i) =>
          i === index ? { ...m, reached: !m.reached } : m,
        );
        await updateGoal(goalId, { milestones: next });
        const fresh = await getGoal(goalId);
        setModal({ kind: 'view', goal: fresh ?? null });
      } catch (error) {
        console.error('Erro ao actualizar milestone', error);
        setErrorMessage('Erro ao actualizar milestone — tenta novamente.');
      }
    },
    [],
  );

  // AC10 — marcar como alcançada: numeric fixa current = target; boolean só status.
  const handleMarkAchieved = useCallback(
    async (currentGoal: Goal): Promise<void> => {
      try {
        const patch: Partial<Goal> =
          currentGoal.type === 'numeric'
            ? { status: 'achieved', current: currentGoal.target }
            : { status: 'achieved' };
        await updateGoal(currentGoal.id, patch);
        const fresh = await getGoal(currentGoal.id);
        setModal({ kind: 'view', goal: fresh ?? null });
      } catch (error) {
        console.error('Erro ao marcar meta como alcançada', error);
        setErrorMessage('Erro ao marcar a meta — tenta novamente.');
      }
    },
    [],
  );

  const viewGoal = modal?.kind === 'view' ? modal.goal : undefined;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 1.5rem 1rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#F0F4FF',
          }}
        >
          Metas
        </h1>
        {tab === 'active' && (
          <button
            type="button"
            onClick={handleNew}
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
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)',
            }}
          >
            + Nova meta
          </button>
        )}
      </header>

      <TabStrip
        tabs={TABS}
        activeTab={tab}
        onTabChange={(key) => setTab(key as Tab)}
        ariaLabel="Vistas de metas"
      />

      <div role="tabpanel" aria-labelledby={`tab-${tab}`} style={{ flex: 1 }}>
        <GoalsList
          goals={goals}
          todayISO={todayISO}
          onCreateFirst={handleNew}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {(modal?.kind === 'create' || modal?.kind === 'edit') && (
        <GoalFormModal
          mode={modal.kind}
          initialValue={modal.kind === 'edit' ? modal.goal : undefined}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {modal?.kind === 'view' && (
        <GoalView
          goal={viewGoal}
          todayISO={todayISO}
          onUpdateProgress={(value, note) =>
            viewGoal != null
              ? handleUpdateProgress(viewGoal.id, viewGoal, value, note)
              : Promise.resolve()
          }
          onToggleMilestone={(index) =>
            viewGoal != null
              ? handleToggleMilestone(viewGoal.id, viewGoal, index)
              : Promise.resolve()
          }
          onMarkAchieved={() =>
            viewGoal != null ? handleMarkAchieved(viewGoal) : Promise.resolve()
          }
          onClose={closeModal}
        />
      )}

      {errorMessage !== null && (
        <div
          role="alert"
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
