/**
 * Nexus v2 — Classifier JSON sanitization (hotfix produção 2026-05-31)
 *
 * Funções partilhadas para limpar a resposta do classifier (Haiku) antes do
 * `JSON.parse`. O Haiku ocasionalmente envolve o JSON em markdown fences
 * (```` ```json ... ``` ````) ou prosa, apesar do system prompt pedir "APENAS
 * JSON". Estas funções removem isso de forma robusta.
 *
 * **Porque vivem aqui (single source of truth):** estavam definidas só em
 * `providers/anthropic.ts` (classifier server-side, hotfixes 2026-05-09 +
 * 2026-05-18). Quando o cérebro migrou para client-side (ADR-9, Story 1.11), o
 * `InferenceTransport.classify` reimplementou o parsing do classifier mas
 * OMITIU este strip → regressão de produção (cérebro down para prompts-com-tool,
 * detectada na verificação pós-deploy da Story 1.12, 2026-05-31). Extrair para
 * módulo partilhado evita uma 3ª divergência: tanto `AnthropicClassifier` (Node/
 * Edge) como `InferenceTransport` (`'use client'`) importam daqui.
 *
 * Edge-safety (ADR-1): processamento de string puro — sem `fs`/`crypto`/`path`/
 * `child_process`, sem deps. Seguro em Edge, Node e browser.
 *
 * `mock-protocol-fidelity.md`: os mocks do classifier (unit + E2E) devolvem JSON
 * COM fences para exercitar este strip — ver `tests/mocks/proxy-fetch.ts` e
 * `tests/e2e/regression/helpers/mock-events.ts`.
 */

/**
 * Extrai o primeiro objecto JSON balanceado de uma string a partir de um índice
 * inicial. Conta chavetas `{` e `}` respeitando strings e escapes para suportar
 * conteúdo como `"label": "{x}"` sem desbalancear. Retorna o substring entre a
 * primeira `{` (inclusive) e a `}` que fecha o objecto raiz, ou `null` se não
 * encontrar um JSON balanceado.
 *
 * Usado como rede de segurança em {@link stripJsonMarkdownFences} para o caso
 * em que o Haiku devolve JSON misturado com prosa noutra forma que os regex
 * não cobrem (texto antes do fence, fence parcial, etc).
 */
export function extractFirstJsonObject(input: string, startIndex: number = 0): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = startIndex; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return input.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Remove markdown code fences que a Haiku ocasionalmente envolve à volta do
 * JSON apesar do system prompt pedir "APENAS JSON válido, sem markdown".
 *
 * Padrões observados em produção:
 *
 *   Hotfix 2026-05-09 (cobre):
 *     "```json\n{...}\n```"          (fence simétrico, fim absoluto)
 *     "```\n{...}\n```"              (fence sem language tag)
 *
 *   Hotfix 2026-05-18 (cobre adicionalmente — bug em prod com prompts vagos):
 *     "```json\n{...}\n```\n<prosa>" (fence + prosa explicativa a seguir)
 *     "<prosa>\n```json\n{...}\n```" (prosa antes do fence)
 *     "<prosa>\n```\n{...}\n```\n<prosa>" (prosa antes e depois)
 *
 *   Hotfix 2026-05-31 (regressão client-side, ADR-9): o `InferenceTransport`
 *     client-side passa a usar esta mesma função (antes fazia `JSON.parse` cru).
 *
 * Estratégia (em ordem):
 * 1. Se a string trimmed começa com fence E acaba com fence → strip simétrico (caso simples).
 * 2. Senão, procurar a primeira abertura ` ``` ` e o próximo ` ``` ` a seguir;
 *    se ambos existirem, devolver o conteúdo entre eles (cobre prosa antes e depois).
 * 3. Senão, fallback: extrair o primeiro objecto JSON balanceado (`{...}`)
 *    via {@link extractFirstJsonObject} — cobre variantes sem fences ou com
 *    fences malformados.
 * 4. Senão, devolver a string trimmed intacta — o `JSON.parse` falhará com
 *    mensagem PT-PT que mostra o `rawResponse` original (debuggability).
 *
 * O `rawResponse` original (com fences/prosa) é preservado no campo
 * `ClassificationResult.rawResponse` para debug e PII redaction downstream.
 */
export function stripJsonMarkdownFences(raw: string): string {
  const trimmed = raw.trim();

  // Caso 1: fence simétrico start+end (mantém comportamento do hotfix anterior).
  const fenceOpenMatch = trimmed.match(/^```(?:json)?\s*\n?/i);
  const fenceCloseMatch = trimmed.match(/\n?\s*```$/);
  if (fenceOpenMatch && fenceCloseMatch) {
    return trimmed.slice(fenceOpenMatch[0].length, trimmed.length - fenceCloseMatch[0].length).trim();
  }

  // Caso 2: fence em qualquer posição — extrai o conteúdo entre o primeiro
  // ``` de abertura e o próximo ``` de fecho. Cobre prosa antes ou depois.
  const openRegex = /```(?:json)?\s*\n?/i;
  const openMatch = openRegex.exec(trimmed);
  if (openMatch) {
    const afterOpen = openMatch.index + openMatch[0].length;
    const closeIdx = trimmed.indexOf('```', afterOpen);
    if (closeIdx !== -1) {
      return trimmed.slice(afterOpen, closeIdx).trim();
    }
    // Fence de abertura sem fecho — tenta extrair JSON balanceado a partir
    // do fim do fence.
    const json = extractFirstJsonObject(trimmed, afterOpen);
    if (json) return json;
  }

  // Caso 3: fallback — extrai primeiro objecto JSON balanceado.
  const json = extractFirstJsonObject(trimmed);
  if (json) return json;

  // Caso 4: devolve intacto — parse vai falhar com mensagem útil.
  return trimmed;
}
