> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Briefing Iter 2 Story 2.3 — Variante C arquitectural (executor Uma)

**De:** Aria (`@architect`)
**Para:** Uma (`@ux-design-expert`) — execução Iter 2
**Data:** 15/05/2026
**Projecto:** Nexus v2
**Story:** 2.3 — Vista lista de tarefas
**PR:** [#20](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/20)
**Branch:** `feature/2.3-vista-lista`
**Commit base Iter 2:** `02367bfa` (closure Iter 1)
**Comando esperado:** `@ux-design-expert *qa-loop-fix 2.3` (commit único Iter 2 com os 5 passos abaixo, ordem obrigatória)
**Quality gate Iter 2:** `@qa` (Quinn) — **NÃO** `@dev` (Dex), per `separation-of-roles.md` A6 (Dex já aprovou Story 2.3 no qa-gate; não pode ser gate dos seus próprios approvals)

---

## Princípio arquitectural Iter 2 — Single Source of Truth para parser de Task.dueDate

O CR Iter 1 expôs uma dívida arquitectural escondida: `Task.dueDate` é parseado em **dois sítios** com **duas semânticas diferentes**:

| Local | Semântica | Estado |
|-------|-----------|--------|
| `lib/tarefas/isOverdue.ts → parseDueDateMs` | Local-date parse (alinha D3 ratificada) | Correcto mas com 2 bugs (#6 range, #7 DST diff) |
| `components/tarefas/TaskRow.tsx → formatDueDate` | UTC parse (`new Date(iso)`) | Errado — contradiz D3, off-by-one em offsets negativos |

A Variante C **elimina** esta duplicação: `lib/tarefas/isOverdue.ts` torna-se SSoT, exporta API pública, e `TaskRow.tsx` consome em vez de re-parsear. O fix de #5 deixa de ser patch local e vira refactor estrutural.

---

## Os 5 passos (ordem obrigatória)

### Passo 1 — `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` (lib)

**Issues fechados:** #6 (parseDueDateMs range), #7 (daysOverdue DST), prep para #5

**Mudanças:**

#### 1a. `parseDueDateMs` — validação range + anti-normalização + promover a `export`

```typescript
// Antes (linhas 38-45)
function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0).getTime();
  }
  return new Date(dueDate).getTime();
}

// Depois
export function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const yearN = Number(isoMatch[1]);
    const monthN = Number(isoMatch[2]);
    const dayN = Number(isoMatch[3]);

    // 1. Validar range pre-construção (rejeita month=13, day=32, etc.)
    if (monthN < 1 || monthN > 12 || dayN < 1 || dayN > 31) return NaN;

    const dt = new Date(yearN, monthN - 1, dayN, 0, 0, 0, 0);

    // 2. Validar que JS Date NÃO normalizou silenciosamente
    //    (ex: 2026-02-31 → Date normaliza para 2026-03-03; rejeitar)
    if (
      dt.getFullYear() !== yearN ||
      dt.getMonth() !== monthN - 1 ||
      dt.getDate() !== dayN
    ) {
      return NaN;
    }

    return dt.getTime();
  }
  return new Date(dueDate).getTime();
}
```

#### 1b. `daysOverdue` — civil-date diff (sem ms diff entre local midnights)

```typescript
// Antes (linhas 63-68)
export function daysOverdue(task: Task, referenceTs: number = Date.now()): number {
  if (!isOverdue(task, referenceTs)) return 0;
  const dueMs = parseDueDateMs(task.dueDate as string);
  const diff = startOfToday(referenceTs) - dueMs;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

// Depois — usa Date.UTC para diff invariante a DST
export function daysOverdue(task: Task, referenceTs: number = Date.now()): number {
  if (!isOverdue(task, referenceTs)) return 0;
  const dueMs = parseDueDateMs(task.dueDate as string);
  if (Number.isNaN(dueMs)) return 0;

  const due = new Date(dueMs);
  const today = new Date(referenceTs);

  // Civil-date diff: extrair componentes locais de ambas as datas,
  // construir UTC midnights, subtrair. Imune a transições DST porque
  // Date.UTC ignora timezone offsets.
  const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  return Math.round((utcToday - utcDue) / (24 * 60 * 60 * 1000));
}
```

#### 1c. Nova função pública `formatDueDateLocal` (consumível pela UI)

```typescript
/**
 * Formata `Task.dueDate` ISO `YYYY-MM-DD` como `DD/MM/YYYY` local.
 *
 * Reutiliza `parseDueDateMs` (local-date parse, alinhado D3) — garante que
 * o display do calendário coincide com o badge "Atrasada", sem off-by-one
 * em timezones com offset negativo.
 *
 * Devolve "—" se inválido (caller render-safe).
 */
export function formatDueDateLocal(dueDate: string | null): string {
  if (dueDate === null) return '—';
  const ms = parseDueDateMs(dueDate);
  if (Number.isNaN(ms)) return '—';

  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
```

---

### Passo 2 — `imersao-tools/nexus/v2/components/tarefas/TaskRow.tsx` (UI consumer)

**Issues fechados:** #5 (formatDueDate UTC parse)

**Mudanças:**

```typescript
// Antes (linhas 4-5)
import type { Task, Project, Tag } from '@/types/db';
import { TaskKebabMenu } from '@/components/tarefas/TaskKebabMenu';

// Depois
import type { Task, Project, Tag } from '@/types/db';
import { TaskKebabMenu } from '@/components/tarefas/TaskKebabMenu';
import { formatDueDateLocal } from '@/lib/tarefas/isOverdue';

// Antes (linhas 57-65) — APAGAR completamente esta função
function formatDueDate(dueDate: string | null): string {
  if (dueDate === null) return '—';
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Antes (linha 144)
{formatDueDate(task.dueDate)}

// Depois
{formatDueDateLocal(task.dueDate)}
```

**Linhas a apagar:** 57-65. **Linhas a alterar:** 144.

---

### Passo 3 — `imersao-tools/nexus/v2/components/tarefas/TaskKebabMenu.tsx` (a11y)

**Issues fechados:** #4 (ARIA composite widget incompleto)

**Decisão arquitectural:** remover `role="menu"` e `role="menuitem"` — manter `aria-haspopup`, `aria-expanded`, `aria-label`, `aria-disabled`. **Razão:** o componente tem apenas 2 acções (1 disabled). Implementar o menu pattern completo (arrow keys, roving tabindex, auto-focus do 1.º enabled item, Home/End) é over-engineering para 2 itens. ARIA roles sem behaviour = "lying ARIA" (pior do que nenhum role — screen reader anuncia menu, keyboard só responde a Tab). Optar por primitive button list é **honesto** semanticamente e cumpre WCAG AA.

**Mudanças:**

```tsx
// Antes (linha 95)
<ul
  role="menu"
  aria-label={`Menu de acções para "${taskTitle}"`}
  style={{ ... }}
>

// Depois
<ul
  aria-label={`Acções para "${taskTitle}"`}
  style={{ ... }}
>

// Antes (linha 116 — primeiro <button>)
<button
  type="button"
  role="menuitem"
  aria-disabled="true"
  onClick={handleEditClick}
  ...

// Depois
<button
  type="button"
  aria-disabled="true"
  onClick={handleEditClick}
  ...

// Antes (linha 150 — segundo <button>)
<button
  type="button"
  role="menuitem"
  onClick={handleDeleteClick}
  ...

// Depois
<button
  type="button"
  onClick={handleDeleteClick}
  ...
```

**Manter:** `aria-haspopup="menu"` (linha 67), `aria-expanded` (linha 68), `aria-label` no trigger (linha 66), Escape handler (linhas 39-41), click-outside (linhas 34-38). Estes já estavam correctos.

---

### Passo 4 — `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx` (UX feedback)

**Issues fechados:** #3 (handleToggleDone/handleDelete swallow silently)

**Padrão visual:** copiar treatment do filtro magenta linhas 122-155 (já existe na página). Inline banner acima da tabela, auto-clear após 4s.

**Mudanças:**

```typescript
// Adicionar import (linha 3-4)
import { useEffect, useMemo, useRef, useState } from 'react';

// Adicionar state (depois da linha 47 `overdueOnly`)
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Adicionar helper (acima de handleToggleDone)
function showError(msg: string): void {
  setErrorMsg(msg);
  if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
  errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
}

// Adicionar cleanup (juntar ao useEffect existente OU novo useEffect)
useEffect(() => {
  return () => {
    if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
  };
}, []);

// Antes (linhas 82-88)
async function handleToggleDone(taskId: string, checked: boolean): Promise<void> {
  try {
    await setTaskStatus(taskId, checked ? 'done' : 'todo');
  } catch (error) {
    console.error('Falha ao actualizar estado da tarefa', error);
  }
}

// Depois
async function handleToggleDone(taskId: string, checked: boolean): Promise<void> {
  try {
    await setTaskStatus(taskId, checked ? 'done' : 'todo');
  } catch (error) {
    console.error('Falha ao actualizar estado da tarefa', error);
    showError('Não foi possível actualizar o estado da tarefa. Tenta novamente.');
  }
}

// Antes (linhas 90-96)
async function handleDelete(taskId: string): Promise<void> {
  try {
    await deleteTask(taskId);
  } catch (error) {
    console.error('Falha ao apagar tarefa', error);
  }
}

// Depois
async function handleDelete(taskId: string): Promise<void> {
  try {
    await deleteTask(taskId);
  } catch (error) {
    console.error('Falha ao apagar tarefa', error);
    showError('Não foi possível apagar a tarefa. Tenta novamente.');
  }
}
```

**Banner JSX** — inserir imediatamente acima de `{overdueOnly && (...)}` (antes da linha 122):

```tsx
{errorMsg !== null && (
  <div
    role="alert"
    aria-live="polite"
    style={{
      margin: '0 1.5rem 0.75rem',
      padding: '0.6rem 0.9rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.5rem',
      background: 'rgba(255, 0, 110, 0.08)',
      border: '1px solid rgba(255, 0, 110, 0.3)',
      borderRadius: 8,
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.85rem',
      color: '#FF006E',
    }}
  >
    <span>{errorMsg}</span>
    <button
      type="button"
      onClick={() => setErrorMsg(null)}
      aria-label="Descartar mensagem de erro"
      style={{
        background: 'transparent',
        border: '1px solid rgba(255, 0, 110, 0.4)',
        color: '#FF006E',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6rem',
        fontWeight: 700,
        padding: '0.2rem 0.5rem',
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      Fechar ×
    </button>
  </div>
)}
```

**Tokens validados:**
- `#FF006E` (Magenta) — design system "erros, alertas críticos, urgência" ✓
- Glass `rgba(255, 0, 110, 0.08)` + border 0.3 alpha — alinha com pattern existente do filtro magenta ✓
- `border-radius: 8` — mínimo `design-system-ia-avancada.md` ✓
- Inter 0.85rem body + JetBrains Mono 0.6rem no botão ✓
- `role="alert" aria-live="polite"` — anuncia ao screen reader sem interromper ✓

---

### Passo 5 — Doc-nits + tests adicionais

**Doc-nits absorvíveis no mesmo commit Iter 2:**

| # | Ficheiro | Linha | Mudança |
|---|----------|-------|---------|
| Nit1 | `docs/HANDOFF-INDEX.md` | 10 (footer) | "Última actualização: 30/04/2026" → "15/05/2026" |
| Nit2 | `imersao-tools/nexus/docs/EPIC-2.md` | 118 (fence) | ` ``` ` → ` ```text ` (MD040) |

**Tests adicionais (CR Iter 1 Nit1 + Nit2):**

#### `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx`

Adicionar 2 tests:

```typescript
// Test 1: Escape key navega para trás
test('Escape key chama router.back()', async () => {
  const { container } = renderTarefasPage({ tasks: [] });
  await fireEvent.keyDown(window, { key: 'Escape' });
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});

// Test 2: mutation rejection mostra error banner
test('setTaskStatus rejected mostra error banner magenta', async () => {
  vi.mocked(setTaskStatus).mockRejectedValueOnce(new Error('IndexedDB full'));
  const { findByRole } = renderTarefasPage({ tasks: [makeTask({ id: 't1', status: 'todo' })] });

  const checkbox = await screen.findByRole('checkbox', { name: /marcar tarefa.*como feita/i });
  await fireEvent.click(checkbox);

  const alert = await findByRole('alert');
  expect(alert).toHaveTextContent('Não foi possível actualizar');
});
```

#### `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts`

Adicionar 2 tests:

```typescript
describe('parseDueDateMs — range validation', () => {
  test('rejeita month=13', () => {
    expect(parseDueDateMs('2026-13-15')).toBeNaN();
  });
  test('rejeita day=32', () => {
    expect(parseDueDateMs('2026-05-32')).toBeNaN();
  });
  test('rejeita day inválido para o mês (2026-02-30)', () => {
    // JS Date normaliza para 2026-03-02 — anti-normalização guard tem de apanhar
    expect(parseDueDateMs('2026-02-30')).toBeNaN();
  });
  test('rejeita month=00', () => {
    expect(parseDueDateMs('2026-00-15')).toBeNaN();
  });
});

describe('daysOverdue — DST boundary (Portugal BST → UTC, último domingo Outubro)', () => {
  test('diff invariante a transição DST (26/10/2026 02:00 BST → 01:00 UTC)', () => {
    // dueDate = 2026-10-25 (sábado antes da transição)
    // referenceTs = 2026-10-26 12:00 local (segunda, JÁ pós-transição UTC)
    const ref = new Date(2026, 9, 26, 12, 0, 0).getTime();
    const task = { dueDate: '2026-10-25', status: 'todo' } as Task;
    expect(daysOverdue(task, ref)).toBe(1); // exactamente 1 dia, não 0 nem 2
  });
});
```

---

## Acceptance criteria por issue

| Issue | AC | Como validar |
|-------|-----|--------------|
| #3 | Mutation falha → banner magenta visível 4s, role="alert", auto-clear | Test mutation reject acima |
| #4 | KebabMenu sem `role="menu"`/`role="menuitem"`; mantém aria-haspopup/expanded/label; Escape fecha; click-outside fecha | Inspecção DOM + test existente Escape |
| #5 | `TaskRow` consome `formatDueDateLocal`; `formatDueDate` local apagada; display alinha com `isOverdue` em qualquer timezone | Search "formatDueDate(" deve devolver zero matches em `TaskRow.tsx` |
| #6 | `parseDueDateMs('2026-13-40')`, `'2026-02-30'`, `'2026-00-15'` → `NaN` | Tests range acima |
| #7 | `daysOverdue` produz inteiro correcto em transição DST (Outubro 2026, Março 2027) | Test DST acima |

---

## Compliance final — checklists arquitecturais

| Regra | Cumprida? | Como |
|-------|-----------|------|
| **D3 ratificada** (parser local-date) | ✓ | `formatDueDateLocal` reutiliza `parseDueDateMs` local-date |
| **Single Source of Truth** (parser único) | ✓ | `TaskRow.formatDueDate` apagada; só `isOverdue.ts` parseia |
| **Separation-of-roles A6** (executor ≠ quality gate) | ✓ | Uma executa Iter 2, Quinn (`@qa`) faz gate (não Dex que aprovou Iter 1) |
| **Design system `#FF006E` Magenta** | ✓ | Banner erro + filtro magenta partilham token |
| **WCAG AA — a11y banner** | ✓ | `role="alert"` + `aria-live="polite"` + contraste FF006E sobre #04040A (16.4:1 AAA) |
| **WCAG AA — KebabMenu sem lying ARIA** | ✓ | Remoção `role="menu"`/`role="menuitem"` torna semântica honesta |
| **Constitution Artigo IV (No Invention)** | ✓ | Todos os fixes traçam a issues CR Iter 1 — zero scope creep |
| **Constitution Artigo V (Quality First)** | ✓ | Tests adicionados cobrem cada novo path |
| **`not-tested-trailer-rules.md`** | ✓ | Iter 2 NÃO toca CI config, test runner config, build scripts — `Not-tested:` continua válido como waiver se aplicável (mas espera-se cobertura completa) |
| **Brandbook PT-PT** | ✓ | "Não foi possível actualizar a tarefa. Tenta novamente." — tom directo, sem floreado, tutea |

---

## Commit Iter 2 — mensagem proposta

```
fix(nexus-v2): Story 2.3 Iter 2 — refactor parser data + a11y KebabMenu + UX error feedback

CR Iter 1 devolveu 5 MEDIUM technical + 2 doc-nits + 2 test nitpicks. Iter 2 aplica
Variante C arquitectural (Aria) — elimina duplicação de parser Task.dueDate (#5),
endurece isOverdue.ts (#6 range, #7 DST), corrige a11y KebabMenu (#4), e adiciona
feedback UI nas mutations (#3).

Changes:
- lib/tarefas/isOverdue.ts:38-45 — parseDueDateMs: range validation + anti-normalize, exportada
- lib/tarefas/isOverdue.ts:63-68 — daysOverdue: civil-date diff via Date.UTC (DST-safe)
- lib/tarefas/isOverdue.ts:+novo — formatDueDateLocal exportada (consumível pela UI)
- components/tarefas/TaskRow.tsx:4-5,57-65,144 — apagada formatDueDate local, importa de lib
- components/tarefas/TaskKebabMenu.tsx:95,116,150 — remoção role="menu"/role="menuitem" (lying ARIA)
- app/(app)/tarefas/page.tsx:3,47-48,82-96,+banner — errorMsg state + banner magenta role="alert"
- tests/unit/lib/tarefas/isOverdue.test.ts:+range,+DST — 5 testes adicionais
- tests/unit/app/tarefas/page.test.tsx:+escape,+reject — 2 testes adicionais
- docs/HANDOFF-INDEX.md:10 — footer 30/04 → 15/05
- imersao-tools/nexus/docs/EPIC-2.md:118 — fence ```text (MD040)

Constraint: Separation-of-roles A6 — Dex aprovou Iter 1; quality gate Iter 2 = @qa (Quinn)
Constraint: D3 ratificada — parser de Task.dueDate é local-date, SSoT em lib/tarefas/
Rejected: Implementar arrow-key menu pattern completo no KebabMenu | over-engineering para 2 itens
Rejected: Patch local de formatDueDate em TaskRow | mantinha duplicação arquitectural
Confidence: high
Scope-risk: narrow
Directive: Qualquer novo consumer de Task.dueDate em UI DEVE importar formatDueDateLocal de lib/tarefas/isOverdue — nunca re-parsear com new Date(iso)
```

---

## Próxima acção pós-commit Uma

1. `@qa *review 2.3-iter2` — quality gate (NÃO `@dev`)
2. Se PASS → `@devops *push` Iter 2
3. Watch CR Iter 2 review @ novo head SHA
4. Se CR Iter 2 APPROVED ou only-doc-nits → merge waived padrão Stories 1.6-1.9+2.2
5. Se CR Iter 2 ainda devolve MEDIUM technical → escalar a `@architect` (Aria) ou `@aiox-master` (Orion) per Epic 2 §8 hard-stop max 2 iter

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. COINCIDE.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Aria (`@architect`)
DATA: 15/05/2026

— Aria, arquitetando o futuro 🏗️
