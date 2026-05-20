import { db } from '@/lib/db/client';
import { TransactionSchema } from '@/lib/db/schemas';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — Repository para `transactions` (Story 3.1)
 *
 * Encapsula acesso à tabela Dexie `transactions` (transações variáveis — FR16).
 * A tabela existe desde version(1); a Story 3.1 entrega a camada de acesso
 * tipada que as Stories 3.3/3.7/3.8 vão consumir. Padrão herdado da Story 2.1.
 *
 * Montantes SEMPRE em cêntimos (inteiros) — `Transaction.amount` negativo é
 * saída, positivo é entrada (types/db.ts:117). Validação Zod aplicada antes
 * de qualquer write.
 */

export interface ListTransactionsOptions {
  accountId?: string;
  cardId?: string;
  category?: string;
  /** Filtro por intervalo de datas ISO (inclusivo em ambos os extremos). */
  dateFrom?: string;
  dateTo?: string;
  recurrenceId?: string;
  installmentId?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 200;

export async function createTransaction(input: Transaction): Promise<Transaction> {
  TransactionSchema.parse(input);
  await db.transactions.add(input);
  return input;
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

/**
 * Lista transações filtradas. Todos os filtros são opcionais e combinam-se
 * em conjunto (AND). Resultado ordenado descendente por `date` (mais recente
 * primeiro). `dateFrom`/`dateTo` definem um intervalo ISO inclusivo.
 *
 * Os índices de version(1)/version(3) (`accountId`, `cardId`, `category`,
 * `date`, `recurrenceId`, `[accountId+date]`, `[cardId+date]`) cobrem estas
 * queries; o filtro composto é aplicado em memória após a leitura para
 * suportar combinações arbitrárias de critérios.
 */
export async function listTransactions(
  opts: ListTransactionsOptions = {},
): Promise<Transaction[]> {
  const {
    accountId,
    cardId,
    category,
    dateFrom,
    dateTo,
    recurrenceId,
    installmentId,
    limit = DEFAULT_LIMIT,
  } = opts;

  const all = await db.transactions.toArray();

  const filtered = all.filter((t) => {
    if (accountId !== undefined && t.accountId !== accountId) return false;
    if (cardId !== undefined && t.cardId !== cardId) return false;
    if (category !== undefined && t.category !== category) return false;
    if (recurrenceId !== undefined && t.recurrenceId !== recurrenceId) return false;
    if (installmentId !== undefined && t.installmentId !== installmentId) return false;
    if (dateFrom !== undefined && t.date < dateFrom) return false;
    if (dateTo !== undefined && t.date > dateTo) return false;
    return true;
  });

  return filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>,
): Promise<void> {
  const updated = await db.transactions.update(id, patch);
  if (updated === 0) {
    throw new Error(`Transação ${id} não encontrada — não foi possível actualizar`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}
