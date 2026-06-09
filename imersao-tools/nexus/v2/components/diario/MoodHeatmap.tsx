'use client';

import { useMemo } from 'react';
import type { JournalEntry } from '@/types/db';
import {
  buildMoodHeatmapGrid,
  getLast6MonthsRange,
  type MoodHeatmapWeek,
} from '@/lib/diario/mood-heatmap';
import { MOOD_SCALE, MOODS, NO_ENTRY_STYLE, formatPtDate } from '@/lib/diario/mood-scale';

/**
 * Nexus v2 — MoodHeatmap (Story 5.3 — AC3/AC6/AC7, FR44)
 *
 * Componente apresentacional do heatmap calendário (estilo GitHub contributions)
 * do diário. Recebe as entradas por props — o fetch reactivo vive na página
 * (`/diario`). Constrói o range (~6 meses) e a grelha via o helper puro
 * `lib/diario/mood-heatmap.ts`. Cada célula `inRange` é um **botão** (AC3):
 * clicar abre a entrada desse dia (editar) ou cria nova.
 *
 * 3 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`entries === undefined`): skeleton com a forma da grelha.
 *   - Vazio (`entries.length === 0`): grelha completa "sem entrada" + hint.
 *   - Conteúdo (`entries.length > 0`): células coloridas pelo mood do dia.
 *   - (+) dia-com-mood vs dia-sem-entrada: cor da paleta vs neutro glass.
 *
 * a11y não-só-cor (A1 Epic 2):
 *   - Cada célula `inRange` é um `<button>` com `aria-label` PT-PT
 *     ("{DD/MM/YYYY}: humor {n} de 5 ({label}) | sem entrada" + " (hoje)").
 *   - A ordem do mood NUNCA é inferível só pela cor — vai no aria-label e na legenda.
 *   - Padding (`inRange: false`) é `aria-hidden`.
 *   - Legenda visível com os 5 moods (cor + número + label) + "sem entrada".
 * Design system (`design-system-ia-avancada.md`): fundo #04040A, glassmorphism,
 * Inter + JetBrains Mono, cores de mood SÓ da paleta (`[D-5.3-MOOD-SCALE]`),
 * sem nova dependência (CSS grid nativo).
 */

interface MoodHeatmapProps {
  entries: JournalEntry[] | undefined;
  todayISO: string;
  /** Clique numa célula `inRange` — abre/cria a entrada desse dia. */
  onSelectDay: (date: string) => void;
}

const CELL = 13; // px — lado da célula
const GAP = 3; // px — espaço entre células
const DAY_LABEL_WIDTH = 22; // px — largura da coluna de etiquetas de dia (Seg/Qua/Sex)
const MESES_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
// Etiquetas laterais: segunda=0 … domingo=6. Mostra Seg/Qua/Sex (AC3).
const DIAS_LATERAIS: Record<number, string> = { 0: 'Seg', 2: 'Qua', 4: 'Sex' };

/** Etiqueta de mês por semana: presente quando a semana muda de mês (1.ª inclusa). */
function monthLabels(weeks: MoodHeatmapWeek[]): (string | null)[] {
  let prevMonth = -1;
  return weeks.map((week) => {
    const month = Number(week.days[0].date.slice(5, 7)) - 1;
    if (month !== prevMonth) {
      prevMonth = month;
      return MESES_PT[month];
    }
    return null;
  });
}

export function MoodHeatmap({
  entries,
  todayISO,
  onSelectDay,
}: MoodHeatmapProps): React.ReactElement {
  const range = useMemo(() => getLast6MonthsRange(todayISO), [todayISO]);
  const weeks = useMemo(
    () => (entries === undefined ? [] : buildMoodHeatmapGrid(entries, range)),
    [entries, range],
  );

  if (entries === undefined) {
    return <MoodHeatmapSkeleton />;
  }

  const isEmpty = entries.length === 0;
  const labels = monthLabels(weeks);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-testid="mood-heatmap" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: GAP }}>
          {/* Linha de etiquetas de mês alinhada às colunas (semanas). */}
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              gridTemplateColumns: `${DAY_LABEL_WIDTH}px repeat(${weeks.length}, ${CELL}px)`,
              gap: GAP,
              height: 14,
            }}
          >
            <span />
            {labels.map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.6rem',
                  color: '#8892A4',
                  whiteSpace: 'nowrap',
                }}
              >
                {label ?? ''}
              </span>
            ))}
          </div>

          {/* Etiquetas laterais (dias) + grelha de células. */}
          <div style={{ display: 'flex', gap: GAP }}>
            {/* Coluna de etiquetas de dia-da-semana (Seg/Qua/Sex). */}
            <div
              aria-hidden="true"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gap: GAP,
              }}
            >
              {Array.from({ length: 7 }).map((_, d) => (
                <span
                  key={d}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.55rem',
                    color: '#8892A4',
                    lineHeight: `${CELL}px`,
                    width: DAY_LABEL_WIDTH,
                  }}
                >
                  {DIAS_LATERAIS[d] ?? ''}
                </span>
              ))}
            </div>

            {/* Grelha: colunas = semanas, linhas = dias (segunda→domingo). */}
            <div
              role="group"
              aria-label="Heatmap de humor do diário nos últimos 6 meses"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoFlow: 'column',
                gap: GAP,
              }}
            >
              {weeks.flatMap((week) =>
                week.days.map((day) => {
                  if (!day.inRange) {
                    return (
                      <span
                        key={day.date}
                        aria-hidden="true"
                        style={{ width: CELL, height: CELL, visibility: 'hidden' }}
                      />
                    );
                  }
                  const isToday = day.date === todayISO;
                  const todaySuffix = isToday ? ' (hoje)' : '';
                  const meta = day.mood !== null ? MOOD_SCALE[day.mood] : null;
                  const label =
                    meta !== null
                      ? `${formatPtDate(day.date)}: humor ${meta.value} de 5 (${meta.label})${todaySuffix}`
                      : `${formatPtDate(day.date)}: sem entrada${todaySuffix}`;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      aria-label={label}
                      title={label}
                      onClick={() => onSelectDay(day.date)}
                      data-mood={day.mood ?? 'none'}
                      data-today={isToday ? 'true' : undefined}
                      style={{
                        width: CELL,
                        height: CELL,
                        padding: 0,
                        borderRadius: 3,
                        cursor: 'pointer',
                        background: meta !== null ? meta.color : NO_ENTRY_STYLE.background,
                        border:
                          meta !== null
                            ? `1px solid ${meta.border}`
                            : NO_ENTRY_STYLE.border,
                        outline: isToday ? '1px solid #00F5FF' : 'none',
                        outlineOffset: isToday ? 1 : 0,
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {isEmpty && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#8892A4',
            lineHeight: 1.6,
          }}
        >
          Ainda sem entradas de diário. Clica num dia ou em &quot;+ Nova entrada&quot;
          para começar a registar o teu humor.
        </p>
      )}

      {/* Legenda — pista não-só-cor + texto (A1 Epic 2). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.62rem',
          color: '#8892A4',
        }}
      >
        {MOODS.map((m) => {
          const meta = MOOD_SCALE[m];
          return (
            <span
              key={m}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 3,
                  background: meta.color,
                  border: `1px solid ${meta.border}`,
                }}
              />
              {meta.value} {meta.label}
            </span>
          );
        })}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              background: NO_ENTRY_STYLE.background,
              border: NO_ENTRY_STYLE.border,
            }}
          />
          Sem entrada
        </span>
      </div>
    </div>
  );
}

function MoodHeatmapSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="mood-heatmap-skeleton"
      aria-busy="true"
      aria-label="A carregar heatmap de humor"
      style={{ overflowX: 'auto', paddingBottom: 4 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(26, ${CELL}px)`,
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gridAutoFlow: 'column',
          gap: GAP,
        }}
      >
        {Array.from({ length: 26 * 7 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)',
              backgroundSize: '200% 100%',
              animation: 'mood-heatmap-skeleton-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes mood-heatmap-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
