# RETOMA — Story 4.8 (Agendamento de disparo de push) · APPROVED (GO 9/10) · Ready for `@dev *develop`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Pax (`@po`) — `*validate-story-draft 4.8` (GO)
**to_agent:** Dex (`@dev`) — `*develop 4.8` (quality gate `@architect`)
**created:** 2026-06-02
**status:** consumed
**consumed:** true
**consumed_at:** 2026-06-03T00:00:00Z
**consumed_by:** dev (Dex)
**resultado:** Implementação Opção A′ completa (Change Log v0.5/v0.6). 6 ficheiros criados + 4 alterados + 4 suites de teste. Gates PASS (typecheck/lint/vitest 1329/build). CR Iter 1: 0 CRITICAL, 3 fix + 4 skip. Status Ready for Review. 2 commits locais (e1460e98 + 1db8f7f1). Próximo: gate `@architect` (Aria). Continuidade em RETOMA-20260603-story-4.8-ready-for-architect-gate.md.
**prioridade:** ALTA — penúltima do Epic 4. Fechar 4.8 + 4.9 leva o Epic 4 a 10/10.

## Summary

A Story 4.8 (`docs/stories/active/4.8.story.md`) está **Approved** (`@po` GO 9/10, Confidence High — Change Log v0.4, secção "PO Validation"). Pronta para `@dev *develop`. Opção A′ (disparo server-side + mirror KV). Quality gate = `@architect` (Aria); smoke Chrome+Edge (AC8) obrigatório.

## O que implementar (Opção A′ — resumo; detalhe nos AC2-AC9 + Tasks T1-T9)

| # | Peça | Ficheiro |
|---|------|----------|
| 1 | `sendPushNotification(payload)` — extracção da lógica de envio (server-only) | **CRIAR** `lib/push/send-notification.ts` |
| 2 | `/api/push/send` → wrapper fino sobre (1); contrato externo inalterado | **ALTERAR** `app/api/push/send/route.ts` |
| 3 | `/api/push/schedule` (cookie-auth) — mirror `nexus:push:schedule:<id>` | **CRIAR** `app/api/push/schedule/route.ts` |
| 4 | `/api/push/dispatch` (Node, `CRON_SECRET` Bearer) — lê devidos, envia, marca `sent` | **CRIAR** `app/api/push/dispatch/route.ts` |
| 5 | Wiring: `fetch` ao schedule nos **5 handlers** de `app/(app)/lembretes/page.tsx` (create `:159`/edit `:209`/cancel `:233`/restore `:243`/delete `:258`) | **ALTERAR** `page.tsx` |
| 6 | Reconciliação on-mount `sent` KV → Dexie (via `dailyRunGate`) | **ALTERAR** `hooks/useDailyGenerationEngine.ts` (ou análogo) |
| 7 | `CRON_SECRET` no `ServerEnvSchema` (coordenar `@devops`) | **ALTERAR** `lib/shared/env.ts` |

## Atenção (do `@po`)

- **F1 (corrigido na story):** o wiring do mirror é nos **handlers de `page.tsx`**, **não** no `useReminders` (read-only `useLiveQuery`). Não reescrever a UI/componentes.
- **F2 (corrigido na story):** o caso **restore** (cancelado→`pending`, `page.tsx:243`) re-escreve no mirror (volta a ser devido). Cancel/delete removem do mirror.
- **Recorrência DIFERIDA (AC5):** não implementar `runReminderRecurrenceEngine`. Recorrentes disparam a 1ª ocorrência; registar o diferimento no Dev Agent Record + criar item de backlog (`@po`/`@pm` agendam pós-Epic-4).
- **Idempotência (AC4):** transição `pending → sent` no mirror KV; não disparar 2×.
- **Testes (AC7):** `vi.mock('@vercel/kv')`; ≥1 teste não-tautológico (janela `fireAt <= now`) + ≥1 teste de auth (`401` sem `CRON_SECRET`).
- **Smoke AC8:** push enviado via dispatch em Chrome **e** Edge (NFR23); display visível diferido para 4.9.

## Dependência `@devops` (resolver ANTES da T4)

**Confirmar plano Vercel** — condiciona o mecanismo do "±60s": Vercel Cron `* * * * *` no `vercel.json` (se Pro) **ou** scheduler externo (cron-job.org/QStash/GitHub Actions) a bater em `/api/push/dispatch` com o `CRON_SECRET`. A app é agnóstica à origem do trigger — só a config muda. `@devops` também provisiona o `CRON_SECRET` (env + Vercel + `.env`). `vercel.json` crons = path bloqueador (`not-tested-trailer-rules.md` — evidência local obrigatória).

## Contexto herdado — NÃO reabrir

- Decisão [GAP-4.6] (Opção A′) é da Aria (`@architect`) — secção "Architect Gate — Decisão de Entrada" da story.
- Infra 4.7 (Done PR #54 `25d1c780`) e 4.6 (Done PR #51 `d13a6067`) — só consumir.
- Hard-stop EPIC-4 §8: máx 2 iter CR/qa-loop; Iter 3 ou merge-waived exigem autorização humana do Eurico no commit.
- Ponta solta separada (não deste handoff): `1.12.story.md` Done mas ainda em `active/` — falta `git mv` p/ `completed/`.

## Próxima acção (`@dev` — Dex)

`*develop 4.8` em branch dedicada (ex: `feat/nexus-v2-story-4.8-push-dispatch`). Coordenar `@devops` (CRON_SECRET + plano Vercel) antes da T4. Quality gate de saída = `@architect` (Aria). Depois `@devops` push + PR.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.8-APPROVED-ready-for-dev-develop.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Pax (`@po`)
DATA: `02/06/2026`
