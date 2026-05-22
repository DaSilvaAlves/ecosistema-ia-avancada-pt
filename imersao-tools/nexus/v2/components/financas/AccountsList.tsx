'use client';

import { formatCurrency } from '@/lib/financas/formatCurrency';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — AccountsList (Story 3.5 — CRUD contas bancárias, FR18)
 *
 * Lista das contas bancárias. Suporta o Read/Update/Delete do CRUD: cada
 * linha tem acções "Editar" e "Apagar". Padrão herdado de `TransactionsList`
 * (Story 3.3) / `FinanceRecurrencesList` (Story 3.4).
 *
 * NÃO é a vista património (saldo agregado por banco com drilldown) — essa é
 * a Story 3.9 (FR20). Esta lista é deliberadamente simples.
 *
 * Saldo negativo (conta a descoberto) em Magenta `#FF006E`; saldo não-negativo
 * em branco `#F0F4FF` — paleta canónica do design system.
 */

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  checking: 'Conta à ordem',
  savings: 'Poupança',
  cash: 'Dinheiro',
};

interface AccountsListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountsList({ accounts, onEdit, onDelete }: AccountsListProps): React.ReactElement {
  return (
    <ul
      aria-label="Lista de contas"
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {accounts.map((a) => (
        <AccountRow key={a.id} account={a} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function AccountRow({ account, onEdit, onDelete }: AccountRowProps): React.ReactElement {
  const balanceColor = account.balance < 0 ? '#FF006E' : '#F0F4FF';

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
          {account.name}
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
          {ACCOUNT_TYPE_LABELS[account.type]}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: balanceColor,
          flexShrink: 0,
        }}
      >
        {formatCurrency(account.balance)}
      </span>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(account)}
          aria-label={`Editar conta ${account.name}`}
          style={rowButtonStyle('#00F5FF')}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(account.id)}
          aria-label={`Apagar conta ${account.name}`}
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
