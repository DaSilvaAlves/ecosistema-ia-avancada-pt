'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { AccountSchema, type AccountType } from '@/lib/db/schemas';
import type { Account } from '@/types/db';
import { balanceToInput, parseBalanceInput } from '@/lib/financas/balanceInput';

/**
 * Nexus v2 — AccountFormModal (Story 3.5 — CRUD contas bancárias, FR18)
 *
 * Modal centrado glassmorphism com formulário criar/editar conta bancária.
 * Replica o padrão do `TransactionFormModal` (Story 3.3): focus trap,
 * validação `AccountSchema.parse()` em submit, `ZodError` mapeado para erros
 * PT-PT por campo, acessibilidade WAI-ARIA Modal Authoring Practices.
 *
 * 3 campos (AC2): Nome (texto), Tipo (dropdown — conta à ordem/poupança/
 * dinheiro), Saldo (magnitude em euros PT-PT + seletor de sinal). O saldo
 * pode ser negativo — uma conta à ordem pode estar a descoberto;
 * `Account.balance` aceita sinal livre. A magnitude e o seletor compõem o
 * sinal via `parseBalanceInput` (Story 3.5).
 *
 * O modal NÃO persiste — produz o objecto `Account` completo (`id`/`createdAt`
 * gerados em modo create, preservados em modo edit) e delega a persistência
 * ao parent via `onSubmit`.
 */

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Conta à ordem' },
  { value: 'savings', label: 'Poupança' },
  { value: 'cash', label: 'Dinheiro' },
];

interface AccountFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Account;
  onClose: () => void;
  onSubmit: (input: Account) => Promise<void>;
}

type FormState = {
  name: string;
  type: AccountType;
  balanceInput: string;
  negative: boolean;
};

type FieldErrors = Partial<Record<'name' | 'type' | 'balanceInput' | 'balance', string>>;

export function AccountFormModal({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: AccountFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() => {
    if (initialValue) {
      const { magnitude, negative } = balanceToInput(initialValue.balance);
      return {
        name: initialValue.name,
        type: initialValue.type,
        balanceInput: magnitude,
        negative,
      };
    }
    return { name: '', type: 'checking', balanceInput: '', negative: false };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'accounts-modal-title';
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
    const errorKey: keyof FieldErrors = key === 'balanceInput' ? 'balanceInput' : (key as keyof FieldErrors);
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

    // 1. Converter a magnitude digitada (euros PT-PT) + sinal em cêntimos.
    let balance: number;
    try {
      balance = parseBalanceInput(form.balanceInput, form.negative);
    } catch (err) {
      setErrors({ balanceInput: err instanceof Error ? err.message : 'Saldo inválido.' });
      return;
    }

    // 2. Construir o objecto Account completo. `id`/`createdAt` são gerados em
    //    modo create e preservados em modo edit (AC3).
    const candidate: Account = {
      id: initialValue?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      balance,
      createdAt: initialValue?.createdAt ?? Date.now(),
    };

    try {
      const parsed = AccountSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (
            (field === 'name' || field === 'type' || field === 'balance') &&
            !(field in fieldErrors)
          ) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      } else {
        // Erro do repo (não-Zod): o parent (`financas/page.tsx`) já o tratou —
        // `console.error` + toast. `return` mantém o modal aberto, com
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
        data-testid="accounts-modal"
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
          {isCreate ? 'Nova conta' : 'Editar conta'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field id="account-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="account-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name !== undefined ? 'account-name-error' : undefined}
              placeholder="Ex: Millennium à ordem"
              style={inputStyle()}
            />
          </Field>

          <Field id="account-type" label="Tipo" required error={errors.type}>
            <select
              id="account-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value as AccountType)}
              aria-required="true"
              style={inputStyle()}
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="account-balance" label="Saldo (€)" required error={errors.balanceInput ?? errors.balance}>
            <input
              id="account-balance"
              type="text"
              inputMode="decimal"
              value={form.balanceInput}
              onChange={(e) => setField('balanceInput', e.target.value)}
              aria-required="true"
              aria-invalid={errors.balanceInput !== undefined || errors.balance !== undefined}
              aria-describedby={
                errors.balanceInput !== undefined || errors.balance !== undefined
                  ? 'account-balance-error'
                  : undefined
              }
              placeholder="Ex: 1.250,00"
              style={inputStyle()}
            />
          </Field>

          <Field id="account-sign" label="Sinal do saldo" required>
            <select
              id="account-sign"
              value={form.negative ? 'descoberto' : 'favor'}
              onChange={(e) => setField('negative', e.target.value === 'descoberto')}
              aria-required="true"
              style={inputStyle()}
            >
              <option value="favor">A favor (saldo positivo)</option>
              <option value="descoberto">A descoberto (saldo negativo)</option>
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
