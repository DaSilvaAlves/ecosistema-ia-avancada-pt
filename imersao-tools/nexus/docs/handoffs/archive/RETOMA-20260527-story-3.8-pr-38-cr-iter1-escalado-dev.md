# RETOMA — Nexus v2: Story 3.8 PR #38 CR Iter 1 CHANGES_REQUESTED, escalado @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Data criação** | 27/05/2026 |
| **Criado por** | Gage (`@devops`) |
| **Projecto** | Nexus v2 (`imersao-tools/nexus/`) |
| **Epic** | Epic 3 — Finanças Completas |
| **Story** | 3.8 — Vista cartões (FR18 + FR19) |
| **PR** | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/38 (OPEN) |
| **Branch** | `feature/3.8-vista-cartoes` @ `488f95dd` |
| **CR Iter 1 SHA reviewed** | `488f95dd` (range `a6b9005c..488f95dd`) |
| **Status handoff** | pending |
| **to_agent** | `@dev` (Dex) — `*qa-loop-fix 3.8` Iter 2 |

---

## Summary

PR #38 (Story 3.8 — Vista cartões) aberto contra `main` após push limpo de 4 commits. CI essencial 100% verde (`mergeStateStatus: CLEAN`). **CodeRabbit Iter 1 = `reviewDecision: CHANGES_REQUESTED`** — 2 actionable inline (1 Major + 1 Minor) + 1 nitpick. Findings são de código real (não doc-nits puros) → `@devops` NÃO aplica fixes (`agent-authority.md` + lição 8+ stories), NÃO há merge waived sem autorização Eurico (hard-stop §8 EPIC-3, waiver rate actual 1/10 alvo <2/11). Fix Iter 2 legítimo dentro da margem. Story 3.9 (PR #39) está em estado distinto — CR rate limit reached (handoff separado).

---

## Context — Findings CR Iter 1 detalhados

### A1 — Major (Quick win) — `app/(app)/financas/cartoes/page.tsx:117`

**Título:** Guard billing/installment calculations against malformed persisted data.

**Razão:** `getBillingPeriods` e `countInstallmentPayments` podem throw; no render flow actual, um registo inválido derruba a página toda. Adicionar safe fallbacks locais (por cartão / por parcela).

**Resolução sugerida:** wrap chamadas em try/catch:
- `getBillingPeriods` no `useMemo` (linhas 115-117) → return default `BillingPeriods` em caso de erro (e.g., array vazio ou período com datas zero), log do erro
- `countInstallmentPayments` no map de installments (~linhas 367-375) → try/catch por-installment, return default installment-payment result em erro

Variáveis em jogo: `periods`, `BillingPeriods`, `getBillingPeriods`, `countInstallmentPayments`, `card`, `reference`.

### A2 — Minor (Quick win) — `lib/financas/cardBilling.ts:145`

**Título:** Validate `reference` before deriving billing boundaries.

**Razão:** `getBillingPeriods` actualmente aceita `Invalid Date` e pode retornar malformed ISO strings em vez de falhar fast. Adicionar guard na entrada da função.

**Resolução sugerida:** no topo de `getBillingPeriods`, validar que `reference` é `instanceof Date` e `!isNaN(reference.getTime())`; se falhar, throw `TypeError`/`RangeError` com mensagem referenciando "reference" e o valor inválido.

### N1 — Nitpick — `tests/unit/financas/cardBilling.test.ts:210-260`

**Título:** Add explicit error-path tests for `countInstallmentPayments`.

**Razão:** Bloco cobre happy/edge bem, mas deve assertar throws em `startDate` inválida e count inválido para travar o contrato de propagação.

**Resolução sugerida:**
```typescript
it('propaga erro quando startDate é inválida', () => {
  expect(() => countInstallmentPayments('data-invalida', 3, new Date(2026, 4, 1))).toThrow();
});
it('propaga erro quando n é inválido', () => {
  expect(() => countInstallmentPayments('2026-05-01', 0, new Date(2026, 4, 1))).toThrow();
});
```

### Decisões @devops

- **Não waiver** — A1 é Major em código de produção (page principal), não doc-nit
- **A2 também merece fix** — fail-fast em entry guard é prática consistente com o Constitution Artigo V (Quality First) e padrão já adoptado por outros helpers Epic 3
- **N1 alinhado** com convenção "Test edge cases and error scenarios in unit tests"
- **Hard-stop §8 EPIC-3:** Iter 2 fix legítima. Iter 3 PROIBIDA sem autorização Eurico
- **Waiver rate actual Epic 3:** 1/10 (Story 3.10 mergeada com waiver). Alvo <2/11

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260527-story-3.8-pr-38-cr-iter1-escalado-dev.md`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Next Action — @dev `*qa-loop-fix 3.8` Iter 2

### Comandos sugeridos

```bash
cd imersao-tools/nexus
git checkout feature/3.8-vista-cartoes
git pull --ff-only origin feature/3.8-vista-cartoes  # garantir sync (deve ser no-op)

# 1. Fix A1 — try/catch em page.tsx
# 2. Fix A2 — guard reference Date em cardBilling.ts
# 3. Fix N1 — +2 testes em cardBilling.test.ts (counts: 25 → 27)

# Quality gates locais OBRIGATÓRIOS antes de commit:
cd v2
npm run lint        # exit 0 esperado (+1 warn herdado NextResponse aceite)
npm run typecheck   # exit 0 esperado
npm run test:unit   # 937 → 939 PASS (913 baseline + 27 novos)
npm run build       # PASS, sem alterações ao bundle /financas/cartoes

# Commit (NUNCA --no-verify):
cd ..
git add v2/app/\(app\)/financas/cartoes/page.tsx v2/lib/financas/cardBilling.ts v2/tests/unit/financas/cardBilling.test.ts docs/stories/active/3.8.story.md

git commit -m "fix(nexus-v2): Story 3.8 CR Iter 2 — guards + throw tests [Story 3.8] [Epic 3]

CR Iter 1 findings resolvidos:
- A1 Major: try/catch em page.tsx wrappa getBillingPeriods + countInstallmentPayments
  com safe defaults para malformed persisted data
- A2 Minor: getBillingPeriods valida \`reference\` é Date válido (instanceof + !NaN);
  throw RangeError com mensagem clara
- N1 Nitpick: +2 testes assertam countInstallmentPayments throws em startDate
  inválida e n=0

Constraint: Hard-stop §8 EPIC-3 — Iter 2 é fix legítima dentro da margem
Confidence: high
Scope-risk: narrow
Directive: Não adicionar logging persistente em catch (story 3.8 não tem
observability epic); só console.error para o caso. Fallback BillingPeriods em
A1 deve ser array vazio para não renderizar secções com datas zero.
"
```

### Story file actualizações

Em `docs/stories/active/3.8.story.md`:
- Status mantém `Ready for Review` (não voltar a `In Progress`)
- Change Log: adicionar v1.2 com bullet point dos 3 fixes
- Dev Agent Record: nova secção "Fix Loop Iter 2 (27/05/2026)" com lista de findings e resoluções
- File List: nada novo (apenas modificações de ficheiros já listados)

### Após fix Iter 2 → @devops `*push` Iter 2

`@devops` (eu) faz push do fix → CodeRabbit Iter 2 server-side automático. Se CR Iter 2 verde → merge waived ou directo (decisão Eurico). Se CR Iter 2 CHANGES_REQUESTED → **HARD-STOP §8 — escalar ao Eurico, NÃO Iter 3**.

---

## Lições para o próximo agente

1. **CR severidades convenção 3.8:** Major (`⚠️ Potential issue` + 🟠) em `page.tsx` é o único actionable crítico — A2 Minor + N1 nitpick são quick wins do mesmo loop
2. **`getBillingPeriods` defensiva** — padrão consistente com o que Dara fez em Story 3.1 (`updateBalance` `Number.isInteger`); reforçar guards de input nos helpers puros é convenção Epic 3 vinda da Story 3.1
3. **`countInstallmentPayments`** lança em `n=0` por design (validação interna documentada na Story 3.1 D-3.1-1) — N1 só pede teste explícito disso
4. **Bundle size:** mantém ~3.48 kB `/financas/cartoes` — try/catch não engorda (negligível)
5. **Hard-stop §8 EPIC-3** vinculante — se Iter 2 não verde, parar e escalar ao Eurico

---

## Tasks tracking

```
✓ Story 3.8 implementada (4 commits)
✓ Quality gates locais 4/4 PASS
✓ Push @devops feature/3.8-vista-cartoes
✓ PR #38 criado contra main
✓ CI essencial 100% verde
✗ CodeRabbit Iter 1 = CHANGES_REQUESTED (2 actionable + 1 nitpick)
○ @dev *qa-loop-fix 3.8 Iter 2 — PENDING (este handoff)
○ @devops *push Iter 2 — PENDING
○ Decisão merge Eurico — PENDING
○ @po *close-story 3.8 — PENDING
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Nexus v2 (`imersao-tools/nexus/`)
- **LOCALIZAÇÃO CORRECTA:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260527-story-3.8-pr-38-cr-iter1-escalado-dev.md`
- **LOCALIZAÇÃO ACTUAL:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260527-story-3.8-pr-38-cr-iter1-escalado-dev.md`
- **COINCIDEM?** `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

**AGENTE RESPONSÁVEL:** Gage (`@devops`)
**DATA:** 27/05/2026
