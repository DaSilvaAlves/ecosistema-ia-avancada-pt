# RETOMA — Story 6.12 (Webhook handler Telegram) FECHADA — Epic 6 a 12/17 — próximo 6.13

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** orquestrador `/sdc 6.12 --push` (River+Aria+Pax+Dex+Gage)
- **to_agent:** any
- **created:** 21/06/2026
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main && git pull --ff-only origin main
git rev-parse --short HEAD   # esperado: 5005ae54 (close-story 6.12) ou posterior; main 0/0 com origin
```

Ordem de leitura: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, internal-state-contract-gate, separation-of-roles, cr-base-main-no-gate-saida); 2) ESTE handoff; 3) `imersao-tools/nexus/docs/EPIC-6.md` §5 (linha 6.13) + §10 — fonte de verdade (12/17; Telegram 2/7); 4) `imersao-tools/nexus/docs/stories/completed/6.12.story.md` (dispatch stub que a 6.13 liga ao cérebro); 5) `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.13 (FR71).

**Working tree:** limpa nos paths do Nexus (close 6.12 committed+pushed em `5005ae54`). Restam apenas untracked pré-existentes fora-scope (`PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`, `cr-6.4-output.txt`, `docs/.claude/`, submódulos `comunidade`/`starter-builder`) — NÃO se committam.

**Comando para arrancar o próximo ciclo:** `/sdc 6.13 --push`. A 6.13 liga o dispatch stub texto da 6.12 ao cérebro multi-intent do Epic 1 — gate `@qa` (não `@architect`: não é território de segurança novo; reutiliza o cérebro já existente). CR `--base main` só se tocar território server-side novo.

---

## Summary

A Story 6.12 (webhook handler Telegram, FR70) está **FECHADA (Done)** em `main` via **PR #86 (squash `f8ca42c4`)**, waiver 0. Primeiro endpoint público do Nexus a parsear input não-solicitado da internet. O handler Edge real substitui o stub 6.11: parse Zod `.passthrough()`→400, filtro `chatId` (3 sub-casos unauthorized→200 silencioso), rate-limit fixed-window KV, ordem de guardas inegociável, dispatch stub por tipo (texto/voz/foto/unknown). `main` em `5005ae54` (close docs-only), 0/0 com origin. Sub-módulo Telegram agora **2/7**.

## Context

**Estado verificado:**
- Story 6.12 MERGED: PR #86 squash `f8ca42c4`, `reviewDecision: APPROVED` (CR App limpo no head SHA, não stale). Close-story docs-only `5005ae54`.
- Ciclo `/sdc 6.12 --push` completo: SM draft (AC1-AC8) → Architect Gate Entrada **PASS-COM-CONDIÇÕES** (9 `[D-6.12-*]` + C1-C9 + C6b + análise 3 eixos `internal-state-contract-gate.md`) → PO **GO 9/10** → DEV (typecheck 0, webhook 32/32, +25 testes, suite 2249, 1 flake `oauth-status` pré-existente passa isolado 6/6) → Architect Gate Saída **PASS High** (C1-C9+C6b re-verificadas vs código real) → CR `--base main` 0 findings + CR App APPROVED → merge → close-story.
- **Nota de processo:** a sessão DEV e a sessão DevOps caíram ambas por timeout de stream a meio; o trabalho foi recuperado a partir do estado real (branch/commit/git), não recomeçado. O close-story foi completado pelo orquestrador (git mv + reconciliação do bloco inferior do EPIC-6 que o @devops deixou a meio: linha 179 1/7→2/7, próxima candidata 6.12→6.13).

**Decisões-âncora `[D-6.12-*]` (ratificadas pela Aria — NÃO reabrir):**
- **PARSE-STRATEGY:** `safeParse` Zod `.passthrough()` (raiz + 4 sub-objectos). `.strict()` REJEITADO (silent-drop de campos novos da Bot API). Não-JSON/schema-fail → 400.
- **CHATID-REJECT:** `chatId` não autorizado → **200 silencioso** `{ok:true}` (evita re-entrega em loop do Telegram + fingerprinting). 403 reservado ao `secret_token` (origem).
- **RATELIMIT-ALGO/SCHEMA:** fixed-window KV, chave `nexus:telegram:ratelimit:${chatId}:${Math.floor(Date.now()/60000)}`, TTL 70s. `kv.incr` + `kv.expire(70)` **INCONDICIONAL** (C5 crítica — o snippet condicional `if(count===1)` das Dev Notes foi ignorado). `count>60` → **429**.
- **MISSING-CHATID-ENV:** env `TELEGRAM_CHAT_ID` ausente → fail-closed = 200 silencioso (ninguém autorizado).
- **RATELIMIT-KV-FAIL:** KV down → **fail-OPEN com `console.error`** (não silencioso). Auth já garantida pelo `secret_token`; hardening não nega serviço ao único user legítimo.
- **FAN-OUT-SCOPE:** 6.12 = dispatch stub `{ok:true,routed:false,type}`. Cérebro é 6.13. Corte limpo.
- **EXTERNAL-IDENTIFIERS:** campos exactos da Bot API (`message.chat.id` number, `message.text`, `message.voice.file_id`, `message.photo` SEMPRE array). `message` opcional na raiz.
- **C6b (achado da Aria):** `/api/telegram/webhook` adicionado a `PUBLIC_PATHS` em `middleware.ts` — sem isto o POST cookieless do Telegram é redireccionado para `/login` (307) e o bot fica mudo em produção (paralelo ao hotfix 4.8). NÃO exercível em unit test (os testes chamam `POST` directo) → exige preview manual.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.12-FECHADA-epic-6-12de17-proximo-6.13.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Débitos deferidos (não-bloqueantes — registados na story)

| ID | Débito | Severidade | Destino |
|----|--------|-----------|---------|
| C6b-PREVIEW | Verificar em preview que POST cookieless a `/api/telegram/webhook` atinge o handler (não 307→`/login`) — não automatizável | P-prod | Eurico/`@devops` no provisionamento P1-P4 |
| RATELIMIT-SINGLE-USER | Rate-limit é hardening de defesa-em-profundidade (1 chatId legítimo) — não é gargalo | Informativo | Base multi-user futura |
| REC-6.11-* (herdados) | COHERENCE/ARCH-SCHEMA/TIMING/WEBHOOK-SECRET-ENV | Baixa | Story observabilidade / arch update |

## Pré-requisitos de produção P1-P4 (por provisionar — NÃO bloqueiam merge; bloqueiam AC de produção)

| # | Item | Responsável |
|---|------|-------------|
| P1 | `TELEGRAM_BOT_TOKEN` (BotFather) em Vercel env | Eurico |
| P2 | `TELEGRAM_CHAT_ID` (chat do Eurico) em Vercel env | Eurico |
| P3 | `TELEGRAM_WEBHOOK_SECRET` (≥32 chars) em Vercel env | Eurico + `@devops` |
| P4 | `POST /api/telegram/setup` 1× pós-deploy (regista webhook) | Eurico |

AC de produção deferido: **AC epic AC4** (bot responde "olá" em < 3s) — materializado só na 6.13 (texto→cérebro) com P1-P4 reais. Padrão AC13 da 4.9.

## Next action

**`@sm *draft 6.13`** (texto → cérebro multi-intent, FR71) — liga o dispatch stub `type:'text'` da 6.12 ao cérebro multi-intent do Epic 1; a mensagem texto do Telegram entra directa no cérebro e materializa a resposta real ao "olá" (AC epic AC4, <3s). Gate **`@qa`** (não `@architect`: reutiliza o cérebro existente, sem território de segurança novo). Depois `@po *validate-story-draft` → `@dev *develop`. CR `--base main` só se tocar server-side novo.

**Notas operacionais:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A`; merge por `@devops`/`@aiox-master` quando o PR estiver verde (`merge-authority.md`). NÃO reabrir as decisões `[D-6.12-*]`/`[D-6.11-*]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.12-FECHADA-epic-6-12de17-proximo-6.13.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador /sdc 6.12 --push`
DATA: `21/06/2026`
