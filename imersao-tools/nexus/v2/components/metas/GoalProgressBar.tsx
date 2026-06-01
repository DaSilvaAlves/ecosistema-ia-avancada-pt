'use client';

import { Check } from 'lucide-react';

/**
 * Nexus v2 — GoalProgressBar (Story 4.5 — AC5, FR40)
 *
 * Sub-componente presentacional: barra de progresso em CSS nativo (sem chart
 * library — padrão "sem nova dependência" da 4.3/4.4). Reutilizado por
 * `GoalsList` e `GoalView`.
 *
 * 2 estados de render (`react-component-test-criteria.md` — fronteira):
 *   - `percentage < 100`: barra Cyan `#00F5FF` preenchida proporcionalmente.
 *   - `percentage >= 100`: barra Lime `#39FF14` + indicador "Alcançado!".
 *
 * a11y (A1 Epic 2): `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/
 * `aria-valuemax`; `aria-label` PT-PT composto (percentagem + label opcional);
 * o estado alcançado é distinguido por TEXTO ("Alcançado!") além da cor
 * (não-só-cor).
 */

interface GoalProgressBarProps {
  /** Percentagem 0-100 (já capped pelo helper `getGoalProgress`). */
  percentage: number;
  /** Texto auxiliar opcional abaixo da barra (ex.: prazo formatado). */
  label?: string;
}

export function GoalProgressBar({
  percentage,
  label,
}: GoalProgressBarProps): React.ReactElement {
  // Defesa de fronteira: clamp 0-100 (o helper já o faz, mas o componente é
  // presentacional e pode receber valores de outras origens).
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const achieved = clamped >= 100;
  const barColor = achieved ? '#39FF14' : '#00F5FF';

  const ariaLabel = label
    ? `Progresso: ${clamped}% — ${label}`
    : `Progresso: ${clamped}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        style={{
          position: 'relative',
          width: '100%',
          height: 10,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: barColor,
            borderRadius: 20,
            boxShadow: `0 0 12px ${achieved ? 'rgba(57, 255, 20, 0.5)' : 'rgba(0, 245, 255, 0.4)'}`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.68rem',
          color: achieved ? '#39FF14' : '#8892A4',
        }}
      >
        <span>{clamped}%</span>
        {achieved ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
            <Check size={12} /> Alcançado!
          </span>
        ) : (
          label !== undefined && <span>{label}</span>
        )}
      </div>
    </div>
  );
}
