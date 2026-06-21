import { runAgent } from '@/lib/agent/executor';
import { sendMessage } from '@/lib/telegram/bot-api';
// Barrel de registo das tools do cérebro (regista todas no `toolRegistry`).
// Importado pelo seu efeito colateral — o `runAgent` filtra por domínio a partir
// do registry povoado. Com `db:null` (server-side) as tools de DB são inertes
// ([D-6.13-DB-TOOLS]=(c)); a 6.13 entrega só a resposta conversacional do Sonnet.
import '@/lib/agent/tools';

/**
 * Nexus v2 — Bridge texto Telegram → cérebro multi-intent (Node) (Story 6.13 — FR71)
 *
 * `POST /api/telegram/process-text` — bridge server-side Node que invoca o cérebro
 * multi-intent (classificação Haiku → executor Sonnet → tools) para o texto recebido
 * pelo webhook Telegram, e devolve a resposta ao utilizador via `sendMessage`.
 *
 * Porquê uma route Node separada do webhook Edge ([D-6.13-RUNTIME]=(a), Architect
 * Gate Aria 21/06/2026):
 *   - O webhook (`telegram/webhook/route.ts`) corre em **Edge** com orçamento <5s
 *     (arch §4.1). O cérebro demora 10-30s — incompatível com `await` no Edge sem
 *     re-entrega em loop do Telegram (5xx). O webhook chama este bridge
 *     fire-and-forget ([D-6.13-TIMEOUT]=(c)) e responde 200 ao Telegram de imediato.
 *   - `runAgent` SEM `executor`/`classifier` injectados resolve o provider via o
 *     factory SDK Anthropic directo (`api.anthropic.com`, `ANTHROPIC_API_KEY`) —
 *     **Node-only**, logo `runtime='nodejs'` é OBRIGATÓRIO (C1). Precedente:
 *     `gmail/draft/route.ts:44`.
 *
 * ACHADO DE AUTH CENTRAL (C2/C3 — Architect Gate): o bridge NUNCA chama
 * `/api/anthropic/proxy` (Edge + cookie-gated → 401 sem `nexus_session`; o webhook é
 * cookieless). Ao NÃO injectar `executor`/`classifier`, o `runAgent` usa
 * `resolveServerExecutor()` → `getExecutor()` (SDK directo, cookieless). NUNCA
 * importar `client-executor.ts` (`'use client'`, injecta o `InferenceTransport` que
 * fala com o proxy 401).
 *
 * Auth de chamada interna (C11): o bridge está em `PUBLIC_PATHS` (`middleware.ts`)
 * porque o webhook o chama cookieless (paralelo do hotfix 4.8 / C6b da 6.12). Em vez
 * de cookie, valida um shared-secret header (`x-telegram-bridge-secret`) contra
 * `TELEGRAM_WEBHOOK_SECRET` (o mesmo segredo que o webhook já valida no
 * `secret_token` — o webhook é quem o envia). Fail-CLOSED: segredo ausente em env OU
 * header diferente → 403, ANTES de invocar o cérebro (não gastar Anthropic em
 * chamadas não autenticadas).
 *
 * Caminhos de falha ([D-6.13-ERROR-RESPONSE]=(a) / eixo c
 * `internal-state-contract-gate.md`):
 *   - cérebro lança / generator throw / resposta degenerada (sem texto) → envia a
 *     mensagem de erro PT-PT (NUNCA silencioso — anti-M4 da 4.9; NUNCA detalhes
 *     técnicos — NFR11). Devolve 200 ao webhook em qualquer caso (o webhook já
 *     respondeu 200 ao Telegram; este bridge nunca propaga 5xx que parta o fluxo).
 *   - texto final vazio do cérebro → fallback PT-PT (C8 — `sendMessage` NUNCA com
 *     `text` vazio).
 *
 * Trace: AC1-AC5/AC7; C1-C3/C8-C11; [D-6.13-RUNTIME]/[D-6.13-RESPONSE-MODE]/
 * [D-6.13-DB-TOOLS]/[D-6.13-TIMEOUT]/[D-6.13-ERROR-RESPONSE]; EPIC-6.md §5 row 6.13.
 */

export const runtime = 'nodejs';

/** Header da chamada interna webhook→bridge (shared-secret — C11). */
export const BRIDGE_SECRET_HEADER = 'x-telegram-bridge-secret';

/**
 * Mensagem de erro genérica PT-PT enviada ao utilizador se o cérebro falhar
 * ([D-6.13-ERROR-RESPONSE]=(a)). Sem detalhes técnicos (NFR11). Usada também como
 * fallback quando o cérebro não devolve texto (C8).
 */
export const ERROR_MESSAGE_PT =
  'Não consegui processar a tua mensagem agora. Tenta de novo daqui a pouco.';

/** Resposta JSON 200 — o bridge NUNCA devolve 5xx que parta o fluxo (eixo c). */
function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Corpo de pedido do bridge — `{ text, chatId }` enviado pelo webhook. */
interface ProcessTextBody {
  text?: unknown;
  chatId?: unknown;
}

/**
 * Consome o async generator do `runAgent`, acumulando os `text_delta` até `done`.
 * Devolve o texto final concatenado (trimmed). Erros do generator propagam-se ao
 * caller (try/catch no `POST`) — o evento `tool_error`/`done status:'failed'` é
 * emitido pelo executor antes do re-throw.
 *
 * Não há dependência do shape interno do executor para além de `text_delta.delta`
 * (campo do protocolo público `ExecutorSSEEvent`) — o teste de degeneração (C10)
 * cobre o caso de a resposta Anthropic não produzir texto.
 */
async function collectAgentText(text: string): Promise<string> {
  let acc = '';
  // SEM `executor`/`classifier`/`db` em opts → factory SDK Node cookieless (C2/C3).
  for await (const event of runAgent(text)) {
    if (event.type === 'text_delta') {
      acc += event.delta;
    }
  }
  return acc.trim();
}

export async function POST(req: Request): Promise<Response> {
  // (1) Auth de chamada interna (C11) — fail-CLOSED, ANTES de invocar o cérebro.
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return new Response('forbidden', { status: 403 });
  }
  const providedSecret = req.headers.get(BRIDGE_SECRET_HEADER);
  if (providedSecret !== configuredSecret) {
    return new Response('forbidden', { status: 403 });
  }

  // (2) Parse do corpo `{ text, chatId }`. Body inválido → 400 (não invocar cérebro
  // nem `sendMessage`). O webhook é o único caller e envia sempre ambos os campos.
  let text: string;
  let chatId: string;
  try {
    const raw = (await req.json()) as ProcessTextBody;
    if (typeof raw.text !== 'string' || raw.text.trim().length === 0) {
      return new Response('bad request', { status: 400 });
    }
    if (
      (typeof raw.chatId !== 'string' && typeof raw.chatId !== 'number') ||
      String(raw.chatId).length === 0
    ) {
      return new Response('bad request', { status: 400 });
    }
    text = raw.text;
    chatId = String(raw.chatId);
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // (3) Invoca o cérebro e envia a resposta. Toda a falha do cérebro/envio é
  // capturada: o utilizador recebe SEMPRE uma mensagem (resposta ou erro PT-PT);
  // o bridge devolve SEMPRE 200 ao webhook (que já respondeu 200 ao Telegram).
  try {
    const finalText = await collectAgentText(text);
    // C8 — texto vazio do cérebro → fallback PT-PT (NUNCA `sendMessage` com '').
    const reply = finalText.length > 0 ? finalText : ERROR_MESSAGE_PT;
    await sendMessage(chatId, reply);
    return jsonOk({ ok: true, routed: true });
  } catch (error) {
    // C9/AC5 — cérebro/envio falhou: tentar entregar a mensagem de erro PT-PT.
    // O `console.error` garante observability (anti-M4); o detalhe NÃO vai ao
    // utilizador (NFR11). Se o próprio `sendMessage` de erro falhar, engolimos
    // (nada mais a fazer) mas registamos — nunca propagar 5xx ao webhook.
    console.error('[telegram-process-text] falha ao processar texto', error);
    try {
      await sendMessage(chatId, ERROR_MESSAGE_PT);
    } catch (sendError) {
      console.error('[telegram-process-text] falha ao enviar mensagem de erro', sendError);
    }
    return jsonOk({ ok: true, routed: true });
  }
}
