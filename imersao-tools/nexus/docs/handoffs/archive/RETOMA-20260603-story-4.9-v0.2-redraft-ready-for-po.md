> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# RETOMA — Story 4.9 v0.2 re-draft completo, aguarda re-validação `@po`

**From:** River (`@sm`)
**To:** Pax (`@po`) — `*validate-story-draft 4.9`
**Created:** 03/06/2026
**Status:** pending

---

## Resumo

Story 4.9 foi revista em v0.2 corrigindo os dois bloqueadores (CRIT-1 e CRIT-2) que levaram ao NO-GO Pax (5/10). A camada SW + endpoint de acção mantém-se inalterada e implementável. As alterações concentram-se na reconciliação de snooze e no seu wiring.

**Ficheiro:** `docs/stories/active/4.9.story.md`
**Branch:** `feat/nexus-v2-story-4.8-push-dispatch`

---

## O que mudou em v0.2

### CRIT-1 — Wiring on-mount corrigido para o local real

**v0.1 (errado):** T5 instruía adicionar `reconcileSnoozedReminders()` no "useEffect on-mount de `app/(app)/lembretes/page.tsx` (junto ao `reconcileSentReminders` existente da 4.8)".

**Código real verificado:**
- `app/(app)/lembretes/page.tsx` — zero chamadas a `reconcileSentReminders`. Dois `useEffect`s existentes: (1) Escape handler, (2) auto-dismiss de toast de erro. Nenhum de reconciliação.
- `hooks/useDailyGenerationEngine.ts` L13: `import { reconcileSentReminders }`. L53: `void reconcileSentReminders()` dentro do `useEffect(() => { ... }, [])` on-mount.

**v0.2 (correcto):** T7 (renumerado) instrui adicionar `void reconcileSnoozedReminders()` em `hooks/useDailyGenerationEngine.ts` imediatamente após `void reconcileSentReminders()` (linha ~L53). `lembretes/page.tsx` não é modificada para este fim.

### CRIT-2 — Contrato GET schedule estendido, AC8 (agora AC10) tornada implementável

**v0.1 (não-implementável):** AC8 descrevia reconciliar snooze lendo "entradas `pending` cujo `fireAt` diverge do Dexie". Mas `GET /api/push/schedule/route.ts` só devolvia `{ sent: [ids] }` — sem `fireAt`, sem entradas `pending`. Não havia forma de o client detectar um `fireAt` actualizado por snooze.

**Código real verificado:**
- `app/api/push/schedule/route.ts` L119: `return NextResponse.json({ sent })` — só campo `sent`
- `lib/push/schedule-client.ts` L70-81: `fetchSentReminderIds()` lê apenas `json.sent`
- `lib/push/schedule-store.ts` L60: `listSchedules()` já devolve todas as entradas (sent + pending) — a extensão é trivial

**v0.2 (implementável):** adicionados como entregáveis explícitos:
- **AC8** (nova): extensão do `GET /api/push/schedule` para devolver `{ sent, pending: [{ id, fireAt }] }` — sem breaking change (campo `sent` mantido)
- **AC9** (nova): helper client `fetchPendingSchedules()` em `schedule-client.ts`
- **AC10** (era AC8): `reconcileSnoozedReminders()` consome `fetchPendingSchedules()` em vez de dados inexistentes
- **T4** (nova): modificação de `app/api/push/schedule/route.ts`
- **T5** (nova): modificação de `lib/push/schedule-client.ts`
- Tabela de ficheiros Dev Notes actualizada com `schedule/route.ts` + `schedule-client.ts` + `useDailyGenerationEngine.ts`

### Renumeração consequente

| v0.1 | v0.2 | Motivo |
|------|------|--------|
| AC8 (reconciliação snooze) | AC10 | Inserção de AC8/AC9 antes |
| AC9 (testes C1-C8) | AC12 | Testes C9/C10/C11 adicionados |
| AC10 (manual Chrome+Edge) | AC13 | — |
| T5 (wiring lembretes page) | T7 (wiring useDailyGenerationEngine) | CRIT-1 |
| T6 (testes C1-C8) | T8 (testes C1-C11) | + testes C9/C10/C11 |
| T7 (quality gates) | T9 | — |
| T8 (manual) | T10 | — |

---

## Contexto para o `@po`

### O que está Done em `main` (base da 4.9)

| Story | PR | O que entregou para a 4.9 usar |
|-------|----|---------------------------------|
| 4.7 | #54 `25d1c780` | `public/sw.js` (stub `push`), `sendPushNotification`, KV singleton, `usePushSubscription` |
| 4.8 | #55 `6b429560` + hotfix #56 `017a032c` | `/api/push/dispatch` (CRON_SECRET + `secretsMatch`/`extractBearer`), `schedule-store` (`putSchedule`/`markScheduleSent`/`listSchedules`), `schedule-client` (`fetchSentReminderIds`), `reconcile-reminders` (`reconcileSentReminders`), payload `data: { reminderId }`, `useDailyGenerationEngine` com `void reconcileSentReminders()` em L53 |

### Ficheiros criados/modificados em v0.2

| Ficheiro | Acção |
|---------|-------|
| `v2/public/sw.js` | MODIFICAR — handler `push` + `notificationclick` |
| `v2/app/api/push/action/route.ts` | CRIAR |
| `v2/app/api/push/schedule/route.ts` | MODIFICAR — extensão GET |
| `v2/lib/push/schedule-client.ts` | MODIFICAR — `fetchPendingSchedules()` |
| `v2/lib/push/reconcile-snooze.ts` | CRIAR |
| `v2/hooks/useDailyGenerationEngine.ts` | MODIFICAR — wiring `reconcileSnoozedReminders()` |
| 6 ficheiros de teste | CRIAR |

### Pontos estáveis (não alterados vs v0.1)

- AC1-AC7 (SW handler + endpoint action) — inalterados, implementáveis
- Validação external-contract-identifiers — inalterada
- mock-protocol-fidelity plan — inalterado (C1-C8 estáveis; C9-C11 adicionados)
- Executor `@dev`, quality gate `@architect` — inalterados
- Fronteira Epic 8 / GAP-4.5 — inalterada

---

LEMBRETE — REGRA HANDOFF-LOCATION: ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.9-v0.2-redraft-ready-for-po.md`
- COINCIDEM? SIM

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 03/06/2026
