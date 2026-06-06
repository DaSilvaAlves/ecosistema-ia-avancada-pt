# RETOMA — Story 4.9 Ready for Architect Gate (SW push handler)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** `@dev` (Dex)
**to_agent:** `@architect` (Aria)
**created:** 03/06/2026
**status:** pending
**projecto:** Nexus v2 (`imersao-tools/nexus/`)
**branch:** `feat/nexus-v2-story-4.8-push-dispatch`
**commit local (NÃO pushed):** `105380b5`

---

## Summary

Story 4.9 (SW push handler: notificação visível + botões "marcar feito"/"snooze") implementada em modo YOLO. É a ÚLTIMA story do Epic 4 — em Done, o epic fecha 10/10. Implementados AC1-AC12; AC13 (gate manual Chrome+Edge) delegado a este gate `@architect` (território Web Push = contrato externo, conforme EPIC-4.md §5). 4 gates locais frescos PASS; CodeRabbit Iter 1 (4 findings) triado: 1 FIXED, 3 SKIP justificados (1 by-design, 1 doc-reconciliado, 1 FLAG para `@architect`). Status → Ready for Review. NÃO foi feito push nem PR (exclusivo `@devops`).

## Context

### O que foi entregue
- `public/sw.js` — handler `push` real (`showNotification` + actions `marcar-feito`/`snooze`) + `notificationclick` (acção sem abrir app; dismiss abre/foca app via `matchAll`+`focus`).
- `app/api/push/action/route.ts` (CRIADO) — endpoint Node CRON_SECRET Bearer; `marcar-feito`→`markScheduleSent`; `snooze`→`putSchedule(fireAt=now+10min, status:'pending')`.
- `lib/push/cron-auth.ts` (CRIADO) — `secretsMatch`/`extractBearer` extraídos do dispatch (4.8), reutilizados por dispatch + action (SSOT auth Bearer cookie-less).
- `GET /api/push/schedule` estendido → `{ sent, pending:[{id,fireAt}] }` (não-breaking).
- `lib/push/schedule-client.ts` — `fetchPendingSchedules()`; `lib/push/reconcile-snooze.ts` (CRIADO) — `reconcileSnoozedReminders()`; wiring on-mount em `hooks/useDailyGenerationEngine.ts` L54 (`lembretes/page.tsx` NÃO tocada — CRIT-1 respeitado).
- 36 testes novos (SW push/click, action, GET-ext, client-pending, reconcile-snooze).

### Gates locais (frescos, em `imersao-tools/nexus/v2/`)
| Gate | Resultado |
|------|-----------|
| `npm install` | deps íntegras (766 pacotes) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (1 warning PRÉ-EXISTENTE fora de scope: `app/api/auth/logout/route.ts`) |
| `npm run test:unit` | 1365/1365 PASS (+36 vs 1329 da 4.8) |
| `npm run build` | exit 0 (26 rotas; `/api/push/action` presente) |

### CodeRabbit Iter 1 (scoped ao commit, `--base-commit HEAD~1`)
- **F2 (minor) FIXED** — asserção vacuosa de `removeReminderSchedule` no teste reconcile-snooze corrigida (mock `importOriginal`+spread; spy wired no módulo real do SUT).
- **F1 (minor) SKIP by-design** — loop "sobrescreve" lembretes não-snoozed: é a semântica ratificada AC10 (status:snoozed é só visual; scheduler dispara por fireAt).
- **F4 (critical) RESOLVIDO por doc** — CR queria renomear tests `.ts`→`.js`; instrução incorrecta para o `vitest.config.ts` (include só `.ts/.tsx`). Doc reconciliado (D-SW-TEST-FRAMEWORK anotado).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`. (Confirmado: refere-se ao Nexus v2, vive em `imersao-tools/nexus/docs/handoffs/` — convenção dos handoffs Nexus anteriores.)

---

## next_action (`@architect` Aria)

1. **Quality gate da 4.9** (território Web Push, conforme EPIC-4.md §5 + `separation-of-roles.md`: executor `@dev` ≠ gate).
2. **AC13 — teste manual Chrome + Edge** (delegado pelo `@dev`, requer browser + push service real): criar lembrete, disparar via `POST /api/push/send` (cookie) ou aguardar scheduler, confirmar que a notificação mostra "Marcar feito" + "Snooze 10min" e que "Marcar feito" fecha sem abrir a app. Documentar resultado no gate.
3. **DECISÃO sobre o CR F3 (major, auth do `/api/push/action`):** o CR levanta que o SW não deve ter o `CRON_SECRET` embebido. A decisão D-ACTION-AUTH (reutilizar CRON_SECRET Bearer porque o SW não tem cookie) foi ratificada por ti + PO, mas o CR aponta uma tensão legítima de segurança (secret no SW). O `@dev` deixou o secret como placeholder injectável (`self.__NEXUS_PUSH_ACTION_SECRET__`), NÃO hard-coded, e NÃO alterou a auth unilateralmente. **Avaliar:** manter CRON_SECRET Bearer (e definir como o `@devops` injecta o secret no `sw.js` no deploy) OU mudar para cookie-auth same-origin (o SW herda o cookie de sessão em `fetch` same-origin — alternativa que o CR sugere e que elimina o secret do SW). Esta é uma decisão de arquitectura de auth — fora do mandato do `@dev`.
4. Se PASS → `@devops *push` (commit `105380b5` + PR). Epic 4 fecha 10/10.

## blockers
- Nenhum bloqueador de implementação. Ponto aberto para decisão `@architect`: auth do `/api/push/action` (CR F3) — ver next_action 3.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.9-ready-for-architect-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `03/06/2026`
