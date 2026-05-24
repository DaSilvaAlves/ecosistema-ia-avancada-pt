'use client';

import type { ReactElement, ReactNode } from 'react';
import { useDailyGenerationEngine } from '@/hooks/useDailyGenerationEngine';

/**
 * Nexus v2 — DailyEngineProvider (Story 3.10 / AC5)
 *
 * Client wrapper que activa o motor diário de geração de recorrências
 * (`useDailyGenerationEngine`) uma única vez para toda a app autenticada.
 *
 * Pass-through: renderiza `{children}` sem envolvê-los visualmente — não
 * adiciona div, semantic element, nem estilo. O `{children}` continua a poder
 * ser server components (Next.js 14+ permite a mistura quando o provider é
 * o único client component no caminho).
 *
 * Padrão consistente com a documentação Next.js para providers de auth/theme
 * em layouts server.
 *
 * Trace: Story 3.10 AC5 + AC6 + [AUTO-DECISION] A8.
 */
export function DailyEngineProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  useDailyGenerationEngine();
  return <>{children}</>;
}
