'use client';

import type { JournalEntry } from '@/types/db';
import { MOOD_SCALE, formatPtDate } from '@/lib/diario/mood-scale';

/**
 * Nexus v2 — JournalEntriesList (Story 5.3 — AC1)
 *
 * Lista apresentacional das entradas de diário (mais recentes primeiro). Cada
 * item é um botão que abre a entrada para edição (`onSelect(date)`). Mostra a
 * data (PT-PT), um badge de mood (cor da paleta `[D-5.3-MOOD-SCALE]` + número +
 * label, não-só-cor) e um excerto do corpo em texto simples.
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   - Loading (`entries === undefined`): skeleton de linhas.
 *   - Vazio (`entries.length === 0`): mensagem (a página mostra o hint principal
 *     no heatmap; aqui é discreto).
 *   - Conteúdo: lista de entradas ordenada desc por data.
 *
 * Design system: superfícies glass, Inter + JetBrains Mono, fundo #04040A.
 */

interface JournalEntriesListProps {
  entries: JournalEntry[] | undefined;
  onSelect: (date: string) => void;
}

/** Excerto de 1 linha em texto simples (remove marcas markdown grosseiras). */
function excerpt(markdown: string): string {
  const firstLine = markdown
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (firstLine === undefined) return '';
  const plain = firstLine.replace(/[#*_`>~-]/g, '').trim();
  return plain.length > 120 ? `${plain.slice(0, 117)}…` : plain;
}

export function JournalEntriesList({
  entries,
  onSelect,
}: JournalEntriesListProps): React.ReactElement {
  if (entries === undefined) {
    return (
      <div data-testid="journal-list-skeleton" aria-busy="true" aria-label="A carregar entradas">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 52,
              marginBottom: 8,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
              backgroundSize: '200% 100%',
              animation: 'journal-list-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes journal-list-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p
        data-testid="journal-list-empty"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          color: '#8892A4',
        }}
      >
        Sem entradas nos últimos 6 meses.
      </p>
    );
  }

  // Ordena desc por data (mais recente primeiro) — cópia, não muta a prop.
  const ordered = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul
      data-testid="journal-list"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {ordered.map((entry) => {
        const meta = MOOD_SCALE[entry.mood];
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect(entry.date)}
              aria-label={`Entrada de ${formatPtDate(entry.date)}, humor ${meta.value} de 5 (${meta.label})`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '0.7rem 0.9rem',
                cursor: 'pointer',
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
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
                    color: '#F0F4FF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {excerpt(entry.bodyMarkdown)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
