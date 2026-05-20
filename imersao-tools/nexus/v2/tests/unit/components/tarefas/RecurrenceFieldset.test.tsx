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

  // T19d (CR Iter 2 #5) — 'weekly' sem `weekday` é inválido
  it('T19d — tipo Semanal sem dia da semana produz mensagem PT-PT', () => {
    const value = {
      type: 'weekly',
      startDate: '2026-06-01',
      endDate: null,
    } as RecurrenceFieldValue;
    expect(validateRecurrenceValue(value)).toBe(
      'Dia da semana deve estar entre Segunda e Domingo',
    );
  });

  // T19e (CR Iter 2 #5) — 'weekly' com `weekday` fora de 0-6 é inválido
  it('T19e — tipo Semanal com dia da semana fora de 0-6 é inválido', () => {
    const value: RecurrenceFieldValue = {
      type: 'weekly',
      startDate: '2026-06-01',
      endDate: null,
      weekday: 7,
    };
    expect(validateRecurrenceValue(value)).toBe(
      'Dia da semana deve estar entre Segunda e Domingo',
    );
  });

  // T19f (CR Iter 2 #5) — 'monthly' sem `monthday` é inválido
  it('T19f — tipo Mensal sem dia do mês produz mensagem PT-PT', () => {
    const value = {
      type: 'monthly',
      startDate: '2026-06-01',
      endDate: null,
    } as RecurrenceFieldValue;
    expect(validateRecurrenceValue(value)).toBe('Dia do mês deve estar entre 1 e 31');
  });

  // T19g (CR Iter 2 #5) — 'monthly-specific-day' com `monthday` fora de 1-31 é inválido
  it('T19g — Dia específico do mês com dia fora de 1-31 é inválido', () => {
    const value: RecurrenceFieldValue = {
      type: 'monthly-specific-day',
      startDate: '2026-06-01',
      endDate: null,
      monthday: 32,
    };
    expect(validateRecurrenceValue(value)).toBe('Dia do mês deve estar entre 1 e 31');
  });

  // T19h (CR Iter 2 #5) — mudar para 'weekly' materializa o default weekday=0
  it('T19h — mudar o tipo para Semanal preenche weekday com o default 0', () => {
    const onChange = vi.fn();
    const value: RecurrenceFieldValue = { type: 'daily', startDate: '2026-06-01', endDate: null };
    render(<RecurrenceFieldset value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tipo de recorrência'), {
      target: { value: 'weekly' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'weekly', weekday: 0 }),
    );
  });

  // T19i (CR Iter 2 #5) — mudar para 'monthly' materializa o default monthday=1
  it('T19i — mudar o tipo para Mensal preenche monthday com o default 1', () => {
    const onChange = vi.fn();
    const value: RecurrenceFieldValue = { type: 'daily', startDate: '2026-06-01', endDate: null };
    render(<RecurrenceFieldset value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tipo de recorrência'), {
      target: { value: 'monthly' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'monthly', monthday: 1 }),
    );
  });
});
