# RETOMA — Story 6.8 (Classifier Gmail 4 buckets) GATES INTERNOS PASS, aguarda `/sdc 6.8 --push` (devops+CR+PR+merge+close)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc 6.8 (sessão 19/06/2026, SEM --push) — correu SM→PO→Architect Entrada→DEV→Architect Saída; parou antes do devops por não ter --push"
to_agent: "any — próximo terminal: @devops (Gage) via `/sdc 6.8 --push` OU continuar com `/sdc 6.11` (Telegram, paralelo)"
created: "2026-06-19T00:00:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-19T00:00:00Z"
consumed_by: "/sdc 6.8 --push (close-story @po Pax)"
project: nexus-v2
next_action: "/sdc 6.8 --push  — retomar SÓ a fase devops: CR `--base main` OBRIGATÓRIO (endpoint Node server-side: Gmail API + Anthropic directa — lição 5.11/feedback_cr_base_main_no_gate_saida) → PR → auto-merge se merge-authority §1-6 verdes no head SHA → @po *close-story 6.8 (Status→Done, git mv active→completed, EPIC-6 7/17→8/17). A story está em `Ready for Review` com ambos os Architect Gates (entrada+saída) PASS; código NÃO committed."
```

## Passo 0 (arranque em terminal novo)

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git status                 # confirma a working tree (ver aviso abaixo)
git rev-parse --short HEAD # esperado: 8cc36543 (close-story 6.7), main sincronizado 0/0
```

**AVISO CRÍTICO — código uncommitted na working tree:** os 6 ficheiros da 6.8 (ver File List) estão **modificados/criados em disco mas NÃO committed, NÃO staged, sem branch**. Num terminal novo NA MESMA MÁQUINA persistem em disco — confirma com `git status` que aparecem como modified/untracked. NÃO faças `git stash`, `git checkout .` nem `git reset --hard` (apagas o trabalho dos 5 gates). A fase devops (`/sdc 6.8 --push`) é que cria o branch `feat/nexus-v2-6.8-classifier-gmail` e faz o add **selectivo** (NUNCA `git add -A` — há submódulos sujos + untracked fora-scope).

Depois do Passo 0, correr directamente:

```
/sdc 6.8 --push
```

O pipeline retoma na fase devops porque a story está em `Ready for Review` com ambos os Architect Gates PASS (Status é a fonte de verdade, não a memória da sessão).

## Resumo (1 parágrafo)

Ciclo `/sdc 6.8` corrido sem `--push`: **SM** draft (8 AC, 6 tasks, 5 `[GAP-6.8-*]` deferidos) → **PO** Pax **GO 9/10** (10/10 pontos PASS; advisory [ADV-6.8-MODEL]) → **Architect Gate de Entrada** Aria **PASS-COM-CONDIÇÕES** (5 decisões `[D-6.8-*]` + C1-C5; REC-6.7-REFRESH-SCOPES **waived** — `token-store.ts:405-415` já preserva `scopes` no refresh) → **DEV** Dex impl (helper puro `lib/google/gmail.ts` 96,38% cobertura + route Node `/api/google/gmail/classify` + MSW Gmail/Anthropic + 32 testes; vitest +33 → run limpo 2121/2121; tsc 0; lint 0) → **Architect Gate de Saída** Aria **PASS High** (C1-C5 re-verificadas file:line; falsificabilidade genuína; flaky `oauth-status` confirmado isolado 1104ms, não-regressão; 5xx→503 anti-M4). Falta SÓ a fase devops (`--push`).

## Decisões `[D-6.8-*]` ratificadas (NÃO reabrir)

| Decisão | Conteúdo |
|---------|----------|
| FORMAT | `messages.get?format=metadata&metadataHeaders=Subject,From,Date` (sem body, custo R4) |
| BATCH | `Promise.all` em lotes de ≤10 (`GET_BATCH_SIZE=10`) |
| AI-PROMPT | **Anthropic API DIRECTA server-side** no helper (NÃO o proxy Edge cookie-gated); Zod `.strict()` `{importante,responder_hoje,pode_esperar,descartavel: msgId[]}`; AI não gera ids |
| CRON-INTEGRATION | route auth dual `getSession` OU `CRON_SECRET` (`cron-auth.ts`); cron 6.5 integra por **import** do helper, não fetch HTTP; helper recebe `accessToken` por parâmetro |
| MODEL-CONST | `DEFAULT_CLASSIFIER_MODEL` (`claude-haiku-4-5-20251001`, `models.ts:18`); proibido literal sem snapshot |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.8-GATES-PASS-aguarda-push.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Ficheiros entregues (File List — NÃO committed)

| Ficheiro | Acção |
|----------|-------|
| `v2/lib/google/gmail.ts` | NOVO — helper puro (leitura inbox + classificação AI + cache KV incremental) |
| `v2/app/api/google/gmail/classify/route.ts` | NOVO — route Node fina, auth dual |
| `v2/tests/unit/lib/google/gmail.test.ts` | NOVO — 20 testes |
| `v2/tests/unit/api/google/gmail-classify.test.ts` | NOVO — 12 testes |
| `v2/tests/mocks/handlers/google.ts` | EXPANDIR — Gmail `messages.list`/`get` + sentinelas 401/5xx |
| `v2/tests/mocks/handlers/anthropic.ts` | EXPANDIR — branch classifier (marcador `[NEXUS_GMAIL_CLASSIFIER]`) |
| `docs/stories/active/6.8.story.md` | secções dos 2 gates + T1-T5 + File List + Change Log v1.1, Status `Ready for Review` |

## Evidência dos gates internos

- `tsc --noEmit` EXIT 0 · `npm run lint` EXIT 0 (1 warning pré-existente fora-scope `logout/route.ts`) · vitest run limpo **2121/2121** (+33 vs baseline 6.7 2093); testes 6.8 = **32/32 PASS**.
- Cobertura `lib/google/gmail.ts` = **96,38% stmts / 92,75% branch / 100% funcs**.
- Flaky conhecido `oauth-status > sem sessão → 401` (timeout sob carga; isolado passa 1104ms; retros 6.6/6.7) — NÃO regressão, 6.8 não lhe toca.

## Débitos / notas (não-bloqueantes, Baixa)

- **REC-6.8-FIDELITY-WEAK** — teste de fidelidade Gmail list (`gmail.test.ts:270-287`) afirma `total===1`; devia afirmar `classified===0`. Assert fraca, falsificabilidade real mantida.
- **REC-6.7-REFRESH-TEST** — herdado; débito de teste de preservação `scopes` no refresh; WAIVER registado.
- **[DEV-6.8-MSW-CANONICAL]** — mock Anthropic vive no handler canónico `anthropic.ts` (first-match MSW), discriminado por `[NEXUS_GMAIL_CLASSIFIER]`.

## Acções operacionais do Eurico (herdadas da 6.7, não bloqueiam CI)

- **OP1** — cron-job.org a bater `/api/cron/sync` (`0 6 * * *` + Bearer `CRON_SECRET`, da 6.5). O wiring efectivo cron 6.5 → classify 6.8 fica para quando a 6.9 (UI/trigger) existir; a route já está pronta para import.
- **P1-Gmail** — activar **Gmail API** no Google Cloud Console (necessário para o classify real em produção).
- **AC4 produção** (precisão ≥80% em 30 emails reais) deferido a verificação manual pós-deploy — padrão AC13 da 4.9, não bloqueia merge.

## Scope respeitado

Zero vista 6.9, zero tools 6.10 (`lib/agent/tools/gmail.ts` não existe). A 6.8 desbloqueia ambas.

## Regras operacionais para o devops

`gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (submódulos sujos + untracked fora-scope); push exclusivo `@devops`; gate de saída CR `--base main` (não só `-t uncommitted`); hard-stop §8 (máx 2 iter CR; Iter 3 exige `Authorized-by:` do Eurico); auto-merge só com `merge-authority.md` §1-6 verdes no head SHA.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.8-GATES-PASS-aguarda-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `orquestrador /sdc 6.8`
DATA: `19/06/2026`
