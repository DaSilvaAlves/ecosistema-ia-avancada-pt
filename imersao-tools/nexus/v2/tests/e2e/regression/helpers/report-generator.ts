/**
 * Story 1.10 — Gerador de report.json + sumário stdout.
 *
 * Inputs: lista de `PromptResult` agregados pela suite.
 * Outputs:
 *  - `tests/e2e/regression/report/report.json` (artefacto CI)
 *  - Sumário stdout: "Regression: N/50 PASS | P95: Xms | Failures: ..."
 *
 * Pass rate threshold (Story 1.12 — ADR-9, Architect Gate §4.4 Decisão 4):
 * recalibrado de `>= 43/50` (Story 1.10) para `>= 26/30`. Razão: a re-rota ao
 * fluxo client-side real (ADR-9) executa as tools de verdade; 20 dos 50 prompts
 * dependem de tools calendar/reminder/eliminar_tarefa ainda NÃO registadas no v2
 * (Epic futuro) → foram diferidos (`pending-tool-epic` + `test.fixme`) e ficam
 * fora do universo executável. Sobram 30 prompts activos; mantendo a mesma
 * exigência relativa de 86% (era 43/50 = 86%), o novo threshold é 26/30 (86,7%).
 * Quando as tools calendar/reminder forem registadas (follow-up), reactivar os
 * 20 diferidos e restaurar 43/50. Zero falhas em canónicos `ac1-epic1` (R040),
 * `ac2-epic1` (R029), `ac4-epic1` (R034/R035) mantém-se obrigatório.
 *
 * P95 budget CI (MSW): `< 2s` (D4 — flagado SF1 ao @architect).
 * P95 budget Staging (real API): `< 6s` (PRD §10 AC5 linha 428).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { PromptResult, RegressionReport } from './types';

export const PASS_RATE_THRESHOLD = 26;
export const P95_THRESHOLD_CI_MS = 2_000;
export const P95_THRESHOLD_STAGING_MS = 6_000;
export const CANONICAL_TAGS = ['ac1-epic1', 'ac2-epic1', 'ac4-epic1'];

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export interface ReportGeneratorOptions {
  results: PromptResult[];
  story: string;
  epic: string;
  outputPath: string;
  canonicalIds: Set<string>;
  useRealApi: boolean;
}

export function generateReport(options: ReportGeneratorOptions): RegressionReport {
  const { results, story, epic, outputPath, canonicalIds, useRealApi } = options;

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const passRate = results.length > 0 ? passed / results.length : 0;

  const durations = results.filter((r) => r.status === 'PASS').map((r) => r.durationMs);
  const p95 = percentile(durations, 95);
  const p95Threshold = useRealApi ? P95_THRESHOLD_STAGING_MS : P95_THRESHOLD_CI_MS;

  const canonicalResults = results.filter((r) => canonicalIds.has(r.id));
  const canonicalPromptsAllPassed =
    canonicalResults.length > 0 && canonicalResults.every((r) => r.status === 'PASS');

  const failuresByCategory: Record<string, number> = {};
  for (const r of results) {
    if (r.status === 'FAIL') {
      failuresByCategory[r.category] = (failuresByCategory[r.category] ?? 0) + 1;
    }
  }

  const report: RegressionReport = {
    generatedAt: new Date().toISOString(),
    story,
    epic,
    totalPrompts: results.length,
    passed,
    failed,
    skipped,
    passRate: Math.round(passRate * 10_000) / 10_000,
    passRateThreshold: PASS_RATE_THRESHOLD,
    thresholdMet: passed >= PASS_RATE_THRESHOLD,
    canonicalPromptsAllPassed,
    p95DurationMs: p95,
    p95Threshold,
    p95Met: p95 < p95Threshold,
    results,
    failuresByCategory,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  printStdoutSummary(report);

  return report;
}

function printStdoutSummary(report: RegressionReport): void {
  const failuresStr =
    Object.keys(report.failuresByCategory).length === 0
      ? 'none'
      : Object.entries(report.failuresByCategory)
          .map(([cat, n]) => `${cat}=${n}`)
          .join(', ');

  console.log('');
  console.log('━'.repeat(80));
  console.log(
    `Regression: ${report.passed}/${report.totalPrompts} PASS ` +
      `(threshold ≥${report.passRateThreshold}: ${report.thresholdMet ? '✓' : '✗'}) | ` +
      `P95: ${report.p95DurationMs}ms (budget <${report.p95Threshold}ms: ${report.p95Met ? '✓' : '✗'}) | ` +
      `Canonical: ${report.canonicalPromptsAllPassed ? '✓' : '✗'} | ` +
      `Failures: ${failuresStr}`
  );
  console.log('━'.repeat(80));
}
