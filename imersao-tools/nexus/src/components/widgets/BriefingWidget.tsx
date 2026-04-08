import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import type { FeedItem } from '../../types';

interface BriefingWidgetProps {
  feedItems: FeedItem[];
  claudeApiKey?: string;
}

const CACHE_KEY = 'nexus_briefing';
const CACHE_TTL = 12 * 60 * 60 * 1000;

interface CachedBriefing {
  text: string;
  timestamp: number;
}

export default function BriefingWidget({ feedItems, claudeApiKey }: BriefingWidgetProps) {
  const [briefing, setBriefing] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadCached = useCallback((): CachedBriefing | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedBriefing = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const generateBriefing = useCallback(async () => {
    if (!claudeApiKey || feedItems.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const titles = feedItems.slice(0, 10).map(f => `- ${f.title} (${f.source})`).join('\n');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Resume estas noticias de tecnologia em 3-5 frases concisas em portugues europeu (PT-PT). Destaca o mais relevante para um profissional de tecnologia. Sem bullet points — texto corrido.\n\n${titles}`,
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      setBriefing(text);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ text, timestamp: Date.now() }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Failed to generate briefing:', err);
    } finally {
      setLoading(false);
    }
  }, [claudeApiKey, feedItems]);

  useEffect(() => {
    const cached = loadCached();
    if (cached) {
      setBriefing(cached.text);
      return;
    }
    if (claudeApiKey && feedItems.length > 0) {
      generateBriefing();
    }
  }, [claudeApiKey, feedItems.length, generateBriefing, loadCached]);

  if (!claudeApiKey) {
    return (
      <Card title="Briefing IA">
        <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <p>Configura a API key da Anthropic nas definicoes para activar o resumo IA.</p>
          {feedItems.slice(0, 5).map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:underline"
              style={{ color: 'var(--text)' }}
            >
              {item.title}
            </a>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Briefing IA">
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
            <Sparkles size={14} className="animate-pulse" />
            A gerar resumo...
          </div>
        )}
        {error && (
          <p className="text-sm" style={{ color: '#FF006E' }}>
            Erro: {error}
          </p>
        )}
        {briefing && !loading && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {briefing}
          </p>
        )}
        <button
          onClick={generateBriefing}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:opacity-80 disabled:opacity-40"
          style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Regenerar
        </button>
      </div>
    </Card>
  );
}
