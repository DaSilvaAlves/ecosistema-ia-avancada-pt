import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — RemindersPage tests (Story 4.6 — AC9/AC10)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — loading (useReminders === undefined) → skeleton.
 *   C2 — tab Pendentes → lista de lembretes pending/snoozed + "+ Novo lembrete".
 *   C3 — tab Cancelados → lembretes cancelled, Restaurar disponível, sem botão
 *        "+ Novo lembrete".
 *
 * + AC10 (handler de criação com/sem recorrência): com RRULE, createRecurrence
 *   é chamado ANTES de createReminder com o mesmo ownerId; sem RRULE, não é
 *   chamado e recurrenceId === null.
 * + AC4 (cancelar): updateReminder({status:'cancelled'}).
 * + AC6 (apagar com confirmação): confirm cancelado não apaga.
 *
 * Mocks: useReminders, repos (reminders + recurrences), next/navigation.
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useReminders: vi.fn(),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  createRecurrence: vi.fn(),
  getRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack }),
}));

vi.mock('@/hooks/useReminders', () => ({
  useReminders: () => mocks.useReminders(),
}));

vi.mock('@/lib/db/repos/reminders', () => ({
  createReminder: (...args: unknown[]) => mocks.createReminder(...args),
  updateReminder: (...args: unknown[]) => mocks.updateReminder(...args),
  deleteReminder: (...args: unknown[]) => mocks.deleteReminder(...args),
}));

vi.mock('@/lib/db/repos/recurrences', () => ({
  createRecurrence: (...args: unknown[]) => mocks.createRecurrence(...args),
  getRecurrence: (...args: unknown[]) => mocks.getRecurrence(...args),
  deleteRecurrence: (...args: unknown[]) => mocks.deleteRecurrence(...args),
}));

// Importação DEPOIS dos vi.mock (factory hoisting).
import LembretesPage from '@/app/(app)/lembretes/page';

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

describe('LembretesPage (Story 4.6 / AC9)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.createReminder.mockResolvedValue(undefined);
    mocks.updateReminder.mockResolvedValue(undefined);
    mocks.deleteReminder.mockResolvedValue(undefined);
    mocks.createRecurrence.mockResolvedValue(undefined);
    mocks.deleteRecurrence.mockResolvedValue(undefined);
    mocks.getRecurrence.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  // ── C1 — loading ──
  it('C1 — loading: useReminders === undefined mostra skeleton', () => {
    mocks.useReminders.mockReturnValue(undefined);

    render(<LembretesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Lembretes' })).toBeInTheDocument();
    expect(screen.getByLabelText('A carregar lembretes')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — tab pendentes ──
  it('C2 — tab Pendentes: lista pending/snoozed + botão "+ Novo lembrete"', () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Pagar a luz', status: 'pending' }),
      makeReminder({ id: 'r2', text: 'Adiado', status: 'snoozed' }),
      makeReminder({ id: 'r3', text: 'Cancelado', status: 'cancelled' }),
    ]);

    render(<LembretesPage />);

    expect(screen.getByText('Pagar a luz')).toBeInTheDocument();
    expect(screen.getByText('Adiado')).toBeInTheDocument(); // snoozed conta como pendente-activo
    expect(screen.queryByText('Cancelado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Novo lembrete' })).toBeInTheDocument();
  });

  // ── C3 — tab cancelados ──
  it('C3 — tab Cancelados: só cancelled, Restaurar disponível, sem "+ Novo lembrete"', () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Pagar a luz', status: 'pending' }),
      makeReminder({ id: 'r2', text: 'Antigo', status: 'cancelled' }),
    ]);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Cancelados' }));

    expect(screen.getByText('Antigo')).toBeInTheDocument();
    expect(screen.queryByText('Pagar a luz')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar "Antigo"' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Novo lembrete' })).not.toBeInTheDocument();
  });

  // ── AC10 — criação com recorrência ──
  it('AC10 — criar com RRULE: createRecurrence é chamado ANTES de createReminder com o mesmo ownerId', async () => {
    mocks.useReminders.mockReturnValue([]);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo lembrete' }));

    fireEvent.change(screen.getByLabelText(/Texto/), { target: { value: 'Renda mensal' } });
    fireEvent.change(screen.getByLabelText(/Data\/hora/), {
      target: { value: '2026-07-01T09:00' },
    });
    fireEvent.change(screen.getByLabelText(/Recorrência/), {
      target: { value: 'FREQ=MONTHLY' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(mocks.createReminder).toHaveBeenCalledTimes(1));
    expect(mocks.createRecurrence).toHaveBeenCalledTimes(1);

    const recurrenceArg = mocks.createRecurrence.mock.calls[0][0] as {
      id: string;
      rule: string;
      ownerType: string;
      ownerId: string;
    };
    const reminderArg = mocks.createReminder.mock.calls[0][0] as Reminder;

    expect(recurrenceArg.rule).toBe('FREQ=MONTHLY');
    expect(recurrenceArg.ownerType).toBe('reminder');
    // O ownerId da Recurrence bate com o id do lembrete criado.
    expect(recurrenceArg.ownerId).toBe(reminderArg.id);
    // O recurrenceId do lembrete aponta para a Recurrence criada.
    expect(reminderArg.recurrenceId).toBe(recurrenceArg.id);
    expect(reminderArg.status).toBe('pending');
    expect(reminderArg.channels).toEqual(['push']);
  });

  it('AC10 — criar sem RRULE: createRecurrence NÃO é chamado e recurrenceId === null', async () => {
    mocks.useReminders.mockReturnValue([]);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo lembrete' }));

    fireEvent.change(screen.getByLabelText(/Texto/), { target: { value: 'Compras' } });
    fireEvent.change(screen.getByLabelText(/Data\/hora/), {
      target: { value: '2026-07-01T09:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(mocks.createReminder).toHaveBeenCalledTimes(1));
    expect(mocks.createRecurrence).not.toHaveBeenCalled();
    const reminderArg = mocks.createReminder.mock.calls[0][0] as Reminder;
    expect(reminderArg.recurrenceId).toBeNull();
  });

  // ── AC4 — cancelar ──
  it('AC4 — cancelar chama updateReminder com status cancelled (não apaga)', async () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Pagar a luz', status: 'pending' }),
    ]);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar "Pagar a luz"' }));

    await waitFor(() => expect(mocks.updateReminder).toHaveBeenCalledTimes(1));
    expect(mocks.updateReminder).toHaveBeenCalledWith('r1', { status: 'cancelled' });
    expect(mocks.deleteReminder).not.toHaveBeenCalled();
  });

  // ── AC5 — restaurar ──
  it('AC5 — restaurar chama updateReminder com status pending', async () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Antigo', status: 'cancelled' }),
    ]);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Cancelados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar "Antigo"' }));

    await waitFor(() => expect(mocks.updateReminder).toHaveBeenCalledTimes(1));
    expect(mocks.updateReminder).toHaveBeenCalledWith('r1', { status: 'pending' });
  });

  // ── AC6 — apagar com confirmação ──
  it('AC6 — apagar pede confirmação que menciona Cancelar; cancelar o confirm não apaga', () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Pagar a luz', status: 'pending' }),
    ]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Pagar a luz"' }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Cancelar'));
    expect(mocks.deleteReminder).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('AC6 — apagar confirmado chama deleteReminder (hard-delete + cascade no repo)', async () => {
    mocks.useReminders.mockReturnValue([
      makeReminder({ id: 'r1', text: 'Pagar a luz', status: 'pending' }),
    ]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<LembretesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Pagar a luz"' }));

    await waitFor(() => expect(mocks.deleteReminder).toHaveBeenCalledWith('r1'));
    confirmSpy.mockRestore();
  });
});
