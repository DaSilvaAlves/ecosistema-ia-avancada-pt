/**
 * Story 1.10 — Gerador de report.json + sumário stdout.
 *
 * Inputs: lista de `PromptResult` agregados pela suite.
 * Outputs:
 *  - `tests/e2e/regression/report/report.json` (artefacto CI)
 *  - Sumário stdout: "Regression: N/50 PASS | P95: Xms | Failures: ..."
 *
 * Pass rate threshold: `>= 43/50` (>= 86%) com zero falhas em prompts canónicos
 * `ac1-epic1`, `ac2-epic1`, `ac4-epic1` (D2 — PRD §10 linha 431).
 *
 * P95 budget CI (MSW): `< 2s` (D4 — flagado SF1 ao @architect).
 * P95 budget Staging (real API): `< 6s` (PRD §10 AC5 linha 428).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { PromptResult, RegressionReport } from './types';

export const PASS_RATE_THRESHOLD = 43;
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
