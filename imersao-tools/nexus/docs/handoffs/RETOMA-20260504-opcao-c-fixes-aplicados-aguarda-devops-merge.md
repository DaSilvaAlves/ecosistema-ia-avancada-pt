# RETOMA — Nexus v2 — Decisão Eurico Opção C híbrido aplicada, fixes prontos, aguarda @devops para push + merge PR #2

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Eurico decidiu **Opção C híbrido** sobre PR #2 do Epic 0 Nexus v2 (CI parcialmente vermelho). Dex (`@dev`) aplicou 3 fixes locais sem fazer push (regra Article II — exclusivo `@devops`):

1. Coverage threshold `vitest.config.ts` rebaixado 60% → 25% (com comentário inline marcando como temporário Epic 0 baseline).
2. 2 e2e tests problemáticos em `auth.spec.ts` marcados `test.skip` com TODO Epic 1 follow-up Story F.2.
3. Documento de débito técnico criado: `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` com 3 stories follow-up (F.1, F.2, F.3).

**Próximo passo:** `@devops` (Gage) faz commit + push dos fixes na branch `feat/nexus-v2-epic-0` (PR #2 já aberta) → aguarda CI verde → merge PR #2 → move 10 stories Epic 0 de `active/` para `completed/`.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 (uso interno pessoal Eurico) |
| Localização | `imersao-tools/nexus/v2/` |
| Sessão actual | 04/05/2026 (Dev fixes Opção C) |
| Agente que sai | Dex (`@dev`) |
| Agente que entra | Gage (`@devops`) |
| Estado | Fixes aplicados localmente, prontos para commit + push |
| Branch | `feat/nexus-v2-epic-0` (já existe, PR #2 aberta) |
| PR | `#2` — `https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2` |
| Decisão Eurico | Opção C híbrido (do RETOMA-20260504-epic-0-pushed-pr-aberta.md) |

---

## Decisão Eurico — Opção C híbrido (citação do contexto recebido)

> "Dex, decisão Eurico: **Opção C híbrido**. Aplica 3 fixes na branch `feat/nexus-v2-epic-0` (já existe, PR #2 aberta)."

Ler RETOMA-20260504-epic-0-pushed-pr-aberta.md §"Decisão Eurico necessária" → Opção C era a recomendada por Gage (reduz coverage threshold + skip e2e tests + Vercel UI config + merge).

---

## Alterações realizadas

### Fix 1 — Coverage threshold `vitest.config.ts`

| Ficheiro | Linha | Antes | Depois | Razão |
|----------|-------|-------|--------|-------|
| `imersao-tools/nexus/v2/vitest.config.ts` | 26 | (sem comentário) | `// Coverage threshold: 25% temporary baseline. Raise to 60%+ in Epic 1 (follow-up Story F.1)` | Marca débito técnico |
| `imersao-tools/nexus/v2/vitest.config.ts` | 27-30 | `lines: 60, functions: 60, branches: 60, statements: 60` | `lines: 25, functions: 25, branches: 25, statements: 25` | Permite CI Vitest passar (actual coverage = 29% lines) |

**Diff exacto:**

```diff
       exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
+      // Coverage threshold: 25% temporary baseline. Raise to 60%+ in Epic 1 (follow-up Story F.1)
       thresholds: {
-        lines: 60,
-        functions: 60,
-        branches: 60,
-        statements: 60,
+        lines: 25,
+        functions: 25,
+        branches: 25,
+        statements: 25,
       },
```

**Trade-off:** baixar threshold para 25% NÃO baixa coverage real (continua 29%) — apenas relaxa o gate para CI passar. Coverage volta para 60%+ em Epic 1 via Story F.1.

---

### Fix 2 — Skip 2 e2e tests `auth.spec.ts`

| Ficheiro | Linha (aprox) | Teste | Acção | Razão |
|----------|--------------|-------|-------|-------|
| `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts` | ~28 | `password errada mostra erro inline` | `test(` → `test.skip(` + comentário TODO | Strict mode: `getByRole('alert')` resolve a 2 elementos (Next.js route announcer + custom alert) |
| `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts` | ~36 | `proxy Anthropic devolve 401 sem cookie` | `test(` → `test.skip(` + comentário TODO | KV mock setup difere CI vs prod — comportamento sem KV real provoca status code inesperado |

**Diff exacto:**

```diff
-test('password errada mostra erro inline', async ({ page }) => {
+// TODO Epic 1 follow-up Story F.2 — fix strict mode selector (getByRole('alert') resolve a 2 elementos: Next.js route announcer + custom alert)
+test.skip('password errada mostra erro inline', async ({ page }) => {
   await page.goto('/login');
   await page.fill('input[type="password"]', 'definitivamente-errada-xyz-123');
   await page.click('button:has-text("Entrar")');
   // Resposta 401 com mensagem
   await expect(page.getByRole('alert')).toContainText(/incorrecta|configurado/i);
 });

-test('proxy Anthropic devolve 401 sem cookie', async ({ request }) => {
+// TODO Epic 1 follow-up Story F.2 — fix KV mock setup (proxy comportamento sem KV real em CI difere de prod)
+test.skip('proxy Anthropic devolve 401 sem cookie', async ({ request }) => {
   const resp = await request.post('/api/anthropic/proxy', {
```

**NÃO foram apagados** — apenas `.skip`. Restantes 2 testes do ficheiro continuam activos (`redirige para /login quando sem cookie de sessão`, `página de login mostra logo NEXUS e input password`).

---

### Fix 3 — Documento de débito técnico

| Ficheiro | Acção | Conteúdo |
|----------|-------|----------|
| `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` | CRIADO | 3 stories follow-up (F.1, F.2, F.3) com User Story + Acceptance Criteria + referências |

**Stories descritas:**

| Story | Tipo | Resumo | Prioridade |
|-------|------|--------|-----------|
| F.1 | Tech Debt — Quality Gate | Subir coverage threshold 25% → 60%+ via testes em `lib/shared/*` + componentes críticos | Média |
| F.2 | Tech Debt — Test Reliability | Re-activar 2 e2e tests skipped (resolver strict mode selector + KV mock) | Média |
| F.3 | Tech Debt — Deploy Config | Vercel root directory config (Eurico decide UI vs `vercel.json`) | Alta |

---

## Constraints respeitadas (Article II — Push Authority)

| # | Constraint | Validação |
|---|-----------|-----------|
| C1 | Apenas @devops faz push | ✓ ZERO `git add/commit/push` executado por Dex |
| C2 | Não tocar em `src/` v1 | ✓ Apenas `imersao-tools/nexus/v2/**` modificado |
| C3 | Não inventar features | ✓ Apenas fixes Opção C definidos pelo Eurico |
| C4 | Não tocar em ACs/scope/título de stories | ✓ Stories Epic 0 intocadas |
| C5 | PT-PT em handoffs e comentários | ✓ |
| C6 | Não tratar Eurico por "Sr." | ✓ Tratamento informal directo |
| C7 | Modo execução | ✓ Sem confirmações, fixes aplicados directos |
| C8 | Branch existente | ✓ Não foi criada branch nova — fixes vão para `feat/nexus-v2-epic-0` |

---

## Ficheiros modificados nesta sessão (Dex)

### Modificados (2 ficheiros)

- `imersao-tools/nexus/v2/vitest.config.ts` — coverage threshold 60→25 + comentário inline
- `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts` — 2 testes `test.skip` + comentários TODO

### Criados (2 ficheiros)

- `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` — documento de débito técnico Epic 1
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md` — este handoff

### NÃO modificados pelo Dex

- Nenhum ficheiro em `imersao-tools/nexus/src/` (V1 intocado)
- Nenhuma das 10 stories Epic 0 (mantidas `Ready for Review` em `active/`)
- Nenhum dos 26 docs PO/QA (intocados)
- Nenhum ficheiro fora do scope Nexus v2

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md`. PROJECTO É NEXUS V2. LOCALIZAÇÃO COINCIDE COM PROJECTO REFERIDO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próximo passo (instruções para Gage `@devops`)

### 1. Validação local pré-push

```bash
cd imersao-tools/nexus/v2
npm install                # se package-lock.json existe; usar npm ci se preferir
npm run lint               # deve passar (já passava antes)
npm run typecheck          # deve passar (já passava antes)
npm run test               # Vitest deve passar (com novo threshold 25%)
npm run test:e2e           # Playwright deve passar 2/4 (2 skipped não falham)
```

Se algum gate falhar localmente, NÃO fazer push — investigar e reportar ao Eurico.

### 2. Commits sugeridos (1-2 commits)

**Opção A (1 commit único — preferido):**

```bash
git add imersao-tools/nexus/v2/vitest.config.ts \
        imersao-tools/nexus/v2/tests/e2e/auth.spec.ts \
        imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md \
        imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md

git commit -m "fix(nexus-v2): Opção C híbrido — coverage 25% baseline + 2 e2e skip + débito Epic 1"
```

**Mensagem de commit completa sugerida:**

```
fix(nexus-v2): Opção C híbrido — coverage 25% baseline + 2 e2e skip + débito Epic 1

Decisão Eurico Opção C híbrido sobre PR #2 — desbloqueia merge Epic 0 com fixes temporários e débito técnico registado.

Changes:
- vitest.config.ts:27-30 — coverage threshold 60→25 (temporary baseline, raise in Epic 1 Story F.1)
- vitest.config.ts:26 — comentário inline marcando débito
- tests/e2e/auth.spec.ts:~28 — `test.skip` em "password errada mostra erro inline" (strict mode selector — Story F.2)
- tests/e2e/auth.spec.ts:~36 — `test.skip` em "proxy Anthropic devolve 401 sem cookie" (KV mock setup — Story F.2)
- docs/EPIC-0-FOLLOW-UP-DEBT.md — criado com 3 stories follow-up (F.1, F.2, F.3)
- docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md — handoff Dev→DevOps

Constraint: Apenas @devops faz push (Article II)
Confidence: high
Scope-risk: narrow
Directive: Coverage threshold de 25% é TEMPORÁRIO. Restaurar para 60%+ em Epic 1 via Story F.1 (ver EPIC-0-FOLLOW-UP-DEBT.md)
Not-tested: Vercel preview deploy (Story F.3 segue após decisão Eurico Opção A/B)
```

**Opção B (2 commits separados, se preferires granularidade):**

```bash
# Commit 1: fixes config
git add imersao-tools/nexus/v2/vitest.config.ts \
        imersao-tools/nexus/v2/tests/e2e/auth.spec.ts
git commit -m "fix(nexus-v2): Opção C híbrido — coverage 25% baseline + 2 e2e skip"

# Commit 2: docs
git add imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md \
        imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md
git commit -m "docs(nexus-v2): EPIC-0-FOLLOW-UP-DEBT + handoff Opção C aplicada"
```

### 3. Push para branch existente

```bash
git push origin feat/nexus-v2-epic-0
```

(Branch já existe remotamente — push faz update à PR #2 abertamente, NÃO criar branch nova.)

### 4. Aguardar CI

Esperado:

| Check | Status esperado |
|-------|-----------------|
| Lint + TypeScript | PASS (mantido) |
| Vitest unit + coverage | **PASS** (threshold agora 25%) |
| Playwright E2E + bundle key check | **PASS** (2/4 testes — outros 2 skipped) |
| Bundle key check NFR5 | PASS (mantido) |
| CodeRabbit Review | provável CHANGES_REQUESTED nos 28 major prévios + possível alerta sobre `.skip` (não bloqueante) |
| Vercel Preview | **continua FAIL** até resolução Story F.3 (não bloqueia merge — decisão Eurico) |
| CodeQL | continua a correr |

### 5. Merge PR #2

Se CI verde (com excepção Vercel Preview que segue para Story F.3):

```bash
gh pr merge 2 --squash --delete-branch=false
# ou via UI GitHub
```

(Recomendado `--squash` para histórico main limpo. Branch `feat/nexus-v2-epic-0` pode ser apagada APÓS merge — opcional.)

### 6. Mover stories para `completed/`

Após merge bem sucedido:

```bash
git checkout main
git pull origin main
git mv imersao-tools/nexus/docs/stories/active/0.1.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.2.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.3.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.4.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.5.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.6.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.7.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.8.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.9.story.md imersao-tools/nexus/docs/stories/completed/
git mv imersao-tools/nexus/docs/stories/active/0.10.story.md imersao-tools/nexus/docs/stories/completed/

git commit -m "chore(nexus-v2): mover 10 stories Epic 0 para completed/ após merge PR #2"
git push origin main
```

(Cria pasta `completed/` se não existir.)

### 7. Handoff de fecho Gage→Eurico (final)

Após merge + stories movidas, criar handoff a confirmar Epic 0 closed:
- Localização: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-merged-stories-completed.md`
- Conteúdo: confirmação merge, links commits/PR, lista 10 stories completed, próximo passo (Eurico decide Epic 1 ou Stories F.1/F.2/F.3 primeiro)
- Marcar este handoff (Dev→DevOps Opção C) como consumed + mover para `archive/`
- Actualizar `docs/HANDOFF-INDEX.md`

---

## Anti-padrões absolutos (NÃO FAZER)

| Anti-padrão | Consequência |
|-------------|--------------|
| Force push à `feat/nexus-v2-epic-0` | Histórico perdido — usar push normal |
| Merge sem CI verde Vitest+E2E | Decisão Eurico Opção C requer CI verde nesses gates após estes fixes |
| Apagar os 2 e2e tests skipped | NÃO — apenas `.skip` (Story F.2 reactiva) |
| Restaurar threshold 60% antes de Story F.1 | NÃO — débito registado no EPIC-0-FOLLOW-UP-DEBT.md |
| Tocar em ficheiros fora dos 4 listados | Scope rígido — apenas estes 4 ficheiros nesta passagem |
| Resolver Vercel Preview neste push | NÃO — Story F.3 separada (decisão Eurico Opção A vs B pendente) |
| Tratar Eurico por "Sr." | PROIBIDO — tratamento informal directo |
| Push como `@dev` | PROIBIDO — Article II exclusivo `@devops` |

---

## Verificações pré-handoff (auto-critique)

| Check | Status |
|-------|--------|
| Decisão Eurico Opção C aplicada literalmente? | ✓ 3 fixes exactos |
| Coverage threshold marcado como temporário? | ✓ Comentário inline + Story F.1 referenciada |
| 2 e2e tests `.skip` (não apagados)? | ✓ + comentário TODO em cada |
| Story F.2 cobre os 2 skips? | ✓ Razão exacta de cada teste documentada |
| Story F.3 cobre Vercel root directory? | ✓ Com Opção A (UI) vs B (vercel.json) |
| Handoff segue regra `handoff-location.md`? | ✓ Em `imersao-tools/nexus/docs/handoffs/` |
| 3 blocos obrigatórios (início/meio/fim)? | ✓ |
| ZERO push executado? | ✓ Article II respeitado |
| ZERO ficheiros fora do scope? | ✓ Apenas 4 ficheiros tocados |
| ZERO stories Epic 0 modificadas? | ✓ Stories intocadas |
| PT-PT em todo o handoff? | ✓ |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno pessoal Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Dex (`@dev`)**
DATA: **04/05/2026**

---

*Handoff escrito por Dex (`@dev`) em 04/05/2026 após aplicar localmente os 3 fixes da decisão Eurico Opção C híbrido sobre PR #2 do Epic 0 Nexus v2. Coverage threshold 60→25 (temporário Epic 0), 2 e2e tests `.skip` (TODO Story F.2), documento de débito técnico criado com 3 stories follow-up (F.1, F.2, F.3). ZERO push (Article II — exclusivo `@devops`). Próximo: Gage faz commit + push + aguarda CI verde + merge PR #2 + move 10 stories para `completed/` + cria handoff de fecho.*
