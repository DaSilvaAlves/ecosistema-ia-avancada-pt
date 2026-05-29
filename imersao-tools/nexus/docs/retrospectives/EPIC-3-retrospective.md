# Retrospectiva — Epic 3 Nexus v2 (Finanças Completas)

> **Autor:** Pax (`@po`) | **Data:** 28/05/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (11 stories merged via PRs #30-#40; closure commit `c11ec286`)
> **Período:** 21/05/2026 → 28/05/2026 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-2-retrospective.md` + `retrospectives/EPIC-1-retrospective.md`

---

## 1. Sumário executivo

- **11/11 stories Done** em main (3.1 a 3.11) — Epic 3 fechado 100%.
- Cobertura funcional integral: FR16-FR23 (8 FRs de Finanças). Os 5 Epic ACs (§6 do `EPIC-3.md`) satisfeitos — AC4 canónico (cérebro cria transação a partir de linguagem natural) coberto pela Story 3.11; AC1 (€1.200/12 = 12× €100) verificado manualmente no Architect Gate da Story 3.6.
- **Waiver rate final: 1/11 (9,1%)** — só a Story 3.10 (merge waived com 2× `AUTHORIZATION-§8` explícitas do Eurico). Alvo `EPIC-3.md` §8: <2/11 (<18%) ATINGIDO. Meta interna de 0% (igualar Epic 2) **não** atingida — a Story 3.10 quebrou a sequência.
- **Quality gate PASS first-iter em 11/11 stories** — nenhuma story consumiu `qa-loop-fix` no gate AIOX (QA Gate Quinn / Architect Gate Aria / `@dev` gate). Mantém o padrão first-iter consolidado desde a Story 1.5 (agora 23 stories consecutivas: 1.5-1.10, 2.1-2.10, 3.1-3.11, descontando reabertura inicial).
- **Iterações CodeRabbit no PR mais altas que no Epic 2** — 3 stories precisaram de Iter 3 CR (3.1, 3.7, 3.9), todas com autorização humana explícita do Eurico, mais a Story 3.10 cujo merge foi waived na Iter 3. Epic 2 teve apenas 1 outlier (Story 2.6). Análise na §5.
- **Domínio de cálculo financeiro novo** — pela primeira vez o epic introduziu lógica numérica de risco (divisão de prestações, fecho de fatura, agregações mensais). O Architect Gate com revisão manual de cálculos (`EPIC-3.md` §9) funcionou como salvaguarda — zero erros de cálculo chegaram a produção.
- **9 débitos não-bloqueadores registados** (D-3.2-1 RESOLVIDO; D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1, D-3.5-2, D-3.5-3 abertos; +2 observações LOW da 3.6 sem débito formal) — todos Baixa, registados em `EPIC-3.md` §8 e endereçados na §4 deste documento.
- **Reuso do motor de recorrência da Story 2.7** (`runRecurrenceEngine` genérico por `ownerType`) confirmado e estendido (`runFinanceRecurrenceEngine`) sem reabrir o motor — a aposta de motor genérico do Epic 2 pagou-se no Epic 3.
- **Vercel production live** continuamente em `https://imersao.ia.expressia.pt`.

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories | 11 | 3.1 → 3.11 |
| Stories first-iter PASS no quality gate AIOX | **11/11** | Todas PASS no primeiro gate, 0 `qa-loop-fix` consumidas |
| Stories com 0-1 iter CodeRabbit no PR | 3 | 3.2 (Iter 1 APPROVED 0 findings), 3.4 (Iter 1), 3.5 (Iter 1) |
| Stories com 2 iter CodeRabbit no PR | 4 | 3.3, 3.6, 3.8, 3.11 |
| Stories com 3 iter CodeRabbit no PR | 4 | **3.1, 3.7, 3.9, 3.10** (todas com autorização humana — ver §5.1) |
| Hard-stop max-2-iter respeitado sem autorização | 7/11 | As 4 stories com Iter 3 tiveram autorização explícita do Eurico |
| Waiver rate ("merge waived") | **1/11 (9,1%)** | Só Story 3.10 — merge waived 2× `AUTHORIZATION-§8`. As outras 3 Iter-3 fecharam com CR verde, não waiver |

> **Nota sobre "quality gate" vs "CodeRabbit":** o quality gate AIOX (QA Gate Quinn / Architect Gate Aria / `@dev` gate) passou à primeira em 11/11 stories. As iterações CodeRabbit acontecem **depois** do gate, no ciclo do PR — camada distinta. A distinção `qa-loop-fix` (gate) vs iterações CR (PR) é a mesma das Retrospectivas Epic 1 e Epic 2.

### 2.2 — Distribuição de iterações CodeRabbit por story (detalhe)

| Story | Iter CR | Resultado | Autorização Iter 3 |
|-------|---------|-----------|--------------------|
| 3.1 — Schema finanças (DAL Dexie v3) | **3** | Iter 1 (13+1 findings) → Iter 2 (3+1, 2 bugs reais) → Iter 3 (4 findings) verde | Eurico (Opção A do handoff de escalação) |
| 3.2 — Categorias default PT | **1** | Iter 1 APPROVED, 0 findings | — |
| 3.3 — CRUD transações variáveis | **2** | Iter 1 (4 findings: 2 código + 2 doc) → Iter 2 fixes (F1 Major + F2) | — |
| 3.4 — CRUD recorrências | **1** | Iter 1 (3 Major + 1 Minor + 1 doc-nit) → 3 testes regressão | — |
| 3.5 — CRUD cartões | **1** | Iter 1 (1 Major integridade + 2 Minor stale) | — |
| 3.6 — Compras parceladas | **2** | Iter 1 (Fix #1 cardId guard + Fix #2 render-safe) → Iter 2 APPROVED | — |
| 3.7 — Vista "Este mês" | **3** | Iter 1 (1 bug `getProjectionWindow` + 3 lint MD) → Iter 2 → Iter 3 (DST-safe refactor) | Eurico (`Authorized-by:` trailer) |
| 3.8 — Vista cartões | **2** | Iter 1 (3 findings) → Iter 2 (A1+A2+N1) + doc-nits + reply a falso positivo | — (NÃO Iter 3) |
| 3.9 — Vista património | **3** | Iter 1 (Major — sem unit tests page) → Iter 2 (tests C1-C5) → Iter 3 (cobertura `cash` + IDs determinísticos) verde | Eurico (hard-stop §8) |
| 3.10 — Geração diária | **3** | Iter 1 (5+1) → Iter 2 (2 nits) → Iter 3 CHANGES_REQUESTED → **merge waived** | Eurico (2× `AUTHORIZATION-§8`) |
| 3.11 — Tools cérebro finanças | **2** | Iter 1 (6 actionable: 2 Major código + 1 Major doc + 3 Minor) → Iter 2 limpo → merge CLEAN | — |

**Síntese:** 4 stories atingiram a 3.ª iteração CR (vs 1 no Epic 2). Destas, 3 fecharam com CR verde após autorização (3.1, 3.7, 3.9) e 1 fechou via waiver (3.10). O hard-stop §8 (máx 2 iter) funcionou — forçou escalação humana em todas as 4.

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Story 3.1 merged (PR #30 `06e3cfb6`) | 21/05/2026 |
| Story 3.11 merged (PR #40 `e77b0fea`) | 28/05/2026 20:59 |
| Closure commit Epic 3 (`c11ec286`) | 28/05/2026 21:20 |
| **Duração total** | **~8 dias corridos** |
| Stories/dia (média) | 1,375 |
| Dias mais densos | 21/05 (3.1+3.2), 22/05 (3.3+3.4+3.5), 28/05 (3.8+3.9+3.11) |

> Epic 3 foi mais lento que o Epic 2 (~8 dias vs ~6 dias) — coerente com a introdução de domínio de cálculo financeiro de risco (Architect Gate com revisão manual) e com o maior número de iterações CR.

### 2.4 — Cronologia de merges em main

| Story | PR | Squash commit | Data de merge |
|-------|-----|---------------|---------------|
| 3.1 — Schema finanças | #30 | `06e3cfb6` | 21/05/2026 |
| 3.2 — Categorias default PT | #31 | `25fce8a8` | 21/05/2026 |
| 3.3 — CRUD transações variáveis | #32 | `1a48855a` | 22/05/2026 |
| 3.4 — CRUD recorrências | #33 | `54d7f851` | 22/05/2026 |
| 3.5 — CRUD cartões | #34 | `51074f28` | 22/05/2026 |
| 3.6 — Compras parceladas | #35 | `7be125f4` | 23/05/2026 |
| 3.7 — Vista "Este mês" | #36 | `deac687b` | 24/05/2026 |
| 3.10 — Geração diária | #37 | `54454a71` | 25/05/2026 |
| 3.8 — Vista cartões | #38 | `b30e781a` | 28/05/2026 |
| 3.9 — Vista património | #39 | `adf62343` | 28/05/2026 |
| 3.11 — Tools cérebro finanças | #40 | `e77b0fea` | 28/05/2026 |

> Ordem de merge ≠ ordem numérica: a 3.10 (geração diária) foi mergeada antes da 3.8 e 3.9 (vistas), porque depende apenas das 3.4 + 3.6 e era paralelizável com as vistas. Reflecte a paralelizabilidade documentada em `EPIC-3.md` §10.

### 2.5 — Evolução da suite de testes

| Marco | Testes (test:unit) | Fonte |
|-------|--------------------|-------|
| Story 3.1 (início Epic 3, pós Iter 1) | 728/728 | Story 3.1 Dev Agent Record |
| Story 3.1 (pós Iter 2) | 753/753 | Story 3.1 Change Log |
| Story 3.2 | 766/766 | Story 3.2 QA Results |
| Story 3.3 (pós CR Iter 2) | 799/799 | Story 3.3 Change Log |
| Story 3.4 (pós CR Iter 1) | 825/825 | Story 3.4 Change Log |
| Story 3.5 | 837/837 | Story 3.5 Change Log |
| Story 3.6 | 853/853 | Story 3.6 Dev Agent Record |
| Story 3.7 | 886/886 | Story 3.7 Change Log |
| Story 3.10 (pós CR Iter 2) | 913/913 | Story 3.10 Change Log |
| Story 3.8 (pós CR Iter 2 completion) | 941/941 | Story 3.8 QA Results |
| Story 3.9 (pós CR Iter 3) | 962/962 | Story 3.9 Change Log |
| **Story 3.11 (estado final em main)** | **988/988** | Story 3.11 Change Log |

**Delta Epic 3: +260 testes** (728 → 988). Crescimento de ~36% na suite ao longo do epic.

### 2.6 — Cobertura

Todas as stories cumpriram NFR17 (>=60% em packages core) e os thresholds AC por story. Exemplos verificados nos quality gates:
- Story 3.1 — 100% lines nos 7 ficheiros do domínio financeiro (`accounts.ts`, `cards.ts`, `transactions.ts`, `installments.ts`, `categories.ts`, `schemas.ts`, `formatCurrency.ts`).
- Story 3.6 — `installmentSplit.ts` 100% (lines/branches/functions/statements).
- Story 3.7 — `monthAggregations.ts` 100%.
- Story 3.11 — `finance.ts` 98,68%.

O débito D-3.2-1 (domínio `lib/financas/**` ausente do `coverage.include`) foi resolvido pela Story 3.3 com evidência local válida no Not-Tested Evidence Gate — desde então toda a cobertura de finanças é visível no report padrão.

---

## 3. Loved — o que funcionou bem

### 3.1 — Reuso de motor genérico entre epics: a aposta do Epic 2 pagou-se

A Story 2.7 (Epic 2) entregou `runRecurrenceEngine` genérico por `ownerType`. O Epic 3 estendeu-o com `generateTransactionInstances` + `runFinanceRecurrenceEngine` (Story 3.4) **sem modificar o motor base** — confirmado no QA Gate da 3.4 ("Reuso do motor da Story 2.7 confirmado — `runRecurrenceEngine` não modificado"). A Story 3.1 confirmou em código que a tabela `recurrences` (Story 2.1) era genérica por `ownerType: 'transaction'` (resolução do `[GAP-3.1]`, risco R2 fechado) — não recriou tabela. A decisão arquitectural de motor genérico no Epic 2 evitou duplicação de lógica de recorrência no Epic 3.

### 3.2 — Architect Gate com revisão manual de cálculos apanhou o risco financeiro

O Epic 3 introduziu cálculo numérico de risco pela primeira vez. As stories de cálculo (3.6 parceladas, 3.7 agregações, 3.8 fatura) tiveram `@architect` (Aria) como quality gate com revisão manual obrigatória (`EPIC-3.md` §9). **Evidência:** o Architect Gate da 3.6 cruzou 6 inputs a olho, incluindo o caso canónico €1.200/12 = €100 (AC1) e o não-divisível €100/3 (invariante de soma exacta). Zero erros de cálculo financeiro chegaram a produção. A escalação correcta de gate (cálculo → `@architect`, não `@qa`) respeitou `separation-of-roles.md` A6.

### 3.3 — Padrão first-iter consolidado: 11/11 stories QA Gate PASS

Todas as 11 stories passaram o quality gate AIOX à primeira (0 `qa-loop-fix`). Prolonga o padrão do Epic 1 (1.5-1.10) e Epic 2 (2.1-2.10). **Evidência:** secção QA Results / Validação PO de cada story em `completed/` — todas indicam PASS first-iter. O pipeline `@sm` draft → `@po` validate → executor develop está calibrado: as stories chegam ao gate sem retrabalho de gate.

### 3.4 — Reuso de padrões de UI reduziu retrabalho (helpers puros + modais)

O padrão "helper puro testável em `lib/financas/**` + modal/lista fina + tab strip estendido" foi replicado de story em story: `currencyInput.ts` (3.3) → `balanceInput.ts` (3.5) → `installmentSplit.ts` (3.6) → `monthAggregations.ts` (3.7) → `cardBilling.ts` (3.8) → `patrimonyAggregations.ts` (3.9). Cada helper puro atingiu ~100% de cobertura. **Evidência:** Dev Notes de cada story de UI referenciam explicitamente "paridade com `lib/financas/currencyInput.ts` (Story 3.3)". A extracção de lógica para funções puras tornou o risco financeiro testável sem DOM.

### 3.5 — Reconciliação PRD ↔ arquitectura feita à cabeça (Story 3.1) e GAP resolvido por verificação, não suposição

O `[GAP-3.1]` (tabela `recurrences` genérica o suficiente para finanças?) foi explicitamente marcado no `EPIC-3.md` §7 para resolução no draft — **não preenchido com suposição** (Constitution Artigo IV). A Story 3.1 verificou em código (`types/db.ts:84` — `ownerType` já contém `'transaction'`) e confirmou reutilização sem extensão. O schema Dexie `version(3)` foi aditivo (não reescreveu `version(1)`/`version(2)`), preservando o upgrade path dos dados do Eurico em produção.

### 3.6 — Aplicação efectiva das acções das retrospectivas anteriores

| Acção anterior | Estado no Epic 3 |
|----------------|------------------|
| A2 Epic 1 / A2 Epic 2 — Not-Tested Evidence Gate | Aplicada. Story 3.3 tocou `vitest.config.ts` (`coverage.include`, path bloqueador) e anexou evidência local prévia (`npm run test:coverage` a mostrar `lib/financas/**`) ao Not-Tested Evidence Gate. Resolveu o débito D-3.2-1 com a regra cumprida. |
| A6 Epic 1 — `separation-of-roles.md` | Aplicada em 11/11 stories. Casos: schema → gate `@architect` (3.1); UI → executor `@ux-design-expert`, gate `@dev` (3.3, 3.7, 3.8, 3.9); cálculo → gate `@architect` (3.6, 3.10, 3.11). |
| A1 Epic 1 — `mock-protocol-fidelity.md` | Avaliada N/A na maioria (CRUD interno) — mas a Story 3.11 (tools cérebro) aplicou-a com a DEV-DECISION D-MOCK: AC4 validado contra `fake-indexeddb` real em vez de mock, "evita risco mock-SSE". A Story 3.1 usou `NexusDBV2Only` como honest mock literal do estado anterior para o teste de upgrade. |
| A1 Epic 2 — checklist a11y reforçado no QA Gate | Aplicada nas stories de UI (3.7, 3.8, 3.9) — AC8/a11y reforçado (aria-label, role="img", aria-live, não-só-cor). |

**O ciclo retrospectiva → regra → aplicação continua a produzir resultados.** É a 2.ª confirmação consecutiva (Epic 2 foi a 1.ª).

---

## 4. Os débitos não-bloqueadores acumulados

Todos registados em `EPIC-3.md` §8. Nenhum é bloqueador. 1 resolvido durante o epic, 6 abertos.

| # | Débito | Severidade | Origem | Estado / Recomendação |
|---|--------|-----------|--------|----------------------|
| D-3.2-1 | `vitest.config.ts` → `coverage.include` não incluía `lib/financas/**` | Baixa | Story 3.2 CONCERN-1 (`@qa`) | **RESOLVIDO pela Story 3.3** (AC12) — `'lib/financas/**'` adicionado com evidência local. Fechado. |
| D-3.3-1 | `TransactionFormModal.tsx:275` — `error={errors.amount}` inerte (mapeamento defensivo nunca populado) | Baixa | Story 3.3 obs. LOW (`@qa`) | Housekeeping — absorver por story de UI que toque o modal. |
| D-3.4-1 | Falta teste que asserte que transações já geradas sobrevivem a `deleteFinanceRecurrence` (código já correcto) | Baixa | Story 3.4 concern C1 (`@qa`) | **Parcialmente endereçado** — a Story 3.4 CR Iter 1 adicionou T7b ("transações sobrevivem ao delete"). Confirmar se fecha o débito. |
| D-3.4-2 | `FinanceRecurrenceFormModal.tsx:247` — copy "Tarefa recorrente" herdada do contexto de tarefas | Baixa | Story 3.4 concern C2 (`@qa`) | Ajustar copy para terminologia financeira. Housekeeping. |
| D-3.5-1 | Referências órfãs — apagar conta/cartão deixa transações com `accountId`/`cardId` órfão (schema-válido, `nullable`) | Baixa | Story 3.5 concern C1 (`@qa`) | Vistas 3.8/3.9 tratam graciosamente ("Conta desconhecida"). Housekeeping de limpeza. |
| D-3.5-2 | Tab strip `/financas` sem roving tabindex / navegação por setas (só Tab-key) | Baixa | Story 3.5 concern C2 (`@qa`) | a11y parcial — afecta 3.4 + 3.5. Candidato a housekeeping de a11y conjunto. A Story 3.8 **não** absorveu (sub-rota separada). |
| D-3.5-3 | `Field` + `inputStyle` duplicados nos 4 modais de finanças | Baixa | Story 3.5 concern C3 (`@qa`) | Extrair `components/financas/FormField.tsx` partilhado. Story técnica dedicada. |

**Observações LOW sem débito formal (Story 3.6):** sentinela `cardId=''` no FormState (herdada da 3.5) e full-table-scan em `deleteInstallmentCascade` por `installmentId` não-indexado em `version(3)`. Coerentes com precedentes, sem acção registada.

**Síntese:** 7 débitos Baixa (1 resolvido, 6 abertos). **Nenhum é Média ou Alta.** Contraste com o Epic 2, que fechou com 2 débitos Média (D6, D7). O Epic 3 não gerou débitos de severidade média — sinal de maturidade do domínio CRUD + cálculo. Os 6 débitos Baixa abertos do Epic 3 + os herdados do Epic 2 (D6, D7 Média ainda fora-de-scope) compõem o backlog de manutenção. **A oportunidade de uma story técnica de housekeeping de finanças (D-3.3-1, D-3.4-2, D-3.5-1/2/3) é forte** — 5 dos 6 débitos abertos do Epic 3 são absorvíveis numa única story de limpeza de UI/a11y.

---

## 5. Learned — lições do epic

### 5.1 — Quatro stories na 3.ª iteração CR: o salto vs Epic 2 e o padrão "Iter 3 só com autorização"

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 3.1, 3.7, 3.9 (Iter 3 com CR verde) + 3.10 (Iter 3 com merge waived) |
| **Sintoma** | 4/11 stories atingiram a 3.ª iteração CR (vs 1/10 no Epic 2). A 3.10 foi a única a fechar via waiver. |
| **Causa raiz (por story)** | **3.1** — schema/DAL com 13+ findings na Iter 1 (story fundacional, mais superfície). **3.7** — bug real `getProjectionWindow` (`days` vs `days-1`) + refactor DST-safe pedido pelo CR como nitpick. **3.9** — CR exigiu unit tests para `PatrimonioPage` (Iter 1 Major) + cobertura do 3.º tipo de conta `cash` (Iter 3). **3.10** — 2 nits doc/coverage simétrica na Iter 2 + erro aritmético na contagem de testes do story file (Iter 3). |
| **Padrão positivo** | Em **todas** as 4, o hard-stop §8 (máx 2 iter) forçou escalação humana. A Iter 3 só aconteceu com autorização explícita do Eurico (trailer `Authorized-by:` ou `AUTHORIZATION-§8`). O mecanismo de controlo funcionou — nunca houve loop infinito. |
| **Padrão preocupante** | 3 das 4 Iter-3 (3.7, 3.9, 3.10) foram desencadeadas por findings **só no ficheiro de teste ou em doc** (cobertura `cash`, IDs determinísticos, contagem de testes, MD lint), não por bugs de produção. O CR está a gastar iterações em nitpicks de teste/doc que o quality gate AIOX não previu. |
| **Acção** | Ver **A1** (afinar `.coderabbit.yaml` para test/doc nitpicks) + **A2** (checklist de teste/doc no QA Gate) |

### 5.2 — A Story 3.9 e a política "componentes React sem unit tests" colidiu com o CodeRabbit

| Item | Detalhe |
|------|---------|
| **Onde** | Story 3.9 (Vista património), CR Iter 1, 27/05/2026 |
| **Sintoma** | O Epic 3 estabeleceu (Stories 3.3-3.7) a policy "componentes React validados via `@architect`/`@dev` gate + CR server-side, sem unit tests próprios". O CodeRabbit Iter 1 da 3.9 deu um **Major** exactamente por isso: "sem unit tests para `PatrimonioPage`". A 3.9 teve de criar `page.test.tsx` (5 cenários C1-C5) na Iter 2 e alargar na Iter 3. |
| **Contraste** | Na Story 3.6, o mesmo finding do CR (Fix #3 "add unit tests for handlers in page.tsx") foi **defendido como policy do Epic 3** e aceite via reply (outside-diff). Na 3.9, o CR insistiu e a equipa cedeu — criou os testes. |
| **Lição** | A policy "componentes sem unit tests" não é estável face ao CodeRabbit. Quando a page tem lógica de view não-trivial (loading/empty/content/toggle/overdraft como na 3.9), o CR trata a ausência de testes como Major e não recua. A policy serve para componentes triviais; pages com estados múltiplos beneficiam de testes de componente. **Não há uma regra clara de quando a policy se aplica** — foi decidido caso-a-caso, gerando inconsistência (3.6 sem testes de page, 3.9 com testes de page). |
| **Acção** | Ver **A3** (formalizar o critério "page com N estados → exige teste de componente") |

### 5.3 — Nomes de tools ASCII vs cedilha: contrato externo do registry impôs-se ao PRD

| Item | Detalhe |
|------|---------|
| **Onde** | Story 3.11 (Tools cérebro finanças), DEV-DECISION D-NAMES, 28/05/2026 |
| **Sintoma** | O PRD §6.3 FR23 e o `EPIC-3.md` §4 listavam os nomes das tools com cedilha (`criar_finança_variavel`, `consultar_balanço`). O `TOOL_NAME_PATTERN` do Tool Registry + a Anthropic tool spec rejeitam caracteres não-ASCII em nomes de tools. |
| **Resolução** | DEV-DECISION D-NAMES — nomes ASCII (`criar_financa_variavel`, `consultar_balanco`), ratificada pela Aria no Architect Gate. Os AC1/AC5/AC6 da story foram reconciliados (cedilha → ASCII) na CR Iter 1. O mapeamento semântico PT-PT (utilizador escreve "balanço", o LLM mapeia para `consultar_balanco`) vive no LLM (DEV-DECISION D-FUZZY), não na tool. |
| **Lição** | Quando um FR especifica um identificador que tem de cruzar um contrato externo (aqui: o `TOOL_NAME_PATTERN` + spec Anthropic), o contrato externo prevalece sobre a grafia do PRD. A divergência foi resolvida correctamente — `@dev` sinalizou (`FLAG @architect`), `@architect` ratificou, os AC foram reconciliados. Mas o PRD/EPIC tinha nomes inválidos desde o início — o `@pm`/`@sm` poderiam ter validado os nomes contra o `TOOL_NAME_PATTERN` no draft da story (precedente: Story 2.10 já tinha registado tools no registry). |
| **Acção** | Ver **A4** (validar identificadores contra contratos externos no draft de stories de tools/integração) |

### 5.4 — A meta interna de 0% waiver não foi atingida — a Story 3.10

| Item | Detalhe |
|------|---------|
| **Onde** | Story 3.10 (Geração diária), merge, 25/05/2026 |
| **Sintoma** | `EPIC-3.md` §8 fixou alvo <2/11 (atingido com 1/11) **mas com meta interna de 0%, igualando o Epic 2**. A Story 3.10 quebrou o 0% — merge waived na CR Iter 3 com 2× `AUTHORIZATION-§8`. |
| **Análise** | O finding da Iter 3 que levou ao waiver foi **um erro aritmético na contagem de testes no story file** (header dizia "17 testes", soma dos grupos era 19) + 1 duplicate sobre Change Log histórico (não aplicável — alterar Change Log reescreve história). Zero CRITICAL/HIGH. Todos os gates técnicos verdes. O waiver foi uma decisão consciente do Eurico para não gastar uma 4.ª iteração num finding trivial de doc. |
| **Lição** | O único waiver do epic não foi por código — foi por um nitpick de contagem de testes no próprio story file. Tal como na §5.1, o CodeRabbit gastou iterações em metadados de documentação, não em qualidade de código. A decisão de waiver foi correcta (custo/benefício), mas evidencia que **a contagem de testes mantida manualmente no story file é uma fonte recorrente de findings CR** — apareceu na 3.10 (aritmética) e na 3.8 (reclassificação de contagens). |
| **Acção** | Ver **A5** (deixar de manter contagens de teste exactas no corpo do story file, ou automatizá-las) |

### 5.5 — Atomicidade no repo replicada e estendida (padrão da Story 3.4 → 3.6)

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 3.4 (`deleteFinanceRecurrence`) e 3.6 (`createInstallmentWithTransactions` + `deleteInstallmentCascade`) |
| **Resolução** | A Story 3.4 estabeleceu o padrão "cascata atómica `db.transaction('rw', ...)` no repo, não na page" (CR Iter 1 #I3). A Story 3.6 replicou-o e estendeu-o para a geração+eliminação de N transações de uma parcelada, mantendo a regra de repo-isolation da page (zero `db.*` directos na page). |
| **Lição** | Padrões de atomicidade transaccional, uma vez validados num quality gate, propagam-se limpa­mente entre stories do mesmo domínio. A regra de repo-isolation (toda a orquestração de `db.transaction` vive no repo) provou-se sólida — manteve as pages finas e testáveis. Não requer acção; é um padrão a preservar nos epics CRUD futuros (Epic 4). |

---

## 6. Lacked — o que faltou

### 6.1 — Sem critério estável para "componente React exige teste"

A policy "componentes sem unit tests" foi aplicada inconsistentemente (3.6 sem, 3.9 com, sob pressão do CR). Falta um critério objectivo. — **Acção A3**.

### 6.2 — Contagens de teste mantidas à mão no story file geram findings CR recorrentes

As contagens exactas de testes no corpo do story file (header de secções, File List) desincronizam-se e o CodeRabbit apanha-as como findings (3.10 waiver, 3.8 reclassificação). — **Acção A5**.

### 6.3 — Identificadores do PRD não validados contra contratos externos antes do draft

Os nomes das tools FR23 (com cedilha no PRD) eram inválidos para o registry/Anthropic spec — só descoberto na implementação da 3.11. — **Acção A4**.

### 6.4 — CodeRabbit gasta iterações em nitpicks de teste/doc que o QA Gate não prevê

3 das 4 Iter-3 (3.7, 3.9, 3.10) foram por findings de teste/doc, não de produção. Há um gap entre o que o QA Gate verifica e o que o CR exige em cobertura de teste e lint de markdown. — **Acções A1 + A2**.

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion), tal como nas Retrospectivas Epic 1 (A1/A3/A6) e Epic 2. `@po` (Pax) propõe; `@aiox-master` cria a regra. Acções de config (`.coderabbit.yaml`), template (`story-tmpl.yaml`) e processo são executadas pelos owners indicados.

| # | Acção | Owner | Requer nova regra / actualização `.claude/rules/`? | Deadline | Done quando |
|---|-------|-------|----------------------------------------------------|----------|-------------|
| **A1** | Afinar `.coderabbit.yaml` para reduzir findings de severidade Major/CHANGES_REQUESTED em nitpicks de **ficheiro de teste e markdown** (contagens, IDs de teste determinísticos, MD lint), que desencadearam 3 das 4 Iter-3 do epic. Objectivo: baixar a média de iterações CR para perto da do Epic 2. | `@devops` (Gage) | NÃO — config CodeRabbit | **Antes do Epic 4** | `.coderabbit.yaml` ajustado + 1ª story de UI do Epic 4 fecha em <=2 iter CR |
| **A2** | Adicionar ao checklist do QA Gate / Architect Gate uma verificação explícita de **cobertura de teste e consistência de doc** que o CodeRabbit tipicamente exige (page com estados múltiplos → teste de componente; contagens de teste coerentes; MD lint do story file). Objectivo: o gate AIOX apanhar antes do CR. | `@qa` (Quinn) + `@architect` (Aria) | Possível — actualização do checklist do QA Gate (não é regra `.claude/rules/`; é processo de gate). Avaliar com `@aiox-master` se justifica formalizar. | **Antes do Epic 4** | Checklist de gate inclui a verificação + 1 story do Epic 4 fecha sem finding CR de teste/doc |
| **A3** | Formalizar o critério "**quando um componente React exige teste de componente**" — proposta: page/componente com >=3 estados de render distintos (loading/empty/content/erro/toggle) exige teste; componente trivial não. Resolve a inconsistência 3.6 (sem) vs 3.9 (com). | **`@aiox-master` (Orion)** — **NOVA REGRA** ou actualização de regra de teste; `@po` propõe, `@aiox-master` cria | **SIM — a executar por `@aiox-master`** (nova regra ou secção em regra de testes existente) | **Antes do Epic 4** | Regra/critério existe em `.claude/rules/` + 1 story de UI do Epic 4 aplica-o sem ambiguidade |
| **A4** | Adicionar ao processo de draft de stories que registam **tools/identificadores que cruzam contratos externos** (Tool Registry `TOOL_NAME_PATTERN`, Anthropic spec, APIs) a obrigação de validar os identificadores contra o contrato **no draft**, não na implementação. Evita o re-trabalho de reconciliação de AC da Story 3.11 (cedilha → ASCII). | `@sm` (River) + **`@aiox-master` (Orion)** se gerar regra | **A AVALIAR por `@aiox-master`** — pode ser secção no `story-tmpl.yaml` (owner `@sm`) ou regra formal; `@po` recomenda secção de template primeiro | **Antes do Epic 6 (OAuth/integrações)** | Template/regra exige a validação + a 1ª story de tools/integração aplica-a |
| **A5** | Deixar de manter **contagens exactas de testes no corpo do story file** (header de secções, descrições) — ou automatizá-las. As contagens manuais desincronizam-se e o CodeRabbit apanha-as (waiver da 3.10, reclassificação da 3.8). Proposta: a contagem vive só no Change Log/Dev Agent Record como snapshot datado, não repetida em headers de secção. | `@sm` (River) | A AVALIAR — convenção de `story-tmpl.yaml` (não regra `.claude/rules/`). `@aiox-master` decide se formaliza. | **Antes do Epic 4** | Convenção de template alterada + 1 story do Epic 4 fecha sem finding CR de contagem de testes |
| **A6** | Decidir o destino dos **6 débitos Baixa abertos do Epic 3** (D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1, D-3.5-2, D-3.5-3): 5 são absorvíveis numa **story técnica de housekeeping de UI/a11y de finanças** (FormField partilhado + roving tabindex + copy + referências órfãs + error inerte). Avaliar criar essa story ou integrá-la no arranque do Epic 4. | `@pm` (Morgan) + `@po` (Pax) | NÃO — decisão de backlog/scope | **No arranque do Epic 4** | Os 6 débitos têm destino (story técnica criada ou backlog confirmado) |
| **A7** | Reavaliar os débitos Média herdados do Epic 2 — **D6** (delete projecto cascata) e **D7** (fallback intent PT-BR). A decisão A4 do Epic 2 deixou-os fora-de-scope do Epic 3 (correctamente). No arranque do Epic 4 (domínio CRUD afim a tarefas/projectos), D6 é candidato natural; D7 continua candidato a hotfix. | Eurico + `@pm` (Morgan) | NÃO — decisão de scope/hotfix | **No arranque do Epic 4** | D6 e D7 têm destino reconfirmado (story, epic-slot ou hotfix agendado) |
| **A8** | Memory log: actualizar a entrada de memória do Nexus v2 com Epic 3 = 11/11 Done, waiver rate 1/11, PRs #30-#40, closure commit `c11ec286`, e referência a esta retrospectiva. | `@aiox-master` (Orion) ou Eurico | NÃO — memória | **28/05/2026** | MEMORY.md actualizado + entrada com ref a este documento |
| **A9** | Eurico + `@pm` decidem o próximo epic: **Epic 4** (Hábitos + Metas + Lembretes) é o sucessor natural (ordem PRD §9 `2 \|\| 3 → 4`; reutiliza `runRecurrenceEngine` genérico por `ownerType` para hábitos/lembretes recorrentes). | Eurico + `@pm` (Morgan) | NÃO — decisão de roadmap | **Próxima sessão** | Epic escolhido → `@pm *create-epic 4` |

### Acções que requerem `@aiox-master` (Orion) — resumo

> **Executadas por Orion (`@aiox-master`) em 29/05/2026.** Ficheiros pendentes de commit+push por `@devops`.

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A3** | **NOVA REGRA** criada: `.claude/rules/react-component-test-criteria.md` — critério objectivo (>= 3 estados de render → teste de componente obrigatório), com secção de Aplicação no QA Gate | **EXECUTADA** — regra criada |
| **A4** | **NOVA REGRA** criada: `.claude/rules/external-contract-identifiers.md` — validar identificadores (tool names, API fields, enums) contra o contrato externo no draft. Rota template `@sm` (`story-tmpl.yaml`) bloqueada pela fronteira L2 (template framework protegido) → regra formal foi o caminho correcto | **EXECUTADA** — regra criada |
| **A2** | **SEM regra separada** (evita redundância — `synapse-domain-governance`). A vertente "teste de componente" ficou formalizada na regra A3 (secção QA Gate); adicionado check 8 ao QA Gate em `.claude/rules/story-lifecycle.md` a apontar para A3 + convenção A5 | **EXECUTADA** — `story-lifecycle.md` actualizado |
| **A5** | **SEM regra nova** — convenção adicionada a `.claude/rules/story-lifecycle.md` (secção "Test Count Convention": contagens exactas só no Change Log/Dev Record como snapshot datado, nunca em headers/File List). Template `story-tmpl.yaml` é L2 protegido → a regra de projecto foi o local correcto | **EXECUTADA** — `story-lifecycle.md` actualizado |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. A criação/alteração de `.claude/rules/` é autoridade de `@aiox-master` (precedente Epic 1: `mock-protocol-fidelity.md`, `not-tested-trailer-rules.md`, `separation-of-roles.md`).

---

## 8. Comparação Epic 1 vs Epic 2 vs Epic 3

| Métrica | Epic 1 | Epic 2 | Epic 3 | Tendência |
|---------|--------|--------|--------|-----------|
| Stories | 10 (1.1-1.10) | 10 (2.1-2.10) | 11 (3.1-3.11) | +1 |
| Duração | 7 dias | ~6 dias | ~8 dias | +2 dias vs Epic 2 |
| Waiver rate ("merge waived") | 50% (5/10) | **0% (0/10)** | **9,1% (1/11)** | subiu vs Epic 2, muito abaixo do Epic 1 |
| Quality gate PASS first-iter | — (não medido) | 10/10 | **11/11** | mantido |
| Stories na 3.ª iter CR | 1 (1.10, 5 iter) | 1 (2.6) | **4** (3.1, 3.7, 3.9, 3.10) | subiu |
| Iter 3 com autorização humana | — | 1 | 4 | hard-stop §8 a funcionar |
| Bugs produção pós-deploy dentro do epic | 0 (1 hotfix fora) | 0 (D7 detectado) | **0** | mantido |
| ADRs base reabertos | 0 | 0 | 0 | igual |
| ADRs locais criados | — | 1 (ADR-2.7-1) | 0 (reutilizou ADR-2.7-1) | — |
| Débitos Média/Alta gerados | — | 2 (D6, D7) | **0** | melhoria |
| Erros de cálculo financeiro em produção | n/a | n/a | **0** | Architect Gate funcionou |
| Acções da retrospectiva anterior aplicadas | n/a | A1, A2, A6 | A2, A6, A1, a11y | ciclo validado 2× |

**Conclusão da comparação:** o Epic 3 foi mais lento e teve mais iterações CR que o Epic 2 — explicável pela introdução de cálculo financeiro de risco e por nitpicks de teste/doc do CodeRabbit (não por qualidade de código). Mas manteve 0 bugs de produção, 0 erros de cálculo, 11/11 first-iter PASS, e **0 débitos de severidade média/alta** (vs 2 no Epic 2). O único waiver (3.10) foi por um nitpick de contagem de testes, não por código. O salto de iterações CR é o sinal mais claro para acção (A1, A2, A5).

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — faz push do closure commit desta retrospectiva (docs-only). O closure commit do Epic 3 (`c11ec286`) já está em main; esta retrospectiva é um commit docs adicional.
2. **`@aiox-master` (Orion) ou Eurico** — executa **A8**: actualiza memória com Epic 3 = 11/11 Done.
3. **`@aiox-master` (Orion)** — executa **A3** (nova regra: critério teste de componente) e avalia **A2/A4/A5** (formalização).
4. **`@devops` (Gage)** — executa **A1**: afina `.coderabbit.yaml`.
5. **`@pm` (Morgan) + `@po` (Pax)** — executam **A6** e **A7** no arranque do Epic 4: destino dos 6 débitos Baixa do Epic 3 + D6/D7 do Epic 2.
6. **Eurico + `@pm` (Morgan)** — executam **A9**: decidem próximo epic → `@pm *create-epic 4`.

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Decisões A1-A9 com owner + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, não de implementação — não tem quality gate sobre si mesma |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master` (A3/A4) — `@po` propõe, não cria — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real, `EPIC-3.md`, stories `completed/3.1-3.11.story.md`, handoff de retrospective. Onde uma métrica não existia nas fontes, não foi inventada |

---

**Documento criado por:** Pax (`@po`) em 28/05/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #30-#40 + closure `c11ec286`)
- `imersao-tools/nexus/docs/EPIC-3.md` (11/11 COMPLETO, §5 progresso, §8 débitos, §9 quality gates, §10 fecho)
- `imersao-tools/nexus/docs/stories/completed/3.1-3.11.story.md` (Change Logs, QA Results, Architect/QA Gates, contagens de teste, iterações CR)
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260528-epic-3-completo-closure-push-pendente-retrospective.md`
- `imersao-tools/nexus/docs/retrospectives/EPIC-1-retrospective.md` + `EPIC-2-retrospective.md` (referência de formato e baseline comparativa)
