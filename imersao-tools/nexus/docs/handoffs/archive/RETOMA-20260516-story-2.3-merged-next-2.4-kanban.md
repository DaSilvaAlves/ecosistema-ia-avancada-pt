# RETOMA — Story 2.3 MERGED em main · Next: Story 2.4 (Vista Kanban)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Sessão cross-agent (Gage `@devops` + Dex `@dev` + Uma `@ux-design-expert`)
**Para:** River (`@sm`) — qualquer terminal, qualquer sessão
**Data:** 2026-05-16
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED 2026-05-16 por River (`@sm`) — sessão `aiox-sm` cross-terminal.
**Consumido em:** 2026-05-16
**Consumido por:** River (`@sm`)
**Resultado da consumação:** Detectado conflito cross-terminal — Story 2.4 já existia em `imersao-tools/nexus/docs/stories/2.4.story.md` desde 15/05/2026 (Status Validated, score Pax 9.0/10 GO) e cobria já 10/10 dos pontos críticos listados abaixo. Aplicado **amendment v0.2** à story em vez de re-draft. 10 pontos críticos cross-checked vs ACs/Tasks/Dev Notes — zero invenção, todos rastreados. Mudanças do amendment v0.2: D1+D2 marcados RESOLVED, `formatDueDate` rota corrigida (`isOverdue.ts:140`), R1 confirmado BAIXO via `package.json`, Pax improvement #1 ratificada como já-resolvida pela Iter 1 da 2.3. Handoff de saída `RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md` criado para Uma (`@ux-design-expert`).

---

## Sumário executivo

Story 2.3 (vista lista de tarefas, UI primeira do Epic 2) **fechada em main** via PR #20 squash `667c1dac` + closure commit `3d97c212` (16/05/2026). Iter 3 do CR fix loop concluída com **Opção D aprovada explicitamente pelo Eurico** (hard-stop EPIC-2 §8 quebrado com audit trail).

Epic 2 agora **3/10 Done em main**. Próxima story desbloqueada: **2.4 — Vista Kanban**.

A próxima sessão arranca directamente em `@sm *draft 2.4`. Não há fix pendente, não há blocker, não há PR aberta. Tudo limpo.

---

## O que ficou em main

| Commit | Autor | Conteúdo |
|--------|-------|----------|
| `93aad6e2` | Uma (Iter 0) | Implementação inicial Story 2.3 (page.tsx + 6 components + 2 helpers + 2 testes) |
| `02367bfa` | Pax | Closure pré-merge (status Done, EPIC-2 actualizado) |
| `7c424a39` | Dex (Iter 1) | A4 (range validation `parseDueDateMs` named export) · A5 (`Math.round` DST) · N2 (MD040) · +15 tests |
| `c8852112` | Uma (Iter 1) | A1 (alert PT-PT) · A2 (WAI-ARIA arrow keys kebab) · A3 (`formatDueDate` consolidado) · N1 (INDEX) · Nit1 (+13 tests) |
| `500b35b0` | Dex (Iter 3) | A6 (`parseDueDateMs` fallback trunca para midnight local) · +8 tests |
| `60bb297b` | Uma (Iter 3) | N3 (4 fixes markdownlint story.md: MD040 fences + MD058 + pipe escape) |
| `667c1dac` | squash | Tudo acima como squash merge em main |
| `3d97c212` | Gage | Closure pós-merge: archive handoffs duplicados, EPIC-2 nota, INDEX actualizado |

**Tests totais nexus-v2 em main após 2.3:** 454/454 PASS.
**Branch `feature/2.3-vista-lista`:** eliminada (server + local).
**Vercel:** preview promovido a production no merge.

---

## Próxima acção concreta

```
@sm *draft 2.4
```

A Vista Kanban (Story 2.4) está documentada em `imersao-tools/nexus/docs/EPIC-2.md` §5. Pontos críticos que o River **DEVE** considerar no draft:

| # | Decisão / restrição | Trace |
|---|---------------------|-------|
| **1** | Partilha do header sticky com tabs Lista\|Kanban\|Calendário — Story 2.3 já entregou os tabs como placeholder; **2.4 ACTIVA a tab Kanban**. Refactor mínimo de `TasksHeader.tsx` (remover `disabled` + `aria-disabled="true"` + tooltip "Em construção · Story 2.4" da tab Kanban). | `2.3.story.md` AC2, R3, D2 |
| **2** | Drag-and-drop **autorizado** (FR12 do PRD — "entre colunas Kanban"). Story 2.3 explicitamente exclui drag em list (D1). Em Kanban, drag-and-drop é o **propósito principal** da vista. | PRD §6.2 FR12; `2.3.story.md` D1/R1 (drag list excluído) |
| **3** | `@dnd-kit/core` já está em `package.json` (Story 2.3 deixou-o instalado mas não importado — `grep "@dnd-kit"` em `app/(app)/tarefas` + `components/tarefas` retorna zero). Story 2.4 finalmente usa. | Dev Agent Record 2.3 §"Conformidade D1" |
| **4** | **Reusar `formatDueDate` + `isOverdue` + `daysOverdue`** de `lib/tarefas/isOverdue.ts` — não duplicar formatação. Uma consolidou na Iter 1. | `2.3.story.md` AC5 D3 + Change Log v0.7 |
| **5** | **Reusar `TaskKebabMenu`** já com WAI-ARIA arrow-key navigation (Uma Iter 1). Pode ser preciso adicionar acção "Mover para coluna X" no kebab — extensão, não refactor. | `2.3.story.md` AC5 col 8 + Iter 1 fix A2 |
| **6** | **Arrow-key navigation no tab strip** (PA4 da Story 2.3 closure) — agora que Kanban está activa, há 2 tabs activas (Lista + Kanban), pattern WAI-ARIA arrow keys entre tabs faz sentido. Pode ser absorvido em 2.4. | `2.3.story.md` PO Closure PA4 |
| **7** | Coverage threshold: AC12 da 2.3 foi 70% lines (relaxado vs 80%). Para 2.4 manter 70% lines + thresholds globais inalterados em `vitest.config.ts` (apenas allowlist `include` expandida, precedente Story 1.9 + 2.3 consolidado). | `2.3.story.md` AC12 + Dev Agent Record §"SF8" |
| **8** | **Separação A6 mantida** — para 2.4, executor `@ux-design-expert` (Uma) e quality gate `@dev` (Dex), padrão idêntico ao 2.3. Story file: pôr `executor: "@ux-design-expert"` + `quality_gate: "@dev"` no Executor Assignment. | `separation-of-roles.md` A6 + `2.3.story.md` Executor Assignment |
| **9** | **Mock-protocol-fidelity A1**: 2.4 também sem mocks de protocolos externos (UI puro + Dexie via repos da Story 2.1). N/A formal a registar na story file. | `mock-protocol-fidelity.md` A1 |
| **10** | **Not-Tested Trailer Rules A3**: 2.4 toca `app/(app)/tarefas/` + `components/tarefas/` + `tests/unit/` — paths não-bloqueadores. Adicionar allowlist em `vitest.config.ts` se criar novos paths (precedente 2.3). | `not-tested-trailer-rules.md` A3 + `2.3.story.md` AC12 |

---

## Lições críticas da Story 2.3 (para 2.4 e seguintes)

| Lição | Aplicabilidade Stories 2.4-2.10 |
|-------|------------------------------------|
| **L1 — `parseDueDateMs` + `formatDueDate` consolidados em `lib/tarefas/isOverdue.ts`** | Toda story que toca dates (2.4 Kanban, 2.5 Calendar, 2.9 vista projecto) reusa o helper. Não duplicar formatação. |
| **L2 — Kebab menu primitivo com WAI-ARIA completo (arrow keys, focus mgmt)** | Reusar em Stories 2.6 (tags), 2.8 (projects), 5.x (journal). Zero `@radix-ui` dependency. |
| **L3 — Allowlist `vitest.config.ts coverage.include` por path** | Precedente Story 1.9 + 2.3 consolidado. Toda UI feature Epic 2-6 adiciona paths sem alterar thresholds globais. |
| **L4 — useTasks/useProjects/useLiveQuery com primitivas, não objectos recriados** | Padrão crítico para 2.4 Kanban (useTasks com filter por status para popular colunas), 2.5 Calendar, 2.9 vista projecto. |
| **L5 — CR fix loop pode chegar a Iter 3 com aprovação Eurico** | Quando Iter 2 traz Major novo (não doc-nit), Opção D vale a pena. Padrão estabelecido nesta story. |
| **L6 — Padrão `gh pr merge --admin --squash` para waiver doc-nits** | Consolidado em 7 stories consecutivas (1.5 → 2.3). CR status check head SHA SUCCESS é autoridade canónica. |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA — coincide com pasta do projecto. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Estado dos artefactos

| Artefacto | Path | Estado |
|-----------|------|--------|
| EPIC-2 | `imersao-tools/nexus/docs/EPIC-2.md` | 3/10 Done (2.1 + 2.2 + 2.3). §10 próximo passo `@sm *draft 2.4` |
| Story 2.3 | `imersao-tools/nexus/docs/stories/completed/2.3.story.md` | Status `Done (CLOSED 16/05/2026 after CR Iter 3 Opção D approved by Eurico)` |
| Story 2.4 | `imersao-tools/nexus/docs/stories/` | **Não existe ainda** — `@sm *draft 2.4` cria |
| INDEX nexus | `imersao-tools/nexus/docs/handoffs/INDEX.md` | Pending vazio antes deste handoff |
| INDEX central | `docs/HANDOFF-INDEX.md` | Linha do Gage (consumido) já registada; este handoff adiciona pending |
| PRD | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | FR11/FR12 para Kanban — drag-and-drop entre colunas autorizado |
| Front-end spec | `imersao-tools/nexus/docs/front-end-spec-v2.md` | §3.2 Kanban — verificar linhas exactas no draft |
| Architecture | `imersao-tools/nexus/docs/architecture-v2.md` | 5 ADRs intactos — não reabrir |
| Vercel production | https://imersao.ia.expressia.pt | LIVE com Story 2.3 mergeada |
| package.json deps | `imersao-tools/nexus/v2/package.json` | `@dnd-kit/core` já instalado (Story 2.3 deixou pronto, não importou) |

---

## Handoffs relacionados (arquivados)

| Handoff | Para que serve agora |
|---------|----------------------|
| `archive/RETOMA-20260515-story-2.3-closed-ready-for-devops-push.md` | Estado pré-CR Iter 1 — contexto inicial Story 2.3 |
| `archive/RETOMA-20260516-story-2.3-pr-20-cr-iter1-fix-loop-uma-dex.md` | Briefing Gage para Dex+Uma Iter 1 + decisão arquitectural `formatDueDate` |
| `archive/RETOMA-20260512-epic-1-retrospective-complete.md` | 5 acções A1-A6 da retrospectiva Epic 1 (mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles, etc.) — todas estas regras já em vigor para Epic 2 |

---

## Cenários para a próxima sessão

**Cenário A — Eurico abre nova sessão e diz "vamos avançar"**
→ Próxima acção: `@sm *draft 2.4`. River lê este handoff + EPIC-2 §5 + PRD FR11/FR12 + front-end-spec §3.2 Kanban. Cria `2.4.story.md` em Draft.

**Cenário B — Eurico abre sessão noutro terminal**
→ Agente activo lê `docs/HANDOFF-INDEX.md` (regra obrigatória `handoff-central.md` na activação), encontra este handoff pending, abre, prossegue para `@sm *draft 2.4`.

**Cenário C — Eurico quer rever a Story 2.3 antes de avançar**
→ Story 2.3 vive em `imersao-tools/nexus/docs/stories/completed/2.3.story.md` com Dev Agent Record + QA Results + PO Closure + Change Logs v0.1-v0.9 completos. Audit trail PR #20: `gh pr view 20 --repo DaSilvaAlves/ecosistema-ia-avancada-pt`.

**Cenário D — Bug encontrado em produção (Vercel) relacionado com Story 2.3**
→ Sigir SOP `docs/sops/hotfix-producao.md`. Padrão: hotfix branch + fix + PR rápido. Não bloqueia Story 2.4.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Claude Code main (orquestração cross-agent Gage + Dex + Uma)
DATA: 16/05/2026
