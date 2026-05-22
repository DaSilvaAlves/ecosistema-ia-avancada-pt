'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import { splitInstallmentAmount } from '@/lib/financas/installmentSplit';
import type { Card, Installment } from '@/types/db';

/**
 * Nexus v2 — InstallmentsList (Story 3.6 — Compras parceladas, FR19)
 *
 * Lista das compras parceladas. Suporta o Read/Delete do CRUD (sem Editar —
 * Story 3.6 [AUTO-DECISION] A6: para alterar uma parcelada, apagar e
 * recriar). Padrão herdado de `CardsList` (Story 3.5).
 *
 * Cada linha mostra: descrição, nome do cartão (lookup; "Cartão desconhecido"
 * se a referência for órfã), "N× de €X,XX" (valor por parcela; se não-divisível,
 * indica a primeira parcela), valor total e data de início em formato PT-PT.
 *
 * NÃO é a vista de cartões (fatura corrente + próxima fatura — Story 3.8);
 * apenas a lista do CRUD.
 */

interface InstallmentsListProps {
  installments: Installment[];
  cards: Card[];
  onDelete: (id: string) => void;
}

export function InstallmentsList({
  installments,
  cards,
  onDelete,
}: InstallmentsListProps): React.ReactElement {
  // Lookup O(1) de nome de cartão por id — o cartão pode ter sido apagado
  // após a parcelada ter sido criada (referência órfã schema-válida).
  const cardNameById = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const c of cards) map.set(c.id, c.name);
    return map;
  }, [cards]);

  return (
    <ul
      aria-label="Lista de compras parceladas"
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {installments.map((i) => (
        <InstallmentRow
          key={i.id}
          installment={i}
          cardName={cardNameById.get(i.cardId) ?? 'Cartão desconhecido'}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface InstallmentRowProps {
  installment: Installment;
  cardName: string;
  onDelete: (id: string) => void;
}

function InstallmentRow({
  installment,
  cardName,
  onDelete,
}: InstallmentRowProps): React.ReactElement {
  // Calcula o valor por parcela uma vez (split é puro e barato). Se a divisão
  // for exacta, todas as parcelas são iguais; senão, mostra a primeira (a maior).
  const parcels = splitInstallmentAmount(
    installment.totalAmount,
    installment.installments,
  );
  const first = parcels[0];
  const last = parcels[parcels.length - 1];
  const parcelText =
    first === last
      ? `${installment.installments}× de ${formatCurrency(first)}`
      : `${installment.installments}× de ${formatCurrency(last)} (1ª: ${formatCurrency(first)})`;

  const dateText = formatStartDatePT(installment.startDate);

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
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}
      >
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
          {installment.description}
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
          {cardName} · {parcelText} · Início {dateText}
        </span>
      </div>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#F0F4FF',
          flexShrink: 0,
        }}
      >
        {formatCurrency(installment.totalAmount)}
      </span>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onDelete(installment.id)}
          aria-label={`Apagar compra parcelada ${installment.description}`}
          style={rowButtonStyle('#FF006E')}
        >
          Apagar
        </button>
      </div>
    </li>
  );
}

/**
 * Formata uma data ISO `YYYY-MM-DD` em PT-PT `DD/MM/AAAA` (regra
 * `language-standards.md`). Não usa `toLocaleDateString` para evitar
 * dependência do ICU/locale do runtime.
 */
function formatStartDatePT(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
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
