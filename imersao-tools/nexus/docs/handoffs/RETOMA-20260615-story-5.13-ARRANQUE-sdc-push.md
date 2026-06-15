# RETOMA — ARRANQUE Story 5.13 (Tools cérebro — 9 tools no Tool Registry, FR46/FR50/FR57) — correr /sdc 5.13 --push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc 5.12 --push — sessão que fechou a Story 5.12"
to_agent: "any — próximo terminal corre /sdc 5.13 --push (ÚLTIMA story do Epic 5)"
created: "2026-06-15T21:50:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "/sdc 5.13 --push"
```

## Summary

O Epic 5 está a **12/13** (Conhecimento 4/5). A Story 5.12 (Cérebro pesquisa web e cria nota, FR56) foi fechada em `main` nesta sessão (merge squash `aa385a04` PR #73, fecho docs-only `8f11220e`). **Próximo e ÚLTIMO passo do Epic 5: `/sdc 5.13 --push`** — a Story 5.13 (Tools cérebro). Ao fechar a 5.13, o Epic 5 fica 13/13 e o sub-módulo Conhecimento 5/5.

`main` / `origin/main` sincronizados em **`8f11220e`**. A Story 5.13 ainda NÃO existe (criada pela Fase 1 SM do `/sdc`).

## Git p/ arrancar (primeiro comando no terminal novo)

```bash
git checkout main && git pull --ff-only origin main   # HEAD esperado: 8f11220e (ou mais recente)
```
- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- NUNCA `git add -A` (muitos untracked fora-scope: PO-VALIDATION-*, PR-BODY-*, `.claude/agent-memory/` órfão). Add SELECTIVO sempre.
- Código Nexus v2 em `imersao-tools/nexus/v2/` — TODOS os gates (lint/typecheck/vitest/build) correm DENTRO dessa pasta. Baseline vitest actual: **1849 testes**.

## O que é a Story 5.13 (FR46 + FR50 + FR57) — EPIC-5.md §5 linha 94, §6 linhas 53/62/74, §4, §7 GAP-5.5

Registar as **9 tools no Tool Registry** (nomes ASCII, JÁ validados no §4 do epic contra `TOOL_NAME_PATTERN` — não precisa de reconciliação de AC):
`criar_entrada_diario`, `consultar_diario`, `pesquisar_diario`, `brain_dump`, `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota`.

- **executor `@dev`, gate `@architect`** (entrada + saída — território de risco: registo de tools + domínio do classifier + Edge-safety). Recomendado **Architect Gate de ENTRADA** (precedente 5.7/5.8/5.11/5.12).
- **Reutiliza, NÃO reinventa:**
  - A lógica client-side da **5.12** (`lib/conhecimento/web-search-create.ts` — `proposeWebSearchCreate`/`persistProposal`) é o que a tool `pesquisar_web_e_criar_nota` orquestra. Decisão `[D-5.12-SCOPE-vs-5.13]`=Opção C deixou o REGISTO da tool explicitamente para a 5.13.
  - Os CRUDs da 5.3 (diário) e 5.9 (conhecimento) e a pesquisa 5.5/5.10/5.11.
  - Precedente de registo de tools: 2.10 (`tasks`/`projects`), 3.11 (`finance`), 4.10 (`habits`, D-DOMAIN Opção A — agrupou 3 áreas num domínio porque o classifier já as agrupava). Módulos Edge-safe: sem import client/repos, usar `ctx.db` (como na 4.10).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Pontos de atenção para o draft (@sm) e o Architect Gate de entrada (@architect)

1. **`[GAP-5.5]` — domínio das tools (resolver no gate de entrada):** as 9 tools usam um novo `ToolDomain` (`knowledge`? `journal`?) ou agrupam-se como a 4.10 fez (D-DOMAIN Opção A)? **Verificar em código** como o classifier do Epic 1 agrupa diário/brain-dump/conhecimento — NÃO assumir. Marca `[D-5.13-DOMAIN]`.
2. **`[D-5.8-CHAT-RETRO]` é entregue aqui** — foi diferida da 5.8 para a 5.13. Recuperar o contexto da decisão na story 5.8 (em `completed/5.8.story.md`) e no `EPIC-5.md`.
3. **Edge-safety (ADR-1):** as tools correm no executor — módulos sem import client/repos, usar `ctx.db` (lição 4.10 e bug do cérebro ADR-9). Confirmar como `pesquisar_web_e_criar_nota` invoca a lógica client-side da 5.12 a partir do executor (a 5.12 é client-side puro — a tool tem de orquestrar de forma Edge-safe, possivelmente via o mesmo endpoint/preview).
4. **`external-contract-identifiers.md`:** nomes já ASCII (§4 do epic) — confirmar no draft, não deve haver reconciliação.
5. **`internal-state-contract-gate.md`** aplica-se a `pesquisar_web_e_criar_nota` (estado distribuído + fetch externo, já analisado na 5.12 — reaproveitar a análise dos 3 eixos).
6. **A3 Epic 4 — mapa de verificabilidade por AC:** tools que dependem de fetch externo / Anthropic podem exigir verificação manual em preview/produção.

## LIÇÃO DE PROCESSO CRÍTICA (5.11, aplicar na 5.13)

O **gate de saída `@architect` TEM de correr CodeRabbit `--base main`** (diff completo do branch vs main), NÃO só `-t uncommitted`. Na 5.12 o CLI Free deu `TRPCClientError` (rate-limit) e foi o **CR App no PR** que cobriu a salvaguarda server-side — confiar no CR App no head SHA do PR como condição de merge (`merge-authority.md` cond.2). Memória: [[feedback-cr-base-main-no-gate-saida]].

## Regras /sdc + merge a relembrar

- **Gate da 5.13 é `@architect`** (entrada + saída), não `@qa`. Separation-of-roles: o `@architect` que faz o gate não implementa.
- **Hard-stop §8:** máx 2 iterações CR; **Iter 3+ ou merge waived exigem autorização humana explícita** do Eurico (trailer `Authorized-by: Eurico`). Não assumir — pedir.
- **merge-authority.md:** o agente (`@devops`) faz o merge quando as 6 condições estão verdes no head SHA. `reviewDecision: CHANGES_REQUESTED` frequentemente é stale — verificar pelo head SHA, usar `--admin --squash --delete-branch` se o head estiver limpo. NUNCA pedir merge manual ao Eurico ([[feedback_no_manual_merge_eurico]]).
- Sem `--push` o pipeline pára antes do devops; **este arranque é com `--push`** (até ao merge + close-story → Epic 5 13/13).

## Ao fechar a 5.13 — Epic 5 COMPLETO

Depois do merge + `@po *close-story 5.13` (Epic 5 12/13 → **13/13**), o passo natural é `@po *retrospective epic-5` (precedente Epics 1/3/4) e depois Eurico + `@pm` decidem o Epic 6 (PRD §9: 5→6, OAuth/integrações — onde `internal-state-contract-gate.md` é especialmente relevante).

## Débitos herdados (não-bloqueadores — NÃO resolver na 5.13 sem decisão)

- **REC-SSRF-2** (5.11): eliminar o fetch HTTP interno do endpoint web-search ao proxy Edge — invocar a lógica do proxy directamente (sem reenvio de cookie). Destino arquitectural, pós-Epic 5.
- **FLAG env Vercel** (5.11): confirmar que `VERCEL_PROJECT_PRODUCTION_URL` está exposta ao runtime Node em produção.
- **OBS-5.10-A2:** `.then()` sem `.catch()` no useEffect de pesquisa em `app/(app)/diario/page.tsx` (da 5.5, já merged).
- Limpeza do `.claude/agent-memory/` órfão untracked em `imersao-tools/nexus/docs/`.

## Fonte de verdade viva

`imersao-tools/nexus/docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md` (checkboxes P0/P1/P2). Memória `nexus-v2-roadmap-conclusao` actualizada com 5.12 Done. Handoff de fecho da 5.12 em `handoffs/archive/`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260615-story-5.13-ARRANQUE-sdc-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `orquestrador /sdc (Claude Code)`
DATA: `15/06/2026`
