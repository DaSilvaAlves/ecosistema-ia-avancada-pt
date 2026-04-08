import { useState, useEffect, useCallback, useRef } from 'react';
import { Rss, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import { fetchFeed, timeAgo } from '../../lib/rss-proxy';
import type { FeedSource, FeedItem } from '../../types';

interface FeedWidgetProps {
  feeds: FeedSource[];
  onItemsLoaded?: (items: FeedItem[]) => void;
}

export default function FeedWidget({ feeds, onItemsLoaded }: FeedWidgetProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const onItemsLoadedRef = useRef(onItemsLoaded);
  onItemsLoadedRef.current = onItemsLoaded;

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const enabledFeeds = feeds.filter(f => f.enabled);
      const results = await Promise.all(
        enabledFeeds.map(f => fetchFeed(f.url, f.name))
      );
      const allItems = results.flat().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      setItems(allItems);
      onItemsLoadedRef.current?.(allItems);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setLoading(false);
    }
  }, [feeds]);

  useEffect(() => {
    loadFeeds();
    const interval = setInterval(loadFeeds, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeeds]);

  const filtered = activeFilter === 'all'
    ? items.slice(0, 15)
    : items.filter(i => i.source === activeFilter).slice(0, 5);

  const sources = [...new Set(items.map(i => i.source))];

  return (
    <Card title="Feed">
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className="text-xs px-2 py-1 rounded-full transition-all font-medium"
            style={{
              background: activeFilter === 'all' ? 'var(--accent)' : 'transparent',
              color: activeFilter === 'all' ? 'var(--bg)' : 'var(--text-secondary)',
              border: activeFilter === 'all' ? 'none' : '1px solid var(--border)',
            }}
          >
            Todos
          </button>
          {sources.map(source => (
            <button
              key={source}
              onClick={() => setActiveFilter(source)}
              className="text-xs px-2 py-1 rounded-full transition-all font-medium"
              style={{
                background: activeFilter === source ? 'var(--accent)' : 'transparent',
                color: activeFilter === source ? 'var(--bg)' : 'var(--text-secondary)',
                border: activeFilter === source ? 'none' : '1px solid var(--border)',
              }}
            >
              {source}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Rss size={14} className="animate-pulse" /> A carregar feeds...
            </div>
          )}
          {!loading && filtered.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 px-2 py-2 rounded-lg group hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={12} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {item.source}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {timeAgo(item.publishedAt)}
                  </span>
                </div>
              </div>
            </a>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              Sem noticias de momento.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
