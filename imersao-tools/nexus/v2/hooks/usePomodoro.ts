'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Nexus v2 — usePomodoro hook (portado de v1 `src/hooks/usePomodoro.ts`)
 *
 * Lógica intacta: 25min trabalho + 5min pausa, sessions resetam diariamente.
 * Storage: localStorage `nexus_pomodoro` (<100KB, dentro do contrato ADR-2).
 *
 * Story 0.8 expande este hook para suportar `taskId` opcional (PomodoroTaskLink UX-4).
 */

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionsToday: number;
  lastResetDate: string;
  workDurationMinutes: number;
  endsAt: number | null;
  alarmSound: AlarmSound;
  alarmDue?: boolean;
}

export type AlarmSound = 'soft' | 'clear' | 'urgent';

const DEFAULT_WORK_MINUTES = 25;
const BREAK_TIME = 5 * 60;
const STORAGE_KEY = 'nexus_pomodoro';
const DEFAULT_ALARM_SOUND: AlarmSound = 'clear';

const ALARM_PATTERNS: Record<AlarmSound, { frequencies: number[]; gap: number; duration: number; volume: number }> = {
  soft: { frequencies: [660, 660, 660], gap: 0.22, duration: 0.18, volume: 0.25 },
  clear: { frequencies: [880, 988, 880, 988, 880, 988], gap: 0.2, duration: 0.28, volume: 0.5 },
  urgent: { frequencies: [1047, 784, 1047, 784, 1047, 784, 1047, 784], gap: 0.16, duration: 0.32, volume: 0.65 },
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function playBeep(sound: AlarmSound): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const pattern = ALARM_PATTERNS[sound];

    pattern.frequencies.forEach((frequency, index) => {
      const offset = index * pattern.gap;
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime?.(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime?.(pattern.volume, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime?.(0.0001, ctx.currentTime + offset + pattern.duration);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + pattern.duration + 0.02);
    });

    setTimeout(() => ctx.close(), (pattern.frequencies.length * pattern.gap + pattern.duration + 0.2) * 1000);
  } catch {
    /* silent fail */
  }
}

function workSeconds(minutes: number): number {
  return minutes * 60;
}

function normalizeWorkDuration(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_WORK_MINUTES;
  return Math.min(180, Math.max(1, Math.round(parsed)));
}

function normalizeAlarmSound(value: unknown): AlarmSound {
  return value === 'soft' || value === 'urgent' || value === 'clear' ? value : DEFAULT_ALARM_SOUND;
}

function baseState(workDurationMinutes = DEFAULT_WORK_MINUTES, alarmSound = DEFAULT_ALARM_SOUND): PomodoroState {
  return {
    timeLeft: workSeconds(workDurationMinutes),
    isRunning: false,
    isBreak: false,
    sessionsToday: 0,
    lastResetDate: todayStr(),
    workDurationMinutes,
    endsAt: null,
    alarmSound,
  };
}

function completeExpiredState(state: PomodoroState): PomodoroState {
  if (state.isBreak) {
    return {
      ...state,
      timeLeft: workSeconds(state.workDurationMinutes),
      isRunning: false,
      isBreak: false,
      endsAt: null,
      alarmDue: true,
    };
  }

  return {
    ...state,
    timeLeft: BREAK_TIME,
    isRunning: false,
    isBreak: true,
    sessionsToday: state.sessionsToday + 1,
    endsAt: null,
    alarmDue: true,
  };
}

function loadState(): PomodoroState {
  if (typeof window === 'undefined') {
    return baseState();
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const raw = JSON.parse(stored) as Partial<PomodoroState>;
      const workDurationMinutes = normalizeWorkDuration(raw.workDurationMinutes);
      const alarmSound = normalizeAlarmSound(raw.alarmSound);
      const state: PomodoroState = {
        ...baseState(workDurationMinutes, alarmSound),
        ...raw,
        workDurationMinutes,
        alarmSound,
        endsAt: typeof raw.endsAt === 'number' ? raw.endsAt : null,
      };
      if (state.lastResetDate !== todayStr()) {
        return baseState(workDurationMinutes, alarmSound);
      }
      if (state.isRunning && state.endsAt !== null) {
        const remaining = Math.ceil((state.endsAt - Date.now()) / 1000);
        if (remaining <= 0) return completeExpiredState(state);
        return { ...state, timeLeft: remaining };
      }
      return { ...state, isRunning: false, endsAt: null };
    }
  } catch {
    /* ignore */
  }
  return baseState();
}

function toStoredState(state: PomodoroState): PomodoroState {
  const { alarmDue: _alarmDue, ...stored } = state;
  return stored;
}

export function usePomodoro(): {
  state: PomodoroState;
  toggle: () => void;
  reset: () => void;
  setWorkDurationMinutes: (minutes: number) => void;
  setAlarmSound: (sound: AlarmSound) => void;
} {
  const [state, setState] = useState<PomodoroState>(loadState);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredState(state)));
  }, [state]);

  useEffect(() => {
    if (!state.alarmDue) return;
    playBeep(state.alarmSound);
    setState((prev) => ({ ...prev, alarmDue: false }));
  }, [state.alarmDue, state.alarmSound]);

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setState((prev) => {
        if (!prev.endsAt) return prev;
        const remaining = Math.ceil((prev.endsAt - Date.now()) / 1000);
        if (remaining <= 0) return completeExpiredState(prev);
        return { ...prev, timeLeft: remaining };
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const toggle = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) {
        return { ...prev, isRunning: false, endsAt: null };
      }

      return {
        ...prev,
        isRunning: true,
        endsAt: Date.now() + prev.timeLeft * 1000,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timeLeft: workSeconds(prev.workDurationMinutes),
      isRunning: false,
      isBreak: false,
      endsAt: null,
    }));
  }, []);

  const setWorkDurationMinutes = useCallback((minutes: number) => {
    const workDurationMinutes = normalizeWorkDuration(minutes);
    setState((prev) => ({
      ...prev,
      workDurationMinutes,
      timeLeft: prev.isRunning || prev.isBreak ? prev.timeLeft : workSeconds(workDurationMinutes),
      endsAt: prev.isRunning ? Date.now() + prev.timeLeft * 1000 : null,
    }));
  }, []);

  const setAlarmSound = useCallback((sound: AlarmSound) => {
    setState((prev) => ({ ...prev, alarmSound: normalizeAlarmSound(sound) }));
  }, []);

  return { state, toggle, reset, setWorkDurationMinutes, setAlarmSound };
}
