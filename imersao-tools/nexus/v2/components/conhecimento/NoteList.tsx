'use client';

import type { KnowledgeNote, Tag } from '@/types/db';

/**
 * Nexus v2 — NoteList (Story 5.9 — AC1/AC2/AC10/AC12/AC15)
 *
 * Lista de notas de um caderno seleccionado. Faz a ponte entre o painel esquerdo
 * (árvore) e o painel direito (nota): seleccionar uma nota popula o `NoteEditor`.
 *
 * Componente **prop-driven** (a page detém os hooks Dexie). Estados de render
 * distintos (`react-component-test-criteria.md`, ≥3): sem caderno seleccionado /
 * loading (`notes` undefined) / vazia (0 notas) / lista de notas. As notas vêm já
 * ordenadas por `updatedAt` desc do repo (AC2).
 *
 * Filtro por tag (AC15): a barra de tags do caderno permite alternar um `tagFilter`
 * — a page resolve o filtro via `listNotesByTag` e passa as notas filtradas. Aqui
 * só se emite `onTagFilterChange`.
 *
 * Design system: cards glass, título White, data/tags em JetBrains Mono Grey, nota
 * seleccionada com borda Cyan.
 */

interface NoteListProps {
  /** `null` = nenhum caderno seleccionado; `undefined` = a carregar. */
  notes: KnowledgeNote[] | undefined;
  /** `true` quando há um caderno seleccionado (controla o estado "sem caderno"). */
  hasNotebookSelected: boolean;
  /** Nota seleccionada (destaque visual). */
  selectedNoteId: string | null;
  /** Lookup tag id → Tag (para mostrar nomes legíveis). */
  tagsLookup: Map<string, Tag>;
  /** Lista de tags para o filtro (AC15). */
  tags: Tag[] | undefined;
  /** Tag activa no filtro (`null` = sem filtro). */
  tagFilter: string | null;
  onTagFilterChange: (tagId: string | null) => void;
  onSelectNote: (note: KnowledgeNote) => void;
  onCreateNote: () => void;
}

function formatDate(epochMs: number): string {
  // Defesa em profundidade: `KnowledgeNoteSchema` já valida `updatedAt` como
  // inteiro positivo, mas um epoch inválido (NaN, negativo) renderizaria
  // "Invalid Date" na UI (CR Iter 2 F5). Fallback seguro para placeholder.
  if (!Number.isFinite(epochMs) || epochMs < 0) return '—';
  return new Date(epochMs).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function NoteList({
  notes,
  hasNotebookSelected,
  selectedNoteId,
  tagsLookup,
  tags,
  tagFilter,
  onTagFilterChange,
  onSelectNote,
  onCreateNote,
}: NoteListProps): React.ReactElement {
  if (!hasNotebookSelected) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          color: '#8892A4',
        }}
      >
        Selecciona um caderno para ver as suas notas.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '0.5rem',
        minWidth: 260,
        maxWidth: 340,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        overflowY: 'auto',
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
        <button
          type="button"
          onClick={onCreateNote}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#00F5FF',
            background: 'rgba(0, 245, 255, 0.08)',
            border: '1px solid rgba(0, 245, 255, 0.2)',
            borderRadius: 6,
            padding: '0.4rem 0.7rem',
            cursor: 'pointer',
          }}
        >
          + Nova nota
        </button>
      </div>

      {tags !== undefined && tags.length > 0 && (
        <div>
          <label
            htmlFor="note-tag-filter"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#8892A4',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 4,
            }}
          >
            Filtrar por tag
          </label>
          <select
            id="note-tag-filter"
            value={tagFilter ?? ''}
            onChange={(e) =>
              onTagFilterChange(e.target.value === '' ? null : e.target.value)
            }
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              color: '#F0F4FF',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '0.4rem 0.6rem',
              outline: 'none',
              width: '100%',
            }}
          >
            <option value="">Todas as tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {notes === undefined ? (
        <div
          aria-busy="true"
          aria-label="A carregar notas"
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 56,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                backgroundSize: '200% 100%',
                borderRadius: 8,
                animation: 'conhecimento-note-skeleton 1.6s ease-in-out infinite',
              }}
            />
          ))}
          <style>{`
            @keyframes conhecimento-note-skeleton {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ) : notes.length === 0 ? (
        <p
          style={{
            margin: '1rem 0',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.82rem',
            color: '#8892A4',
          }}
        >
          {tagFilter !== null
            ? 'Nenhuma nota com esta tag.'
            : 'Sem notas neste caderno. Cria a primeira.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notes.map((note) => {
            const selected = note.id === selectedNoteId;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onSelectNote(note)}
                  aria-current={selected}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: `1px solid ${selected ? '#00F5FF' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 8,
                    padding: '0.6rem 0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: selected ? '#00F5FF' : '#F0F4FF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {note.title}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.6rem',
                      color: '#8892A4',
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{formatDate(note.updatedAt)}</span>
                    {note.tags.slice(0, 3).map((tagId) => {
                      const tag = tagsLookup.get(tagId);
                      return (
                        <span key={tagId} style={{ color: tag?.color ?? '#8892A4' }}>
                          {tag ? `#${tag.name}` : ''}
                        </span>
                      );
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
