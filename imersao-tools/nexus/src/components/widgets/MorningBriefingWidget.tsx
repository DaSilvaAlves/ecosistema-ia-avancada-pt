import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, Sun, Moon, Coffee } from 'lucide-react';
import Card from '../ui/Card';
import { fetchFeed } from '../../lib/rss-proxy';
import type { FeedSource, FeedItem, Task } from '../../types';

interface MorningBriefingWidgetProps {
  feeds: FeedSource[];
  claudeApiKey?: string;
  tasks: Task[];
  name: string;
}

const CACHE_KEY = 'nexus_morning_briefing';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

function getIcon() {
  const hour = new Date().getHours();
  if (hour < 6) return <Moon size={14} />;
  if (hour < 12) return <Sun size={14} />;
  if (hour < 17) return <Coffee size={14} />;
  return <Moon size={14} />;
}

export default function MorningBriefingWidget({ feeds, claudeApiKey, tasks, name }: MorningBriefingWidgetProps) {
  const [briefing, setBriefing] = useState('');
  const [headlines, setHeadlines] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [error, setError] = useState('');
  const generatedRef = useRef(false);

  // Load feeds
  useEffect(() => {
    async function loadFeeds() {
      setFeedsLoading(true);
      try {
        const enabledFeeds = feeds.filter(f => f.enabled);
        const results = await Promise.all(
          enabledFeeds.map(f => fetchFeed(f.url, f.name))
        );
        const all = results.flat().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        setHeadlines(all.slice(0, 10));
      } catch (err) {
        console.error('Feed load error:', err);
      } finally {
        setFeedsLoading(false);
      }
    }
    loadFeeds();
  }, [feeds]);

  const generateBriefing = useCallback(async () => {
    if (!claudeApiKey) return;
    setLoading(true);
    setError('');

    try {
      // Build context
      const pendingTasks = tasks.filter(t => !t.done);
      const doneTasks = tasks.filter(t => t.done);
      const overdueTasks = pendingTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate + 'T00:00:00') < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      });

      const newsContext = headlines.slice(0, 8).map(h => `- ${h.title} (${h.source})`).join('\n');

      const taskContext = pendingTasks.length > 0
        ? `Tarefas pendentes:\n${pendingTasks.map(t => `- [${t.priority}] ${t.text}${t.dueDate ? ` (prazo: ${t.dueDate})` : ''}`).join('\n')}`
        : 'Nenhuma tarefa pendente.';

      const doneContext = doneTasks.length > 0
        ? `Tarefas concluidas recentemente: ${doneTasks.length}`
        : '';

      const overdueContext = overdueTasks.length > 0
        ? `ATENCAO: ${overdueTasks.length} tarefa(s) atrasada(s)!`
        : '';

      const prompt = `Es o assistente pessoal do ${name || 'utilizador'}. Gera um briefing matinal conciso em portugues europeu (PT-PT).

Inclui:
1. Uma frase de contexto sobre o dia (data actual, dia da semana)
2. Estado das tarefas: quantas pendentes, se ha atrasadas, sugestao de por onde comecar
3. Um resumo de 2-3 frases das noticias tech mais relevantes

Dados:
${taskContext}
${overdueContext}
${doneContext}

Noticias:
${newsContext}

Formato: texto corrido, maximo 6 frases. Tom directo, sem floreados. Comeca com a prioridade do dia.`;

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
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API: ${response.status}`);

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      setBriefing(text);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ text, timestamp: Date.now() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
      console.error('Briefing error:', err);
    } finally {
      setLoading(false);
    }
  }, [claudeApiKey, headlines, tasks, name]);

  // Auto-generate once
  useEffect(() => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setBriefing(parsed.text);
          return;
        }
      }
    } catch { /* ignore */ }

    if (claudeApiKey && !feedsLoading && headlines.length > 0 && !generatedRef.current) {
      generatedRef.current = true;
      generateBriefing();
    }
  }, [claudeApiKey, feedsLoading, headlines.length, generateBriefing]);

  // Task summary (always visible, even without API key)
  const pending = tasks.filter(t => !t.done);
  const overdue = pending.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate + 'T00:00:00') < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
  });

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--accent)' }}>{getIcon()}</span>
          <h3
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Briefing
          </h3>
        </div>

        {/* Quick status */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{pending.length}</span>
            pendentes
          </div>
          {overdue.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: '#FF006E22', color: '#FF006E', border: '1px solid #FF006E44' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{overdue.length}</span>
              atrasadas
            </div>
          )}
          {tasks.filter(t => t.done).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: '#39FF1422', color: '#39FF14', border: '1px solid #39FF1444' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{tasks.filter(t => t.done).length}</span>
              feitas
            </div>
          )}
        </div>

        {/* AI Briefing */}
        {briefing && !loading && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {briefing}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--accent)' }}>
            <Sparkles size={13} className="animate-pulse" /> A gerar briefing...
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: '#FF006E' }}>Erro: {error}</p>
        )}

        {!claudeApiKey && !briefing && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Adiciona a API key da Anthropic nas definicoes para activar o briefing com IA.
          </p>
        )}

        {/* Headlines (collapsed) */}
        {headlines.length > 0 && (
          <details className="group">
            <summary className="text-[10px] font-medium cursor-pointer select-none uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {headlines.length} noticias recentes
            </summary>
            <div className="mt-2 space-y-1">
              {headlines.slice(0, 6).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs py-1 hover:underline truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </details>
        )}

        {/* Regenerate */}
        {claudeApiKey && (
          <button
            onClick={generateBriefing}
            disabled={loading}
            className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors hover:opacity-80 disabled:opacity-30"
            style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            Regenerar
          </button>
        )}
      </div>
    </Card>
  );
}
