'use client';

import { useEffect, useState } from 'react';
import { WidgetCard } from './WidgetCard';
import { fetchGitHubData, type GitHubData } from '@/lib/github';
import { useLocalStorage } from '@/hooks/useLocalStorage';

/**
 * Nexus v2 — GitHubWidget (Story 0.8, portado de v1)
 *
 * Mostra últimos push events + open PRs + contributions semanais.
 * Token guardado em localStorage `nexus_github_token` (<100KB, dentro de ADR-2).
 * Sem token: mostra prompt para configurar (Settings em Epic 8).
 */

export function GitHubWidget(): React.ReactElement {
  const [token] = useLocalStorage<string>('nexus_github_token', '');
  const [data, setData] = useState<GitHubData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    fetchGitHubData(token)
      .then((d) => {
        if (alive) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <WidgetCard title="GitHub">
      {!token && (
        <p style={{ margin: 0, color: '#8892A4', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Configura token nas Definições para ver eventos.
        </p>
      )}
      {token && loading && !data && (
        <p style={{ margin: 0, color: '#4A5568', fontSize: '0.8rem' }}>A carregar...</p>
      )}
      {token && error && !data && (
        <p style={{ margin: 0, color: '#FF006E', fontSize: '0.8rem' }}>Falhou: {error}</p>
      )}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              color: '#8892A4',
            }}
          >
            @{data.username} · {data.openPRs} PRs · {data.weeklyContributions} 7d
          </div>
          {data.events.length === 0 ? (
            <p style={{ margin: 0, color: '#4A5568', fontSize: '0.75rem' }}>Sem actividade recente.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.events.slice(0, 4).map((e) => (
                <li
                  key={e.id}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.75rem',
                    color: '#F0F4FF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✦ <span style={{ color: '#00F5FF' }}>{e.repo.split('/')[1] ?? e.repo}</span>{' '}
                  <span style={{ color: '#8892A4' }}>{e.message.slice(0, 40)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
