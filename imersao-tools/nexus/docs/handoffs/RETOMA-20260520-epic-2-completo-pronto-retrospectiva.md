# RETOMA — Epic 2 (Tarefas v2 + Projectos) COMPLETO 10/10 · pronto para retrospectiva

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Pax (`@po`) — `*close-story 2.7` + `*close-story 2.10` (fecho das duas últimas stories do Epic 2)
**Para:** Pax (`@po`) — `*retrospective epic-2` · OU Eurico — decisão de próximo epic
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** `status: pending`
**Branch:** `main` (todas as 10 stories merged)

---

## Sumário executivo

O Epic 2 — Tarefas v2 + Projectos — está **COMPLETO: 10/10 stories Done em main**. As duas últimas stories pendentes foram fechadas nesta sessão:

- **Story 2.7 — Motor de recorrência (FR10)** — MERGED via PR #28 squash `d977ade1` (2026-05-20T21:20:06Z). Architect Gate de implementação PASS (Aria). DoD 15/15 PASS. Débito D-2.7-1 registado.
- **Story 2.10 — Tools cérebro tarefas/projectos (FR15+FR32)** — MERGED via PR #29 squash `fbc337cb` (2026-05-20T21:35:03Z). Architect Gate de implementação PASS (Aria). DoD 15/15 PASS. Sem débito de código. Décima e última story do Epic 2.

Cobertura funcional integral do Epic 2: FR9-FR15 + FR29-FR32. Os 5 Epic ACs satisfeitos. Waiver rate final **0%** (alvo <20%). Padrão first-iter: 10/10 stories PASS no primeiro gate.

---

## O que foi feito nesta sessão (`*close-story` 2.7 + 2.10)

| Acção | Detalhe |
|-------|---------|
| Validação de evidência | Architect Gate de implementação PASS confirmado em ambas; MERGED confirmado via `git log` (`d977ade1`, `fbc337cb`) |
| DoD checklist 15 pontos | 15/15 PASS em cada story — secções `## PO Closure` presentes nos ficheiros das stories |
| `git mv` stories | `2.7.story.md` + `2.10.story.md` movidas de `stories/active/` → `stories/completed/` |
| `EPIC-2.md` actualizado | Cabeçalho 8/10→10/10 COMPLETO; §5 progresso + tabela estados (2.7, 2.10 → Done MERGED); §10 próximo passo reescrito; débito D-2.7-1 acrescentado à tabela §10; rodapé com linhas de closure 2.7 + 2.10 + secção "Fecho do Epic 2" |
| Commit local | Conventional commit com secção `Changes:` (regra `mandatory-change-log.md`). NÃO push — push é exclusivo do `@devops` |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## Estado do Epic 2 — métricas de fecho

| Métrica | Valor |
|---------|-------|
| Stories Done | 10/10 |
| Waiver rate | 0% (alvo <20%) |
| QA/Architect Gate PASS first-iter | 10/10 |
| ADRs locais | 1 (ADR-2.7-1 — não reabre os 5 ADRs base) |
| Débitos não-bloqueadores | 9 (D1-D7, M1, M2 — todos Baixa/Média, em `EPIC-2.md` §10) |

### Débitos acumulados para a retrospectiva (em `EPIC-2.md` §10)

| # | Item | Prioridade |
|---|------|-----------|
| D1 | Teste cenário JSON malformado migration v1→v2 | Baixa |
| D2 | `@dnd-kit/utilities` dep transitiva não declarada | Baixa |
| D3 | `PRIORITY_COLORS` duplicado (parcialmente resolvido na 2.9) | Baixa |
| D4 | Toast de erro primitivo no `KanbanBoard` | Baixa |
| D5 | E2E Playwright drag manual ponta-a-ponta | Baixa |
| D6 | Delete projecto com cascata `Task.projectId` | Média |
| D7 | Fallback de intent vazio em PT-BR no classifier (visível em produção) | Média |
| M1 | `aria-describedby` ausente no select status do `ProjectFormModal` | Baixa |
| M2 | Divergência label "Feita" vs "Concluídas" na vista projecto | Baixa |
| D-2.7-1 | Ligação do `RecurrenceFieldset` ao futuro formulário "+ Nova" de tarefa | Baixa |

> Nota: D6 e D7 (prioridade Média) são os candidatos mais fortes a uma story dedicada (sugestão recorrente nas closures: Story 2.11 técnica) ou a integração no início do próximo epic.

---

## Next action

1. **`@po` (Pax)** — `*retrospective epic-2`: retrospectiva de fecho do Epic 2. Capturar lições (waiver rate 0%, padrão first-iter consolidado em 10/10, ADR-2.7-1, os 9 débitos D1-D7/M1/M2/D-2.7-1). Produzir `imersao-tools/nexus/docs/retrospectives/EPIC-2-retrospective.md` com acções accionáveis e owners — padrão da retrospectiva Epic 1.
2. **Eurico** — decidir o próximo epic: Epic 3 (Finanças) ou Epic 4 (Hábitos + Metas + Lembretes). Ordem PRD §9: `2 || 3 → 4` — Epic 3 e Epic 4 são paralelizáveis. O Epic 4 reutiliza o motor de recorrência da Story 2.7 (`runRecurrenceEngine` genérico por `ownerType`).
3. **`@devops` (Gage)** — fazer push do commit de closure local desta sessão (bookkeeping docs-only: `EPIC-2.md` + `git mv` das 2 stories + este handoff + INDEX). Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-epic-2-completo-pronto-retrospectiva.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `20/05/2026`
