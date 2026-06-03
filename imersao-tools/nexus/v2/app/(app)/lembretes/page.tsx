'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReminders } from '@/hooks/useReminders';
import {
  createReminder,
  updateReminder,
  deleteReminder,
} from '@/lib/db/repos/reminders';
import {
  createRecurrence,
  getRecurrence,
  deleteRecurrence,
} from '@/lib/db/repos/recurrences';
import {
  putReminderSchedule,
  removeReminderSchedule,
} from '@/lib/push/schedule-client';
import type { Reminder } from '@/types/db';
import { TabStrip, type TabDescriptor } from '@/components/ui/TabStrip';
import {
  ReminderFormModal,
  type ReminderFormSubmit,
} from '@/components/lembretes/ReminderFormModal';
import { RemindersList } from '@/components/lembretes/RemindersList';
import { PushPermissionPrompt } from '@/components/push/PushPermissionPrompt';

/**
 * Nexus v2 — Página /lembretes (Story 4.6 — FR33)
 *
 * Rota: /lembretes — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component). Camada de UI sobre os repos/hooks da Story 4.1.
 *
 * Composição:
 *   1. Cabeçalho — título "Lembretes" + botão "+ Novo lembrete" (só na tab
 *      Pendentes).
 *   2. TabStrip (roving tabindex, Story 4.2) — "Pendentes" | "Cancelados".
 *   3. Tab Pendentes — RemindersList de lembretes `pending`/`snoozed` + acções
 *      Editar / Cancelar / Apagar.
 *   4. Tab Cancelados — RemindersList de lembretes `cancelled` + acções
 *      Restaurar / Apagar (sem Editar).
 *
 * Repo isolation: zero `db.*` directos — apenas funções dos repos (padrão
 * `habitos/page.tsx`). A recorrência opcional é persistida via `createRecurrence`
 * com `ownerType: 'reminder'` ANTES do `createReminder` (AC3 — se o create da
 * `Recurrence` falhar, o lembrete não fica órfão). O motor de geração de
 * instâncias e o disparo às 15h são a Story 4.8 — esta story só persiste o CRUD.
 */

type Tab = 'pending' | 'cancelled';

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; reminder: Reminder; rrule: string }
  | null;

const TABS: TabDescriptor[] = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'cancelled', label: 'Cancelados' },
];

/** `YYYY-MM-DD` (formato `Recurrence.startDate`) a partir de epoch ms. */
function fireAtToStartDate(fireAt: number): string {
  return new Date(fireAt).toISOString().slice(0, 10);
}

export default function LembretesPage(): React.ReactElement {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('pending');
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  const reminders = useReminders();

  // Tab Pendentes mostra pending + snoozed (pendentes-activos — [AUTO-DECISION]
  // A6). Tab Cancelados mostra apenas cancelled. Status `sent` é histórico
  // pós-disparo (gerido pela 4.8/4.9) e não aparece neste CRUD.
  const pendingReminders = useMemo<Reminder[] | undefined>(
    () =>
      reminders?.filter(
        (r) => r.status === 'pending' || r.status === 'snoozed',
      ),
    [reminders],
  );
  const cancelledReminders = useMemo<Reminder[] | undefined>(
    () => reminders?.filter((r) => r.status === 'cancelled'),
    [reminders],
  );

  // Escape global → router.back. Só dispara com o modal fechado (o modal trata
  // o seu próprio Escape). Precedente `habitos/page.tsx`.
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
    setModal({ mode: 'create' });
  }, []);

  // Edição: lê a RRULE actual (se o lembrete for recorrente) para pré-preencher
  // o campo no modal. `getRecurrence` retorna `undefined` quando não há.
  const handleEdit = useCallback(async (reminder: Reminder): Promise<void> => {
    rememberOpener();
    let rrule = '';
    if (reminder.recurrenceId !== null) {
      try {
        const recurrence = await getRecurrence(reminder.recurrenceId);
        rrule = recurrence?.rule ?? '';
      } catch (error) {
        console.error('Erro ao ler recorrência do lembrete', error);
      }
    }
    setModal({ mode: 'edit', reminder, rrule });
  }, []);

  // AC3 — criação: a Recurrence (se RRULE presente) é criada ANTES do Reminder.
  async function handleCreate(input: ReminderFormSubmit): Promise<void> {
    const reminderId = crypto.randomUUID();
    let recurrenceId: string | null = null;
    try {
      if (input.rrule !== '') {
        recurrenceId = crypto.randomUUID();
        await createRecurrence({
          id: recurrenceId,
          rule: input.rrule,
          startDate: fireAtToStartDate(input.fireAt),
          endDate: null,
          ownerType: 'reminder',
          ownerId: reminderId,
        });
      }
      const created: Reminder = {
        id: reminderId,
        text: input.text,
        fireAt: input.fireAt,
        recurrenceId,
        channels: ['push'],
        status: 'pending',
      };
      await createReminder(created);
      // Story 4.8 (AC3.2) — espelha a agenda para o mirror KV (disparo server-side).
      await putReminderSchedule(created);
    } catch (error) {
      console.error('Erro ao criar lembrete', error);
      setErrorMessage('Erro ao criar lembrete — tenta novamente.');
      throw error;
    }
  }

  // Edição: actualiza text/fireAt + reconcilia a Recurrence conforme a RRULE.
  //   - tinha RRULE e continua → actualiza a regra (deleteRecurrence + create
  //     com o mesmo id mantém o `recurrenceId` ligado);
  //   - tinha RRULE e foi removida → apaga a Recurrence + `recurrenceId: null`;
  //   - não tinha e passou a ter → cria a Recurrence + liga o `recurrenceId`.
  async function handleEditSubmit(
    reminder: Reminder,
    input: ReminderFormSubmit,
  ): Promise<void> {
    try {
      const hadRecurrence = reminder.recurrenceId !== null;
      const wantsRecurrence = input.rrule !== '';
      let recurrenceId: string | null = reminder.recurrenceId;

      if (wantsRecurrence) {
        if (hadRecurrence) {
          // Mantém o mesmo id (recria a definição com a regra/startDate novos).
          await deleteRecurrence(reminder.recurrenceId!);
          recurrenceId = reminder.recurrenceId;
        } else {
          recurrenceId = crypto.randomUUID();
        }
        await createRecurrence({
          id: recurrenceId!,
          rule: input.rrule,
          startDate: fireAtToStartDate(input.fireAt),
          endDate: null,
          ownerType: 'reminder',
          ownerId: reminder.id,
        });
      } else if (hadRecurrence) {
        await deleteRecurrence(reminder.recurrenceId!);
        recurrenceId = null;
      }

      await updateReminder(reminder.id, {
        text: input.text,
        fireAt: input.fireAt,
        recurrenceId,
      });
      // Story 4.8 (AC3.2) — re-espelha a agenda (text/fireAt mudaram).
      await putReminderSchedule({
        ...reminder,
        text: input.text,
        fireAt: input.fireAt,
        recurrenceId,
      });
    } catch (error) {
      console.error('Erro ao guardar lembrete', error);
      setErrorMessage('Erro ao guardar lembrete — tenta novamente.');
      throw error;
    }
  }

  async function handleSubmit(input: ReminderFormSubmit): Promise<void> {
    if (modal?.mode === 'create') {
      await handleCreate(input);
    } else if (modal?.mode === 'edit') {
      await handleEditSubmit(modal.reminder, input);
    }
  }

  // AC4 — cancelar (acção distinta de apagar): muda status para 'cancelled'.
  // Preserva o lembrete e a Recurrence (move-o para a tab Cancelados).
  const handleCancel = useCallback(async (reminder: Reminder): Promise<void> => {
    try {
      await updateReminder(reminder.id, { status: 'cancelled' });
      // Story 4.8 (AC3.2) — cancelado deixa de ser devido: remove do mirror KV.
      await removeReminderSchedule(reminder.id);
    } catch (error) {
      console.error('Erro ao cancelar lembrete', error);
      setErrorMessage('Erro ao cancelar lembrete — tenta novamente.');
    }
  }, []);

  // AC5 — restaurar: volta status para 'pending' (tab Pendentes).
  const handleRestore = useCallback(async (reminder: Reminder): Promise<void> => {
    try {
      await updateReminder(reminder.id, { status: 'pending' });
      // Story 4.8 (AC3.2) — restaurado volta a ser devido: re-espelha no mirror KV.
      await putReminderSchedule({ ...reminder, status: 'pending' });
    } catch (error) {
      console.error('Erro ao restaurar lembrete', error);
      setErrorMessage('Erro ao restaurar lembrete — tenta novamente.');
    }
  }, []);

  // AC6 — apagar com confirmação PT-PT explícita (hard-delete + cascade
  // Recurrence via `deleteReminder` — reminders.ts:74-85).
  const handleDelete = useCallback(async (reminder: Reminder): Promise<void> => {
    const confirmed = window.confirm(
      `Apagar "${reminder.text}"? Esta acção é definitiva e elimina também a recorrência associada. Para pausar o lembrete, usa "Cancelar".`,
    );
    if (!confirmed) return;
    try {
      await deleteReminder(reminder.id);
      // Story 4.8 (AC3.2) — apagado: remove a agenda do mirror KV.
      await removeReminderSchedule(reminder.id);
    } catch (error) {
      console.error('Erro ao apagar lembrete', error);
      setErrorMessage('Erro ao apagar lembrete — tenta novamente.');
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
          Lembretes
        </h1>
        {tab === 'pending' && (
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
            + Novo lembrete
          </button>
        )}
      </header>

      {/* Web Push (Story 4.7, FR35) — activar/gerir notificações dos lembretes.
          Local de integração escolhido: página Lembretes (fit semântico push↔lembretes). */}
      <div style={{ padding: '0 1.5rem 1rem' }}>
        <PushPermissionPrompt />
      </div>

      <TabStrip
        tabs={TABS}
        activeTab={tab}
        onTabChange={(key) => setTab(key as Tab)}
        ariaLabel="Vistas de lembretes"
      />

      {tab === 'pending' && (
        <div role="tabpanel" aria-labelledby="tab-pending" style={{ flex: 1 }}>
          <RemindersList
            reminders={pendingReminders}
            variant="pending"
            onEdit={handleEdit}
            onCancel={handleCancel}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      )}

      {tab === 'cancelled' && (
        <div role="tabpanel" aria-labelledby="tab-cancelled" style={{ flex: 1 }}>
          <RemindersList
            reminders={cancelledReminders}
            variant="cancelled"
            onEdit={handleEdit}
            onCancel={handleCancel}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      )}

      {modal !== null && (
        <ReminderFormModal
          mode={modal.mode}
          initialValue={
            modal.mode === 'edit'
              ? {
                  text: modal.reminder.text,
                  fireAt: modal.reminder.fireAt,
                  rrule: modal.rrule,
                }
              : undefined
          }
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
    </div>
  );
}
