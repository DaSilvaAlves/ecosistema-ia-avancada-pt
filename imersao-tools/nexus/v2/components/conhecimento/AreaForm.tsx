'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { ZodError } from 'zod';
import { KnowledgeAreaSchema } from '@/lib/db/schemas';
import type { KnowledgeArea } from '@/types/db';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';
import { TAG_PALETTE, DEFAULT_TAG_COLOR } from '@/lib/tags/colors';

/**
 * Nexus v2 — AreaForm (Story 5.9 — AC4/AC5)
 *
 * Modal criar/editar área de conhecimento. Campos: `name` (obrigatório),
 * `color` (radio group da paleta canónica do design system — mesmo padrão do
 * `TagFormModal` 2.6), `icon` (campo de texto, emoji). Reutiliza `FormField`
 * (4.2) e `TAG_PALETTE` (2.6) — sem HEX picker livre (`design-system-ia-avancada.md`).
 *
 * Validação Zod (`KnowledgeAreaSchema`) no submit; `ZodError` mapeado para erros
 * PT-PT por campo. Erro do repo propaga via re-throw — o parent (page) mostra
 * toast PT-PT e o modal mantém-se aberto.
 *
 * Focus trap + Escape (WAI-ARIA Modal Authoring Practices) e roving tabindex no
 * radio group de cores — replicados de `TagFormModal`.
 */

interface AreaFormProps {
  mode: 'create' | 'edit';
  initialValue?: KnowledgeArea;
  onClose: () => void;
  /** Recebe a área validada; lança em caso de erro do repo (o parent apanha). */
  onSubmit: (input: KnowledgeArea) => Promise<void>;
}

type FormState = { name: string; color: string; icon: string };
type FieldErrors = Partial<Record<keyof KnowledgeArea, string>>;

export function AreaForm({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: AreaFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(() =>
    initialValue
      ? {
          name: initialValue.name,
          color: initialValue.color,
          icon: initialValue.icon,
        }
      : { name: '', color: DEFAULT_TAG_COLOR, icon: '📁' },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'area-modal-title';
  const isCreate = mode === 'create';

  const selectedPaletteIndex = TAG_PALETTE.findIndex((p) => p.hex === form.color);

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
    if (errors[key as keyof KnowledgeArea]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof KnowledgeArea];
        return next;
      });
    }
  }

  function handleColorKeyDown(e: KeyboardEvent<HTMLButtonElement>): void {
    const baseIdx = selectedPaletteIndex === -1 ? 0 : selectedPaletteIndex;
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
    modalRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-color="${nextColor}"]`)
      ?.focus();
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const candidate: KnowledgeArea = {
      id: initialValue?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      color: form.color,
      icon: form.icon.trim(),
    };

    try {
      const parsed = KnowledgeAreaSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0] as keyof KnowledgeArea | undefined;
          if (field !== undefined && !(field in fieldErrors)) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      // Erro do repo: page já mostrou toast PT-PT; modal mantém-se aberto.
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
        data-testid="area-modal"
        style={{
          width: '100%',
          maxWidth: 440,
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
          {isCreate ? 'Nova área' : 'Editar área'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="area-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="area-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={
                errors.name !== undefined ? 'area-name-error' : undefined
              }
              placeholder="Ex: Aprendizagens"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField id="area-icon" label="Ícone" required error={errors.icon}>
            <input
              id="area-icon"
              type="text"
              value={form.icon}
              onChange={(e) => setField('icon', e.target.value)}
              aria-required="true"
              aria-invalid={errors.icon !== undefined}
              aria-describedby={
                errors.icon !== undefined ? 'area-icon-error' : undefined
              }
              placeholder="Ex: 🎓"
              maxLength={4}
              style={{ ...fieldInputStyle(), width: 80, textAlign: 'center' }}
            />
          </FormField>

          <FormField id="area-color" label="Cor" required error={errors.color}>
            <div
              role="radiogroup"
              aria-label="Cor da área"
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
              {TAG_PALETTE.map((entry, index) => {
                const selected = form.color === entry.hex;
                const tabbable =
                  selectedPaletteIndex === -1 ? index === 0 : selected;
                return (
                  <button
                    key={entry.hex}
                    type="button"
                    role="radio"
                    data-color={entry.hex}
                    aria-checked={selected}
                    aria-label={entry.label}
                    tabIndex={tabbable ? 0 : -1}
                    onClick={() => setField('color', entry.hex)}
                    onKeyDown={handleColorKeyDown}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: entry.hex,
                      border: selected
                        ? '3px solid #F0F4FF'
                        : '2px solid rgba(255, 255, 255, 0.12)',
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
          </FormField>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              paddingTop: 8,
            }}
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
