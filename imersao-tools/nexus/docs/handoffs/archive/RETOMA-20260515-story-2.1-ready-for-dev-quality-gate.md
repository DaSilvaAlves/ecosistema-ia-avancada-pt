# RETOMA — Story 2.1 Ready for Review (Quality Gate por @dev)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

| Campo | Valor |
|-------|-------|
| Data | 15/05/2026 |
| Autor | Dara (`@data-engineer`) |
| Destinatário | Dex (`@dev`) — quality gate |
| Story | 2.1 — Schema tarefas/projectos (Data Access Layer Dexie v2) |
| Epic | 2 — Tarefas v2 + Projectos |
| Status story | Approved → **Ready for Review** |
| Branch | `feature/2.1-schema-tarefas-projectos` |
| Commit | `c1f15a2b` (a partir de `main@6c494b19`) |
| Iterações qa-loop-fix | 0 / 2 (hard-stop não atingido) |
| Próxima entidade | `@dev` (Dex) — quality gate |

---

## Resumo executivo

Implementação completa T1-T8 da Story 2.1 numa única iteração. Zero qa-loop-fix necessário.
Todos os quality gates locais PASS à primeira:

| Gate | Resultado |
|------|-----------|
| `npm run lint` | PASS — 1 warning pré-existente (`app/api/auth/logout/route.ts:1` `NextResponse` unused, fora do scope Story 2.1) |
| `npm run typecheck` | exit 0 |
| `npm run test:unit` | **392/392 PASS** (32 ficheiros) — incl. 67 novos da Story 2.1 |
| `npm run build` | PASS — Next.js 15.5.15, 10/10 pages, 5.5s compile |
| `npm run test:coverage` | **100% lines** em `lib/db/repos/**` + `lib/db/schemas.ts` (AC15 alvo ≥80%); global 88.35% |

Constraint A6 `separation-of-roles.md` respeitado: executor `@data-engineer` (Dara) ≠ quality_gate `@dev` (Dex).

---

## O que foi feito (T1-T8)

| Task | Acção | Resultado |
|------|-------|-----------|
| T1 | Validação inicial — ler PO-VALIDATION §1 + story file, confirmar Q1/Q2/Q3 baked-in, mapear código existente | Q1/Q2/Q3 confirmadas Approved em `2.1.story.md` (linhas 73-82) |
| T2 | Schema increment Dexie `version(2)` | `client.ts` modificado: 2 Tables novas (`recurrences`, `tags`), `version(2).stores({...})` aditivo, comentário linha 22 corrigido |
| T3 | Schemas Zod | `lib/db/schemas.ts` criado — 4 schemas (Task/Project/Recurrence/Tag) + enums + types, mensagens PT-PT |
| T4 | Repos tipados (4 ficheiros) | `repos/tasks.ts` (6 funcs), `repos/projects.ts` (5 funcs incl. `archiveProject`), `repos/recurrences.ts` (4 funcs incl. `getRecurrenceByOwner`), `repos/tags.ts` (4 funcs incl. `createTag` dedup case-insensitive) |
| T5 | Hooks reactivos | `useTasks.ts` + `useProjects.ts` — wrappers `useLiveQuery` reactivos, padrão Story 1.1 |
| T6 | Tests Vitest (6 ficheiros, 67 tests) | `tasks.test.ts` (18), `projects.test.ts` (9), `recurrences.test.ts` (8), `tags.test.ts` (10), `schemas.test.ts` (19 negativos AC12), `schema-upgrade.test.ts` (3 — AC13 mitiga AR2) |
| T7 | Quality gates locais | Todos PASS — ver tabela acima |
| T8 | Story file maintenance | Tasks 1-8 marcadas [x]; Dev Agent Record preenchido (10 completion notes + File List com 14 ficheiros); Change Log v1.2; Status Approved → Ready for Review; "Próximo passo natural" actualizado |

T9 (delegar push) é o que este handoff faz.

---

## Decisões `@po` baked-in nos repos

| # | Decisão | Onde está no código |
|---|---------|---------------------|
| Q1 | `Task.tags` guarda IDs (rename-safety) | `repos/tasks.ts:48-52` — `db.tasks.where('tags').anyOf([tagId])` via índice multi-entry `*tags`, com dedup defensivo via `Set` |
| Q2 | Dedup tags case-insensitive repo-level (sem `&name`) | `repos/tags.ts:24-36` — `normalize(name) = name.trim().toLowerCase()`, mensagem PT-PT `Já existe uma tag com o nome "{name}"` |
| Q3 | Índice composto `[ownerType+ownerId]` em recurrences | `client.ts:67` schema + `repos/recurrences.ts:35-43` query |

Tests cobrem cada decisão:
- Q1: `tasks.test.ts` "listTasks filtra por tag (id) via índice multi-entry *tags" + combinação status+tag
- Q2: `tags.test.ts` 3 variantes ("Urgente" vs "urgente"/"URGENTE", whitespace, preservação capitalização)
- Q3: `recurrences.test.ts` "getRecurrenceByOwner usa índice composto" + distinção ownerType para mesmo ownerId

---

## File List (autoritativo)

**14 ficheiros + 1 rename incidental:**

Novos (13):
1. `imersao-tools/nexus/v2/lib/db/schemas.ts`
2. `imersao-tools/nexus/v2/lib/db/repos/tasks.ts`
3. `imersao-tools/nexus/v2/lib/db/repos/projects.ts`
4. `imersao-tools/nexus/v2/lib/db/repos/recurrences.ts`
5. `imersao-tools/nexus/v2/lib/db/repos/tags.ts`
6. `imersao-tools/nexus/v2/hooks/useTasks.ts`
7. `imersao-tools/nexus/v2/hooks/useProjects.ts`
8. `imersao-tools/nexus/v2/tests/unit/db/repos/tasks.test.ts`
9. `imersao-tools/nexus/v2/tests/unit/db/repos/projects.test.ts`
10. `imersao-tools/nexus/v2/tests/unit/db/repos/recurrences.test.ts`
11. `imersao-tools/nexus/v2/tests/unit/db/repos/tags.test.ts`
12. `imersao-tools/nexus/v2/tests/unit/db/schemas.test.ts`
13. `imersao-tools/nexus/v2/tests/unit/db/schema-upgrade.test.ts`
14. `imersao-tools/nexus/docs/stories/2.1.story.md` (story file actualizada)

Modificados (1):
- `imersao-tools/nexus/v2/lib/db/client.ts` — adiciona `recurrences`/`tags` Tables + `version(2).stores({...})` aditivo + corrige comentário linha 22

**Rename incidental:**
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260514-epic-2-created-ready-for-sm-draft.md` → `archive/` (já estava staged pelo `@sm` em sessão anterior, ficou junto neste commit — não-bloqueante, alinhado ao contexto Epic 2)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-ready-for-dev-quality-gate.md`. CONSULTAR `.claude/rules/handoff-location.md` — handoffs de Nexus vivem dentro de `imersao-tools/nexus/docs/handoffs/`. Caminho está correcto.

---

## Acceptance Criteria — estado

| AC | Resumo | Estado |
|----|--------|--------|
| AC1 | `version(2).stores({...})` aditivo sem reescrever `version(1)` | ✅ `client.ts:65-68` |
| AC2 | `recurrences!: Table` + `tags!: Table` declarados | ✅ `client.ts:32-33` |
| AC3 | Índices `recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]'` + `tags: 'id, name'` | ✅ `client.ts:66-67` |
| AC4 | Comentário errado em `client.ts:22` corrigido | ✅ `client.ts:21-23` agora descreve Epic 2 real |
| AC5 | `lib/db/schemas.ts` com 4 schemas Zod PT-PT | ✅ 97 linhas, 4 schemas + enums + types |
| AC6 | `repos/tasks.ts` — 6 funções + filtro por tag id | ✅ 92 linhas, dedup `Set` defensivo |
| AC7 | `repos/projects.ts` — 5 funções incl. `archiveProject` | ✅ 64 linhas, archiveProject muda status para 'paused' (não inventa 'archived') |
| AC8 | `repos/recurrences.ts` — `getRecurrenceByOwner` via `[ownerType+ownerId]` | ✅ 52 linhas |
| AC9 | `repos/tags.ts` — `createTag` rejeita duplicado case-insensitive PT-PT | ✅ 49 linhas, preserva capitalização original |
| AC10 | Hooks `useTasks`, `useProjects` reactivos via `useLiveQuery` | ✅ 19+24 linhas |
| AC11 | Tests CRUD por repo + filtros + index composto + duplicado | ✅ 45 tests nos 4 repo test files |
| AC12 | Tests Zod negativos | ✅ 19 tests em `schemas.test.ts` |
| AC13 | Teste upgrade `version(1)` → `version(2)` preserva dados | ✅ 3 tests em `schema-upgrade.test.ts` (mitigação AR2) |
| AC14 | lint + typecheck + test:unit + build PASS | ✅ todos PASS |
| AC15 | Coverage ≥80% lines em `lib/db/repos/**` + `lib/db/schemas.ts`; **não tocar** `vitest.config.ts` | ✅ 100% lines em ambos; `vitest.config.ts` intacto |

**15/15 ACs satisfeitos.**

---

## Next action — `@dev` quality gate

Comandos para Dex executar (não é necessário implementação adicional, só revisão):

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/imersao-tools/nexus/v2
git checkout feature/2.1-schema-tarefas-projectos
git log --oneline -1   # confirmar HEAD == c1f15a2b
git diff main..HEAD --stat   # ver scope

npm run typecheck   # já PASS
npm run lint        # já PASS (1 warning pré-existente)
npm run test:unit   # 392/392 PASS
npm run build       # PASS
npm run test:coverage   # 100% em lib/db/repos/** + lib/db/schemas.ts
```

Adicionalmente, revisão lógica focada em:

1. **Q1 baked-in correcto** (`tasks.ts:42-58`): confirmar que `listTasks({ tag })` recebe **tag id**, não nome, e que `anyOf([tag])` está semanticamente correcto (multi-entry index)
2. **Q2 case-insensitive** (`tags.ts:24-36`): confirmar que `normalize()` apanha "Urgente"/"urgente"/"URGENTE" e que persiste com capitalização original
3. **Q3 índice composto** (`client.ts:67` + `recurrences.ts:35-43`): confirmar sintaxe Dexie `[ownerType+ownerId]` em ambos os sítios
4. **AC13 schema-upgrade** (`schema-upgrade.test.ts:30-54`): a réplica `NexusDBV1Only` reproduz fielmente o estado pré-Story 2.1 — confirmar que isso é honest mocking (regra `mock-protocol-fidelity.md`)
5. **`archiveProject` semântica** (`projects.ts:47-54`): não inventa estado `'archived'`, apenas muda para `'paused'`
6. **Lint warning pré-existente**: `app/api/auth/logout/route.ts:1` `NextResponse` não usado — não é Story 2.1, deixar para limpeza separada

Output do `@dev`:
- Preencher secção QA Results no `2.1.story.md`
- Veredicto: PASS / CONCERNS / FAIL
- Se CONCERNS: listar items concretos para `@data-engineer` ajustar (max 2 iter qa-loop-fix antes de escalação a `@architect`)
- Se PASS: handoff para `@po *close-story 2.1`

---

## Sequência completa após este handoff

```
@data-engineer (impl, DONE) → @dev (quality gate, NEXT)
  → @po *close-story 2.1
  → @devops *push
     (commit local c1f15a2b já existe; @devops faz push da branch e abre PR;
      CodeRabbit corre no PR via integração GitHub — convenção Nexus v2)
```

---

## Bloqueios / Pontos de atenção

| # | Item | Severidade |
|---|------|-----------|
| 1 | Rename incidental `RETOMA-20260514` archive ficou no commit `c1f15a2b` (estava staged pelo @sm em sessão anterior, alinhado a Epic 2) | Baixa — não-bloqueante |
| 2 | Working tree continua com modificações não-Story-2.1 (submodules `comunidade`/`starter-builder`, `INDEX.md`, untracked em `.agent/`/`.antigravity/` etc.) — não fazem parte deste commit | Baixa — herança da árvore |
| 3 | AC13 schema-upgrade test usa `fake-indexeddb` (`tests/setup.ts`) — mock fiel ao protocolo IndexedDB (Dexie corre nativamente) mas não é a engine browser real. Confirma o upgrade path lógico, não a robustez do storage real | Baixa — regra mock-protocol-fidelity respeitada; e2e Playwright real-browser fica para Story 2.3+ |
| 4 | Story 2.2 (migration v1-to-v2.ts refactor para usar repos) e Story F.1 (raise threshold global coverage) ficam fora do scope | Não-bloqueante — explicitamente fora |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-ready-for-dev-quality-gate.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-ready-for-dev-quality-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@data-engineer` (Dara)
DATA: 15/05/2026

— Dara, arquitetando dados 🗄️
