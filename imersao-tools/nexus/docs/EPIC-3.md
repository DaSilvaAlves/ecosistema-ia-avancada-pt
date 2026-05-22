# Epic 3 — Finanças Completas

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 20/05/2026
> **Estado:** EM CURSO — **5/11 stories Done** (Stories 3.1, 3.2, 3.3, 3.4 e 3.5 fechadas 21-22/05/2026)
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

> **Progresso:** **5/11 Done** — Epic 3 EM CURSO. As 11 stories abaixo são a decomposição directa das "Stories sugeridas" do PRD §10 Epic 3 (3.1 a 3.11) — nenhuma story foi inventada nem omitida face ao PRD. `@sm` (River) finaliza a atribuição executor/quality-gate em cada story draft; `@po` (Pax) valida. Story 3.1 **Done** (`@po` `*close-story 3.1` 21/05/2026 — PR #30 merged em `main` squash `06e3cfb6`, CR Iter 3 APPROVED, Architect Gate PASS) — [GAP-3.1] resolvido e verificado independentemente: tabela `recurrences` reutilizável com `ownerType: 'transaction'`, risco R2 fechado. Story 3.2 **Done** (`@po` `*close-story 3.2` 21/05/2026 — PR #31 merged em `main` squash `25fce8a8`, CR Iter 1 APPROVED 0 findings, QA Gate PASS first-iter) — seed das 10 categorias default PT entregue, idempotente, coverage 100%; CONCERN-1 (coverage allowlist) registada como débito D-3.2-1 na §8 (resolvida pela Story 3.3). Story 3.3 **Done** (`@po` `*close-story 3.3` 22/05/2026 — PR #32 merged em `main` squash `1a48855a`, CR Iter 2 verde, QA Gate PASS) — primeira camada de UI do Epic 3 (página `/financas`, modal CRUD, lista) entregue; D-3.2-1 absorvido; observação LOW registada como débito D-3.3-1 na §8. Story 3.4 **Done** (`@po` `*close-story 3.4` 22/05/2026 — PR #33 merged em `main` squash `54d7f851`, CR Iter 1 resolvido (3 Major + 1 Minor + 1 doc-nit), QA Gate PASS) — CRUD de finanças recorrentes (FR17) entregue: tabela Dexie `financeRecurrences` (`version(4)` aditivo), repo `finance-recurrences.ts`, extensão do motor da Story 2.7 (`generateTransactionInstances` + `runFinanceRecurrenceEngine`), modal + lista + 2 hooks; idempotência REAL provada por testes não-tautológicos; 2 concerns LOW (C1 cobertura de cascata, C2 copy) registados como débito na §8. Story 3.5 **Done** (`@po` `*close-story 3.5` 22/05/2026 — PR #34 merged em `main` squash `51074f28`, CR Iter 1 resolvido (1 Major F1 integridade referencial + 2 Minor F2/F3 erros stale), QA Gate PASS first-iter) — camada de UI de FR18 entregue: 2 modais (`AccountFormModal`, `CardFormModal`), 2 listas (`AccountsList`, `CardsList`), helper puro `lib/financas/balanceInput.ts` (saldo com sinal + limite opcional, coverage 100%), tab strip `/financas` estendido a 4 separadores, guards de eliminação (account delete bloqueado se houver cartões); suite 837/837 PASS; 1 concern LOW (C1 referências órfãs) registado como débito D-3.5-1 na §8.

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 3.1 | Schema finanças | Schema Dexie `accounts`, `cards`, `transactions`, `recurrences`, `installments`, `categories` — estende o schema das Stories 1.1 e 2.1 conforme `architecture-v2.md` | FR16, FR17, FR18, FR19 | `@data-engineer` | `@architect` | **Done** |
| 3.2 | Categorias default PT | Semear as 10 categorias default PT (FR22) — Mercearia, Restauração, Combustível, Saúde, Habitação, Educação, Lazer, Subscrições, Serviços, Outros | FR22 | `@dev` | `@qa` | **Done** |
| 3.3 | CRUD transações variáveis | CRUD de transações variáveis — UI + persistência (valor EUR formato PT-PT, categoria, data, descrição, conta/cartão opcional) | FR16 | `@ux-design-expert` | `@dev` | **Done** |
| 3.4 | CRUD recorrências | CRUD de finanças recorrentes (renda, internet, assinaturas) reutilizando a estrutura de recorrência das tarefas (Story 2.7) | FR17 | `@dev` | `@qa` | **Done** |
| 3.5 | CRUD cartões | CRUD de cartões de crédito com fecho de fatura + dia de vencimento; contas bancárias com saldo | FR18 | `@dev` | `@qa` | **Done** |
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

### Débitos técnicos do Epic 3

Débitos não-bloqueadores identificados durante a execução das stories, a absorver por stories futuras ou housekeeping. Precedente: débitos M1/M2/D6 do Epic 2 registados no respectivo epic.

| # | Débito | Origem | Severidade | Recomendação |
|---|--------|--------|------------|--------------|
| D-3.2-1 | `vitest.config.ts` → `coverage.include` não inclui `lib/financas/**` — os ficheiros do domínio finanças (`seedCategories.ts`, `formatCurrency.ts`) não aparecem no report de `npm run test:coverage`. Coverage real confirmada (100%) via config Vitest temporário no QA Gate da Story 3.2. | Story 3.2 — CONCERN-1 do QA Gate (`@qa` Quinn) | Baixa — não-bloqueadora; cobertura garantida e verificada, apenas não visível no report global | **RESOLVIDO pela Story 3.3** — `'lib/financas/**'` adicionado ao `coverage.include` de `vitest.config.ts` (AC12). Evidência local válida no Not-Tested Evidence Gate da Story 3.3; QA Gate confirmou `lib/financas/**` agora medido (`currencyInput.ts` 95,45%, `formatCurrency.ts` 100%, `seedCategories.ts` 100%). Débito fechado. |
| D-3.3-1 | `components/financas/TransactionFormModal.tsx:275` — o `<Field>` do campo Direção tem `error={errors.amount}`, mas `errors.amount` nunca é populado na prática: `applyDirection` produz sempre um `amount` inteiro válido e o erro de parsing do valor é capturado antes do Zod (mapeado ao campo `amountInput`). Mapeamento de erro defensivo inerte — não é defeito funcional. | Story 3.3 — observação LOW do QA Gate (`@qa` Quinn, `QA-GATE-STORY-3.3.md` §5) | Baixa — não-bloqueadora; cosmético, sem impacto funcional ou de UX | Remover o `error={errors.amount}` inerte do `<Field>` da Direção, ou consolidar o mapeamento de erro do campo Valor. Housekeeping futuro — candidato a absorver por story de UI subsequente que toque `TransactionFormModal` (ex: 3.7/3.8) ou por story técnica dedicada. |
| D-3.4-1 | A cascata de eliminação (AC12 da Story 3.4) não tem um teste que asserte explicitamente que as `Transaction` já geradas **sobrevivem** a `deleteFinanceRecurrence` — T7 prova que `Recurrence` + template são eliminados, mas o cenário "transação gerada sobrevive ao delete da recorrência" não é coberto. O código está correcto (zero `delete` a transações em `deleteFinanceRecurrence`). | Story 3.4 — concern C1 LOW do QA Gate (`@qa` Quinn, secção QA Results da `3.4.story.md`) | Baixa — não-bloqueadora; risco baixo, cobertura de teste em falta sobre código já correcto | Adicionar 1 teste em `financeRecurrences.test.ts`: criar recorrência → gerar transações → `deleteFinanceRecurrence` → assertar `listTransactions({ recurrenceId })` não-vazio. Candidato a housekeeping na Story 3.7/3.10. |
| D-3.4-2 | `components/financas/FinanceRecurrenceFormModal.tsx:247` — a mensagem de erro de recorrência ausente refere `"activa \"Tarefa recorrente\""`, copy herdada do contexto de tarefas e ligeiramente incoerente no domínio finanças. | Story 3.4 — concern C2 LOW do QA Gate (`@qa` Quinn, secção QA Results da `3.4.story.md`) | Baixa — não-bloqueadora; cosmético, copy | Ajustar a copy para terminologia financeira (ex: "Define a periodicidade desta recorrência"). Housekeeping futuro — candidato a absorver por story de UI subsequente que toque `FinanceRecurrenceFormModal`. |
| D-3.5-1 | Referências órfãs — ao apagar uma conta (sem cartões) ou um cartão via `/financas`, as transações com `accountId`/`cardId` correspondente mantêm a referência a um registo eliminado. É schema-válido (ambos os campos são `nullable`) e está documentado na story (AC9/AC10, [AUTO-DECISION] A3, precedente Story 3.4 AC12). Sem impacto funcional na 3.5. | Story 3.5 — concern C1 LOW do QA Gate (`@qa` Quinn, secção QA Results da `3.5.story.md`) | Baixa — não-bloqueadora; risco baixo, comportamento documentado e schema-válido | As vistas 3.8 (cartões) e 3.9 (património) devem tratar graciosamente uma referência a conta/cartão inexistente ("Conta desconhecida" já implementado no `CardsList`). Candidato a housekeeping nas Stories 3.8/3.9. |
| D-3.5-2 | A tab strip da page `/financas` (`role="tablist"` + 4 `role="tab"`) não implementa roving tabindex / navegação por setas — apenas Tab-key entre os botões. Padrão herdado da Story 3.4 ([AUTO-DECISION] A5), não introduzido pela 3.5. Os 4 separadores são `<button>` operáveis por Enter/Space e alcançáveis por Tab. | Story 3.5 — concern C2 LOW do QA Gate (`@qa` Quinn) | Baixa — não-bloqueadora; a11y parcial, afecta 3.4 + 3.5 em conjunto | Adicionar roving tabindex + navegação por setas à tab strip. Candidato a housekeeping de a11y conjunto das stories de UI de finanças. |
| D-3.5-3 | O helper `Field` e a função `inputStyle` estão duplicados localmente nos 4 modais de finanças (`TransactionFormModal`, `FinanceRecurrenceFormModal`, `AccountFormModal`, `CardFormModal`). Padrão estabelecido do codebase (3.3/3.4) que a 3.5 seguiu por consistência. | Story 3.5 — concern C3 LOW do QA Gate (`@qa` Quinn) | Baixa — não-bloqueadora; duplicação de código sem impacto funcional | Extrair `components/financas/FormField.tsx` partilhado. Story técnica dedicada ou housekeeping. |

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

**Epic 3 EM CURSO — 5/11 stories Done.** As Stories 3.1 (Schema finanças), 3.2 (Categorias default PT), 3.3 (CRUD transações variáveis), 3.4 (CRUD recorrências) e 3.5 (CRUD cartões + contas) estão fechadas (`@po *close-story` — 3.1/3.2 em 21/05/2026, 3.3/3.4/3.5 em 22/05/2026 — PR #30 squash `06e3cfb6`, PR #31 squash `25fce8a8`, PR #32 squash `1a48855a`, PR #33 squash `54d7f851`, PR #34 squash `51074f28` merged em `main`). As restantes 6 stories (3.6 a 3.11) estão decompostas a partir do PRD §10 Epic 3, cobrindo integralmente os 8 FRs de Finanças (FR16-FR23) e os 5 Epic ACs.

**Story 3.1 — fecho confirmado.** Schema Dexie `version(3)` aditivo entregue (4 tabelas novas: `accounts`, `cards`, `installments`, `categories` + re-declaração de `transactions` com índice `[cardId+date]`). `[GAP-3.1]` resolvido — `recurrences` reutilizada com `ownerType: 'transaction'`, não recriada. Helper partilhado `lib/financas/formatCurrency.ts` disponível para as vistas (3.3/3.7/3.8/3.9). 5 schemas Zod + 5 repos tipados + 2 hooks reactivos entregues.

**Story 3.2 — fecho confirmado.** Seed das 10 categorias default PT (FR22) entregue: `lib/financas/seedCategories.ts` (`seedDefaultCategories()` idempotente — loop `createCategory` + `try/catch` por item) + hook `useFinancasInit` (activação one-shot, padrão `useRecurrenceEngine`). 10 testes Vitest, coverage 100%. QA Gate PASS first-iter, CR Iter 1 APPROVED 0 findings. CONCERN-1 (coverage allowlist) registada como débito D-3.2-1 (§8). Nenhuma dependência pendurada — as 10 categorias default desbloqueiam o pré-requisito de dados das Stories 3.3/3.7/3.11.

**Story 3.3 — fecho confirmado.** Primeira camada de UI do Epic 3 (FR16) entregue: rota `app/(app)/financas/page.tsx`, `TransactionFormModal` (7 campos, WAI-ARIA, replica `ProjectFormModal`), `TransactionsList` (lista cronológica básica, distinção saída/entrada), helper puro `lib/financas/currencyInput.ts` (parsing monetário PT-PT ↔ cêntimos, sem aritmética `float`) e os hooks reactivos `useCategories`/`useCards`. 7 ficheiros novos + 2 modificados; 33 testes Vitest novos; coverage `currencyInput.ts` 95,45%. Débito D-3.2-1 absorvido (`coverage.include += 'lib/financas/**'`, path bloqueador com evidência local). QA Gate PASS first-iter; CodeRabbit Iter 2 verde (F1 Major + F2 resolvidos, hard-stop §8 não atingido). Observação LOW (`TransactionFormModal.tsx:275`) registada como débito D-3.3-1 (§8).

**Story 3.4 — fecho confirmado.** CRUD de finanças recorrentes (FR17) entregue: tabela Dexie `financeRecurrences` (`version(4)` aditivo, `version(1-3)` intactos), repo `lib/db/repos/finance-recurrences.ts` (5 funções, `deleteFinanceRecurrence` em cascata atómica `db.transaction('rw', ...)`), extensão do motor da Story 2.7 com `generateTransactionInstances` (idempotente, horizonte 90 dias) + `runFinanceRecurrenceEngine`, modal `FinanceRecurrenceFormModal` (7 campos, `RecurrenceFieldset` reutilizado, WAI-ARIA), lista `FinanceRecurrencesList`, hooks `useFinanceRecurrenceEngine`/`useFinanceRecurrences`, e tab strip "Transações | Recorrências" na page `/financas`. 8 ficheiros novos + 5 modificados; 23 testes Vitest novos + 3 de regressão (CR Iter 1); suite 825/825 PASS; coverage `recurrence.ts` 99,19% / `finance-recurrences.ts` 100%. QA Gate PASS first-iter; idempotência REAL provada por testes não-tautológicos (T2/T8 com `toBe(0)` estrito). CodeRabbit Iter 1 resolvido (3 Major + 1 Minor + 1 doc-nit), hard-stop §8 não atingido. 2 concerns LOW (C1 cobertura de cascata, C2 copy) registados como débitos D-3.4-1 e D-3.4-2 (§8). Reuso do motor da Story 2.7 confirmado — `runRecurrenceEngine` não modificado.

**Story 3.5 — fecho confirmado.** Camada de UI de FR18 entregue: helper puro `lib/financas/balanceInput.ts` (`parseBalanceInput`/`balanceToInput`/`parseCardLimit` — saldo com sinal, limite opcional, guarda de `-0`, coverage 100%), 2 modais (`AccountFormModal` 3 campos, `CardFormModal` 5 campos com dropdowns 1-31), 2 listas (`AccountsList`, `CardsList` com lookup de conta), tab strip `/financas` estendido a 4 separadores (Transações, Recorrências, Contas, Cartões), guards de eliminação (account delete bloqueado se houver cartões — integridade da FK non-nullable `Card.accountId`). 6 ficheiros novos + 1 modificado; 12 testes Vitest novos; suite 837/837 PASS. QA Gate PASS first-iter; CR Iter 1 resolvido (F1 Major integridade referencial + F2/F3 Minor erros stale), hard-stop §8 não atingido. 3 concerns LOW registados como débitos D-3.5-1 (referências órfãs), D-3.5-2 (roving tabindex tab strip), D-3.5-3 (duplicação `Field`). Repos/schemas/hooks da Story 3.1 consumidos sem modificação.

**Próximo passo recomendado:** `@sm *draft 3.6` (compras parceladas vinculadas a cartão — geração de N transações futuras automaticamente — FR19). A 3.6 está desbloqueada: depende da 3.1 (schema `installments`) e da 3.5 (cartões registados — `Installment.cardId` exige cartão a que vincular). Depois: `@po *validate-story-draft 3.6` → executor `@dev *develop 3.6` → quality gate `@architect` → `@devops *push`. A Story 3.6 nasce em feature branch dedicada (`feature/3.6-...`), não em `main`. Nota de quality gate: a 3.6 exige **revisão manual dos cálculos** de divisão de prestações (§9 + R1 — testar casos não-divisíveis como €100/3).

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
