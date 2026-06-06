# RETOMA — Story 4.8 (Agendamento de disparo de push) · refinada (Opção A′) · Ready for `@po` validation

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** River (`@sm`) — refinamento da Story 4.8 pós-Architect-Gate
**to_agent:** Pax (`@po`) — `*validate-story-draft 4.8`
**created:** 2026-06-02
**status:** consumed
**consumed:** true
**consumed_at:** 2026-06-02T00:00:00Z
**consumed_by:** po (Pax)
**resultado:** GO 9/10 (Confidence High). Status: Approved (Ready for @dev). 6/6 checklist PASS. 2 Should-Fix de wiring aplicados (F1: ponto de wiring = handlers de app/(app)/lembretes/page.tsx, não useReminders read-only; F2: caso restore adicionado aos pontos de espelhamento). Change Log v0.4 + secção PO Validation. Próximo: @dev *develop 4.8 (gate @architect).
**prioridade:** ALTA — penúltima do Epic 4; após validação → `@dev *develop 4.8` (gate `@architect`). Fechar 4.8 + 4.9 leva o Epic 4 a 10/10.

## Summary

A Story 4.8 (`docs/stories/active/4.8.story.md`) foi **refinada** para a **Opção A′** decidida pela Aria (`@architect`) no Architect Gate de entrada ([GAP-4.6] RESOLVIDO). Os AC2-AC9 e as Tasks T0-T9 deixaram de ser condicionais e estão fixados. Status: **Draft — Ready for `@po` validation** (Change Log v0.3).

## O que mudou no refinamento (v0.3)

| Item | Refinamento |
|------|-------------|
| AC2 | Disparo via `sendPushNotification` (invocada pelo `/api/push/dispatch`); `data` carrega `id` do lembrete p/ 4.9; só canal `'push'` (Telegram = Epic 6) |
| AC3 | 3 peças: `sendPushNotification` (extracção de `/api/push/send` → `lib/push/send-notification.ts`) + `/api/push/schedule` (cookie-auth, mirror `nexus:push:schedule:<id>`) + `/api/push/dispatch` (Node, `CRON_SECRET` Bearer) |
| AC4 | Idempotência server-side (`pending → sent` no mirror KV) |
| AC5 | Recorrência **DIFERIDA** (recurrenceId===null = série activa; recorrentes disparam 1ª ocorrência; `runReminderRecurrenceEngine` = follow-up pós-Epic-4) |
| AC6 | Reconciliação **IN** (sent KV → Dexie on-mount via `dailyRunGate`) |
| AC7 | `vi.mock('@vercel/kv')` + teste de auth do dispatch (401 sem CRON_SECRET) + não-tautológico |
| Tasks | Reescritas T0-T9 (T2 extracção / T3 schedule+wiring / T4 dispatch+idempotência / T5 reconciliação / T6 diferimento / T7 testes / T8 smoke / T9 gate) |
| Dev Notes | Tabela de ficheiros a criar/alterar (3 novos + 2 alterados + 1 wiring) + secção "Dependências `@devops`" |

## Validação preventiva (para o `@po` confirmar)

- **`external-contract-identifiers.md`:** único identificador novo = `CRON_SECRET` (ASCII, convenção Vercel Cron). Chave KV `nexus:push:schedule:<id>` segue prefixo ADR-6. `ReminderStatus 'sent'` e `RecurrenceOwnerType 'reminder'` já no enum (`schemas.ts:334/71`) — sem invenção.
- **`separation-of-roles.md`:** executor `@dev`, quality gate `@architect` (não se sobrepõem).
- **`mock-protocol-fidelity.md`:** plano de mock fixado (Opção A′) com teste não-tautológico + auth.
- **Anti-hallucination:** tudo traça a código real (`reminders.ts:42/49`, `session.ts:37`, `schemas.ts`, `vercel.json`) ou à decisão da Aria.

## Próxima acção (`@po` — Pax)

1. `*validate-story-draft 4.8` (10-point checklist). Atenção especial: AC testáveis (AC2-AC8 concretos), fronteira 4.8/4.9, diferimento de recorrência (AC5) justificado, deps `@devops`.
2. **Nota não-bloqueante a propagar:** confirmar **plano Vercel** (Cron 1-min se Pro; senão scheduler externo) **antes** da implementação da T4 — `@devops`. Condiciona o mecanismo de "±60s", não a arquitectura.
3. Se GO → `@dev *develop 4.8` (gate `@architect`, smoke Chrome+Edge AC8 obrigatório).

## Contexto herdado — NÃO reabrir

- Decisão [GAP-4.6] (Opção A′) é da Aria — não reabrir; está na secção "Architect Gate — Decisão de Entrada" da story.
- Infra 4.7 (Done PR #54 `25d1c780`) e 4.6 (Done PR #51 `d13a6067`) — só consumir.
- Ponta solta separada (não deste handoff): `1.12.story.md` Done mas ainda em `active/` — falta `git mv` p/ `completed/`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.8-refinada-ready-for-po-validation.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: `02/06/2026`
