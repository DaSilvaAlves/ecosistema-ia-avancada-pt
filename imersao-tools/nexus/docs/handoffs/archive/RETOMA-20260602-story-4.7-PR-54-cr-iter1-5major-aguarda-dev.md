# RETOMA — Story 4.7 (Web Push) · PR #54 ABERTO · CI verde · CodeRabbit Iter 1 CHANGES_REQUESTED (5 Major) · aguarda @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Gage (`@devops`) — push + PR
**to_agent:** `@dev` (Dex — corrigir 5 Major do CodeRabbit Iter 1)
**created:** 2026-06-02
**status:** pending
**prioridade:** ALTA — CI todo verde; falta resolver 5 Major do CR (Iter 1) antes de poder fazer merge.

## Summary

Story 4.7 (infra Web Push) com push feito e **PR #54 aberto** contra `main`. CI determinístico TODO VERDE (Lint+TS, Vitest, Playwright E2E, Coverage, CodeQL, Vercel — exit=0). CodeRabbit server-side **reviu** (Walkthrough postado) e devolveu **`reviewDecision: CHANGES_REQUESTED` com 5 findings, todas 🟠 Major, 0 CRITICAL**. Como não há CRITICAL não há hard-block, mas as 5 Major são correcções de código reais (ciclo de vida da subscrição, schema Zod 4, error handling) → pertencem ao `@dev`. É CR **Iteração 1** (budget hard-stop §8 = máx 2 iter). **Merge NÃO feito** (CHANGES_REQUESTED).

> Nota infra: o CodeRabbit CLI local esteve em outage (`TRPCClientError`, 3 tentativas) — mas o server-side no PR funcionou e é o gate efectivo. O check "CodeRabbit / Review skipped" é um job auxiliar; a revisão real veio como review CHANGES_REQUESTED com 5 comentários inline.

## next_action — `@dev` (Dex): corrigir 5 Major (CR Iter 1)

| # | Ficheiro:linha | Fix |
|---|----------------|-----|
| 1 | `app/api/push/send/route.ts:6` | Em `sendNotification()` com HTTP 404/410, apagar a subscrição expirada do store (evitar envios repetidos a endpoints mortos) |
| 2 | `app/api/push/send/route.ts:32` | Zod 4: `z.record(z.unknown())` é inválido — usar `z.record(z.string(), z.unknown())` (key+value schema) |
| 3 | `app/api/push/subscribe/route.ts:57` | Envolver `savePushSubscription()` em try/catch e devolver resposta controlada (KV outage não pode escapar o contrato JSON de erro → 500 do framework) |
| 4 | `hooks/usePushSubscription.ts:98` | Se `pushManager.subscribe()` ok mas `/api/push/subscribe` devolve não-OK, fazer unsubscribe da subscrição do browser antes de rethrow (evitar estado inconsistente após reload) |
| 5 | `hooks/usePushSubscription.ts:117` | `unsubscribe()` deve propagar delete ao store server-side (criar path de delete no backend) — não deixar endpoints/keys órfãos |

Depois das fixes: commit (referenciar [Story 4.7]), re-correr quality local, e devolver a `@devops` para verificar CR Iter 2. **Hard-stop §8: Iter 3 ou merge waived exigem autorização explícita do Eurico no commit.**

## Estado consolidado

| Item | Valor |
|------|-------|
| Story | 4.7 — Web Push. Gate @architect CONCERNS (aprovado) |
| Branch | `feat/nexus-v2-story-4.7-web-push` — pushed (7 commits) |
| PR | #54 — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/54 — OPEN, MERGEABLE, mergeStateStatus CLEAN |
| CI | TODO VERDE (Lint+TS · Vitest · Playwright E2E · Coverage · CodeQL · Vercel) |
| CodeRabbit | Iter 1 CHANGES_REQUESTED — 5 Major, 0 CRITICAL |
| reviewDecision | CHANGES_REQUESTED → merge bloqueado até resolver |

## Decisões fixadas (NÃO reabrir)

| Tema | Decisão |
|------|---------|
| AC14 passo 6 | Display visível = Story 4.9 (FR36); ratificado pela Aria |
| Mount do prompt | Página Lembretes (onboarding FR35 = follow-up não-bloqueador) |
| Merge | NÃO auto-merge — autorização humana + gates verdes |
| Handoff anterior | `RETOMA-20260602-story-4.7-gate-PASS-aguarda-devops-push-PR.md` — consumido |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.7-PR-54-cr-iter1-5major-aguarda-dev.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Gage (@devops)` · DATA: `02/06/2026`
