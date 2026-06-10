'use client';

import type { JournalEntry } from '@/types/db';
import { MOOD_SCALE, formatPtDate, type MoodMeta } from '@/lib/diario/mood-scale';
import {
  buildHaystack,
  extractExcerpt,
  highlightMatches,
  tokenize,
} from '@/lib/diario/pesquisa';

/**
 * Nexus v2 — DiarioSearchResults (Story 5.5 — AC4, AC5)
 *
 * Componente apresentacional dos resultados de pesquisa do diário. Recebe a lista
 * já filtrada (`searchJournalEntries` via `page.tsx`) — não acede ao Dexie. Cada
 * item mostra a data (PT-PT), badge de mood (não-só-cor) e um excerto com o(s)
 * termo(s) destacado(s) em Cyan (paleta do design system).
 *
 * 3 estados de render distintos (`react-component-test-criteria.md` → teste de
 * componente OBRIGATÓRIO, 1 cenário por estado):
 *   - loading (`isLoading=true`): skeleton; lista ausente.
 *   - results (`results.length > 0`, `!isLoading`): lista clicável.
 *   - empty (`results.length === 0`, `!isLoading`): mensagem PT-PT.
 *
 * Padrão prop-driven (`[DEV-D-5.4-CALLBACK]`): `onSelect(id)` é uma prop — o
 * parent (`page.tsx`) gere a abertura do modal. O componente não importa
 * `JournalEntryModal`.
 *
 * Design system: glassmorphism nos cards, Inter + JetBrains Mono, fundo #04040A,
 * highlight em Cyan #00F5FF.
 */

interface DiarioSearchResultsProps {
  results: JournalEntry[];
  query: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}

/**
 * Fallback defensivo se `entry.mood` cair fora de {1-5} (o tipo e o Zod do repo
 * garantem-no, mas dados Dexie podem corromper-se entre versões). Neutro Grey da
 * paleta — nenhuma cor arbitrária.
 */
const UNKNOWN_MOOD: MoodMeta = {
  value: 3,
  label: 'Desconhecido',
  color: '#8892A4',
  border: '#8892A4',
};

/** Renderiza um excerto com os termos da query destacados (`<mark>` Cyan). */
function HighlightedExcerpt({
  text,
  query,
}: {
  text: string;
  query: string;
}): React.ReactElement {
  const segments = highlightMatches(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            style={{
              background: 'rgba(0, 245, 255, 0.15)',
              color: '#00F5FF',
              borderRadius: 3,
              padding: '0 1px',
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function DiarioSearchResults({
  results,
  query,
  isLoading,
  onSelect,
}: DiarioSearchResultsProps): React.ReactElement {
  // ── Estado loading ──
  if (isLoading) {
    return (
      <div
        data-testid="diario-search-skeleton"
        aria-busy="true"
        aria-label="A pesquisar entradas"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 64,
              marginBottom: 8,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
              backgroundSize: '200% 100%',
              animation: 'diario-search-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes diario-search-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // ── Estado empty ──
  if (results.length === 0) {
    return (
      <p
        data-testid="diario-search-empty"
        role="status"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Nenhuma entrada encontrada para «{query}».
      </p>
    );
  }

  // ── Estado results ──
  const terms = tokenize(query);
  return (
    <ul
      data-testid="diario-search-results"
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
      {results.map((entry) => {
        const meta = MOOD_SCALE[entry.mood] ?? UNKNOWN_MOOD;
        const excerpt = extractExcerpt(buildHaystack(entry), terms);
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry.id)}
              aria-label={`Entrada de ${formatPtDate(entry.date)}, humor ${meta.value} de 5 (${meta.label})`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '0.8rem 0.9rem',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: meta.color,
                  color: '#04040A',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {meta.value}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.72rem',
                    color: '#8892A4',
                  }}
                >
                  {formatPtDate(entry.date)} · {meta.label}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    color: '#F0F4FF',
                  }}
                >
                  <HighlightedExcerpt text={excerpt} query={query} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
