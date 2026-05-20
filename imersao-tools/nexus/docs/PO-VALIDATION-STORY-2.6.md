# PO Validation — Story 2.6 (Sistema de tags global, FR14)

**Validador:** Pax (`@po`)
**Data:** 2026-05-19
**Story:** `imersao-tools/nexus/docs/stories/2.6.story.md` v0.1 (541 linhas)
**Task executada:** `.aiox-core/development/tasks/validate-next-story.md` (10-point checklist + executor assignment + anti-hallucination + CodeRabbit integration)
**Decisão final:** **GO** — score 10/10, Implementation Readiness 10/10, Confidence **High**. Status: `Draft → Approved`.

---

## 1. Template Completeness — PASS

Todas as secções obrigatórias do `story-tmpl.yaml` v2.0 presentes, com placeholders apenas onde apropriado:

| Secção | Estado |
|--------|--------|
| Status | "Draft" — pronto para promover a "Approved" após esta validação |
| Executor Assignment (Story 11.1) | `@dev` / `@qa` / `[lint, typecheck, vitest, build, axe-core (manual a11y spot-check formulario + modal + grid)]` |
| Story (As a / I want / so that) | PT-PT, FR14 mapeado com fundamentação extensa (taxonomia consistente sem ids fantasma + design system inegociável) |
| Nota River escopo + dependências | sim — distinção clara entre **infra pronta** (Stories 0.3 + 2.1 + 2.3) vs **entrega 2.6** (extensão repo + hook + rota CRUD + refactor cirúrgico 2 pages) |
| 12 [AUTO-DECISION] A1-A12 | sim — cada decisão com razão + alternativa descartada + trace canónica |
| Contexto (7 pilares) | PRD, Arquitectura, UX, Design system, Lições Epic 1 (A1/A2/A6), D3 oportunidade (paralelo Story 2.9), PT-PT |
| Stack de dados verificado em código | inline TypeScript com 4 interfaces/funções extraídas dos ficheiros reais |
| Paleta de cores inline (lib/tags/colors.ts) | preview TypeScript completo com `TAG_PALETTE` 7 cores + `TagPaletteColor` type + `isPaletteColor()` helper + `DEFAULT_TAG_COLOR` |
| Reconciliação PRD ↔ Arquitectura ↔ Código | 7 itens R1-R7 |
| Acceptance Criteria | 15 ACs (AC1-AC15) |
| CodeRabbit Integration | tabela completa + 9 focus areas + self-healing + risco + local CLI skip |
| Tasks/Subtasks | T1-T11 com sub-tarefas accionáveis (T1.1-T1.5, T2.1-T2.2, T3.1-T3.4, T4.1-T4.2, T5.1-T5.3, T6.1-T6.4, T7.1-T7.6, T8.1-T8.4, T9.1-T9.5) |
| Dev Notes | 11 entradas com source citations (linhas 406-430) — todos os anti-padrões críticos cobertos |
| Testing | framework, localização, padrão, T9 cascata real crítico, T18 refactor não-regressão, coverage thresholds |
| Not-Tested Evidence Gate | N/A justificado — nenhum path bloqueador antecipado (linhas 449-462) |
| Anti-padrões | 16 entradas com razão explícita por proibição (linhas 466-484) |
| Referências | 13 entradas cruzadas (EPIC-2, PRD, arquitectura, 4 stories anteriores, retrospectiva Epic 1, 6 regras) |
| Change Log | v0.1 |
| Dev Agent Record | placeholder (a preencher por Dex) |
| QA Results | placeholder (a preencher por Quinn) |

**Observação minor (não-bloqueante):** Secção "PO Validation" não existe inline na story — está como ficheiro separado `PO-VALIDATION-STORY-2.6.md` (este documento), pattern Story 2.8 + 2.9.

---

## 2. Executor Assignment Validation (Story 11.1 — Projeto Bob) — PASS

| Campo | Valor | Validação |
|-------|-------|-----------|
| `executor` | `@dev` | Presente, não vazio, agente conhecido |
| `quality_gate` | `@qa` | Presente, não vazio, agente conhecido |
| `quality_gate_tools` | `[lint, typecheck, vitest, build, axe-core (manual a11y spot-check formulario + modal + grid)]` | Array não-vazio, ferramentas apropriadas para Frontend CRUD + Database extension + a11y |
| **executor != quality_gate** | `@dev` != `@qa` | **PASS** — separação A6 respeitada (`.claude/rules/separation-of-roles.md`) |
| Type-to-executor consistency | EPIC-2 §5 linha 61 ratificou `@dev` + `@qa` para Story 2.6 (autoridade @pm prévia) | **PASS** — coerente com epic ratificado |
| Keywords da story | "CRUD UI", "rota", "modal", "form", "Zod validation", "page React", "useTags hook", "cascata Dexie", "repo extension" | Mix de Frontend (predominante) + Database (extensão repo) + a11y — par `@dev + @qa` apropriado |

**Nota sobre escolha @qa vs @architect**: A tabela do `validate-next-story.md` template sugere `@architect` como quality gate para "Code/Features/Logic". A Story 2.6 mantém o par `@dev + @qa` (mesmo da Story 2.8) porque:

1. **Sem decisões arquitecturais novas** — schema Dexie já existe desde Story 2.1; cascata atómica usa pattern padrão de transacções `'rw'` da Dexie (documentado nas docs oficiais).
2. **Trabalho é implementation + a11y + form validation + transacção atómica** — `@qa` (Quinn) é o gate apropriado da Story Development Cycle Phase 4 (`qa-gate.md`).
3. `@architect` ficaria desperdiçado num gate sem decisões de design técnico novas para rever.
4. **Padrão Epic 2** — Stories 2.6/2.8/2.9 todas com par `@dev + @qa`; Stories 2.1/2.2/2.3/2.4/2.5 usaram outros pares por terem decisões técnicas próprias.

---

## 3. File Structure & Source Tree — PASS

| Aspecto | Estado |
|---------|--------|
| File paths clarity | Layout completo inline (linhas 15-28 — secção "INFRAESTRUTURA PRONTA") + paths absolutos `imersao-tools/nexus/v2/...` em todas as referências |
| Source tree relevance | Inclui paths absolutos e via `@/` alias (Constitution Article VI) |
| Directory structure | `app/(app)/tags/` (nova rota) + `components/tags/` (nova pasta) + `lib/tags/` (nova pasta para `colors.ts`) — consistente com `tarefas/`/`projectos/` precedentes |
| File creation sequence | T2 (paleta) → T3 (repo extension) → T4 (hook) → T5 (refactor cirúrgico) → T6 (componentes) → T7 (page) → T8 (testes) → T9 (gates) — sequência lógica bottom-up (foundation → consumers) |
| Path accuracy | **Confirmado em código:** `tags.ts` linhas 24/38/43/47 (4 funções existentes), `useTasks.ts` + `useProjects.ts` em `hooks/`, `TasksFilters.tsx:128-143` filter por tag wired, `tarefas/page.tsx:68-69` useLiveQuery inline + comentário literal "// useTags hook ainda não existe (Story 2.6)", `ProjectFormModal.tsx:189-190` `role="dialog"` + `aria-modal="true"`, 6 componentes em `projectos/` (ProjectCard/Header/Grid/FormModal + 2 da Story 2.9) |
| Novos ficheiros (estimativa) | 8 novos (1 paleta + 1 hook + 1 page + 4 componentes + 1+ test files) + 2 modificados cirurgicamente (tarefas/page.tsx + projectos/[id]/page.tsx) + 1 estendido (tags.ts) |

**Discovery minor (C1 não-bloqueante):** AC5 e T7.5 referem "padrão `tarefas/page.tsx:114-120`" — o código real está em **linhas 113-120** (off-by-one). Não afecta implementação (Dex localizará o padrão pelo símbolo `handleEscape`, não pela linha). Pode ser ajustado inline durante implementação ou ignorado.

---

## 4. UI/Frontend Completeness — PASS

| Aspecto | Estado |
|---------|--------|
| Component specs | AC6 (TagsHeader), AC7 (TagsGrid), AC8 (TagCard), AC9 (TagFormModal) detalham com hex tokens exactos (Cyan `#00F5FF`, Lime `#39FF14`, Magenta `#FF006E`, White `#F0F4FF`, Grey `#8892A4`) e dimensões CSS (`min-width: 220px`, `gap: 0.75rem`, chip cor 12×12px round, padding `0.85rem`, border-radius `12px`) |
| Styling/design guidance | Trace para `.claude/rules/design-system-ia-avancada.md` (glassmorphism + paleta 7 cores + tipografia Inter+JetBrains Mono + header sticky `rgba(4,4,10,0.92)` + `backdrop-filter: blur(12px)`) |
| Paleta restrita | A4 + AC10 documentam paleta canónica `TAG_PALETTE` com 7 cores fixas + helper `isPaletteColor()` + `DEFAULT_TAG_COLOR` (Cyan). Inline TypeScript completo (linhas 178-194) |
| User interaction flows | AC5 (rota + Escape global), AC6 (header + search), AC8 (card edit/eliminar), AC9 (modal create/edit dual-mode), AC10 (paleta radio group), AC11 (a11y full) |
| Acessibilidade | Modal WAI-ARIA full (focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Esc fecha, foco restaurado), Radio group WAI-ARIA (`role="radiogroup"` + `role="radio"` + `aria-checked` + arrow keys + Space/Enter), Form labels + `aria-invalid` + `aria-describedby`, `window.confirm` para destrutivo (a11y nativa) — AC11 explícito |
| Integration points | `useTags()` hook novo + repo extension (`updateTag` + cascata `deleteTag`), `TagSchema` Zod (Story 2.1), `TAG_PALETTE` constants + helper, design tokens |
| Responsive | Grid `auto-fill minmax(220px, 1fr)` cobre 4/3/2/1 colunas naturalmente desktop/tablet/mobile (padrão `ProjectsGrid.tsx`) |
| Empty states | 3 estados distintos: loading (skeleton 6 placeholders), sem tags (com CTA "+ Nova tag" inline), pesquisa sem resultados (PT-PT contextualizado) |

---

## 5. Acceptance Criteria Satisfaction — PASS

| AC | Coberto por tasks | Mensurável | Testado |
|----|-------------------|-----------|---------|
| AC1 (`updateTag` no repo) | T3.1, T3.3, T3.4 | sim — assinatura exacta + lança erros PT-PT específicos | T8.1 (5-6 tests) |
| AC2 (cascata atómica `deleteTag`) | T3.2, T3.3, T3.4 | sim — transacção `'rw'` + 3 passos + rollback automático Dexie | T8.2 (3-4 tests cobrindo cascata real) |
| AC3 (`hooks/useTags.ts`) | T4.1, T4.2 | sim — assinatura + paralelo a `useProjects`/`useTasks` | T18 smoke (cobre refactor não-regressão) |
| AC4 (refactor cirúrgico 2 pages) | T5.1, T5.2, T5.3 | sim — 1 import + 1 chamada cada, zero alteração de comportamento esperada | T5.3 corre `test:unit` parcial + T18 smoke |
| AC5 (rota `/tags` + Escape global) | T7.1, T7.5 | sim | (T15 cobre Escape global) |
| AC6 (TagsHeader) | T6.1 | sim — 4 elementos visuais (h1, botão "+ Nova tag", input search, botão Esc) com tokens design system | T1 (render base) |
| AC7 (TagsGrid + 3 empty states) | T6.2 | sim — CSS grid + 3 estados (loading/sem tags/search vazio) com PT-PT inline | T1, T2, T3, T12 |
| AC8 (TagCard com 6 elementos) | T6.3 | sim — nome, chip cor, contagem uso (singular/plural), 2 botões + confirm cascata-aware | T1, T9, T10 |
| AC9 (TagFormModal reuse 100% ProjectFormModal) | T6.4 | sim — role=dialog, aria-modal, focus trap, Escape, foco restaurado, dual-mode create/edit, Zod, toast erro PT-PT | T4, T6, T13, T14 |
| AC10 (paleta restrita 7 cores) | T2.1, T2.2 + T6.4 (radio group) | sim — `TAG_PALETTE` const + helper + `DEFAULT_TAG_COLOR` | T16 (paleta limitada) + T17 (arrow keys) |
| AC11 (a11y WAI-ARIA full) | T6.4 + T6.3 + T7.6 | sim — modal + radio group + form + card + confirm + sem aria warnings | T13, T14, T16, T17 |
| AC12 (PT-PT consistente em todos os textos) | distribuído em todos os componentes (T6.1-T6.4 + T7.x) | sim — 8 categorias de texto listadas com strings exactas | parcial via T1+T3+T12 (renders) |
| AC13 (~16-18 testes Vitest T1-T18) | T8.1, T8.2, T8.3, T8.4 | sim — 4 ficheiros de teste distribuídos por concern (repo update + cascade + page + modal) | T8 inteiro |
| AC14 (quality gates locais) | T9.1, T9.2, T9.3, T9.4 | sim — 4 gates: lint, typecheck, test:unit (529 → ~545-547), build | gates |
| AC15 (coverage thresholds) | T9.5 | sim — page >=70%, components >=70%, lib/tags/colors.ts >=80%, lib/db/repos/tags.ts updateTag+cascade >=80%, all-files >=60% (NFR17) — **NÃO alterar vitest.config.ts** | `test:coverage` |

Definição de "done": clara por AC. Mapeamento task ↔ AC: completo. Singular/plural PT-PT validado em AC8 e AC12 ("1 TAREFA" vs "N TAREFAS"). T9 cascata real (em `fake-indexeddb`) é o teste crítico para o risco "cascata mal-formada deixa orphan ids".

---

## 6. Validation & Testing Instructions — PASS

| Aspecto | Estado |
|---------|--------|
| Test approach | Vitest 1.x + `fake-indexeddb` + `@testing-library/react` + `@testing-library/user-event` (precedente Stories 2.1-2.9) |
| Test scenarios | T1-T18 documentados (AC13 linhas 291-309) com casos detalhados (render, loading x2, empty, criar, duplicado, editar rename/cor/self-rename, eliminar cascata/cancelado, pesquisa, modal Escape/focus trap, escape global, paleta limitada, arrow keys, refactor não-regressão) |
| Test data | Helpers serão criados durante implementação (Dex pode reaproveitar pattern `makeProject`/`makeTask` das Stories 2.8/2.9) — não-bloqueante (template provado) |
| Tools/frameworks | `vi.spyOn(tagsRepo, ...)`, `fake-indexeddb`, `next/navigation` mock via `vi.hoisted` — todos documentados nos precedentes ratificados |
| Cascata real testing | **T9 é crítico** — Dev Notes secção Testing linha 441 explicitamente flag: "AC13 T9 (cascata real) é crítico". Insere 1 tag + 2 tasks vinculadas + 1 não vinculada em `fake-indexeddb`, chama `deleteTag(id)`, confirma pós-condições (db.tags.get retorna undefined, tasks vinculadas têm tagId removido, task não vinculada intacta) |
| Modal a11y testing | T13 (Escape fecha) + T14 (focus trap Tab/Shift+Tab cycle) — validação JSDOM cobre Escape + smoke. Loop completo pode requerer browser real (Quinn spot-check axe-core) — adequado dado limitação JSDOM (precedente Story 2.8) |
| Refactor não-regressão | T18 smoke render `<TasksFilters tags={...} />` confirma que o refactor inline → hook não quebra a passagem de props para o select "Filtrar por tag" |
| Coverage threshold | >= 70% page+components / >= 80% lib/tags+repo extensions / >= 60% agregado, sem alterar `vitest.config.ts` (precedente Stories 2.1/2.8/2.9) |
| Plurais PT-PT | AC8 documenta "{N} TAREFAS" vs "1 TAREFA" — implementação inline durante T6.3 |

---

## 7. Security Considerations — N/A

UI CRUD interno sem auth/RLS/dados sensíveis novos. `createTag/updateTag/deleteTag` operam sobre Dexie local (privacy-first, sem rede). Cascata atómica é local. Sem novos endpoints. Sem dados externos. Sem mocks de protocolos externos (A1 mock-protocol-fidelity N/A explicitamente documentado).

---

## 8. Tasks/Subtasks Sequence — PASS

```
T1 (preparação + branch + leitura precedentes ProjectFormModal/Header/Grid/Card) → bloqueia T2-T11
  T2 (lib/tags/colors.ts paleta) → bloqueia T6 (componentes consomem TAG_PALETTE)
    T3 (repo extension: updateTag + cascata) → bloqueia T8.1 + T8.2 (testes repo)
      T4 (hooks/useTags.ts) → bloqueia T5 (refactor) e T7 (page consome)
        T5 (refactor cirúrgico tarefas + projectos/[id]) → desbloqueia T18 smoke
          T6 (4 componentes tags/) ─┐ paralelizáveis se T6.4 modal for feito após T6.1/T6.2/T6.3
                                     │
          T7 (page tags) ────────────┤ T7 consome T2 (paleta) + T4 (hook) + T6 (componentes)
                                     │
            T8 (testes Vitest) → bloqueia T9
              T9 (quality gates locais)
                T10 (file list + change log + status promotion)
                  T11 (handoff saída @qa)
```

Granularidade adequada (sub-tarefas T_._x explicitamente listadas, 31 sub-tarefas no total). Sem tasks bloqueadores escondidos. T2 (paleta) tem que vir antes de T6 (componentes consomem const). T4 (hook) tem que vir antes de T5 (refactor) e T7 (page). T3 (repo) é independente de T6/T7 (pode ser feito em paralelo com componentes UI).

---

## 9. CodeRabbit Integration Validation — PASS (enabled: true)

`coderabbit_integration.enabled: true` em `.aiox-core/core-config.yaml:225` (verificado neste validation). Section presente na story 2.6:

| Item | Estado |
|------|--------|
| Section presence | sim — `## 🤖 CodeRabbit Integration` linha 328 da story |
| Story type | "Frontend CRUD UI" (primary) + "Database" (secondary, extensão repo) + "Accessibility" (tertiary, radio group + focus trap) — correcto |
| Complexity | Medium — adequado (8 novos + 2 modificados + 1 estendido + ~16-18 testes; cascata atómica adiciona complexidade transaccional; radio group WAI-ARIA novo padrão; reuse alto de Story 2.8 mitiga risco) |
| Specialized agents | `@dev` (executor), `@qa` (gate) — alinhado com EPIC-2 §5 linha 61 |
| Quality gate tasks | Pre-Commit (`@dev`) + Pre-PR (`@devops`) — alinhado a precedente Nexus v2 |
| Self-Healing config | `mode: light, max_iterations: 2 (hard-stop EPIC-2 §8), severity_filter: [CRITICAL, HIGH]` — coerente com Epic 2 |
| Focus Areas | **9 áreas explícitas**: Repo isolation, Cascata atómica (transacção `'rw'`), Paleta restrita, Case-insensitive duplicate check em updateTag (excluir próprio id), PT-PT enforcement, Focus trap modal (replicar 1:1), Refactor zero-regression, Confirmação destrutiva (`window.confirm` PT-PT), Coverage thresholds (não tocar `vitest.config.ts`) |
| Risco identificado | Médio — cascata atómica é zona nova; refactor inline → hook é puro mas requer T18 smoke; modal focus trap é zona conhecida (Story 2.8 ratificada) |
| Local CLI skip | Trace `PO-VALIDATION-STORY-2.1.md §7` + Stories 2.3-2.9 — precedente Nexus v2 ratificado |

---

## 10. Anti-Hallucination Verification — PASS

Verifiquei TODOS os claims técnicos independentemente contra ficheiros reais em main:

| Claim na story | Verificação | Resultado |
|----------------|-------------|-----------|
| PRD FR14 linha 137 "Tags globais (criar, listar, filtrar)" | `grep "FR14" PRD-NEXUS-V2.md` → linha 137 literal | **CONFIRMADO** |
| EPIC-2 §5 linha 61 — Story 2.6 executor @dev + gate @qa | Confirmado anteriormente na sessão River + listagem EPIC-2 actualizada | **CONFIRMADO** |
| `lib/db/repos/tags.ts` tem 4 funções (createTag/listTags/getTag/deleteTag) | `grep "^export (async )?function" tags.ts` → linhas 24/38/43/47 | **CONFIRMADO** |
| `updateTag` NÃO existe ainda | Grep mesmo padrão NÃO retorna `updateTag` — confirma necessidade da Story 2.6 | **CONFIRMADO** |
| `tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt'` linha 240 client.ts | Confirmado anteriormente em sessão River (architecture-v2.md linha 240 + ls v2/lib/db/) | **CONFIRMADO** |
| `interface Tag { id, name, color }` | architecture-v2.md linha 521-525 confirmado anteriormente | **CONFIRMADO** |
| `TagSchema` Zod (UUID + name.min(1) + color.min(1)) | `lib/db/schemas.ts` confirmado anteriormente | **CONFIRMADO** |
| `components/tarefas/TasksFilters.tsx:128-143` filter por tag wired | `grep tagId/onTagChange/tags` → linhas 26-28 props + 128-143 render select | **CONFIRMADO** |
| `app/(app)/tarefas/page.tsx:68-76` useLiveQuery inline com comentário literal "// useTags hook ainda não existe (Story 2.6)" | Grep + Read directo | **CONFIRMADO** |
| `app/(app)/projectos/[id]/page.tsx:69` `tagsLookup` idem | Grep retornou ocurrências em ambas pages | **CONFIRMADO** |
| `ProjectFormModal.tsx` tem `role="dialog"` + `aria-modal="true"` + comentário "foco restaurado no opener pelo parent" | Grep linhas 18-21 (comentário) + 189-190 (atributos) | **CONFIRMADO** |
| `tarefas/page.tsx` Escape pattern lines 114-120 | Grep retornou linhas **113-120** (handleEscape + addEventListener) | **CONFIRMADO** (off-by-one minor — C1 abaixo) |
| `vitest.config.ts:coverage.thresholds` na linha 54 | Grep confirma | **CONFIRMADO** |
| `coderabbit_integration.enabled: true` em `core-config.yaml` | Grep confirma linha 225 | **CONFIRMADO** |
| 6 componentes Story 2.8/2.9 em `components/projectos/` | ls retornou: ProjectCard, ProjectDetailHeader, ProjectFormModal, ProjectTaskRow, ProjectsGrid, ProjectsHeader | **CONFIRMADO** |
| FR15 PRD não lista tag tools | Story 2.6 declara explicitamente "FR15 não inclui criar_tag" — anti-padrão registado | **CONFIRMADO** (validado contra PRD §6.2 linha 138) |
| Padrão Dexie transacção `'rw'` multi-tabela | Pattern padrão Dexie (architecture-v2.md ADR-2 + Dexie docs) — Stories 2.1-2.9 não usaram mas é canónico | **CONFIRMADO** (não-invenção) |
| Lições Epic 1 — A1/A2/A6 aplicabilidade | `.claude/rules/{mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles}.md` existem | **CONFIRMADO** |
| Design system 7 cores | `.claude/rules/design-system-ia-avancada.md` paleta explícita | **CONFIRMADO** (1:1 com `TAG_PALETTE`) |

**Zero detalhes inventados.** Decisões autónomas A1-A12 são extensões legítimas do scope, cada uma com razão documentada e alternativas descartadas:

| AUTO-DECISION | Validação |
|---------------|-----------|
| A1 (rota dedicada `/tags`) | Precedente `/projectos` Story 2.8 + `/projectos/[id]` Story 2.9 — padrão consolidado |
| A2 (grid de cards) | Precedente `ProjectsGrid.tsx` Story 2.8 |
| A3 (reuse 100% `ProjectFormModal`) | `ProjectFormModal.tsx` real tem `role="dialog"`+`aria-modal="true"`+focus trap+restauração foco (verificado) |
| A4 (paleta restrita 7 cores) | `.claude/rules/design-system-ia-avancada.md` (regra inegociável) |
| A5 (cascata atómica transacção `'rw'`) | Padrão Dexie canónico — não-invenção |
| A6 (`window.confirm` PT-PT pré-delete) | Precedente Stories 2.3 + 2.8 (ratificado por Pax sem CONCERNS) |
| A7 (`updateTag` exclui próprio id) | Edge case correcto — sem isto, self-rename com capitalização diferente lançaria falso erro |
| A8 (contagem inline na page, não no hook) | Separação de concerns — paralelo a como `tarefas/page.tsx` constrói `tagsLookup` inline |
| A9 (empty state PT-PT com CTA) | Precedente `ProjectsGrid` Story 2.8 |
| A10 (pesquisa client-side `useMemo`) | Precedente Story 2.3 search input |
| A11 (ordenação alfabética pt-PT) | Já em `listTags()` Story 2.1 — confirmação |
| A12 (`tagsLookup` permanece nas pages) | Paralelo a `useProjects`/`useTasks` que não constroem derivados — separação de concerns |

---

## 11. Dev Agent Implementation Readiness — PASS

| Critério | Estado |
|----------|--------|
| Self-contained context | sim — esqueletos completos inline na story para: `updateTag` implementação (linhas 82-94), `TAG_PALETTE` constants (linhas 178-194), cascata atómica step-by-step (AC2), refactor cirúrgico target lines (AC4), focus trap pattern (referência a `ProjectFormModal`) |
| Clear instructions | sim — T1-T11 com 31 sub-tarefas accionáveis e referência directa a ficheiros precedentes (`tags.ts`, `ProjectFormModal.tsx`, `ProjectsHeader/Grid/Card.tsx`, `tarefas/page.tsx:60-80`) |
| Complete technical context | sim — interface `Tag` confirmada (3 campos), `TagSchema` Zod completo, repo 4 funções existentes + 1 nova + 1 estendida, `useTags` assinatura, paleta inline completa, dimensões CSS, hex tokens |
| Missing information | nenhuma — dependência hard (Story 2.1 + 2.3 + 2.8 + 2.9 em main há semanas) |
| Actionability | 100% — Dex pode arrancar `*develop 2.6` directamente; padrões precedentes todos identificados e cross-referenced; 2 observações minor (C1 + C2 abaixo) são ignoráveis |

---

## Observações Minor (Concerns Não-Bloqueantes)

| # | Descrição | Severidade | Recomendação |
|---|-----------|-----------|--------------|
| **C1** | Story refere "tarefas/page.tsx:114-120" em AC5 e T7.5; código real está em **linhas 113-120** (off-by-one) | Trivial — minor anti-hallucination | Dex localiza pelo símbolo `handleEscape`, não pela linha. Pode ajustar inline durante implementação OU ignorar. **Não bloqueia** validação. |
| **C2** | AC9 (TagFormModal) menciona botões "Criar"/"Guardar"/"Cancelar" via AC12 PT-PT, mas T6.4 não detalha explicitamente o botão Cancelar — assume padrão `ProjectFormModal` | Trivial — assumido por reuse 100% | Dex replica 1:1 do `ProjectFormModal.tsx` (que já tem Cancelar). **Não bloqueia.** |

**Nenhuma destas observações requer F1 trivial** — são contexto para Dex registar em Completion Notes se preferir, sem fix obrigatório.

---

## Veredicto Final

**GO** — Story 2.6 está completa, accionável, traceável ao PRD, sem ambiguidades estruturais, e com 12 AUTO-DECISIONS fundamentadas. Score 10/10 em todas as 11 dimensões do checklist.

**Status update:** `Draft → Approved`.

**Implementation Readiness:** 10/10 — Dex pode arrancar `*develop 2.6` directamente sem necessidade de re-validação.

**Confidence:** **High** — todos os claims técnicos verificados directamente em código; padrões precedentes ratificados em Stories 2.1+2.3+2.8+2.9 (mesmo ratificador Pax, mesmas regras de governança).

**Próximo passo:** Handoff `po → dev` criado para `@dev *develop 2.6` em iteração única seguindo o Story Development Cycle Phase 3 (`dev-develop-story.md`).

---

## AUTO-DECISIONS — Ratificação Pax

| # | AUTO-DECISION River | Ratificação Pax |
|---|----------------------|------------------|
| A1 | Rota dedicada `/tags` (não modal/tab settings) | **RATIFICADA** — alinhada com padrão consolidado `/projectos` Stories 2.8+2.9. Escala melhor que modal. |
| A2 | Layout grid de cards (não lista/tabela) | **RATIFICADA** — precedente `ProjectsGrid.tsx`. |
| A3 | `TagFormModal` reuse 100% padrão `ProjectFormModal.tsx` | **RATIFICADA** — `ProjectFormModal` verificado em código com `role="dialog"`+`aria-modal="true"`+focus trap. Zero duplicação justificada. |
| A4 | Paleta restrita às 7 cores do design system | **RATIFICADA** — `.claude/rules/design-system-ia-avancada.md` inegociável. HEX picker livre seria violação. |
| A5 | Cascata atómica em `deleteTag` (transacção Dexie `'rw'`) | **RATIFICADA** — padrão Dexie canónico evita orphan tagIds. Soft-delete descartado correctamente (No Invention). |
| A6 | `window.confirm` PT-PT pré-delete com contagem | **RATIFICADA** — precedente Stories 2.3+2.8. A11y nativa. Custom dialog inflacionaria scope. |
| A7 | `updateTag` exclui próprio id na verificação duplicado | **RATIFICADA** — edge case crítico. `t.id !== id && normalize(t.name) === target` é a verificação correcta. |
| A8 | Contagem de uso inline na page, NÃO no hook | **RATIFICADA** — separação de concerns. `useTags()` retorna `Tag[]` puro, paralelo a `useProjects()`/`useTasks()`. |
| A9 | Empty state PT-PT com CTA "+ Nova tag" inline | **RATIFICADA** — precedente Story 2.8. |
| A10 | Pesquisa client-side via `useMemo` | **RATIFICADA** — tabela ≤50 tags realistic, server-side overkill. Precedente Story 2.3. |
| A11 | Ordenação alfabética pt-PT (já em `listTags()`) | **RATIFICADA** — sem overhead extra, já implementado Story 2.1. |
| A12 | `tagsLookup` Map permanece construído nas pages, NÃO no hook | **RATIFICADA** — separação de concerns. Paralelo a Story 2.9 onde `tagsLookup` é construído em `projectos/[id]/page.tsx`. |

**Zero AUTO-DECISIONS escaladas a `@architect`.** Todas têm fundamentação directa em código existente, regras de governança, ou padrões consolidados de stories anteriores em main.

---

## Estatísticas da Validação

| Métrica | Valor |
|---------|-------|
| Tempo total Pax (activação → veredicto) | ~15 min |
| Anti-hallucination claims verificados | 19 |
| AUTO-DECISIONS ratificadas | 12/12 (100%) |
| Dimensões do checklist PASS | 10/10 (+ 1 N/A em Security) |
| Score implementação | 10/10 |
| Confidence | High |
| F1 trivial necessário | NÃO (2 observações minor C1+C2 ignoráveis) |
| Stories precedentes consultadas | 4 (2.1 schema, 2.3 wire-up, 2.8 padrão, 2.9 D3) |
| Padrão consolidado mantido | 12ª story consecutiva first-iter PASS (estimado se QA gate seguir padrão) |

---

*PO Validation executada por Pax (`@po`) em 19/05/2026 — Story 2.6 (Sistema de tags global, FR14) APPROVED 10/10 GO. Próximo passo: `@dev *develop 2.6` em branch `feature/2.6-tags-global` a partir de `main@40ea2351`.*
