import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Tool cérebro Telegram (Story 6.17 — FR76)
 *
 * Regista 1 tool de domínio `'telegram'` no `toolRegistry`:
 *   - `enviar_telegram` — envia uma mensagem de texto ao próprio utilizador via bot
 *
 * ACHADO ARQUITECTURAL CENTRAL — `[D-6.17-RUNTIME]` (ratificada Architect Gate de
 * Entrada, Aria 23/06/2026, C1): o executor de tools corre CLIENT-SIDE no fluxo de
 * produção (ADR-9: o `noKvStub` LANÇA, e `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`
 * são server-only). Logo `enviar_telegram` NÃO chama `sendMessage` directamente
 * (impossível no browser — token server-only). Opera EXCLUSIVAMENTE via
 * `ctx.fetch('/api/telegram/send', ...)` (route Node same-origin, cookie de sessão
 * automático — ADR-9). O padrão canónico é `gmail.ts` (6.10).
 *
 * `[D-6.17-CHATID]` (anti-SSRF, vinculativa C3): o `argsSchema` contém APENAS
 * `{ text }`. O `chat_id` NUNCA é argumento da tool — é sempre `TELEGRAM_CHAT_ID`
 * server-side, lido na route. Se fosse argumento, o LLM poderia construir um
 * `chat_id` arbitrário (alucinação/prompt injection) e a tool tornar-se-ia um
 * primitivo de envio para destinatários arbitrários. O destinatário é um
 * invariante do contrato de segurança server-side, fora do alcance do modelo.
 *
 * `[D-6.17-REVERSIBLE]` (C4): `requiresPreview:false, reversible:false`. Uma
 * mensagem entregue no Telegram não pode ser retirada (`reversible:false`, igual
 * a todas as tools de efeito externo do Epic 6). `requiresPreview:false` (diverge
 * de `criar_draft_gmail`) porque o destinatário é fixo (o próprio utilizador) e o
 * efeito é uma notificação self-directed em resposta a um pedido explícito — a
 * conversa no chat Nexus é, ela própria, o preview. Não há terceiro a proteger.
 *
 * `[D-6.17-CONTRACT]` (C5): a route devolve 200 `{ ok:true }` em sucesso; o
 * `resultSchema` da tool é `{ sent:boolean }` e mapeia 200 → `{ sent:true }`. O
 * nome `sent` (semântica da tool: "foi enviado?") é distinto de `ok` (semântica
 * HTTP da route) — separação deliberada. A tool valida `resp.ok` E o corpo
 * `{ ok:true }` (defesa em profundidade); corpo malformado num 2xx → `Error`.
 *
 * Anti-M4 da 4.9 (C6, eixo c): qualquer 4xx/5xx ou rejeição de `ctx.fetch` →
 * `Error` PT-PT descritivo distinto, JAMAIS `{ sent:true }`. Reutiliza o padrão
 * `gmailRouteFetch`/`describeGmailError` de `gmail.ts:102-133`.
 *
 * Nome ASCII puro (`external-contract-identifiers.md`): `enviar_telegram` está em
 * `[a-z][a-z0-9_]*` (TOOL_NAME_PATTERN, `registry.ts:27`) + Anthropic spec. A
 * semântica PT-PT vive na `description`.
 *
 * SEM version bump Dexie: a tool NÃO escreve em Dexie (`db.*` ausente — envio é
 * stateless/fire-and-forget, coerente com a 6.13 que ignora o ack da Bot API).
 *
 * Trace: PRD-NEXUS-V2.md §6.13 (FR76); EPIC-6.md §5 row 6.17; architecture-v2.md
 * §7.2; Story 6.13 (`sendMessage` reutilizado). Constitution: Art. IV (No
 * Invention), V (PT-PT), VI (imports `@/...`).
 */

/**
 * Wrapper tipado de registo (mesmo padrão de `gmail.ts:58`/`calendar.ts:60`) —
 * preserva os genéricos `TArgs`/`TResult` de `defineTool` no `register`.
 */
function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

/** URL da route server-side (relativa, same-origin — cookie automático). */
const SEND_URL = '/api/telegram/send';

/** Limite de `text` da Bot API `sendMessage` (4096 chars) — fail-fast local. */
const MAX_TEXT_LENGTH = 4096;

/**
 * Mensagem PT-PT para falha de transporte (a `ctx.fetch` rejeitou — rede caiu,
 * DNS, abort). Tratada explicitamente: uma rejeição do fetch NUNCA escapa como
 * erro cru — é convertida em erro descritivo (anti-M4, eixo c).
 */
const TRANSPORT_ERROR_MESSAGE =
  'Não foi possível contactar o Telegram agora (falha de ligação). Tenta de novo daqui a pouco.';

/**
 * Lê e descodifica o `{ error }` do corpo de uma resposta de falha sem rebentar
 * (corpo pode não ser JSON). C6 — inspecciona o CORPO, não só `resp.ok`.
 */
async function readError(resp: Response): Promise<string | undefined> {
  const data = (await resp.json().catch(() => null)) as { error?: unknown } | null;
  return typeof data?.error === 'string' ? data.error : undefined;
}

/**
 * Executa `ctx.fetch` à route de envio tratando a falha de transporte
 * explicitamente: se o `fetch` rejeitar (não-2xx é tratado a jusante por quem
 * chama), lança um `Error` PT-PT em vez de propagar a rejeição crua. C6 — falha
 * de rede é falha, nunca sucesso silencioso (padrão `gmailRouteFetch`).
 */
async function telegramRouteFetch(
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
 * Mapeia um código de erro da route `/api/telegram/send` para uma mensagem PT-PT
 * descritiva. Distingue sessão (401), pedido inválido (400), config server-side
 * ausente (503 `chat_id_missing`/`bot_token_missing`) e Telegram indisponível
 * (502). NUNCA trata uma falha como sucesso (anti-M4 da 4.9, eixo c).
 */
function describeTelegramError(code: string | undefined): string {
  switch (code) {
    case 'not_authenticated':
      return 'A sessão expirou. Volta a iniciar sessão no Nexus para enviar mensagens Telegram.';
    case 'invalid_request':
      return 'A mensagem é inválida (vazia ou demasiado longa — máximo 4096 caracteres).';
    case 'chat_id_missing':
    case 'bot_token_missing':
      return 'O Telegram não está configurado no servidor. Configura o bot e o chat nas Definições.';
    case 'telegram_unavailable':
      return 'O Telegram está temporariamente indisponível. Tenta de novo daqui a pouco.';
    default:
      return 'Não foi possível enviar a mensagem Telegram agora. Tenta de novo mais tarde.';
  }
}

// ═══════════════════════════════════════════════════════════════════
// enviar_telegram (FR76) — POST /api/telegram/send (route Node nova 6.17)
// requiresPreview: false, reversible: false (notificação self-directed) — D-6.17-REVERSIBLE
// ═══════════════════════════════════════════════════════════════════

const EnviarTelegramArgs = z.object({
  text: z.string().min(1, 'a mensagem não pode estar vazia').max(MAX_TEXT_LENGTH),
});

const EnviarTelegramResultSchema = z.object({
  sent: z.boolean(),
});

type EnviarTelegramResult = z.infer<typeof EnviarTelegramResultSchema>;

/** Shape do corpo de sucesso da route (200) — `[D-6.17-CONTRACT]`. */
const SendOkResponseSchema = z.object({
  ok: z.literal(true),
});

registar(
  defineTool<z.infer<typeof EnviarTelegramArgs>, EnviarTelegramResult>({
    name: 'enviar_telegram',
    description:
      'Envia uma mensagem de texto para o utilizador via Telegram. Use para "envia-me uma mensagem no Telegram a dizer X", "manda-me um alerta no Telegram", "notifica-me no Telegram". A mensagem vai sempre para o próprio utilizador (não para terceiros).',
    domain: 'telegram',
    argsSchema: EnviarTelegramArgs,
    resultSchema: EnviarTelegramResultSchema,
    requiresPreview: false, // notificação self-directed em resposta a pedido explícito — D-6.17-REVERSIBLE
    reversible: false, // mensagem entregue não pode ser retirada — D-6.17-REVERSIBLE
    execute: async (args, ctx: ExecutionContext) => {
      const { text } = args;

      // Route server-side faz o trabalho Node-only (chat_id de env + Bot API).
      // O `chat_id` NUNCA é enviado no body (anti-SSRF — D-6.17-CHATID).
      const resp = await telegramRouteFetch(ctx, SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // C6 — `resp.ok` E corpo `{ ok:true }`; nunca sucesso silencioso (anti-M4).
      if (!resp.ok) {
        throw new Error(describeTelegramError(await readError(resp)));
      }
      const parsed = SendOkResponseSchema.safeParse(
        await resp.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new Error(
          'Resposta inesperada do servidor ao enviar a mensagem Telegram. Tenta de novo mais tarde.',
        );
      }
      // Mapeia 200 `{ ok:true }` → `{ sent:true }` (D-6.17-CONTRACT).
      return { sent: true };
    },
  }),
);
