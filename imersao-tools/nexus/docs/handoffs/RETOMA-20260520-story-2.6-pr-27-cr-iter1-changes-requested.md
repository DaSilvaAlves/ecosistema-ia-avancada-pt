# RETOMA — Story 2.6 (Sistema de tags global, FR14) — PR #27 CodeRabbit Iter 1 CHANGES_REQUESTED

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 20/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Cross-agent dentro do Story Development Cycle — CodeRabbit fix loop (Iter 1 → Iter 2)
**Severidade:** média (2 findings Major + 4 Minor — fix loop legítimo)
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `feature/2.6-tags-global` (pushed, tip `e60c70f0`, PR #27 OPEN contra `main`)
**De:** Gage (`@devops`) — `*push feature/2.6-tags-global` executado: push + PR #27 + CI + CodeRabbit Iter 1
**Para:** Dex (`@dev`) — `*qa-loop-fix 2.6` (Iter 2 — endereçar os 6 findings CodeRabbit)
**Status:** pending

---

## 1. Resumo executivo

Story 2.6 push'ed para `origin/feature/2.6-tags-global`, PR #27 aberto contra `main`. Pre-push quality gate 4/4 PASS reproduzido por `@devops`. **CI essencial 100% verde.** A review formal do CodeRabbit (Iter 1) submeteu **CHANGES_REQUESTED com 6 findings actionable technical** — não doc-nits, não stale. Merge **NÃO** procede. Fix loop Iter 2 legítimo (hard-stop EPIC-2 §8: máximo 2 iterações de fix loop).

| Marco | Estado |
|-------|--------|
| Push | `feature/2.6-tags-global` em `origin` (3 commits `647baa58`+`5c0a93e4`+`e60c70f0`) |
| PR #27 | OPEN, MERGEABLE, `mergeStateStatus: CLEAN` |
| Pre-push gate (`@devops`) | 4/4 PASS — lint exit 0 (1 warn herdado), typecheck exit 0, test:unit 556/556, build `/tags` 5.81 kB |
| CI essencial | 100% SUCCESS — Lint+TS, Vitest unit+coverage, Playwright E2E+bundle, 50-prompt regression, CodeQL js-ts+actions, Coverage Report, Record Quality Metrics, Vercel Preview |
| CodeRabbit StatusContext | SUCCESS (review completa) |
| CodeRabbit review formal | **CHANGES_REQUESTED** — 6 findings inline (2 Major + 4 Minor) |

---

## 2. Os 6 findings CodeRabbit Iter 1 (verificados contra código por `@devops`)

Todos confirmados directamente no código. Nenhum é stale, nenhum é doc-nit puro.

### Finding 1 — Minor — `app/(app)/tags/page.tsx:131-135`
**Silent fallback no `catch` de `countTasksForTag`.** O `catch {}` vazio (L133-135) suprime a falha e o `window.confirm` (L136-138) mostra na mesma uma contagem numérica — `0` enganador quando a contagem falhou de facto.
**Sugestão CR:** sentinela `count: number | null`; `catch` põe `count = null`; mensagem do confirm passa a ter ramo `null` ("Também será removida das tarefas vinculadas." sem número).

### Finding 2 — Major — `components/tags/TagFormModal.tsx:111-134` (+ 265-277)
**Navegação por arrow-key na paleta fica presa após 1 movimento.** `handleColorKeyDown` recebe `currentHex` per-button (bound em L276). Após a 1ª seta, o foco pode permanecer no botão original → presses seguintes usam contexto de cor stale → não percorre a paleta de forma fiável. Toca **AC11** (acessibilidade WAI-ARIA radio group).
**Sugestão CR:** remover o parâmetro `currentHex`; derivar o índice de `form.color`; após `setField('color', nextColor)` mover o foco para o botão via `modalRef.current?.querySelector('button[data-color="..."]')?.focus()`; adicionar `data-color={entry.hex}` aos botões.

### Finding 3 — Major — `lib/tags/colors.ts:22`
**Type annotation colapsa `TagPaletteColor` para `string`.** `export const TAG_PALETTE: readonly TagPaletteEntry[] = [...]` widena o campo `hex` para `string`, fazendo `TagPaletteColor` (L32, derivado de `(typeof TAG_PALETTE)[number]['hex']`) colapsar para `string` em vez de literal union. Resultado: `isPaletteColor()` (L39) deixa de ser type guard efectivo e o código consumidor precisa de assertions `entry.hex as TagPaletteColor`.
**Sugestão CR:** substituir a anotação por `as const satisfies readonly TagPaletteEntry[]` — preserva os literais e mantém a validação do tipo.

### Finding 4/5 — Minor — `lib/tags/colors.ts:23-27`
**Labels da paleta em inglês — viola contrato PT-PT.** 5 dos 7 entries têm `label` em inglês (`Cyan`, `Gold`, `Purple`, `Magenta`, `Lime`). O JSDoc da interface `TagPaletteEntry` (`colors.ts:18`) declara explicitamente "Label PT-PT para `aria-label` do radio button". Estes labels são reutilizados no `aria-label` do radio → leitores de ecrã anunciam texto misto EN/PT. Viola `language-standards.md` + AC11/AC12. (Os entries `White→Branco` e `Grey→Cinzento` já estão correctos.)
**Recomendação:** traduzir os 5 labels para PT-PT. `Magenta` mantém-se (termo igual em PT-PT). Para os restantes, o `@dev` decide a tradução PT-PT adequada e coerente (ex.: Ciano / Ouro / Roxo ou Púrpura / Lima) — o CR sugeriu variantes mas a decisão final é do `@dev` dentro do contrato PT-PT. **`name` (inglês) permanece** — é a chave técnica estável usada em testes/debug, só o `label` muda.

### Finding 6 — Minor — `tests/unit/app/tags/page.test.tsx`
**Warning React `act()` no pipeline.** Updates de estado em `TagsPage` (provenientes de `useLiveQuery`/toast/modal) não envolvidos em `act()`. O pipeline (`Nexus v2 CI / Vitest unit + coverage`) emitiu `[warning] An update to TagsPage inside a test was not wrapped in act(...)`. Os 556 testes passam — é warning, não erro — mas o CR pede limpeza.
**Sugestão CR:** envolver interacções async (abrir modal, submit, delete) em `act()` ou adicionar `await waitFor(() => {}, { timeout: 100 })` para flush dos updates pendentes.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-pr-27-cr-iter1-changes-requested.md`. CAMINHO DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 3. Como retomar (Dex `@dev`)

### 3.1 Activação

```
@dev
```

Ao activar, Dex deve:
1. Ler `imersao-tools/nexus/docs/handoffs/INDEX.md` (regra de activação) — detecta este RETOMA Pending `devops → dev`
2. Ler `imersao-tools/nexus/docs/stories/completed/2.6.story.md` (story fechada — contexto)
3. Ler os 6 findings da §2 acima + os comentários inline do CodeRabbit no PR #27 (cada finding tem um bloco "Prompt for AI Agents" com instruções detalhadas)

### 3.2 Sequência

```text
@dev *qa-loop-fix 2.6   (Dex — endereçar os 6 findings, Iter 2)   ← PRÓXIMO PASSO
```

Após os fixes:
- Reproduzir 4 quality gates locais (lint, typecheck, test:unit, build) — devem passar
- Confirmar que os 27 testes da Story 2.6 continuam a passar (atenção: finding 3 — mudar `TAG_PALETTE` para `as const satisfies` pode exigir remover assertions `as TagPaletteColor` em código consumidor; finding 4/5 — se algum teste assertar o `label` em inglês, actualizar; finding 6 — testes a corrigir)
- Commit na branch `feature/2.6-tags-global` (NÃO criar branch nova — a branch do PR #27 é esta)
- Handoff de saída `dev → devops` para Gage fazer `*push` do commit Iter 2 (push incremental na mesma branch — o PR #27 actualiza automaticamente, CodeRabbit re-corre Iter 2)

### 3.3 Hard-stop

Fix loop CodeRabbit: **máximo 2 iterações** (EPIC-2 §8). Esta é a **Iter 1 → Iter 2**. Se a Iter 2 ainda trouxer findings actionable, escalar ao Eurico com opções (não tentar Iter 3 sem aprovação explícita).

---

## 4. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Branch | `feature/2.6-tags-global` — JÁ pushed. Fix loop commita na mesma branch, não cria nova. |
| Working tree | 150+ untracked pré-existentes (dívida de governança separada — NÃO incluir). Stage selectivo só dos ficheiros tocados pelo fix. |
| Submódulos | `imersao-tools/comunidade` + `imersao-tools/starter-builder` modificados (fora-scope) — NÃO tocar. |
| Hard-stop `@devops` | Gage NÃO aplicou fixes — delega ao `@dev` conforme regra consolidada em todas as stories do Epic 1+2. |
| CI / pre-push | Tudo verde — os 6 findings são qualidade de código (CR semantic), não falhas de gate. |
| `not-tested-trailer-rules` | Se a Iter 2 tocar `vitest.config.ts` ou test config, aplicar a regra. Os fixes previstos NÃO tocam config — apenas `colors.ts`, `page.tsx`, `TagFormModal.tsx`, `page.test.tsx`. |
| Finding 4/5 (PT-PT) | Decisão de tradução é do `@dev` — manter coerência com `language-standards.md`. `name` em inglês permanece. |

---

## 5. Ficheiros-chave

| Ficheiro | Propósito |
|----------|-----------|
| `imersao-tools/nexus/v2/lib/tags/colors.ts` | Findings 3 + 4/5 — type annotation + labels PT-PT |
| `imersao-tools/nexus/v2/components/tags/TagFormModal.tsx` | Finding 2 — arrow-key navigation (Major) |
| `imersao-tools/nexus/v2/app/(app)/tags/page.tsx` | Finding 1 — silent fallback no catch |
| `imersao-tools/nexus/v2/tests/unit/app/tags/page.test.tsx` | Finding 6 — warning act() |
| PR #27 — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/27 | Comentários inline CodeRabbit + audit comment `@devops` |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-pr-27-cr-iter1-changes-requested.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`) — sessão `*push feature/2.6-tags-global`
DATA: 20/05/2026
