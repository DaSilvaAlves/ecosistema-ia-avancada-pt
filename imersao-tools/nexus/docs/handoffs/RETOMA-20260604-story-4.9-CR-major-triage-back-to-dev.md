# RETOMA — Story 4.9 — Architect Gate Iter 3: triagem CR PR #58 → back to @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "@architect (Aria)"
to_agent: "@dev (Dex)"
created: "2026-06-04"
status: pending
story_id: "4.9"
story_path: "imersao-tools/nexus/docs/stories/active/4.9.story.md"
story_status: "Changes Requested (Architect Gate Iter 3)"
branch: "feat/nexus-v2-story-4.9-sw-push-handler"
pr: 58
pr_head: "68a43cec"
```

## Summary

O CodeRabbit corrido no PR #58 levantou **4 findings Major de lógica de PRODUÇÃO** na semântica da reconciliação de snooze (não no auth — esse fechou no Iter 2). Fiz a triagem: os 4 são bugs reais confirmados por análise de ciclo de vida do mirror KV. Ratifiquei o contrato de snooze corrigido (**D-SNOOZE-CONTRACT**) na story e produzi 7 required-fixes (RF1-RF7) para o `@dev`. NÃO implementei o código (separation-of-roles — sou o gate). A mudança de contrato é **aditiva e retrocompatível** com a 4.8 — cabe nesta story, sem follow-up.

## Context

### O bug de fundo (porque os 4 Major são reais)

O `ScheduleEntrySchema` (`lib/push/schedule-store.ts` L32-37) só tem `status: 'pending'|'sent'` — **não há estado de snooze no mirror**. Ciclo de vida real:

1. Lembrete criado → entrada `pending`.
2. Scheduler dispara (`fireAt<=now`) → `markScheduleSent` → entrada `sent`.
3. **É aqui (entrada `sent`) que o push chega e o utilizador clica "Snooze".**
4. App abre → `reconcileSentReminders` → `removeReminderSchedule` (DELETE) → entrada **desaparece**.

Consequências:
- **M1** (`action/route.ts:74-77`): no clique de snooze a entrada está `sent` ou removida → `!entry` → `{ok:true, applied:false}` → **snooze silenciosamente perdido** (o SW só envia `reminderId`).
- **M2** (`schedule/route.ts:125-128`) + **M3** (`reconcile-snooze.ts:30-42`): o GET `filter(status==='pending')` devolve **lembretes normais ainda-não-disparados** (a maioria das `pending`); a reconciliação marca-os TODOS `snoozed` em Dexie → **utilizador vê lembretes futuros normais rotulados como adiados**. Corrupção de estado visível.
- **M4** (`sw.js:68-77`): `postAction` não verifica `response.ok` → 401 (sessão expirada, com cookie-auth) passa como sucesso → notificação fecha e o utilizador pensa que resultou.

### Auto-crítica do gate

Os Iter 1/2 focaram-se no auth (F3-b) e **ratificaram a semântica de snooze como by-design** (F1 do CR Iter 1). Estava errado. O CR do PR fez a análise de ciclo de vida que o gate não fez. Reabri: **D-RECON-SNOOZE-KEEP e a "Nota de semântica" da AC10 ficam revogadas** → **D-SNOOZE-CONTRACT**.

### D-SNOOZE-CONTRACT (ratificada — detalhe completo na story, secção "Architect Gate — Iter 3")

- Marcador dedicado `snoozedAt?: number` no `ScheduleEntrySchema` (opcional → retrocompatível; ortogonal a `status`). **Rejeitada** a alternativa de adicionar `'snoozed'` ao enum `status` (obrigaria a mexer no filtro do dispatch da 4.8 e perder a re-disparabilidade).
- Reconciliação on-mount actua **só** sobre entradas com `snoozedAt` (GET filtra no servidor).
- Snooze de entrada ausente → **409** `{ok:false, error:'schedule-gone'}` (não silencia). `marcar-feito` ausente mantém-se idempotente 200.
- SW trata não-`ok` como falha (re-mostra notificação).

## next_action

Aplicar **RF1-RF7** (definidos na story, secção "Required-fixes numerados para o `@dev`"):

| RF | Ficheiro | Resumo | Resolve |
|----|----------|--------|---------|
| RF1 | `lib/push/schedule-store.ts` | `snoozedAt: z.number().int().positive().optional()` no schema | base de M1/M2/M3 |
| RF2 | `app/api/push/action/route.ts` | snooze grava `snoozedAt`; entrada ausente: snooze→409, marcar-feito→200 idempotente | M1 |
| RF3 | `app/api/push/schedule/route.ts` GET | `pending` = só `status==='pending' && typeof snoozedAt==='number'` | M2 |
| RF4 | `lib/push/reconcile-snooze.ts` | loop inalterado (fonte já filtrada); reescrever JSDoc/"Nota de semântica" | M3 |
| RF5 | `public/sw.js` `postAction` | `await` + `response.ok`; não-`ok` re-mostra notificação | M4 |
| RF6 | `4.9.story.md` | reconciliar AC5(d)/AC7/AC8/AC10 + remover guidance Bearer residual (T3 L197, Dev Notes L286-290) | story↔código |
| RF7 | nits | `dispatch/route.ts` L32 comentário stale; `action.test.ts` casos `snoozeMinutes` inválido; story L506 tabela MD056; handoffs com branch 4.8 stale | nits CR |

Critério de aceitação de cada RF está na story. Após RF1-RF7 → **re-gate `@architect` (Iter 4)** antes de `@devops` actualizar o PR. NÃO fazer merge antes do re-gate + AC13 manual (Eurico).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. É a pasta de handoffs do projecto Nexus v2 — localização correcta. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Notas de gate (o que NÃO reabre)

- **Auth** (D-ACTION-AUTH-COOKIE): PASS, ratificada no Iter 2. Não tocar.
- **Fidelidade de protocolo** (`mock-protocol-fidelity.md`): PASS. Os testes novos de snooze (RF2/RF4/RF5) têm de ser **não-tautológicos** (provar o contrato real, falhar se regredir) — é território Web Push, o gate vai verificar isto.
- **Impacto na 4.8**: `snoozedAt` é aditivo e opcional — `putReminderSchedule` e o dispatch da 4.8 não mudam. Sem follow-up nem nova story.

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260604-story-4.9-CR-major-triage-back-to-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@architect (Aria)`
DATA: `04/06/2026`
