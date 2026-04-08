import { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, Activity, Key } from 'lucide-react';
import Card from '../ui/Card';
import { fetchGitHubData } from '../../lib/github-api';
import { timeAgo } from '../../lib/rss-proxy';
import type { GitHubData } from '../../types';

interface GitHubWidgetProps {
  token?: string;
}

export default function GitHubWidget({ token }: GitHubWidgetProps) {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError('');
    fetchGitHubData(token)
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <Card title="GitHub">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Key size={20} style={{ color: 'var(--text-secondary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Adiciona o teu GitHub token nas definicoes para ver a tua actividade.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="GitHub">
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 py-4 justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Activity size={14} className="animate-pulse" /> A carregar...
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: '#FF006E' }}>Erro: {error}</p>
        )}

        {data && !loading && (
          <>
            {/* Stats */}
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <GitPullRequest size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.openPRs}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>PRs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {data.weeklyContributions}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>esta semana</span>
              </div>
            </div>

            {/* Recent commits */}
            <div className="space-y-1">
              {data.events.map(event => (
                <div key={event.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <GitBranch size={12} className="shrink-0 mt-1" style={{ color: 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'var(--text)' }}>
                      {event.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        {event.repo.split('/')[1]}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {timeAgo(new Date(event.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {data.events.length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>
                  Sem actividade recente.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
