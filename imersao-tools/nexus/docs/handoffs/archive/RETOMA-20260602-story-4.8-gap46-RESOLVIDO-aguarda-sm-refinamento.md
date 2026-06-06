# RETOMA — Story 4.8 (Agendamento de disparo de push) · [GAP-4.6] RESOLVIDO · aguarda refinamento `@sm`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Aria (`@architect`) — Architect Gate de entrada da Story 4.8 (resolução [GAP-4.6])
**to_agent:** River (`@sm`) — refinar AC3-AC6 + Tasks T2+ para a opção escolhida
**created:** 2026-06-02
**status:** consumed
**consumed:** true
**consumed_at:** 2026-06-02T00:00:00Z
**consumed_by:** sm (River)
**resultado:** Story 4.8 refinada para a Opção A′ (Change Log v0.3). AC2-AC9 fixados (AC5 → recorrência DIFERIDA; AC6 → reconciliação IN; AC3 → sendPushNotification + /api/push/schedule + /api/push/dispatch). Tasks reescritas T0-T9. Dev Notes com tabela de ficheiros + dependências @devops. Status: Draft — Ready for @po validation. Próximo: @po *validate-story-draft 4.8.
**prioridade:** ALTA — destrava a Story 4.8 (penúltima do Epic 4; fechar 4.8 + 4.9 leva o Epic 4 a 10/10).

## Summary

O `[GAP-4.6]` (disparo às 15h ±60s com app fechada, R1 de risco Alto do Epic 4) está **RESOLVIDO**. A decisão está registada na secção **"Architect Gate — Decisão de Entrada"** de `docs/stories/active/4.8.story.md` (Change Log v0.2; AC1/T0 fechado). A story sai de "BLOQUEADA" para "aguarda refinamento `@sm`".

## Decisão (resumo — detalhe completo na story)

- **(a) Opção A′** — disparo **server-side** via scheduler + **mirror de agenda em KV**. Opção B (client-only) e C (Notification Triggers) rejeitadas (falham AC2 / NFR23).
- **Correcção arquitectural crítica:** `/api/push/send` (4.7) exige **cookie-session** (`getSession` → 401). Um scheduler não tem cookie → **não pode chamá-lo directamente**. Resolução: extrair `sendPushNotification` (função partilhada server-only) + novo endpoint `/api/push/dispatch` protegido por **`CRON_SECRET`** (Bearer) + endpoint `/api/push/schedule` (cookie-auth) que espelha `{id,fireAt,text,status}` para KV `nexus:push:schedule:*`.
- **(b) AC2 mantido** "±60s app fechada", **desacoplado do mecanismo de trigger** (a app é agnóstica à origem; o "±60s" depende do scheduler — config `@devops`, não bloqueia a arquitectura).
- **(c) Fronteira:** IN = `sendPushNotification`, `/api/push/dispatch`, `/api/push/schedule`, mirror KV, query "devidos", idempotência, reconciliação `sent`→Dexie. OUT = display/botões (4.9), config do scheduler (`@devops`), recorrência (diferida).
- **(d) Recorrência `ownerType:'reminder'` DIFERIDA** (Progressive Complexity; não falha AC do epic). Recorrentes disparam a 1ª ocorrência; geração de série = follow-up pós-Epic-4.
- **(e) Dependências `@devops`:** `CRON_SECRET` (env + `ServerEnvSchema`); confirmar plano Vercel (Vercel Cron 1-min se Pro; senão scheduler externo no mesmo endpoint); `vercel.json` crons (path bloqueador `not-tested-trailer-rules.md`).

## Próxima acção (`@sm` — River)

1. Refinar **AC5** → "diferimento de recorrência registado" (recorrentes disparam 1ª ocorrência; série = follow-up).
2. Refinar **AC6** → reconciliação **IN** (Opção A′ é server-side).
3. Refinar **AC3** + **T2** → `sendPushNotification` + `/api/push/dispatch` (CRON_SECRET) + `/api/push/schedule` (mirror KV) + query "devidos".
4. Coordenar com `@devops` as deps (e): `CRON_SECRET`, plano Vercel, `vercel.json` crons.
5. Fixar a estimativa (10-16h, Opção A′). Depois: `@po *validate-story-draft 4.8` → `@dev *develop 4.8` (gate `@architect`, smoke Chrome+Edge AC8).

## Contexto herdado — NÃO reabrir

- Infra 4.7 (Done PR #54 `25d1c780`): `/api/push/send` Node + cookie-auth, subscription KV singleton, SW `push` stub (display = 4.9).
- 4.6 (Done PR #51 `d13a6067`): `listPendingReminders(now)` (`reminders.ts`), CRUD lembretes, RRULE persistida sem motor.
- Ponta solta separada (não deste handoff): `1.12.story.md` Done mas ainda em `active/` — falta `git mv` para `completed/` (`@po`/`@devops`).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.8-gap46-RESOLVIDO-aguarda-sm-refinamento.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Aria (`@architect`)
DATA: `02/06/2026`
