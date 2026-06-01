'use client';

import {
  formatMetricValue,
  type MonthlyMetricSummary,
} from '@/lib/habitos/metrics';

/**
 * Nexus v2 — HabitMonthlyChart (Story 4.4 — AC5, FR27)
 *
 * Sub-componente apresentacional: gráfico de barras da evolução mensal de um
 * hábito com métrica. Sem dependência de chart library — barras em CSS nativo
 * (flexbox), padrão "sem nova dependência" da 4.3.
 *
 * 2 estados de render (fronteira — `react-component-test-criteria.md`):
 *   - Vazio (todos os meses com `totalValue: 0`): mensagem PT-PT, sem barras.
 *   - Conteúdo: barras com altura proporcional a `totalValue / record`.
 *
 * a11y não-só-cor (A1 Epic 2): cada barra é `role="img"` com `aria-label` que
 * inclui o valor numérico e nº de dias. Mês actual realçado em cyan (não-só-cor:
 * borda distinta + a barra mantém o aria-label). Scroll horizontal mobile (NFR24).
 *
 * Design system: Lime #39FF14 (barras de conclusão), Cyan #00F5FF (mês actual),
 * Grey #8892A4 (labels), Inter + JetBrains Mono (valores numéricos).
 */

interface HabitMonthlyChartProps {
  months: MonthlyMetricSummary[];
  unit: string;
  /** Valor do melhor mês (escala relativa das barras). 0 ⇒ todas vazias. */
  record?: number;
}

const CHART_HEIGHT = 120; // px — altura máxima de uma barra
const BAR_WIDTH = 44; // px — largura de cada coluna mensal

export function HabitMonthlyChart({
  months,
  unit,
  record,
}: HabitMonthlyChartProps): React.ReactElement {
  const scale = record ?? 0;
  const hasData = months.some((m) => m.totalValue > 0);

  // O mês actual é o último da janela (ordenação antigo→recente — AC1).
  const currentIndex = months.length - 1;

  if (!hasData) {
    return (
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          color: '#8892A4',
          lineHeight: 1.6,
        }}
      >
        Sem registos de métricas ainda. Regista o primeiro valor para começar a
        ver a tua evolução.
      </p>
    );
  }

  return (
    <div
      data-testid="habit-monthly-chart"
      style={{ overflowX: 'auto', paddingBottom: 4 }}
    >
      <div
        role="group"
        aria-label="Evolução mensal do hábito"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          height: CHART_HEIGHT + 24,
          paddingTop: 8,
        }}
      >
        {months.map((month, i) => {
          const ratio = scale > 0 ? month.totalValue / scale : 0;
          const barHeight = Math.round(ratio * CHART_HEIGHT);
          const isCurrent = i === currentIndex;
          const dayWord = month.daysCompleted === 1 ? 'dia' : 'dias';
          const label = `${month.monthLabel}: ${formatMetricValue(month.totalValue)} ${unit}, ${month.daysCompleted} ${dayWord}`;
          return (
            <div
              key={month.monthLabel}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                width: BAR_WIDTH,
              }}
            >
              {/* Calha da barra — altura fixa, alinha as barras pela base. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  height: CHART_HEIGHT,
                  width: '100%',
                }}
              >
                <div
                  role="img"
                  aria-label={label}
                  data-current={isCurrent ? 'true' : undefined}
                  style={{
                    width: '100%',
                    height: Math.max(barHeight, month.totalValue > 0 ? 4 : 0),
                    borderRadius: 4,
                    background:
                      month.totalValue > 0
                        ? 'rgba(57, 255, 20, 0.85)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: isCurrent
                      ? '1px solid #00F5FF'
                      : '1px solid rgba(57, 255, 20, 0.4)',
                    outline: isCurrent ? '1px solid #00F5FF' : 'none',
                    outlineOffset: isCurrent ? 1 : 0,
                  }}
                />
              </div>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.58rem',
                  color: isCurrent ? '#00F5FF' : '#8892A4',
                  whiteSpace: 'nowrap',
                }}
              >
                {month.monthLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
