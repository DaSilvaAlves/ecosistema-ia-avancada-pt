# RETOMA — Story 6.13 (Texto → cérebro multi-intent) FECHADA — Epic 6 a 13/17 — próximo 6.14 (voz → transcrição)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** orquestrador `/sdc 6.13 --push` (River+Pax+Aria+Dex+Gage)
- **to_agent:** any
- **created:** 21/06/2026
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main && git pull --ff-only origin main
git rev-parse --short HEAD   # esperado: 3ea281b7 (close-story 6.13) ou posterior; main 0/0 com origin
```

Ordem de leitura: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, internal-state-contract-gate, separation-of-roles, external-contract-identifiers, cr-base-main-no-gate-saida); 2) ESTE handoff; 3) `imersao-tools/nexus/docs/EPIC-6.md` §5 (linha 6.14) + §7 GAP-6.3 + §10 — fonte de verdade (13/17; Telegram 3/7); 4) `imersao-tools/nexus/docs/stories/completed/6.13.story.md` (bridge Node + seam que a 6.14 reutiliza); 5) `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.13 (FR72).

**Working tree:** limpa nos paths do Nexus (close 6.13 committed+pushed em `3ea281b7`). Restam apenas untracked pré-existentes fora-scope (`PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`, `cr-6.4-output.txt`, `docs/.claude/`, submódulos `comunidade`/`starter-builder`) — NÃO se committam.

**Comando para arrancar o próximo ciclo:** `@sm *draft 6.14` (depois `@po *validate-story-draft` → **Architect Gate de Entrada OBRIGATÓRIO** → `@dev *develop` com gate de saída `@architect`). Ou directo: `/sdc 6.14 --push` — mas a 6.14 tem **gate `@architect`** (entrada E saída) por território de risco (GAP-6.3 + fetch externo a serviço de transcrição).

---

## Summary

A Story 6.13 (texto Telegram → cérebro multi-intent, FR71) está **FECHADA (Done)** em `main` via **PR #87 (squash `2ed54bd8`)**, waiver 0. Liga o dispatch stub `type:'text'` da 6.12 ao cérebro multi-intent do Epic 1: o webhook Edge faz `fetch` fire-and-forget a um **bridge Node novo** `POST /api/telegram/process-text` que corre o `runAgent` e responde ao utilizador via `sendMessage`. `main` em `3ea281b7` (close docs-only), 0/0 com origin. Sub-módulo Telegram agora **3/7**.

## Context

**Estado verificado:**
- Story 6.13 MERGED: PR #87 squash `2ed54bd8`, `reviewDecision: APPROVED` (CR App + CR CLI `--base main` 0 findings no head final `05213b13`). Close-story docs-only `3ea281b7`.
- Ciclo `/sdc 6.13 --push` completo: SM draft → PO **GO 8/10** (apanhou Critical anti-hallucination: `sendMessage` não existia) → **Architect Gate Entrada PASS-COM-CONDIÇÕES** (6 `[D-6.13-*]` + **C1-C11** + 3 achados PO resolvidos) → DEV (lint 0, typecheck 0, suite **2266 PASS**, +17 testes) → QA Gate Saída (Quinn) **PASS 7/7** → CR `--base main` 2 iter (**1 Critical REAL apanhado: entrega não-idempotente → duplo `sendMessage`**) → fix → 0 findings → merge → close-story.
- **Lição de processo confirmada (5.11):** o CR de saída `--base main` apanhou um Critical de produção (duplo `sendMessage` quando a entrega da resposta falha) que os testes uncommitted não detectaram. Mantém-se obrigatório o CR `--base main` no gate de saída em território server-side novo.

**Decisões-âncora `[D-6.13-*]` (ratificadas pela Aria — NÃO reabrir):**
- **RUNTIME = (a):** bridge Node `POST /api/telegram/process-text` (`export const runtime = 'nodejs'`). O webhook Edge chama-o por `fetch` interno fire-and-forget.
- **Padrão de invocação do cérebro (CRÍTICO):** o bridge importa `runAgent` de `lib/agent/executor.ts` (módulo NEUTRO, NÃO `client-executor.ts` que é `'use client'`) e chama `runAgent(text)` **SEM injectar `executor`/`classifier`/`db`** → `resolveServerExecutor()` usa o SDK Anthropic DIRECTO (`api.anthropic.com`, `ANTHROPIC_API_KEY`, cookieless). **NUNCA** chamar `/api/anthropic/proxy` (Edge cookie-gated → 401 → bot mudo, paralelo do hotfix 4.8). Assinatura real: `runAgent(userPrompt: string, opts: RunAgentOpts = {})`.
- **RESPONSE-MODE = (c):** `sendMessage` chamado no bridge. `sendMessage` foi **CRIADO** em `lib/telegram/bot-api.ts` via `callBotApi('sendMessage', {chat_id, text})`.
- **DB-TOOLS = (c):** só resposta conversacional do cérebro neste scope; tools de mutação (tasks/finance/habits/Gmail) **indisponíveis via Telegram** até haver bridge Dexie server-side → débito **REC-6.13-DB-BRIDGE**.
- **TIMEOUT = (c):** fire-and-forget — o webhook ACK ao Telegram em <5s; o processamento real (cérebro + sendMessage) corre em background no bridge.
- **ERROR-RESPONSE = (a):** falha do cérebro → `sendMessage` com "Não consegui processar a tua mensagem agora. Tenta de novo daqui a pouco." (PT-PT). O bridge nunca devolve 5xx ao Telegram.
- **C11:** `/api/telegram/process-text` adicionado a `PUBLIC_PATHS` (`middleware.ts`) + protegido por shared-secret header `x-telegram-bridge-secret` (fail-closed contra `TELEGRAM_WEBHOOK_SECRET`).

**Ficheiros entregues pela 6.13 (a 6.14 reutiliza-os — NÃO duplicar):**
- `imersao-tools/nexus/v2/app/api/telegram/process-text/route.ts` — bridge Node (cérebro + sendMessage)
- `imersao-tools/nexus/v2/lib/telegram/bot-api.ts` — `sendMessage` criado (+ `callBotApi`/`getMe`/`setWebhook` da 6.11)
- `imersao-tools/nexus/v2/app/api/telegram/webhook/route.ts` — dispatch `type:'text'`→`routed:true`; **`voice`/`photo`/`unknown` continuam `routed:false`** (são 6.14/6.15)
- `imersao-tools/nexus/v2/middleware.ts` — `process-text` em `PUBLIC_PATHS`

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.13-FECHADA-epic-6-13de17-proximo-6.14.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próxima story 6.14 — voz → transcrição (FR72), gate `@architect`

A 6.14 liga o tipo `voice` que o webhook 6.12 já detecta (`message.voice.file_id`, hoje dispatch stub `routed:false`). O fluxo natural: voz Telegram → **descarregar áudio** (Bot API `getFile` + download do ficheiro) → **transcrever (server-side)** → texto → entra no **mesmo bridge/cérebro da 6.13** → `sendMessage`. Reutiliza o bridge `/api/telegram/process-text` (ou um bridge irmão), NÃO cria fluxo de cérebro novo.

### GAP-6.3 — decisão de transcrição (deferida ao Architect Gate de Entrada — NÃO assumir)

PRD §10 marca explicitamente "decisão @architect" para a 6.14. Pontos a resolver no gate (EPIC-6.md §7 GAP-6.3 + Risco R8):

1. **Web Speech está EXCLUÍDO** — é browser-only; a voz chega pelo webhook **server-side**, onde não há Web Speech API. Confirmado pela arquitectura, não reabrir.
2. **A transcrição tem de ser server-side.** O `@architect` decide o mecanismo: confirmar se há serviço de transcrição disponível no stack/plano actual (a API Anthropic/Claude **não** expõe speech-to-text nativo — confirmar contra a doc actual, não assumir; alternativas server-side: Whisper/OpenAI, Google Speech-to-Text, Deepgram, etc., cada uma exige nova env var + revisão de custo R4 + CSP `connect-src`).
3. **Fallback se inviável:** se não houver solução de transcrição aceitável, a 6.14 fica **texto-only** (o webhook responde à voz com "transcrição de voz ainda não disponível" e o cérebro não processa) OU a story é diferida — decisão registada no draft. **Não bloqueia o resto do epic (6.16/6.17).**
4. **`mock-protocol-fidelity.md`:** o mock do serviço de transcrição + do download do áudio Telegram (`getFile`/file download) reflecte o protocolo real; ≥1 teste que falharia se o shape divergisse.
5. **`internal-state-contract-gate.md`** (estado multi-camada: áudio recebido → descarregado → transcrito → cérebro → resposta/falha) — análise dos 3 eixos no gate.
6. **Identificadores externos ASCII** (`external-contract-identifiers.md`) se a 6.14 registar tool ou campo novo.

---

## Débitos deferidos (não-bloqueantes — registados na story 6.13)

| ID | Débito | Severidade | Destino |
|----|--------|-----------|---------|
| REC-6.13-DB-BRIDGE | Tools de mutação (tasks/finance/habits/Gmail) inacessíveis via Telegram até haver bridge Dexie server-side (DB-TOOLS=(c)) | Média | Story futura / Epic 7+ |
| REC-6.13-WAITUNTIL | Robustez do fire-and-forget em serverless (garantir conclusão do background work) | Baixa | Observabilidade / arch update |
| TEST-001 | Handler MSW `sendMessage` não valida `chat_id` (mock de teste; produção já valida) | Baixa | Housekeeping |

## Pré-requisitos de produção P1-P4 (herdados da 6.11/6.12 — por provisionar; NÃO bloqueiam merge; bloqueiam AC de produção)

| # | Item | Responsável |
|---|------|-------------|
| P1 | `TELEGRAM_BOT_TOKEN` (BotFather) em Vercel env | Eurico |
| P2 | `TELEGRAM_CHAT_ID` (chat do Eurico) em Vercel env | Eurico |
| P3 | `TELEGRAM_WEBHOOK_SECRET` (≥32 chars; também usado como shared-secret do bridge da 6.13) em Vercel env | Eurico + `@devops` |
| P4 | `POST /api/telegram/setup` 1× pós-deploy (regista webhook) | Eurico |

AC de produção deferido: **AC epic AC4** (bot responde "olá" em < 3s) — materializado pela 6.13 mas só verificável com P1-P4 reais. Padrão AC13 da 4.9.

## Next action

**`@sm *draft 6.14`** (voz → transcrição, FR72) — liga o tipo `voice` do webhook 6.12 ao bridge/cérebro da 6.13 via transcrição server-side. Gate **`@architect`** (entrada E saída) por território de risco. **Architect Gate de Entrada OBRIGATÓRIO** para resolver o GAP-6.3 (mecanismo de transcrição) ANTES do `@dev`. Depois `@po *validate-story-draft` → `@dev *develop`. CR `--base main` no gate de saída (route Node nova / fetch externo).

**Alternativas de menor risco** (se a transcrição de voz se revelar inviável no gate): `@sm *draft 6.16` (lembretes + briefing matinal via Telegram, FR74/FR75 — reutiliza disparo de lembretes do Epic 4; gate `@qa`) ou `*draft 6.17` (tool `enviar_telegram`, FR76; gate `@architect`). A **6.15** (foto → OCR) fica parcial/diferida ao Epic 7.

**Notas operacionais:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (há submódulos + untracked não-relacionados); merge por `@devops`/`@aiox-master` quando o PR estiver verde (`merge-authority.md`). NÃO reabrir as decisões `[D-6.13-*]`/`[D-6.12-*]`/`[D-6.11-*]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.13-FECHADA-epic-6-13de17-proximo-6.14.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador /sdc 6.13 --push`
DATA: `21/06/2026`
