'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import type { Category, Transaction } from '@/types/db';

/**
 * Nexus v2 — TransactionsList (Story 3.3 — CRUD transações variáveis, FR16)
 *
 * Lista cronológica básica das transações (mais recente primeiro — a ordenação
 * vem já de `listTransactions`/`useTransactions`). Suporta o Read/Update/Delete
 * do CRUD: cada linha tem acções "Editar" e "Apagar".
 *
 * NÃO é a vista analítica "este mês" (por categoria, por dia, projecção 30
 * dias) — essa é a Story 3.7 (FR21). Esta lista é deliberadamente simples.
 *
 * Distinção visual saída/entrada (AC5): saída (`amount < 0`) em Magenta
 * `#FF006E`, entrada em Lime `#39FF14` — paleta canónica do design system.
 */

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

/** Converte uma data ISO `yyyy-MM-dd` para o formato PT-PT `dd/MM/yyyy`. */
function formatDatePt(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function TransactionsList({
  transactions,
  categories,
  onEdit,
  onDelete,
}: TransactionsListProps): React.ReactElement {
  // Lookup O(1) de cor por nome de categoria (a categoria pode não estar na
  // lista — ex: lista a carregar — nesse caso usa-se um cinzento neutro).
  const colorByCategory = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.name, c.color);
    return map;
  }, [categories]);

  return (
    <ul
      aria-label="Lista de transações"
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {transactions.map((t) => (
        <TransactionRow
          key={t.id}
          transaction={t}
          categoryColor={colorByCategory.get(t.category) ?? '#8892A4'}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  categoryColor: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

function TransactionRow({
  transaction,
  categoryColor,
  onEdit,
  onDelete,
}: TransactionRowProps): React.ReactElement {
  const isSaida = transaction.amount < 0;
  const amountColor = isSaida ? '#FF006E' : '#39FF14';
  const primaryText =
    transaction.description.trim() !== '' ? transaction.description : transaction.category;

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        padding: '0.75rem 1rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: categoryColor,
          flexShrink: 0,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#F0F4FF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {primaryText}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            color: '#8892A4',
            textTransform: 'uppercase',
          }}
        >
          {transaction.category} · {formatDatePt(transaction.date)}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: amountColor,
          flexShrink: 0,
        }}
      >
        {formatCurrency(transaction.amount)}
      </span>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label={`Editar transação ${primaryText}`}
          style={rowButtonStyle('#00F5FF')}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label={`Apagar transação ${primaryText}`}
          style={rowButtonStyle('#FF006E')}
        >
          Apagar
        </button>
      </div>
    </li>
  );
}

function rowButtonStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 600,
    color,
    background: 'transparent',
    border: `1px solid ${color}33`,
    borderRadius: 6,
    padding: '0.35rem 0.6rem',
    cursor: 'pointer',
  };
}
