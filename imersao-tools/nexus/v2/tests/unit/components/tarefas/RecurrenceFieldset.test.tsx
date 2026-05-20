import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RecurrenceFieldset,
  validateRecurrenceValue,
  type RecurrenceFieldValue,
} from '@/components/tarefas/RecurrenceFieldset';

/**
 * Nexus v2 — RecurrenceFieldset tests (Story 2.7 / AC13 — T14-T19)
 *
 * Cobre render base, toggle, pickers condicionais e validação PT-PT.
 */

describe('RecurrenceFieldset — Story 2.7', () => {
  // T14 — render base: toggle desmarcado → campos ocultos
  it('T14 — com value null, mostra apenas o toggle e oculta os campos', () => {
    render(<RecurrenceFieldset value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Tarefa recorrente')).not.toBeChecked();
    expect(screen.queryByLabelText('Tipo de recorrência')).not.toBeInTheDocument();
  });

  // T15 — toggle activa os campos
  it('T15 — marcar o toggle emite onChange com um valor não-null', () => {
    const onChange = vi.fn();
    render(<RecurrenceFieldset value={null} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Tarefa recorrente'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'daily', startDate: '' }),
    );
  });

  it('T15b — com value não-null, mostra os campos de tipo e datas', () => {
    const value: RecurrenceFieldValue = { type: 'daily', startDate: '2026-06-01', endDate: null };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Tipo de recorrência')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de início da recorrência')).toBeInTheDocument();
  });

  // T16 — tipo Semanal → picker de dia da semana
  it('T16 — tipo Semanal mostra o picker de dia da semana', () => {
    const value: RecurrenceFieldValue = {
      type: 'weekly',
      startDate: '2026-06-01',
      endDate: null,
      weekday: 0,
    };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Dia da semana')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dia do mês')).not.toBeInTheDocument();
  });

  // T17 — tipo Mensal → input de dia do mês
  it('T17 — tipo Mensal mostra o input de dia do mês', () => {
    const value: RecurrenceFieldValue = {
      type: 'monthly',
      startDate: '2026-06-01',
      endDate: null,
      monthday: 15,
    };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Dia do mês')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dia da semana')).not.toBeInTheDocument();
  });

  // T18 — validação startDate obrigatório
  it('T18 — startDate vazio mostra mensagem PT-PT de erro', () => {
    const value: RecurrenceFieldValue = { type: 'daily', startDate: '', endDate: null };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(screen.getByText('Data de início é obrigatória')).toBeInTheDocument();
    expect(validateRecurrenceValue(value)).toBe('Data de início é obrigatória');
  });

  // T19 — endDate < startDate
  it('T19 — endDate anterior a startDate mostra mensagem PT-PT', () => {
    const value: RecurrenceFieldValue = {
      type: 'daily',
      startDate: '2026-06-10',
      endDate: '2026-06-01',
    };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(
      screen.getByText('Data de fim deve ser posterior à data de início'),
    ).toBeInTheDocument();
    expect(validateRecurrenceValue(value)).toBe(
      'Data de fim deve ser posterior à data de início',
    );
  });

  it('T19b — value válido não produz mensagem de erro', () => {
    const value: RecurrenceFieldValue = {
      type: 'daily',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    };
    render(<RecurrenceFieldset value={value} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(validateRecurrenceValue(value)).toBeNull();
  });

  it('T19c — desmarcar o toggle emite onChange(null)', () => {
    const onChange = vi.fn();
    const value: RecurrenceFieldValue = { type: 'daily', startDate: '2026-06-01', endDate: null };
    render(<RecurrenceFieldset value={value} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Tarefa recorrente'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
