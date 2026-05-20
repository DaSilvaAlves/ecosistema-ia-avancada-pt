# QA Gate — Story 2.6 (Sistema de tags global, FR14)

**Quality gate:** Quinn (`@qa`)
**Data:** 2026-05-20
**Story:** `imersao-tools/nexus/docs/stories/2.6.story.md` v0.3 (574 linhas, Status: Ready for Review)
**Task executada:** `.aiox-core/development/tasks/qa-gate.md` (7 quality checks + 5 gates locais reproduzir byte-a-byte + cross-check anti-padrões + AC coverage)
**Branch:** `feature/2.6-tags-global` — tip local `5c0a93e4` (commit código `647baa58`, base `main@40ea2351`)
**Veredicto final:** **PASS** — 0/2 qa-loop-fix consumidas. Status: `Ready for Review → Done`.

---

## 0. Separação de papéis (A6 — `separation-of-roles.md`)

| Papel | Agente | Verificação |
|-------|--------|-------------|
| Executor | `@dev` (Dex) — `*develop 2.6` modo YOLO | Implementou repo extension + hook + rota + 4 componentes + refactor |
| Quality gate | `@qa` (Quinn) — este gate | Não tocou em nenhuma linha do código da Story 2.6 |
| `executor != quality_gate` | `@dev` != `@qa` | **PASS** — A6 respeitada. EPIC-2 §5 linha 61 ratificou este par. |

CodeRabbit corre via integração GitHub no PR (server-side) — complementa, não substitui este gate (regra A6 §5).

---

## 1. Quality Gates Locais — 5/5 PASS (reproduzidos byte-a-byte)

Executados em `imersao-tools/nexus/v2/` por Quinn directamente. Evidência real abaixo — não assumida.

| # | Gate | Comando | Resultado | Evidência |
|---|------|---------|-----------|-----------|
| 1 | Lint | `npm run lint` | **PASS** exit 0 | 1 warning herdado pré-2.6: `app/api/auth/logout/route.ts:1` `'NextResponse' is defined but never used`. Zero warnings em ficheiros Story 2.6. |
| 2 | Typecheck | `npm run typecheck` | **PASS** exit 0 | `tsc --noEmit` — zero erros. |
| 3 | Testes | `npm run test:unit` | **PASS 556/556** | 44 ficheiros de teste. 529 anteriores + 27 novos Story 2.6 (7 `tags-update` + 4 `tags-delete-cascade` + 13 `page` + 3 inline page). Duration 13.78s. |
| 4 | Build | `npm run build` | **PASS** | Compiled successfully 5.8s. Rota `/tags` **5.81 kB** First Load JS **152 kB** no manifesto Next.js. `/tarefas` (9.44 kB) e `/projectos/[id]` (4.28 kB) continuam a buildar. 13/13 static pages geradas. |
| 5 | Coverage | `npm run test:coverage` | **PASS** | Todos os alvos AC15 — ver §3 AC15. |

**5/5 PASS à primeira — reprodução byte-a-byte sem discrepâncias face ao Dev Agent Record v0.3.**

Notas de execução:
- `stderr` "Erro ao guardar projecto Error: boom" em `tests/unit/app/projectos/id/page.test.tsx` é log esperado do T12 da Story 2.9 (teste de toast de erro) — não é falha.
- `stderr` "Another connection wants to delete database 'nexus_v2'" em `client.test.ts` é comportamento normal do `fake-indexeddb` em paralelo — não é falha.

---

## 2. Sete Quality Checks do QA Gate AIOX

| # | Check | Resultado | Evidência |
|---|-------|-----------|-----------|
| 1 | **Requirements traceability** — todos os AC implementados e testados | **PASS** | 15/15 ACs verificados directamente em código — ver §3. Cada AC mapeia para tasks T1-T11 + testes T1-T18. |
| 2 | **Code quality & standards** — convenções, imports absolutos, sem `any`, error handling | **PASS** | Imports `@/...` absolutos (Constitution VI). Zero `any`/`as any`. Error handling try/catch em `page.tsx` handlers + `TagFormModal`. PascalCase componentes, kebab-case ficheiros, `useTags` hook prefixo `use`. |
| 3 | **Test coverage & adequacy** — testes existem, passam, cobrem casos críticos | **PASS** | 27 testes novos. T9 (cascata real em `fake-indexeddb`) cobre o risco principal. Coverage AC15 alcançado em todos os paths. |
| 4 | **Lint & typecheck clean** | **PASS** | Lint exit 0 (1 warning herdado pré-2.6, fora-scope). Typecheck exit 0. |
| 5 | **Build integrity** | **PASS** | Build exit 0, rota `/tags` no manifesto, rotas refactoradas intactas. |
| 6 | **No regressions** — refactor não quebra funcionalidade existente | **PASS** | Refactor cirúrgico de 2 pages (`useLiveQuery(listTags,[])` → `useTags()`) — diff confirma apenas imports + 1 linha cada. Suite 556/556 PASS inclui todos os testes pré-existentes de `/tarefas` e `/projectos/[id]`. T18 smoke explícito PASS. |
| 7 | **Security & NFR** — sem exposição de dados, NFR cumpridos | **PASS** | CRUD interno Dexie local (privacy-first, sem rede). Sem auth/RLS/secrets novos. NFR17 coverage agregado 88.71% ≥ 60%. |

---

## 3. Cobertura dos 15 Acceptance Criteria

| AC | Descrição | Verificação directa em código | Resultado |
|----|-----------|-------------------------------|-----------|
| AC1 | `updateTag(id, patch)` no repo | `tags.ts:66-91` — assinatura `Partial<Pick<Tag,'name'\|'color'>>`, `Error` PT-PT se não existe (L71-73), duplicado case-insensitive `t.id !== id` (L78), `TagSchema.parse(merged)` (L89), `db.tags.put` (L90). 7 testes `tags-update.test.ts`. | **PASS** |
| AC2 | `deleteTag(id)` cascata atómica | `tags.ts:111-124` — `db.transaction('rw', db.tasks, db.tags, ...)` (L112), list affected via índice `*tags` (L113), strip `tagId` + `updatedAt` (L115-121), `db.tags.delete` (L122). 4 testes `tags-delete-cascade.test.ts` incluindo T9 crítico (2 vinculadas + 1 não vinculada). | **PASS** |
| AC3 | `hooks/useTags.ts` | `useTags.ts:26-28` — `useLiveQuery(() => listTags(), [])`, retorna `Tag[] \| undefined`. Paralelo a `useProjects`/`useTasks`. | **PASS** |
| AC4 | Refactor cirúrgico 2 pages | Diff confirma `tarefas/page.tsx` (imports + L67) e `projectos/[id]/page.tsx` (imports + L66): só `useLiveQuery(listTags,[])` → `useTags()`. `tagsLookup` Map permanece nas pages (A12). Testes existentes PASS. | **PASS** |
| AC5 | Rota `/tags` + Escape global | `app/(app)/tags/page.tsx` `'use client'`, Escape global `page.tsx:90-97` via `useEffect` + `addEventListener`, suprimido com modal aberto. Build confirma rota. | **PASS** |
| AC6 | `TagsHeader.tsx` | `<h1>Tags</h1>` Inter 800 1.6rem `#F0F4FF`, botão "+ Nova tag" Cyan, `<input type="search" aria-label="Pesquisar tags pelo nome">`, botão "Esc · Voltar" `aria-label="Voltar (Esc)"`, header sticky `rgba(4,4,10,0.92)` + `blur(12px)` z-index 10. | **PASS** |
| AC7 | `TagsGrid.tsx` 3 estados | Grid `repeat(auto-fill,minmax(220px,1fr))`. Skeleton 6 placeholders `aria-busy` (`tags===undefined`). Empty zero-total com CTA. Empty filtro PT-PT com termo entre «». | **PASS** |
| AC8 | `TagCard.tsx` | Nome `<h3>` Inter 700, chip cor 12×12 round `aria-label="Cor: {label}"`, contagem `{N} TAREFAS`/`1 TAREFA` JetBrains Mono, botões Editar/Eliminar, glassmorphism, `React.memo`. | **PASS** |
| AC9 | `TagFormModal.tsx` reuse `ProjectFormModal` | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, focus trap Tab/Shift+Tab (L75-93), Escape fecha, dual-mode create/edit, `TagSchema.parse`, toast erro PT-PT via page. Botão Cancelar presente (L296-313). | **PASS** |
| AC10 | Paleta restrita 7 cores | `lib/tags/colors.ts:22-30` `TAG_PALETTE` exactamente 7 entradas. `DEFAULT_TAG_COLOR='#00F5FF'`. Radio group, zero HEX/RGB picker. T16 confirma 7 radios. | **PASS** |
| AC11 | Acessibilidade WAI-ARIA | Modal dialog/aria-modal/labelledby/focus trap/Escape. Radio group `role="radiogroup"`+`role="radio"`+`aria-checked`+arrow keys/Home/End (L111-134). Input `aria-required`/`aria-invalid`/`aria-describedby`. `window.confirm` nativo. Toast `role="status"`+`aria-live`. Skeleton `aria-busy`. | **PASS** |
| AC12 | PT-PT consistente | Header/card/modal/empty states/toast/confirm verificados. Zero "você"/"sua"/"em um"/"deletar" (grep limpo). Cor labels "Branco"/"Cinzento" traduzidas, restantes nomes técnicos. | **PASS** |
| AC13 | Testes Vitest T1-T18 | 27 testes em 3 ficheiros: `tags-update.test.ts` (7), `tags-delete-cascade.test.ts` (4 — T9 crítico), `page.test.tsx` (13 — T1-T18 subset + T18 smoke). Todos PASS. | **PASS** |
| AC14 | Quality gates locais | 4 gates (lint/typecheck/test:unit/build) — ver §1. | **PASS** |
| AC15 | Coverage thresholds | `app/(app)/tags` **96.69%** lines (≥70%), `components/tags` **89.87%** (≥70%), `lib/tags/colors.ts` **88.23%** (≥80%), `lib/db/repos/tags.ts` **100%** (≥80%), all-files **88.71%** (≥60% NFR17). `vitest.config.ts:coverage.thresholds` INALTERADO. | **PASS** |

**15/15 ACs honrados.**

---

## 4. Cross-check dos 16 anti-padrões

| # | Anti-padrão | Verificação | Resultado |
|---|-------------|-------------|-----------|
| 1 | Criar tabela `task_tags` | Grep `task_tags` em `app/tags` — zero. Tags denormalizadas em `Task.tags`. | **LIVRE** |
| 2 | Incrementar Dexie `version(3)` | Grep `version(3)` — zero. `lib/db/client.ts` não tocado (diff só 17 ficheiros, client.ts ausente). | **LIVRE** |
| 3 | 2 awaits separados para cascata | `tags.ts:112` usa `db.transaction('rw', ...)` atómica. | **LIVRE** |
| 4 | `db.tags.*`/`db.tasks.*` fora do repo | Grep em `components/tags` + `app/tags/page.tsx` — zero. UI consome só via repo + hook. | **LIVRE** |
| 5 | HEX/RGB picker livre | `TagFormModal` radio group restrito a `TAG_PALETTE`. | **LIVRE** |
| 6 | `Tag.status:'archived'`/`Tag.deleted` | Cascata é hard-delete. Interface `Tag` inalterada (3 campos). | **LIVRE** |
| 7 | `window.alert` para erros | `page.tsx` usa toast primitivo `setTimeout` 4s. Grep `window.alert` — zero. | **LIVRE** |
| 8 | Modificar `vitest.config.ts` thresholds | Diff confirma só `coverage.include` expandido; `coverage.thresholds` (L61-66) INALTERADO. | **LIVRE** |
| 9 | Modificar `TasksFilters.tsx` | Não consta na File List nem no diff. | **LIVRE** |
| 10 | Modificar `CalendarBoard`/`KanbanBoard`/`CalendarCard` | Não constam no diff. | **LIVRE** |
| 11 | Consolidar `tagsLookup` no hook | `useTags.ts` retorna `Tag[]` puro. `tagsLookup` Map construído nas pages (diff confirma). | **LIVRE** |
| 12 | Inventar tool cérebro `criar_tag` | Nenhum ficheiro de tool. Tags geridas só via UI. | **LIVRE** |
| 13 | Tocar `v1-to-v2.ts` | Não consta no diff. | **LIVRE** |
| 14 | Usar `any` | Grep `: any`/`as any` em `app/tags` — zero. Typecheck strict PASS. | **LIVRE** |
| 15 | PT-BR | Grep "você"/"deletar"/"em um" em `components/tags` — zero. | **LIVRE** |
| 16 | Custom dialog confirm | `page.tsx:136` usa `window.confirm` nativo. | **LIVRE** |

**16/16 anti-padrões respeitados.**

---

## 5. Regras de governança QA aplicáveis

| Regra | Aplicabilidade | Veredicto |
|-------|----------------|-----------|
| `mock-protocol-fidelity.md` (A1) | **N/A** — Story 2.6 é CRUD interno (Dexie local). Zero mocks de protocolos externos (SSE/HTTP/OAuth/WebSocket). | Sem ação |
| `not-tested-trailer-rules.md` (A2) | **VERIFICADO** — commit `647baa58` toca `vitest.config.ts` (path "red flag": test-runner config). O commit **não usa** o trailer `Not-tested:` (corpo termina em `Constraint:`/`Rejected:`/`Confidence:`/`Scope-risk:`). A alteração é puramente aditiva (4 paths novos à allowlist `coverage.include`); `coverage.thresholds` inalterado. Evidência local prévia existe e foi reproduzida por Quinn (test runner corre sem regressão, 556/556 PASS, coverage report correcto). Precedente Stories 2.3/2.5/2.8. | **Gate não violado** |
| `separation-of-roles.md` (A6) | **CUMPRIDA** — ver §0. | Sem ação |
| `handoff-location.md` | **CUMPRIDA** — QA-GATE e handoff de saída em `imersao-tools/nexus/docs/`. | Sem ação |

---

## 6. Observações minor (CONCERNS não-bloqueantes)

Nenhuma observação atinge severidade bloqueante. Registadas para o closure commit Epic 2 ou retrospectiva.

| # | Descrição | Severidade | Recomendação |
|---|-----------|-----------|--------------|
| Q1 | **Discrepância de path na documentação** — story v0.3 File List e handoff dev→qa referem os 2 testes de repo em `tests/unit/lib/db/repos/tags-*.test.ts`; o caminho real no commit `647baa58` é `tests/unit/db/repos/tags-*.test.ts` (sem o segmento `lib/`). O caminho real é coerente com os testes irmãos pré-existentes (`tests/unit/db/repos/tags.test.ts`, `projects.test.ts`, `recurrences.test.ts`). Os testes existem, correm e passam — apenas a documentação tem o path errado. | Trivial — anti-hallucination minor na documentação, zero impacto funcional | Alinhar File List da story v0.3 + handoff no closure commit, OU registar em retrospectiva. Não bloqueia. |
| Q2 | **Descrição imprecisa de D2 no handoff/story** — o Dev Agent Record (Completion Note 7) e Change Log v0.3 descrevem D2 como "TagFormModal `handleSubmit` catch silenciado — não faz re-throw". O código real: `page.tsx:124` **faz** `throw err` e `TagFormModal.tsx:152-167` apanha esse re-throw no seu próprio `catch` interno (não chama `onClose`, mantém modal aberto, não re-propaga). O comportamento é correcto e testado (T5 — modal não fecha em duplicado, sem unhandled rejection). É só a redacção de D2 que está imprecisa: o re-throw existe e é deliberado; o que foi "silenciado" é a re-propagação final dentro do modal. | Trivial — documentação imprecisa, código correcto e testado | Reformular a nota D2 no closure commit para descrever o fluxo real (page re-throw → modal catch interno). Não bloqueia. |

Ambas as observações são exclusivamente documentais. O código está correcto, testado e em conformidade com todos os ACs.

---

## 7. Veredicto Final

**PASS** — Story 2.6 (Sistema de tags global, FR14) passa o QA Gate à primeira iteração.

- 5/5 quality gates locais reproduzidos byte-a-byte — PASS
- 7/7 quality checks do qa-gate AIOX — PASS
- 15/15 acceptance criteria honrados e testados
- 16/16 anti-padrões respeitados
- 12/12 AUTO-DECISIONS A1-A12 implementadas conforme ratificação Pax
- Separação de papéis A6 cumprida (executor `@dev` != gate `@qa`)
- `mock-protocol-fidelity` N/A · `not-tested-trailer-rules` gate não violado
- 2 observações minor (Q1+Q2) exclusivamente documentais, não-bloqueantes

**Status story:** `Ready for Review → Done`.
**0/2 iterações qa-loop-fix consumidas** (hard-stop EPIC-2 §8 não atingido).
**Confidence:** **High** — todos os ACs verificados directamente em código, 5 gates reproduzidos com evidência real.

**Padrão consolidado:** 12ª story Nexus v2 consecutiva first-iter QA Gate PASS pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8/2.9/**2.6**). Waiver rate Epic 2: **0%** (alvo <20%).

**Próximo passo:** Handoff `@qa → @po` para `@po *close-story 2.6` (DoD + `git mv stories/` → `stories/completed/` + EPIC-2 actualizado 7/10 → 8/10) → depois `@devops *push feature/2.6-tags-global`.

---

*QA Gate executado por Quinn (`@qa`) em 20/05/2026 — Story 2.6 PASS. Branch `feature/2.6-tags-global` tip `5c0a93e4`. Não foi feito `git push` — exclusivo de `@devops`.*
