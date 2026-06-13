'use client';

import {
  SYSTEM_AREA_ID,
  INBOX_NOTEBOOK_ID,
} from '@/lib/brain-dump/approval-persistencia';

/**
 * Nexus v2 — SystemEntityGuard (Story 5.9 — C3 / [D-5.9-SYSTEM-ENTITY-VISIBILITY])
 *
 * Guard das entidades de sistema do Conhecimento. A área "Sistema"
 * (`SYSTEM_AREA_ID`) e o caderno "Caixa de entrada" (`INBOX_NOTEBOOK_ID`) são
 * criados pelo approval flow do Brain Dump (Story 5.8) com UUIDs determinísticos
 * de contrato. São **visíveis** na árvore de Conhecimento (Opção A ratificada,
 * Architect Gate 13/06/2026) mas **não-elimináveis E não-renomeáveis** — o brain
 * dump reencontra-os por id, e elimina-los apagaria conteúdo real do utilizador
 * (as ideias soltas vivem no `_inbox`).
 *
 * A tag de sistema `decisao` (`DECISAO_TAG_ID`) NÃO é guardada aqui — a gestão de
 * tags é do Epic 2 e esta story nunca apaga tags (C4). Aparece no picker como
 * qualquer outra tag (AC14).
 *
 * Os helpers puros (`isSystemArea`/`isSystemNotebook`) são a fonte de verdade dos
 * guards, testados isoladamente (T11). O componente `SystemEntityGuard` é um
 * wrapper apresentacional que desactiva os seus filhos (botões de eliminar/editar)
 * quando a entidade é de sistema, com tooltip PT-PT.
 *
 * Edge/browser-safe (NFR5): só importa as constantes da 5.8 — sem Dexie, sem
 * `@anthropic-ai/sdk`.
 */

/** Verdade-única do guard de área de sistema (testável isoladamente — T11). */
export function isSystemArea(areaId: string): boolean {
  return areaId === SYSTEM_AREA_ID;
}

/** Verdade-única do guard de caderno de sistema (testável isoladamente — T11). */
export function isSystemNotebook(notebookId: string): boolean {
  return notebookId === INBOX_NOTEBOOK_ID;
}

interface SystemEntityGuardProps {
  /** `true` quando a entidade é de sistema (deriva de `isSystemArea`/`isSystemNotebook`). */
  isSystem: boolean;
  /** Tooltip PT-PT mostrado quando bloqueado (ex: "Área de sistema"). */
  tooltip: string;
  /**
   * Render-prop: recebe `disabled` (true para sistema) e o `tooltip` (string vazia
   * quando não-sistema). O consumidor aplica-os ao(s) seu(s) controlo(s) de
   * eliminar/renomear. Manter o controlo no DOM (apenas `disabled`) preserva o
   * layout e a a11y (`aria-disabled` + `title`).
   */
  children: (state: { disabled: boolean; tooltip: string }) => React.ReactNode;
}

export function SystemEntityGuard({
  isSystem,
  tooltip,
  children,
}: SystemEntityGuardProps): React.ReactElement {
  return <>{children({ disabled: isSystem, tooltip: isSystem ? tooltip : '' })}</>;
}
