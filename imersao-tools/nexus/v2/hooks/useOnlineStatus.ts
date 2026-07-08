'use client';

import { useEffect, useState } from 'react';

/**
 * Nexus v2 — useOnlineStatus hook (Story 9.5 AC1)
 *
 * Fonte única de verdade para saber se a app está online ou offline. Devolve
 * `true` quando online, `false` quando offline. Reutilizado pelo `Header`
 * (indicador honesto, AC2) e pelo `OfflineBanner` (AC3).
 *
 * SSR-safe: no servidor `navigator` é `undefined` — assume-se online até o
 * browser confirmar o contrário (mesmo padrão de guarda `typeof ... === 'undefined'`
 * usado em `useLocalStorage.ts` para `window`). Isto evita um flash de "offline"
 * na primeira render antes de o cliente hidratar.
 *
 * Detecção via `navigator.onLine` + eventos nativos `online`/`offline` do `window`.
 * Os listeners são registados no mount e removidos na cleanup do `useEffect` —
 * nunca ficam pendurados após unmount.
 *
 * Nota de fiabilidade (AC10 eixo c): o evento `online` do browser é a fonte de
 * verdade para a reconexão — quando dispara, `setOnline(true)` corre e qualquer
 * consumidor (banner/indicador) sai do estado offline. O indicador nunca fica
 * "preso" em offline após a rede voltar.
 *
 * Trace canónico:
 * - Story 9.5 AC1 — hook `useOnlineStatus` SSR-safe com listeners online/offline
 * - `EPIC-9.md` §5 linha 9.5 / NFR21 — modo offline degradado honesto
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    // Sincroniza no mount — cobre o caso de o estado ter mudado entre o
    // lazy initial state (server → hydrate) e o primeiro effect no cliente.
    setOnline(navigator.onLine);

    const handleOnline = (): void => setOnline(true);
    const handleOffline = (): void => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
