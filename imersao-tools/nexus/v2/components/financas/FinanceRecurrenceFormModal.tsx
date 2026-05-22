'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { FinanceRecurrenceSchema } from '@/lib/db/schemas';
import type { Account, Card, Category, FinanceRecurrence, Recurrence } from '@/types/db';
import {
  applyDirection,
  centsToInputValue,
  directionOf,
  parseCurrencyInput,
  type Direction,
} from '@/lib/financas/currencyInput';
import {
  RecurrenceFieldset,
  validateRecurrenceValue,
  type RecurrenceFieldValue,
} from '@/components/tarefas/RecurrenceFieldset';
import {
  buildRecurrenceConfig,
  buildRRule,
  type RecurrenceType,
} from '@/lib/shared/recurrence';

/**
 * Nexus v2 — FinanceRecurrenceFormModal (Story 3.4 — CRUD finanças recorrentes, FR17)
 *
 * Modal centrado glassmorphism com formulário criar/editar recorrência
 * financeira (renda, Netflix, seguros). Replica o padrão do
 * `TransactionFormModal` (Story 3.3): focus trap, validação Zod em submit,
 * `ZodError` mapeado para erros PT-PT por campo, acessibilidade WAI-ARIA.
 *
 * 7 campos (AC8): Valor (texto, euros PT-PT), Direção (Saída/Entrada), Categoria
 * (dropdown, obrigatório), Descrição (opcional), Conta e Cartão (dropdowns
 * opcionais), Recorrência (`RecurrenceFieldset` reutilizado da Story 2.7).
 *
 * O modal NÃO persiste — produz o template `FinanceRecurrence` (sem `id`/
 * `createdAt`) + a configuração de recorrência, e delega a persistência ao
 * parent via `onSubmit`. O parent (`/financas` page) orquestra a criação da
 * `Recurrence` + `FinanceRecurrence` + geração de transações (AC9/AC10).
 */

/** Configuração de recorrência produzida pelo modal — RRULE + datas. */
export interface FinanceRecurrenceSubmit {
  /** Template financeiro sem `id`/`createdAt`/`recurrenceId` (o parent preenche). */
  template: Omit<FinanceRecurrence, 'id' | 'createdAt' | 'recurrenceId'>;
  /** RRULE serializada (de `buildRRule`). */
  rule: string;
  /** Data de início ISO da recorrência. */
  startDate: string;
  /** Data de fim ISO da recorrência (ou `null`). */
  endDate: string | null;
}

interface FinanceRecurrenceFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: FinanceRecurrence & { recurrence: Recurrence };
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  onClose: () => void;
  onSubmit: (input: FinanceRecurrenceSubmit) => Promise<void>;
}

type FormState = {
  amountInput: string;
  direction: Direction;
  category: string;
  description: string;
  accountId: string; // '' = nenhuma conta
  cardId: string; // '' = nenhum cartão
};

type FieldErrors = Partial<
  Record<'amountInput' | 'category' | 'description' | 'recurrence', string>
>;

/**
 * Mapeia uma `Recurrence` persistida de volta para `RecurrenceFieldValue` (o
 * estado do `RecurrenceFieldset`). Lê o tipo/dia da RRULE serializada.
 */
function recurrenceToFieldValue(recurrence: Recurrence): RecurrenceFieldValue {
  const rule = recurrence.rule;
  const startDate = recurrence.startDate;
  const endDate = recurrence.endDate;

  // Extrai BYDAY / BYMONTHDAY da RRULE para reconstruir o tipo e o picker.
  const isWeekly = /FREQ=WEEKLY/.test(rule);
  const isMonthly = /FREQ=MONTHLY/.test(rule);
  const byDayMatch = rule.match(/BYDAY=([^;]+)/);
  const byMonthDayMatch = rule.match(/BYMONTHDAY=(\d+)/);

  if (isMonthly && byMonthDayMatch) {
    return {
      type: 'monthly',
      startDate,
      endDate,
      monthday: Number(byMonthDayMatch[1]),
    };
  }
  if (isWeekly && byDayMatch) {
    const days = byDayMatch[1].split(',');
    // weekdays = Seg-Sex (5 dias), weekends = Sáb+Dom (2 dias).
    if (days.length === 5) return { type: 'weekdays', startDate, endDate };
    if (days.length === 2 && days.includes('SA') && days.includes('SU')) {
      return { type: 'weekends', startDate, endDate };
    }
    // weekly de um único dia — mapeia o token RRULE para 0=Seg..6=Dom.
    const TOKEN_TO_WEEKDAY: Record<string, number> = {
      MO: 0,
      TU: 1,
      WE: 2,
      TH: 3,
      FR: 4,
      SA: 5,
      SU: 6,
    };
    return {
      type: 'weekly',
      startDate,
      endDate,
      weekday: TOKEN_TO_WEEKDAY[days[0]] ?? 0,
    };
  }
  // Default: diária.
  return { type: 'daily', startDate, endDate };
}

export function FinanceRecurrenceFormModal({
  mode,
  initialValue,
  categories,
  accounts,
  cards,
  onClose,
  onSubmit,
}: FinanceRecurrenceFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() =>
    initialValue
      ? {
          amountInput: centsToInputValue(Math.abs(initialValue.amount)),
          direction: directionOf(initialValue.amount),
          category: initialValue.category,
          description: initialValue.description,
          accountId: initialValue.accountId ?? '',
          cardId: initialValue.cardId ?? '',
        }
      : {
          amountInput: '',
          direction: 'saida',
          category: '',
          description: '',
          accountId: '',
          cardId: '',
        },
  );

  const [recurrence, setRecurrence] = useState<RecurrenceFieldValue | null>(() =>
    initialValue ? recurrenceToFieldValue(initialValue.recurrence) : null,
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'finance-recurrence-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão TransactionFormModal.
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

  function handleRecurrenceChange(value: RecurrenceFieldValue | null): void {
    setRecurrence(value);
    if (errors.recurrence) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.recurrence;
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

    // 2. Validar a recorrência — é obrigatória para uma recorrência financeira.
    if (recurrence === null) {
      setErrors({ recurrence: 'Define a recorrência (activa "Tarefa recorrente").' });
      return;
    }
    const recurrenceError = validateRecurrenceValue(recurrence);
    if (recurrenceError !== null) {
      setErrors({ recurrence: recurrenceError });
      return;
    }

    // 3. Construir a RRULE a partir da configuração do RecurrenceFieldset.
    let rule: string;
    try {
      const config = buildRecurrenceConfig(recurrence.type as RecurrenceType, {
        startDate: recurrence.startDate,
        endDate: recurrence.endDate ?? null,
        weekday: recurrence.weekday,
        monthday: recurrence.monthday,
      });
      rule = buildRRule(config).toString();
    } catch (err) {
      setErrors({
        recurrence: err instanceof Error ? err.message : 'Recorrência inválida.',
      });
      return;
    }

    // 4. Validar o template financeiro com o schema Zod (sem id/createdAt/
    //    recurrenceId — esses são preenchidos pelo parent na persistência).
    const template: Omit<FinanceRecurrence, 'id' | 'createdAt' | 'recurrenceId'> = {
      amount,
      category: form.category,
      description: form.description.trim(),
      accountId: form.accountId === '' ? null : form.accountId,
      cardId: form.cardId === '' ? null : form.cardId,
    };

    // Validação parcial: o schema completo exige id/createdAt/recurrenceId;
    // aqui validamos apenas os campos que o modal produz.
    try {
      FinanceRecurrenceSchema.partial().parse(template);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (field === 'amount' && !('amountInput' in fieldErrors)) {
            fieldErrors.amountInput = issue.message;
          } else if (field === 'category' && !('category' in fieldErrors)) {
            fieldErrors.category = issue.message;
          } else if (field === 'description' && !('description' in fieldErrors)) {
            fieldErrors.description = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }
      throw err;
    }

    // 5. Delegar a persistência ao parent.
    try {
      setSubmitting(true);
      await onSubmit({
        template,
        rule,
        startDate: recurrence.startDate,
        endDate: recurrence.endDate ?? null,
      });
      onClose();
    } catch {
      // Erro do repo: o parent (`financas/page.tsx`) já o tratou (console.error
      // + toast). `return` mantém o modal aberto, com `submitting` a `false`,
      // para o utilizador tentar de novo. Não reescapamos: num handler `async`
      // o `throw` viraria uma promise rejeitada não tratada.
      setSubmitting(false);
      return;
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
        data-testid="finance-recurrence-modal"
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
          {isCreate ? 'Nova recorrência' : 'Editar recorrência'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field id="finance-recurrence-amount" label="Valor (€)" required error={errors.amountInput}>
            <input
              ref={firstInputRef}
              id="finance-recurrence-amount"
              type="text"
              inputMode="decimal"
              value={form.amountInput}
              onChange={(e) => setField('amountInput', e.target.value)}
              aria-required="true"
              aria-invalid={errors.amountInput !== undefined}
              aria-describedby={
                errors.amountInput !== undefined
                  ? 'finance-recurrence-amount-error'
                  : undefined
              }
              placeholder="Ex: 650,00"
              style={inputStyle()}
            />
          </Field>

          <Field id="finance-recurrence-direction" label="Direção" required>
            <select
              id="finance-recurrence-direction"
              value={form.direction}
              onChange={(e) => setField('direction', e.target.value as Direction)}
              aria-required="true"
              style={inputStyle()}
            >
              <option value="saida">Saída (despesa)</option>
              <option value="entrada">Entrada (receita)</option>
            </select>
          </Field>

          <Field
            id="finance-recurrence-category"
            label="Categoria"
            required
            error={errors.category}
          >
            <select
              id="finance-recurrence-category"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              aria-required="true"
              aria-invalid={errors.category !== undefined}
              aria-describedby={
                errors.category !== undefined
                  ? 'finance-recurrence-category-error'
                  : undefined
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

          <Field
            id="finance-recurrence-description"
            label="Descrição"
            helper="Opcional"
            error={errors.description}
          >
            <textarea
              id="finance-recurrence-description"
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              aria-invalid={errors.description !== undefined}
              aria-describedby={
                errors.description !== undefined
                  ? 'finance-recurrence-description-error'
                  : undefined
              }
              placeholder="Ex: Renda do apartamento (opcional)"
              style={{
                ...inputStyle(),
                resize: 'vertical',
                minHeight: 56,
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </Field>

          <Field id="finance-recurrence-account" label="Conta" helper="Opcional">
            <select
              id="finance-recurrence-account"
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

          <Field id="finance-recurrence-card" label="Cartão" helper="Opcional">
            <select
              id="finance-recurrence-card"
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

          <RecurrenceFieldset value={recurrence} onChange={handleRecurrenceChange} />
          {errors.recurrence !== undefined && (
            <span
              role="alert"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#FF006E',
              }}
            >
              {errors.recurrence}
            </span>
          )}

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
// Field helper — label + helper + error message (padrão TransactionFormModal)
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
