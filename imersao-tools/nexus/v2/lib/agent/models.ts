/**
 * Nexus v2 — Default Anthropic Models (Story 1.2)
 *
 * Single source of truth para os modelos default usados por:
 * - `lib/agent/run-builder.ts` (Story 1.1) — preenche `modelClassifier`/`modelExecutor` em AgentRun
 * - `lib/agent/providers/anthropic.ts` (Story 1.2) — fallback quando `opts.model` não é fornecido
 *
 * Definidos por architecture-v2.md §6.1 (linhas 392-427) e ADR-1 (Edge/Node split):
 * - `claude-haiku-4-5-20251001` — classifier rápido em Edge (latência baixa, cheap, multi-intent classification)
 * - `claude-sonnet-4-6` — executor capaz em Node (function calling, tool use loop)
 *
 * Fix should-fix #3 PO Story 1.2 (Opção A): centralizar para evitar divergência futura
 * entre `run-builder.ts` (que persiste o nome do modelo no AgentRun) e o provider
 * (que efectivamente chama a API). Bumping a version em apenas 1 sítio criaria audit
 * log enganador (DB diz "haiku-4-5" mas API foi chamada com outra version).
 */

export const DEFAULT_CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';
export const DEFAULT_EXECUTOR_MODEL = 'claude-sonnet-4-6';
