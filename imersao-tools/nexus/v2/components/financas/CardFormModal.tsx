'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { CardSchema } from '@/lib/db/schemas';
import type { Account, Card } from '@/types/db';
import { centsToInputValue } from '@/lib/financas/currencyInput';
import { parseCardLimit } from '@/lib/financas/balanceInput';

/**
 * Nexus v2 — CardFormModal (Story 3.5 — CRUD cartões de crédito, FR18)
 *
 * Modal centrado glassmorphism com formulário criar/editar cartão de crédito.
 * Replica o padrão do `TransactionFormModal` (Story 3.3): focus trap,
 * validação `CardSchema.parse()` em submit, `ZodError` mapeado para erros
 * PT-PT por campo, acessibilidade WAI-ARIA Modal Authoring Practices.
 *
 * 5 campos (AC4): Nome (texto), Conta (dropdown — obrigatório, FK
 * non-nullable), Dia de fecho e Dia de vencimento (dropdowns 1-31 com
 * placeholder não-seleccionável), Limite (euros PT-PT, opcional → `null`).
 *
 * O modal NÃO persiste — produz o objecto `Card` completo (`id` gerado em
 * modo create, preservado em modo edit) e delega a persistência ao parent
 * via `onSubmit`. A page só abre este modal quando existe pelo menos uma
 * conta (AC5) — um cartão exige uma conta.
 */

/** Dias 1..31 para os dropdowns de fecho/vencimento. */
const DAY_OPTIONS: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

interface CardFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Card;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (input: Card) => Promise<void>;
}

type FormState = {
  name: string;
  accountId: string; // '' = não escolhida
  closingDay: string; // '' = não escolhido
  dueDay: string; // '' = não escolhido
  limitInput: string; // '' = sem limite (null)
};

type FieldErrors = Partial<
  Record<'name' | 'accountId' | 'closingDay' | 'dueDay' | 'limitInput' | 'limit', string>
>;

export function CardFormModal({
  mode,
  initialValue,
  accounts,
  onClose,
  onSubmit,
}: CardFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() =>
    initialValue
      ? {
          name: initialValue.name,
          accountId: initialValue.accountId,
          closingDay: String(initialValue.closingDay),
          dueDay: String(initialValue.dueDay),
          limitInput:
            initialValue.limit === null ? '' : centsToInputValue(initialValue.limit),
        }
      : { name: '', accountId: '', closingDay: '', dueDay: '', limitInput: '' },
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'cards-modal-title';
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
    // Editar `limitInput` deve limpar tanto o erro de parsing (`limitInput`)
    // como o erro de validação Zod (`limit`) — ambos são mostrados no mesmo
    // campo via `errors.limitInput ?? errors.limit`; deixar o erro Zod stale
    // mantinha uma mensagem desactualizada visível enquanto o utilizador corrige.
    const errorKeys: (keyof FieldErrors)[] =
      key === 'limitInput' ? ['limitInput', 'limit'] : [key as keyof FieldErrors];
    if (errorKeys.some((errorKey) => errors[errorKey])) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const errorKey of errorKeys) {
          delete next[errorKey];
        }
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    // 1. Pré-validar selecções obrigatórias — as mensagens Zod cruas para um
    //    dropdown vazio ("deve ser inteiro" / "UUID válido") não são amigáveis.
    const fieldErrors: FieldErrors = {};
    if (form.accountId === '') fieldErrors.accountId = 'Conta é obrigatória';
    if (form.closingDay === '') fieldErrors.closingDay = 'Dia de fecho é obrigatório';
    if (form.dueDay === '') fieldErrors.dueDay = 'Dia de vencimento é obrigatório';

    // 2. Converter o limite (vazio → null).
    let limit: number | null = null;
    try {
      limit = parseCardLimit(form.limitInput);
    } catch (err) {
      fieldErrors.limitInput = err instanceof Error ? err.message : 'Limite inválido.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    // 3. Construir o objecto Card completo. `id` é gerado em modo create e
    //    preservado em modo edit (AC5). `Card` não tem `createdAt`.
    const candidate: Card = {
      id: initialValue?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      accountId: form.accountId,
      closingDay: Number(form.closingDay),
      dueDay: Number(form.dueDay),
      limit,
    };

    try {
      const parsed = CardSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const zodErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (
            (field === 'name' ||
              field === 'accountId' ||
              field === 'closingDay' ||
              field === 'dueDay' ||
              field === 'limit') &&
            !(field in zodErrors)
          ) {
            zodErrors[field] = issue.message;
          }
        }
        setErrors(zodErrors);
      } else {
        // Erro do repo (não-Zod): o parent já o tratou (toast). `return`
        // mantém o modal aberto para nova tentativa.
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
        data-testid="cards-modal"
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
          {isCreate ? 'Novo cartão' : 'Editar cartão'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field id="card-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="card-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name !== undefined ? 'card-name-error' : undefined}
              placeholder="Ex: Millennium Gold"
              style={inputStyle()}
            />
          </Field>

          <Field id="card-account" label="Conta" required error={errors.accountId}>
            <select
              id="card-account"
              value={form.accountId}
              onChange={(e) => setField('accountId', e.target.value)}
              aria-required="true"
              aria-invalid={errors.accountId !== undefined}
              aria-describedby={errors.accountId !== undefined ? 'card-account-error' : undefined}
              style={inputStyle()}
            >
              <option value="">— Escolhe conta —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="card-closing-day" label="Dia de fecho da fatura" required error={errors.closingDay}>
            <select
              id="card-closing-day"
              value={form.closingDay}
              onChange={(e) => setField('closingDay', e.target.value)}
              aria-required="true"
              aria-invalid={errors.closingDay !== undefined}
              aria-describedby={errors.closingDay !== undefined ? 'card-closing-day-error' : undefined}
              style={inputStyle()}
            >
              <option value="">— Selecciona —</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field id="card-due-day" label="Dia de vencimento" required error={errors.dueDay}>
            <select
              id="card-due-day"
              value={form.dueDay}
              onChange={(e) => setField('dueDay', e.target.value)}
              aria-required="true"
              aria-invalid={errors.dueDay !== undefined}
              aria-describedby={errors.dueDay !== undefined ? 'card-due-day-error' : undefined}
              style={inputStyle()}
            >
              <option value="">— Selecciona —</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="card-limit"
            label="Limite (€)"
            helper="Opcional — deixa vazio se o cartão não tiver limite"
            error={errors.limitInput ?? errors.limit}
          >
            <input
              id="card-limit"
              type="text"
              inputMode="decimal"
              value={form.limitInput}
              onChange={(e) => setField('limitInput', e.target.value)}
              aria-invalid={errors.limitInput !== undefined || errors.limit !== undefined}
              aria-describedby={
                errors.limitInput !== undefined || errors.limit !== undefined
                  ? 'card-limit-error'
                  : undefined
              }
              placeholder="Ex: 2.500,00"
              style={inputStyle()}
            />
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
