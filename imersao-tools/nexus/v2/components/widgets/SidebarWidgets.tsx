'use client';

import { GreetingWidget } from './GreetingWidget';
import { MarketsWidget } from './MarketsWidget';
import { PomodoroWidget } from './PomodoroWidget';
import { GitHubWidget } from './GitHubWidget';
import { QuickLinksWidget } from './QuickLinksWidget';
import { GoodnightWidget } from './GoodnightWidget';

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
 */
export function SidebarWidgets(): React.ReactElement {
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
