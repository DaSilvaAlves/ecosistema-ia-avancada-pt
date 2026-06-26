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

/**
 * Nexus v2 — Default OpenAI Models (Story 8.1, ADR-10 §4.5)
 *
 * Defaults recomendados quando `LLM_PROVIDER=openai` (configuráveis por env —
 * ponto de partida, não contrato; ver ADR-10 §4.5):
 * - `gpt-4.1-mini` — classifier rápido/barato para classificação JSON multi-intent
 *   (`response_format:json_object`, temperature 0) — usado pelo `OpenAIClassifier` (Story 8.3)
 * - `gpt-4.1` — executor com function calling fiável e streaming a custo contido —
 *   usado pelo `OpenAIExecutor` (Story 8.2)
 *
 * Aditivo: as constantes Anthropic acima ficam intactas. O default `LLM_PROVIDER=anthropic`
 * garante que estas constantes não têm efeito até o cutover (Story 8.6).
 */
export const DEFAULT_OPENAI_CLASSIFIER_MODEL = 'gpt-4.1-mini';
export const DEFAULT_OPENAI_EXECUTOR_MODEL = 'gpt-4.1';
