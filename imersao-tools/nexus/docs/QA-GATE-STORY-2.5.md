# QA Gate — Story 2.5 (Vista calendário semanal de tarefas)

**Quality Gate:** Dex (`@dev`) — separação A6 (executor Uma `@ux-design-expert`, gate Dex `@dev`)
**Data:** 2026-05-17 02:43Z
**Story:** `imersao-tools/nexus/docs/stories/2.5.story.md` v0.3
**Commit auditado:** `4068e49d` (feature/2.5-vista-calendario-semanal)
**Tools usados:** lint, typecheck, vitest, build, coverage, code audit (a11y spot-check inline)
**Veredicto final:** **PASS** — 1ª iteração, zero issues, padrão consolidado mantido (9 stories consecutivas PASS first-iter).

---

## 1. Gate Re-verification — independente de Uma

Re-corri todos os gates locais (não confiar em report — verificar):

| Gate | Comando | Resultado | Pre-existente |
|------|---------|-----------|---------------|
| TypeScript | `npm run typecheck` | exit 0 | — |
| ESLint | `npm run lint` | exit 0 | 1 warning em `auth/logout/route.ts:1` (NextResponse unused) — pré-2.5, scope alheio |
| Unit tests | `npm run test:unit` | **498/498 PASS** | 466 pré + 32 novos (14 calendar + 16 weekRange + 2 outros) |
| Production build | `npm run build` | exit 0 | `/tarefas` 34.5 kB (vs ~32 kB pré-2.5 → +2.5 kB esperado) |
| Coverage `app/(app)/tarefas/` | `npm run test:coverage` | **85.71% lines** | AC13 threshold 70% ✓ |
| Coverage `lib/tarefas/` | idem | **100% lines** | — |
| Coverage all-files agregado | idem | **87.78%** | NFR17 ≥60% ✓ |

Sem regressão em testes pré-existentes — Stories 0.1-0.11, 1.1-1.10, 2.1-2.4 mantêm os seus 466 testes verdes.

---

## 2. AC-by-AC Audit

### AC1 — Tab Calendário activado

| Check | Resultado |
|-------|-----------|
| `TasksHeader.tsx:39` tem `disabled: false` para `calendario` | PASS |
| Tooltip "Em construção · Story 2.5" removido | PASS (linha não existe) |
| Tab pode ser seleccionado em `page.tsx` via `setActiveTab('calendario')` | PASS — `activeTab === 'calendario'` renderiza `CalendarBoard` |
| Test T9 valida tab switch Lista ↔ Calendário | PASS — `calendar.test.tsx:T9` + `page.test.tsx:T9` actualizado |

### AC2 — Grid 7 colunas + accent isToday + drop zones

| Check | Resultado |
|-------|-----------|
| 7 colunas seg→dom | PASS — `CalendarBoard.tsx:316` `gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))'` |
| Label PT-PT abreviado JetBrains Mono 0.65rem 700 | PASS — `CalendarDay.tsx:101-108` |
| Número do dia JetBrains Mono 1.4rem 800 | PASS — `CalendarDay.tsx:111-119` |
| Accent stripe cyan 2px se `isToday` | PASS — `CalendarDay.tsx:73-83` (top stripe `background: accentStripeColor`) |
| Min-height 120px expandível | PASS — `CalendarDay.tsx:48` `minHeight: 120` |
| Border glow cyan quando `isOver` | PASS — `CalendarDay.tsx:45-46` `boxShadow: isOver ? '0 0 24px rgba(0, 245, 255, 0.25)' : 'none'` |

### AC3 — Header com nav semanal

| Check | Resultado |
|-------|-----------|
| Botão ← Semana anterior + texto | PASS — `CalendarBoard.tsx:392-398` `aria-label="Semana anterior"` |
| Label central `weekLabel` PT-PT | PASS — `CalendarBoard.tsx:412-422` ("Semana de D de Mês de YYYY") |
| Botão "Hoje" com `aria-pressed` quando na semana actual | PASS — `CalendarBoard.tsx:423-441` `aria-pressed={isOnCurrentWeek} disabled={isOnCurrentWeek}` |
| Botão → Semana seguinte | PASS — `CalendarBoard.tsx:446-452` `aria-label="Semana seguinte"` |
| Test T10 valida ←/→/Hoje | PASS — `calendar.test.tsx:T10` |

### AC4 — CalendarCard (chip)

| Check | Resultado |
|-------|-----------|
| Título truncado ~25 char + ellipsis | PASS — `CalendarCard.tsx:62-65` `MAX_TITLE_CHARS = 25` + `truncateTitle` + `text-overflow: ellipsis` |
| Cor por estado com precedência **done → overdue → futuro** | PASS — `CalendarCard.tsx:55-59` `getChipColor`: done first, then overdue, else futuro |
| Tokens visuais Lime / Magenta / Cyan correctos | PASS — `CalendarCard.tsx:61-76` `CHIP_PALETTE` |
| Border-radius 6px, padding 0.35-0.55rem | PASS — `CalendarCard.tsx:107-108` |
| Dot prioridade 6px (magenta/cyan/grey) | PASS — `CalendarCard.tsx:42-46` `PRIORITY_DOT_COLOR` + `:144-151` dot 6×6 |
| Ícone projecto 📁 se `projectId !== null` | PASS — `CalendarCard.tsx:154-159` `{projectName !== undefined && <span>📁</span>}` |
| `useSortable({ id: task.id })` | PASS — `CalendarCard.tsx:81-83` |
| Test T4 valida data-color por estado | PASS — `calendar.test.tsx:T4` |

### AC5 — Drag-and-drop entre dias

| Check | Resultado |
|-------|-----------|
| `updateTask(taskId, { dueDate, lastWorkedAt })` (A7) | PASS — `CalendarBoard.tsx:111` `await deps.updateTask(taskId, { dueDate: novoIso, lastWorkedAt: Date.now() })` |
| Optimistic UI via `overridesRef` | PASS — `CalendarBoard.tsx:107-108` `deps.overridesRef.current[taskId] = novoIso; deps.rerender();` |
| Rollback em erro + toast PT-PT | PASS — `CalendarBoard.tsx:117-122` `delete overrides + setError('Erro ao mover tarefa — tenta novamente.')` |
| Apenas `updateTask` do repo (zero `db.tasks.*`) | PASS — grep confirmou; 1 import `updateTask as updateTaskRepo` em CalendarBoard.tsx:16 |
| Factory pura `createCalendarDragEndHandler` | PASS — `CalendarBoard.tsx:88-125`, exportada para teste |
| Test T7/T7b/T7c | PASS — `calendar.test.tsx` 3 testes |

### AC5b — Mutation Token (Iter 2 race condition fix)

| Check | Resultado |
|-------|-----------|
| `inFlightByTaskRef: useRef<Record<string, number>>({})` declarado | PASS — `CalendarBoard.tsx:147` |
| Incremento + captura antes de `await updateTask` | PASS — `CalendarBoard.tsx:103-104` `mutationId = (...[taskId] ?? 0) + 1; ...[taskId] = mutationId` |
| Check stale em `.then` (sucesso) | PASS — `CalendarBoard.tsx:114` `if (...[taskId] !== mutationId) return;` |
| Check stale em `.catch` (falha) | PASS — `CalendarBoard.tsx:117` mesmo guard antes do rollback |
| `inFlightByTaskRef` é dep explícita da factory (testável) | PASS — `CalendarDragEndHandlerDeps:78` |
| Test T13 valida stale failure ignorada | PASS — `calendar.test.tsx:T13` (cenário: 2 drags rápidas, 1ª rejeita TARDE → rollback NÃO disparado, override D3 preservado) |

**Trace canónico vs precedente 2.4:** comparei `KanbanBoard.tsx:96 (interface), :136-138 (increment), :146/149 (check stale), :289 (useRef)` com `CalendarBoard.tsx:78 (interface), :103-104 (increment), :114/117 (check stale), :147 (useRef)`. **Estrutura 1:1 equivalente.** Race condition prevenida.

### AC6 — Drag com teclado (WAI-ARIA)

| Check | Resultado |
|-------|-----------|
| `KeyboardSensor` + `PointerSensor` activos | PASS — `CalendarBoard.tsx:209-212` |
| `sortableKeyboardCoordinates` aplicado | PASS — `CalendarBoard.tsx:211` |
| Chip `role="button"` + `aria-roledescription` + `tabIndex={0}` | PASS — `CalendarCard.tsx:131-134` |
| Dia `aria-label` PT-PT longo | PASS — `CalendarDay.tsx:60` `aria-label={`${day.longLabel}, ${day.dayNumber} de ${day.monthLabel}, ${taskCountLabel}`}` |
| Announcements PT-PT (onDragStart/Over/End/Cancel) | PASS — `CalendarBoard.tsx:226-262` |
| Test T11 valida ARIA presence | PASS — `calendar.test.tsx:T11` |

**A11y spot-check inline (manual):** 18 ARIA attrs entre os 3 componentes calendar (verificado via grep). PT-PT consistente em todos. `aria-roledescription="Cartão de tarefa arrastável"` idêntico ao KanbanCard precedente.

### AC7 — OverdueSection reutilizada

| Check | Resultado |
|-------|-----------|
| `<OverdueSection>` renderizada acima do grid | PASS — `page.tsx:131-134` (fora do bloco condicional `activeTab`, é sempre renderizada) |
| Comportamento idêntico Lista/Kanban/Calendário | PASS — componente não foi modificado |

### AC8 — Filtros em modo Calendário

| Check | Resultado |
|-------|-----------|
| Filtros Projecto/Tag/Prioridade/Pesquisa reduzem chips | PASS — `page.tsx:75-84` via `visibleTasks` useMemo, passado ao CalendarBoard |
| Filtro Status mantém os 7 dias visíveis (A3) | PASS — `page.tsx:101-106` `hiddenStatuses` para Calendário; `CalendarBoard.tsx:191` filtra chips, não dias |
| Pesquisa debounce 200ms reutilizado | PASS — `page.tsx:54` `useDebounced(searchRaw, 200)` |
| Test T5 (projecto reduz chips) + T6 (status mantém 7 dias) | PASS — `calendar.test.tsx:T5/T6` |

### AC9 — Estados loading/vazio/sem-data

| Check | Resultado |
|-------|-----------|
| Skeleton de 7 colunas + 2 chips placeholder | PASS — `CalendarBoard.tsx:285-329` |
| Dia vazio sem placeholder text | PASS — `CalendarDay.tsx:139-153` (apenas chips, nada se `tasks.length === 0`) |
| Mensagem global "Nenhuma tarefa nesta semana..." | PASS — `CalendarBoard.tsx:353-368` quando `totalVisibleChips === 0` |
| `dueDate === null` NÃO aparece (A1) | PASS — `CalendarBoard.tsx:192-194` `if (effectiveIso === null) continue;` |
| Test T2 (loading) + T3 (sem dueDate) | PASS — `calendar.test.tsx:T2/T3` |

### AC10 — PT-PT consistente

Verifiquei labels e mensagens em todos os ficheiros 2.5. Zero PT-BR detectado. Termos canónicos:
- Dias abreviados: "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom" (via locale `pt`)
- Dias longos: "Segunda-feira", ..., "Domingo" (via locale `pt`)
- Navegação: "Semana anterior", "Semana seguinte", "Hoje", "Voltar à semana actual"
- Anúncios: "A mover", "Tarefa movida para", "Movimentação cancelada"
- Erro: "Erro ao mover tarefa — tenta novamente."
- Mensagem vazia: "Nenhuma tarefa nesta semana — usa as setas para navegar ou muda os filtros."

PASS — coerente com `language-standards.md` (PT-PT only, sem "usar"/"você"/"deletar").

### AC11 — Testes Vitest + Testing Library

| Test | Status |
|------|--------|
| T1 Render base 7 tasks em 7 dias | PASS |
| T2 Loading skeleton | PASS |
| T3 Task sem dueDate omitida (A1) | PASS |
| T4 Cor chip por estado (done/overdue/futuro) | PASS |
| T5 Filtro projecto reduz chips | PASS |
| T6 Filtro status mantém 7 dias (A3) | PASS |
| T7 updateTask chamado | PASS |
| T7b Mesmo dia ignorado | PASS |
| T7c over=null ignorado | PASS |
| T8 Rollback em erro | PASS |
| T9 Tab switch Lista↔Calendário | PASS |
| T10 Week navigation ←/→/Hoje | PASS |
| T11 A11y smoke | PASS |
| T12 weekRange helpers (16 cenários T12a-T12n) | PASS |
| **T13 Mutation token race condition (AC5b)** | **PASS** — cenário stale failure ignorada |

Total: 14 cenários em `calendar.test.tsx` + 16 em `weekRange.test.ts` = **30 testes novos**. Todos PASS na 1ª execução.

### AC12 — Quality gates locais

Já re-verificados na secção 1. Todos PASS.

### AC13 — Coverage

| Target | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| `app/(app)/tarefas/` | ≥ 70% lines | **85.71%** | PASS |
| `components/tarefas/` (Calendar*) | implícito | `CalendarBoard` 85.67% / `CalendarCard` 98.27% / `CalendarDay` 100% | PASS |
| `lib/tarefas/weekRange.ts` | implícito | **100%** lines | PASS |
| All-files agregado (NFR17) | ≥ 60% | **87.78%** | PASS |
| `vitest.config.ts` alterado? | NÃO (precedente 2.1-2.4) | NÃO alterado | PASS |

---

## 3. Code Audit Findings

### Repo isolation (zero `db.tasks.*` directos)

```bash
grep -rn "db\.tasks\." components/tarefas/ lib/tarefas/ app/(app)/tarefas/
```

Resultado: zero matches em código (apenas comentários defensivos em `CalendarBoard.tsx:42` e `KanbanBoard.tsx:40` que avisam contra o anti-padrão). **PASS — clean.**

### Timezone safety (A9)

```bash
grep -n "toISOString" components/tarefas/CalendarBoard.tsx CalendarCard.tsx CalendarDay.tsx lib/tarefas/weekRange.ts
```

Resultado: zero matches em código. Únicas referências são comentários (`CalendarBoard.tsx:45`, `weekRange.ts:104`) a avisar **contra** o uso. `formatDueDateIso(date)` via `date-fns format(date, 'yyyy-MM-dd')` é a única conversão usada. **PASS — anti-bug A9 enforced.**

### Discovery — `lastWorkedAt` é `number | null`

Uma corrigiu em implementação a anti-hallucination minor da story v0.2 (que dizia ISO string). `types/db.ts:62` declara `lastWorkedAt: number | null` (epoch ms). Implementação usa `Date.now()` no `updateTask` patch, **coerente com `setTaskStatus` em `lib/db/repos/tasks.ts:82`**. Story file foi actualizado em Completion Note #1 a documentar a correcção. **PASS — não é regressão, é alinhamento com o contrato real do schema.**

### Mutation token implementation — 1:1 com precedente 2.4

Comparação cruzada com `KanbanBoard.tsx`:

| Aspecto | KanbanBoard (2.4) | CalendarBoard (2.5) | Status |
|---------|-------------------|---------------------|--------|
| Interface deps inclui `inFlightByTaskRef` | linha 96 | linha 78 | EQUIVALENTE |
| Increment + capture | linhas 136-138 | linhas 103-104 | EQUIVALENTE |
| Check stale `.then` | linha 146 | linha 114 | EQUIVALENTE |
| Check stale `.catch` | linha 149 | linha 117 | EQUIVALENTE |
| useRef declaration no organism | linha 289 | linha 147 | EQUIVALENTE |

**PASS — padrão canónico replicado correctamente, bug Iter 1 não reintroduzido.**

### Não-tocou paths bloqueadores (Not-Tested Trailer Rules)

Verifiquei o diff staged contra a lista de paths bloqueadores:
- `vitest.config.ts` → NÃO tocado
- `playwright.config.ts` → NÃO tocado
- `package.json scripts` → NÃO tocado
- `.github/workflows/*` → NÃO tocado
- Auth/RLS/middleware → NÃO tocado

Trailer `Not-tested:` no commit `4068e49d`: ausente — apropriado (sem cenários relevantes que justifiquem trailer). **PASS.**

---

## 4. Critical / Should-Fix / Nice-to-Have

| Categoria | Itens |
|-----------|-------|
| Critical (bloqueia) | **0** |
| Should-Fix (importante) | **0** |
| Nice-to-Have | **0** (deferred — ver §5) |

---

## 5. Observações para iterações futuras (não-bloqueadoras)

Estas notas são deferidas — NÃO requerem fix nesta story:

1. **`CalendarBoard.tsx:201-204` `useMemo` deps com `forceRerenderTick`** — a dependência inclui `forceRerenderTick` (segundo do par destructured) para forçar recompute quando `overridesRef.current` muta. É um padrão funcional mas algo "sneaky" (eslint-disable na linha). Alternativa futura: mover overrides para `useState<Record<string, string>>({})` (como o KanbanBoard faz). Trade-off: mais re-renders mas mais idiomático. Deferred — funciona, está testado, padrão Kanban tem mesma natureza com `useState` mas com custo de re-render adicional. Decisão de DX para futura story de refactor se justificar.

2. **`CalendarBoard.tsx:421-443` `navButtonStyle()` helper** — três botões duplicam o mesmo estilo via função. Refactor para `const NAV_BUTTON_STYLE = {...}` constante (em vez de function) reduziria ~10 LOC e é o padrão usado noutros componentes (`SELECT_STYLE` em TasksFilters). Trivial — deferred para a próxima story que toque CalendarBoard ou para um refactor pass cosmético.

3. **Coverage gaps em CalendarBoard (85.67%)** — linhas 250-252 (path defensivo em `findDayLabel` quando iso não está na semana — improvável em uso normal) + 421-443 (alguns ramos do CalendarNavHeader style). Ambos defensivos/cosméticos. Bem acima do threshold 70% — sem acção.

Nenhum destes itens é débito técnico real; são oportunidades de polish. Documentados aqui para registo, não para backlog.

---

## 6. Veredicto final

**Status:** **PASS**
**Iteração:** 1ª (zero correcções necessárias)
**Confidence:** **High**
**Padrão consolidado:** 9 stories consecutivas PASS first-iter (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/**2.5**)

### Justificação

- Todos os 13 ACs + AC5b verificados PASS contra implementação
- Mutation token 1:1 com precedente 2.4 (verificação cruzada linha-a-linha)
- Repo isolation clean (zero `db.tasks.*`)
- Timezone safety enforced (zero `toISOString` em código de produção)
- 30 testes novos PASS à primeira; sem regressão nos 466 pré-existentes
- Coverage acima de todos os thresholds (85.71% local, 100% lib, 87.78% agregado)
- Zero PT-BR ou jargão proibido
- Sem paths bloqueadores tocados (Not-Tested gate N/A)
- Documentação story actualizada com File List, Change Log v0.3, Completion Notes 1-8

### Próximo passo

Story 2.5 transita: **Review → Done** (após push + merge).

```
@devops *push feature/2.5-vista-calendario-semanal
```

Após CodeRabbit verde + merge PR, `@po *close-story 2.5`.

---

— Dex, sempre construindo 🔨
