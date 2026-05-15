'use client';

import { useEffect, useState } from 'react';

/**
 * Nexus v2 — useDebounced (Story 2.3 / AC4)
 *
 * Hook genérico para debounce de valor (typing em input de pesquisa).
 * Default 200ms conforme AC4 da Story 2.3 (não outro valor inventado).
 */

export function useDebounced<T>(value: T, delayMs: number = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
