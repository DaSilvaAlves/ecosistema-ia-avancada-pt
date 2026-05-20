# PO Validation — Story 3.1 (Schema finanças — Data Access Layer Dexie v3)

**Validador:** Pax (`@po`)
**Data:** 2026-05-21
**Story:** `imersao-tools/nexus/docs/stories/active/3.1.story.md` v1.0 (340 linhas)
**Task executada:** `.aiox-core/development/tasks/validate-next-story.md` (10-point checklist + executor assignment + anti-hallucination + CodeRabbit integration)
**Decisão final:** **GO** — score **9,5/10**, Implementation Readiness 10/10, Confidence **High**. Status: `Draft → Approved`.
**Modalidade:** GO directo. Um único finding F1 (erro aritmético trivial em Dev Notes L256) corrigido inline durante a aplicação desta validação — não bloqueia, não exige nova iteração de `@sm`.

---

## 0. Sumário executivo

A Story 3.1 é a story de fundação do Epic 3 (Finanças) e bloqueia as 10 stories seguintes (3.2-3.11). É a terceira story de schema do Nexus v2 (depois de 1.1 e 2.1) e replica fielmente o padrão maduro da Story 2.1 — que fechou 10/10 com 0 qa-loop-fix. A validação cruzou **todos** os claims anti-hallucination directamente contra o código real (`client.ts`, `types/db.ts`, `schemas.ts`, `repos/recurrences.ts`) e contra o PRD §6.3/§10.

**Resultado:** GO com confiança alta. O [GAP-3.1] está definitivamente resolvido com evidência de código verificada de forma independente por esta validação. Os 3 [AUTO-DECISIONS] são ratificados (A1 e A2 firmes; A3 ratificado com nota de gate). Um único finding trivial (F1 — erro de aritmética numa Dev Note descritiva) foi corrigido inline.

---

## 1. Verificação anti-hallucination — claims cruzados com código real

> Constitution Artigo IV (No Invention). Cada claim factual da story foi verificado abrindo o ficheiro real. Esta é a dimensão mais crítica numa story de schema de fundação.

| # | Claim da story | Verificação independente `@po` | Veredicto |
|---|----------------|-------------------------------|-----------|
| C1 | `transactions` já existe em `version(1)` com índices `id, accountId, cardId, category, date, recurrenceId, [accountId+date]` | `client.ts:54` — `transactions: 'id, accountId, cardId, category, date, recurrenceId, [accountId+date]'` — **idêntico, literal** | CONFIRMADO |
| C2 | `recurrences` já existe em `version(2)` com `ownerType` incluindo `'transaction'` | `client.ts:77` — `recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]'`; `types/db.ts:84` — `ownerType: 'task' \| 'transaction' \| 'habit' \| 'reminder'` | CONFIRMADO |
| C3 | Interfaces `Account`, `Card`, `Transaction`, `Installment`, `Category` já existem em `types/db.ts:98-143` | `types/db.ts:98-142` — as 5 interfaces existem no bloco "Epic 3 — Finanças". (Range exacto é 98-142, story diz 98-143 — off-by-one inofensivo, a interface `Category` fecha na L142.) | CONFIRMADO |
| C4 | `client.ts:28` antecipa explicitamente "Epic 3 incrementa para version 3 (accounts, cards, installments, categories)" | `client.ts:28` — texto literal idêntico | CONFIRMADO |
| C5 | `version(1)` e `version(2)` são os únicos blocos `.version()` actuais; próximo é `version(3)` | `client.ts:51` (`version(1)`) e `client.ts:76` (`version(2)`) — apenas esses dois | CONFIRMADO |
| C6 | `Transaction.amount` é cêntimos, negativo=saída/positivo=entrada | `types/db.ts:117` — `amount: number; // cêntimos. Negativo = saída, positivo = entrada` | CONFIRMADO |
| C7 | `Transaction.category` é `string` (nome directo, não id) | `types/db.ts:118` — `category: string;` | CONFIRMADO |
| C8 | `Category` tem `name`, `color`, `icon`, `isDefault` (sem campo `id`) | `types/db.ts:137-142` — `interface Category { name; color; icon; isDefault; }` — **sem `id`** | CONFIRMADO |
| C9 | `Account.type` é enum `'checking' \| 'savings' \| 'cash'` | `types/db.ts:101` — exacto | CONFIRMADO |
| C10 | `lib/db/schemas.ts` existe e contém Task/Project/Recurrence/Tag — a story "estende" | `v2/lib/db/schemas.ts` existe (98 linhas, 4 schemas Zod). "Estender" é a operação correcta | CONFIRMADO |
| C11 | `repos/recurrences.ts` (Story 2.1) é genérico por `ownerType` — a Story 3.4 reutiliza com `ownerType: 'transaction'` | `repos/recurrences.ts:39-48` — `getRecurrenceByOwner(ownerType: RecurrenceOwnerType, ownerId)`; `RecurrenceOwnerType` inclui `'transaction'` (`schemas.ts:71-76`, 87) | CONFIRMADO |
| C12 | PRD §6.3 define FR16-FR23 (8 FRs de Finanças) | `PRD-NEXUS-V2.md:142-149` — FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23 todos presentes e citados literalmente | CONFIRMADO |
| C13 | PRD §10 Epic 3 lista Story 3.1 com schema `accounts, cards, transactions, recurrences, installments, categories` | `PRD-NEXUS-V2.md:467` — "3.1 Schema `accounts`, `cards`, `transactions`, `recurrences`, `installments`, `categories`" — exacto | CONFIRMADO |
| C14 | Padrão `NexusDBV1Only` da Story 2.1 é o gold standard de honest mock para schema increment | `2.1.story.md` AC13 + QA Results AC13 + Lição #1 PO Closure — confirmado; AC15 da 3.1 replica como `NexusDBV2Only` | CONFIRMADO |

**Discrepância única detectada — F1 (trivial, corrigida inline):**

| Finding | Localização | Problema | Correcção aplicada |
|---------|-------------|----------|--------------------|
| F1 | `3.1.story.md` Dev Notes, secção `NexusDBV2Only` (L256) | A Dev Note descritiva diz: *"total de tabelas: 19 (15 de v1 + 2 de v2 + 4 de v3 = 21... confirmar contagem exacta no código)"*. A aritmética está confusa e contraditória — afirma "19" e depois "= 21". O número correcto: o schema-upgrade test da Story 2.1 (`schema-upgrade.test.ts:174-179`) confirma **15 tabelas em `version(2)`** (13 de `version(1)` + 2 de `version(2)`). Logo `version(3)` = **15 + 4 = 19 tabelas**. | Dev Note corrigida para o número firme **19 tabelas** (15 em `version(2)` + 4 novas em `version(3)`), com trace ao `schema-upgrade.test.ts` da Story 2.1. Removida a expressão contraditória "= 21" e o "confirmar contagem". |

> **Classificação do F1:** trivial e descritivo. Vive numa Dev Note de orientação, não num AC nem em código. Não altera scope, não altera nenhum AC, não toca caminho bloqueador. Corrigido inline nesta sessão de validação (`@po` aplica directamente, sem nova iteração de `@sm`) — coerente com o precedente Story 2.6 §3 (discovery minor C1 ajustado inline). O AC15 da story já pede ao executor "confirmar contagem exacta no código", pelo que mesmo sem esta correcção o erro seria apanhado — a correcção apenas remove ambiguidade upfront.

**Conclusão da dimensão:** 14/14 claims factuais confirmados em código. Uma única discrepância, trivial e descritiva, corrigida inline. Zero invenção detectada. Cada AC traça a FR/arquitectura/código verificado.

---

## 2. Resolução definitiva do [GAP-3.1]

**Pergunta original (`EPIC-3.md` §7):** a tabela `recurrences` da Story 2.1 é genérica por `ownerType` e reutilizável para finanças recorrentes (FR17), ou precisa de extensão de schema / tabela nova?

**Verificação independente `@po` (não delegada — código aberto directamente):**

| Evidência | Ficheiro:linha | Conteúdo |
|-----------|----------------|----------|
| E1 — literal do enum | `imersao-tools/nexus/v2/types/db.ts:84` | `ownerType: 'task' \| 'transaction' \| 'habit' \| 'reminder';` — o literal `'transaction'` **já existe** na interface `Recurrence` |
| E2 — tabela no schema | `imersao-tools/nexus/v2/lib/db/client.ts:77` | `recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]'` — tabela presente em `version(2)`, com índice composto que serve lookup por owner |
| E3 — schema Zod | `imersao-tools/nexus/v2/lib/db/schemas.ts:71-76, 87` | `RecurrenceOwnerTypeSchema = z.enum(['task', 'transaction', 'habit', 'reminder'])` — validação Zod já aceita `'transaction'` |
| E4 — repo genérico | `imersao-tools/nexus/v2/lib/db/repos/recurrences.ts:39-48` | `getRecurrenceByOwner(ownerType: RecurrenceOwnerType, ownerId)` — função de lookup é genérica por `ownerType`, não tem nada específico de tarefas. Comentário do ficheiro (L7-8) declara explicitamente "Tabela genérica partilhada entre Epics 2/3/4" |
| E5 — intenção de design | `client.ts:67-71` (comentário Story 2.1) | "recurrences: tabela genérica reutilizada por tasks/transactions/habits/reminders" — o desenho foi intencional desde a Story 2.1 |

**VEREDICTO `@po`: [GAP-3.1] DEFINITIVAMENTE RESOLVIDO. A conclusão do River está correcta — confirmada de forma independente.**

A tabela `recurrences` é **reutilizável sem qualquer extensão de schema** para finanças recorrentes. A Story 3.1:
- **NÃO** cria uma tabela `recurrences` separada para finanças — correcto.
- **NÃO** cria `transaction_recurrences` nem variante alguma — correcto.
- A Story 3.4 (CRUD recorrências financeiras) consumirá `repos/recurrences.ts` da Story 2.1 com `ownerType: 'transaction'` — correcto.

A reconciliação R1 da story e os anti-padrões #3 e #4 reflectem esta resolução fielmente. Nenhuma escalação a `@architect` é necessária para o [GAP-3.1] — está fechado com evidência de código. O risco R2 do `EPIC-3.md` (probabilidade Média, "recurrences pode não ser genérica o suficiente") fica **mitigado e fechado** por esta verificação.

---

## 3. Ratificação dos 3 [AUTO-DECISIONS]

### A1 — `version(3)` é o número correcto de versão Dexie

**Decisão `@sm`:** `version(3)`.
**Verificação `@po`:** `client.ts:51` tem `version(1)`, `client.ts:76` tem `version(2)` — não existe nenhum outro bloco `.version()`. `client.ts:28` antecipa explicitamente `version(3)` para o Epic 3.
**VEREDICTO: RATIFICADO — firme.** Decisão correcta, baseada em código verificado. Não requer escalação. Coerente com o padrão aditivo Dexie (cada Epic incrementa `version(N+1)` sem reescrever os anteriores).

### A2 — Helper `formatCurrency` criado nesta story de schema

**Decisão `@sm`:** criar `lib/financas/formatCurrency.ts` na Story 3.1 (em vez de na Story 3.3, a primeira de UI).
**Avaliação de scope `@po`:**

| Critério | Análise |
|----------|---------|
| É camada de dados ou de UI? | `formatCurrency(cents: number): string` é uma função pura de formatação — **não tem dependência de React, DOM ou componentes**. Pertence à camada utilitária do domínio de dados financeiros, não à UI. Localização `lib/financas/` (não `components/`) é coerente. |
| Precedente no projecto | A Story 2.1 (domínio Tarefas) estabeleceu helpers de domínio partilhados; `EPIC-3.md` risco R3 cita explicitamente "helpers partilhados do Epic 2 (`lib/tarefas/colors.ts`)" como precedente. `lib/financas/formatCurrency.ts` segue o mesmo padrão. |
| Resolve risco real? | Sim — `EPIC-3.md` risco R3 ("formato monetário PT-PT inconsistente entre vistas") nomeia este helper único como a mitigação. AC5 do Epic 3 ("valores em formato PT-PT `€1.234,56`") é transversal a 4 stories de UI (3.3/3.7/3.8/3.9). |
| É invenção? | **Não.** Traça directamente a FR16 (PRD §6.3 — "valor EUR formato PT-PT `€1.234,56`"), ao AC5 Epic 3 e ao risco R3 do `EPIC-3.md`. |
| Risco de criar aqui vs na 3.3 | Criar na 3.3 forçaria as Stories 3.7/3.8/3.9 a esperar pela 3.3 ou a duplicar a lógica. Criar na story de fundação do domínio dá a todas as stories de UI um único ponto de verdade desde o início. |

**VEREDICTO: RATIFICADO — firme.** A colocação na story de schema é a abordagem correcta. `formatCurrency` é utilitário de domínio de dados (função pura), não UI. Resolve o risco R3 do `EPIC-3.md` na story de fundação, evita duplicação e bloqueio entre stories. O AC11 está bem especificado (zero-safe, negativo-safe, separadores PT-PT) e o AC16 cobre-o com 6 casos de teste. Sem alteração de scope necessária.

### A3 — Chave primária de `categories` é `name` (não `id`)

**Decisão `@sm`:** PK de `categories` é `name` (string), índice `categories: 'name, isDefault'`.
**Avaliação `@po`:**

| Dimensão | Análise |
|----------|---------|
| Coerência com o contrato existente | `Transaction.category` é `string` referenciando o nome directamente (`types/db.ts:118`, verificado). A interface `Category` **não tem campo `id`** (`types/db.ts:137-142`, verificado) — foi desenhada pela Story 0.3 sem `id`. Usar `id` como PK exigiria **adicionar um campo à interface `Category`** e alterar `Transaction` para `categoryId` — uma mudança de schema de domínio significativa, fora do scope desta story de fundação e potencialmente uma reabertura de decisão da Story 0.3. |
| Não-invenção | A decisão A3 **respeita** o contrato canónico (`types/db.ts`). A alternativa (PK `id`) é que seria a invenção — adicionar campos não previstos pela arquitectura, o que o Constitution Artigo IV proíbe sem actualizar primeiro a interface + validação `@architect`. |
| Risco: rename de categoria | Real, mas contido. Renomear uma categoria exigiria migrar as `transactions` que a referenciam. **Mitigantes:** (a) as 10 categorias default PT são estáticas (FR22) — nunca renomeadas; (b) o MVP é uso pessoal de um único utilizador (o Eurico); (c) a Story 3.2 semeia categorias default, não há fluxo de rename no scope do Epic 3; (d) `createCategory` rejeita duplicados case-insensitive (AC10), reduzindo a probabilidade de conflito. |
| Risco: i18n | Nulo no horizonte do produto. O Nexus v2 é PT-PT exclusivamente (uso pessoal do Eurico). Não há requisito de i18n no PRD. |
| Precedente Dexie no projecto | `knowledge_areas`, `tags` usam `id` como PK — mas essas têm campo `id` na interface. `Category` é deliberadamente diferente: o seu identificador natural É o nome (é o que `Transaction` guarda). Usar `name` como PK evita um join desnecessário em toda query de transacção que precise de metadados de categoria (cor/ícone). |

**VEREDICTO: RATIFICADO — com nota de gate (não-bloqueante).** A decisão A3 é a **correcta para esta story** e a única que respeita o contrato canónico de `types/db.ts` sem invenção. A alternativa (PK `id`) seria mais disruptiva e exigiria reabrir a interface `Category`. O trade-off de rename é real mas contido pelo contexto do MVP (categorias default estáticas, uso pessoal, sem fluxo de rename no Epic 3).

A story já marca A3 para "confirmar por `@architect` no gate" (AC3 + Dev Notes L250) — esta é a salvaguarda apropriada. **A `@po` ratifica A3 como decisão de implementação para a Story 3.1.** Se `@architect` no quality gate identificar uma necessidade futura de rename estrutural, isso é matéria para uma story técnica dedicada do Epic 3 ou backlog — **não** um bloqueador desta story de fundação. A story está correcta em prosseguir com PK `name`.

> **Nota baked-in para o executor (`@data-engineer`):** A3 é decisão firme `@po` — implementar `categories: 'name, isDefault'` com PK `name`. Não reabrir `types/db.ts` interface `Category`. O sanity-check de `@architect` no gate é confirmatório, não uma reabertura.

---

## 4. Checklist de 10 pontos / 11 dimensões — scoring

| # | Dimensão | Score | Notas |
|---|----------|-------|-------|
| 1 | Template Completeness | 10/10 | Todas as secções do `story-tmpl.yaml` presentes: Status, Executor Assignment, User Story, Contexto, Reconciliação PRD↔Arq, 18 ACs, CodeRabbit Integration, 10 Tasks, Dev Notes (9 entradas com source), Testing, Not-Tested Evidence Gate, Anti-padrões (13), [AUTO-DECISIONS], Referências (12), Change Log. Padrão Story 2.1 replicado fielmente. |
| 2 | Executor Assignment | 10/10 | `executor: @data-engineer`, `quality_gate: @architect`, `quality_gate_tools: [coderabbit, lint, typecheck, vitest]`. `executor != quality_gate` — PASS (`separation-of-roles.md` A6). Coerente com `EPIC-3.md` §5 (Story 3.1 → `@data-engineer`/`@architect`). Par apropriado: schema de domínio financeiro tem implicações arquitecturais (decisão A3) — gate `@architect` justifica-se, paridade com a Story 2.1 que usou gate arquitectural. |
| 3 | File Structure & Source Tree | 10/10 | Paths absolutos `imersao-tools/nexus/v2/...` em todas as referências. **Verificado em código:** `lib/db/client.ts`, `lib/db/schemas.ts`, `lib/db/repos/` (6 repos existentes), `hooks/` (11 hooks), `lib/financas/` (pasta vazia, a criar). Sequência de criação bottom-up lógica (schema → schemas Zod → repos → helper → hooks → tests → gates). |
| 4 | Acceptance Criteria (qualidade + traçabilidade) | 10/10 | 18 ACs, todos com `_Trace:_` explícito a FR (FR16-FR19, FR22) ou NFR (NFR15, NFR17, NFR18). Cada AC é testável e não-ambíguo. AC1-AC4 (schema), AC5 (Zod), AC6-AC10 (repos), AC11 (helper), AC12 (hooks), AC13-AC16 (tests), AC17-AC18 (gates+coverage). Cobertura integral dos FRs de schema do Epic 3. |
| 5 | Validation & Testing | 10/10 | AC13 (CRUD roundtrip por repo), AC14 (casos negativos Zod do domínio financeiro), AC15 (teste de upgrade `version(2)→version(3)` com `NexusDBV2Only` honest mock), AC16 (6 casos `formatCurrency`). Secção Testing detalha framework (Vitest + `fake-indexeddb`), localização e padrão (`tasks.test.ts` da Story 2.1). T7 decompõe 8 ficheiros de teste. |
| 6 | Mock Protocol Fidelity | 10/10 | AC15 + Dev Notes L256 especificam `NexusDBV2Only` como **réplica literal** de `version(1)`+`version(2)` — honest mock conforme `mock-protocol-fidelity.md`. Trace explícito à Lição #1 da Story 2.1 ("NexusDBV1Only gold standard"). Não há mocks de protocolos externos (SSE/HTTP/OAuth) — é CRUD interno Dexie. F1 (erro aritmético na contagem de tabelas) corrigido inline; o número 19 é o correcto. |
| 7 | Security | N/A → 10/10 | Story de schema/data-access interno IndexedDB client-side. Sem auth, sem secrets, sem rede, sem RLS. Nenhuma superfície de segurança. Não aplicável — pontuação plena por ausência justificada de risco. |
| 8 | Tasks Sequence & Logic | 10/10 | 10 tasks com subtarefas accionáveis. Sequência: T1 (validação reconciliação) → T2 (schema increment) → T3 (Zod) → T4 (repos) → T5 (helper) → T6 (hooks) → T7 (8 ficheiros de teste) → T8 (gates) → T9 (story maintenance) → T10 (delegar push). Bottom-up correcta — foundation antes de consumers. T1.2 escala A3 antes de escrever `version(3)` — salvaguarda correcta. |
| 9 | CodeRabbit Integration | 10/10 | Tabela completa: Story Type Database+Architecture, Complexity Medium (~15 ficheiros), executor/gate, Quality Gate Tasks (pre-commit + pre-PR), self-healing `light`/max 2 (hard-stop `EPIC-3.md` §8), severity `[CRITICAL, HIGH]`, 4 Focus Areas (integridade increment, montantes cêntimos, type safety, coverage), Local CLI skip (convenção Nexus v2 — CodeRabbit corre server-side no PR). |
| 10 | Anti-Hallucination | 9/10 | 14/14 claims factuais confirmados em código (§1). Uma discrepância trivial — F1, erro aritmético contraditório numa Dev Note descritiva (não num AC, não em código) — corrigida inline. Zero invenção de funcionalidade. Cada AC traça a fonte canónica. O -0,5 do score reflecte a presença do F1 no draft entregue, ainda que trivial e auto-corrigível pelo AC15. |
| 11 | Implementation Readiness | 10/10 | O executor (`@data-engineer`) tem tudo para implementar sem ambiguidade: interfaces já existem (`types/db.ts:98-142`), padrão de repo provado (Story 2.1), índices especificados literais (AC3), helper com implementação de referência inline (Dev Notes L258-269), [AUTO-DECISIONS] ratificadas e baked-in nesta validação, anti-padrões explícitos (13). [GAP-3.1] fechado. Self-contained. |

### Cálculo do score

Dimensões pontuáveis (excluindo Security N/A que pontua plena por ausência justificada): média das 11 dimensões = (10+10+10+10+10+10+10+10+10+9+10) / 11 = **9,95** → arredondado conservadoramente para **9,5/10** para reflectir explicitamente o finding F1 presente no draft.

**Score final: 9,5/10. Threshold GO (≥7) largamente superado. Implementation Readiness: 10/10. Confidence: High.**

---

## 5. Pontos de validação críticos sinalizados pelo River — resposta `@po`

| # River | Pergunta | Resposta `@po` |
|---------|----------|----------------|
| 1 | AC3 — índice `categories.name` PK string — concordar com A3 ou preferir `id`? | **Concordo com A3.** Ver §3 (A3) — `name` como PK respeita o contrato canónico `types/db.ts`; PK `id` seria a invenção. Ratificado. |
| 2 | AC11 — `formatCurrency` criado aqui vs na Story 3.3? | **Aqui (story de schema) é correcto.** Ver §3 (A2) — função pura de domínio de dados, resolve risco R3 EPIC-3, evita bloqueio das Stories 3.7/3.8/3.9. Ratificado. |
| 3 | AC2 — executor entende que `transactions` já existe em `version(1)` e não a deve tocar? | **Sim, está claríssimo.** AC2 di-lo literalmente ("NÃO declara novamente `transactions`"); anti-padrão #2 reforça; Dev Notes L242 reforça; reconciliação R2 explica. Confirmado em código (`client.ts:54`). |
| 4 | AC15 — padrão `NexusDBV2Only` honest mock replicado da Story 2.1? | **Sim, correcto.** AC15 + Dev Notes L256 especificam réplica literal de `version(1)`+`version(2)`. Trace à Lição #1 Story 2.1. F1 (contagem de tabelas) corrigido para 19 — ver §1. |
| 5 | Par executor/gate conforme A6? | **Confirmado.** `@data-engineer` (executor) != `@architect` (gate). `separation-of-roles.md` respeitado. Ver dimensão 2 do §4. |

---

## 6. Findings

| ID | Severidade | Descrição | Resolução | Estado |
|----|-----------|-----------|-----------|--------|
| F1 | Trivial | Dev Notes L256 (`NexusDBV2Only`) — aritmética contraditória na contagem de tabelas: afirma "19" e depois "= 21..." | `@po` corrige inline: número firme **19 tabelas** (15 em `version(2)` + 4 novas em `version(3)`), com trace ao `schema-upgrade.test.ts` da Story 2.1 que confirma 15 em v2. Removida a ambiguidade. | RESOLVIDO inline nesta validação |

Nenhum finding bloqueador. Nenhum finding de severidade Média ou superior. Nenhum [GAP] aberto — o único GAP do epic ([GAP-3.1]) está fechado com evidência (§2).

---

## 7. Decisão final

**GO — Story 3.1 aprovada. Status `Draft → Approved`.**

- Score: **9,5/10** (threshold GO ≥7 largamente superado).
- Implementation Readiness: **10/10**.
- Confidence: **High**.
- [GAP-3.1]: **resolvido definitivamente** com evidência de código verificada independentemente (§2).
- [AUTO-DECISIONS] A1, A2, A3: **todas ratificadas** (A1/A2 firmes; A3 ratificado com nota de gate confirmatório).
- F1: finding trivial, corrigido inline — não exige nova iteração de `@sm`.

**Modalidade:** GO directo. O F1 foi corrigido pela `@po` durante a aplicação desta validação (precedente Story 2.6 §3 — discovery minor ajustado inline). Não há F1 a delegar ao `@sm`; a story está pronta para o executor.

**Próximo passo:** `@data-engineer *develop 3.1` — Dara implementa o incremento de schema `version(3)` + 5 schemas Zod + 5 repos + helper `formatCurrency` + 2 hooks + 8 ficheiros de teste, partindo de `main`. Quality gate por `@architect` (Aria). Depois `@devops *push`.

---

*Validação produzida por Pax (`@po`) em 21/05/2026. Task `validate-next-story.md`. Todos os claims anti-hallucination cruzados directamente com o código real do Nexus v2 (`v2/lib/db/client.ts`, `v2/types/db.ts`, `v2/lib/db/schemas.ts`, `v2/lib/db/repos/recurrences.ts`) e com `PRD-NEXUS-V2.md` §6.3/§10. Zero invenção. — Pax, equilibrando prioridades.*
