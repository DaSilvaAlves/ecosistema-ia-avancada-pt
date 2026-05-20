# Epic 3 — Finanças Completas

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 20/05/2026
> **Estado:** PLANEADO — **0/11 stories Done** (todas Pending no arranque)
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.3, §9, §10 (Epic 3) — Constitution Artigo IV (No Invention): cada story, FR e AC abaixo traça ao PRD
> **Arquitectura:** `architecture-v2.md` (5 ADRs — não reabrir, ver `project_nexus_v2_architecture.md`)
> **Lições aplicadas:** Retrospectiva Epic 1 (`retrospectives/EPIC-1-retrospective.md` — A1/A2/A6) + Retrospectiva Epic 2 (`retrospectives/EPIC-2-retrospective.md` — A1/A2/A4)

---

## 1. Goal

Finanças completas: transações variáveis e recorrentes, contas bancárias, cartões de crédito com fecho de fatura e vencimento, compras parceladas que geram N transações futuras, vista património (saldo agregado), vista mensal com projecção a 30 dias, categorias default PT, e tools do cérebro multi-intent integradas. Trace: PRD §9 (linha "Epic 3 — Finanças completas") + §10 Epic 3.

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | A projecção a 30 dias (FR21) — total entrado vs saído incluindo recorrentes e prestações — é o ângulo de continuidade financeira: o utilizador vê para onde o saldo caminha, não apenas o que já gastou. Alinhado à visão Nexus (overnight agent / antecipação). |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, consolidado em `main` @ `5514b310`) é onde as 6 tools de finanças (FR23) se registam. A Story 3.11 povoa o registry com o domínio `finances` (precedente: Story 2.10 registou o domínio `tasks`/`projects`). |
| Persistência | Schema Dexie 4 IndexedDB — a Story 3.1 estende o schema criado nas Stories 1.1 e 2.1. Ver §7 (reconciliação PRD ↔ arquitectura). |
| Recorrência | FR17 (finanças recorrentes) usa "a mesma estrutura de recorrência das tarefas" (PRD FR17). O motor `runRecurrenceEngine` da Story 2.7 é genérico por `ownerType` — Epic 3 reutiliza-o em vez de criar um motor novo. Ver §7. |
| Independência do Epic 2 | PRD §9: ordem `0 → 1 → (2 || 3) → 4`. O Epic 3 depende apenas do Epic 1, não do Epic 2. O reuso do motor de recorrência da Story 2.7 é uma optimização (Epic 2 já está em main), não uma dependência de bloqueio. |

## 3. Dependências

| Relação | Epic | Estado |
|---------|------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) | DONE — 10/10 em main |
| Reutiliza (não-bloqueante) | Epic 2 Story 2.7 (motor de recorrência genérico `runRecurrenceEngine` por `ownerType`) | DONE — em main (`d977ade1`) |
| Bloqueia | Epic 12 (referido em PRD §9 coluna "Bloqueia") | Não iniciado |
| Paralelizável com | Epic 4 (Hábitos + Metas + Lembretes) — ordem PRD §9 `2 || 3 → 4` | Não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`.

## 4. Functional Requirements cobertos

Trace directo a `PRD-NEXUS-V2.md` §6.3. Todos os 8 FRs de Finanças (FR16-FR23) são cobertos.

| FR | Descrição (PRD §6.3) | Stories |
|----|----------------------|---------|
| FR16 | Transações financeiras variáveis: valor (EUR formato PT-PT `€1.234,56`), categoria, data, descrição, conta/cartão opcional | 3.1, 3.3 |
| FR17 | Finanças recorrentes (renda, internet, assinaturas) com a mesma estrutura de recorrência das tarefas | 3.1, 3.4, 3.10 |
| FR18 | Contas bancárias (com saldo) e cartões de crédito com fecho de fatura e dia de vencimento | 3.1, 3.5 |
| FR19 | Compras parceladas vinculadas a cartão — geram N transações futuras automaticamente | 3.1, 3.6, 3.10 |
| FR20 | Vista Património: saldo agregado por banco/conta com drilldown | 3.9 |
| FR21 | Vista mensal: análise por categoria, por dia, total entrado vs saído, projecção 30 dias incluindo recorrentes e prestações | 3.7 |
| FR22 | Categorias default PT (Mercearia, Restauração, Combustível, Saúde, Habitação, Educação, Lazer, Subscrições, Serviços, Outros) | 3.2 |
| FR23 | Tools cérebro: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria` | 3.11 |

## 5. Stories (11) — trace PRD §10 Epic 3

> **Progresso:** **0/11 Done** — Epic 3 PLANEADO. As 11 stories abaixo são a decomposição directa das "Stories sugeridas" do PRD §10 Epic 3 (3.1 a 3.11) — nenhuma story foi inventada nem omitida face ao PRD. `@sm` (River) finaliza a atribuição executor/quality-gate em cada story draft; `@po` (Pax) valida.

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 3.1 | Schema finanças | Schema Dexie `accounts`, `cards`, `transactions`, `recurrences`, `installments`, `categories` — estende o schema das Stories 1.1 e 2.1 conforme `architecture-v2.md` | FR16, FR17, FR18, FR19 | `@data-engineer` | `@architect` | **Pending** |
| 3.2 | Categorias default PT | Semear as 10 categorias default PT (FR22) — Mercearia, Restauração, Combustível, Saúde, Habitação, Educação, Lazer, Subscrições, Serviços, Outros | FR22 | `@dev` | `@qa` | **Pending** |
| 3.3 | CRUD transações variáveis | CRUD de transações variáveis — UI + persistência (valor EUR formato PT-PT, categoria, data, descrição, conta/cartão opcional) | FR16 | `@ux-design-expert` | `@dev` | **Pending** |
| 3.4 | CRUD recorrências | CRUD de finanças recorrentes (renda, internet, assinaturas) reutilizando a estrutura de recorrência das tarefas (Story 2.7) | FR17 | `@dev` | `@qa` | **Pending** |
| 3.5 | CRUD cartões | CRUD de cartões de crédito com fecho de fatura + dia de vencimento; contas bancárias com saldo | FR18 | `@dev` | `@qa` | **Pending** |
| 3.6 | Compras parceladas | Compras parceladas vinculadas a cartão — geração de N transações futuras automaticamente | FR19 | `@dev` | `@architect` | **Pending** |
| 3.7 | Vista "este mês" | Vista mensal: análise por categoria, por dia, total entrado vs saído, projecção 30 dias incluindo recorrentes e prestações | FR21 | `@ux-design-expert` | `@dev` | **Pending** |
| 3.8 | Vista cartões | Vista de cartões: fatura corrente + próxima fatura + prestações | FR18, FR19 | `@ux-design-expert` | `@dev` | **Pending** |
| 3.9 | Vista património | Vista Património: saldo agregado por conta/banco com drilldown | FR20 | `@ux-design-expert` | `@dev` | **Pending** |
| 3.10 | Geração diária recorrentes + prestações | Motor client-side de geração diária de transações recorrentes + prestações — ao primeiro carregamento do dia (reutiliza `runRecurrenceEngine` da Story 2.7) | FR17, FR19 | `@dev` | `@architect` | **Pending** |
| 3.11 | Tools cérebro finanças | Registar 6 tools no Tool Registry: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria` | FR23 | `@dev` | `@architect` | **Pending** |

> Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (regra A6 — `separation-of-roles.md`). Padrão herdado do Epic 2: stories de schema → gate `@architect`; stories de UI → executor `@ux-design-expert`, gate `@dev`; stories de lógica de domínio/backend → gate `@architect` ou `@qa`. `@sm` finaliza a atribuição em cada story draft, `@po` valida.

## 6. Acceptance Criteria (nível epic) — trace PRD §10 Epic 3

Cópia fiel dos AC Epic 3 do PRD §10 (linhas 480-484).

| # | Critério | Story principal |
|---|----------|-----------------|
| AC1 | Compra parcelada €1.200 em 12x cria 12 transações futuras de €100 cada | 3.6 |
| AC2 | Recorrente "renda dia 8" gera transação automática mensal | 3.4, 3.10 |
| AC3 | Vista mensal mostra projecção 30 dias incluindo recorrentes e prestações | 3.7 |
| AC4 | Cérebro: "paguei €78,70 no supermercado com cartão Millennium" cria transação correctamente associada | 3.11 |
| AC5 | Valores em formato PT-PT (`€1.234,56`) | 3.1, 3.3 (transversal a todas as vistas) |

## 7. Reconciliação PRD ↔ Arquitectura

| Ponto | PRD §10 Epic 3 dizia | Arquitectura (ADR) | Resolução para Epic 3 |
|-------|----------------------|--------------------|-----------------------|
| Persistência | Story 3.1 "Schema `accounts`, `cards`, `transactions`, `recurrences`, `installments`, `categories`" | ADR-2: Dexie 4 IndexedDB desde o dia 1 | Story 3.1 cria schema **Dexie**, estende o das Stories 1.1 e 2.1. O termo genérico "schema" do PRD resolve-se como tabelas Dexie — precedente directo da Story 2.1 (`EPIC-2.md` §7). |
| Tabela `recurrences` | Story 3.1 lista `recurrences` como tabela do schema de finanças | Story 2.1 já criou uma tabela `recurrences` genérica (não `task_recurrences`) — reconciliação R2 do `EPIC-2.md` | **[GAP-3.1]** A Story 3.1 deve verificar em código se a tabela `recurrences` da Story 2.1 é genérica por `ownerType` e reutilizável para finanças, ou se precisa de extensão. `@sm`/`@architect` resolvem no draft da 3.1 — não assumir nem duplicar tabela sem verificação. |
| Geração diária | Story 3.10 "cron client ao primeiro carregamento do dia" | ADR-2.7-1 (Story 2.7) — activação via `useEffect` one-shot on-mount; motor `runRecurrenceEngine` genérico por `ownerType` | Story 3.10 reutiliza o mecanismo ADR-2.7-1 e o motor `runRecurrenceEngine` — não cria mecanismo de cron novo. Se houver divergência (ex: prestações exigem lógica distinta de instâncias recorrentes), escalar a `@architect` antes de implementar. |
| Recorrência de finanças | FR17 "mesma estrutura de recorrência das tarefas" | Motor `runRecurrenceEngine` da Story 2.7 é genérico por `ownerType` | Stories 3.4 e 3.10 reutilizam o motor da Story 2.7 — `ownerType: 'finance'` (ou equivalente, a confirmar no draft da 3.1/3.4). Não reimplementar lógica de recorrência. |

Nenhum ADR base é reaberto. Qualquer divergência face à arquitectura é escalada a `@architect` antes de implementar. O `[GAP-3.1]` é o único ponto explicitamente marcado para resolução no draft — não foi preenchido com suposição (Constitution Artigo IV).

## 8. Qualidade e processo — lições das Retrospectivas Epic 1 e Epic 2

| Acção | Aplicação no Epic 3 |
|-------|---------------------|
| **A1 (Epic 1) — `mock-protocol-fidelity.md`** | Epic 3 é CRUD interno + lógica de cálculo financeiro — não tem mocks de protocolos externos (SSE/HTTP/OAuth). A Story 3.11 (tools cérebro) deve garantir que qualquer mock do Tool Registry/executor reflecte o contrato real do registry (precedente Story 2.10). Demonstração plena do critério A1 encaixa no Epic 6 (OAuth), não no Epic 3. |
| **A2 (Epic 1 + Epic 2) — Not-Tested Evidence Gate + contagem de testes por worktree** | Stories 3.1 (schema), 3.10 (motor de geração) e 3.2 (seed) podem tocar config/scripts — se algum commit usar `Not-tested:` em path bloqueador, a secção do `story-tmpl.yaml` é obrigatória com evidência local. Em desenvolvimento paralelo (Epic 3 stories independentes), a contagem `test:unit` reportada identifica branch/worktree; o quality gate reproduz sempre num worktree limpo isolado. |
| **A1 (Epic 2) — checklist a11y no QA Gate** | As Stories de UI (3.3, 3.7, 3.8, 3.9) devem passar pelo checklist a11y reforçado do QA Gate (navegação por teclado, roving tabindex em componentes interactivos). Objectivo: o QA Gate apanhar findings de a11y antes do CodeRabbit. |
| **A6 (Epic 1) — `separation-of-roles.md`** | Aplicado na tabela §5 — nenhum executor é o seu próprio quality gate. |
| Alvo de waiver rate | Epic 2 fechou com **0%** (alvo <20%). **Alvo Epic 3: <20%** (no máximo 2/11 stories), com a meta interna de manter 0% como no Epic 2. |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix` por story — mantido 10/10 no Epic 1 e 9/10 no Epic 2 (Story 2.6 outlier com autorização Eurico). Manter no Epic 3. |
| Revisão manual de cálculos | PRD §10 Epic 3 quality gate exige "revisão manual cálculos fatura/prestações" — as Stories 3.6 (parceladas) e 3.8 (vista cartões) exigem verificação manual dos cálculos de fecho de fatura e divisão de prestações. Ver §9. |

## 9. Quality gates do epic

Trace PRD §10 Epic 3: "Epic 1 + revisão manual cálculos fatura/prestações".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 consolidado em main — SATISFEITO |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia — NFR18) |
| Revisão manual de cálculos | Stories 3.6 (compras parceladas — divisão €1.200/12 = €100) e 3.8 (vista cartões — fecho de fatura corrente vs próxima) exigem revisão manual dos cálculos financeiros. AC1 é o caso de teste canónico. |
| Formato PT-PT | AC5 — todos os valores monetários renderizados em formato PT-PT `€1.234,56` (separador de milhar ponto, separador decimal vírgula). Verificação transversal em todas as vistas. |
| Cobertura | NFR17: >= 60% em packages core — o PRD §300 lista explicitamente "finanças" como package core abrangido por esta meta. |

## 10. Próximo passo

**Epic 3 PLANEADO — 0/11 stories Done.** As 11 stories (3.1 a 3.11) estão decompostas a partir do PRD §10 Epic 3, cobrindo integralmente os 8 FRs de Finanças (FR16-FR23) e os 5 Epic ACs.

**Próximo passo recomendado:** `@sm *draft 3.1` — River cria o draft da Story 3.1 (Schema finanças), partindo de `main`. A Story 3.1 é o pré-requisito de todas as outras (schema Dexie sobre o qual assentam as 10 stories seguintes) e deve resolver o `[GAP-3.1]` da §7 (verificar reutilização da tabela `recurrences` da Story 2.1). Depois: `@po *validate-story-draft 3.1` → executor `*develop 3.1` → quality gate → `@devops *push`.

Sequência sugerida (não rígida — `@sm`/`@po` confirmam paralelizabilidade por story):
- **3.1** (schema) → pré-requisito de todas. Bloqueante.
- **3.2** (categorias default) e **3.3** (CRUD transações variáveis) → dependem da 3.1.
- **3.4** (recorrências), **3.5** (cartões), **3.6** (parceladas) → dependem da 3.1; 3.6 depende também da 3.5 (parceladas vinculam-se a cartão).
- **3.7/3.8/3.9** (vistas mensal/cartões/património) → dependem dos CRUDs respectivos.
- **3.10** (geração diária) → depende de 3.4 + 3.6.
- **3.11** (tools cérebro) → depende dos CRUDs (3.3/3.4/3.5/3.6) estarem disponíveis para as tools chamarem.

### Decisão sobre os débitos Média D6 e D7 (acção A4 da Retrospectiva Epic 2)

A Retrospectiva Epic 2 (§7, acção A4) atribuiu a `@pm` (Morgan) + `@po` (Pax) a decisão do destino dos dois débitos Média herdados do Epic 2, no arranque do próximo epic. Decisão tomada por Morgan (`@pm`) no arranque do Epic 3:

| Débito | Domínio | Decisão | Racional |
|--------|---------|---------|----------|
| **D6** — Delete projecto com cascata `Task.projectId` (set null vs bloquear vs cascade delete) | Epic 2 — gestão de projectos/tarefas | **FORA-DE-SCOPE do Epic 3.** Não é absorvido por nenhuma story de Finanças. Mantém-se como candidato a story técnica dedicada (a recorrente "Story 2.11 técnica") ou a integração no arranque do Epic 4 (Hábitos/Metas/Lembretes — domínio CRUD afim ao de tarefas/projectos). | O Epic 3 é exclusivamente Finanças (FR16-FR23). Forçar D6 dentro do Epic 3 violaria a Constitution Artigo IV (No Invention) — D6 não traça a nenhum FR de Finanças. A decisão de scope correcta, alinhada com a lição §5.4 da Retrospectiva Epic 2 ("não forçar débito de outro domínio dentro do epic"). |
| **D7** — Fallback de intent vazio em PT-BR no classifier (prompt vago → resposta PT-BR com emojis) | Epic 1 — cérebro/classifier | **FORA-DE-SCOPE do Epic 3.** É UX visível em produção e do domínio do classifier (Epic 1), não de Finanças. Recomendação `@pm`: tratar via **hotfix dedicado** (SOP Hotfix Produção — `reference_sop_hotfix_producao.md`), não esperar por uma story de epic. Escalar a decisão hotfix-vs-story ao Eurico (acção A3 da Retrospectiva Epic 2 atribui esta decisão a Eurico + `@pm`). | D7 é UX visível na primeira interacção do utilizador em produção (`https://imersao.ia.expressia.pt`). Não deve ficar indefinidamente em backlog (lição §5.4 Retrospectiva Epic 2). O Epic 3 não é o veículo: D7 é do classifier. O caminho mais rápido é o SOP Hotfix, independente do ciclo de epics. |

**Síntese da decisão A4:** nem D6 nem D7 são absorvidos pelo Epic 3 — ambos são de domínios alheios a Finanças e absorvê-los violaria a regra de No Invention. D6 fica como candidato a story técnica dedicada ou a slot no arranque do Epic 4. D7 é encaminhado para hotfix dedicado (decisão final hotfix-vs-story pertence ao Eurico, acção A3). Os 7 débitos Baixa do Epic 2 (D1-D5, M1, M2, D-2.7-1) permanecem em backlog de manutenção, sem prioridade no Epic 3.

### Riscos do Epic 3

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | Cálculo incorrecto de fecho de fatura / divisão de prestações (ex: arredondamento €1.200/12 ≠ €100 exacto em casos não-divisíveis) | Média | Alto — dados financeiros do utilizador | Quality gate exige revisão manual dos cálculos (§9). AC1 é o caso canónico. As Stories 3.6/3.8 devem testar explicitamente casos não-divisíveis (ex: €100/3). |
| R2 | `[GAP-3.1]` — tabela `recurrences` da Story 2.1 pode não ser genérica o suficiente para finanças, forçando extensão de schema ou tabela nova | Média | Médio — pode atrasar a Story 3.1 | A Story 3.1 verifica em código (não assume). `@architect` decide extensão vs tabela nova no draft/gate da 3.1. |
| R3 | Formato monetário PT-PT (`€1.234,56`) inconsistente entre vistas (separador de milhar/decimal) | Baixa | Médio — UX e AC5 | Helper de formatação único (`lib/financas/formatCurrency.ts` ou equivalente) criado na Story 3.1/3.3 e reutilizado por todas as vistas. Precedente: helpers partilhados do Epic 2 (`lib/tarefas/colors.ts`). |
| R4 | Motor de geração diária (3.10) duplica ou conflitua com o motor de recorrência de tarefas da Story 2.7 | Baixa | Médio | FR17 e ADR-2.7-1 já preveem reuso do `runRecurrenceEngine` genérico por `ownerType`. A Story 3.10 reutiliza, não reimplementa. Escalar a `@architect` se a lógica de prestações divergir da de instâncias recorrentes. |
| R5 | Stories de UI (3.7/3.8/3.9) geram findings CR de a11y não apanhados pelo QA Gate (padrão observado na Story 2.6) | Média | Baixo — iterações CR extra | Acção A1 da Retrospectiva Epic 2 — checklist a11y reforçado no QA Gate aplicado às stories de UI do Epic 3 (§8). |

---

*Epic 3 preparado por Morgan (`@pm`) em 20/05/2026. Ancorado em `PRD-NEXUS-V2.md` §6.3 + §9 + §10 Epic 3, `architecture-v2.md` (5 ADRs), Retrospectiva Epic 1 (A1/A2/A6) e Retrospectiva Epic 2 (A1/A2/A4). Decisão A4 (destino D6/D7) registada na §10. Zero invenção — cada FR, story e AC traça a uma secção do PRD; o único ponto não resolvido (`[GAP-3.1]`) está explicitamente marcado para o draft da Story 3.1.*
