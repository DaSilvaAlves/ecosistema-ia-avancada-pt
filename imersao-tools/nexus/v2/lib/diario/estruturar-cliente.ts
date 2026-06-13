import { stripJsonMarkdownFences } from '@/lib/agent/classifier-json';
import { DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import {
  parseStructuredDiario,
  type StructuredDiarioResponse,
} from '@/lib/diario/ai-estrutura';

/**
 * Nexus v2 — Helper client-side de estruturação AI do diário (Story 5.4 — AC2/AC4)
 *
 * `[D-5.4-ENDPOINT]` (Architect Gate de entrada, Aria 10/06/2026):
 *   Escolha 1 — runtime: reutiliza `/api/anthropic/proxy` (Opção B). NÃO existe
 *               `/api/diario/estruturar`. Este helper espelha
 *               `InferenceTransport.classify` (`inference-transport.ts:242-311`).
 *   Escolha 2 — transporte: JSON síncrono (`stream` ausente no body → o proxy
 *               devolve o JSON da Anthropic Messages API tal-qual).
 *   Escolha 3 — shape: `{ whatHappened?; whatLearned?; whatFelt? }`, validado via
 *               o Zod `.strict()` do helper puro, mapeado 1:1 a `structuredAI?`.
 *
 * Edge-safety (ADR-1 / NFR5): este módulo NÃO importa `@anthropic-ai/sdk` nem a
 * `ANTHROPIC_API_KEY`. A key vive SÓ no proxy server-side. Só `fetch` + parsing
 * de string. Pode correr em módulo `'use client'`.
 *
 * Contrato de erro (AC4, `internal-state-contract-gate.md` eixo c): qualquer
 * falha — `!res.ok`, ausência de `content[].text`, JSON inválido após strip,
 * shape inválido — **lança** `Error` com mensagem PT-PT. NÃO devolve preview
 * vazio silencioso. A UI apanha o throw → estado `error`. `res.ok` é verificado
 * **antes** de ler o body (lição Epic 4 §5.1).
 *
 * Constitution:
 * - Article IV (No Invention): wire shape espelha a Anthropic Messages API.
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...`.
 */

/** URL do proxy Edge — relativa, resolve contra a origin do browser. */
const PROXY_URL = '/api/anthropic/proxy';

/** Tecto de tokens da resposta — 3 buckets curtos chegam folgadamente. */
const DEFAULT_MAX_TOKENS = 1024;

/**
 * System prompt PT-PT de estruturação. Pede ao Sonnet para reorganizar o texto
 * livre em 3 buckets e devolver APENAS JSON com as chaves exactas do contrato
 * (`whatHappened`/`whatLearned`/`whatFelt`). Os campos são opcionais: a AI omite
 * o bucket que o texto não suportar (não inventa conteúdo).
 *
 * Não é segredo (o `system` do classifier também vive client-side via
 * `InferenceTransport`) — pode viver em módulo `'use client'`. A key, essa, não.
 */
export const ESTRUTURAR_SYSTEM_PROMPT = `És o cérebro de organização do diário pessoal do Nexus.

Recebes o texto livre de uma entrada de diário (em português europeu) e reorganiza-lo em três campos:
- "whatHappened" — o que aconteceu (factos, acontecimentos do dia)
- "whatLearned" — o que aprendi (lições, conclusões, ideias)
- "whatFelt" — o que senti (emoções, estado de espírito)

Regras:
1. Usa o conteúdo REAL do texto. Não inventes nem acrescentes informação que não esteja no texto.
2. Se o texto não tiver conteúdo relevante para um campo, OMITE esse campo (não devolvas uma string vazia).
3. Escreve em português europeu (PT-PT), na primeira pessoa, de forma concisa.
4. Responde APENAS com JSON válido, sem markdown, sem prosa antes ou depois. As únicas chaves permitidas são "whatHappened", "whatLearned" e "whatFelt".

Exemplo de resposta:
{"whatHappened":"...","whatLearned":"...","whatFelt":"..."}`;

/**
 * Lê o corpo de erro do proxy de forma tolerante (JSON ou texto) e devolve uma
 * mensagem PT-PT concisa. Não inclui a `ANTHROPIC_API_KEY` (o proxy nunca a
 * devolve) nem o prompt cru (NFR11). Espelha `proxyErrorMessage` de
 * `inference-transport.ts:184-198`.
 */
async function proxyErrorMessage(res: Response): Promise<string> {
  let detail = '';
  try {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      detail = typeof parsed.error === 'string' ? parsed.error : text.slice(0, 200);
    } catch {
      detail = text.slice(0, 200);
    }
  } catch {
    detail = '';
  }
  return `Não foi possível estruturar a entrada (proxy respondeu ${res.status}${
    detail ? ` — ${detail}` : ''
  }).`;
}

/** Opções da chamada (modelo/tokens overridable em testes; `fetchFn` injectável). */
export interface EstruturarOpts {
  model?: string;
  maxTokens?: number;
  /**
   * `fetch` injectável para testes (default `globalThis.fetch` vinculado a
   * `globalThis`). Em produção é o `fetch` do browser. O bind do default é
   * obrigatório: o `fetch` nativo exige `this === Window`; invocá-lo como
   * `this.fetchFn(...)` sem bind dá `Illegal invocation` (DEV-DECISION D-FETCH-BIND,
   * Story 1.12 — `inference-transport.ts:214-228`).
   */
  fetchFn?: typeof fetch;
}

/**
 * Estrutura o texto livre de uma entrada de diário via proxy de inferência
 * (Sonnet, JSON síncrono). Devolve `{ whatHappened?; whatLearned?; whatFelt? }`
 * pronto para `updateJournalEntry(id, { structuredAI })`.
 *
 * Lança PT-PT em qualquer falha (rede, `!res.ok`, body sem `text`, JSON
 * inválido, shape inválido) — a UI mapeia ao estado `error` (AC4).
 */
export async function estruturarDiario(
  bodyMarkdown: string,
  opts: EstruturarOpts = {},
): Promise<StructuredDiarioResponse> {
  // Short-circuit de input vazio (dívida da 5.7/5.8, mesma classe do CR Major 2
  // da 5.7): se não há texto, lança PT-PT ANTES do fetch — não desperdiça uma
  // chamada ao proxy nem `max_tokens` com uma entrada que a AI não pode estruturar.
  if (!bodyMarkdown.trim()) {
    throw new Error('Não há texto para estruturar.');
  }

  const fetchFn = opts.fetchFn ?? globalThis.fetch.bind(globalThis);

  const res = await fetchFn(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: 0,
      system: ESTRUTURAR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: bodyMarkdown }],
    }),
  });

  // `internal-state-contract-gate.md` eixo c: verificar `res.ok` ANTES do body.
  if (!res.ok) {
    throw new Error(await proxyErrorMessage(res));
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const textBlock = data.content?.find((b) => b.type === 'text');
  if (!textBlock || typeof textBlock.text !== 'string') {
    throw new Error(
      'A resposta de estruturação não contém texto — tenta novamente.',
    );
  }

  // O Sonnet pode envolver o JSON em markdown fences apesar do prompt pedir
  // "APENAS JSON" — reutiliza o mesmo strip do classifier (hotfix 2026-05-31).
  const cleaned = stripJsonMarkdownFences(textBlock.text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      'A resposta de estruturação não é JSON válido — tenta novamente.',
    );
  }

  // Zod `.strict()` — campo renomeado/extra falha (AC5). Lança PT-PT.
  return parseStructuredDiario(parsed);
}
