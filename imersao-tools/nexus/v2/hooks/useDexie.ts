'use client';

import { useLiveQuery as useDexieLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — Dexie React hooks (Story 0.3)
 *
 * Wrapper sobre `dexie-react-hooks` com tipagem genérica + acesso à `db`.
 * Componentes que usam queries reactivas devem ser marcados `'use client'`.
 *
 * Uso:
 *   const tasks = useLiveQuery(() => db.tasks.toArray(), []);
 *   if (!tasks) return <Skeleton />; // estado loading
 */

export function useLiveQuery<T>(
  query: () => Promise<T> | T,
  deps?: unknown[],
): T | undefined {
  return useDexieLiveQuery<T>(query, deps);
}

/**
 * Re-export `db` para conveniência.
 * Componentes podem fazer `import { useLiveQuery, db } from '@/hooks/useDexie'`.
 */
export { db };
