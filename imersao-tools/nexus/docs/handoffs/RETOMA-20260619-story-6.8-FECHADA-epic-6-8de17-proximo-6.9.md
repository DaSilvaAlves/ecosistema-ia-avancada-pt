# RETOMA — Story 6.8 (Classifier Gmail 4 buckets) FECHADA em `main`, Epic 6 8/17, próximo 6.9 (vista Gmail) ou 6.11 (Telegram)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "Pax (@po) — *close-story 6.8 (após /sdc 6.8 --push: PR #82 auto-merge squash 010f1db4)"
to_agent: "any — próximo terminal: @sm *draft 6.9 (vista Gmail) ou *draft 6.11 (Telegram, paralelo)"
created: "2026-06-19T00:00:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "@sm *draft 6.9 (vista Gmail no dashboard — consome os buckets classificados pela 6.8: só Importantes + Para responder hoje, resto oculto por defeito, FR66; múltiplos estados de render → react-component-test-criteria.md) OU *draft 6.11 (Telegram bot setup, paralelo — atenção GAP-6.4: decisão SDK Telegram + 2 criticals npm audit). A 6.8 desbloqueia 6.9 (vista) e 6.10 (tools cérebro Gmail)."
```

## Passo 0 (arranque em terminal novo)

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main && git pull --ff-only origin main
git rev-parse --short HEAD   # esperado: 15b11fa9 (close-story 6.8 docs-only) ou posterior; main sincronizado 0/0
```

**SHAs de referência da 6.8:** PR #82 squash em `main` = `010f1db4` (código da feature); commit de fecho docs-only @po = `15b11fa9` (story→`completed/`, EPIC-6 8/17, bookkeeping handoffs). Working tree limpa na app (`imersao-tools/nexus/v2/`) — restam apenas untracked fora-scope pré-existentes (PR-BODY-*.md, submódulos), que NÃO se committam.

## Resumo (1 parágrafo)

**Story 6.8 (Classifier Gmail, 4 buckets, FR64/FR65) FECHADA em `main`, waiver 0, Epic 6 a 8/17.** Ciclo `/sdc 6.8` completo: SM draft (8 AC, 5 `[GAP-6.8-*]`) → PO **GO 9/10** → Architect Gate de Entrada (Aria) **PASS-COM-CONDIÇÕES** (5 `[D-6.8-*]` + C1-C5; **REC-6.7-REFRESH-SCOPES waived** — `token-store.ts:405-415` já preserva `scopes`) → DEV (Dex) impl (`lib/google/gmail.ts` 96,38% + route Node `/api/google/gmail/classify` auth dual + MSW Gmail/Anthropic + 32 testes; vitest **2126**, +33; tsc 0; lint 0) → Architect Gate de Saída (Aria) **PASS High** (C1-C5 file:line; falsificabilidade genuína; flaky `oauth-status` isolado OK; 5xx→503) → CR `--base main` 2 iter → **0 findings finais** → **PR #82 auto-merge squash `010f1db4`** → close-story @po (Status→Done, `git mv` completed/, **EPIC-6 7/17→8/17**). **Sub-módulo Calendar COMPLETO 6/6; sub-módulo Gmail a 2/4 (6.7 OAuth scope + 6.8 classifier; falta 6.9 vista + 6.10 tools).**

## Decisões `[D-6.8-*]` ratificadas (NÃO reabrir)

| Decisão | Conteúdo |
|---------|----------|
| FORMAT | `messages.get?format=metadata&metadataHeaders=Subject,From,Date` (sem body, custo R4) |
| BATCH | `Promise.all` em lotes de ≤10 (`GET_BATCH_SIZE=10`) |
| AI-PROMPT | **Anthropic API DIRECTA server-side** no helper (NÃO o proxy Edge cookie-gated, para o cron 6.5 poder importar o helper sem forjar sessão); Zod `.strict()` `{importante,responder_hoje,pode_esperar,descartavel: msgId[]}`; AI não gera ids |
| CRON-INTEGRATION | route auth dual `getSession` OU `CRON_SECRET` Bearer timing-safe (`cron-auth.ts`); cron 6.5 integra por **import** do helper (story futura), não fetch HTTP; helper recebe `accessToken` por parâmetro |
| MODEL-CONST | `DEFAULT_CLASSIFIER_MODEL` (`claude-haiku-4-5-20251001`, `models.ts:18`); proibido literal sem snapshot |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.8-FECHADA-epic-6-8de17-proximo-6.9.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próximo passo (Eurico decide)

- **`@sm *draft 6.9`** (vista Gmail no dashboard, FR66) — consome os buckets classificados pela 6.8; vista só com Importantes + Para responder hoje (resto oculto por defeito); múltiplos estados de render (loading/empty/content/erro-OAuth) → `react-component-test-criteria.md`; executor `@ux-design-expert`, gate `@dev`. A 6.9 lê os resultados da cache KV / agregação dos buckets — a 6.8 é a source of truth.
- **Alternativa paralelizável:** `@sm *draft 6.11` (Telegram bot setup, FR69/FR70) — sub-módulo Telegram independente do Google; **atenção GAP-6.4** (decisão de SDK Telegram + 2 criticals `npm audit`).
- **6.10** (tools cérebro Gmail: `listar_emails_importantes`/`criar_draft_gmail`/`arquivar_email`) também desbloqueada pela 6.8, mas naturalmente depois da 6.9.

## Débitos / notas (não-bloqueantes, Baixa)

- **REC-6.8-FIDELITY-WEAK** — teste de fidelidade Gmail list (`gmail.test.ts:270-287`) afirma `total===1`; devia afirmar `classified===0`. Assert fraca, falsificabilidade real mantida.
- **REC-6.7-REFRESH-TEST** — herdado da 6.7; débito de teste de preservação `scopes` no refresh; WAIVER registado.
- **[DEV-6.8-MSW-CANONICAL]** — mock Anthropic vive no handler canónico `anthropic.ts` (first-match MSW), discriminado por `[NEXUS_GMAIL_CLASSIFIER]`.

## Acções operacionais do Eurico (não bloqueiam CI)

- **P1-Gmail** — activar **Gmail API** no Google Cloud Console (necessário para o classify real em produção; herdado da 6.7).
- **AC4 produção** (precisão ≥80% em 30 emails reais) — deferido a verificação manual pós-deploy, padrão AC13 da 4.9; resultado a registar no Change Log da 6.8.
- **Wiring cron 6.5 → classify 6.8** — fica para quando a 6.9 (UI/trigger) existir; a route + helper já estão prontos para import (`gmail: null` reservado em `cron/sync/route.ts:256`).

## Regras operacionais

`gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (submódulos sujos + untracked fora-scope); push exclusivo `@devops`; gate de saída CR `--base main`; hard-stop §8 (máx 2 iter CR; Iter 3 exige `Authorized-by:`); auto-merge só com `merge-authority.md` §1-6 verdes no head SHA.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.8-FECHADA-epic-6-8de17-proximo-6.9.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `19/06/2026`
