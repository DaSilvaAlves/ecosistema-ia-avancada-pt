# RETOMA — Story 5.11 PR #72: merge ESCALADO por 1 Major CR OPEN no head novo

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** Gage (`@devops`)
- **to_agent:** any (`@dev` / Eurico)
- **created:** 2026-06-15
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

## Resumo (1 parágrafo)

Os 7 findings CodeRabbit server-side (1 Critical SSRF + 6 Major) do re-gate `@architect` v1.3 foram corrigidos pelo `@dev`, committed por mim (`fea745ac`) e pushed ff. No head novo, CI e CodeQL estão 100% verdes (0 alertas code-scanning open, os 2 HIGH anteriores mantêm-se resolvidos) e o CodeRabbit Status é SUCCESS. **Mas o merge foi ESCALADO**, não executado, porque o CR re-review ancorou ao head novo **1 finding Major OPEN** (`app/(app)/knowledge/page.tsx:207`) que faz falhar a condição #3 da `merge-authority.md` (0 comentários CR actionable no head novo). Este finding é pré-existente (desde `02ebf98b`), está fora dos 7 server-side ratificados pelo `@architect`, e o `page.tsx` nem foi tocado no commit de fix.

## Estado actual

- **Repo:** `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` — GitHub `DaSilvaAlves/ecosistema-ia-avancada-pt` (gh SEMPRE com `--repo`).
- **Branch:** `feat/nexus-v2-5.11-pesquisa-web`
- **Head actual:** `66479868` (commit de doc Change Log v1.4). Commit de fix dos 7 findings: `fea745ac`.
- **PR #72:** OPEN, `mergeable: MERGEABLE`, `reviewDecision: CHANGES_REQUESTED` (preso pelo Major OPEN).

### CI / CodeQL / CR no head de fix (`fea745ac`)

| Item | Estado |
|------|--------|
| CI rollup | 0 FAILURE (Lint+TS, Vitest, 50-prompt, Playwright todos SUCCESS) |
| CodeQL | **SUCCESS** (não regrediu) |
| Analyze (actions / javascript-typescript) | SUCCESS |
| Alertas code-scanning open na branch | **0** |
| CodeRabbit Status | SUCCESS |

### Gates locais re-corridos (`v2/`)

- lint: 0 erros (1 warning pré-existente fora-scope `logout/route.ts`)
- `tsc --noEmit`: exit 0
- vitest: **158 ficheiros / 1825 PASS**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/RETOMA-20260615-story-5.11-PR-72-merge-escalado-1-major-cr-open.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Porque escalei (decisão merge-authority.md)

As 6 condições de auto-merge, verificadas no head novo `fea745ac`:

| # | Condição | Estado |
|---|----------|--------|
| 1 | CI 100% verde (0 FAILURE) | OK |
| 2 | CodeRabbit Status = SUCCESS | OK |
| 3 | **0 comentários CR actionable no head novo** | **FALHA — 1 Major OPEN** |
| 4 | Architect re-gate PASS High na story | OK (v1.3) |
| 5 | mergeable = MERGEABLE | OK |
| 6 | Hard-stop §8 respeitado | OK (v1.3 foi a ronda de fix) |

O único bloqueador é a condição #3. **NÃO é um finding stale** — está ancorado ao head actual (`commit_id=fea745ac`), é um Major real. Por isso não usei `--admin`: `--admin` só se aplica a `reviewDecision: CHANGES_REQUESTED` **stale** com head limpo, o que não é o caso.

## O finding bloqueador (1 Major OPEN)

- **Ficheiro:** `imersao-tools/nexus/v2/app/(app)/knowledge/page.tsx:207` (também 648-653)
- **Tipo CR:** Major / Potential issue / Quick win
- **`original_commit_id`:** `02ebf98b` (pré-existente desde a Iter 1 — NÃO é dos 7 server-side ratificados pelo `@architect`)
- **Título:** "Abort active web-search requests when web mode is turned off"
- **Problema:** o `useEffect` em L207 só aborta `webAbortRef` no unmount. Ao desligar o modo web (toggle, L648-653), um pedido Anthropic/DDG em curso fica a correr — desperdício de chamada externa + setState após estado oculto.
- **Fix proposto pelo CR (verificado contra o código real — válido):**

```tsx
// Ao sair do modo de pesquisa web, cancela pedidos pendentes.
useEffect(() => {
  if (!webSearchMode && webAbortRef.current !== null) {
    webAbortRef.current.abort();
    webAbortRef.current = null;
    setWebIsSearching(false);
  }
}, [webSearchMode]);
```

Os outros 3 comentários CR no head novo (cobertura em `web-search.test.ts`, `WebSearchSaveModal.test.tsx`, `web-search-anthropic.test.ts`) estão auto-marcados `✅ Addressed in commit fea745a` pelo próprio CR — não-actionable.

---

## next_action (uma de duas)

**Opção A (recomendada) — corrigir o finding:**
1. `@dev *apply-qa-fixes 5.11` — adicionar o 2.º `useEffect` em `knowledge/page.tsx` (fix acima); se possível, +1 teste de componente que prove o abort ao desligar o modo (o `page.tsx` tem múltiplos estados → `react-component-test-criteria.md`).
2. `@architect` re-gate de SAÍDA (executor `@dev` ≠ gate — `separation-of-roles.md`).
3. `@devops` retoma: gates frescos → commit selectivo → push ff → aguardar CI/CodeQL/CR no novo head → se condição #3 verde (0 actionable) → `gh pr merge 72 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch`.

**Opção B — waiver/débito (DECISÃO HUMANA do Eurico):** se o Eurico considerar o finding fora-scope da 5.11 (é UX de optimização, pré-existente, não-segurança), pode autorizar o merge com débito registado (ex: REC-ABORT-WEBMODE) via trailer `Authorized-by:` no commit/merge. Só então o `@devops` faz o merge `--admin`.

### Comando de retoma do `@devops` (após Opção A resolvida)

```bash
cd "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt/imersao-tools/nexus/v2"
npm run lint && npx tsc --noEmit && npx vitest run   # confirmar 1825+ PASS
# commit selectivo do(s) ficheiro(s) tocado(s), push ff, aguardar CI/CodeQL/CR
gh pr view 72 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json headRefOid,mergeable
gh api "repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/72/comments" --paginate \
  --jq '.[] | select(.user.login|startswith("coderabbit")) | select(.commit_id=="<NOVO_HEAD>") | select(.body|test("Addressed")|not) | .path'
# se 0 actionable → merge
gh pr merge 72 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch
git checkout main && git pull --ff-only origin main
```

Pós-merge: NÃO fazer close-story (é do `@po` — `@po *close-story 5.11`, Epic 5 passa a 11/13).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/RETOMA-20260615-story-5.11-PR-72-merge-escalado-1-major-cr-open.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `15/06/2026`
