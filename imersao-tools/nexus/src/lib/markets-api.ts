export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

// Yahoo Finance symbols for user's watchlist
const SYMBOL_MAP: Record<string, string> = {
  '^FCHI': 'CAC 40',
  '^GDAXI': 'DAX',
  '^DJI': 'Dow Jones',
  '^NDX': 'Nasdaq 100',
  '^GSPC': 'S&P 500',
  'BZ=F': 'Brent',
  'ETH-USD': 'ETH/USD',
  'NVDA': 'NVIDIA',
  'ASML': 'ASML',
};

const CACHE_KEY = 'nexus_markets';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

interface CachedMarkets {
  quotes: MarketQuote[];
  timestamp: number;
}

function loadCache(): CachedMarkets | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedMarkets = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export async function fetchMarkets(): Promise<MarketQuote[]> {
  // Check cache first
  const cached = loadCache();
  if (cached) return cached.quotes;

  const symbols = Object.keys(SYMBOL_MAP).join(',');

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName,currency`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    let contents = data.contents ?? '';

    // Handle base64
    if (contents.startsWith('data:') && contents.includes(';base64,')) {
      contents = atob(contents.split(';base64,')[1]);
    }

    const json = JSON.parse(contents);
    const results = json.quoteResponse?.result ?? [];

    const quotes: MarketQuote[] = results.map((q: {
      symbol: string;
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      currency?: string;
    }) => ({
      symbol: q.symbol,
      name: SYMBOL_MAP[q.symbol] ?? q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      currency: q.currency ?? 'USD',
    }));

    // Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes, timestamp: Date.now() }));

    return quotes;
  } catch (error) {
    console.error('Failed to fetch markets:', error);

    // Try fallback with individual fetches
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

      const data = await response.json();
      let contents = data.contents ?? '';
      if (contents.startsWith('data:') && contents.includes(';base64,')) {
        contents = atob(contents.split(';base64,')[1]);
      }

      const json = JSON.parse(contents);
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
      // Skip failed symbol
    }
  }

  if (quotes.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes, timestamp: Date.now() }));
  }

  return quotes;
}
