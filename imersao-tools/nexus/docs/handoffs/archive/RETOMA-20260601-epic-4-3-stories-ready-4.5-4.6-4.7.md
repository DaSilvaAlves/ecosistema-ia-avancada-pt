# RETOMA — Nexus v2 Epic 4 · 4/10 Done · 3 stories Ready (4.5 + 4.6 + 4.7)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Orion (`@aiox-master`) — sessão de orquestração 01/06/2026
**to_agent:** próximo terminal (qualquer agente AIOX; Eurico decide) → `@dev` / `@ux-design-expert` / `@devops`
**created:** 2026-06-01
**status:** pending
**prioridade:** ALTA — 3 stories validadas e prontas a implementar. 1 acção de infra só do Eurico desbloqueia a 4.7.

## Summary

Sessão 01/06/2026 (Orion) deixou o **Epic 4 do Nexus v2 com 4/10 Done e 3 stories Ready** prontas para implementação. A Story 4.7 (Web Push) recuperou de um NO-GO 4/10 através do ciclo Aria→River→Pax; as Stories 4.5 e 4.6 foram draftadas e validadas de novo. Todas passaram por validação `@po` com GO ≥9/10. As três são independentes entre si (ficheiros distintos) e podem ser implementadas em paralelo em terminais separados. A única dependência externa é o pré-req de infra da 4.7 (VAPID keys no Vercel), que só o Eurico pode fazer.

## Estado consolidado

| Item | Valor |
|------|-------|
| Epic 4 | **4/10 Done** (4.1, 4.2, 4.3, 4.4). 4.4 merged PR #50 `192b488c`, closure `73072aeb` |
| `main` | `73072aeb`, sync origin (`0 0`) |
| Branch actual | `feat/nexus-v2-story-4.4-metricas` (já merged). Nenhuma branch nova das 4.5/4.6/4.7 criada |
| Stories Ready | 4.5, 4.6, 4.7 (ficheiros em `imersao-tools/nexus/docs/stories/active/`) |

## As 3 stories Ready

| Story | Scope | Validação | Executor → Gate | Bloqueio |
|-------|-------|-----------|-----------------|----------|
| **4.5** CRUD metas (FR39/FR40) | Helper `lib/metas/progress.ts` + 4 componentes (`GoalProgressBar`/`GoalFormModal`/`GoalsList`/`GoalView`) + página `/metas` (3 tabs). `progressLog?` não-indexado sem version bump | **GO 9/10** | `@ux-design-expert` → `@dev` | nenhum |
| **4.6** CRUD lembretes (FR33) | `ReminderFormModal` + `RemindersList` (4 estados) + página `/lembretes` (tabs Pendentes/Cancelados) + NavLink. Só CRUD + guarda RRULE | **GO 10/10** | `@dev` → `@qa` | nenhum |
| **4.7** Web Push (FR34/FR35) | Helpers `utils.ts`+`subscriptions-store.ts`, rotas `subscribe`(editar stub)+`send`(nova Node), hook `usePushSubscription`, `PushPermissionPrompt` (3 estados) | **GO 9/10** | `@dev` → `@architect` | **AC1: VAPID keys no Vercel (só Eurico)** |

## next_action — ordem recomendada

**A) DESBLOQUEAR 4.7 (só Eurico — Vercel, outward-facing):**
Gage gerou o par VAPID nesta sessão (valores no transcript da sessão — efémeros, não versionados). Falta:
```
vercel env add WEB_PUSH_VAPID_PRIVATE production
vercel env add NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC production
```
+ acrescentar ambas a `imersao-tools/nexus/v2/.env.local`. Vercel KV **já provisionado** (undo/confirm/session/onboarding já usam `@vercel/kv`) — nada a criar. Se o transcript da sessão já não estiver acessível, `@devops` regenera o par com `npx web-push generate-vapid-keys --json` em `imersao-tools/nexus/v2/`. Feito isto, AC1 satisfeito.

**B) IMPLEMENTAR (qualquer ordem; podem paralelizar em terminais distintos):**
- `@dev *develop 4.6` — mais simples, GO 10/10, sem dependências. Gate `@qa`. OBS-1: NÃO recriar os testes de repo da 4.1 (`reminders.test.ts` já cobre cascade+update; o novo é só o caminho `status:'cancelled'`).
- `@ux-design-expert *develop 4.5` — gate `@dev`. OBS: considerar regex ISO `^\d{4}-\d{2}-\d{2}$` no `progressLog.date`.
- `@dev *develop 4.7` — só APÓS o passo A. Gate `@architect` (protocolo externo Web Push/VAPID/KV; separation-of-roles).

## Decisões fixadas (NÃO reabrir)

- **4.7 CRIT-2:** public key VAPID via `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC`/`getPublicEnv()` (`env.ts:36,71-74`). SEM rota `/api/push/public-key`.
- **4.7 CRIT-3:** persistência em Vercel KV (não Dexie). Helper server-only `v2/lib/push/subscriptions-store.ts`, chave `nexus:push:subscription:singleton`, shape `{ endpoint, keys:{p256dh,auth}, createdAt }`. `@vercel/kv` já em `package.json:43`.
- **4.7 mailto:** literal `mailto:eurico@nexus.app` hardcoded (sem env var nova).
- **4.5/4.6:** schema Dexie fixado na 4.1 — campos opcionais não-indexados sem version bump (padrão `Habit.archivedAt?`, `types/db.ts:177`). `client.ts` permanece `version(4)`, não tocar.

## Pontos preservados / fronteiras

- **4.6 vs 4.8:** a 4.6 só faz CRUD + guarda `Recurrence`; o motor de geração de instâncias e o disparo às 15h (GAP-4.6, app fechada) pertencem à **4.8**. A 4.6 NÃO consome `listPendingReminders(now)`.
- **4.7:** GAP-4.6 escalado para 4.8; 3 estados `PushPermissionPrompt` (C1-C3) com testes de componente obrigatórios; fidelidade de protocolo (urlBase64ToUint8Array 65 bytes P-256, `userVisibleOnly:true`, `subscription.toJSON()`).

## Notas importantes

- **gh sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`**.
- **Push exclusivo `@devops`**; Eurico faz merge manual; closure docs-only directo para main sem PR (convenção Nexus v2).
- **Hard-stop CR:** máx 2 iterações; Iter 3 / merge waived exigem autorização humana no commit.
- **Working tree:** muitos untracked/modified fora de scope (submódulos `comunidade`/`starter-builder`, backups `.antigravity`/`.cursor`, ficheiros `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*` em `docs/`) — NÃO tocar; nada disso pertence a estas stories.
- **Lições orquestração (01/06):** (1) nunca correr `@sm` (escrita) e `@po` (validação) em paralelo na MESMA story — sequencial. (2) Verificar gravação de story por grep independente — a 1ª gravação do River na 4.7 falhou silenciosamente e reportou sucesso (`mandatory-change-log`). (3) Identificadores de contrato externo validam-se contra o código no draft, não no PRD (`external-contract-identifiers.md` — causa do NO-GO da 4.7). (4) Prompts de subagente muito longos rebentam ("Prompt is too long") — manter enxutos.
- **Memória:** `project_nexus_v2_epic_4` (estado actualizado), `project_nexus_v2_architecture` (ADRs), `project_nexus_v2_producao` (LIVE).

**Passo 0 no novo terminal:** `cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"; git status; git log --oneline -3` — validar `main` em `73072aeb`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260601-epic-4-3-stories-ready-4.5-4.6-4.7.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Orion (@aiox-master)` · DATA: `01/06/2026`
