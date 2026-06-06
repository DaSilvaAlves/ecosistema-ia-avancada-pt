> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# RETOMA — Story 4.9 Draft criada, aguarda validação `@po`

**From:** River (`@sm`)
**To:** Pax (`@po`) — `*validate-story-draft 4.9`
**Created:** 03/06/2026
**Status:** pending

---

## Resumo

Story 4.9 (SW push handler — display visível + botões "marcar feito"/"snooze") criada em `docs/stories/active/4.9.story.md`. Esta é a última story do Epic 4 (10/10). A 4.7 e a 4.8 estão Done em `main`. O SW actual (`public/sw.js`) tem um stub `push` com `console.warn` — esta story substitui esse stub pelo handler real e entrega os botões accionáveis (FR36, Epic 4 AC3).

**Story Draft Checklist: 5/5 (secção 6 N/A — padrão stories Web Push)**
**Resultado: READY for PO validation**

---

## Contexto completo para o `@po`

### O que está Done em `main` (base da 4.9)

| Story | PR | O que entregou para a 4.9 usar |
|-------|----|---------------------------------|
| 4.7 | #54 `25d1c780` | `public/sw.js` (stub `push`), `sendPushNotification`, KV singleton, `usePushSubscription` |
| 4.8 | #55 `6b429560` + hotfix #56 `017a032c` | `/api/push/dispatch` (CRON_SECRET), `schedule-store`, `schedule-client`, `reconcile-reminders`, payload `data: { reminderId }` |

### O que a 4.9 entrega

1. `public/sw.js` — handler `push` real (`showNotification` com `actions`) + handler `notificationclick` (marcar-feito / snooze / dismiss)
2. `app/api/push/action/route.ts` — endpoint CRON_SECRET para aplicar a acção em KV
3. `lib/push/reconcile-snooze.ts` — reconciliação on-mount para `snoozed`
4. Wiring on-mount em `app/(app)/lembretes/page.tsx`
5. Testes: 4 ficheiros (C1-C8 + protocolo real)

### [GAP-4.5] resolvido

SW mínimo focado em `push`/`notificationclick`. Fronteira explícita com Epic 8 (cache strategy — Story 8.3).

### Identificadores externos validados no draft

- Evento `push` — canónico Web Push API
- Evento `notificationclick` — canónico Notification API
- `action: 'marcar-feito'` e `action: 'snooze'` — ASCII, conforme spec `NotificationAction.action`
- `/api/push/action` — Node runtime, CRON_SECRET Bearer (mesmo da 4.8)

### [AUTO-DECISIONS] tomadas pelo `@sm`

| ID | Decisão | Razão |
|----|---------|-------|
| D-SW-SCOPE | Só `push` + `notificationclick`. Sem `fetch` handler. | Epic 4 §7 GAP-4.5; Epic 8 estende |
| D-ACTION-AUTH | `/api/push/action` usa CRON_SECRET (sem cookie — SW sem contexto de sessão) | Padrão da 4.8 |
| D-SW-TEST-FRAMEWORK | Testes do SW como `.js` com `vi.stubGlobal` | SW é JS puro, não TS |
| D-RECON-SNOOZE | Reconciliação de snooze separada da de sent | `status` + `fireAt` divergem — dois campos a actualizar |
| D-RECON-SNOOZE-KEEP | Entrada KV de snooze mantém `status: 'pending'` (aguarda re-disparo) | Mirror é fonte de verdade do scheduler |

---

## Próxima acção

`@po *validate-story-draft 4.9` — validar os 10 pontos do checklist PO contra `docs/stories/active/4.9.story.md`.

Após GO: `@dev *develop 4.9` com gate `@architect`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus` (Nexus v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.9-draft-ready-for-po-validation.md`
- COINCIDEM? SIM

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 03/06/2026
