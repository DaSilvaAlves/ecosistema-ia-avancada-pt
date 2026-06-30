# RETOMA — Arranque Story 8.6 (cutover de produção OpenAI) — Epic 8 (5/6)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

## PROGRESSO (actualizado 30/06/2026 — Orion @aiox-master)

- **Draft 8.6 JÁ CRIADO** por @sm (River) em `docs/stories/active/8.6.story.md` (Status: Draft, 6 AC, story-draft-checklist READY). **NÃO repetir o `*draft 8.6`.**
- Conclusão do draft (D-8.6-SCOPE): a 8.6 NÃO toca código de produção — todo o código já está em `main` (8.1-8.4). Único artefacto a escrever = runbook `docs/runbooks/cutover-openai-rollback.md`. Cutover = flip de 2 flags na Vercel UI + redeploy.
- **PRÓXIMO PASSO PENDENTE: gate `@po *validate-story-draft 8.6`** — ficou por completar (limite de sessão da conta atingido 30/06, reset 03:40 Lisboa). Retomar daqui.
- Cadeia restante: @po gate → @dev/@qa runbook → @devops PR → cutover (Eurico autoriza + key na Vercel + @devops deploy).

## Passo 0 — arranque em terminal novo (LER PRIMEIRO)

**Porque este handoff existe:** a sessão anterior estava presa ao agente @devops (Gage), que só tem autoridade de push/PR/merge. Os comandos `@sm *draft 8.6`, `/sdc` e `/AIOX:agents:aiox-master` **não trocam de agente** dentro de uma sessão spawned de @devops. Para arrancar a 8.6 é preciso um terminal/sessão fresca.

**Acção imediata (terminal novo):**
1. Activar o agente de arranque: `/AIOX:agents:aiox-sm` (River) — ou `/AIOX:agents:aiox-master` (Orion) se quiseres orquestração ponta-a-ponta.
2. Correr `*draft 8.6`.
3. Seguir a cadeia: `@sm *draft 8.6` → gate `@po` → `@dev` implementa → `@qa` testa → `@devops` faz push/PR/merge.

## Estado actual (verificado 30/06/2026)

- `origin/main` = `1a995f5e` (Story 8.5 FECHADA, close-story pushed). Working tree limpo, sem PRs abertos.
- **Epic 8 em 5/6 Done.** 8.1 (`dec0b203`), 8.2 (`29ba4046`), 8.3 (`fc74ea89`), 8.4 (`839d0828`), 8.5 (`e082edf4`) todas em `main`. Waiver 0% em todas.
- **Resta só a 8.6 (cutover de produção) — desbloqueada** (parity 8.5 verde nos 6 cenários canónicos).

## Âmbito da 8.6 (ADR-10 §8 row S6 — NÃO inventar; fonte: `EPIC-8.md` linha 66 + `ADR-10`)

- `LLM_PROVIDER=openai` + `NEXT_PUBLIC_LLM_PROVIDER=openai` em produção.
- Smoke test com `OPENAI_API_KEY` real.
- Runbook de rollback (flip de volta para `anthropic`).
- Validação de key.
- Gate: **`@qa` + manual**; deploy por **`@devops`**.

## Pré-requisitos BLOQUEANTES do cutover (EPIC-8.md linhas 112-116)

1. **`OPENAI_API_KEY` real provisionada em produção (Vercel UI)** — necessária para o smoke test. **Pendente** — tem de estar feita antes do cutover. (Eurico + @devops.)
2. Parity 8.5 verde — JÁ CUMPRIDO (PR #99 `e082edf4`).

## Notas de risco (decisões já tomadas — não reabrir)

- A 8.6 é a **única story do Epic 8 com efeito em produção LIVE** (https://imersao.ia.expressia.pt).
- Produção está **sem cérebro** desde 25/06/2026 (saldo Anthropic esgotado, ADR-10 §1.2.3 — decisão Eurico de NÃO recarregar). O cutover é o que repõe o cérebro, agora via OpenAI.
- Default `LLM_PROVIDER=anthropic` garante zero regressão por construção; o cutover é o flip da flag.
- **O accionar do switch em produção é decisão explícita do Eurico** — verificação só-de-produção deferida (padrão AC13 da 4.9 / AC6 da 7.3).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. É a pasta correcta do projecto Nexus v2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Fonte da verdade

- `imersao-tools/nexus/docs/architecture/ADR-10-dual-provider-openai-migration.md` §8 row S6 (aceite em `main`, decisor Eurico — NÃO reabrir).
- `imersao-tools/nexus/docs/EPIC-8.md` (linhas 66, 78-81, 112-116, 144, 164).
- Story 8.5 fechada: `imersao-tools/nexus/docs/stories/completed/8.5.story.md`.

## Regras aplicáveis ao ciclo da 8.6

- `separation-of-roles.md` — executor ≠ gate (cutover: gate @qa + manual, deploy @devops).
- `merge-authority.md` — @devops faz merge quando as 6 condições verdes no head SHA; CR `--base main` server-side.
- `not-tested-trailer-rules.md` — a 8.6 toca config de produção/env vars → `Not-tested:` NÃO é waiver válido; exige evidência (smoke test).
- Hard-stop §8 — máx 2 iterações CR.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops` (Gage)
DATA: `30/06/2026`
