'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCards } from '@/hooks/useCards';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/lib/db/repos/transactions';
import type { Transaction } from '@/types/db';
import { TransactionFormModal } from '@/components/financas/TransactionFormModal';
import { TransactionsList } from '@/components/financas/TransactionsList';

/**
 * Nexus v2 — Página /financas (Story 3.3 — CRUD transações variáveis, FR16)
 *
 * Rota: /financas — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component). Primeira rota de finanças do Epic 3; as Stories
 * 3.7/3.8/3.9 estendem-na com as vistas analíticas.
 *
 * Composição:
 *   1. Cabeçalho — título "Finanças" + botão "+ Nova transação"
 *   2. Lista cronológica básica de transações (loading | empty | <TransactionsList>)
 *   3. <TransactionFormModal> condicional — criar/editar com Zod + focus trap
 *
 * Repo isolation: zero `db.transactions.*` directos — apenas `createTransaction`,
 * `updateTransaction`, `deleteTransaction` do repo da Story 3.1.
 *
 * Os hooks reactivos vivem aqui (parent); o modal e a lista recebem os dados
 * por props — padrão herdado de `tarefas/page.tsx` e `projectos/page.tsx`.
 */

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; transaction: Transaction }
  | null;

export default function FinancasPage(): React.ReactElement {
  const router = useRouter();

  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  // Reads reactivos (useLiveQuery — re-render automático em insert/update/delete).
  const transactions = useTransactions();
  const categories = useCategories();
  const accounts = useAccounts();
  const cards = useCards();

  // Escape global → router.back (precedente projectos/page.tsx). Só dispara se
  // o modal estiver fechado — o modal trata o seu próprio Escape.
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

  const handleEdit = useCallback((transaction: Transaction): void => {
    rememberOpener();
    setModal({ mode: 'edit', transaction });
  }, []);

  async function handleSubmitModal(input: Transaction): Promise<void> {
    try {
      if (modal?.mode === 'create') {
        await createTransaction(input);
      } else if (modal?.mode === 'edit') {
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

  const handleDelete = useCallback(async (id: string): Promise<void> => {
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
          + Nova transação
        </button>
      </header>

      {transactions === undefined ? (
        <LoadingSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <TransactionsList
          transactions={transactions}
          categories={categories ?? []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {modal !== null && (
        <TransactionFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.transaction : undefined}
          categories={categories ?? []}
          accounts={accounts ?? []}
          cards={cards ?? []}
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

function LoadingSkeleton(): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="A carregar transações"
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

function EmptyState(): React.ReactElement {
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
        Sem transações. Regista a primeira no botão &quot;+ Nova transação&quot;.
      </p>
    </div>
  );
}
