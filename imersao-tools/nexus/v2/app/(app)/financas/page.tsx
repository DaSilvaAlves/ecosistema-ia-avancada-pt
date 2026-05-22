'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCards } from '@/hooks/useCards';
import { useFinanceRecurrences } from '@/hooks/useFinanceRecurrences';
import { useFinanceRecurrenceEngine } from '@/hooks/useFinanceRecurrenceEngine';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/lib/db/repos/transactions';
import {
  createFinanceRecurrence,
  deleteFinanceRecurrence,
  updateFinanceRecurrence,
} from '@/lib/db/repos/finance-recurrences';
import {
  createRecurrence,
  deleteRecurrence,
  getRecurrence,
} from '@/lib/db/repos/recurrences';
import { generateTransactionInstances } from '@/lib/shared/recurrence';
import type { FinanceRecurrence, Recurrence, Transaction } from '@/types/db';
import { TransactionFormModal } from '@/components/financas/TransactionFormModal';
import { TransactionsList } from '@/components/financas/TransactionsList';
import {
  FinanceRecurrenceFormModal,
  type FinanceRecurrenceSubmit,
} from '@/components/financas/FinanceRecurrenceFormModal';
import { FinanceRecurrencesList } from '@/components/financas/FinanceRecurrencesList';

/**
 * Nexus v2 — Página /financas (Story 3.3 — transações variáveis FR16;
 * Story 3.4 — recorrências financeiras FR17)
 *
 * Rota: /financas — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component).
 *
 * Composição:
 *   1. Cabeçalho — título "Finanças" + botão de criação contextual à tab
 *   2. Tab strip — "Transações" | "Recorrências" ([AUTO-DECISION] A5 da 3.4)
 *   3. Tab Transações — lista cronológica + <TransactionFormModal> (Story 3.3)
 *   4. Tab Recorrências — lista + <FinanceRecurrenceFormModal> (Story 3.4)
 *
 * O motor de recorrência financeira (`useFinanceRecurrenceEngine`) corre uma vez
 * no mount — gera as transações recorrentes em falta dentro do horizonte de 90
 * dias. A Story 3.10 substitui este hook pela geração diária ("first load of
 * the day"). Repo isolation: zero `db.*` directos — apenas funções dos repos.
 */

type ModalState =
  | { kind: 'transaction'; mode: 'create' }
  | { kind: 'transaction'; mode: 'edit'; transaction: Transaction }
  | { kind: 'recurrence'; mode: 'create' }
  | {
      kind: 'recurrence';
      mode: 'edit';
      recurrence: FinanceRecurrence & { recurrence: Recurrence };
    }
  | null;

type Tab = 'transactions' | 'recurrences';

/** Recorrência financeira enriquecida com a `Recurrence` associada (RRULE). */
interface FinanceRecurrenceWithRule extends FinanceRecurrence {
  recurrence: Recurrence | undefined;
}

export default function FinancasPage(): React.ReactElement {
  const router = useRouter();

  // Story 3.4 — activa o motor de recorrência financeira uma vez no mount.
  useFinanceRecurrenceEngine();

  const [tab, setTab] = useState<Tab>('transactions');
  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  // Reads reactivos (useLiveQuery — re-render automático em insert/update/delete).
  const transactions = useTransactions();
  const categories = useCategories();
  const accounts = useAccounts();
  const cards = useCards();
  const financeRecurrences = useFinanceRecurrences();

  // Junta cada FinanceRecurrence à sua Recurrence (RRULE + datas) — reactivo.
  const recurrencesWithRule = useLiveQuery<
    FinanceRecurrenceWithRule[] | undefined
  >(async () => {
    if (financeRecurrences === undefined) return undefined;
    const enriched = await Promise.all(
      financeRecurrences.map(async (fr) => ({
        ...fr,
        recurrence: await getRecurrence(fr.recurrenceId),
      })),
    );
    return enriched;
  }, [financeRecurrences]);

  // Escape global → router.back (precedente Story 3.3). Só dispara se o modal
  // estiver fechado — o modal trata o seu próprio Escape.
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

  // ─── Transações (Story 3.3) ───

  const handleNewTransaction = useCallback((): void => {
    rememberOpener();
    setModal({ kind: 'transaction', mode: 'create' });
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction): void => {
    rememberOpener();
    setModal({ kind: 'transaction', mode: 'edit', transaction });
  }, []);

  async function handleSubmitTransaction(input: Transaction): Promise<void> {
    try {
      if (modal?.kind === 'transaction' && modal.mode === 'create') {
        await createTransaction(input);
      } else if (modal?.kind === 'transaction' && modal.mode === 'edit') {
        const patch: Partial<Transaction> = {
          amount: input.amount,
          category: input.category,
          description: input.description,
          date: input.date,
          accountId: input.accountId,
          cardId: input.cardId,
        };
        await updateTransaction(input.id, patch);
      }
    } catch (error) {
      console.error('Erro ao guardar transação', error);
      setErrorMessage('Erro ao guardar transação — tenta novamente.');
      throw error;
    }
  }

  const handleDeleteTransaction = useCallback(async (id: string): Promise<void> => {
    const confirmed = window.confirm(
      'Apagar esta transação? Esta acção não pode ser anulada.',
    );
    if (!confirmed) return;
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Erro ao apagar transação', error);
      setErrorMessage('Erro ao apagar transação — tenta novamente.');
    }
  }, []);

  // ─── Recorrências financeiras (Story 3.4) ───

  const handleNewRecurrence = useCallback((): void => {
    rememberOpener();
    setModal({ kind: 'recurrence', mode: 'create' });
  }, []);

  const handleEditRecurrence = useCallback(
    (recurrence: FinanceRecurrenceWithRule): void => {
      if (recurrence.recurrence === undefined) {
        setErrorMessage('Recorrência sem regra associada — não é possível editar.');
        return;
      }
      rememberOpener();
      setModal({
        kind: 'recurrence',
        mode: 'edit',
        recurrence: { ...recurrence, recurrence: recurrence.recurrence },
      });
    },
    [],
  );

  async function handleSubmitRecurrence(input: FinanceRecurrenceSubmit): Promise<void> {
    try {
      if (modal?.kind === 'recurrence' && modal.mode === 'create') {
        // AC9: criar Recurrence → criar FinanceRecurrence (com recurrenceId) →
        // gerar transações imediatamente.
        const recurrenceId = crypto.randomUUID();
        const recurrence: Recurrence = {
          id: recurrenceId,
          rule: input.rule,
          startDate: input.startDate,
          endDate: input.endDate,
          ownerType: 'transaction',
          ownerId: '', // preenchido a seguir, quando o FinanceRecurrence.id existir
        };
        // Cria primeiro o template (gera o id) para preencher Recurrence.ownerId.
        const financeRecurrence = await createFinanceRecurrence({
          ...input.template,
          recurrenceId,
        });
        await createRecurrence({
          ...recurrence,
          ownerId: financeRecurrence.id,
        });
        await generateTransactionInstances(financeRecurrence, {
          ...recurrence,
          ownerId: financeRecurrence.id,
        });
      } else if (modal?.kind === 'recurrence' && modal.mode === 'edit') {
        // AC10: preserva id/createdAt do FinanceRecurrence; actualiza o template
        // e recria a RRULE da Recurrence; gera novas transações (idempotente).
        const existing = modal.recurrence;
        await updateFinanceRecurrence(existing.id, {
          amount: input.template.amount,
          category: input.template.category,
          description: input.template.description,
          accountId: input.template.accountId,
          cardId: input.template.cardId,
        });
        const updatedRecurrence: Recurrence = {
          ...existing.recurrence,
          rule: input.rule,
          startDate: input.startDate,
          endDate: input.endDate,
        };
        // A tabela `recurrences` não tem update no repo; recria via put-equivalente.
        await deleteAndRecreateRecurrence(existing.recurrence.id, updatedRecurrence);
        await generateTransactionInstances(
          { ...existing, ...input.template, recurrenceId: existing.recurrenceId },
          updatedRecurrence,
        );
      }
    } catch (error) {
      console.error('Erro ao guardar recorrência financeira', error);
      setErrorMessage('Erro ao guardar recorrência — tenta novamente.');
      throw error;
    }
  }

  const handleDeleteRecurrence = useCallback(async (id: string): Promise<void> => {
    const confirmed = window.confirm(
      'Apagar esta recorrência? As transações já geradas não serão eliminadas.',
    );
    if (!confirmed) return;
    try {
      await deleteFinanceRecurrence(id);
    } catch (error) {
      console.error('Erro ao apagar recorrência financeira', error);
      setErrorMessage('Erro ao apagar recorrência — tenta novamente.');
    }
  }, []);

  // ─── Cabeçalho contextual ───

  const newButtonLabel =
    tab === 'transactions' ? '+ Nova transação' : '+ Nova recorrência';
  const handleNew = tab === 'transactions' ? handleNewTransaction : handleNewRecurrence;

  const recurrencesForList = useMemo<FinanceRecurrenceWithRule[]>(
    () => recurrencesWithRule ?? [],
    [recurrencesWithRule],
  );

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
          Finanças
        </h1>
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
          {newButtonLabel}
        </button>
      </header>

      <div
        role="tablist"
        aria-label="Vistas de finanças"
        style={{
          display: 'flex',
          gap: 4,
          padding: '0 1.5rem 1rem',
        }}
      >
        <TabButton
          id="tab-transactions"
          label="Transações"
          selected={tab === 'transactions'}
          onSelect={() => setTab('transactions')}
        />
        <TabButton
          id="tab-recurrences"
          label="Recorrências"
          selected={tab === 'recurrences'}
          onSelect={() => setTab('recurrences')}
        />
      </div>

      {tab === 'transactions' ? (
        <div role="tabpanel" aria-labelledby="tab-transactions" style={{ flex: 1 }}>
          {transactions === undefined ? (
            <LoadingSkeleton label="A carregar transações" />
          ) : transactions.length === 0 ? (
            <EmptyState text='Sem transações. Regista a primeira no botão "+ Nova transação".' />
          ) : (
            <TransactionsList
              transactions={transactions}
              categories={categories ?? []}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby="tab-recurrences" style={{ flex: 1 }}>
          {recurrencesWithRule === undefined ? (
            <LoadingSkeleton label="A carregar recorrências" />
          ) : recurrencesForList.length === 0 ? (
            <EmptyState text='Sem recorrências. Regista a primeira no botão "+ Nova recorrência".' />
          ) : (
            <FinanceRecurrencesList
              recurrences={recurrencesForList}
              categories={categories ?? []}
              onEdit={handleEditRecurrence}
              onDelete={handleDeleteRecurrence}
            />
          )}
        </div>
      )}

      {modal !== null && modal.kind === 'transaction' && (
        <TransactionFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.transaction : undefined}
          categories={categories ?? []}
          accounts={accounts ?? []}
          cards={cards ?? []}
          onClose={closeModal}
          onSubmit={handleSubmitTransaction}
        />
      )}

      {modal !== null && modal.kind === 'recurrence' && (
        <FinanceRecurrenceFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.recurrence : undefined}
          categories={categories ?? []}
          accounts={accounts ?? []}
          cards={cards ?? []}
          onClose={closeModal}
          onSubmit={handleSubmitRecurrence}
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

/**
 * A tabela `recurrences` só tem `createRecurrence`/`deleteRecurrence` no repo
 * (Story 2.1). Para editar uma `Recurrence` (modo edit de recorrência
 * financeira) recria-se o registo com o mesmo `id` — delete + create. O `id`
 * é preservado, por isso a `FinanceRecurrence.recurrenceId` continua válida.
 */
async function deleteAndRecreateRecurrence(
  id: string,
  next: Recurrence,
): Promise<void> {
  await deleteRecurrence(id);
  await createRecurrence({ ...next, id });
}

interface TabButtonProps {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function TabButton({ id, label, selected, onSelect }: TabButtonProps): React.ReactElement {
  return (
    <button
      id={id}
      role="tab"
      type="button"
      aria-selected={selected}
      onClick={onSelect}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: selected ? '#04040A' : '#8892A4',
        background: selected ? '#00F5FF' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${selected ? '#00F5FF' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 6,
        padding: '0.45rem 0.9rem',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function LoadingSkeleton({ label }: { label: string }): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      style={{
        margin: '0 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 56,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 12,
            animation: 'financas-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes financas-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ text }: { text: string }): React.ReactElement {
  return (
    <div
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
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '1rem',
          color: '#F0F4FF',
        }}
      >
        {text}
      </p>
    </div>
  );
}
