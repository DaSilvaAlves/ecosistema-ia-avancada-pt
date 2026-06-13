'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { ZodError } from 'zod';
import { KnowledgeNotebookSchema } from '@/lib/db/schemas';
import type { KnowledgeNotebook } from '@/types/db';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — NotebookForm (Story 5.9 — AC7/AC8)
 *
 * Modal criar/editar caderno. Campo único: `name` (obrigatório). O caderno
 * pertence a uma área — o `areaId` é fixado pelo parent (a área seleccionada na
 * árvore), não editável aqui (AC7: requer área seleccionada). `createKnowledgeNotebook`
 * valida no repo que a área pai existe — se a área desapareceu, o repo lança e o
 * parent mostra toast.
 *
 * Validação Zod (`KnowledgeNotebookSchema`) no submit; focus trap + Escape
 * (WAI-ARIA) replicado de `AreaForm`/`TagFormModal`. Reutiliza `FormField` (4.2).
 */

interface NotebookFormProps {
  mode: 'create' | 'edit';
  /** Área a que o caderno pertence (criar) ou a que já pertence (editar). */
  areaId: string;
  initialValue?: KnowledgeNotebook;
  onClose: () => void;
  onSubmit: (input: KnowledgeNotebook) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof KnowledgeNotebook, string>>;

export function NotebookForm({
  mode,
  areaId,
  initialValue,
  onClose,
  onSubmit,
}: NotebookFormProps): React.ReactElement {
  const [name, setName] = useState<string>(initialValue?.name ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'notebook-modal-title';
  const isCreate = mode === 'create';

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

  function setNameField(value: string): void {
    setName(value);
    if (errors.name) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const candidate: KnowledgeNotebook = {
      id: initialValue?.id ?? crypto.randomUUID(),
      areaId: initialValue?.areaId ?? areaId,
      name: name.trim(),
    };

    try {
      const parsed = KnowledgeNotebookSchema.parse(candidate);
      setSubmitting(true);
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0] as keyof KnowledgeNotebook | undefined;
          if (field !== undefined && !(field in fieldErrors)) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }
      // Erro do repo (ex: área pai desapareceu): page mostra toast; modal aberto.
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
        data-testid="notebook-modal"
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
          {isCreate ? 'Novo caderno' : 'Editar caderno'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="notebook-name" label="Nome" required error={errors.name}>
            <input
              ref={firstInputRef}
              id="notebook-name"
              type="text"
              value={name}
              onChange={(e) => setNameField(e.target.value)}
              aria-required="true"
              aria-invalid={errors.name !== undefined}
              aria-describedby={
                errors.name !== undefined ? 'notebook-name-error' : undefined
              }
              placeholder="Ex: React 19"
              style={fieldInputStyle()}
            />
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
