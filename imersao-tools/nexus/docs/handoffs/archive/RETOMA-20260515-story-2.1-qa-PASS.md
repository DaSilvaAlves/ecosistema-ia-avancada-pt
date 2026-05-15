# RETOMA — Story 2.1 QA Gate PASS

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

| Campo | Valor |
|-------|-------|
| Data | 15/05/2026 |
| Autor | Quinn (`@qa`) |
| Destinatário | Pax (`@po`) — `*close-story 2.1`; depois Gage (`@devops`) — `*push` |
| Story | 2.1 — Schema tarefas/projectos (Data Access Layer Dexie v2) |
| Epic | 2 — Tarefas v2 + Projectos |
| Status story | Ready for Review → **Done** (QA PASS) |
| Branch | `feature/2.1-schema-tarefas-projectos` |
| Commit | `c1f15a2b` (a partir de `main@6c494b19`) |
| Veredicto QA | **PASS** |
| Iterações qa-loop-fix consumidas | 0 / 2 (hard-stop não atingido) |
| Próxima entidade | `@po` (Pax) — close-story formal; depois `@devops` (Gage) — push + PR |

---

## Resumo executivo

Quality gate da Story 2.1 executado por Quinn. **PASS** sem qa-loop-fix necessário. Todos os 15 ACs verificados directamente no código (não só na documentação). As 6 verificações lógicas focais do handoff de Dara — Q1/Q2/Q3/AC13/archiveProject/lint warning — confirmadas. Gates locais re-executados por Quinn batem com o reportado por Dara.

Constraint `separation-of-roles.md` respeitado: executor `@data-engineer` (Dara) ≠ quality gate `@qa` (Quinn). Quinn não escreveu nenhum dos 14 ficheiros desta story.

---

## Verificações executadas por Quinn

### 1. Re-execução dos gates locais

| Comando | Resultado |
|---------|-----------|
| `git log --oneline -1` | `c1f15a2b feat(nexus-v2): Story 2.1 schema tarefas/projectos — Data Access Layer Dexie v2` |
| `git diff main..HEAD --stat` | 16 ficheiros, +1590/-4 — bate exactamente com File List |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 1 warning único — `app/api/auth/logout/route.ts:1:23 'NextResponse' defined but never used`, confirmado pré-existente (commit Epic 0 `c362b171`, Story 0.6) via `git log app/api/auth/logout/route.ts` |
| `npm run test:unit` | 32/32 ficheiros, **392/392 tests** PASS, 6.58s |

`npm run build` e `npm run test:coverage` aceites com base na evidência de Dara — typecheck + 392 tests verdes confirmam coerência.

### 2. Verificações lógicas focais (do handoff Dara)

| # | Verificação | Localização | Estado |
|---|-------------|-------------|--------|
| 1 | Q1 `listTasks({ tag })` recebe tag id (não nome), `anyOf([tag])` em multi-entry `*tags` | `repos/tasks.ts:42-58` + comentário linha 19 "tag id — PO Q1: Task.tags guarda IDs, não nomes" + test `tasks.test.ts:106-116` | PASS — dedup defensivo `Set<string>` (linhas 53-57) é bonus pró-activo |
| 2 | Q2 `normalize()` apanha "Urgente"/"urgente"/"URGENTE", persiste capitalização original, mensagem PT-PT | `repos/tags.ts:20-22` (normalize) + `tags.ts:27-32` (compara normalizado, persiste original) + tests `tags.test.ts:43-69` (3 variantes + whitespace + preservação) | PASS — mensagem `Error('Já existe uma tag com o nome "${input.name}"')` usa capitalização original do input |
| 3 | Q3 sintaxe Dexie `[ownerType+ownerId]` correcta em ambos os sítios | `client.ts:77` (schema) + `recurrences.ts:43-46` (query `.where('[...]').equals([ownerType, ownerId])`) + test `recurrences.test.ts:57-67` + distinção ownerType `recurrences.test.ts:74-85` | PASS |
| 4 | AC13 `NexusDBV1Only` é honest mock (reflecte protocolo real, não apenas faz teste passar) | `schema-upgrade.test.ts:30-52` — réplica literal de `client.ts:51-65` (13 tabelas v1, mesmos índices, mesmo nome `nexus_v2`). Regra `mock-protocol-fidelity.md` respeitada | PASS — é o gold standard para schema increments futuros |
| 5 | `archiveProject` não inventa estado `'archived'`, muda para `'paused'` | `repos/projects.ts:59-64` + comentário 51-58 + test `projects.test.ts:91-98` | PASS — Constitution Art. IV respeitado |
| 6 | Lint warning é pré-existente (não introduzido pela Story 2.1) | `git log --oneline -- app/api/auth/logout/route.ts` → `c362b171 feat(nexus-v2): Epic 0 — Next.js 15 + auth + widgets + tests + CI [10 stories]` | PASS — Story 0.6, fora do scope 2.1 |

### 3. 7 checks do `qa-gate.md`

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Requirements traceability (15 ACs) | PASS — todos mapeados a código/teste, evidência directa por AC documentada em `2.1.story.md` §QA Results |
| 2 | Test architecture | PASS — 67 tests novos em 6 ficheiros, `fake-indexeddb` (honest mock do protocolo IndexedDB), coverage 100% lines nos paths críticos |
| 3 | NFR — performance/security/maintainability | PASS — índices certos para queries previstas; cliente IndexedDB local (security N/A); naming claro, comentários referem ACs e fontes canónicas |
| 4 | Code quality | PASS — PT-PT consistente, zero `any`, KISS, dedup defensivo onde apropriado |
| 5 | Risk assessment | PASS com 4 riscos residuais informativos (R1-R4 abaixo) — nenhum bloqueador |
| 6 | Standards compliance | PASS — Constitution Art. IV (No Invention) + Art. V (Quality First) + Art. VI (Absolute Imports, excepção interna entre `lib/db/repos/` herdada Story 1.1) |
| 7 | Regression prevention | PASS — 325 tests pré-existentes + 67 novos = 392/392; AC13 é o anti-regressão chave para schema upgrades futuros |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-qa-PASS.md`. CONSULTAR `.claude/rules/handoff-location.md` — handoffs do Nexus v2 vivem dentro de `imersao-tools/nexus/docs/handoffs/`. Caminho está correcto.

---

## Riscos residuais (informativos, não-bloqueantes)

| # | Risco | Severidade | Mitigação / Próximo passo |
|---|-------|------------|---------------------------|
| R1 | `db.tags.toArray()` + filter em `createTag` é O(n) — trivial para 10-100 tags, mas re-avaliar se UX permitir centenas | Baixa | Documentar quando Story 2.6 (tags UI) entrar; alternativa é re-introduzir `&name` em v3 schema bump (futuro) |
| R2 | Hooks (`useTasks`/`useProjects`) fora de coverage — herança Story 1.1 explícita em `vitest.config.ts` | Baixa | Story F.1 (raise threshold global) é o sítio próprio para alterar coverage scope |
| R3 | AC13 via `fake-indexeddb` — protocolo Dexie real mas não engine browser real | Muito baixa | Robustez storage real cobre-se com e2e Playwright nas Stories 2.3+ |
| R4 | Mensagem de erro em `createTag` é `Error` genérico — caller distingue por regex/match de string | Baixa | Pattern herdado Story 1.1. Considerar `class DuplicateTagError extends Error` se outras camadas precisarem de catch tipado |

Nenhum destes riscos justifica bloquear a story. Todos registados para Stories futuras consumirem.

---

## Achados positivos a registar

1. **Dedup defensivo em `listTasks` por tag** — `tasks.ts:53-57` apanha pró-activamente o caso de Dexie devolver linha duplicada em índices multi-entry. Não pedido pelo AC mas é a coisa certa.
2. **Honest mocking em AC13** — `NexusDBV1Only` é réplica **literal** do schema v1, não um mock ajustado para o teste passar. É o gold standard para futuros schema increments do Epic 3 (v3) e Epic 4 (v4). Regra `mock-protocol-fidelity.md` respeitada.
3. **Trace canónico no `client.ts:21-29`** — comentário cita `architecture-v2.md §6.2 L512-519`, `§16 L1128`, Story 0.3 `version(1)`. Constitution Art. IV (No Invention) baked-in.

---

## Lições aprendidas (para Epic 2 e futuros)

1. **Replicar `NexusDBV1Only` em schema increments futuros** — Story 2.2+ (Epic 3 quando incrementar para v3) devem repetir o padrão de réplica literal do estado anterior. É a mitigação correcta de `mock-protocol-fidelity.md` para upgrades Dexie.
2. **Dedup defensivo `Set` em índices multi-entry** — pattern para qualquer `anyOf` em índice `*field`. Documentar como padrão de repo se for replicado.
3. **Comentário do schema com trace canónico** — `client.ts:21-29` é o exemplo a seguir. Reduz drift Constitution Art. IV em sessões futuras com agentes diferentes.

---

## Próximo passo concreto

**`@po *close-story 2.1`** — Pax fecha a story formalmente (move de `active/` para `completed/` se for esse o convencionado no Nexus v2; senão actualiza apenas status para Done). Depois:

```
@po *close-story 2.1
  → @devops *push
     (commit local c1f15a2b já existe; @devops abre PR para main;
      CodeRabbit corre no PR via integração GitHub server-side — convenção Nexus v2)
```

Nada para `@data-engineer` voltar a tocar nesta story. Stories 2.2-2.10 desbloqueadas (consumem o data access layer entregue aqui).

---

## Artefactos criados/actualizados nesta sessão

| Ficheiro | Acção |
|----------|-------|
| `imersao-tools/nexus/docs/stories/2.1.story.md` | Status `Ready for Review → Done`; secção QA Results preenchida (15 evidências por AC + achados + riscos + lições + decisão); Change Log v1.3 adicionado |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-qa-PASS.md` | Criado (este ficheiro) |

Quinn **não tocou** em nenhum ficheiro de produção (`v2/`). Apenas story file + handoff, conforme limites do `@qa`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-qa-PASS.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-qa-PASS.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@qa` (Quinn)
DATA: 15/05/2026

— Quinn, guardião da qualidade
