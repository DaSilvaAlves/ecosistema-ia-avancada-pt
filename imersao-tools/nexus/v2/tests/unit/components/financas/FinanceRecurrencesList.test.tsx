import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import {
  FinanceRecurrencesList,
  describeRecurrence,
} from '@/components/financas/FinanceRecurrencesList';
import type { Category, FinanceRecurrence, Recurrence } from '@/types/db';

/**
 * Nexus v2 — FinanceRecurrencesList tests (Story 9.1b — cobertura package finanças)
 *
 * Lista read-only de recorrências financeiras (Story 3.4). Cobre a função pura
 * `describeRecurrence` (6 tipos FR10), o estado vazio, o preenchido (periodicidade
 * + intervalo de datas), a distinção saída/entrada e os callbacks.
 */

const CATEGORIES: Category[] = [
  { name: 'Habitação', color: '#9D00FF', icon: '🏠', isDefault: true },
];

type Row = FinanceRecurrence & { recurrence: Recurrence | undefined };

function makeRecurrence(partial: Partial<Recurrence> = {}): Recurrence {
  return {
    id: partial.id ?? 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr',
    rule: partial.rule ?? 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1',
    startDate: partial.startDate ?? '2026-01-01',
    endDate: partial.endDate ?? null,
    ownerType: partial.ownerType ?? 'transaction',
    ownerId: partial.ownerId ?? 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  };
}

function makeRow(partial: Partial<Row> = {}): Row {
  return {
    id: partial.id ?? '11111111-1111-4111-8111-111111111111',
    amount: partial.amount ?? -65000,
    category: partial.category ?? 'Habitação',
    description: partial.description ?? 'Renda',
    accountId: partial.accountId ?? null,
    cardId: partial.cardId ?? null,
    recurrenceId: partial.recurrenceId ?? 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr',
    createdAt: partial.createdAt ?? 1_700_000_000_000,
    recurrence: partial.recurrence ?? makeRecurrence(),
  };
}

describe('describeRecurrence (função pura FR10)', () => {
  it('undefined → "Recorrência"', () => {
    expect(describeRecurrence(undefined)).toBe('Recorrência');
  });
  it('daily → "Diária"', () => {
    expect(describeRecurrence('RRULE:FREQ=DAILY')).toBe('Diária');
  });
  it('monthly com BYMONTHDAY → "Mensal dia N"', () => {
    expect(describeRecurrence('RRULE:FREQ=MONTHLY;BYMONTHDAY=5')).toBe('Mensal dia 5');
  });
  it('monthly sem BYMONTHDAY → "Mensal"', () => {
    expect(describeRecurrence('RRULE:FREQ=MONTHLY')).toBe('Mensal');
  });
  it('weekly 5 dias → "Dias úteis"', () => {
    expect(describeRecurrence('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')).toBe('Dias úteis');
  });
  it('weekly SA+SU → "Fim-de-semana"', () => {
    expect(describeRecurrence('RRULE:FREQ=WEEKLY;BYDAY=SA,SU')).toBe('Fim-de-semana');
  });
  it('weekly dia único → "Semanal (Segunda)"', () => {
    expect(describeRecurrence('RRULE:FREQ=WEEKLY;BYDAY=MO')).toBe('Semanal (Segunda)');
  });
});

describe('FinanceRecurrencesList (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('estado vazio — lista sem linhas', () => {
    render(
      <FinanceRecurrencesList
        recurrences={[]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const list = screen.getByRole('list', { name: 'Lista de recorrências financeiras' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('preenchido — descrição, periodicidade PT-PT e "Desde <data>"', () => {
    render(
      <FinanceRecurrencesList
        recurrences={[makeRow()]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Renda')).toBeInTheDocument();
    expect(screen.getByText(/Mensal dia 1 · Desde 01\/01\/2026/)).toBeInTheDocument();
    const amount = screen.getByText(/-.*650,00/);
    expect(amount).toHaveStyle({ color: '#FF006E' });
  });

  it('intervalo com endDate — "início → fim"', () => {
    render(
      <FinanceRecurrencesList
        recurrences={[
          makeRow({ recurrence: makeRecurrence({ startDate: '2026-01-01', endDate: '2026-12-31' }) }),
        ]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/01\/01\/2026 → 31\/12\/2026/)).toBeInTheDocument();
  });

  it('callbacks — Editar devolve a linha, Apagar devolve o id', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const row = makeRow({ id: '22222222-2222-4222-8222-222222222222', description: 'Netflix' });
    render(
      <FinanceRecurrencesList
        recurrences={[row]}
        categories={CATEGORIES}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Editar recorrência Netflix' }));
    expect(onEdit).toHaveBeenCalledWith(row);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar recorrência Netflix' }));
    expect(onDelete).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });
});
