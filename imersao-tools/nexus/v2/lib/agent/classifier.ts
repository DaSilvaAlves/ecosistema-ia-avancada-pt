import { getClassifier } from '@/lib/agent/providers/factory';
import { buildClassifierSystemPrompt } from '@/lib/agent/prompts/classifier-system';
import type { ClassificationResult } from '@/lib/agent/schemas';
import type { ToolDomain } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Classifier wrapper PT-PT (Story 1.4)
 *
 * High-level wrapper que invoca `AnthropicClassifier` (Story 1.2) com system
 * prompt few-shot (Story 1.4 `prompts/classifier-system.ts`) e aplica
 * **validação adicional fail-loud** sobre o output Haiku — sem alterar o
 * schema canonical `ClassificationResultSchema` (Story 1.2 — mantido intacto).
 *
 * Validação adicional:
 * 1. `intents` ⊆ `availableDomains` (rejeita domínios fora do enum)
 * 2. `confidence[d] ∈ [0, 1]` por cada `d ∈ intents` (rejeita prompt drift)
 * 3. Cada chave em `confidence` corresponde a um intent declarado (rejeita orphans)
 *
 * Edge runtime safe (ADR-1 arch §4.1): sem `fs`, `crypto.createHmac`, `path`,
 * `child_process`. Story 1.8 (`/api/agent/prompt`) corre este wrapper em Edge.
 *
 * Trace canónico:
 * - PRD §10 line 415 — Story 1.4 acceptance
 * - architecture-v2.md §7.4 — token economy (intents = domains)
 * - architecture-v2.md §8 line 682 — flow Haiku
 * - lições Story 1.3 — fail-loud > silent fallback
 */

/**
 * Lista canónica de todos os 10 domains. Derivada do `ToolDomain` union
 * (Story 1.3) — duplicação intencional para evitar circular dependency
 * (`tools/types.ts` é importado por `classifier-system.ts`; manter `ALL_DOMAINS`
 * aqui isola wrapper). Verificação de sincronia via TypeScript: o tipo
 * `readonly ToolDomain[]` força que cada literal do `ToolDomain` esteja presente.
 */
export const ALL_DOMAINS: readonly ToolDomain[] = [
  'tasks',
  'finance',
  'habits',
  'journal',
  'knowledge',
  'calendar',
  'gmail',
  'telegram',
  'receipt',
  'meta',
] as const;

/**
 * Defaults aplicados quando `opts` não especifica. Conservador para reduzir
 * latência e custos em produção; @dev pode override via opts.
 *
 * - `maxTokens: 512` — JSON com até 10 domains + confidence cabe folgadamente
 * - `temperature: 0` — determinismo (mesmo input → mesmo output)
 * - `model` — defaultado pelo `AnthropicClassifier` via `DEFAULT_CLASSIFIER_MODEL`
 *   em `lib/agent/models.ts` (Story 1.2 single source — não duplicar)
 */
const DEFAULT_CLASSIFIER_OPTS = {
  maxTokens: 512,
  temperature: 0,
} as const;

/**
 * Options para o wrapper `classifyPrompt`. `availableDomains` é específico do
 * wrapper (forwarded ao `buildClassifierSystemPrompt`); restantes campos são
 * pass-through para `AnthropicClassifier.classify` (mesma forma que
 * `ClassifierOpts` Story 1.2).
 */
export interface ClassifyOpts {
  /** Subset de domains apresentados ao Haiku. Default: todos os 10. */
  availableDomains?: readonly ToolDomain[];
  /** Override `DEFAULT_CLASSIFIER_MODEL` (testar diferentes Haiku snapshots). */
  model?: string;
  /** Default 512. */
  maxTokens?: number;
  /** Default 0 (determinismo). */
  temperature?: number;
}

/**
 * Redacta padrões PII conhecidos do raw response e trunca para inclusão segura
 * em error messages.
 *
 * Aborda **SF-3 (PO Pax)** promovido a actionable pelo CodeRabbit Iter 1
 * (comment #4 sobre `classifier.ts:108-134`): o raw response do Haiku pode
 * ecoar valores monetários, emails ou IDs longos do prompt do utilizador.
 * Antes de inserir em `Error.message` (visível em logs públicos / error
 * tracking via Story 1.8 `/api/agent/prompt`), substitui esses padrões por
 * placeholders `[REDACTED:type]` mantendo estrutura JSON visível para debug
 * (chaves `intents`, `confidence`, nomes de domains permanecem legíveis).
 *
 * Patterns redactados (ordem importa — mais específicos primeiro):
 * 1. Email — `local@host.tld` → `[REDACTED:email]`
 * 2. Valores monetários — `€78,70`, `$100`, `£50.5` → `[REDACTED:money]`
 * 3. Sequências de 6+ dígitos — IDs, números de telefone, NIFs, IBANs →
 *    `[REDACTED:digits]`
 *
 * Trade-off vs simples truncate: mantém debuggability da estrutura JSON e
 * domain names (essenciais para perceber o erro) mas remove valores
 * sensíveis. Trunca a `maxLen` chars no final para limitar tamanho do log.
 */
function redactRawResponse(raw: string, maxLen: number = 200): string {
  const redacted = raw
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED:email]')
    .replace(/[€$£¥]\s*\d+(?:[.,]\d+)?/g, '[REDACTED:money]')
    .replace(/\b\d{6,}\b/g, '[REDACTED:digits]');

  if (redacted.length <= maxLen) return redacted;
  return `${redacted.slice(0, maxLen)}…[truncated ${redacted.length - maxLen} chars]`;
}

/**
 * Validação adicional fail-loud do output Haiku.
 *
 * Lança `Error` PT-PT específico identificando o problema (intent inválido,
 * confidence fora de range, key órfã) + `rawResponse` truncado para debug.
 *
 * Não altera `ClassificationResultSchema` canonical — apenas reforça
 * constraints no domínio aplicacional (Story 1.4).
 */
function validateClassifierOutput(
  result: ClassificationResult,
  availableDomains: readonly ToolDomain[]
): void {
  const allowed = new Set<string>(availableDomains);
  const declaredIntents = new Set<string>(result.intents);
  const rawHint = redactRawResponse(result.rawResponse);

  // 1. Cada intent ∈ availableDomains
  for (const intent of result.intents) {
    if (!allowed.has(intent)) {
      throw new Error(
        `Classifier: intent "${intent}" não está em availableDomains — Haiku gerou domínio inválido. rawResponse: ${rawHint}`
      );
    }
  }

  // 2. Cada confidence[d] ∈ [0, 1] para d ∈ intents
  for (const intent of result.intents) {
    const value = result.confidence[intent];
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
      throw new Error(
        `Classifier: confidence["${intent}"] = ${value} fora do range [0, 1] — prompt drift. rawResponse: ${rawHint}`
      );
    }
  }

  // 3. Cada key em confidence corresponde a um intent declarado
  for (const key of Object.keys(result.confidence)) {
    if (!declaredIntents.has(key)) {
      throw new Error(
        `Classifier: confidence["${key}"] não corresponde a intent declarado. rawResponse: ${rawHint}`
      );
    }
  }
}

/**
 * Classifica um prompt PT-PT do utilizador em domínios funcionais.
 *
 * Pipeline:
 * 1. Trim + valida userPrompt non-empty
 * 2. Constrói system prompt PT-PT few-shot via {@link buildClassifierSystemPrompt}
 * 3. Invoca `AnthropicClassifier.classify` via factory `getClassifier()`
 *    (Story 1.2). O classifier valida shape via `ClassificationResultSchema`
 *    e converte resposta da API → `ClassificationResult` tipado.
 * 4. Aplica validação adicional fail-loud (`validateClassifierOutput`):
 *    intents ⊆ availableDomains, confidence ∈ [0,1], orphan keys
 * 5. Retorna `ClassificationResult` validado
 *
 * Erros:
 * - `Error('Classifier: userPrompt obrigatório')` — input vazio/whitespace
 * - `ZodError` — output Haiku malformado (do `AnthropicClassifier`, Story 1.2)
 * - `Error('Classifier: intent ...')` — intent fora de availableDomains
 * - `Error('Classifier: confidence[...] = ... fora do range')` — value drift
 * - `Error('Classifier: confidence[...] não corresponde a intent declarado')` — orphan
 *
 * @param userPrompt - Prompt do utilizador em PT-PT (será trimmed)
 * @param opts - Override defaults (availableDomains, model, maxTokens, temperature)
 * @returns ClassificationResult com intents (domains) + confidence per-intent + tokens
 */
export async function classifyPrompt(
  userPrompt: string,
  opts: ClassifyOpts = {}
): Promise<ClassificationResult> {
  const trimmed = userPrompt.trim();
  if (trimmed.length === 0) {
    throw new Error('Classifier: userPrompt obrigatório');
  }

  // Guard upfront (CodeRabbit comment #3): rejeita lista vazia explícita
  // ANTES de aplicar default ALL_DOMAINS ou construir o system prompt. Lista
  // vazia significa "nenhum domain válido" — chamar Haiku seria desperdício
  // (sempre retornaria intents fora de availableDomains).
  if (opts.availableDomains !== undefined && opts.availableDomains.length === 0) {
    throw new Error(
      'Classifier: availableDomains não pode ser vazio — fornece pelo menos um domain ou omite o parâmetro para usar todos os 10 domains (ALL_DOMAINS)'
    );
  }

  const availableDomains = opts.availableDomains ?? ALL_DOMAINS;
  const systemPrompt = buildClassifierSystemPrompt(availableDomains);

  const classifier = getClassifier();
  const result = await classifier.classify(systemPrompt, trimmed, {
    model: opts.model,
    maxTokens: opts.maxTokens ?? DEFAULT_CLASSIFIER_OPTS.maxTokens,
    temperature: opts.temperature ?? DEFAULT_CLASSIFIER_OPTS.temperature,
  });

  validateClassifierOutput(result, availableDomains);
  return result;
}
