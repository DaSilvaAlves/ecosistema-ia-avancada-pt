'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ZodError } from 'zod';
import { HabitSchema } from '@/lib/db/schemas';
import type { Habit } from '@/types/db';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — HabitFormModal (Story 4.2 — AC5, FR24)
 *
 * Modal centrado glassmorphism para criar/editar um hábito. Replica o padrão
 * dos modais de finanças (`AccountFormModal`, Story 3.5): focus trap, Escape,
 * validação Zod em submit, `ZodError` mapeado para erros PT-PT por campo.
 * Usa o `FormField` partilhado (AC1) para todos os campos.
 *
 * Campos (AC5):
 *   - Nome (texto, obrigatório)
 *   - Frequência (RRULE em texto livre, obrigatório — ex.: `FREQ=DAILY`).
 *     A construção visual de RRULE é fora de scope ([AUTO-DECISION] A4).
 *   - Categoria (texto, obrigatório)
 *   - Horário (`time`, `HH:MM` 24h, opcional)
 *
 * Validação: `HabitSchema.partial().parse(patch)` em submit (T5) — valida só os
 * campos presentes mantendo as regras de cada um (nome não-vazio, RRULE
 * não-vazia, time HH:MM). O `id`/`createdAt`/`metric` não são editados aqui
 * (métricas são Story 4.4); o modal produz um `Partial<Habit>` e delega a
 * persistência ao parent via `onSubmit`.
 *
 * 3 estados de render (`react-component-test-criteria.md`): create vazio /
 * edit pré-preenchido / submissão com erros de validação.
 */

interface HabitFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Partial<Habit>;
  onClose: () => void;
  onSubmit: (input: Partial<Habit>) => Promise<void>;
}

type FormState = {
  name: string;
  frequency: string;
  category: string;
  time: string;
};

type FieldKey = 'name' | 'frequency' | 'category' | 'time';
type FieldErrors = Partial<Record<FieldKey, string>>;

export function HabitFormModal({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: HabitFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() => ({
    name: initialValue?.name ?? '',
    frequency: initialValue?.frequency ?? '',
    category: initialValue?.category ?? '',
    time: initialValue?.time ?? '',
  }));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'habit-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão AccountFormModal.
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
    setForm((prev) => ({ ...prev, [key]: value }));
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

    // Constrói o patch a validar. O schema valida `time` quando presente; uma
    // string vazia falharia o regex HH:MM, por isso "sem horário" é traduzido
    // para `undefined` (nunca string vazia, nunca `null` — o tipo é
    // `string | undefined`, coerente com `Habit.time?`).
    //
    // Defesa-em-profundidade (CR Iter 3): a chave `time` comporta-se de forma
    // diferente em create vs edit, para o modal nunca depender do parent corrigir
    // o patch (verificado contra o comportamento Dexie `update()`):
    //   - EDIT: a chave `time` está SEMPRE presente no patch (`undefined` quando
    //     limpa). Limpar o horário emite `time: undefined` — a Dexie remove a
    //     chave numa só escrita. Se a chave fosse omitida, a Dexie ignorá-la-ia
    //     e o `time` antigo persistiria (o bug do CR).
    //   - CREATE: a chave só entra quando há valor (não há registo prévio para
    //     limpar; omitir mantém o objecto novo enxuto).
    const time = form.time.trim();
    const patch: Partial<Habit> = {
      name: form.name.trim(),
      frequency: form.frequency.trim(),
      category: form.category.trim(),
    };
    if (isCreate) {
      if (time !== '') {
        patch.time = time;
      }
    } else {
      // Edit: chave sempre presente (`undefined` limpa o horário de facto).
      patch.time = time === '' ? undefined : time;
    }

    try {
      // Valida só os campos presentes mantendo as regras de cada um (T5).
      HabitSchema.partial().parse(patch);
      setSubmitting(true);
      await onSubmit(patch);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if (
            (field === 'name' ||
              field === 'frequency' ||
              field === 'category' ||
              field === 'time') &&
            !(field in fieldErrors)
          ) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      } else {
        // Erro do repo (não-Zod): o parent já o tratou (toast). Mantém o modal
        // aberto, com `submitting` a false, para tentar de novo.
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
        data-testid="habit-modal"
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
          {isCreate ? 'Novo hábito' : 'Editar hábito'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="habit-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="habit-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name !== undefined ? 'habit-name-error' : undefined}
              placeholder="Ex: Leitura diária"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField
            id="habit-frequency"
            label="Frequência (RRULE)"
            required
            helper="Ex: FREQ=DAILY ou FREQ=WEEKLY;BYDAY=MO,WE,FR"
            error={errors.frequency}
          >
            <input
              id="habit-frequency"
              type="text"
              value={form.frequency}
              onChange={(e) => setField('frequency', e.target.value)}
              aria-required="true"
              aria-invalid={errors.frequency !== undefined}
              aria-describedby={
                errors.frequency !== undefined ? 'habit-frequency-error' : undefined
              }
              placeholder="FREQ=DAILY"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField id="habit-category" label="Categoria" required error={errors.category}>
            <input
              id="habit-category"
              type="text"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              aria-required="true"
              aria-invalid={errors.category !== undefined}
              aria-describedby={
                errors.category !== undefined ? 'habit-category-error' : undefined
              }
              placeholder="Ex: Saúde"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField
            id="habit-time"
            label="Horário (opcional)"
            helper="Formato HH:MM (24h) — ex: 07:30"
            error={errors.time}
          >
            <input
              id="habit-time"
              type="text"
              inputMode="numeric"
              value={form.time}
              onChange={(e) => setField('time', e.target.value)}
              aria-invalid={errors.time !== undefined}
              aria-describedby={errors.time !== undefined ? 'habit-time-error' : undefined}
              placeholder="07:30"
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
