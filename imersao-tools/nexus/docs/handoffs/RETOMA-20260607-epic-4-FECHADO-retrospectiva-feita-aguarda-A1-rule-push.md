> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# RETOMA — Epic 4 FECHADO 10/10 + retrospectiva feita; aguarda regra A1 + push docs + decisão Epic 5

- **from_agent:** Orion (`@aiox-master`)
- **to_agent:** `@aiox-master` (escrever regra A1) → `@devops` (push docs-only) → Eurico + `@pm` (decidir Epic 5)
- **created:** 2026-06-07
- **status:** pending
- **Prioridade:** MÉDIA — Epic 4 está fechado e validado; isto é follow-up de qualidade + arranque do próximo epic

---

## Resumo de uma linha

O **Epic 4 (Hábitos/Metas/Lembretes/Web Push) está FECHADO 10/10 em `main` e validado em produção** (AC13 da 4.9 passou em Chrome+Edge, 07/06). A **retrospectiva já foi escrita** (`EPIC-4-retrospective.md`, ainda untracked/por committar) com 7 acções A1-A7. Falta: (1) `@aiox-master` escrever a **regra nova A1**, (2) `@devops` fazer **push docs-only** da retrospectiva + regra A1, (3) Eurico+`@pm` **decidir o Epic 5**.

---

## ESTADO GIT EXACTO (verificado 07/06, não assumido)

| Item | Valor |
|------|-------|
| Repo | `DaSilvaAlves/ecosistema-ia-avancada-pt` (gh precisa SEMPRE de `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`) |
| Branch | `main` |
| HEAD | `8e259987` (commit moreira por cima; o closure do Epic 4 está na história) |
| Closure Epic 4 | `852449c7` (story 4.9 → completed, EPIC-4 10/10) |
| Merge 4.9 | PR #58 squash `64a41445`; bookkeeping handoffs cherry-pick `58a52bd8` |
| **Retrospectiva** | `imersao-tools/nexus/docs/retrospectives/EPIC-4-retrospective.md` — **UNTRACKED (por committar)** |
| Working tree | muitos untracked pré-existentes na raiz e em `nexus/docs/` (PO-VALIDATION-*, PR-BODY-*) + submódulos `comunidade`/`starter-builder` sujos — **NÃO committar nada disso** |

**AVISO higiene:** trabalha num só terminal. NÃO `git add -A`/`git add .` (raiz tem `mega-brain/`, `my-project/`, etc.). NÃO `stash pop` cego. NÃO committar submódulos.

---

## Epic 4 — métricas da retrospectiva (verificadas em fontes reais)

| Métrica | Valor |
|---------|-------|
| Stories Done | 10/10 (4.1-4.10) |
| **Waiver rate** | **0% (0/10)** — melhor de sempre (iguala Epic 2) |
| Gate PASS à 1ª iter | 9/10 (só a 4.9 reabriu) |
| Iter 3+ por nitpicks teste/doc | 0 (vs 3/4 no Epic 3 — acção A1 do Epic 3 resultou) |
| Delta de testes | +395 (988 → 1383) |
| Duração | ~9 dias (o mais lento — Web Push território novo) |
| Débitos Média/Alta gerados | 0 |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/` — refere-se ao Nexus v2, localização correcta. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Acções A1-A7 da retrospectiva (owner + tipo)

| # | Acção | Owner | Tipo |
|---|-------|-------|------|
| **A1** | **Check no gate de coerência de contrato de estado interno distribuído por camadas** (análise de ciclo de vida: SW + endpoint + reconciliação). Resolve de raiz os 4 Major de snooze da 4.9 que os gates internos deixaram passar. Pax confirmou que NENHUMA das 5 regras existentes cobre isto → é **REGRA NOVA**. Aplica-se directamente ao Epic 6 (OAuth = mesmo padrão multi-camada). | `@aiox-master` | **NOVA REGRA** |
| **A2** | Varredura de bug-de-classe nas camadas adjacentes no mesmo ciclo (lição 4.2 `time` page↔modal) | `@dev`+`@qa` | reforço (processo) |
| **A3** | Mapear no draft a verificabilidade por AC (CI/preview/só-produção) quando há secrets só-de-produção (foi o que bateu no preview do PR #58 sem env vars) | `@sm`+`@po` | reforço de `not-tested-trailer-rules.md` |
| **A4** | Destino do backlog de débitos Baixa (4 finanças Epic 3 + 4 novos Epic 4 + D6) | `@pm`+`@po` | processo (backlog) |
| **A5** | Confirmar D7 (fallback intent PT-BR) — hotfix dedicado? | Eurico+`@devops` | processo (hotfix) |
| **A6** | Memory log Epic 4 — **JÁ FEITO** (`project_nexus_v2_epic_4.md` actualizado + `project_nexus_v2_epic_4_retrospective.md` criado por Pax + índice MEMORY.md) | — | feito |
| **A7** | Decidir próximo epic (PRD §9: 4→5→6) | Eurico+`@pm` | roadmap |

---

## next_action (sequência recomendada para o novo terminal)

**Passo 0 — contexto:** lê este handoff + `imersao-tools/nexus/docs/retrospectives/EPIC-4-retrospective.md` (a fonte completa) + memória `project_nexus_v2_epic_4_retrospective.md`.

**Passo 1 — `@aiox-master`: escrever a regra A1** em `.claude/rules/` (kebab-case, ex: `internal-state-contract-gate.md`). Conteúdo: quando uma story toca um **contrato de estado distribuído por ≥2 camadas** (ex: Service Worker + endpoint + reconciliação client; ou OAuth: callback + store + refresh), o quality gate (`@architect`/`@qa`) tem de fazer **análise de ciclo de vida do estado** — não só auth/estrutura. Verificar: o que acontece quando uma entrada é removida/expira entre camadas? cada camada distingue os sub-estados (ex: pending normal vs snoozed)? respostas de erro entre camadas são tratadas como falha? Origem: 4 Major de snooze da Story 4.9 (M1 silent loss, M2/M3 reconcile re-rotula normais, M4 SW ignora !response.ok) apanhados pelo CodeRabbit, não pelos gates internos. Complementa `mock-protocol-fidelity.md` (que só cobre protocolo EXTERNO). Aplicação universal; relevante em especial para Epic 6 (OAuth).

**Passo 2 — `@devops`: push docs-only** para `main`: `EPIC-4-retrospective.md` + a nova regra A1 (+ este handoff/INDEX se quiseres versionar o bookkeeping). add SELECTIVO (só esses ficheiros). Commit `docs(nexus-v2): retrospectiva Epic 4 + regra A1 (internal-state-contract-gate) [Epic 4]` com trailers. Push origin/main.

**Passo 3 — Eurico + `@pm`: decidir Epic 5** (A7). PRD §9 sugere ordem 4→5→6. `@pm *create-epic 5` quando o tema estiver decidido.

**Não-urgente (quando houver folga):** A4 (backlog débitos Baixa), A5 (D7 PT-BR fallback).

---

## Regras/contexto relevante
- Regras existentes (NÃO duplicar na A1): `.claude/rules/mock-protocol-fidelity.md`, `separation-of-roles.md`, `not-tested-trailer-rules.md`, `react-component-test-criteria.md`, `external-contract-identifiers.md`.
- Padrões consolidados Nexus v2: hard-stop CR §8 (máx 2 iter; Iter 3/merge-waived exigem autorização humana); `gh` precisa sempre de `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; merge squash + branch nova de main + cherry-pick para PRs de scope limpo.
- Memória: [[project_nexus_v2_epic_4]] (fechado 10/10), [[project_nexus_v2_producao]] (LIVE), [[project_nexus_v2_architecture]] (ADRs).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260607-epic-4-FECHADO-retrospectiva-feita-aguarda-A1-rule-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Orion (@aiox-master)`
DATA: `07/06/2026`
