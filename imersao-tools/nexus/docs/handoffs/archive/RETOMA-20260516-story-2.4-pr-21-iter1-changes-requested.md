# RETOMA — PR #21 CR Iter 1 CHANGES_REQUESTED · Next: Dex Iter 2 fix loop focado

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`)
**Para:** Dex (`@dev`) — qualquer terminal, qualquer sessão
**Data:** 2026-05-16
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED 2026-05-16 por Dex (`@dev`) — Iter 2 fix loop focado executado em iteração única.
**Consumido em:** 2026-05-16
**Consumido por:** Dex (`@dev`)
**Resultado:** Fix 1 (Major race condition KanbanBoard.tsx:138) implementado via per-task mutation token em `inFlightByTaskRef`. Fix 2 (Minor cobertura kanban.test.tsx:334) adicionado T7d drop-over-card. Bónus T11 stale completion validation. 4 testes existentes (T7/T7b/T7c/T8) actualizados com `inFlightByTaskRef: { current: {} }` deps. Quality gates locais Iter 2 5/5 PASS à primeira: typecheck 0, lint 0 errors, test:unit 468/468 (+2), build 0, coverage agregado 87.54% (+0.14pp). Commit `93399bd5` (6 files, +545/-3) em `feature/2.4-vista-kanban`. 5 Major em handoffs arquivados + 3 Minor MD nits NÃO tocados (waivers acordados Eurico). Handoff de saída `RETOMA-20260516-story-2.4-iter2-fix-pronto-para-push.md` criado para Gage push Iter 2 + PR comment waivers.
**PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/21

---

## Sumário executivo

PR #21 (Story 2.4 Vista Kanban) com **CR Iter 1 CHANGES_REQUESTED** (head SHA `151b6bf6`). 9/9 CI essential checks PASS (incluindo CodeRabbit Status do PR Automation). Mas reviewDecision = CHANGES_REQUESTED pelo CodeRabbit bot com 10 actionable comments.

**Decisão Eurico (16/05/2026):** Iter 2 fix loop **focado** — Dex fixa o Major em código + Minor do test. 5 Major semânticos em handoffs arquivados + 3 Minor MD nits ficam waived com PR comment do Gage justificando.

Hard-stop EPIC-2 §8: max 2 iter. Esta é Iter 2 — Iter 3 só com aprovação Eurico explícita.

---

## Estado do ramo

| Commit local | Autor | Conteúdo |
|--------------|-------|----------|
| `245f63b1` | Dex | feat(nexus-v2): Story 2.4 — vista Kanban (14 files, +2750/-53) |
| `bc7473ab` | Dex | docs(nexus-v2): Story 2.4 — QA Gate PASS handoff (4 files) |
| `151b6bf6` | Pax | docs(nexus-v2): close Story 2.4 — DoD PASS (6 files) |

Branch `feature/2.4-vista-kanban` em remote pushed via `git push -u`. PR #21 aberto. Aguarda Iter 2 push.

---

## Análise dos 10 actionable comments

| # | Severidade | Path | Tipo | Acção Iter 2 |
|---|-----------|------|------|--------------|
| 1 | 🟠 Major | `imersao-tools/nexus/v2/components/tarefas/KanbanBoard.tsx:138` | **CÓDIGO PRODUÇÃO** — race condition drag rápido | **FIX OBRIGATÓRIO** (Dex) |
| 2 | 🟠 Major | `archive/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md:84` | handoff text (path wrong em confirmation) | **WAIVED** (handoff arquivado) |
| 3 | 🟠 Major | `archive/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md:93` | handoff text (estado contradiz) | **WAIVED** (handoff arquivado) |
| 4 | 🟠 Major | `archive/RETOMA-20260516-story-2.4-qa-PASS.md:132` | handoff text (localização wrong) | **WAIVED** (handoff arquivado) |
| 5 | 🟠 Major | `archive/RETOMA-20260516-story-2.4-ready-for-dev-quality-gate.md:103` | handoff text (path inconsistente) | **WAIVED** (handoff arquivado) |
| 6 | 🟠 Major | `archive/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md:132` | handoff text (path wrong) | **WAIVED** (handoff arquivado) |
| 7 | 🟡 Minor | `docs/HANDOFF-INDEX.md:12` | tabela MD malformada (extra pipe) | **WAIVED** (cosmético — Gage actualiza em closure futura se relevante) |
| 8 | 🟡 Minor | `archive/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md:51` | MD040 fenced lang | **WAIVED** (handoff arquivado) |
| 9 | 🟡 Minor | `archive/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md:123` | MD040 | **WAIVED** (handoff arquivado) |
| 10 | 🟡 Minor | `tests/unit/app/tarefas/kanban.test.tsx:334` | falta teste `over.id` = task id (path do drop-over-card) | **FIX RECOMENDADO** (Dex — completa cobertura factory pura) |

---

## Scope do fix Iter 2 (Dex)

### Fix 1 (obrigatório) — `KanbanBoard.tsx` per-task mutation token

**Problema:** `createKanbanDragEndHandler` faz `await persistStatus(taskId, novoStatus)` sem sequencing. Se utilizador arrasta o mesmo card rapidamente (ex: todo → in-progress, depois in-progress → done antes do primeiro resolver), requests assíncronos podem resolver out-of-order. Um request antigo pode resolver/rejeitar depois de um novo, causando rollback ou error toast para um estado stale.

**Solução sugerida pelo CR (per-task mutation token via ref):**

```typescript
// 1. Adicionar ref no componente (ou no factory deps)
const inFlightByTaskRef = useRef<Record<string, number>>({});

// 2. Modificar createKanbanDragEndHandler para receber o ref
export interface DragEndHandlerDeps {
  tasks: Task[];
  overridesRef: { current: Record<string, TaskStatus> };
  inFlightByTaskRef: { current: Record<string, number> }; // NOVO
  setOverrides: React.Dispatch<...>;
  persistStatus: ...;
  setErrorMessage: ...;
}

// 3. No handler, antes do await:
const mutationId = (inFlightByTaskRef.current[taskId] ?? 0) + 1;
inFlightByTaskRef.current[taskId] = mutationId;

setOverrides((prev) => ({ ...prev, [taskId]: novoStatus! }));

try {
  await persistStatus(taskId, novoStatus);
  // Verificar se este completion ainda é a mais recente
  if (inFlightByTaskRef.current[taskId] !== mutationId) return; // stale completion — ignorar
} catch (error) {
  if (inFlightByTaskRef.current[taskId] !== mutationId) return; // stale failure — ignorar
  console.error('Erro ao mover tarefa', error);
  setOverrides((prev) => {
    const next = { ...prev };
    delete next[taskId];
    return next;
  });
  setErrorMessage('Erro ao mover tarefa — tenta novamente.');
}
```

**Localização exacta:**
- Factory pura: `imersao-tools/nexus/v2/components/tarefas/KanbanBoard.tsx` linhas 79-141 (`createKanbanDragEndHandler` + `DragEndHandlerDeps`)
- Uso no componente: linhas 259-275 (`overridesRef` + `useMemo handleDragEnd`)
- Adicionar `useRef<Record<string, number>>({})` no componente e passar à factory

**Test update obrigatório (Fix 1 verificação):**
- `kanban.test.tsx` T7/T8 (linhas que invocam `createKanbanDragEndHandler` directamente)
- Adicionar `inFlightByTaskRef: { current: {} }` nas deps mocks
- Novo test T11 (opcional mas recomendado): verificar que segundo drag overrides primeiro — stale completion não rollback override actual

### Fix 2 (recomendado) — `kanban.test.tsx` teste `over.id` = task id

**Problema:** Currentemente T7 testa `over.id = 'in-progress'` (columnId). Falta teste de drop sobre um card existente — i.e. `over.id = '<task-uuid>'` que internamente resolve para o status do over task.

**Solução:**
```typescript
it('T7d — onDragEnd: drop sobre card existente resolve para status desse card', async () => {
  const taskA = makeTask({ id: 'task-a', title: 'A', status: 'todo' });
  const taskB = makeTask({ id: 'task-b', title: 'B', status: 'in-progress' });
  const persistStatus = vi.fn().mockResolvedValue(undefined);

  const handler = createKanbanDragEndHandler({
    tasks: [taskA, taskB],
    overridesRef: { current: {} },
    inFlightByTaskRef: { current: {} }, // se factory aceita
    setOverrides: vi.fn() as any,
    persistStatus,
    setErrorMessage: vi.fn() as any,
  });

  await handler({
    active: { id: 'task-a' },
    over: { id: 'task-b' }, // drop sobre task-b → resolve para status de task-b ('in-progress')
  } as DragEndEvent);

  expect(persistStatus).toHaveBeenCalledWith('task-a', 'in-progress');
});
```

**Localização:** após T7c no `kanban.test.tsx`, ~linha 280.

---

## Waivers (Gage actualiza com PR comment)

Após Dex fazer commit do Iter 2 e push, Gage adicionará PR comment justificando waivers dos 5 Major semânticos + 3 Minor MD:

> Iter 2 implementa o único Major em código de produção (KanbanBoard.tsx race condition) + Minor de cobertura (kanban.test.tsx). Os outros 5 Major são em handoffs arquivados (`archive/RETOMA-*.md`) — handoff-location confirmation mantém path original "pending" porque foi escrita antes do `git mv`. Estes handoffs estão CONSUMED e archived, audit trail preservado via `consumed_at` + `consumed_by` + `Resultado` metadata. Sem impacto operacional. 3 Minor MD nits (MD040 + tabela) seguem precedente "merge waived doc-nits" de 7 stories anteriores (1.5/1.6/1.7/1.8/1.9/2.1/2.3). Convenção AIOX Nexus v2.

---

## Hard-stop EPIC-2 §8

Esta é Iter 2. Se CR Iter 2 trouxer novo Major em código ou doc-nits que excedam tolerância → escalada Eurico para Opção D Iter 3 (precedente Story 2.3). NÃO avançar Iter 3 sem aprovação explícita.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-pr-21-iter1-changes-requested.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Acções concretas Dex

### 1. Sincronizar com branch local

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt
git checkout feature/2.4-vista-kanban
git pull origin feature/2.4-vista-kanban  # se houve fetch
git log --oneline main..HEAD   # confirmar 3 commits
```

### 2. Implementar Fix 1 (mutation token)

- Editar `imersao-tools/nexus/v2/components/tarefas/KanbanBoard.tsx`
- Adicionar `inFlightByTaskRef` ao `DragEndHandlerDeps` interface
- Modificar `createKanbanDragEndHandler` para incrementar + verificar mutation id
- No componente, criar `useRef<Record<string, number>>({})` e passar à factory
- Re-rodar `npm run test:unit` — actualizar T7/T8 com `inFlightByTaskRef` nas deps mocks

### 3. Implementar Fix 2 (test T7d)

- Adicionar T7d em `kanban.test.tsx` — drop sobre card existente
- `npm run test:unit` — confirmar 467/467 ou similar (1 ou 2 testes novos)

### 4. Quality gates locais Iter 2

```bash
cd imersao-tools/nexus/v2
npm run lint          # exit 0
npm run typecheck     # exit 0
npm run test:unit     # 466+ PASS
npm run build         # exit 0
npm run test:coverage # thresholds OK
```

### 5. Commit Iter 2

```bash
git add imersao-tools/nexus/v2/components/tarefas/KanbanBoard.tsx \
        imersao-tools/nexus/v2/tests/unit/app/tarefas/kanban.test.tsx
git commit -m "fix(nexus-v2): Story 2.4 Iter 2 — prevent stale drag completion + drop-over-card test

CR Iter 1 Major (KanbanBoard.tsx:138) — race condition em drag rápido pode causar stale completion
override last write. Adicionado per-task mutation token via inFlightByTaskRef: incrementa antes do
persistStatus, captura local; após await, ignora completion/failure se mutation id mudou (stale).

CR Iter 1 Minor (kanban.test.tsx:334) — falta cobertura de drop-over-card. T7d adicionado:
over.id = task uuid → resolve para status do over task (in-progress).

5 Major em handoffs arquivados + 3 Minor MD nits → waived com PR comment Gage (precedente 7 stories).

[Story 2.4 Iter 2]

Co-Authored-By: Dex (@dev) <noreply@anthropic.com>"
```

### 6. Notificar Gage

Criar handoff de saída `RETOMA-20260516-story-2.4-iter2-fix-pronto-para-push.md` para Gage (`@devops`) — Gage pushes Iter 2 commit + adiciona PR comment waivers + aguarda CR Iter 2 review + merge.

---

## Estado dos artefactos

| Artefacto | Path | Estado |
|-----------|------|--------|
| PR #21 | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/21 | OPEN, CR Iter 1 CHANGES_REQUESTED, mergeable |
| Branch | `feature/2.4-vista-kanban` (remote + local) | 3 commits ahead → +1 Iter 2 commit pendente |
| CR Iter 1 review SHA | `151b6bf6` | CHANGES_REQUESTED com 10 actionable |
| CI Iter 1 | 9/9 essential PASS | Vercel Preview SUCCESS |
| Story 2.4 file | `imersao-tools/nexus/docs/stories/completed/2.4.story.md` | Status Done, PO Closure feita |

---

## Cenários

**Cenário A — Iter 2 fix limpo (mais provável)**
→ Dex implementa Fix 1+2, gates locais PASS, commit, handoff Gage. Gage push + PR comment + CR Iter 2 → idealmente PASS.

**Cenário B — Iter 2 CR traz novos Major**
→ Hard-stop EPIC-2 §8 atingido. Escalada Eurico para Opção D (precedente Story 2.3 Iter 3).

**Cenário C — Fix introduz regressão (testes failing)**
→ Dex itera local até gates PASS antes de commit. Sem push até estar estável.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-pr-21-iter1-changes-requested.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-pr-21-iter1-changes-requested.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: 16/05/2026
