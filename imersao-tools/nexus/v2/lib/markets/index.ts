/**
 * Nexus v2 — Markets API (PORTADO de v1 `src/lib/markets-api.ts`)
 *
 * Yahoo Finance via `allorigins.win` (sem necessidade de API key).
 * 9 mercados conforme UX-4: CAC40, DAX, DJI, NDX, SP500, BRENT, ETH, NVDA, ASML.
 *
 * Cache: localStorage `nexus_markets` com TTL 5 min (dentro do contrato ADR-2 — <100KB).
 */

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

const SYMBOL_MAP: Record<string, string> = {
  '^FCHI': 'CAC 40',
  '^GDAXI': 'DAX',
  '^DJI': 'Dow Jones',
  '^NDX': 'Nasdaq 100',
  '^GSPC': 'S&P 500',
  'BZ=F': 'Brent',
  'ETH-USD': 'ETH/USD',
  NVDA: 'NVIDIA',
  ASML: 'ASML',
};

const CACHE_KEY = 'nexus_markets';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

interface CachedMarkets {
  quotes: MarketQuote[];
  timestamp: number;
}

function loadCache(): CachedMarkets | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedMarkets;
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
}

export async function fetchMarkets(): Promise<MarketQuote[]> {
  const cached = loadCache();
  if (cached) return cached.quotes;

  const symbols = Object.keys(SYMBOL_MAP).join(',');

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      symbols,
    )}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName,currency`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = (await response.json()) as { contents?: string };
    let contents = data.contents ?? '';

    if (contents.startsWith('data:') && contents.includes(';base64,')) {
      contents = atob(contents.split(';base64,')[1]);
    }

    const json = JSON.parse(contents) as { quoteResponse?: { result?: YahooQuote[] } };
    const results = json.quoteResponse?.result ?? [];

    const quotes: MarketQuote[] = results.map((q: YahooQuote) => ({
      symbol: q.symbol,
      name: SYMBOL_MAP[q.symbol] ?? q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      currency: q.currency ?? 'USD',
    }));

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ quotes, timestamp: Date.now() }),
      );
    }

    return quotes;
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return fetchMarketsFallback();
  }
}

async function fetchMarketsFallback(): Promise<MarketQuote[]> {
  const quotes: MarketQuote[] = [];

  for (const [symbol, name] of Object.entries(SYMBOL_MAP)) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;

      const data = (await response.json()) as { contents?: string };
      let contents = data.contents ?? '';
      if (contents.startsWith('data:') && contents.includes(';base64,')) {
        contents = atob(contents.split(';base64,')[1]);
      }

      const json = JSON.parse(contents) as { quoteResponse?: { result?: YahooQuote[] } };
      const q = json.quoteResponse?.result?.[0];
      if (q) {
        quotes.push({
          symbol,
          name,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          currency: q.currency ?? 'USD',
        });
      }
    } catch {
      /* skip failed symbol */
    }
  }

  if (quotes.length > 0 && typeof window !== 'undefined') {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ quotes, timestamp: Date.now() }),
    );
  }

  return quotes;
}
