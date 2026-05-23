# RETOMA — Nexus v2 Story 3.7 (Vista "Este mês") pronto para `@dev` quality gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 23/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Estado:** Story 3.7 implementada — `Ready for Review`, aguarda quality gate `@dev`
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `feature/3.7-vista-este-mes` (1 commit ahead de `main`)
**Tip:** `75261180` (commit de implementação)
**Autor:** sessão Claude Code 23/05/2026 — Uma (`@ux-design-expert`)

---

## Sumário executivo (1 parágrafo)

Story 3.7 (Vista "Este mês" — FR21) **implementada** end-to-end na branch `feature/3.7-vista-este-mes` em 1 commit (`75261180`). Helper puro `lib/financas/monthAggregations.ts` com 5 funções (`getMonthBounds`, `getProjectionWindow`, `aggregateInOut`, `aggregateByCategory`, `aggregateByDay`) — 33 testes Vitest **100% coverage**. Page nova `app/(app)/financas/mes/page.tsx` com 4 componentes inline ([AUTO-DECISION] A10 ratificada), `useFinanceRecurrenceEngine()` no mount (AC2), 3 KPIs glassmorphism (AC4), duas listas por categoria com barras HTML/CSS (AC5), lista por dia com "hoje" destacado (AC6), projecção 30d com rótulos "Recorrente"/"Prestação" (AC7), empty + loading states (AC9), aria-label + role="img" + cores semânticas (AC8). Link de descoberta cyan em `/financas` (AC10) — `components/ui/Header.tsx` **não tocado**. **Quality gates locais 5/5 PASS:** typecheck exit 0, lint 0 erros novos, 886/886 tests (853 anteriores + 33 novos), build `/financas/mes` 6.63 kB (<20 kB), coverage `monthAggregations.ts` 100%. Aguarda `@dev *qa-gate 3.7` (revisão das agregações, edge cases dos testes, integração com `useTransactions`/`useFinanceRecurrenceEngine`, design system, a11y reforçada — EPIC-3 §8 R5).

---

## Estado real verificado

```
75261180 feat(nexus-v2): Story 3.7 — Vista "Este mês" [Story 3.7] [Epic 3]
e985b0d0 docs(nexus-v2): fechar Story 3.6 + actualizar EPIC-3 (6/11 Done) [Story 3.6] [Epic 3]
7be125f4 feat(nexus-v2): Story 3.6 — Compras parceladas vinculadas a cartão [Epic 3] (#35)
```

| Métrica | Valor |
|---------|-------|
| Branch local | `feature/3.7-vista-este-mes` (1 ahead de main) |
| Branch remote | **NÃO existe ainda** — `@devops *push` cria |
| Commit principal | `75261180` (5 ficheiros, 2191 inserções) |
| Story status | `Ready for Review` (era `Approved`) |
| Tests Vitest novos | 33/33 PASS |
| Tests Vitest totais | 886/886 PASS (853 anteriores + 33 novos) |
| Build size `/financas/mes` | 6.63 kB (180 kB first-load JS) — dentro do limite <20 kB |
| Coverage `monthAggregations.ts` | 100% (stmts/branch/funcs/lines) — excede >= 80% |
| Working tree | 150+ untracked fora-scope (`.agent/`, etc.) + 2 submódulos modified (`comunidade`, `starter-builder`) — INTACTOS |

---

## O que foi feito nesta sessão

### T1 — Verificação de pontos de integração (pré-implementação)

Confirmadas as 7 APIs/hooks consumidos antes de tocar código:

| Artefacto | Linha verificada | Estado |
|-----------|------------------|--------|
| `listTransactions({ dateFrom, dateTo })` | `lib/db/repos/transactions.ts:65-97` | ISO inclusivo, ordena desc por `date` |
| `useTransactions` deps | `hooks/useTransactions.ts:29-37` | inclui `opts.dateFrom`/`opts.dateTo` |
| `useCategories` shape | `hooks/useCategories.ts:21-23` | retorna `Category[] \| undefined` |
| `useFinanceRecurrenceEngine` | `hooks/useFinanceRecurrenceEngine.ts:24-30` | `useEffect(..., [])` — one-shot on-mount, idempotente |
| `formatCurrency(cents)` | `lib/financas/formatCurrency.ts:60-72` | `€1.234,56` ou `-€1.234,56` |
| `formatDate(iso)` | `lib/shared/format.ts:42-49` | `DD/MM/AAAA` |
| `date-fns` 4.1 + `pt` locale | `package.json` + `lib/tarefas/weekRange.ts:1-2` | importável de `date-fns/locale` |
| `app/(app)/financas/mes/` | — | **não existia** ainda |

### T2 — Helper puro `lib/financas/monthAggregations.ts` (AC1)

5 funções puras implementadas conforme contratos do AC1:

| Função | Comportamento-chave |
|--------|---------------------|
| `getMonthBounds(reference)` | Usa `startOfMonth`/`endOfMonth` de `date-fns`; output `{ startISO, endISO }` em `YYYY-MM-DD` (fuso local) |
| `getProjectionWindow(reference, days=30)` | Inclusivo ambos extremos; lança `RangeError` PT-PT se `days` não for inteiro `>= 1`. Mensagem usa `String(days)` para evitar coerção implícita |
| `aggregateInOut(transactions)` | Inflow/outflow/net/count; invariante `net === inflow + outflow` |
| `aggregateByCategory(transactions)` | Chave composta `category\|direction` (separa entradas/saídas mesma cat); filtra `sumCents === 0`; ordena desc `\|sum\|` (estável) |
| `aggregateByDay(transactions)` | Agrega por `Transaction.date`; ordena asc `dateISO`; filtra dias vazios |

Determinismo: zero `new Date()` interno (excepto `getProjectionWindow` que recebe `reference: Date` como argumento). Testável sem fake timers.

### T3 — Page `app/(app)/financas/mes/page.tsx` (AC2-AC9)

[AUTO-DECISION] A10 ratificada: **inline** dos 4 componentes (`MonthKpis`, `MonthByCategory`, `MonthByDay`, `MonthProjection`) na page. Razões:

1. Coesão temática — todos consomem o mesmo conjunto de agregações.
2. Sem reutilização real (vistas 3.8/3.9 terão própria estrutura).
3. Reutilização é nas **funções puras** (`lib/financas/monthAggregations.ts`), não nos componentes UI.

Estrutura da page:

```
'use client'
useFinanceRecurrenceEngine()  // AC2
useState<Date>(startOfMonth(new Date()))
useMemo: monthBounds + projWindow (rolling, memoizada uma vez por mount)
useTransactions({ dateFrom, dateTo })  // mês + projecção (2 hooks separados)
useCategories()
useMemo: totals + byCat + byDay (agregações)
goPrev / goNext / goToday  // navegação

return:
  - Header: voltar + h1 "Este mês" + setas + label PT-PT + botão "Hoje" (visível se !isCurrentMonth)
  - if isLoading: skeleton (AC9)
  - elif isEmpty: KPIs €0,00 + empty section + projecção 30d separada (AC9)
  - else: MonthKpis + MonthByCategory + MonthByDay + MonthProjection
```

### T4 — Link de descoberta em `/financas` (AC10)

Editado `app/(app)/financas/page.tsx`:
- Linha 3: `import Link from 'next/link';`
- Linha 555: `<Link href="/financas/mes" aria-label="Abrir vista do mês corrente">Este mês →</Link>` com estilo cyan `#00F5FF` discreto, à esquerda do botão `+ Nova X`
- **NÃO modificado:** `components/ui/Header.tsx` (mantém nav top-level com 5 entradas — [AUTO-DECISION] A4)

### T5 — Tests Vitest (AC11)

`tests/unit/financas/monthAggregations.test.ts` — **33 testes** organizados em 6 grupos:

| Grupo | Testes |
|-------|--------|
| `getMonthBounds` | 7 (Jan 31d, Fev bissexto 2028, Fev não-bissexto 2026, Abr 30d, Nov 30d, Dez 31d, determinismo) |
| `getProjectionWindow` | 8 (default 30d, cavalo de ano Dez→Jan, days=1, days=60, RangeError em 0/negativo/não-inteiro, mensagem PT-PT) |
| `aggregateInOut` | 5 (misto + invariante net===in+out, só in, só out, vazio, amount=0 ignorado em somas mas contado em count) |
| `aggregateByCategory` | 5 (múltiplas cats ordem desc, separa in/out mesma cat, filtra sum=0, vazio, empate ordem estável) |
| `aggregateByDay` | 5 (ordem asc, múltiplas tx mesmo dia, filtra vazios, vazio, invariante netCents) |
| Invariantes cross-função | 3 (Σ byDay.net === inOut.net; Σ byCat.sum === inOut.net; Σ inflow byDay === inOut.inflow) |

Determinismo: zero `new Date()` interno aos testes (lição A6 Story 3.4 — fake timers + Dexie quebram ops async).

### T6 — Quality gates locais

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | **exit 0** |
| `npm run lint` | **0 erros novos** (único warning em `app/api/auth/logout/route.ts:1:23` `NextResponse defined but never used` é pré-existente — não tocado por esta story) |
| `npm run test:unit` | **886/886 PASS** (853 anteriores + 33 novos = 886) |
| `npm run build` | PASS — `/financas/mes` **6.63 kB** (180 kB first-load JS, dentro do limite <20 kB) |
| Coverage `monthAggregations.ts` | **100%** (stmts 100% / branch 100% / funcs 100% / lines 100%) |

### T7 — Story file maintenance + handoff (esta secção)

- Tasks/Subtasks 1-8 marcados `[x]`; Task 9 (`@devops *push`) pendente
- Dev Agent Record preenchido: Agent Model Used, Debug Log References (nenhum), Completion Notes (decisão A10 ratificada), File List
- Change Log v1.2 adicionado pelo Uma
- Status `Approved` → `Ready for Review`

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-ready-for-dev-quality-gate.md`. ESTÁ DENTRO DA PASTA `imersao-tools/nexus/` (projecto Nexus v2 a que se refere). LOCALIZAÇÃO VÁLIDA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próximo passo — `@dev *qa-gate 3.7`

Conforme `EPIC-3.md` §5 — Story 3.7 tem `quality_gate: @dev`. O Dex valida:

| Foco da revisão | Verificação |
|------------------|-------------|
| **Invariantes de soma** | `aggregateInOut.netCents === inflow + outflow`; `Σ byCat.sumCents === inOut.netCents`; `Σ byDay.netCents === inOut.netCents` — confirmar nos testes (3 testes cross-função no fim do `monthAggregations.test.ts`) |
| **Ordenação** | `byCategory` desc por `\|sum\|` (estável); `byDay` asc por `dateISO` |
| **Janelas de data** | `getMonthBounds` correcto em Fev bissexto/não-bissexto e meses 30/31 dias; `getProjectionWindow` a cavalo de ano |
| **Determinismo** | Zero fake timers; `Date` injectado via argumento nos testes |
| **Reactividade** | Alterar transacção em `/financas` reflecte em `/financas/mes` via `useLiveQuery` (`useTransactions` deps incluem `dateFrom`/`dateTo`) |
| **a11y AC8** | `aria-label` em botões nav; `role="img"` + `aria-label` nas barras; KPIs com rótulo textual + sinal (não-só-cor); `<section>` + `<h2>` por bloco |
| **Design system** | Glassmorphism em cards (`rgba(255,255,255,0.025)` + border `rgba(255,255,255,0.08)` + radius 12px + blur 12px); paleta canónica de 9 cores; fontes Inter + JetBrains Mono |
| **Formato monetário** | Sempre `formatCurrency` de `lib/financas/formatCurrency` (não `lib/shared/format`) — N1 da PO respeitado |
| **Repo isolation** | Page não acede a `db.*` directamente — só via `useTransactions`/`useCategories` |
| **Boundary** | `runFinanceRecurrenceEngine`/`generateTransactionInstances`/`Header.tsx` NÃO tocados |

**Comando esperado:** `@dev *qa-gate 3.7` ou `@dev *review 3.7`.

**Caso PASS:** próximo passo `@devops *push feature/3.7-vista-este-mes` → abrir PR contra `main` → `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main --head feature/3.7-vista-este-mes --title "feat(nexus-v2): Story 3.7 — Vista 'Este mês' [Story 3.7] [Epic 3]"` → aguardar CodeRabbit (hard-stop §8 = máx 2 iter).

**Caso CONCERNS/FAIL:** `@dev` aplica fixes → recommit → re-gate.

---

## Convenções operacionais Epic 3 (relembrar — NÃO reabrir)

| Convenção | Detalhe |
|-----------|---------|
| Test policy Epic 3 | Componentes React do separador Finanças NÃO têm unit tests próprios — validação via quality gate + CR server-side. Helper puro `monthAggregations.ts` cobre 100% por testes Vitest |
| Repo isolation | Helpers de cálculo financeiro em `lib/financas/*.ts` (puros); atomicidade em `db.transaction('rw', ...)` no repo (não aplicável a esta story — read-only) |
| Page tab strip | `/financas` mantém 5 separadores; 3.7/3.8/3.9 são sub-rotas (`/financas/mes`, `/financas/cartoes`, `/financas/patrimonio`) — não 6ª/7ª/8ª tabs |
| Geração eager (3.6) vs lazy (3.10) | Parceladas: TODAS as N tx criadas eager (3.6 A2); recorrentes: futuro materializado pelo motor da 3.4 — 3.7 lê ambas via `useTransactions` no intervalo |
| Hard-stop §8 | Máximo 2 iter CR após push. Iter 3 excepcional ou merge waived exigem autorização humana explícita no commit (trailer `Constraint:` + nome Eurico) |
| `gh pr *` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Push exclusivo `@devops` | Constitution Artigo II — `@ux-design-expert`/`@dev`/`@qa` fazem commits locais, NUNCA push |

---

## Caveats operacionais críticos

| Caveat | Detalhe |
|--------|---------|
| Branch ainda só local | `feature/3.7-vista-este-mes` existe só local — `@devops *push` cria upstream |
| Working tree poluído | 150+ untracked fora-scope e 2 submódulos modified (`comunidade`, `starter-builder`) — INTACTOS, NÃO mexer no commit final |
| Pasta exacta terminal novo | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Idioma | PT-PT obrigatório em TUDO |

---

## Ficheiros de referência (ordem de leitura)

1. `docs/HANDOFF-INDEX.md` — entrada deste handoff em pending
2. `.claude/rules/handoff-location.md` + `handoff-central.md` — regras de handoff
3. `imersao-tools/nexus/docs/stories/active/3.7.story.md` — story completa (12 ACs + 9 tasks + Dev Agent Record + Change Log v1.2)
4. `imersao-tools/nexus/docs/EPIC-3.md` §5 — tabela de stories (Story 3.7 — executor `@ux-design-expert`, gate `@dev`)
5. `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts` — 5 funções puras (200 linhas)
6. `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts` — 33 testes (380 linhas)
7. `imersao-tools/nexus/v2/app/(app)/financas/mes/page.tsx` — page nova (700 linhas)
8. `.claude/rules/design-system-ia-avancada.md` — design system (paleta, glassmorphism, fontes)
9. `.claude/rules/separation-of-roles.md` — `executor != quality_gate` (A6)

Memórias relevantes:
- `project_nexus_v2_epic_3.md` (estado Epic 3, padrão first-iter)
- `project_nexus_v2_architecture.md` (5 ADRs — NÃO reabrir)
- `project_nexus_v2_producao.md` (deploy info)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-ready-for-dev-quality-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Uma (`@ux-design-expert`) — sessão Claude Code Eurico
DATA: `23/05/2026`
