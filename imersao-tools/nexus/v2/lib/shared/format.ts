/**
 * Nexus v2 — Formatadores PT-PT
 *
 * Cêntimos como integers (architecture-v2.md §16 Epic 3 — evita float arithmetic).
 * Format PT-PT só na UI: `€1.234,56`, `14/03/2026`.
 */

/**
 * Formata cêntimos para representação PT-PT em euros.
 *
 * @param cents - Valor em cêntimos (integer). Ex: 7870 → "€78,70".
 * @returns String formatada com símbolo €, separador de milhares por ponto e decimal por vírgula.
 *
 * @example
 *   formatCurrency(7870)    // "€78,70"
 *   formatCurrency(123456)  // "€1.234,56"
 *   formatCurrency(-7870)   // "-€78,70"
 */
export function formatCurrency(cents: number): string {
  if (!Number.isFinite(cents)) return '€0,00';
  const euros = cents / 100;
  const formatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
  // Garante símbolo no início (Intl PT-PT pode pôr no fim em alguns locales)
  return formatted;
}

/**
 * Formata data ISO (YYYY-MM-DD) para representação PT-PT (DD/MM/YYYY).
 *
 * @param iso - Data em formato ISO 8601 (YYYY-MM-DD ou full ISO).
 * @returns String "DD/MM/YYYY" ou string vazia se inválida.
 *
 * @example
 *   formatDate("2026-03-14")               // "14/03/2026"
 *   formatDate("2026-03-14T15:30:00.000Z") // "14/03/2026"
 */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const datePart = iso.split('T')[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

/**
 * Formata data + hora ISO para PT-PT.
 *
 * @example
 *   formatDateTime("2026-03-14T15:30:00.000Z") // "14/03/2026 15:30"
 */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const datePart = formatDate(date.toISOString());
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
}

/**
 * Formata duração em segundos para HH:MM:SS ou MM:SS (se < 1h).
 *
 * @example
 *   formatDuration(125)  // "02:05"
 *   formatDuration(3725) // "01:02:05"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
