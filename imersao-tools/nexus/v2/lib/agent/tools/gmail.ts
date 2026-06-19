import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Tools cérebro Gmail (Story 6.10 — FR67 + FR68)
 *
 * Regista 3 tools de domínio `'gmail'` (`[D-6.10-GAP-DOMAIN]`=standalone, Aria
 * 19/06/2026) no `toolRegistry`:
 *   - `listar_emails_importantes`  — lê a vista Gmail (buckets importante+responder_hoje)
 *   - `criar_draft_gmail`          — cria um rascunho (draft) no Gmail
 *   - `arquivar_email`             — remove o label INBOX (arquivar)
 *
 * ACHADO ARQUITECTURAL CENTRAL — `[D-6.10-RUNTIME]` (ratificada Architect Gate de
 * Entrada, Aria 19/06/2026): o executor de tools corre CLIENT-SIDE no fluxo de
 * produção (ADR-9, `executor.ts:511-527`: o `noKvStub` LANÇA, e `getValidAccessToken`
 * é Node-only). Logo as 3 tools NÃO chamam a Gmail API, NÃO usam `getValidAccessToken`,
 * NÃO usam `ctx.kv` nem `@vercel/kv`. Operam EXCLUSIVAMENTE via `ctx.fetch(...)` a
 * endpoints server-side same-origin (cookie de sessão automático no browser — ADR-9).
 * O padrão canónico é `knowledge.ts:488` (`pesquisar_web_e_criar_nota`).
 *
 *   - `listar_emails_importantes` → reutiliza `GET /api/google/gmail/inbox` (route da
 *     6.9 — já faz `messages.list INBOX` + `kv.get` O(1) + `messages.get` lotes ≤10).
 *     Zero re-implementação, zero abertura da 6.9 (open-closed C2).
 *   - `criar_draft_gmail` → `POST /api/google/gmail/draft` (route NOVA 6.10).
 *   - `arquivar_email` → `POST /api/google/gmail/archive` (route NOVA 6.10).
 *
 * O trabalho Node-only (KV real + `getValidAccessToken()` + Gmail API + MIME RFC 2047)
 * vive nas routes server-side, NUNCA neste módulo.
 *
 * `[D-6.10-EMAILSUMMARY]` (OBS-6.10-2): o shape de cada email é definido por um
 * `resultSchema` Zod LOCAL — NÃO se importa `EmailSummary` de `inbox/route.ts`
 * (acoplamento errado route→tool). A tool parseia a resposta de `ctx.fetch`.
 *
 * `[D-6.10-PREVIEW]`=(a): `listar_emails_importantes`=`requiresPreview:false,
 * reversible:false` (read-only); `criar_draft_gmail`=`true, false` (efeito externo
 * directo — escreve no Gmail); `arquivar_email`=`true, false` (mutação de estado
 * externo no Gmail, não revertida automaticamente).
 *
 * `[D-6.10-DRAFT-MIME]`: `replyToMsgId` DEFERIDO (REC-6.10-THREADING) — ausente do
 * `argsSchema`. A construção MIME + RFC 2047 do subject vive na route `draft`.
 *
 * Nomes ASCII puro (`external-contract-identifiers.md`): `listar_emails_importantes`,
 * `criar_draft_gmail`, `arquivar_email` — todos em `[a-z][a-z0-9_]*` (TOOL_NAME_PATTERN,
 * `registry.ts:27`) + Anthropic spec. A semântica PT-PT vive nas `description`.
 *
 * SEM version bump Dexie: as tools Gmail NÃO escrevem em Dexie (`db.*` ausente).
 *
 * Trace: PRD-NEXUS-V2.md §6.12 (FR67+FR68); EPIC-6.md §5 row 6.10; architecture-v2.md
 * §7.2; Story 6.9 (route inbox reutilizada). Constitution: Art. IV (No Invention),
 * V (PT-PT), VI (imports `@/...`).
 */

/**
 * Wrapper tipado de registo (mesmo padrão de `calendar.ts:60`/`knowledge.ts:55`) —
 * preserva os genéricos `TArgs`/`TResult` de cada `defineTool` no `register`.
 */
function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

/**
 * Erro descritivo (PT-PT) para `arquivar_email` sobre um email que já não existe
 * no Gmail (404 — Trash esvaziado / eliminado). Eixo (b) da análise de ciclo de
 * vida (Architect Gate de Entrada). Lançado sem efeito colateral.
 */
export class GmailMessageNotFoundError extends Error {
  constructor(msgId: string) {
    super(`Email não encontrado no Gmail: "${msgId}".`);
    this.name = 'GmailMessageNotFoundError';
  }
}

/** URLs das routes server-side (relativas, same-origin — cookie automático). */
const INBOX_URL = '/api/google/gmail/inbox';
const DRAFT_URL = '/api/google/gmail/draft';
const ARCHIVE_URL = '/api/google/gmail/archive';

/**
 * Lê e descodifica o `{ error }` do corpo de uma resposta de falha sem rebentar
 * (corpo pode não ser JSON). C3 — inspecciona o CORPO, não só `resp.ok`.
 */
async function readError(resp: Response): Promise<string | undefined> {
  const data = (await resp.json().catch(() => null)) as { error?: unknown } | null;
  return typeof data?.error === 'string' ? data.error : undefined;
}

/**
 * Mensagem PT-PT para falha de transporte (a `ctx.fetch` rejeitou — rede caiu,
 * DNS, abort). Tratada explicitamente em todas as tools: uma rejeição do fetch
 * NUNCA escapa como erro cru — é convertida em erro descritivo (anti-M4).
 */
const TRANSPORT_ERROR_MESSAGE =
  'Não foi possível contactar o Gmail agora (falha de ligação). Tenta de novo daqui a pouco.';

/**
 * Executa `ctx.fetch` a uma route Gmail tratando a falha de transporte
 * explicitamente: se o `fetch` rejeitar (não-2xx é tratado a jusante por quem
 * chama), lança um `Error` PT-PT em vez de propagar a rejeição crua. C3 — falha
 * de rede é falha, nunca sucesso silencioso.
 */
async function gmailRouteFetch(
  ctx: ExecutionContext,
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await ctx.fetch(url, init);
  } catch {
    throw new Error(TRANSPORT_ERROR_MESSAGE);
  }
}

/**
 * Mapeia um código de erro das routes Gmail para uma mensagem PT-PT descritiva.
 * Distingue 401 (sessão/scope), 503 (Gmail indisponível) e genérico. NUNCA trata
 * uma falha como sucesso (anti-M4 da 4.9).
 */
function describeGmailError(code: string | undefined): string {
  switch (code) {
    case 'not_connected':
      return 'O Gmail não está ligado. Liga a conta Google nas Definições.';
    case 'token_revoked':
      return 'O acesso ao Gmail foi revogado. Volta a ligar a conta Google nas Definições.';
    case 'refresh_failed':
    case 'gmail_unavailable':
      return 'O Gmail está temporariamente indisponível. Tenta de novo daqui a pouco.';
    case 'invalid_request':
      return 'O pedido ao Gmail é inválido — verifica os dados e tenta de novo.';
    default:
      return 'Não foi possível contactar o Gmail agora. Tenta de novo mais tarde.';
  }
}

// ═══════════════════════════════════════════════════════════════════
// listar_emails_importantes (FR68) — reutiliza GET /api/google/gmail/inbox (6.9)
// requiresPreview: false (consulta read-only) — D-6.10-PREVIEW
// ═══════════════════════════════════════════════════════════════════

const ListarEmailsArgs = z.object({
  limit: z.number().int().positive().max(50).optional().default(10),
});

/**
 * Shape LOCAL de cada email (`[D-6.10-EMAILSUMMARY]`) — espelha o que a route 6.9
 * devolve em `{ emails: EmailSummary[] }`, SEM importar de `inbox/route.ts`.
 */
const EmailSummarySchema = z.object({
  id: z.string(),
  bucket: z.enum(['importante', 'responder_hoje']),
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  classifiedAt: z.number(),
});

const InboxResponseSchema = z.object({
  emails: z.array(EmailSummarySchema),
});

const ListarEmailsResultSchema = z.object({
  emails: z.array(EmailSummarySchema),
  total: z.number(),
});

type ListarEmailsResult = z.infer<typeof ListarEmailsResultSchema>;

/** Ordem de relevância: `importante` antes de `responder_hoje` (AC2 v). */
const BUCKET_PRIORITY: Record<'importante' | 'responder_hoje', number> = {
  importante: 0,
  responder_hoje: 1,
};

registar(
  defineTool<z.infer<typeof ListarEmailsArgs>, ListarEmailsResult>({
    name: 'listar_emails_importantes',
    description:
      'Mostra os emails importantes e a responder hoje da caixa de entrada do Gmail. Use para "mostra emails importantes", "que emails tenho para responder hoje?", "tenho emails urgentes?".',
    domain: 'gmail',
    argsSchema: ListarEmailsArgs,
    resultSchema: ListarEmailsResultSchema,
    requiresPreview: false, // consulta read-only — D-6.10-PREVIEW
    reversible: false,
    execute: async (args, ctx: ExecutionContext) => {
      const { limit = 10 } = args;

      // Reutiliza a route 6.9 (já faz messages.list INBOX + kv.get + messages.get
      // lotes ≤10 server-side). Cookie de sessão same-origin automático (ADR-9).
      const resp = await gmailRouteFetch(ctx, INBOX_URL, { method: 'GET' });

      // C3 — inspecciona `resp.ok` E o corpo `{ error }`. KV vazio / zero
      // classificados → a route devolve 200 `{ emails: [] }` (estado VÁLIDO, não erro).
      if (!resp.ok) {
        throw new Error(describeGmailError(await readError(resp)));
      }
      const parsed = InboxResponseSchema.safeParse(
        await resp.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new Error(
          'Resposta inesperada do Gmail ao listar emails. Tenta de novo mais tarde.',
        );
      }

      // Ordena por relevância (importante → responder_hoje), depois aplica o limit.
      const ordered = [...parsed.data.emails].sort(
        (a, b) => BUCKET_PRIORITY[a.bucket] - BUCKET_PRIORITY[b.bucket],
      );
      return {
        emails: ordered.slice(0, limit),
        total: ordered.length,
      };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// criar_draft_gmail (FR67) — POST /api/google/gmail/draft (route NOVA 6.10)
// requiresPreview: true (efeito externo directo) — D-6.10-PREVIEW
// ═══════════════════════════════════════════════════════════════════

// `replyToMsgId` DEFERIDO (REC-6.10-THREADING, [D-6.10-DRAFT-MIME]) — ausente do schema.
const CriarDraftArgs = z.object({
  to: z.string().email('endereço de email inválido'),
  subject: z.string().min(1, 'assunto obrigatório'),
  body: z.string().min(1, 'corpo do email obrigatório'),
});

const CriarDraftResultSchema = z.object({
  draftId: z.string(),
  subject: z.string(),
  to: z.string(),
});

type CriarDraftResult = z.infer<typeof CriarDraftResultSchema>;

const DraftCreatedResponseSchema = z.object({
  draftId: z.string(),
  subject: z.string(),
  to: z.string(),
});

registar(
  defineTool<z.infer<typeof CriarDraftArgs>, CriarDraftResult>({
    name: 'criar_draft_gmail',
    description:
      'Cria um rascunho (draft) no Gmail. Use para "responde à Maria a confirmar reunião sexta", "escreve um email ao Pedro sobre o projecto". O rascunho fica em Gmail > Rascunhos para reveres antes de enviar.',
    domain: 'gmail',
    argsSchema: CriarDraftArgs,
    resultSchema: CriarDraftResultSchema,
    requiresPreview: true, // efeito externo directo — escreve no Gmail (D-6.10-PREVIEW)
    reversible: false,
    execute: async (args, ctx: ExecutionContext) => {
      const { to, subject, body } = args;

      // Route server-side faz o trabalho Node-only (token + MIME RFC 2047 + Gmail API).
      const resp = await gmailRouteFetch(ctx, DRAFT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });

      // C3 — `resp.ok` E corpo `{ error }`; nunca sucesso silencioso.
      if (!resp.ok) {
        throw new Error(describeGmailError(await readError(resp)));
      }
      const parsed = DraftCreatedResponseSchema.safeParse(
        await resp.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new Error(
          'Resposta inesperada do Gmail ao criar o rascunho. Tenta de novo mais tarde.',
        );
      }
      return parsed.data;
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// arquivar_email (FR68) — POST /api/google/gmail/archive (route NOVA 6.10)
// requiresPreview: true (mutação externa) — D-6.10-PREVIEW
// ═══════════════════════════════════════════════════════════════════

const ArquivarEmailArgs = z.object({
  msgId: z.string().min(1, 'id do email obrigatório'),
});

const ArquivarEmailResultSchema = z.object({
  msgId: z.string(),
  archived: z.literal(true),
});

type ArquivarEmailResult = z.infer<typeof ArquivarEmailResultSchema>;

const ArchivedResponseSchema = z.object({
  msgId: z.string(),
  archived: z.literal(true),
});

registar(
  defineTool<z.infer<typeof ArquivarEmailArgs>, ArquivarEmailResult>({
    name: 'arquivar_email',
    description:
      'Arquiva um email no Gmail (remove-o da caixa de entrada, sem o apagar). Use para "arquiva este email", "tira este email da inbox".',
    domain: 'gmail',
    argsSchema: ArquivarEmailArgs,
    resultSchema: ArquivarEmailResultSchema,
    requiresPreview: true, // mutação de estado externo no Gmail (D-6.10-PREVIEW)
    reversible: false,
    execute: async (args, ctx: ExecutionContext) => {
      const { msgId } = args;

      const resp = await gmailRouteFetch(ctx, ARCHIVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgId }),
      });

      // C3 — 404 distinto (email eliminado) → GmailMessageNotFoundError (eixo b).
      if (resp.status === 404) {
        throw new GmailMessageNotFoundError(msgId);
      }
      if (!resp.ok) {
        throw new Error(describeGmailError(await readError(resp)));
      }
      const parsed = ArchivedResponseSchema.safeParse(
        await resp.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new Error(
          'Resposta inesperada do Gmail ao arquivar o email. Tenta de novo mais tarde.',
        );
      }
      return parsed.data;
    },
  }),
);
