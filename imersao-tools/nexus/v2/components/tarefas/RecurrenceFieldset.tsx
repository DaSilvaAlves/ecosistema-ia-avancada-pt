'use client';

import { useMemo } from 'react';
import type { RecurrenceType } from '@/lib/shared/recurrence';

/**
 * Nexus v2 — RecurrenceFieldset (Story 2.7 / AC6 + AC11 + AC12)
 *
 * Campo de configuração de recorrência injectável no formulário de tarefa.
 * Toggle "Tarefa recorrente" → expande para selector de tipo (6 tipos FR10),
 * pickers condicionais (dia da semana / dia do mês), e datas de início/fim.
 *
 * Componente controlado: `value === null` significa "não recorrente"; um valor
 * não-null descreve a configuração. Ao desmarcar o toggle, emite `onChange(null)`.
 *
 * Validação (AC6): `startDate` é obrigatório; se `endDate` preenchido, deve ser
 * `>= startDate`. As mensagens de erro são PT-PT e ligadas via `aria-describedby`.
 *
 * Design system: glassmorphism — `.claude/rules/design-system-ia-avancada.md`.
 *
 * Trace: Story 2.7 AC6 + FR10 + language-standards.md.
 */

export interface RecurrenceFieldValue {
  type: RecurrenceType;
  startDate: string; // ISO YYYY-MM-DD
  endDate?: string | null;
  weekday?: number; // 0=Seg..6=Dom — usado por 'weekly'
  monthday?: number; // 1-31 — usado por 'monthly' / 'monthly-specific-day'
}

interface RecurrenceFieldsetProps {
  value: RecurrenceFieldValue | null;
  onChange: (value: RecurrenceFieldValue | null) => void;
}

const TYPE_OPTIONS: ReadonlyArray<{ value: RecurrenceType; label: string }> = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekdays', label: 'Dias úteis' },
  { value: 'weekends', label: 'Fim-de-semana' },
  { value: 'monthly-specific-day', label: 'Dia específico do mês' },
];

const WEEKDAY_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Segunda' },
  { value: 1, label: 'Terça' },
  { value: 2, label: 'Quarta' },
  { value: 3, label: 'Quinta' },
  { value: 4, label: 'Sexta' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

/** Validação dos campos — devolve mensagem PT-PT ou null. */
export function validateRecurrenceValue(value: RecurrenceFieldValue): string | null {
  if (!value.startDate || value.startDate.trim() === '') {
    return 'Data de início é obrigatória';
  }
  if (value.endDate && value.endDate < value.startDate) {
    return 'Data de fim deve ser posterior à data de início';
  }
  return null;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8892A4',
  marginBottom: '0.3rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  color: '#F0F4FF',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
  padding: '0.45rem 0.6rem',
};

export function RecurrenceFieldset({ value, onChange }: RecurrenceFieldsetProps): React.ReactElement {
  const enabled = value !== null;

  const errorMessage = useMemo(
    () => (value !== null ? validateRecurrenceValue(value) : null),
    [value],
  );

  function handleToggle(checked: boolean): void {
    if (!checked) {
      onChange(null);
      return;
    }
    // Activar com defaults: tipo diária, sem data de início preenchida.
    onChange({ type: 'daily', startDate: '', endDate: null });
  }

  function patch(partial: Partial<RecurrenceFieldValue>): void {
    if (value === null) return;
    onChange({ ...value, ...partial });
  }

  const showWeekday = value?.type === 'weekly';
  const showMonthday = value?.type === 'monthly' || value?.type === 'monthly-specific-day';

  return (
    <fieldset
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '0.9rem 1rem',
        background: 'rgba(255, 255, 255, 0.025)',
        margin: 0,
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.88rem',
          color: '#F0F4FF',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          aria-label="Tarefa recorrente"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: '#00F5FF', width: 16, height: 16 }}
        />
        Tarefa recorrente
      </label>

      {enabled && value !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.8rem' }}>
          <div>
            <label htmlFor="recurrence-type" style={labelStyle}>
              Tipo de recorrência
            </label>
            <select
              id="recurrence-type"
              aria-label="Tipo de recorrência"
              value={value.type}
              onChange={(e) => patch({ type: e.target.value as RecurrenceType })}
              style={inputStyle}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {showWeekday && (
            <div>
              <label htmlFor="recurrence-weekday" style={labelStyle}>
                Dia da semana
              </label>
              <select
                id="recurrence-weekday"
                aria-label="Dia da semana"
                value={value.weekday ?? 0}
                onChange={(e) => patch({ weekday: Number(e.target.value) })}
                style={inputStyle}
              >
                {WEEKDAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showMonthday && (
            <div>
              <label htmlFor="recurrence-monthday" style={labelStyle}>
                Dia do mês
              </label>
              <input
                id="recurrence-monthday"
                type="number"
                min={1}
                max={31}
                aria-label="Dia do mês"
                value={value.monthday ?? 1}
                onChange={(e) => patch({ monthday: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label htmlFor="recurrence-start" style={labelStyle}>
              Data de início da recorrência
            </label>
            <input
              id="recurrence-start"
              type="date"
              aria-label="Data de início da recorrência"
              aria-describedby={errorMessage ? 'recurrence-error' : undefined}
              value={value.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="recurrence-end" style={labelStyle}>
              Data de fim da recorrência (opcional)
            </label>
            <input
              id="recurrence-end"
              type="date"
              aria-label="Data de fim da recorrência (opcional)"
              aria-describedby={errorMessage ? 'recurrence-error' : undefined}
              value={value.endDate ?? ''}
              onChange={(e) => patch({ endDate: e.target.value || null })}
              style={inputStyle}
            />
          </div>

          {errorMessage && (
            <p
              id="recurrence-error"
              role="alert"
              style={{
                margin: 0,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#FF006E',
              }}
            >
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
