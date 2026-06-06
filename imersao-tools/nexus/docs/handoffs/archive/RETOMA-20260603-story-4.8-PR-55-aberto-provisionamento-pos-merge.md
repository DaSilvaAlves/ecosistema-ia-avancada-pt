# RETOMA — Story 4.8 · PR #55 MERGED · provisionamento + AC8 pendentes

> **ACTUALIZAÇÃO 03/06/2026 10:10Z:** PR #55 **MERGED** (squash `6b429560` em `main`, autorização Eurico Opção A). Branch limpa eliminada; branch partilhada `feat/nexus-v2-story-4.8-push-dispatch` (pomodoro) intacta. **Próximo:** provisionamento (§B) → AC8 (§C) → `@po *close-story 4.8` (que inclui os 2 doc fixes do CR Iter 2 — ver §F).

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Gage (`@devops`) — push + PR da Story 4.8 (branch isolada)
**to_agent:** Eurico (merge) → depois `@devops` (provisionamento + AC8) + `@po` (close-story)
**created:** 2026-06-03
**status:** pending
**prioridade:** ALTA — penúltima do Epic 4. Após merge + provisionamento + AC8 → Epic 4 a 9/10 (resta 4.9).

---

## ARRANQUE EM TERMINAL NOVO (ler primeiro)

**PR #55 está aberto e isolado, à espera de merge do Eurico** (convenção Nexus v2 = merge manual). Depois do merge, executar o runbook de provisionamento (§B) + AC8 (§C).

- PR: https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/55
- Branch: `feat/nexus-v2-story-4.8-push-dispatch-clean` (3 commits, **só 4.8**)
- Worktree de build (já removido): era `C:/Users/XPS/Documents/nexus-48-clean`

---

## Summary

A Story 4.8 (disparo server-side de Web Push, Opção A′) passou o gate de saída `@architect` (Aria) e foi isolada + pushed pelo `@devops`. **PR #55 aberto contra `main`, contém só os 3 commits da 4.8** (o commit alheio `fd7fbd12` do pomodoro ficou de fora). Pre-push gate todo verde. Falta: merge (Eurico) → provisionar `CRON_SECRET`/scheduler → AC8 smoke.

## §A — O que já está feito (`@devops`)

| Passo | Estado |
|-------|--------|
| 1. Isolar a 4.8 | FEITO — branch `...-clean` criada de `main` via cherry-pick `e1460e98`+`1db8f7f1`; pomodoro `fd7fbd12` excluído. Branch partilhada original `feat/nexus-v2-story-4.8-push-dispatch` **intacta** (preserva o pomodoro da outra sessão). |
| 2. Pre-push gate | FEITO — typecheck exit 0; lint exit 0 (1 warning pré-existente alheio); **vitest 1329/1329**; build exit 0. |
| 3. Push + PR | FEITO — **PR #55** OPEN, MERGEABLE. 3 commits (feat `09381797` + fix `c90a5d3f` + docs-gate `eb9ff456`), **0 ficheiros pomodoro** (verificado). |
| CR pre-PR | Iter 1 (`@dev`, local) = **0 CRITICAL**. **Iter 2 server-side (PR #55) = CHANGES_REQUESTED, 3 actionable + 2 nitpicks, 0 CRITICAL** (ver §A.1). CR CLI local não corre em worktree (`.git`-file). |

### §A.1 — CR Iter 2 (server-side, PR #55) — triagem

`mergeStateStatus: CLEAN`, **0 CRITICAL** (NFR18 satisfeito). 3 actionable + 2 nitpicks, todos não-bloqueadores:

| Finding | Local | Sev | Natureza |
|---------|-------|-----|----------|
| Referência `[GAP-4.2]` no doc | `4.8.story.md:138` | Minor | Doc |
| "implementation summary" diz `useReminders` (devia ser handlers de `page.tsx`) | `4.8.story.md:225` | **Major** | **Doc** — linha stale na "Decisão de entrada" (a correcção F1 do `@po` actualizou os AC/tabelas mas não esta linha-resumo). **O código wires `page.tsx` correctamente** (verificado no gate da Aria) — não é defeito de código |
| `CRON_SECRET` sem min-length | `env.ts:32` | Minor | Hardening opcional (secret server-provisioned, não input de utilizador; dispatch já exige match exacto) |
| +2 nitpicks | — | Nit | — |

> **HARD-STOP EPIC-4 §8 — DECISÃO DO EURICO:** estamos no **Iter 2**. Tanto "Iter 3 (corrigir os doc nits + re-review)" como "merge-waived (mergear com os findings não-aplicados)" exigem **autorização humana explícita**. O `@devops` **não corrige** (seria Iter 3 / território `@dev`) nem **mergeia** sozinho. **Opções para o Eurico:**
> - **(A) Merge as-is** — gate (0 CRITICAL) está cumprido; o Major é texto de doc stale. Corrigir as 2 linhas de doc no closure commit do `@po *close-story 4.8` (docs-only, sem novo CR).
> - **(B) Autorizar Iter 3 doc-only** — `@dev` corrige `4.8.story.md:138` + `:225` (+ opcional `env.ts:32` min-length), commit com `Authorized-by: Eurico`, re-push (CR Iter 3 incremental).

> **Nota de sequenciamento:** o `/api/push/dispatch` só existe em produção **depois do merge**. Provisionar o scheduler antes do merge apontaria um cron a um 404. Por isso §B e §C são **pós-merge**.

## §B — Provisionamento (`@devops` / Eurico) — POS-MERGE

Projecto Vercel: **`imercao-ia-pt`** (team `euricojsalves-4744`), produção `https://imersao.ia.expressia.pt`. VAPID (4.7) + KV já provisionados; **falta `CRON_SECRET`**.

### B.1 — Gerar e definir o `CRON_SECRET` (NUNCA logar/committar o valor)

```bash
# gerar um secret forte (guardar — é partilhado entre Vercel e o scheduler)
openssl rand -hex 32
# OU: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

cd imersao-tools/nexus/v2
# Production (e Development p/ testar local):
vercel env add CRON_SECRET production     # cola o valor quando pedir
vercel env add CRON_SECRET development    # mesmo valor

# .env local (gitignored) p/ AC8 manual:
#   CRON_SECRET=<o mesmo valor>
```

> O valor tem de ser **idêntico** no Vercel env e no scheduler. `z.string().optional()` já está no `ServerEnvSchema` (`lib/shared/env.ts`); o dispatch responde `503` se ausente (fail-closed) e `401` se o Bearer não bate.

### B.2 — Escolher o scheduler (decisão do Eurico)

| Opção | Granularidade | vercel.json | Recomendação |
|-------|---------------|-------------|--------------|
| **Vercel Cron** | 1 min (exige plano **Pro**) | Path bloqueador — exige editar `vercel.json` + evidência local | Se o plano for Pro e quiseres tudo na plataforma |
| **Scheduler externo (cron-job.org / Upstash QStash)** | 1 min (free) | **Não toca** `vercel.json` | **DEFAULT recomendado** — agnóstico ao plano, sem path bloqueador, ±60s garantido |

**Plano Vercel ainda não confirmado** (Hobby vs Pro). O scheduler externo evita essa dependência por completo.

**B.2.a — Scheduler externo (recomendado):** configurar um job HTTP a cada 1 min:
```
POST https://imersao.ia.expressia.pt/api/push/dispatch
Header: Authorization: Bearer <CRON_SECRET>
```
(cron-job.org: criar conta → novo cronjob → URL acima → header Authorization → intervalo 1 min.)

**B.2.b — Vercel Cron (só se Pro):** adicionar ao `vercel.json` (path bloqueador `not-tested-trailer-rules.md` — **validar contra `https://openapi.vercel.sh/vercel.json` antes de committar; `Not-tested:` não é waiver**):
```json
{ "crons": [{ "path": "/api/push/dispatch", "schedule": "* * * * *" }] }
```
> A Vercel injecta automaticamente `Authorization: Bearer ${CRON_SECRET}` nos seus cron requests quando `CRON_SECRET` está nas env vars — por isso o endpoint valida o mesmo secret sem config extra. Esta alteração ao `vercel.json` deve ir num **commit/PR próprio** (path bloqueador), não misturada com a 4.8.

## §C — AC8 smoke Chrome + Edge (`@devops` / Eurico) — POS-PROVISIONAMENTO

1. Em produção (ou preview com env), criar um lembrete com `fireAt` ~2 min no futuro (canal `push`).
2. Esperar o tick do scheduler (ou invocar manualmente: `curl -X POST .../api/push/dispatch -H "Authorization: Bearer $CRON_SECRET"`).
3. Confirmar **envio**: `200` do dispatch com `{ok:true, dispatched:1}` e/ou evento `push` recebido no SW.
4. Repetir em **Chrome e Edge** (NFR23).
5. **Display visível** continua stub — é da **Story 4.9**. AC8 valida só o *envio*.
6. Registar resultado no Dev Agent Record da `4.8.story.md` → depois `@po *close-story 4.8`.

## §D — Pendente `@po`/`@pm` (não bloqueia)

- **AC5 recorrência DIFERIDA** — criar backlog "disparo de lembretes recorrentes server-side" (`runReminderRecurrenceEngine`, padrão `runFinanceRecurrenceEngine`), pós-Epic-4.

## §F — Doc fixes do CR Iter 2 (aplicar NO closure `@po *close-story 4.8` — Eurico autorizou Opção A)

CR Iter 2 (PR #55) deu 3 actionable + 2 nit, **0 CRITICAL**. Eurico escolheu **A** (merge as-is; corrigir os doc nits no closure, sem novo CR). No commit de close-story, corrigir em `4.8.story.md`:

| Linha | Fix |
|-------|-----|
| `:225` | "1 wiring client (`useReminders`)" → wiring é nos **handlers de `app/(app)/lembretes/page.tsx`** (alinhar com a correcção F1 do `@po`; o código já está correcto, é só o texto-resumo da "Decisão de entrada" que ficou stale) |
| `:138` | Verificar a referência `[GAP-4.2]` (CR sugeriu corrigir o identificador) — confirmar contra `EPIC-4.md §7` qual o GAP correcto da recorrência antes de alterar |
| `env.ts:32` (opcional) | `CRON_SECRET` min-length — hardening opcional; secret é server-provisioned (não input), dispatch já exige match exacto. Aplicar só se desejado. |

Estes são docs-only (não re-disparam CR no PR já merged). Bundle com status→Done + `git mv active→completed` + EPIC-4 8/10→9/10, **após AC8 passar**.

## §E — Pomodoro `fd7fbd12` (fluxo próprio)

Continua na branch partilhada `feat/nexus-v2-story-4.8-push-dispatch` (intacta) + tem story `pomodoro-custom-duration-alarm.story.md`. Tratar com gate + PR separados quando for prioridade. NÃO entrou no PR #55.

## Contexto herdado — NÃO reabrir

- Gate de saída (PASS) e decisão de entrada [GAP-4.6] (Opção A′) — na `4.8.story.md`.
- Infra 4.7 (PR #54 `25d1c780`) e 4.6 (PR #51 `d13a6067`) — só consumidas.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.8-PR-55-aberto-provisionamento-pos-merge.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: `03/06/2026`
