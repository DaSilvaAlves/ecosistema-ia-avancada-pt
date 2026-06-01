'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { ReminderSchema } from '@/lib/db/schemas';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — ReminderFormModal (Story 4.6 — AC1, FR33)
 *
 * Modal centrado glassmorphism para criar/editar um lembrete. Replica o padrão
 * do `HabitFormModal` (Story 4.2): focus trap, Escape, validação Zod em submit,
 * `ZodError` mapeado para erros PT-PT por campo. Usa o `FormField` partilhado
 * (AC1 da 4.2) para todos os campos.
 *
 * Campos (AC1):
 *   - Texto (`text`, obrigatório, min 1 char).
 *   - Data/hora (`fireAt`, obrigatório — input `datetime-local`, convertido
 *     para epoch ms em submit via `new Date(value).getTime()`).
 *   - Recorrência RRULE (string livre opcional — ex.: `FREQ=DAILY`). A
 *     construção visual de RRULE é fora de scope; o motor de geração de
 *     instâncias é a Story 4.8 ([AUTO-DECISION] A2).
 *
 * O modal NÃO persiste — produz o input do lembrete (texto, fireAt, RRULE) e
 * delega a criação da `Recurrence` + `Reminder` ao parent via `onSubmit`. O
 * `id`/`channels`/`status`/`recurrenceId` são geridos pela página (handler de
 * criação — AC3). Aqui só validamos `text` + `fireAt` contra o `ReminderSchema`.
 *
 * 3 estados de render (`react-component-test-criteria.md`): create vazio /
 * edit pré-preenchido / submissão com erros de validação.
 */

/**
 * Input que o modal entrega ao parent. `fireAt` já convertido para epoch ms;
 * `rrule` é a string RRULE em bruto (vazia = sem recorrência). O parent decide
 * se cria a `Recurrence` (AC3). O `text`/`fireAt` são os campos do `Reminder`
 * editáveis aqui.
 */
export interface ReminderFormSubmit {
  text: string;
  fireAt: number;
  /** RRULE em bruto; string vazia = sem recorrência. */
  rrule: string;
}

interface ReminderFormModalProps {
  mode: 'create' | 'edit';
  /**
   * Valor inicial em modo `edit`. `fireAt` em epoch ms (convertido para o input
   * `datetime-local` internamente); `rrule` é a RRULE já resolvida pelo parent
   * (lida da `Recurrence` associada), string vazia quando não-recorrente.
   */
  initialValue?: { text?: string; fireAt?: number; rrule?: string };
  onClose: () => void;
  onSubmit: (input: ReminderFormSubmit) => Promise<void>;
}

type FieldKey = 'text' | 'fireAt' | 'rrule';
type FieldErrors = Partial<Record<FieldKey, string>>;

type FormState = {
  text: string;
  /** Valor do `<input type="datetime-local">` (`YYYY-MM-DDTHH:MM`), '' quando vazio. */
  fireAtLocal: string;
  rrule: string;
};

/**
 * Converte epoch ms → string `datetime-local` (`YYYY-MM-DDTHH:MM`) em hora
 * local. Inverso de `new Date(value).getTime()`. Subtrai o offset de fuso para
 * que `toISOString().slice(0,16)` reflicta a hora local que o utilizador vê.
 */
function epochToLocalInput(epochMs: number): string {
  const d = new Date(epochMs);
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(epochMs - tzOffsetMs).toISOString().slice(0, 16);
}

export function ReminderFormModal({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: ReminderFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() => ({
    text: initialValue?.text ?? '',
    fireAtLocal:
      initialValue?.fireAt !== undefined
        ? epochToLocalInput(initialValue.fireAt)
        : '',
    rrule: initialValue?.rrule ?? '',
  }));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'reminder-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão HabitFormModal.
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

  function setField(key: FieldKey, value: string): void {
    const stateKey = key === 'fireAt' ? 'fireAtLocal' : key;
    setForm((prev) => ({ ...prev, [stateKey]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const text = form.text.trim();
    const rrule = form.rrule.trim();
    const fireAtLocal = form.fireAtLocal.trim();

    // Converte `datetime-local` → epoch ms. Um valor vazio ou inválido dá `NaN`,
    // que o `ReminderSchema.fireAt` rejeita (epoch ms positivo) — mensagem PT-PT
    // própria para o caso de campo vazio (mais clara que o erro genérico Zod).
    const fireAt = fireAtLocal === '' ? NaN : new Date(fireAtLocal).getTime();
    if (fireAtLocal === '' || Number.isNaN(fireAt)) {
      setErrors({ fireAt: 'Data/hora é obrigatória' });
      firstInputRef.current?.focus();
      return;
    }

    // Valida text + fireAt contra o ReminderSchema (campos editáveis aqui). O
    // `rrule` é string opaca nesta story (o parser `rrule` é a 4.8) — não
    // validado contra um parser externo (AC8 / external-contract-identifiers).
    try {
      ReminderSchema.partial().parse({ text, fireAt });
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (
            (field === 'text' || field === 'fireAt') &&
            !(field in fieldErrors)
          ) {
            fieldErrors[field as FieldKey] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ text, fireAt, rrule });
      onClose();
    } catch {
      // Erro do repo (não-Zod): o parent já o tratou (toast). Mantém o modal
      // aberto, com `submitting` a false, para tentar de novo.
      setSubmitting(false);
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
        data-testid="reminder-modal"
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
          {isCreate ? 'Novo lembrete' : 'Editar lembrete'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="reminder-text" label="Texto" required error={errors.text}>
            <input
              ref={firstInputRef}
              id="reminder-text"
              type="text"
              value={form.text}
              onChange={(e) => setField('text', e.target.value)}
              aria-required="true"
              aria-invalid={errors.text !== undefined}
              aria-describedby={errors.text !== undefined ? 'reminder-text-error' : undefined}
              placeholder="Ex: Pagar a renda"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField
            id="reminder-fireAt"
            label="Data/hora"
            required
            helper="Quando o lembrete deve disparar"
            error={errors.fireAt}
          >
            <input
              id="reminder-fireAt"
              type="datetime-local"
              value={form.fireAtLocal}
              onChange={(e) => setField('fireAt', e.target.value)}
              aria-required="true"
              aria-invalid={errors.fireAt !== undefined}
              aria-describedby={
                errors.fireAt !== undefined ? 'reminder-fireAt-error' : undefined
              }
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField
            id="reminder-rrule"
            label="Recorrência (RRULE, opcional)"
            helper="Ex: FREQ=DAILY ou FREQ=WEEKLY;BYDAY=MO,WE,FR — vazio = sem recorrência"
            error={errors.rrule}
          >
            <input
              id="reminder-rrule"
              type="text"
              value={form.rrule}
              onChange={(e) => setField('rrule', e.target.value)}
              aria-invalid={errors.rrule !== undefined}
              aria-describedby={errors.rrule !== undefined ? 'reminder-rrule-error' : undefined}
              placeholder="FREQ=DAILY"
              style={fieldInputStyle()}
            />
          </FormField>

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
              {isCreate ? 'Criar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
