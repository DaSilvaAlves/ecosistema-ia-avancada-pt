import type { Account } from '@/types/db';

/**
 * Nexus v2 — Agregações da vista património (Story 3.9 — FR20)
 *
 * Módulo de funções puras (sem Dexie, sem React) que agregam `Account[]` por
 * `type` (checking/savings/cash) e calculam total global. Reutilizável pela
 * Story 3.11 (tool `consultar_balanço` do cérebro multi-intent).
 *
 * Decisão crítica de schema ([AUTO-DECISION] A1): `Account` (types/db.ts:98-104)
 * NÃO tem campo `bankName`. O agrupamento "por banco" resolve-se via
 * `Account.type` com rótulos PT-PT — Constitution Artigo IV (No Invention).
 *
 * Convenções:
 *   - `balance` em cêntimos inteiros (sinal preservado — conta a descoberto
 *     contribui negativamente).
 *   - Ordenação dos grupos: descendente por `Math.abs(subtotalCents)`.
 *   - Ordenação interna: contas dentro do grupo por `balance` descendente
 *     (maior saldo no topo, independentemente do sinal).
 *   - Grupos sem contas são filtrados ([AUTO-DECISION] A5).
 *
 * Trace: Story 3.9 AC1 + AC5 + AC10; padrão `monthAggregations.ts` (Story 3.7).
 */

/** Rótulos PT-PT para `Account.type` — único agrupador disponível no schema. */
export const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  checking: 'Conta à ordem',
  savings: 'Poupança',
  cash: 'Dinheiro',
} as const;

export interface AccountTypeGroup {
  /** Tipo de conta (chave do `Record` em `ACCOUNT_TYPE_LABELS`). */
  type: Account['type'];
  /** Rótulo PT-PT do tipo — ex: `'checking'` → `'Conta à ordem'`. */
  labelPT: string;
  /** Contas do grupo, ordenadas por `balance` desc. */
  accounts: Account[];
  /** `Σ balance` das contas do grupo (com sinal). */
  subtotalCents: number;
  /** Número de contas no grupo (sempre `>= 1` após filtragem). */
  count: number;
}

/**
 * Soma com sinal de todos os `Account.balance`. Pode ser negativo se o
 * utilizador tiver mais contas a descoberto do que saldo positivo.
 *
 * Invariante: `computeTotalPatrimony(accounts) === Σ grupo.subtotalCents`
 * de `aggregateByAccountType(accounts)` para qualquer input.
 *
 * Trace: Story 3.9 AC1 + AC5; [AUTO-DECISION] A6 (sinal preservado).
 */
export function computeTotalPatrimony(accounts: Account[]): number {
  let total = 0;
  for (const a of accounts) total += a.balance;
  return total;
}

/**
 * Agrupa `Account[]` por `type` (3 valores possíveis: checking/savings/cash).
 *
 * - Calcula `subtotalCents` com sinal (conta negativa subtrai).
 * - Filtra grupos sem contas (`count === 0`) — [AUTO-DECISION] A5.
 * - Ordena grupos descendentes por `Math.abs(subtotalCents)` — tipo com maior
 *   peso financeiro absoluto no topo (positivo ou negativo).
 * - Dentro de cada grupo, contas ordenadas por `balance` descendente.
 *
 * Trace: Story 3.9 AC1 + AC4; FR20 ("saldo agregado por banco/conta").
 */
export function aggregateByAccountType(
  accounts: Account[],
): AccountTypeGroup[] {
  const buckets = new Map<Account['type'], AccountTypeGroup>();

  for (const a of accounts) {
    const existing = buckets.get(a.type);
    if (existing) {
      existing.accounts.push(a);
      existing.subtotalCents += a.balance;
      existing.count += 1;
    } else {
      buckets.set(a.type, {
        type: a.type,
        labelPT: ACCOUNT_TYPE_LABELS[a.type],
        accounts: [a],
        subtotalCents: a.balance,
        count: 1,
      });
    }
  }

  // Ordenar contas dentro de cada grupo por balance descendente.
  for (const group of buckets.values()) {
    group.accounts.sort((x, y) => y.balance - x.balance);
  }

  // Filtrar grupos sem contas (defensivo — após o for não há nenhum,
  // mas mantém invariante) e ordenar por |subtotalCents| desc.
  return Array.from(buckets.values())
    .filter((g) => g.count > 0)
    .sort((a, b) => Math.abs(b.subtotalCents) - Math.abs(a.subtotalCents));
}
