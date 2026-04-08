import { useState, useEffect, useCallback, useRef } from 'react';
import type { PomodoroState } from '../types';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): PomodoroState {
  try {
    const stored = localStorage.getItem('nexus_pomodoro');
    if (stored) {
      const state = JSON.parse(stored);
      if (state.lastResetDate !== todayStr()) {
        return { timeLeft: WORK_TIME, isRunning: false, isBreak: false, sessionsToday: 0, lastResetDate: todayStr() };
      }
      return { ...state, isRunning: false };
    }
  } catch { /* ignore */ }
  return { timeLeft: WORK_TIME, isRunning: false, isBreak: false, sessionsToday: 0, lastResetDate: todayStr() };
}

function playBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch { /* silent fail */ }
}

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>(loadState);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('nexus_pomodoro', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setState(prev => {
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, timeLeft: WORK_TIME, isRunning: false, isBreak: false }));
  }, []);

  return { state, toggle, reset };
}
