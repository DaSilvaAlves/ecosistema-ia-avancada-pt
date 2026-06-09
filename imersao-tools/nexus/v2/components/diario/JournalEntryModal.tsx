'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { JournalEntry } from '@/types/db';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';
import { MOOD_SCALE, MOODS } from '@/lib/diario/mood-scale';
import type { Mood } from '@/lib/diario/mood-heatmap';

/**
 * Nexus v2 — JournalEntryModal (Story 5.3 — AC2, FR42)
 *
 * Modal centrado glassmorphism para criar/editar/eliminar uma entrada de diário.
 * Replica o padrão dos modais do Epic 3/4 (`HabitFormModal`): focus trap, Escape,
 * `role="dialog"` + `aria-modal`, design system, fundo #04040A.
 *
 * Campos (AC2):
 *   - Data (`<input type="date">`): default hoje; editável dentro da janela do
 *     heatmap (`min`/`max`) APENAS em criação — em edição é a data da entrada
 *     (read-only, evita colisão com outro dia / órfãos).
 *   - Mood (1-5): selector acessível `role="radiogroup"` com roving tabindex +
 *     setas; cores SÓ da paleta via `MOOD_SCALE` (`[D-5.3-MOOD-SCALE]`).
 *   - Corpo markdown: `MarkdownEditor` (5.2) controlado; `onChange` estável via
 *     `useCallback` (CONCERNS QC-5.2-4 da 5.2).
 *
 * 1 entrada por dia (FR42): o parent decide criar-vs-editar via
 * `getJournalEntryByDate` na persistência (R1) — o modal só recolhe o payload.
 * Eliminar (só em edição) pede confirmação (padrão `HabitFormModal`).
 *
 * 3+ estados de render (`react-component-test-criteria.md`): criar vazio / editar
 * pré-preenchido / submissão com erro de validação (mood ou corpo em falta).
 */

interface JournalEntryModalProps {
  /** Data seleccionada (`YYYY-MM-DD`) — dia clicado no heatmap ou hoje. */
  date: string;
  /** Entrada existente desse dia (edição) ou `undefined` (criação). */
  existingEntry: JournalEntry | undefined;
  /** Limite inferior do selector de data (criação) — `range.from` do heatmap. */
  minDate: string;
  /** Limite superior do selector de data (criação) — hoje. */
  maxDate: string;
  onClose: () => void;
  /** Persiste a entrada (o parent decide create vs update por data). */
  onSubmit: (input: {
    id: string;
    date: string;
    mood: Mood;
    bodyMarkdown: string;
  }) => Promise<void>;
  /** Elimina a entrada existente (só em edição). */
  onDelete: (id: string) => Promise<void>;
}

export function JournalEntryModal({
  date,
  existingEntry,
  minDate,
  maxDate,
  onClose,
  onSubmit,
  onDelete,
}: JournalEntryModalProps): React.ReactElement {
  const isEdit = existingEntry !== undefined;

  const [formDate, setFormDate] = useState<string>(existingEntry?.date ?? date);
  const [mood, setMood] = useState<Mood | null>(existingEntry?.mood ?? null);
  const [body, setBody] = useState<string>(existingEntry?.bodyMarkdown ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const firstMoodRef = useRef<HTMLButtonElement>(null);
  const titleId = 'journal-modal-title';

  // Foco inicial + focus trap + Escape (WAI-ARIA) — padrão HabitFormModal.
  useEffect(() => {
    // Em criação foca a data; em edição foca o 1.º mood (data é read-only).
    if (isEdit) firstMoodRef.current?.focus();
    else dateInputRef.current?.focus();

    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
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
  }, [onClose, isEdit]);

  // `onChange` estável para o MarkdownEditor (CONCERNS QC-5.2-4 da 5.2).
  const handleBodyChange = useCallback((markdown: string): void => {
    setBody(markdown);
    setError(null);
  }, []);

  function selectMood(m: Mood): void {
    setMood(m);
    setError(null);
  }

  // Roving navigation no radiogroup de mood (setas ←/→/↑/↓, Home/End).
  function handleMoodKeyDown(e: KeyboardEvent<HTMLButtonElement>, current: Mood): void {
    let next: Mood | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (current < 5 ? current + 1 : 1) as Mood;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (current > 1 ? current - 1 : 5) as Mood;
    } else if (e.key === 'Home') {
      next = 1;
    } else if (e.key === 'End') {
      next = 5;
    }
    if (next !== null) {
      e.preventDefault();
      selectMood(next);
      const btn = modalRef.current?.querySelector<HTMLButtonElement>(
        `[data-mood-option="${next}"]`,
      );
      btn?.focus();
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;

    if (mood === null) {
      setError('Escolhe um humor de 1 a 5.');
      return;
    }
    if (body.trim() === '') {
      setError('Escreve algo no corpo da entrada.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        id: existingEntry?.id ?? crypto.randomUUID(),
        date: formDate,
        mood,
        bodyMarkdown: body,
      });
      onClose();
    } catch {
      // Erro do repo: o parent já o tratou (toast). Mantém o modal aberto.
      setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (existingEntry === undefined || submitting) return;
    const confirmed = window.confirm(
      'Apagar esta entrada de diário? Esta acção não pode ser desfeita.',
    );
    if (!confirmed) return;
    try {
      setSubmitting(true);
      await onDelete(existingEntry.id);
      onClose();
    } catch {
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
        data-testid="journal-modal"
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
          {isEdit ? 'Editar entrada' : 'Nova entrada'}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <FormField id="journal-date" label="Data" required>
            <input
              ref={dateInputRef}
              id="journal-date"
              type="date"
              value={formDate}
              min={minDate}
              max={maxDate}
              disabled={isEdit}
              onChange={(e) => setFormDate(e.target.value)}
              aria-required="true"
              style={{
                ...fieldInputStyle(),
                opacity: isEdit ? 0.6 : 1,
                cursor: isEdit ? 'not-allowed' : 'auto',
              }}
            />
          </FormField>

          {/* Selector de mood — radiogroup acessível (AC2, AC7). */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              id="journal-mood-label"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#8892A4',
                textTransform: 'uppercase',
              }}
            >
              Humor{' '}
              <span aria-hidden="true" style={{ color: '#FF006E' }}>
                *
              </span>
            </span>
            <div
              role="radiogroup"
              aria-labelledby="journal-mood-label"
              aria-required="true"
              style={{ display: 'flex', gap: 8 }}
            >
              {MOODS.map((m, i) => {
                const meta = MOOD_SCALE[m];
                const selected = mood === m;
                // Roving tabindex: o seleccionado (ou o 1.º, se nenhum) é tabbable.
                const tabbable = selected || (mood === null && i === 0);
                return (
                  <button
                    key={m}
                    ref={i === 0 ? firstMoodRef : undefined}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Humor ${meta.value} de 5 — ${meta.label}`}
                    data-mood-option={m}
                    tabIndex={tabbable ? 0 : -1}
                    onClick={() => selectMood(m)}
                    onKeyDown={(e) => handleMoodKeyDown(e, m)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: selected ? '#04040A' : '#F0F4FF',
                      background: selected ? meta.color : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${selected ? meta.border : 'rgba(255, 255, 255, 0.12)'}`,
                      outline: selected ? `2px solid ${meta.border}` : 'none',
                      outlineOffset: 2,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.72rem',
                color: '#4A5568',
                fontStyle: 'italic',
              }}
            >
              {mood !== null
                ? `${mood} — ${MOOD_SCALE[mood].label}`
                : '1 = muito mau · 5 = muito bom'}
            </span>
          </div>

          {/* Corpo markdown (editor 5.2). */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              Entrada{' '}
              <span aria-hidden="true" style={{ color: '#FF006E' }}>
                *
              </span>
            </span>
            <MarkdownEditor
              value={body}
              onChange={handleBodyChange}
              placeholder="O que aconteceu hoje? Como te sentiste?"
              ariaLabel="Corpo da entrada de diário"
            />
          </div>

          {error !== null && (
            <span
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

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
            }}
          >
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                aria-label="Apagar entrada"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FF006E',
                  background: 'rgba(255, 0, 110, 0.08)',
                  border: '1px solid rgba(255, 0, 110, 0.3)',
                  borderRadius: 6,
                  padding: '0.55rem 1.1rem',
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                Apagar
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
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
                {isEdit ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
