# Architect Gate — Story 3.1 (Schema finanças — Data Access Layer Dexie v3)

**Quality gate de implementação:** Aria (`@architect`)
**Data:** 2026-05-21
**Story:** `imersao-tools/nexus/docs/stories/active/3.1.story.md` v1.2 (Status Ready for Review)
**Branch:** `feature/3.1-schema-financas` — commits `82b07ea4` (código) + `c3ccf397` (handoff bookkeeping)
**Merge-base:** `430f4c26` (= `main` HEAD — branch partiu de `main` actual; sem divergência)
**Executor:** Dara (`@data-engineer`) — `*develop 3.1`
**Veredicto:** **PASS** — Story `Ready for Review → Done`.

> Trace de autoridade: `separation-of-roles.md` (A6) — schema/DDL é domínio do `@data-engineer`, logo o quality gate de implementação sobe para `@architect`. `@architect` valida; não implementou — separação cumprida. Coerente com `EPIC-3.md` §5 e `3.1.story.md` Executor Assignment (`quality_gate: @architect`).

---

## 0. Sumário executivo

A Story 3.1 é a story de fundação do Epic 3 (Finanças) e bloqueia as 10 stories seguintes (3.2-3.11). É a terceira story de schema do Nexus v2 (depois de 1.1 e 2.1) e replica fielmente o padrão Data Access Layer maduro da Story 2.1.

O gate reproduziu os 5 quality gates locais de forma **independente** (não aceitou o relatório da Dara como prova), verificou os 18 ACs directamente contra o código real, avaliou os 4 [AUTO-DECISIONS] e os 3 desvios reportados, e confirmou conformidade com os ADRs do Nexus v2.

**Resultado: PASS.** 18/18 ACs honrados. 5/5 quality gates reproduzidos com os mesmos números do relatório. Schema `version(3)` aditivo e correcto. [AUTO-DECISION] A4 (índice `[cardId+date]`) é um upgrade Dexie seguro, provado por teste. Zero invenção. Nenhum concern bloqueador.

---

## 1. Quality gates reproduzidos independentemente (AC17, AC18)

> Executados pelo `@architect` em `imersao-tools/nexus/v2/` na branch `feature/3.1-schema-financas`. Números registados directamente do output, não copiados do relatório da Dara.

| Gate | Comando | Resultado reproduzido | Relatório Dara | Confere? |
|------|---------|-----------------------|----------------|----------|
| ESLint | `npm run lint` | **0 erros**; 1 warning preexistente `app/api/auth/logout/route.ts:1:23` (`NextResponse` unused) — fora de scope | 0 erros, 1 warning preexistente | SIM |
| TypeScript | `npm run typecheck` | **exit 0** (`tsc --noEmit`) | exit 0 | SIM |
| Testes unitários | `npm run test:unit` | **728/728 PASS**, 59 ficheiros, duração ~21,6s | 728/728, 59 ficheiros | SIM |
| Build | `npm run build` | **exit 0** (`next build`) — 19 rotas compiladas | PASS | SIM |
| Coverage financeiro | `npm run test:coverage` | Ver tabela §1.1 | 100% lines nos 7 ficheiros; branch 98,76% global financeiro | SIM |

### 1.1 Coverage por ficheiro do domínio financeiro (AC18 — alvo >= 80% lines)

| Ficheiro | % Stmts | % Branch | % Funcs | % Lines | Alvo AC18 |
|----------|---------|----------|---------|---------|-----------|
| `lib/db/client.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/schemas.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/repos/accounts.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/repos/cards.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/repos/categories.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/repos/installments.ts` | 100 | 100 | 100 | **100** | >= 80 PASS |
| `lib/db/repos/transactions.ts` | 100 | 96,66 | 100 | **100** | >= 80 PASS |

Coverage global do projecto: 90,21% lines / 88,72% branch. Todos os 7 ficheiros financeiros atingem 100% lines — largamente acima do alvo AC18 (>= 80%). A única lacuna de branch é `transactions.ts:73` (ramo `dateFrom`), 96,66% branch — não-bloqueante, lines a 100%.

**Conclusão §1: 5/5 quality gates PASS. Os números do relatório da Dara conferem byte-a-byte com a reprodução independente.**

---

## 2. Verificação dos 18 Acceptance Criteria contra o código real

> Cada AC verificado abrindo o ficheiro real. Path + linhas como evidência.

| AC | Evidência (path:linhas) | Veredicto |
|----|-------------------------|-----------|
| AC1 — `version(3).stores({...})` aditivo, sem reescrever `version(1)`/`version(2)` | `client.ts:73-87` (`version(1)` literal intacto), `client.ts:98-101` (`version(2)` literal intacto), `client.ts:117-124` (`version(3)` novo) | PASS |
| AC2 — 4 propriedades novas na classe `NexusDB`; `transactions` não re-declarada como propriedade | `client.ts:56-59` (`accounts`/`cards`/`installments`/`categories`); `transactions` já em `client.ts:55` (version 1) — não duplicada | PASS |
| AC3 — índices `version(3)` literais + PK `categories.name` | `client.ts:118-123` — `accounts: 'id, type, createdAt'`, `cards: 'id, accountId, closingDay, dueDay'`, `installments: 'id, cardId, startDate, [cardId+startDate]'`, `categories: 'name, isDefault'` | PASS |
| AC4 — comentário `client.ts` actualizado com trace `version(3)` + [GAP-3.1] + A4 | `client.ts:24-48` (header) + `client.ts:102-116` (bloco `version(3)`) — trace completo incluindo A3/A4 | PASS |
| AC5 — `schemas.ts` estendido com 5 schemas Zod financeiros, mensagens PT-PT, `amount` inteiro | `schemas.ts:99-177` — `AccountSchema`, `CardSchema`, `TransactionSchema`, `InstallmentSchema`, `CategorySchema` + `AccountTypeSchema`. `TransactionSchema.amount` = `z.number().int(...)` (`schemas.ts:145`) | PASS |
| AC6 — `repos/accounts.ts` CRUD + `updateBalance` delta atómico, erro PT-PT | `accounts.ts:19-70` — 6 funções; `updateBalance` em `db.transaction('rw', ...)` (`accounts.ts:56-66`), `Error` PT-PT se conta inexistente (`accounts.ts:60-62`) | PASS |
| AC7 — `repos/cards.ts` CRUD + `listCardsByAccount` | `cards.ts:16-52` — 6 funções; `listCardsByAccount` via índice `accountId` (`cards.ts:38-41`) | PASS |
| AC8 — `repos/transactions.ts` CRUD + `listTransactions` 7 filtros, ordem desc por `date`, cêntimos | `transactions.ts:17-93` — filtros `accountId`/`cardId`/`category`/`dateFrom`/`dateTo`/`recurrenceId`/`installmentId` (`transactions.ts:67-76`); ordem `b.date.localeCompare(a.date)` (`transactions.ts:78`) | PASS |
| AC9 — `repos/installments.ts` CRUD + `listInstallmentsByCard` via índice composto | `installments.ts:17-54` — `listInstallmentsByCard` via `where('[cardId+startDate]').between(...)` (`installments.ts:32-38`) | PASS |
| AC10 — `repos/categories.ts` CRUD + rejeição duplicado case-insensitive, mensagem PT-PT | `categories.ts:22-71` — `normalize()` trim+lowercase (`categories.ts:22-24`); `createCategory` rejeita duplicado com `Error` `'Já existe uma categoria com o nome "{name}"'` (`categories.ts:29-34`) | PASS |
| AC11 — `lib/financas/formatCurrency.ts`, formato `€1.234,56`, zero-safe, negativo-safe | `formatCurrency.ts:48-55` — `formatCurrency(cents)`; testes provam `formatCurrency(0)==='€0,00'`, `formatCurrency(-100)==='-€1,00'` | PASS |
| AC12 — hooks `useAccounts` / `useTransactions` wrappers `useLiveQuery` | `hooks/useAccounts.ts:21-23`, `hooks/useTransactions.ts:24-40` — ambos `'use client'`, `useLiveQuery`, retornam `T[] \| undefined` | PASS |
| AC13 — tests CRUD roundtrip por repo + filtros + índice composto + duplicado + `updateBalance` | `tests/unit/db/repos/` — `accounts.test.ts` (13), `cards.test.ts` (12), `transactions.test.ts` (17), `installments.test.ts` (11), `categories.test.ts` (11) — 64 testes | PASS |
| AC14 — tests negativos Zod domínio financeiro | `tests/unit/db/schemas.test.ts` (39 tests) — cobre `amount` decimal, `Account` sem `name`, `type` fora do enum, `Card` sem `accountId`, `Installment` `installments<=0`, `Category` sem `name` | PASS |
| AC15 — teste de upgrade `version(2)→version(3)` com `NexusDBV2Only` honest mock | `tests/unit/db/schema-upgrade-v3.test.ts` (4 tests) — `NexusDBV2Only` réplica literal v1+v2; preservação de dados + 4 tabelas novas vazias + 19 tabelas + índice `[cardId+date]` funcional | PASS |
| AC16 — `formatCurrency.test.ts` 6+ casos (zero/positivo/negativo/sem-com decimais/grande) | `tests/unit/financas/formatCurrency.test.ts` (9 tests) — cobre todos os casos do AC16 + casos extra (negativo grande, dígito único) | PASS |
| AC17 — quality gates locais PASS | Reproduzido independentemente — ver §1 (5/5 PASS) | PASS |
| AC18 — coverage >= 80% lines nos 7 ficheiros financeiros; `vitest.config.ts` intacto | §1.1 — 100% lines em todos os 7. `git diff` confirma `vitest.config.ts` NÃO tocado | PASS |

**Conclusão §2: 18/18 ACs honrados, cada um com evidência de código directa.**

---

## 3. Avaliação dos 4 [AUTO-DECISIONS]

### A1 — `version(3)` é o número correcto de versão Dexie — RATIFICADO

`client.ts:73` (`version(1)`), `client.ts:98` (`version(2)`), `client.ts:117` (`version(3)`) — não há outro bloco `.version()`. `client.ts:32` antecipa explicitamente o `version(3)` para o Epic 3. Decisão correcta, coerente com o padrão aditivo Dexie. Já ratificada pela `@po`.

### A2 — Helper `formatCurrency` criado nesta story de schema — RATIFICADO

`formatCurrency` é função pura sem dependência de React/DOM — pertence à camada de dados (`lib/financas/`, não `components/`). Resolve o risco R3 do `EPIC-3.md` na story de fundação, evitando duplicação ou bloqueio das Stories 3.7/3.8/3.9. Já ratificada pela `@po`.

### A3 — Chave primária `categories.name` (não `id`) — RATIFICADO (sanity-check arquitectural confirmatório)

`Transaction.category` é `string` referenciando o nome directamente (`types/db.ts:118`, verificado). A interface `Category` **não tem campo `id`** (`types/db.ts:137-142`, verificado) — foi desenhada pela Story 0.3 sem `id`. Usar `name` como PK:
- **Respeita o contrato canónico** `types/db.ts` sem invenção (Constitution Art. IV). A alternativa (PK `id`) exigiria adicionar um campo à interface `Category` e converter `Transaction.category` em `categoryId` — uma reabertura de decisão da Story 0.3, fora do scope desta story de fundação.
- Evita um join desnecessário em qualquer query de transacção que precise de metadados de categoria (cor/ícone).
- O `getCategory(name)` (`categories.ts:40-42`) e `deleteCategory(name)` (`categories.ts:69-71`) operam directamente por PK — coerente.

**Trade-off aceite e contido:** renomear uma categoria exigiria migrar as `transactions` que a referenciam. Mitigantes confirmados: (a) as 10 categorias default PT são estáticas (FR22, semeadas pela Story 3.2 — não renomeadas); (b) MVP de uso pessoal único (o Eurico); (c) sem fluxo de rename no scope do Epic 3. Se surgir necessidade futura de rename estrutural, é matéria para uma story técnica dedicada — **não** um bloqueador desta story. **Sanity-check arquitectural: A3 é a decisão correcta.**

### A4 — Índice `[cardId+date]` adicionado a `transactions` em `version(3)` — RATIFICADO (upgrade Dexie seguro confirmado)

Esta é a [AUTO-DECISION] nova, decidida pela Dara durante a Task 1.3 (que instrui explicitamente: "se faltar `[cardId+date]` para a vista cartões, abrir sub-task"). Avaliação arquitectural detalhada:

**1. É um upgrade aditivo seguro do Dexie?** SIM.
- `version(3)` re-declara `transactions` (`client.ts:122-123`) com o **conjunto completo** de índices: os 6 de `version(1)` (`id, accountId, cardId, category, date, recurrenceId, [accountId+date]`) **mais** `[cardId+date]`.
- Dexie aplica o schema declarado na versão mais recente. Re-declarar uma tabela existente num `version()` posterior é o **mecanismo Dexie canónico de alteração de índices** — não recria a tabela nem apaga dados. Os registos existentes são re-indexados, não destruídos.
- O conjunto de índices é estritamente **superset** do de `version(1)`: nenhum índice removido (o `Directive:` do commit codifica esta regra para o futuro). Remover um índice declarado seria a operação perigosa — não é o caso aqui.

**2. Os dados de `version(1)`/`version(2)` sobrevivem?** SIM — provado por teste.
- `schema-upgrade-v3.test.ts` cenário 1: insere em `transactions` + `recurrences` via `NexusDBV2Only` (réplica literal v1+v2), reabre como `NexusDB` completa, confirma `restoredTx` e `restoredRecurrence` intactos via `toEqual`.
- Cenário 3: prova que o índice `[cardId+date]` é **funcional** após upgrade — query `where('[cardId+date]').between(...)` retorna os 2 registos esperados.

**3. O padrão de re-declaração entre versões Dexie está correcto?** SIM. É exactamente o padrão documentado pela Dexie para evolução de índices, e é consistente com o `architecture-v2.md` ADR-2 ("Dexie 4 — versão+upgrade hooks") e §4.2 ("cada Epic adiciona `this.version(N+1).stores({...})` sem reescrever o anterior"). O risco AR2 do `architecture-v2.md` ("Dexie schema migration falhar mid-upgrade") está mitigado pelo teste AC15.

**A4 RATIFICADO.** A decisão é tecnicamente correcta, segue o padrão Dexie canónico, e está provada por teste de upgrade real (honest mock). O índice `[cardId+date]` é necessário para a vista cartões da Story 3.8 — sem ele a query seria full-scan.

---

## 4. Avaliação dos 3 desvios reportados

### Desvio 1 — `formatCurrency` sem `Intl.NumberFormat`/`toLocaleString` — ACEITE (decisão correcta, não débito)

A implementação de referência da story (Dev Notes L258-269) usava `Number.toLocaleString('pt-PT')`. A Dara substituiu por agrupamento manual (`groupThousands`, `formatCurrency.ts:27-37`). **Avaliação arquitectural:**
- Em runtime Node, `Intl`/`toLocaleString('pt-PT')` produzem o separador de milhar como **espaço estreito U+202F**, não ponto. `Intl.NumberFormat` em modo currency sufixa o símbolo (`1 234,56 €`).
- O AC11 e o AC5 do Epic 3 exigem **literalmente** `€1.234,56` — símbolo prefixado, **ponto** como separador de milhar.
- `Intl`/`toLocaleString` **não conseguem produzir** o formato-alvo. A implementação de referência tinha um defeito latente — teria falhado os testes do AC16.
- O agrupamento manual determinístico é **independente do ICU/locale do runtime** — comportamento idêntico em Node, Edge e browser.

**Veredicto: não é um defeito nem um débito — é a abordagem correcta.** A Dara apanhou um defeito da implementação de referência e corrigiu-o. Os 9 testes do `formatCurrency.test.ts` provam o formato exacto. Documentado correctamente em Dev Agent Record D2 e no trailer `Rejected:` do commit.

### Desvio 2 — `listDefaultCategories` filtra `isDefault` em memória — ACEITE (padrão correcto)

`listDefaultCategories` (`categories.ts:62-67`) faz `toArray()` + `.filter((c) => c.isDefault)` em vez de `.where('isDefault')`. **Avaliação:**
- O IndexedDB **não indexa valores booleanos de forma fiável** — `true`/`false` não são keys IndexedDB válidas. O índice `categories: 'name, isDefault'` (literal do AC3) é mantido como declarado, mas `.where('isDefault')` não funcionaria.
- O padrão leitura completa + filtro é idêntico ao `listTasks` da Story 2.1 — precedente consolidado no projecto.
- A cardinalidade do domínio é baixa (~10 categorias default + categorias user-defined). Um full-scan é trivialmente performante a esta escala.

**Veredicto: aceitável e correcto para o volume esperado.** Não é débito. Bem documentado em D3.

### Desvio 3 — manutenção de `schema-upgrade.test.ts` (Story 2.1) — ACEITE (manutenção legítima, não scope-creep)

O `git diff` mostra 18 linhas alteradas em `tests/unit/db/schema-upgrade.test.ts`: 2 asserções literais (`verno===2` → `verno===3`; "15 tabelas" → "19 tabelas") + comentários explicativos. **Avaliação:**
- O AC1 incrementa `NexusDB` para `version(3)` com 19 tabelas. Isto torna as 2 asserções literais do teste da Story 2.1 desactualizadas — o teste **falharia** sem a actualização.
- A actualização é **causada directamente pelo AC1** — manutenção necessária, não scope-creep. É exactamente a lição #1 da Story 2.1 ("o `schema-upgrade.test.ts` é mantido a cada incremento").
- O teste continua a provar a sua função original: o upgrade desde `version(1)` preserva os dados. Apenas o número de versão de destino e a contagem de tabelas mudaram.

**Veredicto: manutenção legítima e correctamente justificada em Dev Agent Record.**

---

## 5. Conformidade com os ADRs do Nexus v2

| ADR | Requisito | Verificação | Veredicto |
|-----|-----------|-------------|-----------|
| ADR-1 (Edge/Node split) | Schema/DB é client-side IndexedDB — não toca runtime de endpoints | Story 3.1 toca apenas `lib/db/**`, `lib/financas/**`, `hooks/**`, `tests/**`. Nenhum endpoint `app/api/**` modificado (`git diff` confirma). Os hooks são `'use client'` (`useAccounts.ts:1`, `useTransactions.ts:1`) — coerente com o comentário `client.ts:128-133` (Dexie só client-side). | CONFORME |
| ADR-2 (Dexie 4 desde dia 1) | IndexedDB via Dexie 4, incremento `version(N+1)` aditivo | `client.ts:1` importa `dexie`; `version(3)` segue o padrão aditivo de `architecture-v2.md` §4.2. Risco AR2 mitigado pelo teste AC15. | CONFORME |
| ADR-3 (Tiptap) | N/A — Story 3.1 não toca editor de markdown | — | N/A |
| ADR-4 (Vitest+MSW) | Tests via Vitest + `fake-indexeddb` | Todos os 8 ficheiros de teste usam Vitest; `fake-indexeddb` via `tests/setup.ts`. Sem mocks de protocolo externo (CRUD interno Dexie). | CONFORME |
| ADR-5 (Tool Registry) | N/A — registo de tools é a Story 3.11 | Story 3.1 não toca o Tool Registry (anti-padrão respeitado) | N/A |

**Conclusão §5: conformidade total com os ADRs aplicáveis. Nenhum ADR reaberto.**

---

## 6. Os 7 quality checks do qa-gate AIOX

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Requirements met — 18/18 ACs honrados com evidência de código | PASS — ver §2 |
| 2 | Code quality — zero `any`, imports absolutos `@/...`, padrão repo da Story 2.1 replicado, comentários PT-PT com trace | PASS |
| 3 | Test coverage — 116 testes do domínio financeiro; 100% lines nos 7 ficheiros; AC13-AC16 cobertos; teste de upgrade honest mock | PASS — ver §1.1 |
| 4 | Quality gates — 5/5 reproduzidos independentemente (lint 0 erros, typecheck 0, 728/728, build 0, coverage 100%) | PASS — ver §1 |
| 5 | Security — schema/data-access interno IndexedDB client-side; sem auth, secrets, rede ou RLS | N/A — sem superfície de risco |
| 6 | Architectural conformity — ADR-1/ADR-2/ADR-4 conformes; nenhum ADR reaberto; schema aditivo | PASS — ver §5 |
| 7 | No invention (Constitution Art. IV) — interfaces `Account/Card/Transaction/Installment/Category` não tocadas (já existiam em `types/db.ts:98-142`); `recurrences`/`transactions` reutilizadas, não recriadas; cada AC traça a FR/arquitectura | PASS |

**7/7 quality checks PASS** (1 N/A justificado por ausência de superfície).

---

## 7. Anti-padrões — verificação

| Anti-padrão | Verificação | Estado |
|-------------|-------------|--------|
| Reescrever `version(1)`/`version(2)` | `client.ts:73-101` — blocos literais intactos | LIVRE |
| Recriar `transactions` | `transactions` re-declarada apenas para adicionar índice; não é propriedade duplicada da classe | LIVRE |
| Recriar `recurrences` ou criar tabela de recorrências de finanças | Nenhuma tabela `recurrences`/`transaction_recurrences` criada em `version(3)` | LIVRE |
| Recriar interfaces `Account/Card/...` | `types/db.ts` não modificado (`git diff` confirma) | LIVRE |
| Floats para montantes | `AccountSchema.balance`, `TransactionSchema.amount`, `InstallmentSchema.totalAmount`, `CardSchema.limit` todos `z.number().int(...)` | LIVRE |
| Semear categorias default | `categories.ts` não semeia; comentário `categories.ts:18-19` remete para a Story 3.2 | LIVRE |
| Tocar `vitest.config.ts` | `git diff` confirma não tocado | LIVRE |
| Usar `any` | Grep nos 8 ficheiros de código — zero `any` | LIVRE |

**Todos os 13 anti-padrões da story respeitados.**

---

## 8. `mock-protocol-fidelity` e `not-tested-trailer-rules`

**`mock-protocol-fidelity.md`:** A Story 3.1 não tem mocks de protocolos externos (SSE/HTTP/OAuth/WebSocket). O `NexusDBV2Only` do `schema-upgrade-v3.test.ts` é uma **réplica literal** do schema Dexie `version(1)`+`version(2)` — não é um mock de protocolo externo, é um honest mock do estado anterior da própria DB. A réplica foi confirmada linha-a-linha contra `client.ts:73-101`: índices idênticos. **Conforme** — o honest mock reflecte fielmente o schema real anterior.

**`not-tested-trailer-rules.md`:** O commit `82b07ea4` tem o trailer `Not-tested: comportamento de upgrade Dexie com base de dados real em produção`. Avaliação:
- A Story 3.1 toca `lib/db/**`, `lib/financas/**`, `hooks/**`, `tests/**` — **nenhum path bloqueador** (CI config, test-runner config, build config, segurança). `git diff` confirma que `vitest.config.ts`, `tsconfig*.json`, `package.json` (scripts) e `.github/workflows/**` **não foram tocados**.
- O trailer `Not-tested:` refere o upgrade Dexie real em produção (edge case de runtime de difícil reprodução) — **waiver válido**, classificação correcta segundo a tabela da regra. `fake-indexeddb` cobre a mecânica do upgrade; o upgrade real v2→v3 ocorre no primeiro load pós-deploy do Eurico.
- O `Not-Tested Evidence Gate` da story está correctamente marcado N/A.

**Conforme** — `Not-tested:` é waiver válido aqui, não red flag. Nenhuma evidência local adicional exigida.

---

## 9. Verificação do commit

O commit `82b07ea4` segue o commit-protocol:
- Subject conventional: `feat(nexus-v2): Story 3.1 — Schema finanças DAL Dexie v3 (FR16-FR19) [Story 3.1]`
- Secção `Changes:` presente (mandatory-change-log) — diff linha-a-linha por ficheiro
- Trailers: `Constraint:` (x3), `Rejected:` (x2), `Confidence: high`, `Scope-risk: moderate`, `Directive:`, `Not-tested:`
- O `Directive:` codifica a regra de evolução de índices de `transactions` — boa prática para futuros modificadores.

Commit em conformidade.

---

## 10. Findings

| ID | Severidade | Descrição | Resolução |
|----|-----------|-----------|-----------|
| — | — | Nenhum finding bloqueador. Nenhum finding de severidade Média ou superior. | — |

**Observação não-bloqueante (contexto, não débito):** `transactions.ts:73` (ramo `dateFrom`) tem branch coverage 96,66% (lines 100%). Trivial — não exige acção.

---

## 11. Veredicto

**PASS — Story 3.1 aprovada. Status `Ready for Review → Done`.**

- 18/18 ACs honrados, cada um com evidência de código directa.
- 5/5 quality gates reproduzidos independentemente — números conferem com o relatório da Dara.
- [AUTO-DECISIONS] A1, A2, A3, A4: todas ratificadas. A4 (índice `[cardId+date]`) confirmada como upgrade Dexie seguro, provada por teste.
- 3 desvios avaliados: todos aceites — `formatCurrency` sem `Intl` é a decisão correcta (não débito); `listDefaultCategories` filtro em memória é o padrão correcto; manutenção de `schema-upgrade.test.ts` é legítima.
- Conformidade total com os ADRs aplicáveis (ADR-1, ADR-2, ADR-4). Nenhum ADR reaberto.
- 7/7 quality checks qa-gate AIOX PASS. 13/13 anti-padrões livres. `mock-protocol-fidelity` conforme; `not-tested-trailer-rules` conforme (waiver válido).
- Zero invenção (Constitution Art. IV). Separação de papéis A6 cumprida.

**Próximo passo:** `@devops *push feature/3.1-schema-financas` — push da branch + abertura de PR contra `main`. CodeRabbit corre server-side no PR (convenção Nexus v2). Push é exclusivo do `@devops`.

---

*Architect Gate produzido por Aria (`@architect`) em 21/05/2026. Os 5 quality gates foram reproduzidos de forma independente em `imersao-tools/nexus/v2/` na branch `feature/3.1-schema-financas` — não foi aceite o relatório da Dara como prova. Os 18 ACs foram cruzados directamente com o código real (`client.ts`, `schemas.ts`, `repos/*`, `formatCurrency.ts`, `hooks/*`, `tests/**`). Conformidade arquitectural verificada contra `architecture-v2.md` (ADR-1/2/4). — Aria, arquitectura perfeita, execução pragmática.*
