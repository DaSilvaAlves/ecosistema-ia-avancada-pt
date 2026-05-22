/**
 * Nexus v2 — Helpers de entrada para saldo de conta e limite de cartão (Story 3.5)
 *
 * `currencyInput.ts` (Story 3.3) trata a entrada de transações: magnitude
 * não-negativa + direção (saída/entrada) codificada no sinal. Este módulo
 * cobre o domínio contas/cartões (FR18):
 *   - O saldo de uma conta (`Account.balance`) pode ser negativo — uma conta
 *     à ordem pode estar a descoberto. `parseCurrencyInput` só devolve
 *     magnitudes não-negativas, por isso o sinal é aplicado aqui a partir de
 *     um booleano (vindo do seletor "A favor" / "A descoberto" do modal).
 *   - O limite de um cartão (`Card.limit`) é opcional — string vazia → `null`.
 *
 * Contrato monetário (igual a `formatCurrency.ts` / `currencyInput.ts`): os
 * montantes vivem sempre como inteiros em cêntimos; o parsing é por
 * manipulação de string, nunca por aritmética de vírgula flutuante.
 */

import { centsToInputValue, parseCurrencyInput } from '@/lib/financas/currencyInput';

/**
 * Converte a string de euros PT-PT (magnitude) para cêntimos inteiros,
 * aplicando o sinal indicado por `negative`.
 *
 * A magnitude é parseada por `parseCurrencyInput` (não-negativa). Magnitude
 * zero devolve sempre `0` — nunca `-0` — independentemente de `negative`.
 *
 * Exemplos:
 *   parseBalanceInput('1.234,56', false) → 123456
 *   parseBalanceInput('1.234,56', true)  → -123456
 *   parseBalanceInput('0', true)         → 0
 *
 * @param input - String digitada pelo utilizador (euros, formato PT-PT).
 * @param negative - `true` aplica sinal negativo (conta a descoberto).
 * @returns `Account.balance` com o sinal correcto.
 * @throws {Error} Se a string for vazia, mal-formada ou demasiado grande.
 */
export function parseBalanceInput(input: string, negative: boolean): number {
  const magnitude = parseCurrencyInput(input);
  // Magnitude zero → `0` em ambos os sinais. Sem esta guarda, `-magnitude`
  // produziria `-0` (negative zero) para um saldo zero a descoberto.
  if (magnitude === 0) return 0;
  return negative ? -magnitude : magnitude;
}

/**
 * Inverso de `parseBalanceInput` — decompõe um saldo assinado na magnitude
 * editável + flag de sinal, para pré-preencher o formulário em modo `edit`.
 *
 * Exemplos:
 *   balanceToInput(123456) → { magnitude: '1234,56', negative: false }
 *   balanceToInput(-100)   → { magnitude: '1,00', negative: true }
 *   balanceToInput(0)      → { magnitude: '0,00', negative: false }
 *
 * @param cents - `Account.balance` (cêntimos inteiros assinados).
 * @returns Magnitude (string editável) + flag de sinal negativo.
 */
export function balanceToInput(cents: number): { magnitude: string; negative: boolean } {
  return {
    magnitude: centsToInputValue(Math.abs(cents)),
    negative: cents < 0,
  };
}

/**
 * Converte a string de euros PT-PT do campo Limite de cartão para cêntimos,
 * ou `null` quando o campo está vazio (o limite é opcional — `Card.limit`).
 *
 * Exemplos:
 *   parseCardLimit('')         → null
 *   parseCardLimit('   ')      → null
 *   parseCardLimit('2.500,00') → 250000
 *
 * @param input - String digitada (euros, formato PT-PT) ou vazia.
 * @returns Cêntimos inteiros não-negativos, ou `null` se o campo estiver vazio.
 * @throws {Error} Se a string for não-vazia mas mal-formada.
 */
export function parseCardLimit(input: string): number | null {
  return input.trim() === '' ? null : parseCurrencyInput(input);
}
