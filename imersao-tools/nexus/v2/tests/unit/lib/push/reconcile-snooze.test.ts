import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 4.9 — testes de `reconcileSnoozedReminders()` (AC10/AC11, C11).
 *
 * Cobre: chama `fetchPendingSchedules()`, faz `updateReminder(id, {status:'snoozed', fireAt})`
 * por entrada, NÃO chama `removeReminderSchedule` (D-RECON-SNOOZE-KEEP), e é
 * best-effort (um update falhado não interrompe os restantes).
 */

// Mock COMPLETO do schedule-client (preserva os outros exports reais via
// importOriginal) — `removeReminderSchedule` é espiável para uma asserção
// NÃO-vacuosa de D-RECON-SNOOZE-KEEP: provamos que, mesmo estando disponível, a
// função de remoção do mirror NUNCA é invocada por `reconcileSnoozedReminders`.
vi.mock('@/lib/push/schedule-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/push/schedule-client')>();
  return {
    ...actual,
    fetchPendingSchedules: vi.fn(async () => []),
    removeReminderSchedule: vi.fn(async () => undefined),
  };
});

vi.mock('@/lib/db/repos/reminders', () => ({
  updateReminder: vi.fn(async () => undefined),
}));

import { reconcileSnoozedReminders } from '@/lib/push/reconcile-snooze';
import {
  fetchPendingSchedules,
  removeReminderSchedule,
} from '@/lib/push/schedule-client';
import { updateReminder } from '@/lib/db/repos/reminders';

const fetchMock = fetchPendingSchedules as unknown as ReturnType<typeof vi.fn>;
const removeMock = removeReminderSchedule as unknown as ReturnType<typeof vi.fn>;
const updateMock = updateReminder as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock.mockResolvedValue([]);
  updateMock.mockResolvedValue(undefined);
});

describe('reconcileSnoozedReminders — Story 4.9 C11', () => {
  it('C11 — chama updateReminder com {status:snoozed, fireAt} por entrada', async () => {
    fetchMock.mockResolvedValue([
      { id: 'a', fireAt: 1000 },
      { id: 'b', fireAt: 2000 },
    ]);
    await reconcileSnoozedReminders();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock).toHaveBeenNthCalledWith(1, 'a', { status: 'snoozed', fireAt: 1000 });
    expect(updateMock).toHaveBeenNthCalledWith(2, 'b', { status: 'snoozed', fireAt: 2000 });
  });

  it('C11 — NÃO remove a entrada do mirror (D-RECON-SNOOZE-KEEP)', async () => {
    fetchMock.mockResolvedValue([{ id: 'a', fireAt: 1000 }]);
    await reconcileSnoozedReminders();
    // `removeReminderSchedule` é o único caminho de remoção do mirror exposto pelo
    // schedule-client; o spy está wired no MESMO módulo que o SUT carrega. A
    // entrada `pending` tem de sobreviver para o próximo disparo do scheduler.
    expect(removeMock).not.toHaveBeenCalled();
    // E a única mutação que o SUT faz é o updateReminder (status visual em Dexie).
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith('a', { status: 'snoozed', fireAt: 1000 });
  });

  it('best-effort: um update falhado não interrompe os restantes', async () => {
    fetchMock.mockResolvedValue([
      { id: 'a', fireAt: 1000 },
      { id: 'b', fireAt: 2000 },
    ]);
    updateMock.mockRejectedValueOnce(new Error('não encontrado'));
    await reconcileSnoozedReminders();
    // Mesmo com 'a' a falhar, 'b' é processado.
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('no-op quando não há entradas pending', async () => {
    fetchMock.mockResolvedValue([]);
    await reconcileSnoozedReminders();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
