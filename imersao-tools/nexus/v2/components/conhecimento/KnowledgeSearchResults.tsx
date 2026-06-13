'use client';

import type { KnowledgeNote } from '@/types/db';
import {
  buildKnowledgeHaystack,
  extractExcerpt,
  highlightMatches,
  tokenize,
} from '@/lib/conhecimento/pesquisa';

/**
 * Nexus v2 — KnowledgeSearchResults (Story 5.10 — AC4, AC5, AC6)
 *
 * Componente apresentacional dos resultados de pesquisa de conhecimento. Recebe a
 * lista já filtrada com o breadcrumb pré-resolvido (`searchNotes` + resolução
 * área/caderno na `page.tsx`) — não acede ao Dexie. Cada item mostra o breadcrumb
 * *"Área > Caderno"* (pesquisa cruzada, AC3 do epic), o título da nota, a data
 * PT-PT (`updatedAt`) e um excerto com o(s) termo(s) destacado(s) em Cyan.
 *
 * Padrão prop-driven (espelha `DiarioSearchResults.tsx` da 5.5): `onSelect(id)`
 * é uma prop — o parent (`page.tsx`) gere a navegação para a nota no
 * master-detail. O componente não importa repos nem hooks Dexie.
 *
 * 3 estados de render distintos (`react-component-test-criteria.md` → teste de
 * componente OBRIGATÓRIO, 1 cenário por estado):
 *   - loading (`isLoading=true`): skeleton; lista ausente.
 *   - results (`results.length > 0`, `!isLoading`): lista clicável com breadcrumb.
 *   - empty (`results.length === 0`, `!isLoading`): mensagem PT-PT.
 *
 * Design system: glassmorphism nos cards, Inter + JetBrains Mono, fundo #04040A,
 * highlight em Cyan #00F5FF, breadcrumb/data em Grey #8892A4.
 */

/** Resultado com breadcrumb pré-resolvido (mantém o componente puro/testável). */
export interface KnowledgeSearchResult {
  note: KnowledgeNote;
  areaName: string;
  notebookName: string;
}

interface KnowledgeSearchResultsProps {
  results: KnowledgeSearchResult[];
  query: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}

/**
 * Formata `updatedAt` (epoch ms) em data PT-PT. Defesa em profundidade idêntica
 * ao `NoteList.formatDate` (5.9, CR Iter 2 F5): um epoch inválido renderizaria
 * "Invalid Date" — fallback seguro para placeholder.
 */
function formatDate(epochMs: number): string {
  if (!Number.isFinite(epochMs) || epochMs < 0) return '—';
  return new Date(epochMs).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

export function KnowledgeSearchResults({
  results,
  query,
  isLoading,
  onSelect,
}: KnowledgeSearchResultsProps): React.ReactElement {
  // ── Estado loading ──
  if (isLoading) {
    return (
      <div
        data-testid="knowledge-search-skeleton"
        aria-busy="true"
        aria-label="A pesquisar notas"
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
              animation: 'knowledge-search-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes knowledge-search-pulse {
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
        data-testid="knowledge-search-empty"
        role="status"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Nenhuma nota encontrada para «{query}».
      </p>
    );
  }

  // ── Estado results ──
  const terms = tokenize(query);
  return (
    <ul
      data-testid="knowledge-search-results"
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
      {results.map(({ note, areaName, notebookName }) => {
        const excerpt = extractExcerpt(buildKnowledgeHaystack(note), terms);
        return (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => onSelect(note.id)}
              aria-label={`Nota «${note.title}» em ${areaName} > ${notebookName}, actualizada a ${formatDate(note.updatedAt)}`}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
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
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.72rem',
                  color: '#8892A4',
                }}
              >
                {areaName} &gt; {notebookName}
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#F0F4FF',
                }}
              >
                {note.title}
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
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.7rem',
                  color: '#8892A4',
                }}
              >
                {formatDate(note.updatedAt)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
