# RETOMA — Story 4.8 (Agendamento de disparo de push) · implementada · Ready for `@architect` gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Dex (`@dev`) — `*develop 4.8` (Opção A′)
**to_agent:** Aria (`@architect`) — quality gate de saída (executor `@dev` ≠ gate; território arquitectural novo — `separation-of-roles.md` + EPIC-4 §5)
**created:** 2026-06-03
**status:** pending
**prioridade:** ALTA — penúltima do Epic 4. Após gate PASS → `@devops` push + PR. Fechar 4.8 + 4.9 leva o Epic 4 a 10/10.

---

## ARRANQUE EM TERMINAL NOVO (ler primeiro)

**Comando a invocar:** `@architect *develop` não — usar gate de revisão:
```
@architect  (depois)  *review 4.8
```
…ou simplesmente abrir o agente architect e pedir: "quality gate de saída da Story 4.8 (Ready for Review)". O agente deve **ler este handoff + `docs/stories/active/4.8.story.md` na íntegra** antes de decidir.

**Estado git verificado (03/06/2026):**
- Branch activa: `feat/nexus-v2-story-4.8-push-dispatch`
- Commits da 4.8: `e1460e98` (feat) + `1db8f7f1` (fix CR Iter 1)
- ⚠️ Commit alheio na mesma branch: `fd7fbd12` (pomodoro — outra sessão; **NÃO é da 4.8**, ver secção AVISO)
- Story status: **Ready for Review**
- **NÃO foi feito push** (autoridade `@devops`)

**Sobre o aviso "Auto-update failed: claude.exe in use":** é inofensivo — só impede o auto-update do CLI por haver vários terminais Claude Code abertos. **NÃO fechar terminais** (regra do Eurico: trabalho em paralelo). Ignorar o aviso ou correr `/doctor` quando conveniente. Não afecta o trabalho da 4.8.

**Verificação rápida ao arrancar (opcional):**
```
cd imersao-tools/nexus/v2 && npx tsc --noEmit && npx vitest run tests/unit/lib/push tests/unit/api/push
```
(esperado: typecheck exit 0; ~42 testes push PASS)

---

## Summary

Story 4.8 implementada (Opção A′ — disparo server-side + mirror KV). Status **Ready for Review** (`docs/stories/active/4.8.story.md`, Change Log v0.5/v0.6). Branch `feat/nexus-v2-story-4.8-push-dispatch`, 2 commits da 4.8: `e1460e98` (feat) + `1db8f7f1` (fix CR Iter 1). Gates locais todos PASS; CR Iter 1 = 0 CRITICAL.

## O que foi implementado (7 peças)

| Ficheiro | Acção |
|----------|-------|
| `lib/push/send-notification.ts` | CRIAR — `sendPushNotification` (extracção da lógica de envio, server-only) |
| `app/api/push/send/route.ts` | ALTERAR — wrapper fino (contrato 4.7 inalterado: 401/400/409/410/500/200) |
| `lib/push/schedule-store.ts` | CRIAR — mirror KV hash `nexus:push:schedule` (D-KV-HASH) |
| `app/api/push/schedule/route.ts` | CRIAR — cookie-auth PUT/DELETE/GET |
| `app/api/push/dispatch/route.ts` | CRIAR — Node, `CRON_SECRET` Bearer timing-safe, lê devidos + envia + marca sent |
| `lib/push/schedule-client.ts` | CRIAR — helpers client `fetch` best-effort |
| `lib/push/reconcile-reminders.ts` + `hooks/useDailyGenerationEngine.ts` | CRIAR+ALTERAR — reconciliação on-mount sent KV→Dexie |
| `app/(app)/lembretes/page.tsx` | ALTERAR — wiring nos 5 handlers (create/edit/cancel/restore/delete) |
| `lib/shared/env.ts` | ALTERAR — `CRON_SECRET` no `ServerEnvSchema` |

## Gate — pontos a ratificar (`@architect`)

### 4 DEV-DECISIONS (FLAG)

1. **D-KV-HASH** — mirror num hash `nexus:push:schedule` (field=id) em vez de chave-por-id. Razão: enumeração do dispatch via `hgetall` (evita `kv.keys()`/scan), atómico por field, prefixo `nexus:` mantido. **Divergência menor da letra da decisão de entrada** (`nexus:push:schedule:<id>`) — mesmo namespace lógico. Pede ratificação.
2. **D-RECON-MOUNT** — reconciliação corre em cada mount, fora do gate diário `dailyRunGate` (integrada no `useDailyGenerationEngine` antes do gate). Razão: gated-por-dia atrasaria a marcação `sent` até ao dia seguinte. Cumpre "on-mount" + "reutiliza useDailyGenerationEngine" do AC6.
3. **D-RECON-CLEANUP** — client remove do mirror após reconciliar (fecha ciclo, impede crescimento).
4. **D-MIRROR-BESTEFFORT** — espelhamento client não lança (não parte o CRUD da 4.6).

### CR Iter 1 (`--base main`) — 0 CRITICAL

3 fix aplicados (resp.ok ×2 + teste do schedule route). **1 Major SKIP a confirmar:** "SCHEDULE_KEY sem per-user namespacing" — defendido como falso positivo (Nexus single-user `userId:'eurico'`; precedente ratificado 4.7 subscription singleton). 3 minor skip (reconcile já best-effort; markScheduleSent race auto-limpo; dispatch sobreposição não ocorre em Vercel Cron). Detalhe na secção "CodeRabbit — Iter 1" da story.

### Verificar em código (sugestão de gate)

- Contrato externo de `/api/push/send` realmente inalterado (mapeamento SendResult→status).
- `send-notification.ts`/`schedule-store.ts` server-only (não importados no client).
- Idempotência `pending→sent` (AC4) + janela `fireAt<=now` não-tautológica (testes `dispatch.test.ts`).
- `CRON_SECRET`/VAPID nunca logados (NFR5).

## Pendentes (NÃO bloqueiam o gate de código)

- **AC8 smoke manual Chrome+Edge** — não executável em dev (requer browser + scheduler/`CRON_SECRET`). A executar após dependência `@devops`.
- **Dependência `@devops` (Gage):** provisionar `CRON_SECRET` (Vercel env + `.env`) + confirmar plano Vercel e configurar scheduler — Vercel Cron `* * * * *` no `vercel.json` (se Pro) **ou** scheduler externo a bater em `/api/push/dispatch`. `vercel.json` **não foi tocado** (path bloqueador). Endpoint é agnóstico à origem do trigger.
- **AC5 recorrência DIFERIDA** — criar item de backlog "disparo de lembretes recorrentes server-side" (`@po`/`@pm`, pós-Epic-4).

## AVISO — commit alheio na branch (paralelismo de terminais)

A branch contém um commit **`fd7fbd12 "feat: add configurable pomodoro alarm"`** que **NÃO pertence à 4.8** — foi commitado por outra sessão/terminal na branch partilhada enquanto a 4.8 era implementada. Toca `components/widgets/PomodoroWidget.tsx`, `hooks/usePomodoro.ts`, `tests/unit/hooks/usePomodoro.test.tsx` + `docs/stories/active/pomodoro-custom-duration-alarm.story.md`. **Não lhe mexi** (não é meu trabalho). O `@devops`, ao preparar o PR, deve decidir a estratégia: isolar a 4.8 (cherry-pick dos 2 commits da 4.8 para branch limpa) ou tratar o pomodoro separadamente. Os 2 commits da 4.8 são `e1460e98` + `1db8f7f1`.

## Contexto herdado — NÃO reabrir

- Decisão [GAP-4.6] (Opção A′) é da Aria — secção "Architect Gate — Decisão de Entrada" da story.
- Infra 4.7 (Done PR #54 `25d1c780`) e 4.6 (Done PR #51 `d13a6067`) — só consumidas.
- Hard-stop EPIC-4 §8: máx 2 iter CR; Iter 1 teve 0 CRITICAL (não atingido).

## Próxima acção (`@architect` — Aria)

Quality gate de saída da 4.8: ratificar as 4 DEV-DECISIONS (em especial D-KV-HASH e a defesa do Major CR), verificar AC2/AC4/AC6 em código, confirmar contrato de `/api/push/send` inalterado. Se PASS → `@devops` push + PR (+ provisionar `CRON_SECRET`/scheduler + smoke AC8). Decidir estratégia para o commit alheio `fd7fbd12`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.8-ready-for-architect-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Dex (`@dev`)
DATA: `03/06/2026`
