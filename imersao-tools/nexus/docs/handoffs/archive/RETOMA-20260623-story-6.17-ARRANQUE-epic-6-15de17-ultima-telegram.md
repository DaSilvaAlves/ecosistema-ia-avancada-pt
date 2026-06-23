# RETOMA — Story 6.17 (tool cérebro `enviar_telegram`, FR76) ARRANQUE — Epic 6 em 15/17, sub-módulo Telegram 5/7, ÚLTIMA story do sub-módulo Telegram

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** `@devops` (Gage) — fechou a fase devops da 6.16 (push PR #89 + auto-merge + push do close-story)
- **to_agent:** any — preferencialmente `@sm` (River) para `*draft 6.17`
- **created:** 23/06/2026
- **status:** consumed
- **consumed:** true
- **consumed_at:** 2026-06-23T00:00:00Z
- **consumed_by:** `@po` (Pax)
- **consumed_note:** Pipeline 6.17 completo. Story FECHADA via `*close-story 6.17` — merged PR #90 squash `5f3ab475` (CR 2 iter, waiver 0); Status → Done; `git mv` active→completed; EPIC-6 15/17→16/17, sub-módulo Telegram 5/7→6/7 (última do sub-módulo). Handoff arquivado. Push do commit de fecho docs-only fica para o `@devops`.
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git fetch origin
git checkout main
git log --oneline -1            # esperado: fcebfeea (close-story 6.16)
git rev-list --left-right --count main...origin/main   # esperado: 0  0 (sincronizado)
```

**Estado limpo confirmado (23/06/2026):** `main` local == `origin/main` == `fcebfeea` (0/0). NÃO há branches de feature pendentes (a `feat/story-6.16-lembretes-briefing` foi eliminada no merge do PR #89). NÃO há trabalho de DevOps pendente. A 6.16 está MERGED (`476d66ae`) e FECHADA (`fcebfeea`).

**ATENÇÃO ao ruído do working tree (pré-existente, fora-scope, NÃO tocar):** a raiz tem submódulos sujos (`comunidade`, `starter-builder`) + ~150 ficheiros untracked não-relacionados (`docs/.claude/`, `PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`, `.codex/`, `.antigravity/`, etc.). **NUNCA `git add -A`** — staging sempre selectivo ficheiro-a-ficheiro.

Ordem de leitura na activação: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, separation-of-roles, internal-state-contract-gate, cr-base-main-no-gate-saida, not-tested-trailer-rules, mock-protocol-fidelity, external-contract-identifiers); 2) ESTE handoff; 3) `docs/HANDOFF-INDEX.md`; 4) `imersao-tools/nexus/docs/EPIC-6.md` §5 (linha 6.17 — última linha, contém o histórico completo das 6.1-6.16).

**Comando para retomar (one-shot):** `/sdc 6.17 --push` — corre o pipeline completo (draft → validate → architect gate entrada → develop → gate saída → devops push/PR/merge → close-story).

---

## Summary

O Epic 6 (OAuth Google Calendar + Gmail + Telegram) está em **15/17 stories Done**. Sub-módulos: **Calendar 6/6 COMPLETO** (6.1-6.6), **Gmail 4/4 COMPLETO** (6.7-6.10), **Telegram 5/7** (6.11, 6.12, 6.13, 6.14, 6.16 feitas; faltam 6.15 e 6.17).

A última sessão (`@devops` Gage) executou a fase final da Story 6.16 (lembretes + briefing matinal via Telegram, FR74/FR75): push da branch, PR #89, fix de 3 Major do CodeRabbit (Iter 1 → @dev → Iter 2), auto-merge `--admin --squash` (squash `476d66ae`), e push do commit de close-story do `@po` (`fcebfeea`, docs-only). Tudo publicado e sincronizado.

**Próxima story: 6.17 — tool cérebro `enviar_telegram` (FR76), a ÚLTIMA do sub-módulo Telegram.** A 6.15 (foto recibo → OCR, FR73) fica **parcial/diferida ao Epic 7** (OCR não existe ainda; ver EPIC-6.md §3 GAP-6.6 + coluna "Bloqueia: 7"). Logo, fechar a 6.17 deixa o Epic 6 em **16/17**, com a 6.15 como a única pendente — e ela depende do Epic 7.

### O que a 6.17 deve entregar (esboço — o `@sm`/`@architect` ratificam no draft/gate)

FR76 = **tool do cérebro multi-intent `enviar_telegram`** que permite ao cérebro (Epic 1) responder ao próprio utilizador via bot Telegram, registada no `ToolDefinition.domain = 'telegram'` (domínio já reservado em arch §7.2).

Precedentes directos a reutilizar (open-closed, NÃO duplicar):
- **`sendMessage`** já existe em `lib/telegram/bot-api.ts` (CRIADO na 6.13, `callBotApi('sendMessage', {chat_id, text})`).
- **`TELEGRAM_CHAT_ID`** em `getServerEnv()` (`env.ts`).
- **Padrão de tool do cérebro:** as tools de domínio registam-se via Tool Registry — precedentes 6.6 (`calendar`), 6.10 (`gmail`: `listar_emails_importantes`/`criar_draft_gmail`/`arquivar_email`). **Achado central da 6.10 (Architect Gate Aria, ADR-9):** o executor de tools corre **client-side** → `ctx.kv` é `noKvStub` que LANÇA, `getValidAccessToken()`/Node-only não acessível → a tool só pode usar `ctx.fetch` para uma route server-side same-origin (`[D-6.10-RUNTIME]`, padrão `knowledge.ts:488`). **A 6.17 quase de certeza precisa do mesmo padrão:** uma route Node nova (ex.: `POST /api/telegram/send`) que a tool `enviar_telegram` invoca por `ctx.fetch`, porque `sendMessage` fala com `api.telegram.org` com o token (server-only). O `@architect` deve confirmar isto no gate de entrada (recomendado, à semelhança de 6.10/6.13).

GAPs prováveis a resolver no draft/gate: granularidade do domínio no classifier (GAP-6.5), reutilização vs nova route, preview/reversible da tool (precedente 6.10: `criar_draft`=true/false), validação de input (chat_id sempre o do próprio utilizador, nunca arbitrário — evitar SSRF/abuso de envio).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-6.17-ARRANQUE-epic-6-15de17-ultima-telegram.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado do projecto (verificado 23/06/2026)

| Item | Valor |
|------|-------|
| `main` HEAD | `fcebfeea` (close-story 6.16) |
| `main` vs `origin/main` | 0/0 (sincronizado) |
| Epic 6 | **15/17** Done |
| Sub-módulo Calendar | 6/6 COMPLETO (6.1-6.6) |
| Sub-módulo Gmail | 4/4 COMPLETO (6.7-6.10) |
| Sub-módulo Telegram | **5/7** (6.11/6.12/6.13/6.14/6.16 feitas) |
| Próxima story | **6.17** `enviar_telegram` (FR76) — última Telegram |
| Diferida | 6.15 (foto→OCR, FR73) — depende do Epic 7 |
| Suite Vitest baseline | 2316 PASS (pós-6.16; flake `oauth-status` isolado-PASS = não-regressão) |
| Waiver rate Epic 6 | 0% (todas as 15 stories fechadas waiver 0) |

### Últimos commits relevantes em main

```
fcebfeea docs(nexus-v2): close-story 6.16 ... Epic 6 15/17, Telegram 5/7 [Story 6.16]
476d66ae feat(nexus-v2): lembretes + briefing matinal via Telegram (FR74/FR75) [Story 6.16] (#89)
76e907d2 docs(nexus-v2): close-story 6.14 voz Telegram stub ... Epic 6 14/17 [Story 6.14]
```

---

## Next action

**1. `@sm` (River) `*draft 6.17`** — criar a story da tool `enviar_telegram` (FR76). Trace ao PRD §10 Epic 6 (FR76) + EPIC-6.md §6 (linha FR76 = 6.17). Aplicar lições preventivas em vigor: `external-contract-identifiers.md` (nome de tool ASCII), `mock-protocol-fidelity.md` (MSW Telegram reflecte protocolo real), `internal-state-contract-gate.md`. Marcar GAPs (granularidade domínio classifier, route nova vs reuso, preview/reversible, validação input).

**2. `@po` (Pax) `*validate-story-draft`** — GO/NO-GO, anti-invenção (Artigo IV).

**3. `@architect` (Aria) Gate de Entrada** — RECOMENDADO (precedente 6.10/6.13: boundary ADR-9 client-side vs Node-only é decisão arquitectural). Ratificar `[D-6.17-*]`: como a tool client-side fala com `api.telegram.org` (quase de certeza via route Node nova + `ctx.fetch`), reutilização de `sendMessage` da 6.13, validação de `chat_id`.

**4. `@dev` (Dex) `*develop`** — implementar + commit local + gates (lint 0, typecheck 0, suite verde) + CR `--base main` local 0 findings.

**5. Gate de Saída** (`@qa` Quinn OU `@architect` Aria conforme separation-of-roles) — PASS vs código real.

**6. `@devops` (Gage) push → PR → CR no head SHA → auto-merge** — exactamente como na 6.16: `git push -u origin feat/story-6.17-*`; `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main ...`; verificar as 6 condições de `merge-authority.md` no head SHA (CI verde / CR Status SUCCESS / 0 CR actionable no head / quality gate PASS / MERGEABLE / hard-stop §8 ≤2 iter); `gh pr merge {N} --admin --squash --delete-branch`; `git checkout main && git pull --ff-only origin main`. NÃO pedir merge manual ao Eurico. `reviewDecision: CHANGES_REQUESTED` pode ser stale (verificar `original_commit_id` ≠ head = re-ancoragem de posição + fix no código). Atenção: o CR App pode atingir rate-limit e dar Status SUCCESS sem re-rever o novo head — cruzar `original_commit_id` + leitura do código (lição 6.16).

**7. `@po` (Pax) `*close-story 6.17`** — Status→Done, `git mv active/→completed/`, EPIC-6.md 15/17→**16/17**, Telegram 5/7→**6/7**, fecho docs-only (commit directo em main + push ff sem PR — convenção close). `@devops` faz o push do commit de fecho. Consumir ESTE handoff (marcar `consumed:true`, mover para `archive/`, actualizar `INDEX.md` + `HANDOFF-INDEX.md`).

**Depois da 6.17:** Epic 6 fica 16/17, restando só a 6.15 (foto→OCR), que **depende do Epic 7**. Decisão a tomar com o Eurico: fechar o Epic 6 como "16/17 com 6.15 diferida ao Epic 7" + `@po *retrospective epic-6`, ou avançar para o Epic 7 (Voice + OCR) que desbloqueia a 6.15.

## Notas operacionais

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- NUNCA `git add -A` (submódulos sujos + ~150 untracked fora-scope). Staging selectivo.
- Pre-commit hooks SEM `--no-verify` (o IDS-Hook "No relevant changes" é benigno).
- `Not-tested:` é red flag bloqueador em paths de CI/config/test-runner/segurança (`not-tested-trailer-rules.md`) — usar `Evidence:` com cobertura/execução local nesses casos.
- Só `@devops` faz push e merge (autoridade exclusiva). O merge é trabalho do agente, não do Eurico (`merge-authority.md`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-6.17-ARRANQUE-epic-6-15de17-ultima-telegram.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `23/06/2026`
