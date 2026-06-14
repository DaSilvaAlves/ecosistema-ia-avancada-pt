'use client';

import type { WebSearchResult } from '@/lib/shared/web-search-ddg';

/**
 * Nexus v2 — WebSearchResults (Story 5.11 — FR55, AC4/AC6/AC10)
 *
 * Componente apresentacional dos resultados de pesquisa web. Prop-driven (espelha
 * `KnowledgeSearchResults` da 5.10): o parent (`knowledge/page.tsx`) faz o fetch
 * a `/api/conhecimento/web-search`, gere `isSearching`/`hasSearched`/`error` e
 * passa o callback `onSave` por resultado. O componente não faz fetch nem acede
 * ao Dexie.
 *
 * 5 estados de render distintos (`react-component-test-criteria.md` → teste de
 * componente OBRIGATÓRIO, ≥3 → 5 estados):
 *   - idle (`!isSearching && !hasSearched`): mensagem de convite PT-PT.
 *   - loading (`isSearching`): skeleton; `aria-busy`.
 *   - results (`results.length > 0`): lista com título + URL (Cyan) + excerto +
 *     badge de provider (JetBrains Mono) + botão "Guardar como nota".
 *   - empty (`hasSearched && results.length === 0 && error === null`): mensagem
 *     PT-PT com a query — DISTINTO de erro (`[D-5.11-EMPTY-VS-ERROR]`).
 *   - error (`hasSearched && error !== null`): mensagem real PT-PT em Magenta,
 *     `role="alert"`.
 *
 * Design system: glassmorphism nos cards, Inter (corpo) + JetBrains Mono (badge/
 * URL), fundo #04040A, URL/links Cyan #00F5FF, erro Magenta #FF006E, metadados
 * Grey #8892A4.
 */

export type WebSearchProvider = 'anthropic' | 'duckduckgo';

interface WebSearchResultsProps {
  results: WebSearchResult[];
  source: WebSearchProvider | null;
  query: string;
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
  onSave: (result: WebSearchResult) => void;
}

const PROVIDER_LABEL: Record<WebSearchProvider, string> = {
  anthropic: 'ANTHROPIC',
  duckduckgo: 'DUCKDUCKGO',
};

export function WebSearchResults({
  results,
  source,
  query,
  isSearching,
  hasSearched,
  error,
  onSave,
}: WebSearchResultsProps): React.ReactElement {
  // ── Estado loading (precede empty/idle: uma pesquisa em curso domina) ──
  if (isSearching) {
    return (
      <div
        data-testid="web-search-skeleton"
        aria-busy="true"
        aria-label="A pesquisar na web"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 72,
              marginBottom: 8,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
              backgroundSize: '200% 100%',
              animation: 'web-search-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes web-search-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // ── Estado error (distinto de empty — `[D-5.11-EMPTY-VS-ERROR]`) ──
  if (hasSearched && error !== null) {
    return (
      <p
        data-testid="web-search-error"
        role="alert"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#FF006E',
        }}
      >
        {error}
      </p>
    );
  }

  // ── Estado idle — ainda não houve pesquisa ──
  if (!hasSearched) {
    return (
      <p
        data-testid="web-search-idle"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Pesquisa na web e guarda os resultados como notas no teu Conhecimento.
      </p>
    );
  }

  // ── Estado empty — pesquisa feita, zero resultados, sem erro ──
  if (results.length === 0) {
    return (
      <p
        data-testid="web-search-empty"
        role="status"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Nenhum resultado para «{query}».
      </p>
    );
  }

  // ── Estado results ──
  return (
    <ul
      data-testid="web-search-results"
      role="list"
      aria-live="polite"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {results.map((result, i) => (
        <li
          key={`${result.url}-${i}`}
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: '0.9rem 1rem',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.98rem',
                fontWeight: 700,
                color: '#F0F4FF',
              }}
            >
              {result.title}
            </span>
            {source !== null && (
              <span
                title={`Resultado obtido via ${PROVIDER_LABEL[source]}`}
                style={{
                  flexShrink: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#00F5FF',
                  background: 'rgba(0, 245, 255, 0.08)',
                  border: '1px solid rgba(0, 245, 255, 0.2)',
                  borderRadius: 20,
                  padding: '0.15rem 0.55rem',
                }}
              >
                {PROVIDER_LABEL[source]}
              </span>
            )}
          </div>

          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              color: '#00F5FF',
              textDecoration: 'none',
              wordBreak: 'break-all',
            }}
          >
            {result.url}
          </a>

          {result.excerpt !== '' && (
            <p
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                color: '#F0F4FF',
              }}
            >
              {result.excerpt}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onSave(result)}
              aria-label={`Guardar «${result.title}» como nota`}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#04040A',
                background: '#00F5FF',
                border: 'none',
                borderRadius: 6,
                padding: '0.4rem 0.9rem',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
              }}
            >
              Guardar como nota
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
