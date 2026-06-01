'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { ZodError } from 'zod';
import { GoalSchema } from '@/lib/db/schemas';
import type { Goal } from '@/types/db';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — GoalFormModal (Story 4.5 — AC4, FR39)
 *
 * Modal centrado glassmorphism para criar/editar uma meta. Replica o padrão do
 * `ReminderFormModal` (Story 4.6) e `HabitFormModal` (4.2): focus trap, Escape,
 * validação Zod em submit, `ZodError` mapeado para erros PT-PT por campo. Usa o
 * `FormField` partilhado (4.2) para todos os campos.
 *
 * Campos (AC4):
 *   - Título (`title`, obrigatório, min 1 char).
 *   - Descrição (`description`, opcional, multi-linha).
 *   - Prazo (`deadline`, opcional, input `date` → `YYYY-MM-DD` | null).
 *   - Tipo (`type`, select "Numérica" | "Booleana").
 *   - Alvo (`target`, número — só relevante para `numeric`; oculto p/ boolean).
 *   - Milestones (adição dinâmica: valor `at` + nota opcional — 0 a N).
 *
 * O `current` NÃO é editado aqui: começa em 0 no modo `create` (definido pelo
 * handler da page); no modo `edit` é actualizado via `GoalView`.
 *
 * 3 estados de render (`react-component-test-criteria.md`): create vazio / edit
 * pré-preenchido / submissão com erros de validação.
 */

/**
 * Linha de milestone no formulário (`at` em string para o input). `reached`
 * viaja DENTRO do draft (não se infere por índice no submit — o array de
 * milestones pode ser reordenado/filtrado, o que partiria um lookup por índice).
 */
interface MilestoneDraft {
  at: string;
  note: string;
  reached: boolean;
}

interface GoalFormModalProps {
  mode: 'create' | 'edit';
  initialValue?: Partial<Goal>;
  onClose: () => void;
  onSubmit: (input: Partial<Goal>) => Promise<void>;
}

type FieldKey = 'title' | 'target';
type FieldErrors = Partial<Record<FieldKey, string>>;

export function GoalFormModal({
  mode,
  initialValue,
  onClose,
  onSubmit,
}: GoalFormModalProps): React.ReactElement {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [deadline, setDeadline] = useState(initialValue?.deadline ?? '');
  const [type, setType] = useState<Goal['type']>(initialValue?.type ?? 'numeric');
  const [target, setTarget] = useState(
    initialValue?.target !== undefined ? String(initialValue.target) : '',
  );
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(
    (initialValue?.milestones ?? []).map((m) => ({
      at: String(m.at),
      note: m.note ?? '',
      reached: m.reached,
    })),
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = 'goal-modal-title';
  const isCreate = mode === 'create';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão ReminderFormModal.
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

  function clearError(key: FieldKey): void {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function addMilestone(): void {
    setMilestones((prev) => [...prev, { at: '', note: '', reached: false }]);
  }

  function removeMilestone(index: number): void {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  function setMilestoneField(index: number, key: keyof MilestoneDraft, value: string): void {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    );
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    setErrors({});

    const trimmedTitle = title.trim();

    // Constrói o patch a validar. `target` só é relevante para metas numéricas;
    // para `boolean` fixa-se em 1 (passo único — coerente com getGoalProgress).
    const parsedTarget =
      type === 'numeric'
        ? target.trim() === ''
          ? NaN
          : Number(target)
        : 1;

    // Milestones: descarta linhas com `at` vazio/inválido; converte nota vazia
    // para undefined. `reached` vem do próprio draft (CR Iter 1 F1 — não se
    // infere por índice, que partiria ao remover/reordenar linhas).
    const parsedMilestones = milestones
      .filter((m) => m.at.trim() !== '' && !Number.isNaN(Number(m.at)))
      .map((m) => ({
        at: Number(m.at),
        reached: m.reached,
        note: m.note.trim() === '' ? undefined : m.note.trim(),
      }));

    const patch: Partial<Goal> = {
      title: trimmedTitle,
      description: description.trim() === '' ? undefined : description.trim(),
      type,
      target: parsedTarget,
      deadline: deadline.trim() === '' ? null : deadline.trim(),
      milestones: parsedMilestones,
    };

    try {
      GoalSchema.partial().parse(patch);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: FieldErrors = {};
        for (const issue of err.errors) {
          const field = issue.path[0];
          if ((field === 'title' || field === 'target') && !(field in fieldErrors)) {
            fieldErrors[field as FieldKey] = issue.message;
          }
        }
        // Mensagem específica PT-PT para target NaN (mais clara que o erro Zod).
        if (type === 'numeric' && Number.isNaN(parsedTarget)) {
          fieldErrors.target = 'Alvo é obrigatório para metas numéricas';
        }
        setErrors(fieldErrors);
      }
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(patch);
      onClose();
    } catch {
      // Erro do repo (não-Zod): o parent tratou (toast). Mantém o modal aberto.
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
        data-testid="goal-modal"
        style={{
          width: '100%',
          maxWidth: 520,
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
          {isCreate ? 'Nova meta' : 'Editar meta'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="goal-title" label="Título" required error={errors.title}>
            <input
              ref={firstInputRef}
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearError('title');
              }}
              aria-required="true"
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title !== undefined ? 'goal-title-error' : undefined}
              placeholder="Ex: Ler 12 livros este ano"
              style={fieldInputStyle()}
            />
          </FormField>

          <FormField id="goal-description" label="Descrição (opcional)">
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalhes da meta"
              style={{ ...fieldInputStyle(), resize: 'vertical' }}
            />
          </FormField>

          <FormField id="goal-type" label="Tipo">
            <select
              id="goal-type"
              value={type}
              onChange={(e) => setType(e.target.value as Goal['type'])}
              style={fieldInputStyle()}
            >
              <option value="numeric">Numérica</option>
              <option value="boolean">Booleana (sim/não)</option>
            </select>
          </FormField>

          {type === 'numeric' && (
            <FormField
              id="goal-target"
              label="Alvo"
              required
              helper="Valor numérico a atingir (ex: 12)"
              error={errors.target}
            >
              <input
                id="goal-target"
                type="number"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  clearError('target');
                }}
                aria-required="true"
                aria-invalid={errors.target !== undefined}
                aria-describedby={errors.target !== undefined ? 'goal-target-error' : undefined}
                placeholder="12"
                style={fieldInputStyle()}
              />
            </FormField>
          )}

          <FormField
            id="goal-deadline"
            label="Prazo (opcional)"
            helper="Data-limite — vazio = sem prazo"
          >
            <input
              id="goal-deadline"
              type="date"
              value={deadline ?? ''}
              onChange={(e) => setDeadline(e.target.value)}
              style={fieldInputStyle()}
            />
          </FormField>

          {/* Milestones dinâmicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#8892A4',
                textTransform: 'uppercase',
              }}
            >
              Milestones (opcional)
            </span>
            {milestones.map((m, index) => (
              <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  value={m.at}
                  onChange={(e) => setMilestoneField(index, 'at', e.target.value)}
                  aria-label={`Valor do milestone ${index + 1}`}
                  placeholder="Valor"
                  style={{ ...fieldInputStyle(), width: '30%' }}
                />
                <input
                  type="text"
                  value={m.note}
                  onChange={(e) => setMilestoneField(index, 'note', e.target.value)}
                  aria-label={`Nota do milestone ${index + 1}`}
                  placeholder="Nota (opcional)"
                  style={fieldInputStyle()}
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  aria-label={`Remover milestone ${index + 1}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    color: '#FF006E',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#FFB800',
                background: 'rgba(255, 184, 0, 0.08)',
                border: '1px solid rgba(255, 184, 0, 0.25)',
                borderRadius: 6,
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Adicionar milestone
            </button>
          </div>

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
