'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useHabits } from '@/hooks/useHabits';
import {
  createHabit,
  updateHabit,
  archiveHabit,
  restoreHabit,
  deleteHabit,
} from '@/lib/db/repos/habits';
import {
  createHabitLog,
  listHabitLogsByHabit,
} from '@/lib/db/repos/habit-logs';
import type { Habit, HabitLog } from '@/types/db';
import { TabStrip, type TabDescriptor } from '@/components/ui/TabStrip';
import { HabitFormModal } from '@/components/habitos/HabitFormModal';
import { HabitsList } from '@/components/habitos/HabitsList';

/**
 * Nexus v2 — Página /habitos (Story 4.2 — FR24/FR25)
 *
 * Rota: /habitos — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component). Camada de UI sobre os repos/hooks da Story 4.1.
 *
 * Composição:
 *   1. Cabeçalho — título "Hábitos" + botão "+ Novo hábito" (só na tab Activos).
 *   2. TabStrip (AC2, roving tabindex) — "Activos" | "Arquivados".
 *   3. Tab Activos — HabitsList de hábitos com `archivedAt === undefined` +
 *      acções Editar / Marcar concluído / Arquivar / Apagar.
 *   4. Tab Arquivados — HabitsList de hábitos arquivados + acções Restaurar /
 *      Apagar (sem "Marcar concluído").
 *
 * Repo isolation: zero `db.*` directos — apenas funções dos repos (padrão
 * `financas/page.tsx:53`). O registo de concluído é idempotente (AC7,
 * [AUTO-DECISION] A2): antes de criar o log verifica se já existe um para
 * `(habitId, hoje)`.
 */

type Tab = 'active' | 'archived';

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; habit: Habit }
  | null;

const TABS: TabDescriptor[] = [
  { key: 'active', label: 'Activos' },
  { key: 'archived', label: 'Arquivados' },
];

/** Data de hoje em `YYYY-MM-DD` (satisfaz `ISO_DATE_REGEX` do HabitLogSchema). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitosPage(): React.ReactElement {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('active');
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  const habits = useHabits();

  // Logs de hoje de TODOS os hábitos — reactivo. Usado para o badge "concluído
  // hoje" na lista de activos. Re-executa quando a lista de hábitos muda.
  const todayLogs = useLiveQuery<HabitLog[] | undefined>(async () => {
    if (habits === undefined) return undefined;
    const today = todayISO();
    const perHabit = await Promise.all(
      habits.map((h) => listHabitLogsByHabit(h.id, { from: today, to: today })),
    );
    return perHabit.flat();
  }, [habits]);

  // Separa hábitos activos (sem `archivedAt`) de arquivados.
  const activeHabits = useMemo<Habit[] | undefined>(
    () => habits?.filter((h) => h.archivedAt === undefined),
    [habits],
  );
  const archivedHabits = useMemo<Habit[] | undefined>(
    () => habits?.filter((h) => h.archivedAt !== undefined),
    [habits],
  );

  // Escape global → router.back. Só dispara com o modal fechado (o modal trata
  // o seu próprio Escape). Precedente `financas/page.tsx`.
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (modal !== null) return;
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, modal]);

  // Auto-dismiss dos toasts após 4s.
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (infoMessage === null) return;
    const timer = setTimeout(() => setInfoMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [infoMessage]);

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
    setModal({ mode: 'create' });
  }, []);

  const handleEdit = useCallback((habit: Habit): void => {
    rememberOpener();
    setModal({ mode: 'edit', habit });
  }, []);

  async function handleSubmit(input: Partial<Habit>): Promise<void> {
    try {
      if (modal?.mode === 'create') {
        // O modal só edita name/frequency/category/time — `id`/`createdAt`
        // gerados aqui; `metric` é Story 4.4.
        const habit: Habit = {
          id: crypto.randomUUID(),
          name: input.name ?? '',
          frequency: input.frequency ?? '',
          category: input.category ?? '',
          ...(input.time !== undefined ? { time: input.time } : {}),
          createdAt: Date.now(),
        };
        await createHabit(habit);
      } else if (modal?.mode === 'edit') {
        // Patch único e atómico (uma só escrita). A chave `time` está SEMPRE
        // presente no patch: com o valor introduzido, ou `undefined` quando o
        // utilizador limpou o campo. Distinção crítica do comportamento Dexie
        // `update()` (verificada em `habits.test.ts`):
        //   - chave AUSENTE no patch → ignorada (o `time` antigo persistiria);
        //   - chave PRESENTE com `undefined` → a Dexie REMOVE a chave.
        // Por isso `input.time` (que o modal entrega `undefined` quando limpo)
        // entra sempre no patch — limpar o horário remove-o de facto numa só
        // operação. O tipo é `string | undefined` (sem `null`): "sem horário" =
        // ausência da chave, não `null`.
        const patch: Partial<Habit> = {
          name: input.name,
          frequency: input.frequency,
          category: input.category,
          time: input.time,
        };
        await updateHabit(modal.habit.id, patch);
      }
    } catch (error) {
      console.error('Erro ao guardar hábito', error);
      setErrorMessage('Erro ao guardar hábito — tenta novamente.');
      throw error;
    }
  }

  // AC7 — registo idempotente de concluído hoje.
  const handleMarkDone = useCallback(async (habit: Habit): Promise<void> => {
    const today = todayISO();
    try {
      const existing = await listHabitLogsByHabit(habit.id, {
        from: today,
        to: today,
      });
      if (existing.length > 0) {
        setInfoMessage(`"${habit.name}" já estava registado hoje.`);
        return;
      }
      await createHabitLog({
        id: crypto.randomUUID(),
        habitId: habit.id,
        date: today,
      });
    } catch (error) {
      console.error('Erro ao registar hábito concluído', error);
      setErrorMessage('Erro ao registar hábito — tenta novamente.');
    }
  }, []);

  const handleArchive = useCallback(async (habit: Habit): Promise<void> => {
    try {
      await archiveHabit(habit.id);
    } catch (error) {
      console.error('Erro ao arquivar hábito', error);
      setErrorMessage('Erro ao arquivar hábito — tenta novamente.');
    }
  }, []);

  const handleRestore = useCallback(async (habit: Habit): Promise<void> => {
    try {
      await restoreHabit(habit.id);
    } catch (error) {
      console.error('Erro ao restaurar hábito', error);
      setErrorMessage('Erro ao restaurar hábito — tenta novamente.');
    }
  }, []);

  // AC8 — apagar com confirmação que menciona arquivar como alternativa.
  const handleDelete = useCallback(async (habit: Habit): Promise<void> => {
    const confirmed = window.confirm(
      `Apagar "${habit.name}"? Esta acção elimina também todo o histórico de registos e não pode ser desfeita. Para pausar sem perder histórico, usa "Arquivar".`,
    );
    if (!confirmed) return;
    try {
      await deleteHabit(habit.id);
    } catch (error) {
      console.error('Erro ao apagar hábito', error);
      setErrorMessage('Erro ao apagar hábito — tenta novamente.');
    }
  }, []);

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
          Hábitos
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
            + Novo hábito
          </button>
        )}
      </header>

      <TabStrip
        tabs={TABS}
        activeTab={tab}
        onTabChange={(key) => setTab(key as Tab)}
        ariaLabel="Vistas de hábitos"
      />

      {tab === 'active' && (
        <div role="tabpanel" aria-labelledby="tab-active" style={{ flex: 1 }}>
          <HabitsList
            habits={activeHabits}
            todayLogs={todayLogs}
            variant="active"
            onEdit={handleEdit}
            onMarkDone={handleMarkDone}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      )}

      {tab === 'archived' && (
        <div role="tabpanel" aria-labelledby="tab-archived" style={{ flex: 1 }}>
          <HabitsList
            habits={archivedHabits}
            todayLogs={todayLogs}
            variant="archived"
            onEdit={handleEdit}
            onMarkDone={handleMarkDone}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      )}

      {modal !== null && (
        <HabitFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.habit : undefined}
          onClose={closeModal}
          onSubmit={handleSubmit}
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

      {infoMessage !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '0.7rem 1.2rem',
            background: 'rgba(0, 245, 255, 0.12)',
            border: '1px solid rgba(0, 245, 255, 0.35)',
            borderRadius: 8,
            color: '#00F5FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {infoMessage}
        </div>
      )}
    </div>
  );
}
