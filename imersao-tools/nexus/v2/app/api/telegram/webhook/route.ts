/**
 * Nexus v2 — Webhook receiver Telegram (Edge) (Story 6.11 — FR70)
 *
 * `POST /api/telegram/webhook` — PRIMEIRO endpoint do Nexus que recebe input
 * não-solicitado da internet pública (EPIC-6.md §2/§9, Risco R2/R3). Na 6.11 é um
 * STUB de PORTEIRO DE ORIGEM: valida o `secret_token` e responde 200 `{ok:true}`
 * SEM parsear o body. O parse de texto/voz/foto, o fan-out e o filtro `chatId`
 * são da story 6.12 ([D-6.11-WEBHOOK-STUB]/[D-6.11-CHATID]/C8).
 *
 * Edge runtime (ADR-1 / arch §4.1): só leitura de header + comparação de string +
 * `Response`. Zero `node:crypto`, zero `googleapis`, zero API Node-only.
 *
 * Verificação de origem (arch §9.5):
 *   - Telegram envia o header `x-telegram-bot-api-secret-token` igual ao
 *     `secret_token` registado no `setWebhook` (= `TELEGRAM_WEBHOOK_SECRET`).
 *   - Status de recusa: 403 Forbidden ([D-6.11-401-VS-403]/C4 — vinculativo, NÃO
 *     401: o `secret_token` é um segredo fixo partilhado, não uma credencial
 *     negociável; um chamador sem o segredo é um intruso, não um cliente por
 *     autenticar — sem caminho de remediação → 403).
 *   - Comparação `!==` directa, NÃO timing-safe ([D-6.11-TIMING-SAFE]/C4): o Edge
 *     não dispõe de `crypto.timingSafeEqual` (`node:crypto` é Node-only) e o
 *     vector de timing sobre um segredo de ≥32 chars de alta entropia, na rede
 *     pública, é impraticável. Contrasta deliberadamente com `CRON_SECRET`
 *     (`secretsMatch` timing-safe), que corre em Node.
 *
 * FAIL-CLOSED EXPLÍCITO (C2 CRÍTICA — eixo c ponto 3, anti-padrão M4 da 4.9):
 *   se `TELEGRAM_WEBHOOK_SECRET` estiver ausente/vazio em env, o webhook devolve
 *   403 INCONDICIONAL ANTES de comparar qualquer header. NUNCA aceitar um request
 *   quando o segredo não está configurado — tratar ausência de segredo como
 *   permissão é exactamente o ponto cego que `internal-state-contract-gate.md`
 *   existe para apanhar. Não depender da coincidência frágil `header !== undefined`.
 *
 * Trace: AC4/AC5; arch §9.5; [D-6.11-401-VS-403]/[D-6.11-TIMING-SAFE]/[D-6.11-WEBHOOK-STUB]/
 * [D-6.11-CHATID]; C2/C4/C8.
 */

export const runtime = 'edge';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

/** Resposta 403 (origem não reconhecida — sem caminho de remediação). */
function forbidden(): Response {
  return new Response('forbidden', { status: 403 });
}

export async function POST(req: Request): Promise<Response> {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // C2 (CRÍTICA) — fail-closed: sem segredo configurado, recusar SEMPRE, ANTES de
  // ler/comparar headers. Nunca aceitar sem segredo (anti-padrão M4 da 4.9).
  if (!configuredSecret) {
    return forbidden();
  }

  // C4 — verificação de origem: header presente e igual ao segredo (`!==` directo).
  const providedSecret = req.headers.get(SECRET_HEADER);
  if (providedSecret !== configuredSecret) {
    return forbidden();
  }

  // C8 — stub 6.11: NÃO ler nem parsear o body. Parse + fan-out + filtro chatId
  // são da 6.12. Responder 200 para que o Telegram não re-tente.
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
