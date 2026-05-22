'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { InstallmentSchema } from '@/lib/db/schemas';
import type { Card, Category, Installment } from '@/types/db';
import { parseCurrencyInput } from '@/lib/financas/currencyInput';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import { splitInstallmentAmount } from '@/lib/financas/installmentSplit';

/**
 * Nexus v2 — InstallmentFormModal (Story 3.6 — Compras parceladas, FR19)
 *
 * Modal centrado glassmorphism com formulário criar uma compra parcelada.
 * Apenas modo `create` — a Story 3.6 NÃO suporta edição (AUTO-DECISION A6:
 * editar `totalAmount`/`installments`/`startDate` de uma parcelada já com as
 * N transações geradas desincronizaria os dados; para alterar, apagar e
 * recriar).
 *
 * Padrão herdado de `CardFormModal` (Story 3.5): focus trap, `ZodError`
 * mapeado para PT-PT por campo, WAI-ARIA Modal Authoring Practices.
 *
 * 6 campos (AC4): Cartão (dropdown obrigatório — FK non-nullable), Descrição
 * (texto), Categoria (dropdown — estampada nas transações, AUTO-DECISION A5),
 * Valor total (euros PT-PT), Número de prestações (inteiro >= 2), Data de
 * início (date).
 *
 * Preview em vivo (AC4): mostra "N× de €X,XX" abaixo dos campos. Se a divisão
 * não for exacta, indica explicitamente a primeira parcela.
 *
 * O modal NÃO persiste — produz um `InstallmentSubmit = { installment, category }`
 * e delega a persistência atómica ao parent (AC6). A page só abre este modal
 * quando existe pelo menos um cartão (AC7) — uma parcelada exige um cartão.
 */

/** Payload do submit: `Installment` completo + categoria (não vive no `Installment`). */
export interface InstallmentSubmit {
  installment: Installment;
  category: string;
}

interface InstallmentFormModalProps {
  cards: Card[];
  categories: Category[];
  onClose: () => void;
  onSubmit: (input: InstallmentSubmit) => Promise<void>;
}

type FormState = {
  cardId: string; // '' = não escolhido
  description: string;
  category: string; // '' = não escolhida
  totalInput: string; // string euros PT-PT
  installmentsInput: string; // string do número inteiro
  startDate: string; // ISO YYYY-MM-DD
};

type FieldErrors = Partial<
  Record<
    | 'cardId'
    | 'description'
    | 'category'
    | 'totalInput'
    | 'totalAmount'
    | 'installmentsInput'
    | 'installments'
    | 'startDate',
    string
  >
>;

/** Número mínimo de prestações no modal — uma "parcelada" de 1× é uma transação simples. */
const MIN_INSTALLMENTS = 2;

export function InstallmentFormModal({
  cards,
  categories,
  onClose,
  onSubmit,
}: InstallmentFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    cardId: '',
    description: '',
    category: '',
    totalInput: '',
    installmentsInput: '',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);
  const titleId = 'installments-modal-title';

  // Focus trap + Escape — padrão CardFormModal.
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
    // Editar um campo limpa os erros de parsing E de validação Zod
    // associados (padrão `CardFormModal`: `errors.totalInput ?? errors.totalAmount`).
    const errorKeys: (keyof FieldErrors)[] = (() => {
      if (key === 'totalInput') return ['totalInput', 'totalAmount'];
      if (key === 'installmentsInput') return ['installmentsInput', 'installments'];
      return [key as keyof FieldErrors];
    })();
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

  // ── Preview em vivo das parcelas (AC4) ───────────────────────────────────
  const preview = useMemo<{ text: string; warning: boolean } | null>(() => {
    let total: number;
    let n: number;
    try {
      total = parseCurrencyInput(form.totalInput);
      n = Number(form.installmentsInput);
    } catch {
      return null;
    }
    if (!Number.isInteger(n) || n < MIN_INSTALLMENTS) return null;
    let parcels: number[];
    try {
      parcels = splitInstallmentAmount(total, n);
    } catch {
      return null;
    }
    const first = parcels[0];
    const last = parcels[parcels.length - 1];
    if (first === last) {
      return { text: `${n}× de ${formatCurrency(first)}`, warning: false };
    }
    return {
      text: `${n}× de ${formatCurrency(last)} (a primeira: ${formatCurrency(first)})`,
      warning: true,
    };
  }, [form.totalInput, form.installmentsInput]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    // 1. Pré-validar campos obrigatórios — mensagens PT-PT amigáveis (as
    //    mensagens Zod cruas para um dropdown vazio são pouco claras).
    const fieldErrors: FieldErrors = {};
    if (form.cardId === '') fieldErrors.cardId = 'Cartão é obrigatório';
    if (form.description.trim() === '')
      fieldErrors.description = 'Descrição é obrigatória';
    if (form.category === '') fieldErrors.category = 'Categoria é obrigatória';
    if (form.startDate === '')
      fieldErrors.startDate = 'Data de início é obrigatória';

    // 2. Converter o valor total (magnitude não-negativa em cêntimos).
    let totalAmount = 0;
    try {
      totalAmount = parseCurrencyInput(form.totalInput);
    } catch (err) {
      fieldErrors.totalInput =
        err instanceof Error ? err.message : 'Valor total inválido.';
    }

    // 3. Converter o número de prestações.
    const installments = Number(form.installmentsInput);
    if (
      form.installmentsInput.trim() === '' ||
      !Number.isInteger(installments) ||
      installments < MIN_INSTALLMENTS
    ) {
      fieldErrors.installmentsInput = `Número de prestações deve ser um inteiro >= ${MIN_INSTALLMENTS}.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    // 4. Construir o `Installment` completo (`id` gerado em modo create —
    //    a Story 3.6 não suporta edição). `Installment` não tem `createdAt`.
    const candidate: Installment = {
      id: crypto.randomUUID(),
      cardId: form.cardId,
      totalAmount,
      installments,
      startDate: form.startDate,
      description: form.description.trim(),
    };

    try {
      const parsed = InstallmentSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit({ installment: parsed, category: form.category });
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const zodErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (
            (field === 'cardId' ||
              field === 'description' ||
              field === 'totalAmount' ||
              field === 'installments' ||
              field === 'startDate') &&
            !(field in zodErrors)
          ) {
            zodErrors[field] = issue.message;
          }
        }
        setErrors(zodErrors);
      } else {
        // Erro do repo / da transacção atómica (não-Zod): o parent já o tratou
        // (toast). `return` mantém o modal aberto para nova tentativa.
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
        data-testid="installments-modal"
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
          Nova compra parcelada
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <Field id="installment-card" label="Cartão" required error={errors.cardId}>
            <select
              ref={firstInputRef}
              id="installment-card"
              value={form.cardId}
              onChange={(e) => setField('cardId', e.target.value)}
              aria-required="true"
              aria-invalid={errors.cardId !== undefined}
              aria-describedby={
                errors.cardId !== undefined ? 'installment-card-error' : undefined
              }
              style={inputStyle()}
            >
              <option value="">— Escolhe cartão —</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="installment-description"
            label="Descrição"
            required
            error={errors.description}
          >
            <input
              id="installment-description"
              type="text"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              aria-required="true"
              aria-invalid={errors.description !== undefined}
              aria-describedby={
                errors.description !== undefined
                  ? 'installment-description-error'
                  : undefined
              }
              placeholder="Ex: Portátil"
              style={inputStyle()}
            />
          </Field>

          <Field
            id="installment-category"
            label="Categoria"
            required
            error={errors.category}
          >
            <select
              id="installment-category"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              aria-required="true"
              aria-invalid={errors.category !== undefined}
              aria-describedby={
                errors.category !== undefined
                  ? 'installment-category-error'
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
            id="installment-total"
            label="Valor total (€)"
            required
            error={errors.totalInput ?? errors.totalAmount}
          >
            <input
              id="installment-total"
              type="text"
              inputMode="decimal"
              value={form.totalInput}
              onChange={(e) => setField('totalInput', e.target.value)}
              aria-required="true"
              aria-invalid={
                errors.totalInput !== undefined || errors.totalAmount !== undefined
              }
              aria-describedby={
                errors.totalInput !== undefined || errors.totalAmount !== undefined
                  ? 'installment-total-error'
                  : undefined
              }
              placeholder="Ex: 1.200,00"
              style={inputStyle()}
            />
          </Field>

          <Field
            id="installment-count"
            label="Número de prestações"
            required
            helper={`Inteiro >= ${MIN_INSTALLMENTS}`}
            error={errors.installmentsInput ?? errors.installments}
          >
            <input
              id="installment-count"
              type="number"
              min={MIN_INSTALLMENTS}
              step={1}
              value={form.installmentsInput}
              onChange={(e) => setField('installmentsInput', e.target.value)}
              aria-required="true"
              aria-invalid={
                errors.installmentsInput !== undefined ||
                errors.installments !== undefined
              }
              aria-describedby={
                errors.installmentsInput !== undefined ||
                errors.installments !== undefined
                  ? 'installment-count-error'
                  : undefined
              }
              placeholder="Ex: 12"
              style={inputStyle()}
            />
          </Field>

          <Field
            id="installment-start"
            label="Data de início"
            required
            error={errors.startDate}
          >
            <input
              id="installment-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              aria-required="true"
              aria-invalid={errors.startDate !== undefined}
              aria-describedby={
                errors.startDate !== undefined ? 'installment-start-error' : undefined
              }
              style={inputStyle()}
            />
          </Field>

          {preview !== null && (
            <div
              role="status"
              aria-live="polite"
              data-testid="installments-preview"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: preview.warning ? '#FFB800' : '#00F5FF',
                background: preview.warning
                  ? 'rgba(255, 184, 0, 0.08)'
                  : 'rgba(0, 245, 255, 0.08)',
                border: `1px solid ${
                  preview.warning ? 'rgba(255, 184, 0, 0.2)' : 'rgba(0, 245, 255, 0.2)'
                }`,
                borderRadius: 8,
                padding: '0.6rem 0.8rem',
              }}
            >
              {preview.text}
            </div>
          )}

          <div
            style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}
          >
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
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Field helper — padrão `CardFormModal` (Story 3.5)
// ────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({
  id,
  label,
  required,
  helper,
  error,
  children,
}: FieldProps): React.ReactElement {
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
