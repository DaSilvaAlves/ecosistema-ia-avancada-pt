# RETOMA — Story 2.2 Ready for Review (Dex → Dara, quality gate)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** Dex (`@dev`)
**To:** Dara (`@data-engineer`) — quality gate
**Data:** 15/05/2026
**Story:** 2.2 — Migration localStorage v1 → IndexedDB v2 (refactor via repos)
**Branch:** `feature/2.2-migration-refactor`
**Base:** `main@1cb0e69c` (bookkeeping da Story 2.1; squash `86ddb6a6`)
**Status story:** Approved → Ready for Review
**Próxima acção:** `@data-engineer *review 2.2`

---

## Resumo executivo

Story 2.2 implementada em iteração única (sem qa-loop, sem CodeRabbit local). Refactor cirúrgico de 1 ficheiro de produção (`v1-to-v2.ts`) + 1 ficheiro de teste novo + 1 ajuste num teste pré-existente. Todos os 11 ACs cumpridos. Todos os quality gates locais PASS à primeira:

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | exit 0 |
| `npm run lint` | PASS (1 warning pré-existente fora-scope: `NextResponse` unused em `app/api/auth/logout/route.ts`) |
| `npm run test:unit` | 398/398 PASS (392 pré-existentes + 6 novos da 2.2) |
| `npm run test:coverage` | `lib/db/migrations/v1-to-v2.ts` = **96.22% lines** (alvo AC11: ≥80%) |
| `npm run build` | PASS (12 rotas, middleware 34.5 kB) |

Commit local **ainda não criado** — vou criar agora com os trailers prescritos no briefing. SHA será adicionado a este handoff em segundo passe se a operação anterior à criação do commit falhar; caso normal, ver `git log -1` na branch.

---

## Pontos focais para o quality gate de Dara

Esta secção lista o que Dara deve focar especificamente, alinhado com o seu domínio (data engineering, repos, schemas, migrations):

### 1. Uso correcto de `createTask` (AC1, AC3, AC6)

Confirmar em `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts` linhas 98-112:

- `createTask` importado de `@/lib/db/repos/tasks` (não acedido via `db.tasks.add` ou `db.tasks.bulkAdd` directos)
- Loop `for (const task of tasksV2)` itera tarefa-a-tarefa
- Cada `createTask(task)` está envolvido em `try/catch` individual — falha de uma não bloqueia as restantes
- Em sucesso: `migrated++` apenas após `await createTask` resolver sem lançar
- Em falha: `skipped++` + `console.warn` com mensagem PT-PT (`Tarefa ignorada na migration (id: "${task.id}"): ${error.message}`)
- Soma sempre satisfaz `migrated + skipped === tasksV2.length` quando `status === 'success'` (AC3)

### 2. Loop preserva V1Task → Task mapping original (AC8)

Mapeamento `v1Tasks.map((t) => ({ id: t.id, title: t.text, ... }))` em linhas 81-96 é **byte-a-byte idêntico** ao skeleton da Story 0.3. Dara deve confirmar zero regressão: não foi adicionado campo novo, não foi alterada lógica, não foi alterada ordem. Trace: `architecture-v2.md §4.4`.

### 3. `skipped` counter — cenários edge

Test cenário 4 (`tarefa inválida (id não-UUID)`) cobre AR1 — v1 com `id: 'not-a-uuid'` falha `TaskSchema.parse` (regex UUID), entra no catch, `skipped++` exactamente 1x, console.warn 1x, restantes 2 válidas continuam. Test cenário 1 confirma counter zero quando todas são válidas. Test cenário 2 (idempotência) e cenário 3 (no-data) confirmam que `skipped === 0` nos caminhos que não passam no loop.

### 4. Tests honest — não ajustados para passar (regra `mock-protocol-fidelity.md`)

Aplicação directa do princípio: nenhum dos 6 testes mocka `createTask` para forçar comportamento. O teste usa o real `createTask` (não spy mockado a substituir o behaviour) com `fake-indexeddb` para verificar persistência efectiva (`db.tasks.toArray()` no cenário 1) e usa `vi.spyOn` apenas para contar chamadas (cenários 1, 2, 3). O cenário 4 prova que o invalid id v1 **realmente** falha `TaskSchema` (não é ajuste de expectativa).

### 5. Flag `nexus.v2.migration.done` (NB: nome real é `nexus_v1_migrated_to_v2`) marcado set-once após sucesso (AC4)

Verificar em linha 114: `window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true')` está **depois** do `for...of` loop completo, antes do `return`. Nunca antes do loop. Caminhos secundários:
- `already-done` (linha 65-67): flag verificado, retorna sem tocar repos
- `no-data` (linha 76-79): flag marcado **após** confirmar v1Tasks vazio (mantém comportamento Story 0.3)
- Success com `skipped > 0`: flag também marcado — decisão intencional (re-tentativa de tarefas falhadas requer reset manual do flag; isto é AC4 + Dev Notes "Idempotência — ordem do flag").

### 6. `localStorage` v1 (`nexus_tasks`) intacto após sucesso (AC5)

Test cenário 6 valida com `JSON.stringify(v1Tasks) === localStorage.getItem('nexus_tasks')` após `migrateV1ToV2()` PASS. Nunca chamamos `localStorage.removeItem('nexus_tasks')` em código. Trace: `architecture-v2.md §4.4` ("localStorage v1 mantém-se para rollback emergência"). Cleanup é Story 8.10.

### 7. Test pré-existente actualizado em `tests/unit/db/client.test.ts`

O teste de Story 0.3 (`migra tarefas v1 para v2 quando flag ausente`, linhas 98-122) tinha hard-coded `id: 't1'` (não-UUID). Sob o regime antigo (`db.tasks.bulkAdd`), Dexie não validava — passava. Sob o novo regime (`createTask` com `TaskSchema.parse`), `id: 't1'` falha validação UUID e vai para `skipped` (AC6). Actualizei o teste para usar `crypto.randomUUID()` — alinhamento canónico com o happy path da nova migration. Adicionada asserção `expect(result.skipped).toBe(0)`. Sem regressão de comportamento: este teste representa exactamente o que representava antes (caminho de sucesso) — só foi sintonizado para o que `createTask` agora exige.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.2-ready-for-data-engineer-quality-gate.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Decisões de implementação (trace cada uma a AC ou trailer)

| # | Decisão | Trace |
|---|---------|-------|
| D1 | Substituí `db.transaction('rw', db.tasks, async () => db.tasks.bulkAdd(tasksV2))` por loop `for...of` com `try { createTask } catch { skipped++ }` | AC1, AC6, AUTO-DECISION 3 (sem transacção wrapping — fundamentação em Dev Notes da story) |
| D2 | Adicionei `skipped: number` ao `MigrationResult` interface | AC2, AC3, AC7 |
| D3 | Eliminei o import `import { db } from '@/lib/db/client'` — deixou de ter usos após substituir bulkAdd | T3.4 (verificação prévia obrigatória, confirmada) |
| D4 | Mensagem de console.warn em PT-PT exactamente como prescrito em AC6: `Tarefa ignorada na migration (id: "${task.id}"): ${error.message}` | AC6 |
| D5 | Flag marcado **depois** do loop completo (mesmo com `skipped > 0`) | AC4 + Dev Notes secção "Idempotência — ordem do flag" |
| D6 | `index.ts` **não** foi modificado — `export type { MigrationResult }` forwarda automaticamente o campo novo | AC7 (cumprido por type-passthrough) |
| D7 | Test cenário 4 usa `vi.spyOn(console, 'warn').mockImplementation(() => {})` para evitar poluição de stderr nos outros 397 testes e para asserção `warnSpy.mock.calls[0][0]` | T4.4 + AC6 (mensagem PT-PT verificável) |
| D8 | Test pré-existente em `client.test.ts` actualizado para `crypto.randomUUID()` em vez de `'t1'` | Alinhamento canónico com novo regime Zod; sem regressão de comportamento (mesmo caminho de sucesso, expectativa sintonizada) |

---

## File List autoritativa

**Modificados (3):**
- `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts` — refactor bulkAdd → loop createTask + `skipped` + remoção do import `db`
- `imersao-tools/nexus/v2/tests/unit/db/client.test.ts` — UUID válido no test pré-existente + asserção `skipped === 0`
- `imersao-tools/nexus/docs/stories/2.2.story.md` — Dev Agent Record, tasks T1-T6 `[x]`, status `Approved → Ready for Review`, Change Log v0.3

**Novos (1):**
- `imersao-tools/nexus/v2/tests/unit/db/migrations/v1-to-v2.test.ts` — 6 cenários AC9 (~159 linhas)

**Intencionalmente NÃO modificados:**
- `imersao-tools/nexus/v2/lib/db/migrations/index.ts` — `export type` forwarda automaticamente (AC7 by type-passthrough)
- `imersao-tools/nexus/v2/vitest.config.ts` — proibido por AC11
- Qualquer schema, repo, ou ficheiro fora de `migrations/`

---

## Commit trailers usados

```
Constraint: Migration deve preservar Zod validation per-item (AUTO-DECISION 3)
Rejected: db.transaction() wrapping loop | contornaria validação Zod
Confidence: high
Scope-risk: narrow
Directive: NÃO regridir migration de notas — está intencionalmente fora deste scope (AUTO-DECISION 4)
```

`Not-tested:` — **não usado** (nenhum path bloqueador tocado; `not-tested-trailer-rules.md` clean).

---

## Edge cases tratados (6 cenários AC9)

| # | Cenário | Resultado esperado | Resultado real |
|---|---------|-------------------|----------------|
| 1 | Happy path: 3 v1 válidas | migrated=3, skipped=0, status=success, flag=true, 3 tasks persistidas em Dexie | PASS |
| 2 | Idempotência: flag pré-marcado | migrated=0, skipped=0, status=already-done, spy createTask NÃO chamado | PASS |
| 3 | No-data: localStorage sem nexus_tasks | migrated=0, skipped=0, status=no-data, flag=true | PASS |
| 4 | Invalid task (id 'not-a-uuid') + 2 válidas | migrated=2, skipped=1, status=success, flag=true, console.warn 1x com PT-PT msg + id | PASS |
| 5 | SSR guard (window undefined) | migrated=0, skipped=0, status=failed, error='No window (SSR)' | PASS |
| 6 | localStorage v1 intacto após sucesso | `JSON.stringify(original) === localStorage.getItem('nexus_tasks')` after success | PASS |

---

## Flag/risco residual para Dara

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| AR1 (briefing) — V1Task com `id` não-UUID vai para `skipped` | Dependendo de quão antigos são os dados Nexus v1 reais, isto pode produzir `skipped > 0` em produção | Documentado em Dev Notes story; mensagem PT-PT informa o utilizador; localStorage v1 intacto permite recovery manual; Story 8.10 fará cleanup final |
| Coverage `v1-to-v2.ts` em 96.22% — falta cobertura nas linhas 73-74 (JSON.parse catch) | Baixo — esse path é o caminho de defesa contra `JSON.parse` falhar; já estava sem cobertura no skeleton Story 0.3 | Aceitável: 96.22% > 80% alvo AC11. Adicionar teste do JSON malformado é fora do scope da 2.2 (era débito pré-existente da 0.3) |
| Flag continua marcado mesmo com `skipped > 0` | Tarefas inválidas só podem ser reprocessadas se o flag for resetado manualmente | Intencional (Dev Notes story); contrato AC4 explícito; permite reset cirúrgico se necessário no Story 8.10 |

---

## Verificação de regra `separation-of-roles.md` (A6)

| Pessoa | Papel | Conflito? |
|--------|-------|----------|
| Dex (`@dev`) | Executor da Story 2.2 (refactor de código) | Não — não validou a 2.2 |
| Dara (`@data-engineer`) | Quality gate da Story 2.2 (próxima acção) | Não — executou a Story 2.1 mas é gate da 2.2 (par diferente) |
| Story 2.1 | Executor `@data-engineer`, gate `@qa` | Sem sobreposição com 2.2 |

Inversão A6 vs Story 2.1 confirmada conforme briefing.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.2-ready-for-data-engineer-quality-gate.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Dex (`@dev`)
DATA: 15/05/2026

---

## Próxima acção

`@data-engineer *review 2.2` (ou `*qa-gate 2.2` conforme convenção do agent Dara). Branch `feature/2.2-migration-refactor` local, ainda **não pushed** (delegação T7 a `@devops` após gate aprovar).
