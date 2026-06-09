import type { Mood } from '@/lib/diario/mood-heatmap';

/**
 * Nexus v2 — Escala de mood do diário `[D-5.3-MOOD-SCALE]` (Story 5.3 — AC4)
 *
 * Decisão `@dev` ratificada nesta story: o mapa mood (1-5) → cor usa
 * **exclusivamente as 5 cores do design system** (`design-system-ia-avancada.md`),
 * uma por nível, ordenadas dos polos semânticos da paleta (Magenta = alerta/pior
 * → Lime = sucesso/melhor), com gold/cyan/purple nos níveis intermédios. O estado
 * "sem entrada" usa um neutro glass distinto dos 5 moods. Nenhuma cor arbitrária.
 *
 * A escala vive aqui (módulo puro partilhado) para o heatmap (`MoodHeatmap`) e o
 * selector de mood (`JournalEntryModal`) usarem a MESMA fonte de verdade — sem
 * cores duplicadas em dois sítios.
 *
 * A11y (não-só-cor, A1 Epic 2): cada mood tem `label` PT-PT; os consumidores
 * incluem o número + label no `aria-label` e na legenda — a ordem do mood nunca é
 * inferível só pelo matiz.
 */

export interface MoodMeta {
  /** Valor numérico do mood (1-5). */
  value: Mood;
  /** Rótulo PT-PT do mood — usado em aria-labels e legenda. */
  label: string;
  /** Cor sólida da paleta do design system (preenchimento da célula/botão). */
  color: string;
  /** Borda da célula/botão (mesma cor da paleta, opacidade total). */
  border: string;
}

/**
 * Mapa mood → meta. Cores **só da paleta** (`design-system-ia-avancada.md`):
 *   1 → Magenta `#FF006E` (alerta/urgência — pior)
 *   2 → Gold    `#FFB800`
 *   3 → Cyan    `#00F5FF`
 *   4 → Purple  `#9D00FF`
 *   5 → Lime    `#39FF14` (sucesso — melhor)
 */
export const MOOD_SCALE: Record<Mood, MoodMeta> = {
  1: { value: 1, label: 'Muito mau', color: '#FF006E', border: '#FF006E' },
  2: { value: 2, label: 'Mau', color: '#FFB800', border: '#FFB800' },
  3: { value: 3, label: 'Neutro', color: '#00F5FF', border: '#00F5FF' },
  4: { value: 4, label: 'Bom', color: '#9D00FF', border: '#9D00FF' },
  5: { value: 5, label: 'Muito bom', color: '#39FF14', border: '#39FF14' },
};

/** Moods por ordem ascendente (1→5) — para iterar selector/legenda. */
export const MOODS: Mood[] = [1, 2, 3, 4, 5];

/** Estado "sem entrada" — neutro glass distinto dos 5 moods (AC4). */
export const NO_ENTRY_STYLE = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
} as const;

/** `YYYY-MM-DD` → `DD/MM/YYYY` (PT-PT) para aria-labels legíveis. */
export function formatPtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
