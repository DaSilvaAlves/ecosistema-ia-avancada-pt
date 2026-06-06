> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# RETOMA — Story 2.3 PR #20 CR Iter 1 fix loop (Gage → Uma + Dex em paralelo)

**De:** Gage (`@devops`) — coordenação fix loop
**Para:** Uma (`@ux-design-expert`) + Dex (`@dev`) em paralelo (Opção A confirmada por Eurico)
**Data:** 16/05/2026
**Projecto:** Nexus v2
**Story:** 2.3 — Vista lista de tarefas
**PR:** [#20](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/20)
**Branch:** `feature/2.3-vista-lista` (head local + remote = `02367bfa`, em sincronia)
**Estado:** OPEN — `reviewDecision: CHANGES_REQUESTED`, CI 100% PASS, Vercel SUCCESS
**Iteração:** **Iter 1 do CR loop** (max 2 conforme `EPIC-2.md §8` — esta é a única retomada permitida antes de escalação)
**Self-healing config:** `mode: light, max_iterations: 2, severity_filter: [CRITICAL, HIGH]`
**Hard-stop:** Se Iter 2 ainda devolver CHANGES_REQUESTED com issues technical, **NÃO se faz Iter 3** — escala para Eurico decidir Opção C (merge waived doc-nits-only) ou Opção D (Iter 3 com aprovação explícita)

---

## Resumo executivo

PR #20 (Story 2.3) entregou primeira UI substantiva do Epic 2. CR Iter 1 devolveu **7 actionables (5 MEDIUM technical + 2 doc-nits) + 2 nitpicks de teste**. Padrão **diferente** das 7 stories anteriores (1.5/1.6/1.7/1.8/1.9 + 2.1/2.2) que tiveram waivers por doc-nits-only. Aqui há bugs reais — fix legítimo, não merge waived.

O Eurico escolheu **Opção A paralela**: Uma trata 3 issues UI (#3, #4, #5) + doc-nit HANDOFF-INDEX + nit testes de `page.test.tsx`; Dex trata 2 issues lib (#6, #7) + doc-nit EPIC-2 fence + nit testes de `isOverdue.test.ts`. Mesma branch (`feature/2.3-vista-lista`), 2 commits Iter 2 squashados no merge final.

**Decisão arquitectural crítica para a Uma** (issue #5 — bug `formatDueDate`): **extrair `formatDueDate` para `lib/tarefas/isOverdue.ts`, reutilizando `parseDueDateMs`**. Detalhes vinculantes na secção "Decisão arquitectural `formatDueDate`" abaixo — não desviar.

---

## Triagem CR Iter 1 (9 achados — completa)

### Tabela master

| # | Severidade | Categoria | Ficheiro | Linhas | In-scope | Action | Owner |
|---|------------|-----------|----------|--------|----------|--------|-------|
| A1 | MEDIUM | UX — swallow errors | `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx` | 82-96 | YES (handlers existem na story) | FIX | Uma |
| A2 | MEDIUM | A11y — ARIA composite widget | `imersao-tools/nexus/v2/components/tarefas/TaskKebabMenu.tsx` | 94-151 | YES (AC8 a11y) | FIX | Uma |
| A3 | MEDIUM | Correctness — date format vs D3 | `imersao-tools/nexus/v2/components/tarefas/TaskRow.tsx` | 57-65 | YES (D3 ratificada contradita) | FIX | Uma |
| A4 | MEDIUM | Correctness — input validation | `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` | 38-45 | YES (helper da story) | FIX | Dex |
| A5 | MEDIUM | Correctness — DST day counting | `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` | 66-67 | YES (helper da story) | FIX | Dex |
| N1 | LOW | Doc consistency | `docs/HANDOFF-INDEX.md` | 10 | YES (raiz docs) | FIX trivial | Uma |
| N2 | LOW | Markdownlint MD040 | `imersao-tools/nexus/docs/EPIC-2.md` | 118-126 | YES | FIX trivial | Dex |
| Nit1 | LOW | Test coverage gap (Escape, mutation reject) | `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx` | 51-324 | YES (page handlers) | ADD tests | Uma |
| Nit2 | LOW | Test coverage gap (invalid ISO, DST) | `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts` | 35-80 | YES (helper testing) | ADD tests | Dex |

**Total Uma:** A1 + A2 + A3 + N1 + Nit1 = **5 itens** (3 actionable + 1 doc-nit + 1 test gap)
**Total Dex:** A4 + A5 + N2 + Nit2 = **4 itens** (2 actionable + 1 doc-nit + 1 test gap)

### Por que nenhum é fora-de-scope ou waiver

- **A1-A5** tocam ficheiros entregues pela própria Story 2.3 (commit `93aad6e2`). Não há precedente de tech debt.
- **A3 contradiz D3 ratificada**: `TaskRow.formatDueDate` usa `new Date(dueDate)` (UTC parse), enquanto `isOverdue.parseDueDateMs` interpreta local-date — display do badge "Atrasada" e da coluna "Due" podem divergir em offsets negativos. D3 disse "evita off-by-one em BST" mas o display visual fica órfão.
- **A4 + A5** atacam o mesmo helper que sustenta D3 — bug latente em data dirty (A4) e DST edge case 2x/ano (A5). Não tratar agora é hipotecar quality gate da Story 2.4 (Kanban) que vai consumir o mesmo helper.
- **N1 + N2** são triviais (1-2 min cada) — meter no mesmo commit elimina round-trip CR.
- **Nit1 + Nit2** fecham gaps de cobertura naturalmente alinhados com os fixes (test ↔ implementation no mesmo PR).

### Por que NÃO se usa o pattern merge waived consolidado

Pattern waived (1.5/1.6/1.7/1.8/1.9 + 2.1/2.2) sempre teve CR Iter 1 reduzido a **doc-nits-only**. Aqui temos **5 issues technical MEDIUM** — fix obrigatório, sem atalho.

---

## Decisão arquitectural `formatDueDate` (vinculante para Uma — A3)

### Contexto

Helper `parseDueDateMs` em `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts:38-45` já resolve o off-by-one da D3:

```typescript
function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0).getTime();
  }
  return new Date(dueDate).getTime();
}
```

Mas `formatDueDate` em `TaskRow.tsx:57-65` faz `new Date(dueDate)` directamente (parser UTC) — bug.

### Decisão (não negociável)

1. **`formatDueDate` migra para `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts`** (mesmo módulo de `parseDueDateMs` + `isOverdue` + `daysOverdue`). Não criar `lib/tarefas/formatDate.ts` separado — o módulo `isOverdue.ts` já é o "due-date toolkit" da Story 2.3.
2. **Export named:** `export function formatDueDate(dueDate: string | null): string`.
3. **Reuso obrigatório:** internamente chama `parseDueDateMs` (que **passa também a ser exportado**, ou tornado utilitário público — Dex decide se mantém module-internal `parseDueDateMs` e adiciona `formatDueDate` no mesmo ficheiro, ou se exporta `parseDueDateMs` também).
4. **Tratamento de `null`:** retorna `'—'` (em-dash U+2014, exactamente como hoje).
5. **Tratamento de input inválido:** retorna `'—'` (mesma string), em coerência com #6 quando A4 for resolvido por Dex. Importante: usar `Number.isNaN(parseDueDateMs(dueDate))` para detectar.
6. **Formato output:** `DD/MM/YYYY` PT-PT (já consistente com convenção PT-PT do projecto — `.claude/rules/language-standards.md`).
7. **Zero dependências novas:** nada de `date-fns`, `dayjs`, `Intl.DateTimeFormat` — manter o helper puro TypeScript stdlib.
8. **`TaskRow.tsx`** importa `formatDueDate` de `@/lib/tarefas/isOverdue` e elimina a função local. A função local `formatDueDate` em `TaskRow.tsx:57-65` é **removida**.
9. **Testes paralelos a `isOverdue.test.ts`** em `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts` (mesmo ficheiro):
   - `formatDueDate('2026-05-20')` → `'20/05/2026'`
   - `formatDueDate(null)` → `'—'`
   - `formatDueDate('invalid-iso')` → `'—'`
   - `formatDueDate('2026-13-40')` → `'—'` (após A4 fix de Dex — alinhar com a nova validação)
   - Edge case `'2026-02-29'` ano não-bissexto → `'—'` (após A4 fix)
   - Timezone preservation: `formatDueDate('2026-05-20')` retorna `'20/05/2026'` independente da timezone do runtime (validar com mock `process.env.TZ` em CI ou apenas confirmar que não usa `toISOString`).

### Justificação técnica

- **DRY**: `parseDueDateMs` já existe e resolve o problema fundamental. Duplicar lógica em `TaskRow.tsx` cria duas verdades para a mesma operação (parsing local-date).
- **Coerência operacional com D3**: a tarefa "está atrasada" e a tarefa "mostra DD/MM/YYYY" usam **o mesmo critério de calendário local**. Não há razão para divergirem.
- **Quality gate da Story 2.4 (Kanban) e 2.5 (Calendário) preservado**: ambas reutilizam o helper `isOverdue.ts`. Se Kanban também mostrar dueDate (provável em cards), reaproveita `formatDueDate` sem replicar bug.
- **Separation of concerns mantida**: `TaskRow` continua a ser componente puro de apresentação. A lógica de formatação fica na camada `lib/`.

### O que NÃO fazer

- ❌ Manter `formatDueDate` em `TaskRow.tsx` corrigido só com regex inline — viola DRY e cria duas implementações.
- ❌ Criar `lib/tarefas/formatDate.ts` separado — Story 2.3 não precisa de fragmentação. Um único `due-date toolkit` em `isOverdue.ts` é a granularidade certa.
- ❌ Adicionar `date-fns` às deps — overkill para 30 linhas de helper.
- ❌ Usar `toLocaleDateString('pt-PT')` — depende de Intl runtime que pode diferir entre Node test runner e browser. Padding manual `padStart(2, '0')` é determinista.

---

## Briefing por agente

### Para Uma (`@ux-design-expert`)

**Comando:** `@ux-design-expert *qa-loop-fix 2.3`

**Pacote de fixes (5 itens):**

#### A1 — UX: feedback user-visible em handlers de mutação

**Ficheiro:** `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx` linhas 82-96

**Problema:** `handleToggleDone` e `handleDelete` engolem erros com `console.error`. Utilizador não vê nada se `setTaskStatus`/`deleteTask` falharem.

**Fix sugerido:** adicionar `window.alert(...)` PT-PT no catch (consistente com o `window.confirm` PT-PT já usado em `TaskKebabMenu.tsx:58`). Manter o `console.error` para debugging.

```typescript
async function handleToggleDone(taskId: string, checked: boolean): Promise<void> {
  try {
    await setTaskStatus(taskId, checked ? 'done' : 'todo');
  } catch (error) {
    console.error('Falha ao actualizar estado da tarefa', error);
    window.alert('Não foi possível actualizar o estado da tarefa. Tenta novamente.');
  }
}

async function handleDelete(taskId: string): Promise<void> {
  try {
    await deleteTask(taskId);
  } catch (error) {
    console.error('Falha ao apagar tarefa', error);
    window.alert('Não foi possível apagar a tarefa. Tenta novamente.');
  }
}
```

Razão para `window.alert` (não toast): consistência com `window.confirm` (D4) — no Story 2.3 não há sistema de toast/snackbar. Story futura pode unificar tudo num toast system. Aceitável "alert" para esta iteração.

#### A2 — A11y: keyboard nav completa no TaskKebabMenu

**Ficheiro:** `imersao-tools/nexus/v2/components/tarefas/TaskKebabMenu.tsx` linhas 94-151

**Problema:** `role="menu"` + `role="menuitem"` declarados sem WAI-ARIA menu pattern real — sem ArrowUp/Down/Home/End/focus management.

**Fix:**

1. Adicionar `useRef<HTMLButtonElement>(null)` para cada `menuitem` (2 refs: editButtonRef + deleteButtonRef).
2. Adicionar `useEffect` no open: ao abrir, fazer focus no primeiro `menuitem` "Editar" (mesmo disabled — anuncia o estado).
3. Adicionar handler `onKeyDown` no `<ul role="menu">`:
   - `ArrowDown` → focus no próximo item (wrap-around)
   - `ArrowUp` → focus no anterior (wrap-around)
   - `Home` → focus no primeiro
   - `End` → focus no último
   - `Tab` → fecha menu (perde focus naturalmente)
   - `Escape` → fecha menu (já existe em `useEffect` ao nível do component)
4. `tabIndex={-1}` em ambos os `<button role="menuitem">` para serem programaticamente focáveis mas não acessíveis por Tab natural (Tab fica no botão trigger).
5. Devolver focus ao botão trigger (`⋯`) quando o menu fecha.

Referência WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/menu/ (padrão Menu Button).

#### A3 — Correctness: `formatDueDate` migrar para `lib/tarefas/isOverdue.ts`

**Ver "Decisão arquitectural `formatDueDate`" acima — vinculante.**

Resumo da acção:
1. Migrar `formatDueDate` de `TaskRow.tsx:57-65` para `lib/tarefas/isOverdue.ts`.
2. Internamente usar `parseDueDateMs` (que já está local-date-aware).
3. Importar em `TaskRow.tsx` com `import { formatDueDate } from '@/lib/tarefas/isOverdue';`.
4. Remover função local de `TaskRow.tsx`.
5. **Coordenar com Dex**: A4 (fix de validação `parseDueDateMs`) acontece no mesmo ficheiro — Uma e Dex partilham `isOverdue.ts` neste Iter 2. Convenção: Dex toca primeiro `parseDueDateMs` (A4) e `daysOverdue` (A5); Uma rebaseia em cima quando Dex committar; Uma adiciona `formatDueDate`. Alternativa coordenada via Eurico/sessão paralela: ambos em local, depois um `git stash` + merge cuidado.

#### N1 — Doc nit: actualizar timestamp HANDOFF-INDEX

**Ficheiro:** `docs/HANDOFF-INDEX.md` linha 10

**Fix:** alterar "Última actualização: 30/04/2026" para "Última actualização: 16/05/2026" (ou data do commit Iter 2).

#### Nit1 — Test gaps em `page.test.tsx`

**Ficheiro:** `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx`

Adicionar:
- **T11 Escape navigation:** simula `keydown` Escape no `window` → verifica que `router.back` é chamado uma vez (mock `useRouter`).
- **T12 mutation error path — toggle:** mock `setTaskStatus` rejected → verifica `console.error` chamado E `window.alert` chamado (após A1 fix).
- **T13 mutation error path — delete:** mock `deleteTask` rejected → mesma estrutura.

### Para Dex (`@dev`)

**Comando:** `@dev *qa-loop-fix 2.3`

**Pacote de fixes (4 itens):**

#### A4 — Correctness: validar input em `parseDueDateMs`

**Ficheiro:** `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` linhas 38-45

**Problema:** `new Date(Number(y), Number(m)-1, Number(d))` normaliza out-of-range (m=13 vira mês 1 do ano seguinte; d=32 vira mês seguinte). `'2026-13-45'` é aceito.

**Fix sugerido:** validar após o constructor que o output corresponde ao input parsed (detecta normalização silenciosa):

```typescript
function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const [, yStr, mStr, dStr] = isoMatch;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    // Range guards antes do constructor
    if (m < 1 || m > 12 || d < 1 || d > 31) return NaN;
    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    // Detectar normalização silenciosa (ex: 2026-02-29 vira 2026-03-01)
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return NaN;
    }
    return date.getTime();
  }
  return new Date(dueDate).getTime();
}
```

**Importante para coordenação com Uma:** após este fix, `formatDueDate` (A3) consumindo `parseDueDateMs` retorna `NaN` para inputs inválidos — Uma usa `Number.isNaN(...)` para detectar e retornar `'—'`. **Tornar `parseDueDateMs` exportado** (`export function parseDueDateMs`) para Uma poder consumir sem duplicar lógica.

#### A5 — Correctness: DST day counting

**Ficheiro:** `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` linhas 66-67

**Problema:** `Math.floor((nowMs - dueMs) / (24*60*60*1000))` falha em transições DST locais (Mar/Out em Portugal): a diferença entre dois `startOfToday()` locais pode ser 23h ou 25h.

**Fix sugerido:** `Math.round` em vez de `Math.floor` — absorve ±1h drift sem outras dependências.

```typescript
export function daysOverdue(task: Task, referenceTs: number = Date.now()): number {
  if (!isOverdue(task, referenceTs)) return 0;
  const dueMs = parseDueDateMs(task.dueDate as string);
  const diff = startOfToday(referenceTs) - dueMs;
  return Math.round(diff / (24 * 60 * 60 * 1000));
}
```

Razão: `Math.round(diff / day_ms)` com `diff` próximo de múltiplo inteiro de 24h tolera 1h de drift (DST). Para um caso de uso "single-user, dias contados visualmente em badge `(3d)`", é a opção mais leve e correcta. Alternativas (UTC midnight, `date-fns`) acrescentam complexidade sem ganho.

#### N2 — Doc nit: fence MD040 em EPIC-2.md

**Ficheiro:** `imersao-tools/nexus/docs/EPIC-2.md` linhas 118-126

**Fix:** identificar o fenced code block sem language e adicionar ` ```text ` ou ` ```bash ` conforme conteúdo. Markdownlint MD040 satisfeita.

#### Nit2 — Test gaps em `isOverdue.test.ts`

**Ficheiro:** `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts`

Adicionar:
- **T(N) invalid ISO range:** `isOverdue({dueDate: '2026-13-40', status: 'todo'})` → `false`. `daysOverdue` → `0`. Após A4 fix.
- **T(N+1) Feb 29 non-leap:** `parseDueDateMs('2026-02-29')` (ano não-bissexto) → `NaN`. Após A4 fix.
- **T(N+2) DST transition boundary:** dueDate = dia anterior à transição DST (último domingo de Março PT, `'2026-03-29'`), `referenceTs` = dia seguinte às 02:00 local → `daysOverdue` retorna **1** (não 0 nem 2). Validar via mock `Date.now()` ou injecção `referenceTs` explícita.

---

## Plano do push (Gage @devops)

### Pré-condições já cumpridas

- Local `feature/2.3-vista-lista` em sincronia com `origin` (head `02367bfa`). Sem rebase necessário (main não avançou desde a abertura do PR).
- CI no head SHA tudo SUCCESS. Mergeable.
- CR Iter 1 review submitted, audit trail em PR #issuecomment-4464241316 (handoff anterior).

### Sequência Iter 2

1. **Uma e Dex** trabalham em paralelo na mesma branch. Pré-comunicar: Dex committa primeiro A4+A5+N2+Nit2 em `isOverdue.ts` (export `parseDueDateMs`) → Uma rebase pull → Uma committa A1+A2+A3+N1+Nit1 (consumindo `parseDueDateMs` exportado em `formatDueDate`).
2. **Quality gates locais (cada commit, mas obrigatório no estado final pré-push):**
   - `npm run lint` (1 warning pré-existente `NextResponse` esperado — fora-scope)
   - `npm run typecheck` (exit 0)
   - `npm test` (vitest 418/418 → deve subir para ~427 com nit tests)
   - Coverage paths 2.3 mantém ≥70% (AC12)
3. **Gage push** após ambos os commits estarem no local — uma única operação `git push origin feature/2.3-vista-lista`. Sem force. Sem rebase contra main (não há divergência).
4. **CR Iter 2 review** acontece automaticamente no head SHA novo. Aguardar.

### Cenários pós-Iter 2

| Cenário | Acção @devops |
|---------|---------------|
| CR Iter 2 `reviewDecision: APPROVED` ou status check head SHA SUCCESS sem actionables | `gh pr merge 20 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --squash --delete-branch` |
| CR Iter 2 ainda CHANGES_REQUESTED mas só doc-nits-only | Escalar Eurico para Opção C waiver (pattern Story 1.5+) |
| CR Iter 2 ainda CHANGES_REQUESTED com novos technical issues | **HARD-STOP** — escalar Eurico para Opção D (Iter 3 com aprovação) ou cancel story (improbabilíssimo) |

### Story file update

A **Uma** actualiza `imersao-tools/nexus/docs/stories/completed/2.3.story.md`:
- Status: `Done (CLOSED 15/05/2026)` → `In Progress (CR Iter 1 fix loop — 16/05/2026)`
- Adicionar Change Log v0.6 com lista de fixes Iter 2 (A1-A5 + N1 + N2 + Nit1 + Nit2)
- Pós-merge: Pax reabre `*close-story 2.3` ou Eurico confirma "Done" novamente, e a story volta a `Done (CLOSED Iter 2 — DD/MM/2026)`. Move da `completed/` está OK manter-se (story está closed mesmo no fix-loop — só o ciclo `Done → In Progress → Done` é interno ao CR).

**Decisão @devops para minimizar caos com a localização da story:** **não mover** a story de `completed/` neste fix loop curto. Manter Status interno como `In Progress` durante 1 sessão é aceitável. Se Iter 2 esticar para >24h ou escalar para Iter 3, mover de volta a `stories/active/` aí sim — mas para o caso típico (Iter 2 em poucas horas) é overhead desnecessário.

---

## Trailers obrigatórios commits Iter 2

Cada commit (Uma + Dex) deve respeitar `commit_protocol` global:

```
Constraint: CR Iter 1 Story 2.3 PR #20 — fix loop dentro de Epic 2 §8 max 2 iter
Constraint: separation-of-roles A6 mantida — Uma executora UI, Dex executor lib helpers, ambos com origem na story
Rejected: aplicar todos os fixes num único agente | Opção B sequencial mais lenta, Eurico escolheu Opção A paralela
Confidence: high
Scope-risk: narrow
Directive: D3 ratificada continua canónica — formatDueDate consolidado em isOverdue.ts garante coerência cross-component
```

**Cuidado especial Dex:** o fix em `isOverdue.ts` toca lib code, não config. `Not-tested:` aceitável apenas se algum cenário ficar genuinamente por testar (provável: nenhum, dado que Nit2 cobre invalid ISO + DST). Sem violação `not-tested-trailer-rules.md` aqui — não toca CI config, test runner config, scripts.

---

## Limites e regras

| Regra | Aplicação |
|-------|-----------|
| `.claude/rules/separation-of-roles.md` (A6) | Uma executora UI, Dex executor lib — ambos com legitimidade na story. Quality gate continua a ser CI + CR. |
| `.claude/rules/handoff-location.md` | Este handoff em `imersao-tools/nexus/docs/handoffs/` — CONFORME |
| `.claude/rules/handoff-central.md` | INDEX a ser actualizado pelo @devops nesta retomada |
| `.claude/rules/not-tested-trailer-rules.md` | Sem path bloqueador tocado — `Not-tested:` aceitável se aplicável (mas improvável) |
| `.claude/rules/mandatory-change-log.md` | Story file Change Log v0.6 obrigatório |
| `.claude/rules/language-standards.md` | PT-PT em todos os outputs e mensagens user-visible |
| Constitution Artigo I (CLI First) | Toda acção via comando AIOX `*qa-loop-fix` |
| Constitution Artigo II (Agent Authority) | Push exclusivo @devops Gage |
| EPIC-2.md §8 max 2 iter CR | Esta é Iter 1 (única retomada) — se Iter 2 falha, escala |
| Story 2.3 self-healing config (`mode: light, max: 2, severity: [CRITICAL, HIGH]`) | Iter 1 actual respeita config |

---

## Próxima acção concreta

**Eurico executa em sequência:**

```
@ux-design-expert *qa-loop-fix 2.3
```
(Uma trata A1 + A2 + A3 + N1 + Nit1)

E paralelamente (terminal separado ou sequencial):

```
@dev *qa-loop-fix 2.3
```
(Dex trata A4 + A5 + N2 + Nit2 — committar primeiro `parseDueDateMs` exportado para Uma consumir em A3)

Quando ambos terminarem e os quality gates locais passarem:

```
@devops *push feature/2.3-vista-lista
```
(Gage faz push, aguarda CR Iter 2, executa cenário pós-Iter 2 conforme tabela)

---

## Audit trail

- Handoff anterior consumido: `RETOMA-20260515-story-2.3-pr-20-iter1-changes-requested.md` (movido para `archive/`)
- Comment audit trail em PR #20: `#issuecomment-4464241316` (CR Iter 1 análise + delegação)
- Memory log: `agent-memory/aiox-devops/project_nexus_v2_story_2_3_pr_20_iter1_changes_requested.md` (já criado pelo Gage)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. COINCIDE com regra `handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: 16/05/2026
