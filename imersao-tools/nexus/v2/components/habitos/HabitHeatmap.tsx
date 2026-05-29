'use client';

import { useMemo } from 'react';
import type { HabitLog } from '@/types/db';
import {
  buildHeatmapGrid,
  getLast6MonthsRange,
  type HeatmapWeek,
} from '@/lib/habitos/heatmap';

/**
 * Nexus v2 — HabitHeatmap (Story 4.3 — AC3/AC4, FR26)
 *
 * Componente apresentacional do heatmap calendário (estilo GitHub contributions)
 * de um hábito. Recebe os logs por props ([AUTO-DECISION] A2) — o fetch reactivo
 * vive no `HabitHeatmapModal`. Constrói o range (~6 meses) e a grelha via o helper
 * puro `lib/habitos/heatmap.ts`.
 *
 * 3 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`logs === undefined`): skeleton com a forma da grelha.
 *   - Vazio (`logs.length === 0`): grelha completa "não concluído" + hint.
 *   - Conteúdo (`logs.length > 0`): grelha com os dias concluídos preenchidos.
 *
 * a11y não-só-cor (A1 Epic 2):
 *   - Cada célula `inRange` é `role="img"` com `aria-label` PT-PT
 *     ("{DD/MM/YYYY}: concluído | não concluído" + " (hoje)" no dia de hoje).
 *   - Distinção por PREENCHIMENTO (forma), não só matiz: concluído = sólido
 *     (Lime), não-concluído = contorno/glass subtil.
 *   - Padding (`inRange: false`) é `aria-hidden`.
 *   - Legenda visível ("Concluído" / "Não concluído").
 * Design system (`design-system-ia-avancada.md`): fundo #04040A, glassmorphism,
 * Inter + JetBrains Mono, paleta fixa, sem nova dependência (CSS grid nativo).
 */

interface HabitHeatmapProps {
  logs: HabitLog[] | undefined;
  todayISO: string;
}

const CELL = 13; // px — lado da célula
const GAP = 3; // px — espaço entre células
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

/** `YYYY-MM-DD` → `DD/MM/YYYY` (PT-PT) para o aria-label legível. */
function formatPtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Etiqueta de mês por semana: presente quando a semana muda de mês (1.ª inclusa). */
function monthLabels(weeks: HeatmapWeek[]): (string | null)[] {
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

export function HabitHeatmap({ logs, todayISO }: HabitHeatmapProps): React.ReactElement {
  const range = useMemo(() => getLast6MonthsRange(todayISO), [todayISO]);
  const weeks = useMemo(
    () => (logs === undefined ? [] : buildHeatmapGrid(logs, range)),
    [logs, range],
  );

  if (logs === undefined) {
    return <HeatmapSkeleton />;
  }

  const isEmpty = logs.length === 0;
  const labels = monthLabels(weeks);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-testid="habit-heatmap" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: GAP }}>
          {/* Linha de etiquetas de mês alinhada às colunas (semanas). */}
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              gridTemplateColumns: `${CELL}px repeat(${weeks.length}, ${CELL}px)`,
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
                    width: 22,
                  }}
                >
                  {DIAS_LATERAIS[d] ?? ''}
                </span>
              ))}
            </div>

            {/* Grelha: colunas = semanas, linhas = dias (segunda→domingo). */}
            <div
              role="grid"
              aria-label="Heatmap de conclusão do hábito nos últimos 6 meses"
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
                  const estado = day.completed ? 'concluído' : 'não concluído';
                  const label = `${formatPtDate(day.date)}: ${estado}${isToday ? ' (hoje)' : ''}`;
                  return (
                    <span
                      key={day.date}
                      role="img"
                      aria-label={label}
                      data-completed={day.completed ? 'true' : 'false'}
                      data-today={isToday ? 'true' : undefined}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        // Distinção por preenchimento (forma), não só cor:
                        background: day.completed ? '#39FF14' : 'rgba(255, 255, 255, 0.05)',
                        border: day.completed
                          ? '1px solid #39FF14'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        // Realce do dia de hoje: contorno cyan.
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
          Ainda sem registos para este hábito. Marca-o como concluído para começar a
          preencher o heatmap.
        </p>
      )}

      {/* Legenda — pista não-só-cor + texto (A1 Epic 2). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.62rem',
          color: '#8892A4',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              background: '#39FF14',
              border: '1px solid #39FF14',
            }}
          />
          Concluído
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />
          Não concluído
        </span>
      </div>
    </div>
  );
}

function HeatmapSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="habit-heatmap-skeleton"
      aria-busy="true"
      aria-label="A carregar heatmap"
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
              animation: 'heatmap-skeleton-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes heatmap-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
