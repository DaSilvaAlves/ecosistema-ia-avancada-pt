/**
 * Nexus v2 — Helper de formatação monetária PT-PT (Story 3.1)
 *
 * [AUTO-DECISION] A2 (ratificada @po) — criado nesta story de schema, em
 * `lib/financas/` (camada de dados, função pura, sem dependência de React/DOM).
 * Resolve o risco R3 do EPIC-3.md ("formato monetário inconsistente entre
 * vistas"): ponto único de verdade para todas as vistas de UI (Stories
 * 3.3/3.7/3.8/3.9).
 *
 * Formato-alvo: `€1.234,56` — símbolo `€` prefixado, ponto como separador de
 * milhar, vírgula como separador decimal (convenção PT-PT — ver
 * language-standards.md).
 *
 * NOTA: nem `Intl.NumberFormat('pt-PT', ...)` nem `Number.toLocaleString('pt-PT')`
 * produzem o formato-alvo. Ambos usam espaço (non-breaking space) como
 * separador de milhar e — no caso de `NumberFormat` currency — sufixam o
 * símbolo (`1 234,56 €`). O AC5 do Epic 3 exige `€1.234,56` (símbolo
 * prefixado, ponto separador de milhar). A formatação manual abaixo agrupa
 * os milhares com ponto de forma determinística, independente do ICU/locale
 * do runtime.
 */

/**
 * Insere um ponto como separador de milhar num inteiro não-negativo.
 * Ex: `12345` → `'12.345'`, `100` → `'100'`.
 */
function groupThousands(value: number): string {
  const digits = String(value);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      result += '.';
    }
    result += digits[i];
  }
  return result;
}

/**
 * Formata um inteiro em cêntimos para uma string monetária PT-PT.
 *
 * Zero-safe: `formatCurrency(0) === '€0,00'`.
 * Negativo-safe: `formatCurrency(-100) === '-€1,00'` (o sinal precede o `€`).
 *
 * @param cents - Montante inteiro em cêntimos (ex: 123456 → €1.234,56).
 * @returns String no formato `€1.234,56` (ou `-€1.234,56` para negativos).
 */
export function formatCurrency(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const euros = Math.floor(abs / 100);
  const centavos = abs % 100;
  const formatted = groupThousands(euros) + ',' + String(centavos).padStart(2, '0');
  return (negative ? '-' : '') + '€' + formatted;
}
