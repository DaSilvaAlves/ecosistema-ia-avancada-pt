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
 * Story 3.1 Iter 2 (CodeRabbit #9) — falha fast em input não-finito. `Math.trunc`
 * propaga silenciosamente `NaN`/`Infinity` (`Math.trunc(NaN) → NaN`), o que
 * produziria saídas absurdas como `€NaN,NaN`. O contrato é cêntimos-inteiro:
 * `NaN`, `Infinity` e valores não-inteiros são rejeitados explicitamente.
 *
 * Story 3.1 Iter 3 (CodeRabbit #2) — usa `Number.isSafeInteger`, não
 * `Number.isInteger`. `Number.isInteger` retorna `true` para valores fora do
 * intervalo seguro IEEE-754 (`> Number.MAX_SAFE_INTEGER`), onde a aritmética
 * euro/cêntimo (`Math.floor`, `%`) perde precisão silenciosamente.
 * `Number.isSafeInteger` rejeita esses valores, garantindo exactidão monetária.
 *
 * @param cents - Montante inteiro em cêntimos (ex: 123456 → €1.234,56).
 * @returns String no formato `€1.234,56` (ou `-€1.234,56` para negativos).
 * @throws {Error} Se `cents` não for um inteiro seguro finito.
 */
export function formatCurrency(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new Error(
      `Montante inválido (${cents}) — formatCurrency exige um inteiro em cêntimos`,
    );
  }
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const centavos = abs % 100;
  const formatted = groupThousands(euros) + ',' + String(centavos).padStart(2, '0');
  return (negative ? '-' : '') + '€' + formatted;
}
