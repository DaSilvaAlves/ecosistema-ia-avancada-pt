# RETOMA — Story 9.1b FECHADA (merged em main) — unidade de âmbito 9.1 COMPLETA — próximo 9.2 (E2E) ou 9.8 (CI)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.1b FECHADA (Done, merged)** → **unidade de âmbito 9.1 COMPLETA** (9.1a + 9.1b) → **próxima: 9.2 (E2E) ou 9.8 (CI)**
**Data:** 03/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (Eurico decide a próxima; preferência `@sm *draft 9.2`) · **status:** pending
**Branch de partida:** `main` (HEAD = `f06df1c5`, sincronizado 0/0 com origin)

**Porquê este handoff:** a 9.1b (2.ª metade do split da 9.1, cobertura package finanças) percorreu o ciclo completo hoje (dev→qa→merge→close→closure) e está DONE em `main`. Com ela, a unidade de âmbito 9.1 (cobertura ≥60% packages core, NFR17) fica COMPLETA. Substitui e arquiva o handoff anterior do Epic 9 (`RETOMA-20260703-9.1a-FECHADA`), já superado.

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **2/11 unidades Done** — 9.11 (isolamento full-suite) + 9.1 (cobertura ≥60% packages core, agora COMPLETA com 9.1a+9.1b). A 9.1b fechou o gap grande: os 3 packages core (cérebro, tarefas, finanças) passam agora pelo gate de cobertura. `components/financas/**` (10 componentes CRUD) + 3 páginas `app/(app)/financas/**` estavam a **0%** (~6.145 linhas UI escondidas do relatório) e passaram a **package finanças agregado 81,53% lines / 78,66% branch / 75,00% funcs** (≥60% AC2); global mantém-se ~87,4%; full-suite **2617 PASS / 0 FAIL** (0 flake em 3 corridas). Produção mantém-se LIVE via Anthropic; cutover OpenAI deferido on-demand; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 03/07/2026)

```
branch: main — HEAD f06df1c5, sincronizado 0/0 com origin/main
f06df1c5 docs(nexus-v2): close-story 9.1b — cobertura package finanças DONE, unidade 9.1 COMPLETA, Epic 9 2/11 [Story 9.1b]
88f18b43 test(nexus-v2): cobertura package finanças — 10 componentes CRUD + 3 páginas [Story 9.1b] (#103)
81bd8d7d chore(nexus-v2): higiene de código — import morto, Secure no clear-cookie, outputFileTracingRoot
```

Story 9.1b em `stories/completed/9.1b.story.md` (Status Done, QA Results + PO Closure escritos). Epic 9 (`docs/EPIC-9.md`): **9.11 + unidade 9.1 (9.1a+9.1b) Done**; 9.2-9.10 por fazer.

> **Nota de sincronização (lição desta sessão):** no arranque, o handoff da 9.1a afirmava que o *closure commit docs* estava pendente — mas já tinha sido committado (`abbb0963`). Além disso havia 1 commit local não-pushed (`81bd8d7d`, higiene). Ambos foram reconciliados: `81bd8d7d` foi pushed por fast-forward antes do PR #103 (mantendo o PR focado só nos testes), e o closure da 9.1b foi committado em `f06df1c5`. **`main` está agora 100% sincronizado — nada do Nexus por committar.** Cumpre-se `handoff-central.md`: verificar sempre o estado real antes de agir.

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), ~150+ untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `.cursor/`, backups `.backup.*`), e docs antigos `PO-VALIDATION-*`/`PR-BODY-*` pré-existentes. **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.1b fixou / decisões a NÃO reabrir

- **[D-9.11-TIMEOUT]** (da 9.11): `testTimeout`/`hookTimeout` 20000ms em `v2/vitest.config.ts`. NÃO reabrir. A 9.1b só adicionou 2 grupos ao array `coverage.include` (finanças) — padrão aditivo, nunca tocar pool/isolate/timeout/thresholds. Verificado no gate `@qa` (diff = 1 único hunk no `include`).
- **SF-1/SF-2 (inegociável, cumprida):** os paths de finanças (a 0%) entraram no `coverage.include` **no MESMO commit que os testes** (`6ab725cd`, squash `88f18b43`). NUNCA um PR allowlist-only para paths a 0% — senão o threshold global de 60% falha a meio. Padrão a repetir em qualquer futura extensão do `coverage.include`.
- **Território bloqueador `not-tested-trailer-rules.md`** (test-runner config): a 9.1b usou trailer `Evidence:` (output real de cobertura), NUNCA `Not-tested:`. Manter para qualquer story que toque `vitest.config.ts`/CI.
- **Gotcha `InstallmentFormModal`** (validada legítima pelo `@qa`): `<input type="number" min={2}>` com valor `1` é constraint-invalid do HTML5, logo `fireEvent.click` no submit é abortado pela validação nativa do jsdom antes de `handleSubmit`. Usar `fireEvent.submit(form)` para exercitar o ramo defensivo de aplicação. Não é gaming de cobertura.
- **CR falso positivo (não reabrir):** os 3 "Major" do CodeRabbit (`React.ComponentProps<...>` sem `import React`) foram refutados por evidência executável — `typecheck` 0 erros (tsconfig inclui os `.tsx`) + `@types/react` declara `export as namespace React` (UMD global), resolve a nível de tipo sem import. Melhoria preventiva opcional (`import type { ComponentProps } from 'react'`) fica à discrição de quem tocar nesses 4 modais; não bloqueia nada.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260703-story-9.1b-FECHADA-epic-9-unidade-9.1-COMPLETA-proximo-9.2.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima peça: Eurico decide (9.2 E2E ou 9.8 CI)

Com a unidade 9.1 COMPLETA, as candidatas destrancadas são:

- **9.2 — E2E Playwright caminho crítico (candidata preferida).** Independente, gate `@qa`, sem dependência de estado de produção; reutiliza ADR-8 (`page.route()`). → `@sm *draft 9.2`.
- **9.8 — CI bloqueante.** Desbloqueada pela 9.11 (full-suite determinístico). Executor `@devops`, gate `@architect`. Território `not-tested-trailer-rules.md` (`Evidence:`, não `Not-tested:`; CR `--base main`). Beneficia de correr depois do Epic 7.
- **9.10 — deploy automatizado: BLOQUEADA.** `production-state-verification-gate.md` — antes de desenhar, verificar `vercel env ls --environment production` + SHA activo em produção + reconciliar o deployment paralelo `4e2b1c4`/J-6 com o Eurico. Incógnitas (a)/(b) do §10 do EPIC-9 bloqueiam SÓ 9.10/estado-LIVE, não 9.2/9.8.

## 5. Ciclo padrão da próxima story

`@sm *draft {id}` → `@po *validate-story-draft {id}` → gate de entrada (conforme executor/`separation-of-roles.md`) → branch `feat/{id}-slug` (a partir de `main` = `f06df1c5`) → `@dev *develop {id}` → gate de saída (**CR `--base main`** — obrigatório se tocar território infra/config) → `@devops` push + PR + **6 condições `merge-authority` no head SHA** + auto-merge `--admin --squash --delete-branch` (sem pedir merge manual ao Eurico) → `@po *close-story {id}` → `@devops` closure commit docs.

**Regras críticas:** `not-tested-trailer-rules.md`, `separation-of-roles.md` (`@dev`≠`@qa`; sobe de nível se o executor for o gate natural), `cr-base-main-no-gate-saida`. CodeRabbit CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO). WSL path: `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. Hard-stop §8 = máx. 2 iterações CR (Iter 3+ exige `Authorized-by: Eurico`).

## 6. Git para o próximo terminal

```
git checkout main
git pull --ff-only origin main   # HEAD = f06df1c5 (sincronizado)
```
Não há branches de feature pendentes (a de 9.1b foi apagada no merge). Working tree só com ruído fora-scope conhecido.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260703-story-9.1b-FECHADA-epic-9-unidade-9.1-COMPLETA-proximo-9.2.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `03/07/2026`
