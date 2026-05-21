'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { format } from 'date-fns';
import { TransactionSchema } from '@/lib/db/schemas';
import type { Account, Card, Category, Transaction } from '@/types/db';
import {
  applyDirection,
  centsToInputValue,
  directionOf,
  parseCurrencyInput,
  type Direction,
} from '@/lib/financas/currencyInput';

/**
 * Nexus v2 — TransactionFormModal (Story 3.3 — CRUD transações variáveis, FR16)
 *
 * Modal centrado glassmorphism com formulário criar/editar transação variável.
 * Replica o padrão do `ProjectFormModal` (Story 2.8): focus trap, validação
 * `TransactionSchema.parse()` em submit, `ZodError` mapeado para erros PT-PT
 * por campo, acessibilidade WAI-ARIA Modal Authoring Practices.
 *
 * 7 campos (AC2): Valor (texto, euros PT-PT), Direção (Saída/Entrada), Categoria
 * (dropdown, obrigatório), Data (default hoje), Descrição (opcional), Conta e
 * Cartão (dropdowns opcionais, default "— Nenhuma —").
 *
 * Modelo de dados (Story 3.1): `Transaction.amount` é cêntimos inteiros com
 * sinal — negativo = saída, positivo = entrada. O campo Valor recolhe a
 * magnitude; o sinal vem do seletor Direção via `applyDirection`.
 *
 * As categorias/contas/cartões são passados por props pelo parent (a página
 * `/financas` detém os hooks `useCategories`/`useAccounts`/`useCards`).
 */

interface TransactionFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Transaction;
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  onClose: () => void;
  onSubmit: (input: Transaction) => Promise<void>;
}

type FormState = {
  amountInput: string;
  direction: Direction;
  category: string;
  date: string;
  description: string;
  accountId: string; // '' = nenhuma conta
  cardId: string; // '' = nenhum cartão
};

type FieldErrors = Partial<Record<keyof Transaction | 'amountInput', string>>;

export function TransactionFormModal({
  mode,
  initialValue,
  categories,
  accounts,
  cards,
  onClose,
  onSubmit,
}: TransactionFormModalProps): React.ReactElement {
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState<FormState>(() =>
    initialValue
      ? {
          amountInput: centsToInputValue(Math.abs(initialValue.amount)),
          direction: directionOf(initialValue.amount),
          category: initialValue.category,
          date: initialValue.date,
          description: initialValue.description,
          accountId: initialValue.accountId ?? '',
          cardId: initialValue.cardId ?? '',
        }
      : {
          amountInput: '',
          direction: 'saida',
          category: '',
          date: todayIso,
          description: '',
          accountId: '',
          cardId: '',
        },
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'transactions-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão ProjectFormModal.
  useEffect(() => {
    firstInputRef.current?.focus();

    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    const errorKey = key === 'amountInput' ? 'amountInput' : (key as keyof FieldErrors);
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    // 1. Converter o valor digitado (euros PT-PT) em cêntimos + aplicar a direção.
    let amount: number;
    try {
      const cents = parseCurrencyInput(form.amountInput);
      amount = applyDirection(cents, form.direction);
    } catch (err) {
      setErrors({ amountInput: err instanceof Error ? err.message : 'Valor inválido.' });
      return;
    }

    // 2. Construir o objecto Transaction completo. `recurrenceId`/`installmentId`
    //    preservam o valor original em modo edit; numa transação variável
    //    criada manualmente são sempre `null` (Stories 3.4/3.6 preenchem-nos).
    const candidate: Transaction = {
      id: initialValue?.id ?? crypto.randomUUID(),
      amount,
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      accountId: form.accountId === '' ? null : form.accountId,
      cardId: form.cardId === '' ? null : form.cardId,
      recurrenceId: initialValue?.recurrenceId ?? null,
      installmentId: initialValue?.installmentId ?? null,
      createdAt: initialValue?.createdAt ?? Date.now(),
    };

    try {
      const parsed = TransactionSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0] as keyof Transaction | undefined;
          if (field !== undefined && !(field in fieldErrors)) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      } else {
        // Erro do repo (não-Zod): o parent (`financas/page.tsx`) já o tratou —
        // `console.error` + toast de erro. Não reescapamos: num handler `async`
        // o `throw` viraria uma promise rejeitada não tratada e deixaria o modal
        // num estado inconsistente. `return` mantém o modal aberto, com
        // `submitting` já a `false`, para o utilizador poder tentar de novo.
        return;
      }
    }
  }

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 4, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="transactions-modal"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '1.5rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
        }}
      >
        <h2
          id={titleId}
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#F0F4FF',
            letterSpacing: '-0.01em',
          }}
        >
          {isCreate ? 'Nova transação' : 'Editar transação'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field id="transaction-amount" label="Valor (€)" required error={errors.amountInput}>
            <input
              ref={firstInputRef}
              id="transaction-amount"
              type="text"
              inputMode="decimal"
              value={form.amountInput}
              onChange={(e) => setField('amountInput', e.target.value)}
              aria-required="true"
              aria-invalid={errors.amountInput !== undefined}
              aria-describedby={
                errors.amountInput !== undefined ? 'transaction-amount-error' : undefined
              }
              placeholder="Ex: 78,70"
              style={inputStyle()}
            />
          </Field>

          <Field id="transaction-direction" label="Direção" required error={errors.amount}>
            <select
              id="transaction-direction"
              value={form.direction}
              onChange={(e) => setField('direction', e.target.value as Direction)}
              aria-required="true"
              style={inputStyle()}
            >
              <option value="saida">Saída (despesa)</option>
              <option value="entrada">Entrada (receita)</option>
            </select>
          </Field>

          <Field id="transaction-category" label="Categoria" required error={errors.category}>
            <select
              id="transaction-category"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              aria-required="true"
              aria-invalid={errors.category !== undefined}
              aria-describedby={
                errors.category !== undefined ? 'transaction-category-error' : undefined
              }
              style={inputStyle()}
            >
              <option value="">— Escolhe categoria —</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="transaction-date" label="Data" required error={errors.date}>
            <input
              id="transaction-date"
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              aria-required="true"
              aria-invalid={errors.date !== undefined}
              aria-describedby={errors.date !== undefined ? 'transaction-date-error' : undefined}
              style={inputStyle()}
            />
          </Field>

          <Field
            id="transaction-description"
            label="Descrição"
            helper="Opcional"
            error={errors.description}
          >
            <textarea
              id="transaction-description"
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              aria-invalid={errors.description !== undefined}
              aria-describedby={
                errors.description !== undefined ? 'transaction-description-error' : undefined
              }
              placeholder="Ex: Compras no supermercado (opcional)"
              style={{ ...inputStyle(), resize: 'vertical', minHeight: 56, fontFamily: 'Inter, sans-serif' }}
            />
          </Field>

          <Field
            id="transaction-account"
            label="Conta"
            helper="Opcional"
            error={errors.accountId}
          >
            <select
              id="transaction-account"
              value={form.accountId}
              onChange={(e) => setField('accountId', e.target.value)}
              style={inputStyle()}
            >
              <option value="">— Nenhuma —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="transaction-card" label="Cartão" helper="Opcional" error={errors.cardId}>
            <select
              id="transaction-card"
              value={form.cardId}
              onChange={(e) => setField('cardId', e.target.value)}
              style={inputStyle()}
            >
              <option value="">— Nenhum —</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
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
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#04040A',
                background: '#00F5FF',
                border: 'none',
                borderRadius: 6,
                padding: '0.55rem 1.2rem',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {isCreate ? 'Criar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Field helper — label + helper + error message (padrão ProjectFormModal)
// ────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, helper, error, children }: FieldProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#8892A4',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: '#FF006E' }}>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {helper !== undefined && error === undefined && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.72rem',
            color: '#4A5568',
            fontStyle: 'italic',
          }}
        >
          {helper}
        </span>
      )}
      {error !== undefined && (
        <span
          id={`${id}-error`}
          role="alert"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#FF006E',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem',
    color: '#F0F4FF',
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    padding: '0.55rem 0.7rem',
    outline: 'none',
    width: '100%',
  };
}
