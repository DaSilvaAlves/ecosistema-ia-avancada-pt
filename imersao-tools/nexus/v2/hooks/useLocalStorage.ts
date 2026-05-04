'use client';

import { useState, useCallback } from 'react';

/**
 * Nexus v2 — useLocalStorage hook (portado de v1 `src/hooks/useLocalStorage.ts`)
 *
 * Uso restrito (ADR-2): apenas para `auth.session`, `ui.theme`, `chat.draft` (<100KB combinado).
 * Datasets de negócio (tarefas, finanças, hábitos, diário, conhecimento) vão para
 * IndexedDB via Dexie (`@/lib/db/client`) — NUNCA aqui.
 *
 * SSR-safe: lê localStorage apenas em primeira render no client (lazy initial state).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
        } catch (error) {
          console.error(`Failed to save to localStorage key "${key}":`, error);
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue];
}
