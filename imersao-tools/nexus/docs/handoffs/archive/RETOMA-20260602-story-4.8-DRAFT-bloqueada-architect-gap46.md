# RETOMA — Story 4.8 (Agendamento de disparo de push) DRAFT · bloqueada por decisão `@architect` [GAP-4.6]

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** River (`@sm`) — `*draft 4.8`
**to_agent:** Aria (`@architect`) — resolver [GAP-4.6] (Architect Gate de entrada) ANTES de `@po`/`@dev`
**created:** 2026-06-02
**status:** consumed
**consumed:** true
**consumed_at:** 2026-06-02T00:00:00Z
**consumed_by:** architect (Aria)
**resultado:** [GAP-4.6] RESOLVIDO — Opção A′ (disparo server-side + mirror KV) registada na secção "Architect Gate — Decisão de Entrada" da `4.8.story.md` (Change Log v0.2). Próximo: `@sm` refina AC3-AC6 + T2+.
**prioridade:** ALTA — [GAP-4.6] é o R1 de risco Alto do Epic 4; bloqueia o scope da story.

## Summary

A **Story 4.8 (Agendamento de disparo de push, FR34, Epic 4)** está em **Draft** em
`imersao-tools/nexus/docs/stories/active/4.8.story.md`. Ao contrário das outras stories do Epic 4,
**não pode passar a Ready sem uma decisão arquitectural prévia** — o `[GAP-4.6]` (disparo às 15h
±60s com app possivelmente fechada) é o R1 de risco Alto e o `EPIC-4.md` §7/§10 encaminha-o
explicitamente a `@architect` para resolver **no draft, antes da implementação**. O `@sm` draftou a
story com a tensão e as opções candidatas fundamentadas em código/infra reais, **sem decidir**
(Constitution Art. IV — No Invention).

## Tensão central documentada (o que força a decisão `@architect`)

- **PRD §10 + EPIC §5** descrevem a 4.8 como *"agendamento **client** ao 1.º carregamento do dia
  (reutiliza ADR-2.7-1 on-mount)"* — padrão `useDailyGenerationEngine`/`dailyRunGate` (corre só com
  a app aberta).
- **AC2 (epic, linha 508 do PRD)** exige *"push às 15h ±60s"* — com o caso de uso real de **app
  fechada**. O padrão on-mount **não satisfaz** o AC2 nesse cenário.
- **Lembretes vivem em Dexie/IndexedDB (client-only)** — o servidor não os lê. `/api/push/send`
  (4.7) existe mas precisa de ser invocado. `vercel.json` **não tem `crons`**.

## Opções candidatas apresentadas a `@architect` (NÃO decididas pelo `@sm`)

| Opção | Mecanismo | Satisfaz AC2 (app fechada)? | Custo / dependências |
|-------|-----------|------------------------------|----------------------|
| **A** | Cron server-side (Vercel Cron 1 min) + mirror de agenda `{id,fireAt,text,status}` em KV; endpoint interno lê "devidos" e invoca `/api/push/send`; reconcilia `sent` ao client | **SIM** | Alto — `crons` no `vercel.json` (**`@devops`**) + mirror KV + reconciliação estado + idempotência |
| **B** | Client-only on-mount + catch-up + `setTimeout` (literal do PRD, padrão 3.10) | **NÃO** (só ao reabrir a app) | Baixo — sem infra; **exige reconciliar/relaxar o AC2** |
| **C** | Notification Triggers API (`TimestampTrigger`) no SW | Parcial | **Falha NFR23** (Edge sem suporte fiável) — provável rejeição |

## Próxima acção (`@architect` — Aria)

1. Avaliar Opções A/B/C com a evidência da "Nota do `@sm`" da story (secção [GAP-4.6]).
2. Decidir: (a) opção; (b) AC2 mantido "±60s app fechada" ou reconciliado; (c) fronteira de scope;
   (d) recorrência `ownerType:'reminder'` entra nesta story ou difere; (e) dependências `@devops` (Opção A).
3. Registar na secção **"Architect Gate — Decisão de Entrada"** da story (já existe placeholder no fim).
4. Depois: `@sm` refina AC3-AC6 + Tasks T2+ para a opção escolhida → `@po *validate-story-draft 4.8` → `@dev *develop 4.8` (gate `@architect`).

Fechar 4.8 + 4.9 leva o **Epic 4 a 10/10** → depois `@po *retrospective epic-4`.

## Contexto herdado — NÃO reabrir

- Infra 4.7 (Done PR #54 `25d1c780`): `/api/push/send` Node runtime, subscription KV `nexus:push:subscription:singleton`, SW mínimo `/sw.js` com handler `push` **stub** (display visível é da 4.9).
- 4.6 (Done PR #51 `d13a6067`): `listPendingReminders(now)` pronto (`reminders.ts:42`), lembretes em Dexie, RRULE persistida sem motor activado.
- `runRecurrenceEngine` só `'task'`; `runFinanceRecurrenceEngine` só `'transaction'` — `ownerType:'reminder'` ainda não activado (escalado da 4.6 para aqui).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.8-DRAFT-bloqueada-architect-gap46.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: `02/06/2026`
