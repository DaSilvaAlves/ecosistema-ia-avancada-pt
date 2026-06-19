import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getSession } from '@/lib/auth/session';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  classifyCacheKey,
  GMAIL_BUCKETS,
  type GmailBucket,
  type GmailClassifyCacheValue,
} from '@/lib/google/gmail';

/**
 * Nexus v2 — Leitura da vista Gmail no dashboard (Story 6.9, T1, AC2 — FR66)
 *
 * Rota `GET /api/google/gmail/inbox` — Node runtime (ADR-1: `@vercel/kv`/fetch
 * server-side / `getValidAccessToken` são Node-only). Devolve os emails dos buckets
 * `importante`+`responder_hoje` (FR66 — resto oculto por defeito) COM metadados
 * legíveis (Subject/From/Date) para o widget `GmailWidget` da Sidebar.
 *
 * [D-6.9-READ-ENDPOINT] (a-1 — re-derivação por `messages.list` + `kv.get` por id,
 * ratificada pelo Architect Gate de Entrada, Aria 19/06/2026):
 *   1. `getSession()` → 401 `not_connected` se inválida.
 *   2. `getValidAccessToken()` (único ponto de entrada de token — nunca
 *      `getTokens().accessToken`): `null` → 401 `not_connected`; `TokenRevokedError`
 *      → 401 `token_revoked`; `TokenRefreshError` → 503 `refresh_failed`.
 *   3. `GET /gmail/v1/users/me/messages?labelIds=INBOX&maxResults=50` (1 chamada) →
 *      `msgId[]`. Re-deriva a lista exactamente como `listInboxMessageIds` da 6.8
 *      faz internamente — a route REIMPLEMENTA este passo, NÃO importa nem altera o
 *      helper privado da 6.8 ([D-6.9-REUSE]).
 *   4. Para cada `msgId`: `kv.get(classifyCacheKey(id))` O(1) por id → lê
 *      `{ bucket, classifiedAt }`. FILTRA só `bucket ∈ { importante, responder_hoje }`;
 *      descarta silenciosamente `pode_esperar`/`descartavel`/`null` (TTL 7d expirado
 *      ou nunca classificado). PROIBIDO `kv.keys()`/`scan` (D-KV-HASH vinculativa,
 *      precedente `schedule-store.ts:17-19`) — C1.
 *   5. Para os `msgId`s filtrados: `messages.get?format=metadata&metadataHeaders=
 *      Subject,From,Date` em lotes ≤10 com `Promise.all` ([D-6.8-BATCH], reimplementado).
 *   6. `messages.get` 404 (email arquivado/eliminado pós-classificação, eixo b-ii)
 *      → email OMITIDO graciosamente; NÃO propaga 503 pela route inteira por 1 id (C3).
 *   7. Devolve `{ emails: EmailSummary[] }` (200 + lista vazia se inbox limpa).
 *
 * Distinção de estados (HTTP-status-based na origem, resolve [GAP-6.9-EMPTY-VS-NOT-
 * CONNECTED]): `getValidAccessToken() null` / sessão inválida → 401 `not_connected`;
 * `TokenRevokedError` / Gmail 401 → 401 `token_revoked`; `TokenRefreshError` → 503
 * `refresh_failed`; Gmail 429/5xx / rede → 503 `gmail_unavailable`; Gmail ligado com
 * zero ids nos 2 buckets → 200 `{ emails: [] }`. O componente distingue `erro-oauth`
 * de `empty` pelo HTTP status — sem 2.ª chamada ao `/status`. Anti-padrão M4 (4.9):
 * NUNCA `200 { ok: false }`.
 *
 * [D-6.9-REUSE] (open-closed): a route reusa SÓ os símbolos JÁ exportados da 6.8
 * (`classifyCacheKey`, `GMAIL_BUCKETS`, `GmailBucket`, `GmailClassifyCacheValue`) +
 * `getValidAccessToken`. `getMessageMetadata`/`getMessagesInBatches`/`isCacheValue`
 * são privadas na 6.8 — replicadas aqui, nunca exportadas. `lib/google/gmail.ts` e
 * `app/api/google/gmail/classify/route.ts` ficam INTOCADOS (`git diff` vazio — C2).
 *
 * Trace: AC1/AC2/AC3; EPIC-6.md §5 row 6.9; [D-6.9-READ-ENDPOINT]; [D-6.9-REUSE];
 * D-KV-HASH (schedule-store.ts:17-19); [D-6.8-BATCH]; arch §4.1 (Node runtime).
 */

export const runtime = 'nodejs';

/** Endpoint real de `messages.list`/`get` da Gmail API v1 (reimplementado, [D-6.9-REUSE]). */
const GMAIL_MESSAGES_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/messages';

/** Quantos emails ler da inbox (espelha MAX_RESULTS da 6.8 — FR65 "últimos ~50"). */
const MAX_RESULTS = 50;

/** Tamanho do lote paralelo de `messages.get` ([D-6.8-BATCH] — ≤10, reimplementado). */
const GET_BATCH_SIZE = 10;

/** Os 2 buckets que a vista mostra (FR66 — resto oculto por defeito). */
const VISIBLE_BUCKETS: ReadonlySet<GmailBucket> = new Set<GmailBucket>([
  'importante',
  'responder_hoje',
]);

/** Shape vinculativo de cada email devolvido ao widget (AC2 vii, [D-6.9-READ-ENDPOINT]). */
export interface EmailSummary {
  id: string;
  bucket: 'importante' | 'responder_hoje';
  subject: string;
  from: string;
  date: string;
  classifiedAt: number;
}

/** Resposta de sucesso da route (200). */
export interface InboxResponse {
  emails: EmailSummary[];
}

/** Resposta real de `users.messages.list` (`id` é o `msgId` da cache KV). */
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

/** Sentinela interno: `messages.get` devolveu 404 → omitir este email (C3). */
const OMIT = Symbol('omit');

/**
 * Type guard do valor lido de KV (`{ bucket, classifiedAt }`). Replicado da 6.8
 * (`isCacheValue`, privado) — [D-6.9-REUSE] proíbe exportá-lo de `gmail.ts`.
 */
function isCacheValue(value: unknown): value is GmailClassifyCacheValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.classifiedAt === 'number' &&
    typeof v.bucket === 'string' &&
    (GMAIL_BUCKETS as readonly string[]).includes(v.bucket)
  );
}

/** Extrai (case-insensitive) o valor de um header `payload.headers[]` por nome. */
function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  const target = name.toLowerCase();
  const found = headers?.find((h) => h.name.toLowerCase() === target);
  return found?.value ?? '';
}

/** Candidato filtrado da KV antes de buscar metadados Gmail. */
interface FilteredCandidate {
  id: string;
  bucket: 'importante' | 'responder_hoje';
  classifiedAt: number;
}

/**
 * Lista os `msgId`s dos últimos `MAX_RESULTS` emails da inbox (`labelIds=INBOX`).
 * Reimplementa `listInboxMessageIds` da 6.8 ([D-6.9-REUSE]). Devolve `null` em 401
 * (token revogado pela Gmail) para a route mapear `token_revoked`; lança em 5xx/rede.
 */
async function fetchInboxMessageIds(accessToken: string): Promise<string[] | null> {
  const url = new URL(GMAIL_MESSAGES_ENDPOINT);
  url.searchParams.set('maxResults', String(MAX_RESULTS));
  url.searchParams.set('labelIds', 'INBOX');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) return null; // Gmail rejeitou o token → token_revoked.
  if (!res.ok) {
    throw new Error(`Gmail messages.list HTTP ${res.status}`);
  }

  const data = (await res.json()) as GmailMessagesListResponse;
  return (data.messages ?? []).map((m) => m.id);
}

/**
 * Obtém os metadados de 1 email (`format=metadata`). Devolve `OMIT` em 404 (email
 * eliminado/arquivado pós-classificação — degradação graciosa, C3/eixo b-ii); `null`
 * em 401 (token revogado, propaga para `token_revoked`); lança em 5xx/rede.
 */
async function fetchMessageMetadata(
  accessToken: string,
  candidate: FilteredCandidate,
): Promise<EmailSummary | typeof OMIT | null> {
  const url = new URL(`${GMAIL_MESSAGES_ENDPOINT}/${candidate.id}`);
  url.searchParams.set('format', 'metadata');
  url.searchParams.append('metadataHeaders', 'Subject');
  url.searchParams.append('metadataHeaders', 'From');
  url.searchParams.append('metadataHeaders', 'Date');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 404) return OMIT; // Email já não existe no Gmail → omitir (C3).
  if (res.status === 401) return null; // Token revogado → token_revoked.
  if (!res.ok) {
    throw new Error(`Gmail messages.get HTTP ${res.status}`);
  }

  const data = (await res.json()) as GmailMessageMetadata;
  const headers = data.payload?.headers;
  return {
    id: candidate.id,
    bucket: candidate.bucket,
    subject: headerValue(headers, 'Subject'),
    from: headerValue(headers, 'From'),
    date: headerValue(headers, 'Date'),
    classifiedAt: candidate.classifiedAt,
  };
}

export async function GET(req: Request): Promise<Response> {
  // (i) Sessão de browser (a vista é cookie-gated — sem CRON_SECRET, é leitura UI).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  // (ii) Único ponto de entrada de access token (nunca getTokens().accessToken).
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof TokenRefreshError) {
      return NextResponse.json({ error: 'refresh_failed' }, { status: 503 });
    }
    throw err;
  }
  if (accessToken === null) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  try {
    // (iii) Re-deriva a lista de ids da inbox (1 chamada).
    const msgIds = await fetchInboxMessageIds(accessToken);
    if (msgIds === null) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }

    // (iv) `kv.get` O(1) por id — filtra os 2 buckets visíveis; descarta o resto e
    // os `null` (TTL expirado / não classificado). SEM `kv.keys()`/`scan` (C1).
    const candidates: FilteredCandidate[] = [];
    for (const id of msgIds) {
      const cached = await kv.get<unknown>(classifyCacheKey(id));
      if (!isCacheValue(cached)) continue; // null / corrompido → descartar.
      if (!VISIBLE_BUCKETS.has(cached.bucket)) continue; // pode_esperar/descartavel.
      candidates.push({
        id,
        bucket: cached.bucket as 'importante' | 'responder_hoje',
        classifiedAt: cached.classifiedAt,
      });
    }

    // (v) Metadados em lotes ≤10 com `Promise.all` ([D-6.8-BATCH] reimplementado).
    const emails: EmailSummary[] = [];
    for (let i = 0; i < candidates.length; i += GET_BATCH_SIZE) {
      const batch = candidates.slice(i, i + GET_BATCH_SIZE);
      const results = await Promise.all(
        batch.map((c) => fetchMessageMetadata(accessToken as string, c)),
      );
      for (const r of results) {
        if (r === null) {
          // Token revogado a meio dos GETs → 401 token_revoked.
          return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
        }
        if (r === OMIT) continue; // 404 — email omitido graciosamente (C3).
        emails.push(r);
      }
    }

    // (vii) 200 — lista vazia = inbox limpa (estado `empty` no componente).
    const body: InboxResponse = { emails };
    return NextResponse.json(body);
  } catch {
    // Gmail 429/5xx / rede / KV indisponível → 503 (nunca 200 { ok: false }, anti-M4).
    return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
  }
}
