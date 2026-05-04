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
}

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const STORAGE_KEY = 'nexus_pomodoro';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): PomodoroState {
  if (typeof window === 'undefined') {
    return { timeLeft: WORK_TIME, isRunning: false, isBreak: false, sessionsToday: 0, lastResetDate: todayStr() };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as PomodoroState;
      if (state.lastResetDate !== todayStr()) {
        return {
          timeLeft: WORK_TIME,
          isRunning: false,
          isBreak: false,
          sessionsToday: 0,
          lastResetDate: todayStr(),
        };
      }
      return { ...state, isRunning: false };
    }
  } catch {
    /* ignore */
  }
  return { timeLeft: WORK_TIME, isRunning: false, isBreak: false, sessionsToday: 0, lastResetDate: todayStr() };
}

function playBeep(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* silent fail */
  }
}

export function usePomodoro(): {
  state: PomodoroState;
  toggle: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<PomodoroState>(loadState);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          playBeep();
          if (prev.isBreak) {
            return { ...prev, timeLeft: WORK_TIME, isRunning: false, isBreak: false };
          }
          return {
            ...prev,
            timeLeft: BREAK_TIME,
            isRunning: false,
            isBreak: true,
            sessionsToday: prev.sessionsToday + 1,
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, timeLeft: WORK_TIME, isRunning: false, isBreak: false }));
  }, []);

  return { state, toggle, reset };
}
