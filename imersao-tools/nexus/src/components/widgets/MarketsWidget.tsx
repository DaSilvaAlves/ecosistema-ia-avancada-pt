import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import { fetchMarkets } from '../../lib/markets-api';
import type { MarketQuote } from '../../lib/markets-api';

export default function MarketsWidget() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMarkets();
      setQuotes(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mercados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  function formatPrice(price: number, currency: string): string {
    if (price === 0) return '—';
    if (currency === 'USD' || currency === 'EUR') {
      return price.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <Card title="Mercados">
      <div className="space-y-2">
        {loading && quotes.length === 0 && (
          <div className="flex items-center gap-2 py-6 justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <BarChart3 size={14} className="animate-pulse" /> A carregar mercados...
          </div>
        )}

        {error && quotes.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: '#FF006E' }}>
            {error}
          </p>
        )}

        {quotes.length > 0 && (
          <div className="space-y-0.5">
            {quotes.map(q => {
              const isUp = q.change >= 0;
              const color = isUp ? '#39FF14' : '#FF006E';

              return (
                <div
                  key={q.symbol}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isUp ? (
                      <TrendingUp size={12} style={{ color }} />
                    ) : (
                      <TrendingDown size={12} style={{ color }} />
                    )}
                    <div>
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                        {q.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-xs tabular-nums font-medium"
                      style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {formatPrice(q.price, q.currency)}
                    </span>
                    <span
                      className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color,
                        background: `${color}15`,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {lastUpdate ? `${lastUpdate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="p-1 rounded transition-colors hover:bg-white/10 disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </Card>
  );
}
