# RETOMA — Story 6.11 (Telegram bot setup) FECHADA — Epic 6 a 11/17 — próximo 6.12

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** Pax (`@po`) — `*close-story 6.11`
- **to_agent:** any
- **created:** 20/06/2026
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Summary

A Story 6.11 (Telegram bot setup, FR69/FR70) está **FECHADA (Done)** em `main` via **PR #85 (squash `7c6e141c`)**, waiver 0. Abre o sub-módulo Telegram (agora 1/7). O fecho foi **docs-only** (`git mv` `active/` → `completed/`, Status → Done, `EPIC-6.md` 10/17 → **11/17**); o código já estava merged. `main` está em `7c6e141c`, sincronizado 0/0 com origin. As alterações de fecho ficam na working tree (não committed — `@devops` faz o commit do close, ou fica para a próxima janela). **Nada de push.**

## Context

**Estado verificado:**
- Story 6.11 MERGED: PR #85 squash `7c6e141c`. Commits da branch: `1524fa3d` (close-docs 6.10), `21be26c9` (feat 6.11), `37db0001` (fix CR Iter 1: 4 findings).
- `main` HEAD = `7c6e141c`, 0/0 com `origin/main`.
- Gates: Architect Gate de Entrada **PASS-COM-CONDIÇÕES** (9 decisões `[D-6.11-*]` + C1-C9 + análise 3 eixos `internal-state-contract-gate.md`); PO **GO 9/10**; DEV (C1-C9 cumpridas, +26 testes); Architect Gate de Saída **PASS** (security review limpo, CR `--base main` 0 findings).
- CR App no PR: Iter 1 = 4 findings (2 Major código: #4 timeout `AbortController`/`BotApiTimeoutError` em `bot-api.ts`, #3 `getMe` 502-vs-400 em `setup/route.ts`; + 2 doc) → `@dev *apply-qa-fixes` (+4 testes falsificáveis) → Iter 2 APPROVED limpo. **Waiver 0.** Suite ~2224.

**Decisões-âncora `[D-6.11-*]` (ratificadas — NÃO reabrir):**
- **SDK:** Bot API por **`fetch` directo, sem SDK** (decisão ratificada pelo Eurico). `node-telegram-bot-api` **REMOVIDA** do `package.json`+lockfile → as **2 criticals `npm audit`** da cadeia `request`/`form-data` **ELIMINADAS** (5→3 criticals; as 3 restantes são devDeps `vitest` pré-existentes, fora de scope). `package.json` é path bloqueador (`not-tested-trailer-rules.md`) — evidência `npm audit` antes/depois está no Change Log da story.
- **`[D-6.11-SETUP-SPLIT]`:** setup = **route Node** `POST /api/telegram/setup` (`runtime='nodejs'`, auth `getSession`); webhook receiver = **Edge** `POST /api/telegram/webhook` (`runtime='edge'`); helper `lib/telegram/bot-api.ts` por `fetch` é Edge-safe.
- **`[D-6.11-401-VS-403]`:** webhook recusa origem inautêntica com **403** (NÃO 401 — `secret_token` é segredo fixo, não credencial negociável). Vinculativo.
- **C2 (CRÍTICA) fail-closed:** se `TELEGRAM_WEBHOOK_SECRET` ausente/vazio em env → 403 incondicional ANTES de comparar headers (anti-padrão M4 da 4.9).
- **C3:** ordem de escrita Telegram→KV (KV nunca afirma `webhookSet:true` sem `setWebhook` confirmado).
- **`[D-6.11-WEBHOOK-STUB]`:** stub 200 puro sem parsear o body (parse/fan-out são 6.12).
- **`[D-6.11-KV-SCHEMA]`:** `nexus:telegram:bot → {tokenHint(últimos 4 chars), chatId, webhookSet, webhookUrl, webhookSetAt}` — token completo e `secret_token` NUNCA em KV; sem `kv.keys()`/`scan` (D-KV-HASH).
- **`[D-6.11-GET-ME]`:** `getMe` valida token ANTES de `setWebhook` (token inválido → `description:"Unauthorized"`).
- **`[D-6.11-CHATID]`:** filtro `chatId === TELEGRAM_CHAT_ID` é da **6.12** (exige parsear o body — fora do âmbito da 6.11; pré-requisito C8 da 6.11).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260620-story-6.11-FECHADA-epic-6-11de17-proximo-6.12.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Débitos deferidos (não-bloqueantes — registados na story)

| ID | Débito | Severidade | Destino |
|----|--------|-----------|---------|
| REC-6.11-COHERENCE | Sem check proactivo `getWebhookInfo` da divergência KV↔Telegram | Baixa | Story de observabilidade futura (recuperação trivial: re-setup idempotente) |
| REC-6.11-RATELIMIT | Rate limiting Edge §9.3 (60 req/min KV) — GAP arch-vs-código PRÉ-EXISTENTE no `middleware.ts` | Baixa | **6.12** ou Epic 8 (hardening) |
| REC-6.11-ARCH-SCHEMA | Arch §6 lista `{token,chatId,webhookSet}`; story expande para `tokenHint/webhookUrl/webhookSetAt` | Baixa (documental) | Actualizar arch §6 |
| REC-6.11-TIMING | Comparação `secret_token` não tempo-constante (justificado: Edge sem `node:crypto`, segredo alta entropia) | Muito baixa | Opcional via `crypto.subtle` |
| REC-6.11-WEBHOOK-SECRET-ENV | `TELEGRAM_WEBHOOK_SECRET` não está na tabela arch §9.2 | Baixa | Adicionar à arch §9.2 + `.env.example` (P3 já documenta o provisionamento) |

## Pré-requisitos de produção P1-P4 (por provisionar — NÃO bloqueiam o merge; bloqueiam AC de produção)

| # | Item | Responsável |
|---|------|-------------|
| P1 | `TELEGRAM_BOT_TOKEN` (token BotFather real) em Vercel env | Eurico |
| P2 | `TELEGRAM_CHAT_ID` (ID do chat do Eurico com o bot) em Vercel env | Eurico |
| P3 | `TELEGRAM_WEBHOOK_SECRET` (string aleatória ≥32 chars) em Vercel env | Eurico + `@devops` |
| P4 | Invocar `POST /api/telegram/setup` 1× pós-deploy para registar o webhook (chama `getMe`+`setWebhook` com o URL do deployment) | Eurico |

AC de produção deferido: **AC epic AC4** (bot Telegram responde a "olá" em < 3s) — verificável só com token+chatId reais + handler completo (6.12/6.13), padrão AC13 da 4.9.

## Next action

**`@sm *draft 6.12`** (webhook handler) — sobre o esqueleto Edge da 6.11 (que já valida `secret_token` → 403 + stub 200), a 6.12 passa a:
1. **Parsear o body do update** (texto/voz/foto);
2. **Filtrar `chatId === TELEGRAM_CHAT_ID`** (defesa em profundidade — `[D-6.11-CHATID]` difere este filtro para aqui; pré-requisito C8 da 6.11);
3. Aplicar **rate limiting** (REC-6.11-RATELIMIT herdado / §9.3);
4. **Rotear / fan-out (<5s, Edge — ADR-1/§4.1)**.

`[GAP-6.4]` está **parcialmente resolvido pela 6.11** (decisão SDK + 2 criticals eliminadas + validação `secret_token`); falta o **filtro `chatId`** e o **rate limiting**, que são da 6.12. Gate **`@architect`** (webhook público + estado distribuído + parse de input não-solicitado); gate de saída CR **`--base main`** obrigatório (território server-side/segurança — lição 5.11). Depois: `@po *validate-story-draft` → `@dev *develop`.

**Notas operacionais:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A`; merge por `@devops` quando o PR estiver verde (`merge-authority.md`). NÃO reabrir as decisões `[D-6.11-*]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260620-story-6.11-FECHADA-epic-6-11de17-proximo-6.12.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `20/06/2026`
