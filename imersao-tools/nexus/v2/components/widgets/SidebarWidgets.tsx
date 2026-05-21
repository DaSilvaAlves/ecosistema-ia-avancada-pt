'use client';

import { GreetingWidget } from './GreetingWidget';
import { MarketsWidget } from './MarketsWidget';
import { PomodoroWidget } from './PomodoroWidget';
import { GitHubWidget } from './GitHubWidget';
import { QuickLinksWidget } from './QuickLinksWidget';
import { GoodnightWidget } from './GoodnightWidget';
import { useFinancasInit } from '@/hooks/useFinancasInit';

/**
 * Nexus v2 — SidebarWidgets composer (Story 0.8)
 *
 * Ordem CORRECTA conforme front-end-spec-v2.md §3.1 + UX-4:
 *  1. Greeting + clock
 *  2. Markets (TOPO destaque per UX-4 — substitui MorningBriefingWidget v1)
 *  3. Pomodoro
 *  4. GitHub events
 *  5. Quick Links
 *  6. Goodnight (condicional — só entre 22h-5h)
 *
 * Story 3.2 (AC5): `useFinancasInit` é montado aqui — client component que
 * renderiza sempre na page de entrada da app autenticada. Semeia as 10
 * categorias default PT no IndexedDB local, one-shot por sessão. Padrão
 * herdado de `useRecurrenceEngine` (Story 2.7), montado em `tarefas/page.tsx`.
 */
export function SidebarWidgets(): React.ReactElement {
  useFinancasInit();

  return (
    <>
      <GreetingWidget />
      <MarketsWidget />
      <PomodoroWidget />
      <GitHubWidget />
      <QuickLinksWidget />
      <GoodnightWidget />
    </>
  );
}
