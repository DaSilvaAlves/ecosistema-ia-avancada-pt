'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import type { Account, Card } from '@/types/db';

/**
 * Nexus v2 — CardsList (Story 3.5 — CRUD cartões de crédito, FR18)
 *
 * Lista dos cartões de crédito. Suporta o Read/Update/Delete do CRUD: cada
 * linha tem acções "Editar" e "Apagar". Padrão herdado de `TransactionsList`
 * (Story 3.3).
 *
 * NÃO é a vista de cartões (fatura corrente + próxima fatura + prestações) —
 * essa é a Story 3.8 (FR18/FR19). Esta lista é deliberadamente simples: nome,
 * conta associada, dias de fecho/vencimento e limite.
 */

interface CardsListProps {
  cards: Card[];
  accounts: Account[];
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
}

export function CardsList({ cards, accounts, onEdit, onDelete }: CardsListProps): React.ReactElement {
  // Lookup O(1) de nome de conta por id (a conta pode ter sido eliminada —
  // referência órfã schema-válida — nesse caso mostra-se "Conta desconhecida").
  const accountNameById = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  return (
    <ul
      aria-label="Lista de cartões"
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {cards.map((c) => (
        <CardRow
          key={c.id}
          card={c}
          accountName={accountNameById.get(c.accountId) ?? 'Conta desconhecida'}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface CardRowProps {
  card: Card;
  accountName: string;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
}

function CardRow({ card, accountName, onEdit, onDelete }: CardRowProps): React.ReactElement {
  const limitText = card.limit === null ? 'Sem limite' : formatCurrency(card.limit);

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
          {card.name}
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
          {accountName} · Fecha dia {card.closingDay} · Vence dia {card.dueDay}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: card.limit === null ? '#8892A4' : '#F0F4FF',
          flexShrink: 0,
        }}
      >
        {limitText}
      </span>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(card)}
          aria-label={`Editar cartão ${card.name}`}
          style={rowButtonStyle('#00F5FF')}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          aria-label={`Apagar cartão ${card.name}`}
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
