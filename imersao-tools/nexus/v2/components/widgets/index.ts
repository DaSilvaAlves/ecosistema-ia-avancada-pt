/**
 * Nexus v2 — Widgets registry (Story 0.8)
 *
 * NÃO portados (eliminados conforme PRD §2.1 + UX-4 + AUTO-DECISION @po):
 *  - BriefingWidget (órfão v1)
 *  - FeedWidget (órfão v1)
 *  - MorningBriefingWidget (substituído por mensagem `pinned` no chat — Epic 1)
 *
 * Markets fica no TOPO da sidebar (UX-4).
 */
export { GreetingWidget } from './GreetingWidget';
export { MarketsWidget } from './MarketsWidget';
export { PomodoroWidget } from './PomodoroWidget';
export { GitHubWidget } from './GitHubWidget';
export { QuickLinksWidget } from './QuickLinksWidget';
export { GoodnightWidget } from './GoodnightWidget';
export { WidgetCard } from './WidgetCard';
export { SidebarWidgets } from './SidebarWidgets';
