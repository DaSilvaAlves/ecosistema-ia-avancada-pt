'use client';

import { useEffect, useState } from 'react';

/**
 * Nexus v2 — useOnlineStatus hook (Story 9.5 AC1)
 *
 * Fonte única de verdade para saber se a app está online ou offline. Devolve
 * `true` quando online, `false` quando offline. Reutilizado pelo `Header`
 * (indicador honesto, AC2) e pelo `OfflineBanner` (AC3).
 *
 * SSR-safe (sem hydration mismatch): o `useState` initializer devolve SEMPRE
 * `true` — exactamente o que o servidor renderiza (no server `navigator` não
 * existe, logo o markup HTML assume online). Ler `navigator.onLine` no
 * initializer causaria divergência: se o cliente montasse offline, o primeiro
 * render do cliente (`false`) não bateria certo com o markup do server (`true`)
 * = hydration mismatch do React. A leitura real de `navigator.onLine` faz-se
 * DENTRO do `useEffect` (que só corre no cliente, depois da hidratação), via
 * `setOnline(navigator.onLine)` no mount + os listeners. Isto evita o mismatch
 * e, para o caso comum (online), não há sequer re-render.
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
  // Initializer devolve SEMPRE `true` para alinhar com o render do servidor
  // (markup HTML assume online) — evita hydration mismatch. A leitura real de
  // `navigator.onLine` acontece no `useEffect` abaixo (só corre no cliente).
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    // Leitura real de `navigator.onLine` no mount, já no cliente pós-hidratação —
    // sincroniza o estado se a app montou offline (o initializer assumiu `true`).
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
