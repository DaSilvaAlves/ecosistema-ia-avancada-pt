import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { Reminder } from '@/types/db';
import { RemindersList } from '@/components/lembretes/RemindersList';

/**
 * Nexus v2 — RemindersList tests (Story 4.6 — AC2/AC9)
 *
 * 4 estados de render (`react-component-test-criteria.md`):
 *   C1 — loading (reminders === undefined) → skeleton (aria-busy).
 *   C2 — vazio (reminders === []) → empty state com CTA (variant pending).
 *   C3 — lista pendente → texto, data/hora PT-PT, badge recorrência, acções
 *        Editar/Cancelar/Apagar.
 *   C4 — lista cancelada → acções Restaurar/Apagar (sem Editar).
 */

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    text: overrides.text ?? 'Pagar a renda',
    fireAt: overrides.fireAt ?? new Date('2026-06-01T15:00:00').getTime(),
    recurrenceId: overrides.recurrenceId ?? null,
    channels: overrides.channels ?? ['push'],
    status: overrides.status ?? 'pending',
  };
}

const noopHandlers = {
  onEdit: vi.fn(),
  onCancel: vi.fn(),
  onRestore: vi.fn(),
  onDelete: vi.fn(),
};

describe('RemindersList (Story 4.6 / AC2)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — loading ──
  it('C1 — loading: reminders === undefined mostra skeleton (aria-busy)', () => {
    render(
      <RemindersList reminders={undefined} variant="pending" {...noopHandlers} />,
    );
    expect(screen.getByLabelText('A carregar lembretes')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  // ── C2 — vazio ──
  it('C2 — vazio (pending): reminders === [] mostra empty state com CTA', () => {
    render(<RemindersList reminders={[]} variant="pending" {...noopHandlers} />);
    expect(screen.getByText(/sem lembretes pendentes/i)).toBeInTheDocument();
    expect(screen.getByText(/criar primeiro lembrete/i)).toBeInTheDocument();
  });

  it('C2b — vazio (cancelled): mensagem sem CTA de criação', () => {
    render(<RemindersList reminders={[]} variant="cancelled" {...noopHandlers} />);
    expect(screen.getByText(/sem lembretes cancelados/i)).toBeInTheDocument();
    expect(screen.queryByText(/criar primeiro lembrete/i)).not.toBeInTheDocument();
  });

  // ── C3 — lista pendente ──
  it('C3 — lista (pending): renderiza texto, data/hora e acções Editar/Cancelar/Apagar', () => {
    const reminders = [
      makeReminder({ id: 'r1', text: 'Pagar a luz' }),
      makeReminder({ id: 'r2', text: 'Reunião' }),
    ];
    render(
      <RemindersList reminders={reminders} variant="pending" {...noopHandlers} />,
    );
    expect(screen.getByText('Pagar a luz')).toBeInTheDocument();
    expect(screen.getByText('Reunião')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar "Pagar a luz"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar "Pagar a luz"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar "Pagar a luz"' })).toBeInTheDocument();
    // Não há acção Restaurar na variant pending.
    expect(
      screen.queryByRole('button', { name: 'Restaurar "Pagar a luz"' }),
    ).not.toBeInTheDocument();
  });

  it('C3b — lista (pending): mostra a data/hora formatada PT-PT', () => {
    const fireAt = new Date('2026-06-01T15:00:00').getTime();
    const reminders = [makeReminder({ id: 'r1', text: 'Pagar a luz', fireAt })];
    render(
      <RemindersList reminders={reminders} variant="pending" {...noopHandlers} />,
    );
    // toLocaleString('pt-PT') → "01/06/2026, 15:00" (dia/mês/ano + hora 24h).
    const expected = new Date(fireAt).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('C3c — badge de recorrência aparece quando recurrenceId !== null', () => {
    const reminders = [
      makeReminder({ id: 'r1', text: 'Recorrente', recurrenceId: crypto.randomUUID() }),
      makeReminder({ id: 'r2', text: 'Único', recurrenceId: null }),
    ];
    render(
      <RemindersList reminders={reminders} variant="pending" {...noopHandlers} />,
    );
    expect(screen.getByTestId('reminder-recurrence-badge-r1')).toBeInTheDocument();
    expect(screen.queryByTestId('reminder-recurrence-badge-r2')).not.toBeInTheDocument();
  });

  it('C3d — botões pending disparam os callbacks correctos', () => {
    const reminders = [makeReminder({ id: 'r1', text: 'Pagar a luz' })];
    render(
      <RemindersList reminders={reminders} variant="pending" {...noopHandlers} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Editar "Pagar a luz"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar "Pagar a luz"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Pagar a luz"' }));
    expect(noopHandlers.onEdit).toHaveBeenCalledWith(reminders[0]);
    expect(noopHandlers.onCancel).toHaveBeenCalledWith(reminders[0]);
    expect(noopHandlers.onDelete).toHaveBeenCalledWith(reminders[0]);
  });

  // ── C4 — lista cancelada ──
  it('C4 — lista (cancelled): mostra Restaurar e Apagar, sem Editar nem Cancelar', () => {
    const reminders = [makeReminder({ id: 'r1', text: 'Antigo', status: 'cancelled' })];
    render(
      <RemindersList reminders={reminders} variant="cancelled" {...noopHandlers} />,
    );
    expect(screen.getByRole('button', { name: 'Restaurar "Antigo"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar "Antigo"' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar "Antigo"' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar "Antigo"' })).not.toBeInTheDocument();
  });

  it('C4b — botões cancelled disparam os callbacks correctos', () => {
    const reminders = [makeReminder({ id: 'r1', text: 'Antigo', status: 'cancelled' })];
    render(
      <RemindersList reminders={reminders} variant="cancelled" {...noopHandlers} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar "Antigo"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Antigo"' }));
    expect(noopHandlers.onRestore).toHaveBeenCalledWith(reminders[0]);
    expect(noopHandlers.onDelete).toHaveBeenCalledWith(reminders[0]);
  });
});
