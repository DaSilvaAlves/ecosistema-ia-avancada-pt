# RETOMA — Story 5.7 (Brain Dump AI Parser) — PR #66 aberto, CR Iter 1 com 2 Major actionable

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`)
**Para:** `@dev` (Dex) — corrigir CR Iter 1; depois `@devops` (push ff + CR Iter 2 → merge)
**Data:** 12/06/2026
**Estado:** pending
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)

## Sumário

A Story 5.7 (Brain Dump AI Parser, FR48, Epic 5) tem o **PR #66 ABERTO** contra `main`
(branch `feat/nexus-v2-5.7-brain-dump-parser`, head SHA `aa10c74a`). Pre-push gates locais
todos verdes (lint PASS, typecheck EXIT 0, vitest 1623/1623). CI 100% sem FAILURE
(Vitest, Playwright, Coverage, CodeQL, 50-prompt, CodeRabbit Status todos SUCCESS; UNSTABLE
deve-se a SKIPPED do framework AIOX, benigno). **Não foi feito merge** porque o CodeRabbit
cloud Iter 1 devolveu `CHANGES_REQUESTED` com **2 findings Major actionable reais** em código
de produção da 5.7, no head SHA actual — pela `merge-authority.md` isto é condição de
ESCALAÇÃO (não auto-merge), e por convenção o `@devops` não toca código de produção (só nits
triviais do próprio commit).

## Estado do PR

- **URL:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/66
- **mergeable:** MERGEABLE · **mergeStateStatus:** UNSTABLE (SKIPPED framework, zero FAILURE)
- **reviewDecision:** CHANGES_REQUESTED (CR Iter 1, submetido 14:36:03Z)
- **head SHA:** `aa10c74a` (impl `314a6bc8` + gate de saída `aa10c74a`)

## CR Iter 1 — 8 findings, ZERO Critical (2 Major + 6 Minor), todos no head SHA `aa10c74a`

### Código de produção (para `@dev` — bloqueiam o merge)

1. **Major — `v2/lib/brain-dump/ai-parser.ts:61` (e :72):** `z.string().min(1)` aceita
   whitespace-only. Sugestão: `z.string().trim().min(1)` no `BrainDumpWireSchema` (4 buckets)
   e no `BrainDumpItemSchema.texto`. Sem isto, items só-espaços são persistidos e contados por
   `hasParsedContent`, aparecendo como linhas vazias em vez de caírem no caminho "sem itens".
2. **Major — `v2/lib/brain-dump/parser-cliente.ts:143`:** `parseBrainDump` chama o proxy mesmo
   com `bodyMarkdown` vazio/whitespace (gasta tokens, resultado depende do modelo). Sugestão:
   short-circuit no topo da função com `throw new Error('O brain dump está vazio — escreve
   algum texto antes de estruturar.')` antes do `fetch`.

### Testes (para `@dev` — acompanham #1/#2)

3. **Minor — `v2/tests/unit/lib/brain-dump/ai-parser.test.ts:93`:** adicionar caso whitespace-only.
4. **Minor — `v2/tests/unit/lib/brain-dump/parser-cliente.test.ts:193`:** cobrir empty-input error path.

### Documentação (para `@dev`/`@architect` — não-bloqueantes, opcionais)

5. Minor — `docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md:18` — alinhar contagem de vulnerabilidades.
6. Minor — `docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md:56` — apontar referência de handoff à cópia arquivada.
7. Minor — `docs/stories/active/5.7.story.md:19` — language tag no fenced config block (MD040).
8. Minor — `docs/stories/active/5.7.story.md:115` — resolver ambiguidade AC5 UI.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM
`imersao-tools/nexus/docs/RETOMA-20260612-story-5.7-PR-66-aberto-CR-iter1-2-major.md`. O
PROJECTO É NEXUS V2 E O CAMINHO ESTÁ DENTRO DE `imersao-tools/nexus/docs/` — CORRECTO.
CONSULTAR `.claude/rules/handoff-location.md`.

---

## O que JÁ está feito (não repetir)

- Commit do Architect Gate de saída: `aa10c74a` (`docs(nexus-v2): architect gate de saida PASS — story 5.7 Ready for Done`).
  Story 5.7 `Status: Ready for Done`, secção QA Results + Change Log v1.1 (Aria).
- Pre-push gates locais verdes: lint PASS (1 warning pré-existente fora-scope `logout/route.ts`),
  typecheck EXIT 0, vitest **1623/1623** (141 ficheiros).
- CR CLI pre-PR (`coderabbit review --agent --base main` no subdir nexus): 8 findings, mas 5
  eram ruído fora-scope (untracked `docs/.claude/settings.local.json`, QA-GATE-2.3,
  PO-VALIDATION-1.2/2.1 — o CR varre o working tree do subdir, não só o diff do PR).
- Push `-u` feito (remote = local = `aa10c74a`, confirmado `git ls-remote`).
- PR #66 criado contra `main`.
- CR cloud Iter 1 concluído: ver findings acima.

## Próxima acção (ordem)

1. **`@dev *apply-qa-fixes 5.7`** (ou `*qa-loop-fix`): corrigir #1-#4 (os 4 são um par coerente:
   validar/rejeitar input vazio/whitespace + testes). Aplicar as `suggestion` do CR (são
   committable). Opcional: #5-#8 docs.
2. Re-correr gates locais em `v2/` (vitest deve subir de 1623 com os 2 testes novos).
3. **`@devops`**: push ff do commit de fix (sem `-f`) → dispara CR Iter 2. Verificar que Iter 2
   fica limpo (0 Major actionable no novo head SHA).
4. **`@devops`**: se CR Iter 2 limpo + CI verde + MERGEABLE → `gh pr merge 66 --repo
   DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` (merge-authority.md,
   o agente faz o merge), depois `git checkout main && git pull --ff-only origin main`.
5. **`@po *close-story 5.7`** (Epic 5: passa para 4/13). A 5.7 desbloqueia a 5.8.

**Hard-stop §8:** Iter 1 consumida. Iter 2 é a última sem autorização do Eurico. Se o CR Iter 2
ainda devolver Major actionable, escalar ao Eurico (Iter 3 exige trailer `Authorized-by:`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/RETOMA-20260612-story-5.7-PR-66-aberto-CR-iter1-2-major.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `12/06/2026`
