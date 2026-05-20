/**
 * Nexus v2 — Paleta canónica de cores de tag (Story 2.6 / A4 + AC10)
 *
 * As 7 cores fixas do design system IA AVANÇADA PT, conforme regra inegociável
 * `.claude/rules/design-system-ia-avancada.md`. Nenhum HEX picker livre — apenas
 * estas opções são oferecidas no `TagFormModal` radio group.
 *
 * Razão da paleta restrita: tokens semânticos do produto (Cyan acção, Magenta
 * alerta, Lime sucesso, etc.). Expor HEX livre violaria a consistência visual
 * inegociável que distingue o produto.
 */

export interface TagPaletteEntry {
  /** Nome técnico em inglês (chave estável — usar em testes e debug) */
  readonly name: string;
  /** Hex token (fonte canónica de cor) */
  readonly hex: string;
  /** Label PT-PT para `aria-label` do radio button */
  readonly label: string;
}

export const TAG_PALETTE: readonly TagPaletteEntry[] = [
  { name: 'Cyan', hex: '#00F5FF', label: 'Cyan' },
  { name: 'Gold', hex: '#FFB800', label: 'Gold' },
  { name: 'Purple', hex: '#9D00FF', label: 'Purple' },
  { name: 'Magenta', hex: '#FF006E', label: 'Magenta' },
  { name: 'Lime', hex: '#39FF14', label: 'Lime' },
  { name: 'White', hex: '#F0F4FF', label: 'Branco' },
  { name: 'Grey', hex: '#8892A4', label: 'Cinzento' },
] as const;

export type TagPaletteColor = (typeof TAG_PALETTE)[number]['hex'];

/**
 * Verifica se uma string corresponde a uma cor da paleta canónica.
 * Útil para fallback defensivo quando a tag tem `color` fora da paleta
 * (tag pré-existente, tag criada por tool cérebro futura, etc.).
 */
export function isPaletteColor(c: string): c is TagPaletteColor {
  return TAG_PALETTE.some((p) => p.hex === c);
}

/**
 * Cor por defeito ao criar uma nova tag (Cyan — acção primária).
 */
export const DEFAULT_TAG_COLOR: TagPaletteColor = '#00F5FF';

/**
 * Lookup do label PT-PT a partir do hex. Devolve o hex bruto se não estiver
 * na paleta (defensivo — tag pré-existente fora da paleta).
 */
export function getColorLabel(hex: string): string {
  const entry = TAG_PALETTE.find((p) => p.hex === hex);
  return entry?.label ?? hex;
}
