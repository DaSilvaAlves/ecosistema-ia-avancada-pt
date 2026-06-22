import { sendMessage } from '@/lib/telegram/bot-api';
import { BRIDGE_SECRET_HEADER } from '@/app/api/telegram/process-text/route';

/**
 * Nexus v2 — Bridge voz Telegram → resposta de diferimento (Node) (Story 6.14 — FR72)
 *
 * `POST /api/telegram/process-voice` — bridge server-side Node para o canal de voz
 * do Telegram. ÂMBITO desta entrega = STUB FUNCIONAL DE DIFERIMENTO
 * ([D-6.14-TRANSCRIPTION-SERVICE]=(c), Architect Gate de Saída Aria 21/06/2026):
 * o canal de voz é roteado de ponta a ponta (webhook Edge → este bridge Node →
 * resposta ao utilizador via `sendMessage`), mas a etapa de transcrição é DIFERIDA
 * com uma resposta honesta PT-PT ([D-6.14-FALLBACK-VOICE] #1). O upgrade para
 * transcrição real (Whisper/OpenAI ou equiv.) é REC-6.14-TRANSCRIPTION-FUTURE.
 *
 * Porquê stub e não integração de transcrição (Architect Gate de Entrada):
 *   - [D-6.14-STT-ANTHROPIC]: a Messages API da Anthropic NÃO expõe speech-to-text
 *     nativo (confirmado contra doc actual) — a opção "Anthropic se disponível" do
 *     FR72 está eliminada. O bridge usa `ANTHROPIC_API_KEY` directo (factory SDK,
 *     cookieless), que não transcreve áudio.
 *   - A única opção full-feature seria um 2.º fornecedor externo (Whisper/OpenAI):
 *     nova conta+billing, `OPENAI_API_KEY` (path bloqueador), `api.openai.com` no
 *     CSP (path bloqueador) — sem chave provisionada pelo Eurico. O canal
 *     funcional-mas-diferido entrega valor verificável e mantém o open-closed.
 *
 * Porquê Node e não Edge ([D-6.14-DOWNLOAD-RUNTIME], ADR-1 / arch §4.1):
 *   - `sendMessage` (e, no futuro, o download do áudio + a transcrição) corre fora
 *     do orçamento Edge <5s. Precedente directo: o bridge de texto da 6.13
 *     (`process-text/route.ts:55` `runtime='nodejs'`). No stub, `runAgent` nem
 *     sequer é invocado — a resposta é a mensagem fixa de diferimento.
 *
 * Porquê bridge ÚNICO e não encadear `process-text` ([D-6.14-BRIDGE-ARCH]):
 *   - `process-voice` invocaria DIRECTAMENTE o cérebro (`runAgent`) quando a
 *     transcrição estiver activa, exactamente como `process-text` faz por import de
 *     símbolo — NÃO por um 2.º hop HTTP interno (evita 2.º shared-secret e latência).
 *   - No stub, o cérebro NÃO é chamado; o esqueleto fica desenhado para que a
 *     activação futura substitua só o passo "obter texto" antes do `runAgent`.
 *
 * Auth de chamada interna (C4 — paralelo C11 da 6.13): o bridge está em
 * `PUBLIC_PATHS` (`middleware.ts`) porque o webhook o chama cookieless. Em vez de
 * cookie, valida o shared-secret header (`BRIDGE_SECRET_HEADER`, reutilizado de
 * `process-text` — NÃO duplicar o literal) contra `TELEGRAM_WEBHOOK_SECRET`.
 * Fail-CLOSED: segredo ausente em env OU header diferente → 403, ANTES de qualquer
 * trabalho.
 *
 * Nota sobre [D-6.14-FALLBACK-VOICE] #2 (falha de infra do bridge): no stub a única
 * operação outbound é o `sendMessage` de diferimento. Se ELE falhar (Bot API down),
 * não há canal para entregar a mensagem de erro `ERROR_MESSAGE_PT` da 6.13 — só
 * resta registar (anti-M4) e devolver 200. Por isso `ERROR_MESSAGE_PT` NÃO é
 * importado nesta entrega (seria código morto). Quando a transcrição real for
 * activada (REC-6.14-TRANSCRIPTION-FUTURE), o download/transcrição falham ANTES da
 * entrega e aí `ERROR_MESSAGE_PT` É entregue ao utilizador — o import volta nesse
 * momento.
 *
 * Caminhos de falha (eixo c, `internal-state-contract-gate.md`):
 *   - segredo ausente / header errado → 403 fail-closed (nunca processar).
 *   - `chatId` inválido no corpo → 400 (não invoca `sendMessage`).
 *   - `sendMessage` lança (Bot API down) → `console.error` (anti-M4, NUNCA
 *     silencioso) + 200 ao webhook (NUNCA 5xx — anti-loop Telegram). O utilizador
 *     pode não receber resposta nesse caso de infra, mas o fluxo nunca parte.
 *
 * Trace: AC4/AC5/AC6/AC10; C1-C6; [D-6.14-TRANSCRIPTION-SERVICE]/
 * [D-6.14-DOWNLOAD-RUNTIME]/[D-6.14-BRIDGE-ARCH]/[D-6.14-FALLBACK-VOICE]/
 * [D-6.14-ENV-VAR]/[D-6.14-CSP]; EPIC-6.md §5 row 6.14.
 */

export const runtime = 'nodejs';

/**
 * Resposta de diferimento PT-PT — caminho FELIZ do stub da 6.14
 * ([D-6.14-FALLBACK-VOICE] #1). Sem detalhe técnico (NFR11). Esta é a mensagem que
 * o utilizador recebe quando envia uma mensagem de voz: o canal funciona (a voz
 * chegou e foi roteada), mas a transcrição está diferida.
 */
export const VOICE_DEFERRED_MESSAGE_PT =
  'Recebi a tua mensagem de voz, mas ainda não consigo processar áudio. ' +
  'Por agora, escreve a tua mensagem em texto.';

/** Resposta JSON 200 — o bridge NUNCA devolve 5xx que parta o fluxo (eixo c). */
function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Corpo de pedido do bridge de voz enviado pelo webhook.
 * No stub, só `chatId` é necessário (a resposta de diferimento não precisa do
 * ficheiro). `fileId` é OPCIONAL e fica reservado para REC-6.14-TRANSCRIPTION-FUTURE
 * (`getFile` + download no bridge Node) — inerte nesta entrega.
 */
interface ProcessVoiceBody {
  chatId?: unknown;
  fileId?: unknown;
}

export async function POST(req: Request): Promise<Response> {
  // (1) Auth de chamada interna (C4) — fail-CLOSED, ANTES de qualquer trabalho.
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return new Response('forbidden', { status: 403 });
  }
  const providedSecret = req.headers.get(BRIDGE_SECRET_HEADER);
  if (providedSecret !== configuredSecret) {
    return new Response('forbidden', { status: 403 });
  }

  // (2) Parse do corpo `{ chatId }`. Body inválido → 400 (não invocar `sendMessage`).
  // O webhook é o único caller e envia sempre `chatId`.
  let chatId: string;
  try {
    const raw = (await req.json()) as ProcessVoiceBody;
    // Normalizar e rejeitar edge cases: strings só com whitespace, NaN e Infinity
    // (CR 6.14 Minor — endpoint público, hardening de input antes de `sendMessage`).
    const normalizedChatId =
      typeof raw.chatId === 'string'
        ? raw.chatId.trim()
        : typeof raw.chatId === 'number' && Number.isFinite(raw.chatId)
          ? String(raw.chatId)
          : '';
    if (normalizedChatId.length === 0) {
      return new Response('bad request', { status: 400 });
    }
    chatId = normalizedChatId;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // (3) Resposta de diferimento ([D-6.14-FALLBACK-VOICE] #1). No stub NÃO há
  // download/transcrição/cérebro — a resposta é fixa. O bridge devolve SEMPRE 200
  // ao webhook (que já respondeu 200 ao Telegram). Se a entrega falhar (Bot API
  // down), regista (anti-M4) e devolve 200 na mesma (nunca 5xx — anti-loop).
  try {
    await sendMessage(chatId, VOICE_DEFERRED_MESSAGE_PT);
  } catch (sendError) {
    // Falha de infra do bridge ([D-6.14-FALLBACK-VOICE] #2): o próprio canal de
    // entrega falhou, logo não há como entregar a mensagem de erro — só registamos
    // para observability (anti-M4, NUNCA silencioso) e devolvemos 200 ao webhook
    // (NUNCA 5xx — anti-loop Telegram).
    console.error('[telegram-process-voice] falha ao enviar mensagem de voz', sendError);
  }
  return jsonOk({ ok: true, routed: true, type: 'voice' });
}
