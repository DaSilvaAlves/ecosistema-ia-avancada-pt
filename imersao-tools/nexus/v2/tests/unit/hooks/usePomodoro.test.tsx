import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoro } from '@/hooks/usePomodoro';

class FakeAudioContext {
  static createOscillatorSpy = vi.fn();
  currentTime = 0;
  close = vi.fn();
  createOscillator = FakeAudioContext.createOscillatorSpy.mockImplementation(() => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 0 },
  }));
}

function storedPomodoro(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem('nexus_pomodoro') ?? '{}') as Record<string, unknown>;
}

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T10:00:00.000Z'));
    window.localStorage.clear();
    FakeAudioContext.createOscillatorSpy.mockClear();
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('permite configurar e persistir a duracao de trabalho em minutos', () => {
    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.setWorkDurationMinutes(50);
    });

    expect(result.current.state.workDurationMinutes).toBe(50);
    expect(result.current.state.timeLeft).toBe(50 * 60);
    expect(storedPomodoro().workDurationMinutes).toBe(50);
  });

  it('permite escolher e persistir um alarme mais intenso', () => {
    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.setAlarmSound('urgent');
    });

    expect(result.current.state.alarmSound).toBe('urgent');
    expect(storedPomodoro().alarmSound).toBe('urgent');
  });

  it('usa endsAt persistido para manter o contador correto apos remount', () => {
    const first = renderHook(() => usePomodoro());

    act(() => {
      first.result.current.setWorkDurationMinutes(10);
      first.result.current.toggle();
    });

    expect(storedPomodoro().endsAt).toBe(new Date('2026-06-02T10:10:00.000Z').getTime());
    first.unmount();

    vi.setSystemTime(new Date('2026-06-02T10:04:00.000Z'));
    const second = renderHook(() => usePomodoro());

    expect(second.result.current.state.isRunning).toBe(true);
    expect(second.result.current.state.timeLeft).toBe(6 * 60);
  });

  it('alterar a duracao durante a pausa nao perturba o timer da pausa em curso (SF-2)', () => {
    const { result } = renderHook(() => usePomodoro());

    // Sessao de 1 min, inicia e expira -> transita para pausa (isBreak=true)
    act(() => {
      result.current.setWorkDurationMinutes(1);
      result.current.toggle();
    });
    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(result.current.state.isBreak).toBe(true);
    const breakTimeLeft = result.current.state.timeLeft;

    // Durante a pausa o utilizador ajusta a proxima sessao de trabalho
    act(() => {
      result.current.setWorkDurationMinutes(45);
    });

    // A nova duracao fica guardada, mas a pausa em curso nao e tocada
    expect(result.current.state.workDurationMinutes).toBe(45);
    expect(result.current.state.timeLeft).toBe(breakTimeLeft);
    expect(result.current.state.isBreak).toBe(true);
  });

  it('completa sessao vencida apos remount e toca alarme uma vez', () => {
    const first = renderHook(() => usePomodoro());

    act(() => {
      first.result.current.setWorkDurationMinutes(1);
      first.result.current.toggle();
    });
    first.unmount();

    vi.setSystemTime(new Date('2026-06-02T10:02:00.000Z'));
    const second = renderHook(() => usePomodoro());

    expect(second.result.current.state.isRunning).toBe(false);
    expect(second.result.current.state.isBreak).toBe(true);
    expect(second.result.current.state.sessionsToday).toBe(1);
    expect(FakeAudioContext.createOscillatorSpy).toHaveBeenCalledTimes(6);
  });
});
