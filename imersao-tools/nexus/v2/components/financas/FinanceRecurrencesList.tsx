'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import type { Category, FinanceRecurrence, Recurrence } from '@/types/db';

/**
 * Nexus v2 — FinanceRecurrencesList (Story 3.4 — CRUD finanças recorrentes, FR17)
 *
 * Lista das recorrências financeiras (renda, Netflix, seguros) — ordenada por
 * `createdAt` desc (a ordenação vem de `listFinanceRecurrences`). Cada linha
 * mostra descrição/categoria, valor template, tipo de recorrência PT-PT e
 * datas. Acções "Editar" e "Apagar" por linha.
 *
 * Replica o padrão visual de `TransactionsList` (Story 3.3): glassmorphism,
 * saída (`amount < 0`) em Magenta `#FF006E`, entrada em Lime `#39FF14` — paleta
 * canónica do design system `[IA]AVANÇADA PT`.
 */

interface FinanceRecurrenceWithRule extends FinanceRecurrence {
  /** A `Recurrence` associada (RRULE + datas) — para descrever a periodicidade. */
  recurrence: Recurrence | undefined;
}

interface FinanceRecurrencesListProps {
  recurrences: FinanceRecurrenceWithRule[];
  categories: Category[];
  onEdit: (recurrence: FinanceRecurrenceWithRule) => void;
  onDelete: (id: string) => void;
}

/** Converte uma data ISO `yyyy-MM-dd` para o formato PT-PT `dd/MM/yyyy`. */
function formatDatePt(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

const WEEKDAY_TOKEN_TO_PT: Record<string, string> = {
  MO: 'Segunda',
  TU: 'Terça',
  WE: 'Quarta',
  TH: 'Quinta',
  FR: 'Sexta',
  SA: 'Sábado',
  SU: 'Domingo',
};

/**
 * Deriva uma descrição PT-PT da periodicidade a partir da RRULE serializada.
 * Cobre os 6 tipos do FR10 — daily, weekly, monthly, weekdays, weekends.
 */
export function describeRecurrence(rule: string | undefined): string {
  if (!rule) return 'Recorrência';

  if (/FREQ=DAILY/.test(rule)) return 'Diária';

  if (/FREQ=MONTHLY/.test(rule)) {
    const byMonthDay = rule.match(/BYMONTHDAY=(\d+)/);
    return byMonthDay ? `Mensal dia ${byMonthDay[1]}` : 'Mensal';
  }

  if (/FREQ=WEEKLY/.test(rule)) {
    const byDay = rule.match(/BYDAY=([^;]+)/);
    if (!byDay) return 'Semanal';
    const days = byDay[1].split(',');
    if (days.length === 5) return 'Dias úteis';
    if (days.length === 2 && days.includes('SA') && days.includes('SU')) {
      return 'Fim-de-semana';
    }
    const ptDay = WEEKDAY_TOKEN_TO_PT[days[0]];
    return ptDay ? `Semanal (${ptDay})` : 'Semanal';
  }

  return 'Recorrência';
}

export function FinanceRecurrencesList({
  recurrences,
  categories,
  onEdit,
  onDelete,
}: FinanceRecurrencesListProps): React.ReactElement {
  // Lookup O(1) de cor por nome de categoria.
  const colorByCategory = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.name, c.color);
    return map;
  }, [categories]);

  return (
    <ul
      aria-label="Lista de recorrências financeiras"
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {recurrences.map((fr) => (
        <FinanceRecurrenceRow
          key={fr.id}
          recurrence={fr}
          categoryColor={colorByCategory.get(fr.category) ?? '#8892A4'}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface FinanceRecurrenceRowProps {
  recurrence: FinanceRecurrenceWithRule;
  categoryColor: string;
  onEdit: (recurrence: FinanceRecurrenceWithRule) => void;
  onDelete: (id: string) => void;
}

function FinanceRecurrenceRow({
  recurrence,
  categoryColor,
  onEdit,
  onDelete,
}: FinanceRecurrenceRowProps): React.ReactElement {
  const isSaida = recurrence.amount < 0;
  const amountColor = isSaida ? '#FF006E' : '#39FF14';
  const primaryText =
    recurrence.description.trim() !== '' ? recurrence.description : recurrence.category;

  const periodicity = describeRecurrence(recurrence.recurrence?.rule);
  const startDate = recurrence.recurrence?.startDate;
  const endDate = recurrence.recurrence?.endDate ?? null;

  const dateLabel =
    startDate !== undefined
      ? endDate !== null
        ? `${formatDatePt(startDate)} → ${formatDatePt(endDate)}`
        : `Desde ${formatDatePt(startDate)}`
      : '';

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        padding: '0.75rem 1rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: categoryColor,
          flexShrink: 0,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#F0F4FF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {primaryText}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            color: '#8892A4',
            textTransform: 'uppercase',
          }}
        >
          {periodicity}
          {dateLabel !== '' ? ` · ${dateLabel}` : ''}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: amountColor,
          flexShrink: 0,
        }}
      >
        {formatCurrency(recurrence.amount)}
      </span>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(recurrence)}
          aria-label={`Editar recorrência ${primaryText}`}
          style={rowButtonStyle('#00F5FF')}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(recurrence.id)}
          aria-label={`Apagar recorrência ${primaryText}`}
          style={rowButtonStyle('#FF006E')}
        >
          Apagar
        </button>
      </div>
    </li>
  );
}

function rowButtonStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 600,
    color,
    background: 'transparent',
    border: `1px solid ${color}33`,
    borderRadius: 6,
    padding: '0.35rem 0.6rem',
    cursor: 'pointer',
  };
}
