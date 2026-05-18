/**
 * Nexus v2 — Tarefas colours (Story 2.9 / D3 do Epic 2)
 *
 * Extrai paletas `PRIORITY_COLORS`, `STATUS_COLORS`, `PRIORITY_LABELS` e
 * `STATUS_LABELS` para um único módulo partilhado entre `TaskRow` (Story 2.3),
 * `KanbanCard` (Story 2.4) e `ProjectTaskRow` (Story 2.9).
 *
 * D3 ratificada na Story 2.9 — criação de `ProjectTaskRow.tsx` motivou a
 * extracção. As constantes mantêm exactamente o mesmo shape e valores das
 * versões inline para garantir zero alteração visual nos consumidores
 * existentes.
 *
 * NOTA Story 2.9: este ficheiro é introduzido pela 2.9 mas mantido isolado
 * da Story 2.3/2.4 — `TaskRow.tsx` e `KanbanCard.tsx` continuam a usar as
 * versões inline existentes (zero modificação para não quebrar T1-T12 de 2.3
 * e Story 2.4). A consolidação completa fica para um closure commit do Epic 2.
 */
import type { Task } from '@/types/db';

export type TaskPriorityValue = Task['priority'];
export type TaskStatusValue = Task['status'];

export interface BadgePalette {
  bg: string;
  border: string;
  text: string;
}

export const PRIORITY_LABELS_PT: Record<TaskPriorityValue, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const STATUS_LABELS_PT: Record<TaskStatusValue, string> = {
  todo: 'Por fazer',
  'in-progress': 'Em curso',
  blocked: 'Bloqueada',
  done: 'Feita',
};

export const PRIORITY_COLORS: Record<TaskPriorityValue, BadgePalette> = {
  high: { bg: 'rgba(255, 0, 110, 0.12)', border: 'rgba(255, 0, 110, 0.3)', text: '#FF006E' },
  medium: { bg: 'rgba(0, 245, 255, 0.1)', border: 'rgba(0, 245, 255, 0.25)', text: '#00F5FF' },
  low: { bg: 'rgba(136, 146, 164, 0.12)', border: 'rgba(136, 146, 164, 0.3)', text: '#8892A4' },
};

export const STATUS_COLORS: Record<TaskStatusValue, BadgePalette> = {
  todo: { bg: 'rgba(0, 245, 255, 0.08)', border: 'rgba(0, 245, 255, 0.2)', text: '#00F5FF' },
  'in-progress': { bg: 'rgba(255, 184, 0, 0.1)', border: 'rgba(255, 184, 0, 0.25)', text: '#FFB800' },
  blocked: { bg: 'rgba(255, 0, 110, 0.1)', border: 'rgba(255, 0, 110, 0.25)', text: '#FF006E' },
  done: { bg: 'rgba(57, 255, 20, 0.08)', border: 'rgba(57, 255, 20, 0.2)', text: '#39FF14' },
};

/**
 * Ordem canónica das secções de status na vista Lista do projecto (Story 2.9 AC4).
 * Mantém alinhamento com `KanbanBoard` (Story 2.4 L48-51).
 */
export const STATUS_SECTION_ORDER: ReadonlyArray<TaskStatusValue> = [
  'todo',
  'in-progress',
  'blocked',
  'done',
];

/**
 * Helper para gerar style de badge com a paleta fornecida.
 * Mantém shape idêntico a `badgeStyle` em `TaskRow.tsx:58-73` para consistência visual.
 */
export function badgeStyle(palette: BadgePalette): React.CSSProperties {
  return {
    display: 'inline-block',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '0.2rem 0.55rem',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: palette.text,
    borderRadius: 20,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}
