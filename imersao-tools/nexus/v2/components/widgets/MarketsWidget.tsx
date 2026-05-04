'use client';

import { useEffect, useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { fetchMarkets, type MarketQuote } from '@/lib/markets';

/**
 * Nexus v2 — MarketsWidget (Story 0.8 + UX-4)
 *
 * No topo da sidebar (UX-4). 9 mercados: CAC40, DAX, DJI, NDX, SP500, BRENT, ETH, NVDA, ASML.
 * Refresh a cada 60s.
 * Lime se delta > 0, Magenta se delta < 0, Grey se delta === 0.
 *
 * Fail-safe: skeleton Cyan pulsing + "Indisponível" se fetch falhar.
 */

const REFRESH_INTERVAL = 60_000;

export function MarketsWidget(): React.ReactElement {
  const [quotes, setQuotes] = useState<MarketQuote[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load(): Promise<void> {
      try {
        const data = await fetchMarkets();
        if (alive) {
          setQuotes(data);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    }

    void load();
    const id = window.setInterval(() => void load(), REFRESH_INTERVAL);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <WidgetCard title="Mercados">
      {!quotes && !error && <Skeleton />}
      {error && !quotes && (
        <p style={{ margin: 0, color: '#8892A4', fontSize: '0.8rem' }}>Indisponível</p>
      )}
      {quotes && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {quotes.map((q) => (
            <MarketRow key={q.symbol} quote={q} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

function MarketRow({ quote }: { quote: MarketQuote }): React.ReactElement {
  const delta = quote.changePercent;
  const color = delta > 0 ? '#39FF14' : delta < 0 ? '#FF006E' : '#8892A4';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '·';

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
      }}
    >
      <span style={{ color: '#F0F4FF' }}>{quote.name}</span>
      <span style={{ color: '#8892A4' }}>{formatPrice(quote.price)}</span>
      <span style={{ color, minWidth: 56, textAlign: 'right' }}>
        {arrow} {Math.abs(delta).toFixed(1)}%
      </span>
    </li>
  );
}

function formatPrice(price: number): string {
  if (price > 1000) return price.toLocaleString('pt-PT', { maximumFractionDigits: 0 });
  return price.toLocaleString('pt-PT', { maximumFractionDigits: 1 });
}

function Skeleton(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: 14,
            background: 'rgba(0,245,255,0.08)',
            borderRadius: 4,
            animation: 'nexus-skeleton 1s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes nexus-skeleton {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
