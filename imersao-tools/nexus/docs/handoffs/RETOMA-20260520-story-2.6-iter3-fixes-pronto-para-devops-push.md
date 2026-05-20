# RETOMA — Story 2.6 (Sistema de tags global, FR14) — CR Iter 3 fixes prontos para `@devops` push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 20/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Handoff de saída `@dev → @devops` — push incremental Iter 3 no PR #27
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `feature/2.6-tags-global`
**De:** Dex (`@dev`) — `*qa-loop-fix 2.6` Iter 3 excepcional
**Para:** Gage (`@devops`) — `*push feature/2.6-tags-global`
**Status:** pending

---

## 1. Resumo executivo

Iter 3 **excepcional** autorizada pelo Eurico (decisão directa) — quebra do hard-stop EPIC-2 §8.
Dex (`@dev`) endereçou os 2 findings actionable da CodeRabbit Iter 2 do PR #27 + 2 nitpicks triviais.
Commit local na branch `feature/2.6-tags-global` pronto para push incremental — CodeRabbit re-corre Iter 3.

| Marco | Estado |
|-------|--------|
| A1 (Major a11y) | RESOLVIDO — roving tabindex robusto em `TagFormModal.tsx` |
| A2 (Minor test) | RESOLVIDO — sleep hardcoded 30ms removido de `page.test.tsx` T10 |
| N1 (Nitpick MD040) | RESOLVIDO — language identifier `text` no handoff archive Iter 1 |
| N3 (Nitpick teste) | RESOLVIDO — teste T10b para branch falha `countTasksForTag` |
| N2 (Nitpick MD056) | NÃO tratado — cosmético tabela markdown `INDEX.md:12`, fora do essencial A1+A2 |
| Quality gates locais | 4/4 PASS — lint exit 0 (1 warn herdado fora-scope), typecheck exit 0, test:unit 557/557, build `/tags` 5.91 kB |

---

## 2. Findings endereçados — detalhe linha-a-linha

### A1 — Major (a11y) — `components/tags/TagFormModal.tsx`

Bug: quando `form.color` está fora de `TAG_PALETTE` (dados legacy), todos os radios ficavam `tabIndex={-1}`
→ radiogroup inalcançável por teclado (Tab).

Correcção:
- `:65` — `selectedPaletteIndex = TAG_PALETTE.findIndex((p) => p.hex === form.color)` (índice corrente, `-1` fora da paleta).
- `:275` — o `.map()` recebe o segundo argumento `index`.
- `:285` — `tabIndex` passa de `selected ? 0 : -1` para `tabbable ? 0 : -1`, onde
  `tabbable = selectedPaletteIndex === -1 ? index === 0 : selected` — garante sempre **exactamente um** radio focável.
- `handleColorKeyDown` (`:118`) reutiliza `selectedPaletteIndex` (coerência com fallback index 0).

### A2 — Minor (test) — `tests/unit/app/tags/page.test.tsx:299-302`

Removido `await act(async () => { await new Promise((r) => setTimeout(r, 30)) })` redundante em T10 —
o `await flush()` precedente já drena os updates pendentes; sem trabalho assíncrono quando `confirm=false`.

### N1 — Nitpick (MD040) — `docs/handoffs/archive/RETOMA-20260520-...-cr-iter1-changes-requested.md:71`

Fenced code block sem language identifier → `` ```text ``.

### N3 — Nitpick (teste) — `tests/unit/app/tags/page.test.tsx`

Adicionado teste T10b: cobre o branch de falha de `countTasksForTag` (`page.tsx:136-142`). Mock com flag
`shouldFail` que resolve `0` no render inicial (o `useLiveQuery` do `taskCountsMap` em `page.tsx:57-63` também
invoca `countTasksForTag` sem try/catch próprio) e passa a rejeitar só após o render estabilizar — isola o
catch de `handleDelete` e assere a copy fallback "Também será removida das tarefas vinculadas." quando `count === null`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-iter3-fixes-pronto-para-devops-push.md`. CAMINHO DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO.

---

## 3. Ficheiros alterados nesta Iter 3

| Ficheiro | Tipo | Alteração |
|----------|------|-----------|
| `imersao-tools/nexus/v2/components/tags/TagFormModal.tsx` | modificado | A1 — roving tabindex robusto (`selectedPaletteIndex`, `tabbable`) |
| `imersao-tools/nexus/v2/tests/unit/app/tags/page.test.tsx` | modificado | A2 — sleep removido em T10; N3 — teste T10b novo |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260520-story-2.6-pr-27-cr-iter1-changes-requested.md` | modificado | N1 — MD040 language identifier |
| `imersao-tools/nexus/docs/stories/completed/2.6.story.md` | modificado | Change Log v0.7 |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260520-story-2.6-pr-27-cr-iter2-changes-requested-ESCALADO.md` | movido + modificado | handoff escalação → consumed, movido para archive |
| `imersao-tools/nexus/docs/handoffs/INDEX.md` | modificado | INDEX actualizado |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-iter3-fixes-pronto-para-devops-push.md` | novo | este handoff |

---

## 4. Próxima acção — Gage (`@devops`)

1. `*push feature/2.6-tags-global` — push incremental do commit Iter 3 para `origin/feature/2.6-tags-global` (PR #27 actualiza).
2. Pre-push quality gates 4/4 (lint, typecheck, test:unit, build).
3. Aguardar CI + CodeRabbit Iter 3 re-review.
4. Se CR Iter 3 limpa (ou só doc-nits) → merge waived via Opção A. Se trouxer novos findings técnicos → escalar.

---

## 5. Caveats

| Caveat | Detalhe |
|--------|---------|
| `gh pr *` | requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Working tree | 150+ untracked pré-existentes + 2 submódulos modificados — NÃO incluir, NÃO tocar |
| Iter 3 | excepcional, autorizada pelo Eurico (decisão directa) — registada como `Constraint:` trailer no commit |
| N2 (MD056) | não tratado nesta iteração — cosmético, pode ir num mini-PR ou ser absorvido em story futura |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-iter3-fixes-pronto-para-devops-push.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Dex (`@dev`) — sessão `*qa-loop-fix 2.6` Iter 3 excepcional
DATA: 20/05/2026
