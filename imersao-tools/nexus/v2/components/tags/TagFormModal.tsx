'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ZodError } from 'zod';
import { TagSchema } from '@/lib/db/schemas';
import type { Tag } from '@/types/db';
import { TAG_PALETTE, DEFAULT_TAG_COLOR } from '@/lib/tags/colors';

/**
 * Nexus v2 — TagFormModal (Story 2.6 / AC9 + A3 + A4)
 *
 * Modal centrado glassmorphism com formulário criar/editar tag.
 * Reaproveita 100% o padrão de `ProjectFormModal.tsx` da Story 2.8:
 *   - role="dialog" + aria-modal="true" + aria-labelledby
 *   - Focus trap: primeiro input focado na abertura; Tab/Shift+Tab ciclam.
 *   - Escape fecha; click no overlay fecha; foco restaurado no opener pelo parent.
 *   - Validação Zod no submit; ZodError mapeado para erros PT-PT por campo.
 *
 * Campos:
 *   - `name` (required, text) — duplicado case-insensitive rejeitado pelo repo.
 *   - `color` (required, radio group restrito à `TAG_PALETTE`) — A4: paleta
 *     de 7 cores do design system. Arrow keys ←/→/↑/↓ navegam.
 *
 * Erro do repo (duplicado, etc.) é propagado via re-throw — o parent (page)
 * apanha e exibe toast PT-PT 4s.
 */

interface TagFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Tag;
  onClose: () => void;
  onSubmit: (input: Tag) => Promise<void>;
}

type FormState = {
  name: string;
  color: string;
};

type FieldErrors = Partial<Record<keyof Tag, string>>;

export function TagFormModal({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: TagFormModalProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() =>
    initialValue
      ? { name: initialValue.name, color: initialValue.color }
      : { name: '', color: DEFAULT_TAG_COLOR },
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'tags-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão ProjectFormModal
  useEffect(() => {
    firstInputRef.current?.focus();

    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleKeyDown(e: globalThis.KeyboardEvent): void {
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
    if (errors[key as keyof Tag]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof Tag];
        return next;
      });
    }
  }

  // Arrow keys no radio group (WAI-ARIA Radio Group Authoring Practices)
  //
  // Story 2.6 / Finding 2 CR Iter 1 — o índice corrente é derivado de `form.color`
  // (estado autoritativo), NÃO de um `currentHex` passado per-button. Após mover
  // a selecção, o foco é transferido explicitamente para o novo botão via
  // `data-color` — caso contrário, como apenas o botão seleccionado tem
  // `tabIndex={0}`, o foco ficava preso no botão original e os presses seguintes
  // usavam contexto stale (a navegação parava após 1 movimento).
  function handleColorKeyDown(e: KeyboardEvent<HTMLButtonElement>): void {
    const idx = TAG_PALETTE.findIndex((p) => p.hex === form.color);
    // Se a cor corrente não estiver na paleta (tag pré-existente fora da paleta),
    // qualquer seta inicia a navegação a partir do primeiro item.
    const baseIdx = idx === -1 ? 0 : idx;

    let nextIdx = baseIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (baseIdx + 1) % TAG_PALETTE.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (baseIdx - 1 + TAG_PALETTE.length) % TAG_PALETTE.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = TAG_PALETTE.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextColor = TAG_PALETTE[nextIdx].hex;
    setField('color', nextColor);
    // Move o foco para o novo botão seleccionado (roving tabindex).
    modalRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-color="${nextColor}"]`)
      ?.focus();
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const candidate: Tag = {
      id: initialValue?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      color: form.color,
    };

    try {
      const parsed = TagSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0] as keyof Tag | undefined;
          if (field !== undefined && !(field in fieldErrors)) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      // Erro do repo (duplicado, etc.): page já mostrou toast PT-PT 4s; modal
      // mantém-se aberto (NÃO chamou onClose); sem re-throw para evitar
      // unhandled rejection na form submit assíncrona.
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
        data-testid="tags-modal"
        style={{
          width: '100%',
          maxWidth: 420,
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
          {isCreate ? 'Nova tag' : 'Editar tag'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field id="tag-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="tag-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name !== undefined ? 'tag-name-error' : undefined}
              placeholder="Ex: Trabalho"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                color: '#F0F4FF',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: '0.55rem 0.7rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </Field>

          <Field id="tag-color" label="Cor" required error={errors.color}>
            <div
              role="radiogroup"
              aria-label="Cor da tag"
              aria-required="true"
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                padding: 6,
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
              }}
            >
              {TAG_PALETTE.map((entry) => {
                const selected = form.color === entry.hex;
                return (
                  <button
                    key={entry.hex}
                    type="button"
                    role="radio"
                    data-color={entry.hex}
                    aria-checked={selected}
                    aria-label={entry.label}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setField('color', entry.hex)}
                    onKeyDown={handleColorKeyDown}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: entry.hex,
                      border: selected ? '3px solid #F0F4FF' : '2px solid rgba(255, 255, 255, 0.12)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'border 0.15s, transform 0.15s',
                      transform: selected ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: selected ? `0 0 12px ${entry.hex}80` : 'none',
                    }}
                  />
                );
              })}
            </div>
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
// Field helper — label + error message (replicado de ProjectFormModal)
// ────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps): React.ReactElement {
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
