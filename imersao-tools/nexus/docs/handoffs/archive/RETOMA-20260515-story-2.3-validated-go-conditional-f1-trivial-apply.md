# RETOMA — Story 2.3 VALIDATED (Pax → River, F1 trivial)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** Pax (`@po`) — PO validation `*validate-story-draft 2.3`
**To:** River (`@sm`)
**Data:** 15/05/2026
**Story:** 2.3 — Vista lista de tarefas (com secção dedicada de atrasadas)
**Branch:** N/A (Story 2.3 não tem branch própria ainda — vai criar em develop)
**Status story:** **Draft → Approved após F1**
**Veredicto Pax:** **GO conditional** · Score 9/10 · 10-point checklist (8 PASS + 2 PARTIAL mesma origem F1)
**4/4 [AUTO-DECISION] D1-D4:** **RATIFICADAS** (drag fora / tabs placeholder / overdue=startOfToday / kebab disabled)
**F-fix delegado:** **F1 trivial (~10 min) — alinhamento factual de hooks/repos da Story 2.1**
**Próxima acção:** River executa edições F1 sobre `2.3.story.md`, marca status `Approved`, cria handoff sm → ux-design-expert para develop após push da 2.2

---

## Resumo executivo

Story 2.3 validada por Pax com qualidade exemplar (scope guarding R1, layout previsibility R3, definição operacional D3 rigorosa). Único bloqueador é **alinhamento factual** — River afirmou que `useProjects`/`repos/projects.ts`/`repos/tags.ts` não existiam (viria em Stories 2.6/2.8), mas **todos existem em disco** (entregues pela Story 2.1 sob interpretação "Data Access Layer" que Pax ratificou no PO-VALIDATION-STORY-2.1.md).

F1 aplica 11 edições textuais simples em AC4, AC6, T3.3, T3.4, Dev Notes "Ficheiros relevantes" + "Anti-pattern detector" + "Não-inventar", Anti-padrões, Open Questions, Status e Change Log v0.2. **Sem alteração de scope.** Após F1 → status Draft → Approved sem nova validação Pax (é alinhamento factual, não mudança lógica).

---

## Acção concreta para `@sm` River

1. **Ler** `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.3.md` (documento de validação completo)
2. **Aplicar F1** — 11 edições textuais à story file `imersao-tools/nexus/docs/stories/2.3.story.md` (lista detalhada em §"F1 — Correcções triviais" do PO-VALIDATION). Estimativa: ~10 min.
3. **Alterar Status** linha 5 da story: `Draft` → `Approved`
4. **Adicionar Change Log v0.2** com nota de F1 + ratificação D1-D4 (texto sugerido pré-escrito no PO-VALIDATION ponto 11)
5. **Criar handoff de saída** `sm → ux-design-expert` para `*develop 2.3` (após push da 2.2 em main)
6. **Actualizar INDEX.md** — remover este handoff de pending, adicionar handoff sm → ux em pending, mover este para archive
7. **NÃO** voltar para Pax após F1 — é alinhamento factual, não exige nova validação

---

## Resumo das 11 edições F1 (referência rápida)

| # | Localização | Tipo | Resumo |
|---|-------------|------|--------|
| 1 | AC4 Select Projecto | Substituir | `db.projects.toArray()` directo → `useProjects()` de `@/hooks/useProjects` |
| 2 | AC4 Select Tag | Substituir | `db.tags.toArray()` directo → `useLiveQuery(() => listTags())` de `@/lib/db/repos/tags` |
| 3 | AC6 | Substituir | Atualizar lista de APIs canónicas; adicionar `useProjects` + `listTags` aos consumos permitidos; proibir `db.projects.*`/`db.tags.*` directos |
| 4 | T3.3 | Substituir | Carregar projectos via `useProjects()` (hook 2.1) |
| 5 | T3.4 | Substituir | Carregar tags via `useLiveQuery(() => listTags())` (repo 2.1); criar hook `useTags` se Uma quiser |
| 6 | Dev Notes — Ficheiros relevantes | Adicionar | 3 linhas: `useProjects.ts`, `repos/projects.ts`, `repos/tags.ts` |
| 7 | Dev Notes — Anti-pattern detector | Adicionar | Linha "Acesso directo a projects/tags" |
| 8 | Dev Notes — Não-inventar | Substituir | Bullet sobre repos `projects.ts`/`tags.ts` (corrigir afirmação errada) |
| 9 | Open Questions for PO | Adicionar | Nota de fecho no topo da secção: "Resolução Pax — Q1-Q4 fechadas como GO; D1-D4 ratificadas; ver PO-VALIDATION-STORY-2.3.md" |
| 10 | Anti-padrões | Adicionar | Bullet sobre `db.projects.*`/`db.tags.*` |
| 11 | Status + Change Log | Substituir + Adicionar | `Draft` → `Approved` + linha v0.2 no Change Log |

> **Texto exacto de cada edição** está no PO-VALIDATION-STORY-2.3.md §"F1 — Correcções triviais" pontos 1-11. River pode copy-paste directo.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-validated-go-conditional-f1-trivial-apply.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Ratificações D1-D4 (referência rápida)

| # | Decisão | Veredicto | Razão (resumo) |
|---|---------|-----------|----------------|
| D1 (Q2) | Sem drag em list | **RATIFICADA** | FR12 PRD §6.2 limita drag a Kanban/calendário; EPIC-2 §5 não inclui FR12 em 2.3; Constitution Artigo IV (No Invention) — spec linha 457 é orientação visual sem cobertura FR |
| D2 (Q1) | Tabs Kanban/Cal disabled | **RATIFICADA** | Spec §3.2 mostra 3 tabs no header; scaffold único agora vs. rearquitectura cosmética em 2.4/2.5; `aria-disabled` + tooltip é UX honesta |
| D3 (Q3) | Overdue=`< startOfToday()` | **RATIFICADA** | UX coerente para single-user pessoal; tarefa de hoje é "due today", não "overdue"; alternativa `< Date.now()` degradaria UX matinal |
| D4 (Q4) | Kebab Editar disabled | **RATIFICADA** | Edit modal exige TaskModal completo (spec §1.3); duplica scope com criação UI futura; D4 mantém estimativa 4-6h |

---

## Suggested Fixes (não-bloqueadores, Uma decide em develop)

| SF | Sugestão |
|----|----------|
| SF1 | Uniformizar tooltip "Disponível na Story 2.4" → "Em construção · Story 2.4" |
| SF2 | Verificar contraste row magenta-tint (AA ≥ 4.5:1) durante develop |
| SF3 | Desdobrar T8 (AC10) em T8a/T8b (confirm true/false) |

> SFs **não bloqueiam Approved**. River pode mencionar a Uma no handoff sm → ux ou Uma incorpora durante develop.

---

## Constraint de execução

- **F1 apply (River):** pode ocorrer agora — não depende de nada
- **`*develop 2.3` (Uma):** recomendado após push da Story 2.2 em main (`@devops *push` da branch `feature/2.2-migration-refactor` → PR → merge → squash em main)
- **Validação Pax:** já feita (este handoff) — paralelizou correctamente com push da 2.2

> **Razão da constraint:** Uma deve trabalhar sobre `main` limpo para evitar conflito de merge com 2.2 (que altera `lib/db/migrations/v1-to-v2.ts` + `tests/unit/db/`). Não é dura — Uma pode arrancar em paralelo aceitando rebase posterior, mas Pax recomenda esperar pela base limpa.

---

## Artefactos criados/modificados por Pax nesta sessão

- **Criado:** `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.3.md` (documento de validação completo: 10-point checklist + ratificações D1-D4 + F1 detalhado + SFs)
- **Criado:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-validated-go-conditional-f1-trivial-apply.md` (este ficheiro)
- **A modificar nesta sessão:** `imersao-tools/nexus/docs/handoffs/INDEX.md` — arquivar `drafted-ready-for-po-validation` + adicionar este handoff em pending
- **A arquivar pela Pax nesta sessão:** `RETOMA-20260515-story-2.3-drafted-ready-for-po-validation.md` → `archive/`

---

## Aderência a regras AIOX (auto-check Pax)

| Regra | Aderência |
|-------|-----------|
| `handoff-location.md` | PASS — handoff em `imersao-tools/nexus/docs/handoffs/`, 3 blocos obrigatórios presentes |
| `separation-of-roles.md` A6 | PASS — Pax validou (não escreveu código); não conflita com Uma (que vai executar) ou Dex (que vai fazer gate) |
| `not-tested-trailer-rules.md` A3 | PASS — story §"Not-Tested Evidence Gate" classifica como sem paths bloqueadores, com cláusula de activação |
| `mock-protocol-fidelity.md` A1 | PASS — N/A para esta story (sem mocks de protocolos externos); ratificado no PO-VALIDATION §10 |
| Constitution Artigo I (CLI First) | PASS — toda a validação via comando `*validate-story-draft`, próximo passo é F1 apply via Edit tool |
| Constitution Artigo II (Agent Authority) | PASS — Pax assina validação (autoridade exclusiva PO), delega F1 a River (SM autoridade de story file maintenance) |
| Constitution Artigo III (Story-Driven) | PASS — validação ocorre antes de develop, conforme Story Development Cycle |
| Constitution Artigo IV (No Invention) | PASS — F1 corrige afirmação factualmente errada de River; D1 ratificação reforça princípio (drag spec linha 457 sem FR contratual = invenção) |
| Constitution Artigo V (Quality First) | PASS — 10-point checklist + ratificação explícita + F1 + SFs documentados |
| Language Standards PT-PT | PASS — toda a validação em PT-PT; AC9 da story enforça PT-PT canónico |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-validated-go-conditional-f1-trivial-apply.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Pax (`@po`)
DATA: 15/05/2026

---

## Próxima acção

`@sm` River:

1. Aplica F1 (11 edições textuais sobre `2.3.story.md`, ~10 min) — referência exacta em `PO-VALIDATION-STORY-2.3.md` §"F1 — Correcções triviais"
2. Marca `Status: Draft → Approved`
3. Adiciona Change Log v0.2 com nota de F1 + ratificação D1-D4
4. Cria handoff `sm → ux-design-expert` para `*develop 2.3` (recomendado após push da 2.2 em main)
5. Actualiza INDEX.md

**Sequência projectada após F1:**

```
@sm apply-f1 2.3 (~10 min)
  → @ux-design-expert *develop 2.3 (após push 2.2 em main)
  → @dev *qa-gate 2.3 (A6 respeitada — gate é @dev, executor é Uma)
  → @po *close-story 2.3
  → @devops *push
```
