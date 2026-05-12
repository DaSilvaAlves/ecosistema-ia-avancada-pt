/**
 * Story 1.10 — Tipos partilhados pela suite E2E regression.
 *
 * Define a interface dos prompts no fixture (`tests/fixtures/prompts-pt-pt.json`)
 * e o tipo do resultado por prompt usado pelo report generator.
 */

export type RegressionCategory =
  | 'simple-no-tools'
  | 'single-intent-task'
  | 'single-intent-finance'
  | 'single-intent-calendar'
  | 'single-intent-reminder'
  | 'multi-intent'
  | 'preview-required'
  | 'undo-flow'
  | 'error-recovery'
  | 'abort-mid-stream'
  | 'performance-benchmark';

export type MockProfile =
  | 'multi-intent-canonical-ac1'
  | 'multi-intent-tasks-calendar'
  | 'multi-intent-reminder-finance'
  | 'multi-intent-tasks-reminder'
  | 'multi-intent-triple'
  | 'multi-intent-with-error'
  | 'single-task'
  | 'single-task-complete'
  | 'single-finance-variable'
  | 'single-finance-recurring'
  | 'single-finance-card'
  | 'single-calendar'
  | 'single-reminder'
  | 'preview-low-confidence'
  | 'preview-destructive'
  | 'tool-error'
  | 'tool-error-bad-args'
  | 'tool-error-unknown'
  | 'abort-during-stream'
  | 'text-only'
  | 'text-only-fast';

export interface RegressionPrompt {
  id: string;
  category: RegressionCategory;
  prompt: string;
  expectedIntents: string[];
  expectedToolCount: number;
  requiresPreview: boolean;
  expectUndo: boolean;
  tags: string[];
  mockProfile: MockProfile;
}

export interface RegressionFixture {
  $schema?: string;
  version: string;
  story: string;
  epic: string;
  createdAt: string;
  totalPrompts: number;
  categories: Record<RegressionCategory, number>;
  prompts: RegressionPrompt[];
}

export type PromptResultStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface PromptResult {
  id: string;
  category: RegressionCategory;
  prompt: string;
  status: PromptResultStatus;
  durationMs: number;
  reason?: string;
  observedToolCount?: number;
  observedRunStatus?: string | null;
}

export interface RegressionReport {
  generatedAt: string;
  story: string;
  epic: string;
  totalPrompts: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  passRateThreshold: number;
  thresholdMet: boolean;
  canonicalPromptsAllPassed: boolean;
  p95DurationMs: number;
  p95Threshold: number;
  p95Met: boolean;
  results: PromptResult[];
  failuresByCategory: Record<string, number>;
}
