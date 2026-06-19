import { kv } from '@vercel/kv';
import { z } from 'zod';
import { getServerEnv } from '@/lib/shared/env';
import { DEFAULT_CLASSIFIER_MODEL } from '@/lib/agent/models';

/**
 * Nexus v2 — Helper puro de classificação da inbox Gmail em 4 buckets
 * (Story 6.8 — FR64 + FR65)
 *
 * Lê os últimos ~50 emails da inbox (`messages.list` + `messages.get` em
 * `format=metadata`), classifica os que ainda não estão em cache via Anthropic
 * (Haiku) e persiste o bucket de cada email em Vercel KV (`nexus:cache:gmail:
 * classify:<msgId>`, TTL 7d). Primeira consumidora do scope `gmail.modify` (6.7).
 *
 * Decisões @architect ratificadas (Architect Gate de Entrada T0, Aria 19/06/2026 —
 * condições C1-C5, vinculativas):
 *   [D-6.8-FORMAT]  (C —) `format=metadata` com `metadataHeaders=Subject,From,Date`.
 *                   Só cabeçalhos, sem body (`format=full` traria parsing MIME e
 *                   custo de tokens proibitivo em 50 emails × Haiku — viola R4).
 *   [D-6.8-BATCH]   (C1) `messages.list` (1 chamada) + `messages.get` em PARALELO
 *                   LIMITADO — lotes de ≤10 com `Promise.all` por lote. NÃO 50
 *                   sequenciais (arrisca o timeout 30s da route Node), NÃO 50 em
 *                   paralelo total (quota Gmail per-user 250 quota-units/s;
 *                   `messages.get` metadata = 5 unidades → 50/s num lote de 10 é
 *                   seguro).
 *   [D-6.8-AI-PROMPT] (C2) Anthropic API chamada DIRECTAMENTE server-side
 *                   (`api.anthropic.com`, `x-api-key`/`ANTHROPIC_API_KEY`), NUNCA o
 *                   proxy Edge `/api/anthropic/proxy` (cookie-gated → inutilizável
 *                   por cron, reintroduziria a superfície SSRF da 5.11). Espelha
 *                   `calendar.ts` a chamar o Google com `fetch` directo (MSW
 *                   intercepta). Resposta validada com Zod `.strict()` (4 buckets
 *                   como `msgId[]`); a AI NÃO gera ids — um id devolvido fora do
 *                   lote enviado é rejeitado.
 *   [D-6.8-MODEL-CONST] (C4) `DEFAULT_CLASSIFIER_MODEL` de `lib/agent/models.ts`
 *                   (`claude-haiku-4-5-20251001`, com snapshot). PROIBIDO o literal
 *                   sem snapshot.
 *   [C5] Escrita KV INCREMENTAL por email — cada `msgId` classificado é escrito
 *                   assim que o seu bucket é validado por Zod, NÃO acumular o lote
 *                   em memória e escrever só no fim (uma falha tardia perderia todo
 *                   o progresso). Estado parcial após falha = progresso preservado
 *                   (próximo run lê do cache). `classified` conta só os persistidos.
 *
 * Ciclo de vida (eixo c, `internal-state-contract-gate.md`):
 *   - Gmail 401 (`invalid_grant`) → `GmailAuthError` (a route mapeia 401). Nenhuma
 *     escrita KV.
 *   - Gmail 429/5xx → `GmailSyncError` (a route mapeia 503). Os `msgId`s já escritos
 *     antes da falha permanecem; os restantes ficam não-classificados.
 *   - Anthropic 5xx / shape inválido → `GmailClassifyError` (route 503); nenhum email
 *     do lote AI falhado é escrito (a escrita só ocorre após Zod `.strict()`).
 *
 * Node runtime (ADR-1) — `@vercel/kv` + fetch server-side. NUNCA importar em Edge.
 *
 * Trace: AC1/AC2/AC3/AC5/AC6/AC7; EPIC-6.md §5 row 6.8; [D-6.8-*]; padrão
 * `lib/google/calendar.ts` (6.3).
 */

/** Endpoint real de `messages.list` da Gmail API v1 (utilizador autenticado). */
const GMAIL_MESSAGES_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/messages';

/** Endpoint real da Anthropic Messages API (chamada directa server-side, C2). */
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/** Quantos emails ler da inbox (FR65 — "últimos N (~50)"). */
const MAX_RESULTS = 50;

/** Tamanho do lote paralelo de `messages.get` ([D-6.8-BATCH]/C1 — ≤10). */
const GET_BATCH_SIZE = 10;

/** TTL da cache de classificação: 7 dias em segundos (arch §6). */
const CACHE_TTL_SECONDS = 7 * 24 * 3600;

/** Prefixo da chave KV de classificação por `msgId` (arch §6 linha 599). */
const CACHE_KEY_PREFIX = 'nexus:cache:gmail:classify:';

/**
 * Marcador de domínio no prompt do classifier Gmail. Identifica esta tarefa (vs
 * o classifier multi-intent do Epic 1) — usado pelo MSW para discriminar o
 * handler de mock (`mock-protocol-fidelity.md`). Inócuo em produção (é só uma
 * etiqueta de contexto para o modelo).
 */
export const GMAIL_CLASSIFIER_MARKER = '[NEXUS_GMAIL_CLASSIFIER]';

/** Constrói a chave KV de classificação de um `msgId`. */
export function classifyCacheKey(msgId: string): string {
  return `${CACHE_KEY_PREFIX}${msgId}`;
}

/**
 * Os 4 buckets do contrato interno (ASCII, sem acentos —
 * `external-contract-identifiers.md`). A grafia PT-PT humana vive na camada
 * semântica (UI/LLM), não neste identificador.
 */
export const GMAIL_BUCKETS = [
  'importante',
  'responder_hoje',
  'pode_esperar',
  'descartavel',
] as const;

export type GmailBucket = (typeof GMAIL_BUCKETS)[number];

/** Valor persistido em KV por `msgId` (arch §6 linha 599). */
export interface GmailClassifyCacheValue {
  bucket: GmailBucket;
  classifiedAt: number;
}

/** Resultado devolvido ao caller (route) — telemetria do run de classificação. */
export interface ClassifyResult {
  /** Emails efectivamente classificados pela AI e persistidos neste run. */
  classified: number;
  /** Emails servidos da cache KV (não re-classificados — mitigação R4). */
  fromCache: number;
  /** Total de `msgId`s lidos da inbox (`messages.list`). */
  total: number;
}

/** Erro de autenticação na Gmail API (HTTP 401 — access token rejeitado). A route mapeia 401. */
export class GmailAuthError extends Error {
  constructor(message = 'Access token Google rejeitado pela Gmail API (401).') {
    super(message);
    this.name = 'GmailAuthError';
  }
}

/** Erro transitório da Gmail API (429 / 5xx / rede). A route mapeia 503. */
export class GmailSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailSyncError';
  }
}

/** Erro de classificação AI (Anthropic 5xx / timeout / shape inválido). A route mapeia 503. */
export class GmailClassifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailClassifyError';
  }
}

// ---------------------------------------------------------------------------
// Shape do wire Gmail API (fidelidade de protocolo — mock-protocol-fidelity.md)
// ---------------------------------------------------------------------------

/** Resposta real de `users.messages.list` (snake_case; `id` é o `msgId` da cache). */
interface GmailMessagesListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

/** Cabeçalho real de `payload.headers[]` (`{ name, value }`). */
interface GmailHeader {
  name: string;
  value: string;
}

/** Resposta real de `users.messages.get` com `format=metadata`. */
interface GmailMessageMetadata {
  id: string;
  threadId?: string;
  payload?: { headers?: GmailHeader[] };
}

/** Email reduzido enviado à AI para classificação (sem body, [D-6.8-FORMAT]). */
interface EmailForClassification {
  id: string;
  subject: string;
  from: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Wire schema da resposta AI (Zod .strict() — falsificável, C2/AC6)
// ---------------------------------------------------------------------------

/**
 * Wire shape da resposta do classifier AI ([D-6.8-AI-PROMPT]/C2). Os 4 buckets são
 * OBRIGATÓRIOS (arrays vazios permitidos); cada item é um `msgId` (string não-vazia).
 * A AI NÃO gera ids — só reordena por bucket os ids que recebeu (padrão 5.7/1.11).
 *
 * `.strict()` (não `.passthrough()`): um bucket renomeado (`importante`→`important`)
 * ou um campo extra faz o parse FALHAR. É o mecanismo que satisfaz AC6
 * (`mock-protocol-fidelity.md`): o contrato wire é falsificável.
 */
export const GmailClassifyWireSchema = z
  .object({
    importante: z.array(z.string().trim().min(1)),
    responder_hoje: z.array(z.string().trim().min(1)),
    pode_esperar: z.array(z.string().trim().min(1)),
    descartavel: z.array(z.string().trim().min(1)),
  })
  .strict();

export type GmailClassifyWire = z.infer<typeof GmailClassifyWireSchema>;

/** Wire shape da resposta da Anthropic Messages API (só o que precisamos). */
interface AnthropicMessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
}

// ---------------------------------------------------------------------------
// Leitura da inbox (Gmail API — fetch directo, MSW intercepta)
// ---------------------------------------------------------------------------

/** Mapeia um erro de status Gmail para a classe tipada correcta. */
function gmailErrorFor(status: number, context: string): Error {
  if (status === 401) return new GmailAuthError();
  return new GmailSyncError(`Gmail API recusou ${context} (HTTP ${status}).`);
}

/**
 * Lista os `msgId`s dos últimos `MAX_RESULTS` emails da inbox (`labelIds=INBOX`).
 * Devolve apenas os ids — os detalhes vêm de `getMessageMetadata`.
 */
async function listInboxMessageIds(accessToken: string): Promise<string[]> {
  const url = new URL(GMAIL_MESSAGES_ENDPOINT);
  url.searchParams.set('maxResults', String(MAX_RESULTS));
  url.searchParams.set('labelIds', 'INBOX');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new GmailSyncError(`Falha de rede ao listar mensagens: ${message}`);
  }

  if (!res.ok) {
    throw gmailErrorFor(res.status, 'a listagem de mensagens');
  }

  const data = (await res.json()) as GmailMessagesListResponse;
  return (data.messages ?? []).map((m) => m.id);
}

/** Extrai (case-insensitive) o valor de um header `payload.headers[]` por nome. */
function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  const target = name.toLowerCase();
  const found = headers?.find((h) => h.name.toLowerCase() === target);
  return found?.value ?? '';
}

/**
 * Obtém os metadados de um email (`format=metadata`, [D-6.8-FORMAT]) e reduz ao
 * shape de classificação `{ id, subject, from, date }`. Lança classes tipadas em
 * 401 / 429 / 5xx.
 */
async function getMessageMetadata(
  accessToken: string,
  msgId: string,
): Promise<EmailForClassification> {
  const url = new URL(`${GMAIL_MESSAGES_ENDPOINT}/${msgId}`);
  url.searchParams.set('format', 'metadata');
  url.searchParams.append('metadataHeaders', 'Subject');
  url.searchParams.append('metadataHeaders', 'From');
  url.searchParams.append('metadataHeaders', 'Date');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new GmailSyncError(`Falha de rede ao obter o email ${msgId}: ${message}`);
  }

  if (!res.ok) {
    throw gmailErrorFor(res.status, `o detalhe do email ${msgId}`);
  }

  const data = (await res.json()) as GmailMessageMetadata;
  const headers = data.payload?.headers;
  return {
    id: data.id,
    subject: headerValue(headers, 'Subject'),
    from: headerValue(headers, 'From'),
    date: headerValue(headers, 'Date'),
  };
}

/**
 * Obtém os metadados de N `msgId`s em PARALELO LIMITADO — lotes de `GET_BATCH_SIZE`
 * (≤10) com `Promise.all` por lote ([D-6.8-BATCH]/C1). Equilibra latência (evita o
 * timeout 30s da route Node de 50 GETs sequenciais) com a quota per-user do Gmail.
 */
async function getMessagesInBatches(
  accessToken: string,
  msgIds: string[],
): Promise<EmailForClassification[]> {
  const out: EmailForClassification[] = [];
  for (let i = 0; i < msgIds.length; i += GET_BATCH_SIZE) {
    const batch = msgIds.slice(i, i + GET_BATCH_SIZE);
    const results = await Promise.all(
      batch.map((id) => getMessageMetadata(accessToken, id)),
    );
    out.push(...results);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Classificação AI (Anthropic API DIRECTA — C2)
// ---------------------------------------------------------------------------

/**
 * Constrói o prompt de classificação. A AI recebe a lista `{ id, subject, from,
 * date }` e deve devolver SÓ um objecto JSON com os 4 buckets, cada um com os `id`s
 * que pertencem a esse bucket. Instrução explícita: usar apenas os `id`s fornecidos
 * (a AI não gera ids — C2).
 */
function buildClassifierPrompt(emails: EmailForClassification[]): string {
  return [
    GMAIL_CLASSIFIER_MARKER,
    'És um classificador de inbox. Classifica cada email num de 4 buckets de prioridade:',
    '- "importante": resposta necessária urgente (remetente conhecido, assunto crítico).',
    '- "responder_hoje": deve ser respondido hoje, mas não é uma emergência.',
    '- "pode_esperar": não urgente, pode aguardar.',
    '- "descartavel": newsletters, notificações automáticas, promoções, spam classificável.',
    '',
    'Devolve EXCLUSIVAMENTE um objecto JSON com exactamente estas 4 chaves',
    '("importante", "responder_hoje", "pode_esperar", "descartavel"), cada uma um array',
    'com os "id" dos emails desse bucket. Usa SÓ os "id" fornecidos abaixo — não inventes ids.',
    'Cada email pertence a exactamente um bucket. Não incluas texto fora do JSON.',
    '',
    'Emails:',
    JSON.stringify(emails),
  ].join('\n');
}

/**
 * Remove cercas markdown (```json … ```) à volta de um payload JSON, caso a AI as
 * inclua. Espelha o `stripJsonMarkdownFences` usado pelos parsers 5.4/5.7.
 */
function stripJsonFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Chama a Anthropic Messages API DIRECTAMENTE (C2) e devolve o wire validado com
 * Zod `.strict()`. A AI NÃO gera ids — qualquer `id` devolvido que não estava no
 * lote enviado é rejeitado (defesa C2). `temperature: 0` (determinístico).
 */
async function classifyWithAI(
  emails: EmailForClassification[],
): Promise<GmailClassifyWire> {
  const apiKey = getServerEnv().ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GmailClassifyError('ANTHROPIC_API_KEY ausente — impossível classificar.');
  }

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': ANTHROPIC_VERSION,
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: DEFAULT_CLASSIFIER_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: 'user', content: buildClassifierPrompt(emails) }],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new GmailClassifyError(`Falha de rede ao contactar a Anthropic: ${message}`);
  }

  if (!res.ok) {
    throw new GmailClassifyError(`Anthropic recusou a classificação (HTTP ${res.status}).`);
  }

  let data: AnthropicMessagesResponse;
  try {
    data = (await res.json()) as AnthropicMessagesResponse;
  } catch {
    throw new GmailClassifyError('Resposta da Anthropic não é JSON válido.');
  }

  const text = data.content?.find((c) => c.type === 'text')?.text;
  if (!text) {
    throw new GmailClassifyError('Resposta da Anthropic sem conteúdo de texto.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFences(text));
  } catch {
    throw new GmailClassifyError('A AI não devolveu JSON parseável.');
  }

  const result = GmailClassifyWireSchema.safeParse(parsedJson);
  if (!result.success) {
    // Shape inválido (bucket renomeado / campo extra / não-array) → falsificável (AC6).
    throw new GmailClassifyError('A AI devolveu um formato de classificação inesperado.');
  }

  // Defesa C2: a AI não gera ids — descartar qualquer id fora do lote enviado.
  const allowed = new Set(emails.map((e) => e.id));
  const filterAllowed = (ids: string[]): string[] => ids.filter((id) => allowed.has(id));
  return {
    importante: filterAllowed(result.data.importante),
    responder_hoje: filterAllowed(result.data.responder_hoje),
    pode_esperar: filterAllowed(result.data.pode_esperar),
    descartavel: filterAllowed(result.data.descartavel),
  };
}

/** Inverte o wire `{ bucket: id[] }` para um mapa `{ id: bucket }` (1.ª atribuição vence). */
function wireToBucketByMsgId(wire: GmailClassifyWire): Map<string, GmailBucket> {
  const byId = new Map<string, GmailBucket>();
  for (const bucket of GMAIL_BUCKETS) {
    for (const id of wire[bucket]) {
      if (!byId.has(id)) byId.set(id, bucket);
    }
  }
  return byId;
}

// ---------------------------------------------------------------------------
// Cache KV (escrita incremental por email — C5)
// ---------------------------------------------------------------------------

/** `true` se o valor lido de KV tem a forma `{ bucket, classifiedAt }` esperada. */
function isCacheValue(value: unknown): value is GmailClassifyCacheValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.classifiedAt === 'number' &&
    typeof v.bucket === 'string' &&
    (GMAIL_BUCKETS as readonly string[]).includes(v.bucket)
  );
}

// ---------------------------------------------------------------------------
// Orquestração (AC1)
// ---------------------------------------------------------------------------

/**
 * Classifica os últimos ~50 emails da inbox em 4 buckets de prioridade (AC1).
 *
 * @param accessToken Access token válido — obtido pela route via
 *   `getValidAccessToken()` (nunca aqui; AC1 — desacopla do store de tokens).
 * @returns `{ classified, fromCache, total }`.
 *
 * Fluxo: (1) `messages.list` → `msgId`s; (2) lê a cache KV de cada `msgId` —
 * hits TTL-válidos contam para `fromCache` e são excluídos do lote AI (mitigação
 * R4); (3) `messages.get` em lotes ≤10 dos não-cacheados; (4) classifica via
 * Anthropic directa; (5) persiste cada bucket validado em KV INCREMENTALMENTE
 * (C5, TTL 7d). Se todos os `msgId`s estiverem em cache, NÃO chama `messages.get`
 * nem a Anthropic (AC2).
 */
export async function classifyInboxEmails(accessToken: string): Promise<ClassifyResult> {
  const msgIds = await listInboxMessageIds(accessToken);
  const total = msgIds.length;

  // (2) Separar cacheados (TTL-válido) de não-classificados. O TTL é nativo do KV:
  // uma chave expirada devolve `null` → colapsa em "não-classificado" (eixo a).
  const uncached: string[] = [];
  let fromCache = 0;
  for (const id of msgIds) {
    const cached = await kv.get<unknown>(classifyCacheKey(id));
    if (cached !== null && cached !== undefined && isCacheValue(cached)) {
      fromCache++;
    } else {
      uncached.push(id);
    }
  }

  // (AC2) Tudo em cache → zero chamadas Gmail/AI.
  if (uncached.length === 0) {
    return { classified: 0, fromCache, total };
  }

  // (3) Detalhes dos não-cacheados em lotes paralelos (C1).
  const emails = await getMessagesInBatches(accessToken, uncached);

  // (4) Classificação AI directa (C2).
  const wire = await classifyWithAI(emails);
  const bucketByMsgId = wireToBucketByMsgId(wire);

  // (5) Persistência INCREMENTAL por email (C5) — escreve assim que o bucket é
  // válido, nunca acumular para o fim. `classified` conta só os efectivamente
  // persistidos (um email que a AI não classificou fica não-classificado).
  let classified = 0;
  const classifiedAt = Date.now();
  for (const email of emails) {
    const bucket = bucketByMsgId.get(email.id);
    if (!bucket) continue;
    const value: GmailClassifyCacheValue = { bucket, classifiedAt };
    await kv.set(classifyCacheKey(email.id), value, { ex: CACHE_TTL_SECONDS });
    classified++;
  }

  return { classified, fromCache, total };
}
