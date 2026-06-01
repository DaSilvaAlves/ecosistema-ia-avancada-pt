import { describe, it, expect } from 'vitest';
import {
  getGoalProgress,
  formatGoalDeadline,
} from '@/lib/metas/progress';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — testes do helper puro de progresso de metas (Story 4.5 — AC3)
 *
 * Cobertura ~100% (NFR17 — helper em `lib/metas/**`). Deterministas: `todayISO`
 * fixo, sem browser nem IndexedDB. Padrão de `heatmap.test.ts`/`metrics.test.ts`.
 */

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Ler 12 livros',
    description: overrides.description,
    type: overrides.type ?? 'numeric',
    target: overrides.target ?? 10,
    current: overrides.current ?? 0,
    deadline: overrides.deadline ?? null,
    status: overrides.status ?? 'active',
    milestones: overrides.milestones ?? [],
    progressLog: overrides.progressLog,
  };
}

describe('getGoalProgress (Story 4.5 / AC3)', () => {
  it('numeric current:0 target:10 → 0%, remaining 10, não alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 0, target: 10 }));
    expect(r).toEqual({
      percentage: 0,
      remaining: 10,
      isAchieved: false,
      milestonesReached: 0,
      milestonesTotal: 0,
    });
  });

  it('numeric current:5 target:10 → 50%, remaining 5, não alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 5, target: 10 }));
    expect(r.percentage).toBe(50);
    expect(r.remaining).toBe(5);
    expect(r.isAchieved).toBe(false);
  });

  it('numeric current:10 target:10 → 100%, remaining 0, alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 10, target: 10 }));
    expect(r.percentage).toBe(100);
    expect(r.remaining).toBe(0);
    expect(r.isAchieved).toBe(true);
  });

  it('numeric current:15 target:10 (excede) → capped a 100%, remaining 0, alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 15, target: 10 }));
    expect(r.percentage).toBe(100);
    expect(r.remaining).toBe(0);
    expect(r.isAchieved).toBe(true);
  });

  it('boolean status:active → 0%, não alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'boolean', status: 'active' }));
    expect(r.percentage).toBe(0);
    expect(r.isAchieved).toBe(false);
    expect(r.remaining).toBe(1);
  });

  it('boolean status:achieved → 100%, alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'boolean', status: 'achieved' }));
    expect(r.percentage).toBe(100);
    expect(r.isAchieved).toBe(true);
    expect(r.remaining).toBe(0);
  });

  it('numeric target:0 → 0% (defesa divisão por zero), não alcançada', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 0, target: 0 }));
    expect(r.percentage).toBe(0);
    expect(r.isAchieved).toBe(false);
  });

  it('numeric target:0 mas status achieved → 100% (alcançada manualmente)', () => {
    const r = getGoalProgress(
      makeGoal({ type: 'numeric', current: 0, target: 0, status: 'achieved' }),
    );
    expect(r.percentage).toBe(100);
    expect(r.isAchieved).toBe(true);
  });

  it('numeric status achieved sem atingir o alvo → 100%, alcançada', () => {
    const r = getGoalProgress(
      makeGoal({ type: 'numeric', current: 3, target: 10, status: 'achieved' }),
    );
    expect(r.percentage).toBe(30);
    expect(r.isAchieved).toBe(true);
  });

  it('conta milestones alcançados vs total', () => {
    const r = getGoalProgress(
      makeGoal({
        type: 'numeric',
        current: 5,
        target: 10,
        milestones: [
          { at: 3, reached: true },
          { at: 6, reached: false },
        ],
      }),
    );
    expect(r.milestonesReached).toBe(1);
    expect(r.milestonesTotal).toBe(2);
  });

  it('arredonda a percentagem (current:1 target:3 → 33%)', () => {
    const r = getGoalProgress(makeGoal({ type: 'numeric', current: 1, target: 3 }));
    expect(r.percentage).toBe(33);
  });
});

describe('formatGoalDeadline (Story 4.5 / AC3)', () => {
  const today = '2026-06-01';

  it('deadline null → "Sem prazo"', () => {
    expect(formatGoalDeadline(null, today)).toBe('Sem prazo');
  });

  it('deadline === hoje → "Hoje"', () => {
    expect(formatGoalDeadline('2026-06-01', today)).toBe('Hoje');
  });

  it('deadline amanhã → "Amanhã"', () => {
    expect(formatGoalDeadline('2026-06-02', today)).toBe('Amanhã');
  });

  it('deadline ontem → "Há 1 dia"', () => {
    expect(formatGoalDeadline('2026-05-31', today)).toBe('Há 1 dia');
  });

  it('deadline em 5 dias → "Em 5 dias"', () => {
    expect(formatGoalDeadline('2026-06-06', today)).toBe('Em 5 dias');
  });

  it('deadline há 10 dias → "Há 10 dias"', () => {
    expect(formatGoalDeadline('2026-05-22', today)).toBe('Há 10 dias');
  });

  it('é determinista (atravessa fronteira de mês em UTC)', () => {
    // 31/05 → 02/06 são 2 dias (UTC, sem off-by-one por fuso).
    expect(formatGoalDeadline('2026-06-02', '2026-05-31')).toBe('Em 2 dias');
  });
});
