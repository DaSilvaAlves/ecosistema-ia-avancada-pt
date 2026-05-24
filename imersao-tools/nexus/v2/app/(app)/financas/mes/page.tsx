'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addMonths, format, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import {
  aggregateByCategory,
  aggregateByDay,
  aggregateInOut,
  getMonthBounds,
  getProjectionWindow,
  type CategoryAggregate,
  type DayAggregate,
} from '@/lib/financas/monthAggregations';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import { formatDate } from '@/lib/shared/format';
import type { Category, Transaction } from '@/types/db';

/**
 * Nexus v2 — Vista "Este mês" (Story 3.7 / FR21)
 *
 * Page read-only que mostra:
 *   - Cabeçalho com navegador de mês (prev / next / hoje) + label PT-PT.
 *   - 3 KPIs (Entradas / Saídas / Saldo) com glassmorphism.
 *   - Lista por categoria (Saídas / Entradas com barras horizontais HTML/CSS).
 *   - Lista por dia (cronológica ascendente, "hoje" destacado).
 *   - Projecção 30 dias (KPI + lista compacta com rótulos "Recorrente"/"Prestação").
 *
 * Trace: Story 3.7 ACs 2-10; [AUTO-DECISIONS] A1-A10. Reutiliza `useTransactions`
 * (Story 3.1), `useCategories` (Story 3.2), `useFinanceRecurrenceEngine` (Story
 * 3.4 — motor on-mount, idempotente). As recorrentes futuras (Story 3.4) e as
 * prestações futuras (Story 3.6) já vivem na tabela `transactions` — a janela
 * de 30 dias inclui-as automaticamente.
 *
 * NÃO modifica `components/ui/Header.tsx` — o link de descoberta vive em
 * `app/(app)/financas/page.tsx` ([AUTO-DECISION] A4).
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

const NAV_BUTTON_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#F0F4FF',
  borderRadius: 8,
  width: 36,
  height: 36,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

const TODAY_BUTTON_STYLE: React.CSSProperties = {
  background: 'rgba(0, 245, 255, 0.08)',
  border: '1px solid rgba(0, 245, 255, 0.25)',
  color: '#00F5FF',
  borderRadius: 8,
  padding: '0.4rem 0.85rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.02em',
};

function capitalizeFirst(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatMonthLabel(anchor: Date): string {
  return capitalizeFirst(format(anchor, "MMMM 'de' yyyy", { locale: pt }));
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

interface KpisProps {
  inflowCents: number;
  outflowCents: number;
  netCents: number;
}

function MonthKpis({ inflowCents, outflowCents, netCents }: KpisProps): React.ReactElement {
  const netColor = netCents > 0 ? '#39FF14' : netCents < 0 ? '#FF006E' : '#F0F4FF';
  return (
    <section
      aria-label="Totais do mês"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginTop: '1.5rem',
      }}
    >
      <article
        style={{
          ...SECTION_STYLE,
          marginTop: 0,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8892A4',
            textTransform: 'uppercase',
          }}
        >
          Entradas
        </div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#39FF14',
            marginTop: '0.4rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(inflowCents)}
        </div>
      </article>
      <article style={{ ...SECTION_STYLE, marginTop: 0 }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8892A4',
            textTransform: 'uppercase',
          }}
        >
          Saídas
        </div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#FF006E',
            marginTop: '0.4rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(outflowCents)}
        </div>
      </article>
      <article style={{ ...SECTION_STYLE, marginTop: 0 }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#8892A4',
            textTransform: 'uppercase',
          }}
        >
          Saldo do mês
        </div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: netColor,
            marginTop: '0.4rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(netCents)}
        </div>
      </article>
    </section>
  );
}

interface ByCategoryProps {
  buckets: CategoryAggregate[];
  categories: Category[] | undefined;
}

function MonthByCategory({ buckets, categories }: ByCategoryProps): React.ReactElement {
  const outflows = buckets.filter((b) => b.direction === 'out');
  const inflows = buckets.filter((b) => b.direction === 'in');

  // Total absoluto de cada lado para a percentagem.
  const totalOut = outflows.reduce((s, b) => s + Math.abs(b.sumCents), 0);
  const totalIn = inflows.reduce((s, b) => s + b.sumCents, 0);

  // Máximo absoluto de cada lado para escalar a barra (a categoria maior fica
  // a 100% e as outras proporcionais — destaca melhor a distribuição).
  const maxOut = outflows.length > 0 ? Math.abs(outflows[0].sumCents) : 1;
  const maxIn = inflows.length > 0 ? inflows[0].sumCents : 1;

  function categoryMeta(name: string): { color: string; icon: string } {
    const cat = categories?.find((c) => c.name === name);
    return {
      color: cat?.color ?? '#00F5FF',
      icon: cat?.icon ?? '•',
    };
  }

  if (outflows.length === 0 && inflows.length === 0) {
    return <></>;
  }

  return (
    <section style={SECTION_STYLE} aria-label="Análise por categoria">
      <h2
        style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        Por categoria
      </h2>

      {outflows.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#FF006E',
              textTransform: 'uppercase',
            }}
          >
            Saídas
          </h3>
          <ul
            style={{
              listStyle: 'none',
              margin: '0.5rem 0 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {outflows.map((b) => {
              const meta = categoryMeta(b.category);
              const abs = Math.abs(b.sumCents);
              const pct = totalOut > 0 ? Math.round((abs / totalOut) * 100) : 0;
              const widthPct = maxOut > 0 ? Math.max(2, Math.round((abs / maxOut) * 100)) : 2;
              const label = `${b.category}: ${formatCurrency(abs)}, ${pct}% do total de saídas`;
              return (
                <li key={`out-${b.category}`} style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span aria-hidden style={{ fontSize: '1rem' }}>
                        {meta.icon}
                      </span>
                      <span style={{ fontWeight: 600 }}>{b.category}</span>
                      <span style={{ color: '#8892A4', fontSize: '0.72rem' }}>
                        ({b.count} {b.count === 1 ? 'transação' : 'transações'})
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: '#F0F4FF',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatCurrency(abs)}{' '}
                      <span style={{ color: '#8892A4', fontWeight: 400 }}>· {pct}%</span>
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={label}
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
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
                        background: meta.color,
                        opacity: 0.75,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {inflows.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#39FF14',
              textTransform: 'uppercase',
            }}
          >
            Entradas
          </h3>
          <ul
            style={{
              listStyle: 'none',
              margin: '0.5rem 0 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {inflows.map((b) => {
              const meta = categoryMeta(b.category);
              const pct = totalIn > 0 ? Math.round((b.sumCents / totalIn) * 100) : 0;
              const widthPct = maxIn > 0 ? Math.max(2, Math.round((b.sumCents / maxIn) * 100)) : 2;
              const label = `${b.category}: ${formatCurrency(b.sumCents)}, ${pct}% do total de entradas`;
              return (
                <li key={`in-${b.category}`} style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span aria-hidden style={{ fontSize: '1rem' }}>
                        {meta.icon}
                      </span>
                      <span style={{ fontWeight: 600 }}>{b.category}</span>
                      <span style={{ color: '#8892A4', fontSize: '0.72rem' }}>
                        ({b.count} {b.count === 1 ? 'transação' : 'transações'})
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: '#F0F4FF',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatCurrency(b.sumCents)}{' '}
                      <span style={{ color: '#8892A4', fontWeight: 400 }}>· {pct}%</span>
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={label}
                    style={{
                      marginTop: '0.25rem',
                      width: '100%',
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
                        background: meta.color,
                        opacity: 0.75,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

interface ByDayProps {
  days: DayAggregate[];
}

function MonthByDay({ days }: ByDayProps): React.ReactElement {
  const today = todayISO();
  if (days.length === 0) return <></>;
  return (
    <section style={SECTION_STYLE} aria-label="Análise por dia">
      <h2
        style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        Por dia
      </h2>
      <ul
        style={{
          listStyle: 'none',
          margin: '0.75rem 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {days.map((d) => {
          const isToday = d.dateISO === today;
          const netColor =
            d.netCents > 0 ? '#39FF14' : d.netCents < 0 ? '#FF006E' : '#F0F4FF';
          return (
            <li
              key={d.dateISO}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.55rem 0.75rem',
                borderRadius: 8,
                background: isToday ? 'rgba(57, 255, 20, 0.06)' : 'transparent',
                border: isToday
                  ? '1px solid rgba(57, 255, 20, 0.3)'
                  : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {formatDate(d.dateISO)}
                  {isToday && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.65rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: '#39FF14',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Hoje
                    </span>
                  )}
                </span>
                <span style={{ color: '#8892A4', fontSize: '0.72rem' }}>
                  {d.count} {d.count === 1 ? 'transação' : 'transações'}
                  {' · '}
                  {formatCurrency(d.inflowCents)} / {formatCurrency(d.outflowCents)}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: netColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCurrency(d.netCents)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface ProjectionProps {
  transactions: Transaction[];
}

function MonthProjection({ transactions }: ProjectionProps): React.ReactElement {
  const totals = useMemo(() => aggregateInOut(transactions), [transactions]);
  const days = useMemo(() => aggregateByDay(transactions), [transactions]);

  // Para cada dia, marcar se contém recorrente / prestação.
  const dayFlags = useMemo(() => {
    const flags = new Map<string, { recurrent: boolean; installment: boolean }>();
    for (const t of transactions) {
      const f = flags.get(t.date) ?? { recurrent: false, installment: false };
      if (t.recurrenceId !== null) f.recurrent = true;
      if (t.installmentId !== null) f.installment = true;
      flags.set(t.date, f);
    }
    return flags;
  }, [transactions]);

  const netColor =
    totals.netCents > 0 ? '#39FF14' : totals.netCents < 0 ? '#FF006E' : '#F0F4FF';

  return (
    <section style={SECTION_STYLE} aria-label="Projecção 30 dias">
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            Próximos 30 dias
          </h2>
          <p
            style={{
              margin: '0.25rem 0 0',
              color: '#8892A4',
              fontSize: '0.78rem',
            }}
          >
            Inclui recorrentes e prestações
          </p>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: netColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(totals.netCents)}
        </div>
      </div>

      {days.length === 0 ? (
        <p
          style={{
            margin: '1rem 0 0',
            color: '#8892A4',
            fontSize: '0.88rem',
            fontStyle: 'italic',
          }}
        >
          Nada agendado nos próximos 30 dias.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: '1rem 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {days.map((d) => {
            const flags = dayFlags.get(d.dateISO) ?? { recurrent: false, installment: false };
            const dayNetColor =
              d.netCents > 0 ? '#39FF14' : d.netCents < 0 ? '#FF006E' : '#F0F4FF';
            return (
              <li
                key={d.dateISO}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{formatDate(d.dateISO)}</span>
                  {flags.recurrent && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(157, 0, 255, 0.12)',
                        border: '1px solid rgba(157, 0, 255, 0.3)',
                        color: '#9D00FF',
                        padding: '0.1rem 0.5rem',
                        borderRadius: 16,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Recorrente
                    </span>
                  )}
                  {flags.installment && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(255, 184, 0, 0.12)',
                        border: '1px solid rgba(255, 184, 0, 0.3)',
                        color: '#FFB800',
                        padding: '0.1rem 0.5rem',
                        borderRadius: 16,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Prestação
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    color: dayNetColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatCurrency(d.netCents)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function MesPage(): React.ReactElement {
  const router = useRouter();

  // Story 3.10 AC7 — a chamada a `useFinanceRecurrenceEngine()` foi removida.
  // O motor passa a ser activado uma única vez por dia pelo
  // `<DailyEngineProvider>` em `app/(app)/layout.tsx`. `useTransactions` /
  // `useLiveQuery` reflectem as novas instâncias reactivamente.

  // [AUTO-DECISION] A3 — anchor inicial = primeiro dia do mês actual.
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(new Date()));

  const monthBounds = useMemo(() => getMonthBounds(anchor), [anchor]);
  // [AUTO-DECISION] A5 — janela rolling a partir de hoje (independente do
  // mês exibido). Inicializa uma vez por mount; uma rolling window que
  // mudasse mid-session traria zero valor adicional (o utilizador não fica
  // em /financas/mes horas).
  const projWindow = useMemo(() => getProjectionWindow(new Date()), []);

  const monthTx = useTransactions({
    dateFrom: monthBounds.startISO,
    dateTo: monthBounds.endISO,
  });
  const projTx = useTransactions({
    dateFrom: projWindow.startISO,
    dateTo: projWindow.endISO,
  });
  const categories = useCategories();

  const totals = useMemo(() => aggregateInOut(monthTx ?? []), [monthTx]);
  const byCat = useMemo(() => aggregateByCategory(monthTx ?? []), [monthTx]);
  const byDay = useMemo(() => aggregateByDay(monthTx ?? []), [monthTx]);

  const isCurrentMonth = isSameMonth(anchor, new Date());
  const isLoading = monthTx === undefined;
  const isEmpty = !isLoading && monthTx.length === 0;

  function goPrev(): void {
    setAnchor((a) => addMonths(a, -1));
  }
  function goNext(): void {
    setAnchor((a) => addMonths(a, 1));
  }
  function goToday(): void {
    setAnchor(startOfMonth(new Date()));
  }

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
              Este mês
            </h1>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Mês anterior"
              style={NAV_BUTTON_STYLE}
            >
              ←
            </button>
            <span
              aria-live="polite"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#F0F4FF',
                letterSpacing: '0.02em',
                minWidth: 160,
                textAlign: 'center',
              }}
            >
              {formatMonthLabel(anchor)}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Mês seguinte"
              style={NAV_BUTTON_STYLE}
            >
              →
            </button>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToday}
                aria-label="Voltar ao mês actual"
                style={TODAY_BUTTON_STYLE}
              >
                Hoje
              </button>
            )}
          </div>
        </header>

        {isLoading ? (
          <section style={{ ...SECTION_STYLE, marginTop: '2rem' }} aria-label="A carregar">
            <p
              style={{
                margin: 0,
                color: '#8892A4',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              A carregar transações de {formatMonthLabel(anchor)}…
            </p>
          </section>
        ) : isEmpty ? (
          <>
            <MonthKpis
              inflowCents={0}
              outflowCents={0}
              netCents={0}
            />
            <section style={SECTION_STYLE} aria-label="Sem transações">
              <p
                style={{
                  margin: 0,
                  color: '#8892A4',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Sem transações em <strong style={{ color: '#F0F4FF' }}>{formatMonthLabel(anchor)}</strong>.
                <br />
                Regista a primeira em{' '}
                <Link
                  href="/financas"
                  style={{ color: '#00F5FF', textDecoration: 'underline' }}
                >
                  Finanças
                </Link>
                .
              </p>
            </section>
            {projTx !== undefined && <MonthProjection transactions={projTx} />}
          </>
        ) : (
          <>
            <MonthKpis
              inflowCents={totals.inflowCents}
              outflowCents={totals.outflowCents}
              netCents={totals.netCents}
            />
            <MonthByCategory buckets={byCat} categories={categories} />
            <MonthByDay days={byDay} />
            {projTx !== undefined && <MonthProjection transactions={projTx} />}
          </>
        )}
      </div>
    </main>
  );
}
