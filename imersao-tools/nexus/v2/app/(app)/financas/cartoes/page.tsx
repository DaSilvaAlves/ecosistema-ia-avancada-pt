'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useCards } from '@/hooks/useCards';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstallments } from '@/hooks/useInstallments';
import { useTransactions } from '@/hooks/useTransactions';
import {
  aggregateCardTransactions,
  countInstallmentPayments,
  getBillingPeriods,
  type BillingPeriods,
} from '@/lib/financas/cardBilling';
import { splitInstallmentAmount } from '@/lib/financas/installmentSplit';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import { formatDate } from '@/lib/shared/format';
import type { Account, Card, Installment } from '@/types/db';

/**
 * Nexus v2 — Vista "Cartões" (Story 3.8 / FR18 + FR19)
 *
 * Page read-only que mostra, para cada cartão de crédito:
 *   - Fatura corrente (soma de transações no período `[ultimoFecho, proximoFecho-1d]`).
 *   - Próxima fatura (soma de transações no período `[proximoFecho, fechoSeguinte-1d]`).
 *     Inclui automaticamente parcelas de prestações (eager — Story 3.6) via
 *     a query `useTransactions({ cardId, dateFrom, dateTo })`.
 *   - Limite disponível (`card.limit - |totalCorrente|`, se `card.limit !== null`).
 *   - Lista de prestações activas do cartão com barra de progresso.
 *
 * Trace: Story 3.8 ACs 2-9; [AUTO-DECISIONS] A1-A10. Reutiliza `useCards`,
 * `useAccounts`, `useInstallments`, `useTransactions` (Stories 3.1/3.5/3.6).
 * Funções puras de cálculo vivem em `lib/financas/cardBilling.ts` —
 * candidatas a reuso pela Story 3.11 (tool `consultar_balanço`).
 *
 * Story 3.10 [AUTO-DECISION] A2: o `DailyEngineProvider` em
 * `app/(app)/layout.tsx` garante que as transações futuras (recorrentes +
 * prestações) estão materializadas. A page NÃO invoca motor no mount.
 *
 * NÃO modifica `components/ui/Header.tsx` — o link de descoberta vive em
 * `app/(app)/financas/page.tsx` ([AUTO-DECISION] A1).
 *
 * Story 3.8 [AUTO-DECISION] A6 (absorção D-3.5-1): prestações com `cardId`
 * sem correspondência em `useCards()` são omitidas silenciosamente.
 */

const ROOT_STYLE: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#04040A',
  color: '#F0F4FF',
  fontFamily: 'Inter, sans-serif',
};

const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
  padding: '1.5rem 1.5rem 4rem',
};

const SECTION_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  padding: '1.25rem 1.5rem',
  marginTop: '1.5rem',
};

const METRIC_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  padding: '0.9rem 1rem',
};

const METRIC_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#8892A4',
  textTransform: 'uppercase',
};

const METRIC_VALUE_STYLE: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 800,
  marginTop: '0.35rem',
  fontFamily: 'JetBrains Mono, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const METRIC_PERIOD_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#8892A4',
  marginTop: '0.3rem',
};

interface CardSectionProps {
  card: Card;
  account: Account | undefined;
  installments: Installment[];
  reference: Date;
}

function CardSection({
  card,
  account,
  installments,
  reference,
}: CardSectionProps): React.ReactElement {
  const periods: BillingPeriods = useMemo(
    () => getBillingPeriods(card.closingDay, reference),
    [card.closingDay, reference],
  );

  // Story 3.8 AC7 — parcelas de prestações com `installmentId` já estão na
  // tabela `transactions` (eager — Story 3.6). A query `useTransactions` com
  // `cardId+dateFrom+dateTo` inclui-as automaticamente (filtros combinam em
  // AND, não excluem `installmentId`). `limit: 1000` evita o cap default de 200.
  const txCurrent = useTransactions({
    cardId: card.id,
    dateFrom: periods.current.startISO,
    dateTo: periods.current.endISO,
    limit: 1000,
  });
  const txNext = useTransactions({
    cardId: card.id,
    dateFrom: periods.next.startISO,
    dateTo: periods.next.endISO,
    limit: 1000,
  });

  const isLoadingTx = txCurrent === undefined || txNext === undefined;

  const currentTotals = useMemo(
    () => aggregateCardTransactions(txCurrent ?? [], periods.current),
    [txCurrent, periods],
  );
  const nextTotals = useMemo(
    () => aggregateCardTransactions(txNext ?? [], periods.next),
    [txNext, periods],
  );

  // Fatura: valor a pagar = |outflow + inflow| (saídas tipicamente dominam).
  // Para cartão, o "valor da fatura" é o módulo do `totalCents` (soma com sinal).
  const currentAbs = Math.abs(currentTotals.totalCents);
  const nextAbs = Math.abs(nextTotals.totalCents);

  // Limite disponível: `card.limit - |currentAbs|`. Magenta se negativo.
  const limitAvailable =
    card.limit !== null ? card.limit - currentAbs : null;
  const limitColor =
    limitAvailable === null
      ? '#F0F4FF'
      : limitAvailable >= 0
        ? '#39FF14'
        : '#FF006E';

  return (
    <section
      style={SECTION_STYLE}
      aria-labelledby={`card-${card.id}-title`}
    >
      <header style={{ marginBottom: '1rem' }}>
        <h2
          id={`card-${card.id}-title`}
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: '#F0F4FF',
          }}
        >
          {card.name}
        </h2>
        <div
          style={{
            marginTop: '0.3rem',
            color: '#8892A4',
            fontSize: '0.8rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span>
            Conta:{' '}
            <span style={{ color: '#F0F4FF', fontWeight: 600 }}>
              {account?.name ?? 'Conta desconhecida'}
            </span>
          </span>
          <span>
            Vencimento:{' '}
            <span style={{ color: '#F0F4FF', fontWeight: 600 }}>
              dia {card.dueDay}
            </span>
          </span>
        </div>
      </header>

      <section
        aria-label={`Métricas de fatura de ${card.name}`}
        style={{
          display: 'grid',
          gridTemplateColumns: card.limit !== null
            ? 'repeat(3, minmax(0, 1fr))'
            : 'repeat(2, minmax(0, 1fr))',
          gap: '0.75rem',
        }}
      >
        <article style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Fatura corrente</div>
          <div style={{ ...METRIC_VALUE_STYLE, color: '#F0F4FF' }}>
            {isLoadingTx ? '—' : formatCurrency(currentAbs)}
          </div>
          <div style={METRIC_PERIOD_STYLE}>
            {formatDate(periods.current.startISO)} — {formatDate(periods.current.endISO)}
          </div>
        </article>

        <article style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Próxima fatura</div>
          <div style={{ ...METRIC_VALUE_STYLE, color: '#FFB800' }}>
            {isLoadingTx ? '—' : formatCurrency(nextAbs)}
          </div>
          <div style={METRIC_PERIOD_STYLE}>
            {formatDate(periods.next.startISO)} — {formatDate(periods.next.endISO)}
          </div>
        </article>

        {card.limit !== null && (
          <article style={METRIC_CARD_STYLE}>
            <div style={METRIC_LABEL_STYLE}>Limite disponível</div>
            <div style={{ ...METRIC_VALUE_STYLE, color: limitColor }}>
              {limitAvailable !== null
                ? formatCurrency(limitAvailable)
                : '—'}
            </div>
            <div style={METRIC_PERIOD_STYLE}>
              Limite: {formatCurrency(card.limit)}
              {limitAvailable !== null && limitAvailable < 0 && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.6rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    background: 'rgba(255, 0, 110, 0.12)',
                    border: '1px solid rgba(255, 0, 110, 0.3)',
                    color: '#FF006E',
                    padding: '0.1rem 0.5rem',
                    borderRadius: 16,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ultrapassado
                </span>
              )}
            </div>
          </article>
        )}
      </section>

      <CardInstallments
        cardId={card.id}
        installments={installments}
        reference={reference}
      />
    </section>
  );
}

interface CardInstallmentsProps {
  cardId: string;
  installments: Installment[];
  reference: Date;
}

function CardInstallments({
  cardId,
  installments,
  reference,
}: CardInstallmentsProps): React.ReactElement {
  // Story 3.8 AC6 + A6 — apenas prestações deste cartão, ordenadas por startDate asc.
  const cardInstallments = useMemo(
    () =>
      installments
        .filter((i) => i.cardId === cardId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [installments, cardId],
  );

  return (
    <section
      style={{
        marginTop: '1.25rem',
        background: 'rgba(255, 255, 255, 0.018)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        padding: '1rem 1.1rem',
      }}
      aria-label={`Prestações activas`}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#8892A4',
          textTransform: 'uppercase',
        }}
      >
        Prestações activas
      </h3>

      {cardInstallments.length === 0 ? (
        <p
          style={{
            margin: '0.6rem 0 0',
            color: '#8892A4',
            fontSize: '0.85rem',
            fontStyle: 'italic',
          }}
        >
          Sem compras parceladas neste cartão.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: '0.7rem 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
          }}
        >
          {cardInstallments.map((installment) => (
            <InstallmentItem
              key={installment.id}
              installment={installment}
              reference={reference}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface InstallmentItemProps {
  installment: Installment;
  reference: Date;
}

function InstallmentItem({
  installment,
  reference,
}: InstallmentItemProps): React.ReactElement {
  const progress = useMemo(
    () =>
      countInstallmentPayments(
        installment.startDate,
        installment.installments,
        reference,
      ),
    [installment.startDate, installment.installments, reference],
  );

  // Maior parcela (primeira, com cêntimo extra se houver remainder).
  const parcelaMaior = useMemo(
    () => splitInstallmentAmount(installment.totalAmount, installment.installments)[0],
    [installment.totalAmount, installment.installments],
  );

  const progressLabel = `${progress.paid} de ${progress.totalMonths} prestações pagas`;
  const widthPct = progress.totalMonths > 0
    ? Math.round((progress.paid / progress.totalMonths) * 100)
    : 0;

  return (
    <li>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F0F4FF' }}>
          {installment.description || 'Compra parcelada'}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            color: '#8892A4',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(installment.totalAmount)} ·{' '}
          {installment.installments}× de {formatCurrency(parcelaMaior)}
        </span>
      </div>
      <div
        style={{
          marginTop: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <div
          role="progressbar"
          aria-valuenow={progress.paid}
          aria-valuemin={0}
          aria-valuemax={progress.totalMonths}
          aria-label={progressLabel}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${widthPct}%`,
              height: '100%',
              background: '#00F5FF',
              opacity: 0.85,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            color: '#8892A4',
            minWidth: 70,
            textAlign: 'right',
          }}
        >
          {progressLabel}
        </span>
      </div>
    </li>
  );
}

export default function CartoesPage(): React.ReactElement {
  const router = useRouter();
  const cards = useCards();
  const accounts = useAccounts();
  const installments = useInstallments();

  // [AUTO-DECISION] A5 — ordenar cartões por nome alfabético, asc.
  const sortedCards = useMemo(
    () =>
      cards === undefined
        ? undefined
        : [...cards].sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' }),
          ),
    [cards],
  );

  // Referência fixa por mount — uma vista aberta horas a fio não muda de data.
  const reference = useMemo(() => new Date(), []);

  const isLoading = sortedCards === undefined;
  const isEmpty = !isLoading && sortedCards.length === 0;

  return (
    <main style={ROOT_STYLE}>
      <div style={CONTAINER_STYLE}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00F5FF',
                fontSize: '0.8rem',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                padding: 0,
                marginBottom: '0.5rem',
              }}
            >
              ← Voltar
            </button>
            <h1
              lang="pt-PT"
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#F0F4FF',
              }}
            >
              Cartões
            </h1>
            <p
              style={{
                margin: '0.4rem 0 0',
                color: '#8892A4',
                fontSize: '0.8rem',
              }}
            >
              Referência:{' '}
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#F0F4FF',
                  fontWeight: 600,
                }}
              >
                {formatDate(
                  `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}-${String(reference.getDate()).padStart(2, '0')}`,
                )}
              </span>
            </p>
          </div>
        </header>

        {isLoading ? (
          <section
            style={{ ...SECTION_STYLE, marginTop: '2rem' }}
            aria-label="A carregar"
          >
            <p
              style={{
                margin: 0,
                color: '#8892A4',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              A carregar cartões…
            </p>
          </section>
        ) : isEmpty ? (
          <section style={SECTION_STYLE} aria-label="Sem cartões">
            <p
              style={{
                margin: 0,
                color: '#8892A4',
                fontSize: '0.95rem',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              Ainda não tens cartões registados. Adiciona um em{' '}
              <Link
                href="/financas"
                style={{ color: '#00F5FF', textDecoration: 'underline' }}
              >
                Finanças
              </Link>
              .
            </p>
          </section>
        ) : (
          sortedCards.map((card) => (
            <CardSection
              key={card.id}
              card={card}
              account={accounts?.find((a) => a.id === card.accountId)}
              installments={installments ?? []}
              reference={reference}
            />
          ))
        )}
      </div>
    </main>
  );
}
