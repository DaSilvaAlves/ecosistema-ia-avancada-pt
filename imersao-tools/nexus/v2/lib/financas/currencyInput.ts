/**
 * Nexus v2 — Helpers de entrada/edição monetária PT-PT (Story 3.3)
 *
 * `formatCurrency` (Story 3.1) faz cêntimos → string de **display** (`€1.234,56`).
 * Este módulo faz o sentido de **entrada**: a string que o utilizador digita no
 * formulário de transação ↔ cêntimos inteiros, mais a conversão direção↔sinal.
 *
 * Contrato monetário (igual a `formatCurrency.ts`):
 *   - Os montantes vivem sempre como inteiros em cêntimos.
 *   - `Transaction.amount` codifica a direção no **sinal**: negativo = saída
 *     (despesa), positivo = entrada (receita) — ver `types/db.ts:117`.
 *
 * Convenção de formato PT-PT (`language-standards.md`): ponto `.` é separador de
 * milhar, vírgula `,` é separador decimal. `12,34` são doze euros e trinta e
 * quatro cêntimos; `1.234` são mil duzentos e trinta e quatro euros.
 */

/** Direção de uma transação variável — codificada no sinal de `amount`. */
export type Direction = 'saida' | 'entrada';

/**
 * Converte uma string de euros em formato PT-PT para cêntimos inteiros
 * não-negativos. O sinal (direção) é aplicado depois, por `applyDirection`.
 *
 * Aceita a forma agrupada (`1.234,56`) e a forma plana (`1234,56`, `1234`).
 * O parsing é feito por manipulação de string — nunca por aritmética de
 * vírgula flutuante — para garantir cêntimos exactos.
 *
 * Exemplos:
 *   parseCurrencyInput('78,70')     → 7870
 *   parseCurrencyInput('1.234,56')  → 123456
 *   parseCurrencyInput('100')       → 10000
 *   parseCurrencyInput('1234,5')    → 123450
 *
 * @param input - String digitada pelo utilizador (euros, formato PT-PT).
 * @returns Montante inteiro em cêntimos, não-negativo.
 * @throws {Error} Se a string for vazia, mal-formada, negativa ou demasiado grande.
 */
export function parseCurrencyInput(input: string): number {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('Valor inválido — introduz um montante (ex: 12,34).');
  }

  // Forma agrupada: 1-3 dígitos + grupos de milhar `.NNN` + decimais opcionais.
  const GROUPED = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/;
  // Forma plana: dígitos sem agrupamento + decimais opcionais.
  const PLAIN = /^\d+(,\d{1,2})?$/;
  if (!GROUPED.test(trimmed) && !PLAIN.test(trimmed)) {
    throw new Error(
      `Valor inválido (${input}) — usa o formato euro PT-PT, ex: 1.234,56.`,
    );
  }

  const noThousands = trimmed.replace(/\./g, '');
  const [intPart, decPart = ''] = noThousands.split(',');
  const euros = Number(intPart);
  const centavos = Number(decPart.padEnd(2, '0'));
  const cents = euros * 100 + centavos;

  if (!Number.isSafeInteger(cents)) {
    throw new Error(`Valor inválido (${input}) — montante demasiado grande.`);
  }
  return cents;
}

/**
 * Converte cêntimos inteiros para a string editável do campo Valor (sem o
 * símbolo `€` e sem sinal). Usada para pré-preencher o formulário em modo `edit`.
 *
 * Exemplos: `centsToInputValue(7870)` → `'78,70'`; `centsToInputValue(0)` → `'0,00'`.
 *
 * @param cents - Montante inteiro em cêntimos, não-negativo (a magnitude).
 * @returns String editável no formato `euros,cc`.
 * @throws {Error} Se `cents` não for um inteiro seguro não-negativo.
 */
export function centsToInputValue(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(
      `Montante inválido (${cents}) — centsToInputValue espera cêntimos inteiros não-negativos.`,
    );
  }
  const euros = Math.floor(cents / 100);
  const centavos = cents % 100;
  return `${euros},${String(centavos).padStart(2, '0')}`;
}

/**
 * Aplica a direção a uma magnitude em cêntimos, produzindo o `amount` assinado
 * de `Transaction`: saída → negativo, entrada → positivo.
 *
 * @param cents - Magnitude inteira não-negativa em cêntimos (de `parseCurrencyInput`).
 * @param direction - `'saida'` (despesa) ou `'entrada'` (receita).
 * @returns `Transaction.amount` com o sinal correcto.
 * @throws {Error} Se `cents` não for um inteiro seguro não-negativo.
 */
export function applyDirection(cents: number, direction: Direction): number {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(
      `Cêntimos inválidos (${cents}) — applyDirection espera inteiro não-negativo.`,
    );
  }
  // Magnitude zero → `+0` em ambas as direções. Sem esta guarda, `-cents`
  // produziria `-0` (negative zero) para uma saída de valor zero, um valor
  // indesejável em `Transaction.amount` (`directionOf(-0)` daria 'entrada').
  if (cents === 0) return 0;
  return direction === 'saida' ? -cents : cents;
}

/**
 * Infere a direção a partir de um `amount` assinado — usada no modo `edit` do
 * formulário para pré-seleccionar o seletor de direção.
 *
 * `amount` zero é tratado como entrada (positivo) — convenção consistente com
 * `applyDirection('entrada')`, que produz `0` para uma magnitude zero.
 *
 * @param amount - `Transaction.amount` (cêntimos assinados).
 * @returns `'saida'` se negativo, `'entrada'` caso contrário.
 */
export function directionOf(amount: number): Direction {
  return amount < 0 ? 'saida' : 'entrada';
}
