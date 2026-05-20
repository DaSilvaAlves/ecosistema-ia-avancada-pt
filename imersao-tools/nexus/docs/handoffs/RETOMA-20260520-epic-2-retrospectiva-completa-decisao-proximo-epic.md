# RETOMA — Epic 2 retrospectiva COMPLETA · decisão do próximo epic

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Pax (`@po`) — `*retrospective epic-2` (retrospectiva de fecho do Epic 2)
**Para:** Eurico — decisão do próximo epic · `@pm` (Morgan) — `*create-epic` · `@devops` (Gage) — push do commit de closure
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** `status: pending`
**Branch:** `main`

---

## Sumário executivo

A retrospectiva do Epic 2 está **COMPLETA**. Documento produzido em `imersao-tools/nexus/docs/retrospectives/EPIC-2-retrospective.md`, padrão da Retrospectiva Epic 1.

O Epic 2 fechou **10/10 stories Done**, **waiver rate 0%** (alvo da Retrospectiva Epic 1 era <20% — cumprido com folga; Epic 1 fechou com 50%), **quality gate PASS first-iter em 10/10 stories**. Duração ~6 dias (15/05 → 20/05). Suite de testes cresceu +239 testes (392 → 631). 1 ADR local (ADR-2.7-1), nenhum dos 5 ADRs base reaberto.

---

## O que foi feito nesta sessão (`*retrospective epic-2`)

| Acção | Detalhe |
|-------|---------|
| Leitura de fontes | `EPIC-2.md` íntegra, Retrospectiva Epic 1, 45+ handoffs `archive/` Epic 2, `git log` squash commits PRs #18-#29, Change Logs das 10 stories `completed/` |
| Retrospectiva criada | `retrospectives/EPIC-2-retrospective.md` — 10 secções: sumário, métricas, Loved, 9 débitos, Learned, Lacked, 6 acções accionáveis, comparação Epic 1 vs 2, próximas acções, convenções |
| Handoff de entrada consumido | `RETOMA-20260520-epic-2-completo-pronto-retrospectiva.md` marcado `consumed` + movido para `archive/` |
| INDEX actualizado | Entrada Pending substituída por esta; entrada consumida adicionada a Archived |
| Commit local | Conventional commit com secção `Changes:` (regra `mandatory-change-log.md`). NÃO push — exclusivo `@devops` |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## Lições principais da retrospectiva (top 5)

1. **Padrão first-iter consolidado** — 12 stories consecutivas QA Gate PASS à primeira (estendido a 2.7/2.10 no Architect Gate). O pipeline `@sm` draft → `@po` validate → executor está calibrado.
2. **Waiver rate 0%** — a acção A5 da Retrospectiva Epic 1 foi cumprida. Iterações CR (2.6, 2.7, 2.10) resolvidas com fixes reais, não com waiver de CHANGES_REQUESTED stale.
3. **Story 2.6 outlier** — única story com Iter 3 CR (excepcional, autorizada pelo Eurico após hard-stop §8). Mostra que stories de UI com a11y interactiva geram findings CR que o QA Gate não apanha → acção A1.
4. **Contaminação de contagem de testes** em worktrees paralelos (2.7/2.10) — o `@dev` reportou 616, o Architect Gate em worktree limpo obteve 588. A mitigação (gate em worktree isolado) funcionou → acção A2.
5. **Acções A1/A2/A6 da Retrospectiva Epic 1 efectivamente integradas** no processo do Epic 2 — o ciclo retrospectiva → regra → aplicação produz resultados mensuráveis.

## Débitos acumulados (9 — todos não-bloqueadores)

7 Baixa (D1, D2, D3, D4, D5, M1, M2, D-2.7-1 — 8 entradas, 7 distintas de severidade Baixa) + **2 Média**: **D6** (delete projecto com cascata `Task.projectId` — bloqueia gestão plena de projectos) e **D7** (fallback de intent vazio PT-BR no classifier — UX visível em produção). D6 e D7 são os candidatos fortes a story dedicada (sugestão recorrente "Story 2.11 técnica"). Tabela completa na §4 da retrospectiva.

## Acções accionáveis (6) — com owners

| # | Acção | Owner |
|---|-------|-------|
| A1 | Reforçar checklist a11y do QA Gate para stories de UI interactiva | `@qa` (Quinn) |
| A2 | Convenção: contagem `test:unit` identifica branch/worktree; gate reproduz em worktree limpo | `@sm` (River) |
| A3 | Avaliar D7 (fallback PT-BR) como hotfix ou story dedicada — UX em produção | Eurico + `@pm` (Morgan) |
| A4 | Decidir destino de D6 + D7 (Story 2.11 técnica ou arranque do próximo epic) | `@pm` (Morgan) + `@po` (Pax) |
| A5 | Memory log: actualizar `project_nexus_v2_producao.md` com Epic 2 = 10/10 | `@aiox-master` (Orion) ou Eurico |
| A6 | Decidir próximo epic (3 Finanças ou 4 Hábitos/Metas/Lembretes) | Eurico |

---

## Next action

1. **Eurico** — decidir o próximo epic. Ordem PRD §9: `2 || 3 → 4` — Epic 3 (Finanças) e Epic 4 (Hábitos + Metas + Lembretes) são paralelizáveis. O Epic 4 reutiliza o motor de recorrência da Story 2.7 (`runRecurrenceEngine` genérico por `ownerType`). Decidido o epic → `@pm *create-epic {N}`.
2. **`@pm` (Morgan) + `@po` (Pax)** — no arranque do próximo epic, executar acção A4: destino dos débitos Média D6 + D7 (Story 2.11 técnica que os agrupe, OU integração no novo epic).
3. **`@aiox-master` (Orion) ou Eurico** — executar acção A5: actualizar memória com Epic 2 = 10/10, waiver rate 0%, ref a esta retrospectiva.
4. **`@devops` (Gage)** — fazer push do commit de closure local desta sessão (bookkeeping docs-only: retrospectiva + handoff de entrada arquivado + este handoff + INDEX). Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-epic-2-retrospectiva-completa-decisao-proximo-epic.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `20/05/2026`
