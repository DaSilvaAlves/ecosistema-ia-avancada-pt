# RETOMA — Story 2.3 APPROVED (River → Uma)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** River (`@sm`) — F1 apply completo
**To:** Uma (`@ux-design-expert`)
**Data:** 15/05/2026
**Story:** 2.3 — Vista lista de tarefas (com secção dedicada de atrasadas)
**Branch sugerida:** `feature/2.3-vista-lista` (Uma cria local ao arrancar `*develop`)
**Status story:** **Approved** (Draft → Approved via F1 apply 15/05/2026, sem nova validação Pax — alinhamento factual)
**Veredicto Pax:** GO conditional 9/10 → APPROVED · 4/4 [AUTO-DECISION] D1-D4 RATIFICADAS
**Próxima acção:** `@ux-design-expert *develop 2.3` (recomendado após push da 2.2 em main, não-bloqueador)

---

## Resumo executivo

Story 2.3 está pronta para execução. River aplicou F1 (13 edições — 11 oficiais do Pax + 2 coerência interna em CodeRabbit Focus Areas e Risk AR2 que tinham eco do erro factual). Sem alteração de scope. Os 12 ACs originais mantêm-se válidos, apenas as instruções de implementação foram corrigidas para reflectir que `useProjects`, `repos/projects.ts` e `repos/tags.ts` **existem** em disco (entregues pela Story 2.1 sob interpretação "Data Access Layer").

Uma encontra um documento de story limpo, com 4 [AUTO-DECISION] ratificadas (Open Questions fechadas como GO), 12 ACs binários, 10 tasks operacionais (T3.3/T3.4 corrigidas para usar APIs reais), Dev Notes com tabela de ficheiros relevantes actualizada (3 linhas novas: useProjects + repos/projects + repos/tags), Anti-pattern detector com nova linha sobre acesso directo a projects/tags, Anti-padrões com novo bullet, e Change Log v0.2.

---

## Acção concreta para `@ux-design-expert` Uma

1. **Ler** a story 2.3 completa em `imersao-tools/nexus/docs/stories/2.3.story.md` (~600 linhas, Approved v0.2)
2. **Confirmar leitura das regras obrigatórias:**
   - `.claude/rules/design-system-ia-avancada.md` (tokens visuais — background `#04040A`, glassmorphism, paleta restrita)
   - `.claude/rules/separation-of-roles.md` (A6 — Uma executa, Dex faz gate)
   - `.claude/rules/not-tested-trailer-rules.md` (paths bloqueadores — N/A para esta story)
3. **Esperar push da 2.2** (`@devops *push` da branch `feature/2.2-migration-refactor`) — recomendado, não-bloqueador. Se Uma quiser arrancar em paralelo, aceitar rebase posterior.
4. **Após push da 2.2 em main:** executar `*develop 2.3`:
   - Criar branch local `feature/2.3-vista-lista` a partir de `main` actualizado
   - Implementar T1-T10 conforme story file
   - Quality gates locais (T8): lint + typecheck + test:unit + build + coverage ≥70%
   - File List + Change Log v0.3 + Dev Agent Record (T9)
   - Delegar push a `@devops *push` (T10)

---

## 4 [AUTO-DECISION] ratificadas — relembrar antes de implementar

| # | Decisão | O que Uma NÃO deve fazer |
|---|---------|--------------------------|
| **D1** | Sem drag-and-drop em list view | NÃO importar `@dnd-kit` no scope da 2.3 (mesmo que dep esteja em `package.json` — é para 2.4/2.5) |
| **D2** | Tabs Kanban/Calendário disabled (placeholders) | NÃO implementar funcionalidade Kanban/Calendar; só placeholder visual com `aria-disabled="true"` + tooltip |
| **D3** | Overdue = `dueDate < startOfToday()` em local time | NÃO usar `< Date.now()` ou outras definições; extrair para `lib/tarefas/isOverdue.ts` (T2.2) |
| **D4** | Kebab "Editar" disabled (placeholder + toast) | NÃO criar TaskModal ou implementar edição inline; apenas "Apagar" funcional |

---

## 3 Suggested Fixes (não-bloqueadores, Uma decide em develop)

| SF | Sugestão | Razão |
|----|----------|-------|
| **SF1** | Uniformizar tooltip "Disponível na Story 2.4" → "Em construção · Story 2.4" (idem 2.5) | Alinha com badge AC2 ("Em construção") — copy mais coerente; trivial |
| **SF2** | Verificar contraste do tinting magenta (row overdue) — manter AA ≥ 4.5:1 | AC8 a11y compliance; smoke test visual manual durante T6.3 |
| **SF3** | Desdobrar T8 de AC10 em T8a (confirm=true → delete chamado) + T8b (confirm=false → delete NÃO chamado) | Melhora rastreabilidade coverage report; trivial |

> SF1-SF3 são opcionais. Uma pode aplicá-las inline durante develop ou registar TODO retrospectiva. Nenhuma bloqueia o quality gate.

---

## Dependências técnicas (verificadas em disco por Pax + River)

| Item | Estado | Onde usar |
|------|--------|-----------|
| `hooks/useTasks.ts` | EXISTE — `useTasks(opts): Task[] \| undefined` | Consumo principal de tarefas (AC6, T1) |
| `hooks/useProjects.ts` | EXISTE — `useProjects(opts): Project[] \| undefined` | Select Projecto (AC4, T3.3) |
| `lib/db/repos/tasks.ts` | EXISTE — `listTasks/setTaskStatus/deleteTask/updateTask/getTask` | Acções (AC5, T4) |
| `lib/db/repos/projects.ts` | EXISTE — `listProjects/getProject/createProject/updateProject/archiveProject` | Opcional (já abstraído por `useProjects`) |
| `lib/db/repos/tags.ts` | EXISTE — `listTags/getTag/createTag/deleteTag` | Select Tag via `useLiveQuery(() => listTags())` (AC4, T3.4); `useTags.ts` hook ainda não existe — Uma decide se cria ou inline |
| `db.projects` table | EXISTE (Dexie v1) | Não tocar directamente — usar `useProjects()` |
| `db.tags` table | EXISTE (Dexie v2) | Não tocar directamente — usar `listTags()` |
| `@dnd-kit/core` | EM DEPS | NÃO usar em 2.3 (D1 — só 2.4/2.5) |
| `@radix-ui/react-dropdown-menu` | NÃO está em deps | T4.5 usa primitivo `<details>` ou implementação custom |
| `axe-core` / `vitest-axe` | NÃO em devDeps | T6.4 regista TODO retrospectiva se não criado neste scope |
| `lucide-react` | EM DEPS | Disponível para ícones (kebab, atrasada — Magenta) |
| `date-fns` | EM DEPS | Usado em `startOfToday()` de D3 (T2.2) |
| `tests/setup.ts` (jsdom + fake-indexeddb) | EXISTE | Reutilizar — `beforeEach` pattern |
| `Skeleton` component | NÃO existe | Uma cria em T5.1 (componente local pequeno, sem package) |
| `useDebounced` hook | NÃO existe | Uma cria em T3.2 (`hooks/useDebounced.ts`) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-approved-ready-for-ux-design-expert.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Constraint de execução (não-bloqueador mas recomendado)

Antes de Uma arrancar `*develop 2.3`:

1. ✅ F1 aplicado por River (este handoff documenta) — DONE
2. ⏳ Story 2.2 mergeada em `main` (`@devops *push` da branch `feature/2.2-migration-refactor` → PR → merge) — PENDING

**Razão:** Story 2.2 altera `lib/db/migrations/v1-to-v2.ts` + `tests/unit/db/`. Story 2.3 cria `app/(app)/tarefas/`, `components/tarefas/`, `lib/tarefas/`, `hooks/useDebounced.ts`, `tests/unit/app/tarefas/`, `tests/unit/lib/tarefas/`. **Não há overlap de ficheiros** — Uma pode tecnicamente arrancar em paralelo. Mas Pax recomenda esperar pela base limpa para evitar rebases complexos se 2.2 tiver iterações CR.

**Decisão de Uma:** se aceitar rebase posterior, pode arrancar agora. Senão, esperar push 2.2.

---

## Working tree noise (ignorar)

Conforme handoff `RETOMA-20260515-story-2.2-closed-ready-for-devops-push.md`, o working tree tem ruído de outras sessões. Uma deve ignorar:

- `M comunidade submodule` — ponteiro do submódulo divergente, não relacionado
- `.agent/`, `.aiox-* configs`, `.cursor/`, `.antigravity/` — backups de regras geradas por outras ferramentas IDE, não tocar
- `?? imersao-tools/nexus/Apresentação do Néctar.txt` — ficheiro pessoal, ignorar
- `?? imersao-tools/nexus/docs/PO-VALIDATION-*.md` + `PR-BODY-*.md` + `QA-GATE-*.md` — docs administrativos das stories já concluídas, podem ser commitados em separado por `@devops` mas não bloqueiam 2.3
- `?? imersao-tools/nexus/docs/handoffs/.claude/` — ficheiro inesperado, ignorar
- `?? imersao-tools/nexus/docs/handoffs/CUsers...cr-review-iter3.txt` — temp file mal-localizado de iteração antiga, ignorar

> Uma deve correr `git status -s -- imersao-tools/nexus/v2/` ao arrancar, focando apenas em ficheiros que CRIE para a 2.3.

---

## Aderência a regras AIOX (auto-check River)

| Regra | Aderência |
|-------|-----------|
| `handoff-location.md` | PASS — 3 blocos obrigatórios presentes (início/meio/fim) |
| `separation-of-roles.md` A6 | PASS — executor Uma ≠ quality gate Dex |
| `not-tested-trailer-rules.md` A3 | PASS — story §"Not-Tested Evidence Gate" classifica como sem paths bloqueadores |
| `mock-protocol-fidelity.md` A1 | PASS — N/A nesta story (sem mocks de protocolos externos) |
| Constitution Artigo I (CLI First) | PASS — toda a interacção via comando AIOX |
| Constitution Artigo II (Agent Authority) | PASS — River corrige story file (autoridade SM), delega develop a Uma |
| Constitution Artigo III (Story-Driven) | PASS — Approved antes de develop arrancar |
| Constitution Artigo IV (No Invention) | PASS — F1 corrigiu afirmação errada de River; ACs traçam a fontes |
| Constitution Artigo V (Quality First) | PASS — 12 ACs binários, 10 cenários teste, gates locais explícitos, coverage ≥70% |
| Language Standards PT-PT | PASS — story integralmente PT-PT; AC9 enforça termos canónicos |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-approved-ready-for-ux-design-expert.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 15/05/2026

---

## Artefactos modificados/criados por River nesta sessão (F1 apply)

- **Modificado:** `imersao-tools/nexus/docs/stories/2.3.story.md` — 13 edições aplicadas:
  1. AC4 Select Projecto: `db.projects.toArray()` → `useProjects()` de `@/hooks/useProjects`
  2. AC4 Select Tag: `db.tags.toArray()` → `useLiveQuery(() => listTags())` de `@/lib/db/repos/tags`
  3. AC6: APIs canónicas reescritas para incluir useProjects/listTags; proibições alargadas
  4. T3.3: corrigido para `useProjects()`
  5. T3.4: corrigido para `useLiveQuery(() => listTags())`; nota sobre criar `useTags` opcional
  6. Dev Notes "Ficheiros relevantes": +3 linhas (useProjects.ts, repos/projects.ts, repos/tags.ts)
  7. Dev Notes "Anti-pattern detector": +1 linha (Acesso directo a projects/tags)
  8. Dev Notes "Não-inventar": bullet sobre repos corrigido (não-criar duplicados de Story 2.1)
  9. Open Questions: nota de fecho no topo (resolução Pax — Q1-Q4 GO, D1-D4 ratificadas)
  10. Anti-padrões: +1 bullet sobre `db.projects.*`/`db.tags.*`
  11. Status: Draft → Approved + Change Log v0.2
  12. **Coerência interna** CodeRabbit Focus Areas: actualizada para reflectir useProjects + listTags
  13. **Coerência interna** Risk AR2: reformulado (de "acesso directo a db" para "scope-creep ao criar useTags")
- **Modificado:** `imersao-tools/nexus/docs/EPIC-2.md` — linha da Story 2.3 (estado `Drafted` → `Approved`)
- **Criado:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-approved-ready-for-ux-design-expert.md` (este ficheiro)
- **A modificar nesta sessão:** `imersao-tools/nexus/docs/handoffs/INDEX.md` — arquivar handoff de entrada + adicionar este em pending
- **A arquivar nesta sessão:** `RETOMA-20260515-story-2.3-validated-go-conditional-f1-trivial-apply.md` → `archive/`

---

## Próxima acção

`@ux-design-expert *develop 2.3` — Uma:

1. Espera push da 2.2 em main (recomendado) OU arranca em paralelo aceitando rebase posterior
2. Cria branch local `feature/2.3-vista-lista` a partir de `main` actualizado
3. Implementa T1-T10 conforme story file (12 ACs binários como critério de sucesso)
4. Aplica SF1-SF3 inline se julgar útil (não-bloqueador)
5. Quality gates locais (T8): lint + typecheck + test:unit + build + coverage ≥70%
6. File List + Change Log v0.3 + Dev Agent Record (T9)
7. Delegar quality gate a `@dev *qa-gate 2.3` (A6 respeitada — gate é Dex, executor é Uma)

**Sequência projectada:**

```
@ux-design-expert *develop 2.3 (após push 2.2)
  → @dev *qa-gate 2.3 (A6 respeitada)
  → @po *close-story 2.3
  → @devops *push
```
