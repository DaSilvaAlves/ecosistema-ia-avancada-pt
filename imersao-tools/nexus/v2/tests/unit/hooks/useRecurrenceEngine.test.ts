import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * Nexus v2 — useRecurrenceEngine tests (Story 2.7 / AC13 — T22)
 *
 * Confirma que o hook chama `runRecurrenceEngine` exactamente uma vez no mount.
 * `runRecurrenceEngine` é mockado para isolar o hook do motor real.
 */

const runRecurrenceEngineMock = vi.fn(async () => ({ created: 0, skipped: 0, errors: 0 }));

vi.mock('@/lib/shared/recurrence', () => ({
  runRecurrenceEngine: () => runRecurrenceEngineMock(),
}));

describe('useRecurrenceEngine — Story 2.7', () => {
  beforeEach(() => {
    runRecurrenceEngineMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // T22 — chama runRecurrenceEngine uma vez no mount
  it('T22 — chama runRecurrenceEngine exactamente uma vez no mount', async () => {
    const { useRecurrenceEngine } = await import('@/hooks/useRecurrenceEngine');
    renderHook(() => useRecurrenceEngine());
    expect(runRecurrenceEngineMock).toHaveBeenCalledTimes(1);
  });

  it('T22b — não chama de novo em re-render do componente', async () => {
    const { useRecurrenceEngine } = await import('@/hooks/useRecurrenceEngine');
    const { rerender } = renderHook(() => useRecurrenceEngine());
    rerender();
    rerender();
    expect(runRecurrenceEngineMock).toHaveBeenCalledTimes(1);
  });
});
