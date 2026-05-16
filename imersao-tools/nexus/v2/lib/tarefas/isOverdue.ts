import type { Task } from '@/types/db';

/**
 * Nexus v2 — Helper "tarefa atrasada" (Story 2.3 / AC3 / [AUTO-DECISION] D3)
 *
 * Definição operacional (ratificada pela `@po` Pax 15/05/2026):
 * Uma tarefa é "atrasada" se e só se:
 *   - dueDate !== null
 *   - new Date(dueDate).getTime() < startOfToday()  (local time, < 00:00:00 do dia actual)
 *   - status !== 'done'
 *
 * Razão: tarefa com dueDate igual a hoje é "due today", não "overdue".
 * Saltar para secção atrasadas às 00:00:01 da meia-noite degrada UX para single-user pessoal.
 */

/**
 * Devolve epoch ms para 00:00:00 do dia local actual (ou do ts fornecido).
 * `referenceTs` permite testes deterministas — em produção usa-se Date.now().
 */
export function startOfToday(referenceTs: number = Date.now()): number {
  const d = new Date(referenceTs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Parseia `Task.dueDate` (string) para epoch ms.
 *
 * Formato `YYYY-MM-DD` é interpretado como **00:00:00 em local time** (não UTC).
 * Razão: uma "due date" é um dia inteiro do calendário do utilizador,
 * não um momento exacto UTC. Evita off-by-one quando o utilizador está em
 * timezone diferente de UTC (Portugal = UTC+1 BST a maior parte do ano).
 *
 * Outros formatos (ISO completo com timezone) são parseados via `Date.parse` e
 * depois **truncados para midnight local** do dia em que caiem. Razão (A6 — CR
 * Iter 3 fix): `dueDate` é semanticamente "dia inteiro do calendário" (D3).
 * Preservar a hora-de-dia de um timestamp completo (ex: `2026-05-14T14:30:00`)
 * causa `daysOverdue` a retornar 0 quando deveria retornar 1 — a diferença
 * entre `startOfToday()` e um timestamp da tarde do dia anterior é <24h, e
 * `Math.round(diff/24h) = 0`. Normalizar para midnight local repõe a semântica
 * D3 sem rejeitar inputs vindos de consumidores que escrevam ISO completo.
 *
 * Validação (A4 — CR Iter 1 fix):
 * - Range guard antes do constructor (mês 1-12, dia 1-31).
 * - Pós-construção verifica que o constructor `Date` não normalizou silenciosamente
 *   (ex: `new Date(2026, 1, 29)` → 2026-03-01 em ano não-bissexto).
 * Devolve NaN se inválido (caller verifica).
 *
 * Exportado (named) para reutilização em `formatDueDate` (Uma — A3).
 */
export function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const [, yStr, mStr, dStr] = isoMatch;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    // Range guard antes do constructor
    if (m < 1 || m > 12 || d < 1 || d > 31) return NaN;
    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    // Detectar normalização silenciosa (ex: 2026-02-29 → 2026-03-01 em ano não-bissexto)
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return NaN;
    }
    return date.getTime();
  }
  // Fallback: ISO timestamp completo (ex: "2026-05-14T14:30:00", "2026-05-14T14:30:00Z").
  // A6 — CR Iter 3 fix: trunca para midnight local do dia em que cai, preservando
  // a semântica D3 (dueDate = dia inteiro do calendário). Sem esta truncagem,
  // `daysOverdue` arredondava para 0 quando o input tinha hora-de-dia <24h
  // antes de startOfToday(). Para inputs com sufixo `Z` ou offset, a interpretação
  // segue o timezone do runtime — pode resultar em dia local diferente do dia UTC
  // (ex: `2026-05-14T23:30:00Z` em PT BST = `2026-05-15T00:30:00 local` → midnight
  // local de 2026-05-15). Comportamento documentado e testado.
  const parsed = Date.parse(dueDate);
  if (Number.isNaN(parsed)) return NaN;
  const dt = new Date(parsed);
  return new Date(
    dt.getFullYear(),
    dt.getMonth(),
    dt.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
}

/**
 * Avalia se uma tarefa está atrasada conforme D3.
 * `referenceTs` (opcional) permite testes deterministas.
 */
export function isOverdue(task: Task, referenceTs: number = Date.now()): boolean {
  if (task.dueDate === null) return false;
  if (task.status === 'done') return false;
  const dueMs = parseDueDateMs(task.dueDate);
  if (Number.isNaN(dueMs)) return false;
  return dueMs < startOfToday(referenceTs);
}

/**
 * Devolve o número de dias completos de atraso (>= 1) ou 0 se não atrasada.
 * Util para mostrar "(3d)" na secção atrasadas.
 *
 * A5 — CR Iter 1 fix: `Math.round` em vez de `Math.floor` para absorver
 * drift de ±1h em transições DST locais (último domingo Mar/Out em PT —
 * a diferença em ms entre dois startOfToday() locais pode ser 23h ou 25h).
 */
export function daysOverdue(task: Task, referenceTs: number = Date.now()): number {
  if (!isOverdue(task, referenceTs)) return 0;
  const dueMs = parseDueDateMs(task.dueDate as string);
  const diff = startOfToday(referenceTs) - dueMs;
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

/**
 * Formata uma due date ISO `YYYY-MM-DD` como `DD/MM/YYYY` (convenção PT-PT).
 *
 * A3 — CR Iter 1 fix (Uma): consolidado em `isOverdue.ts` (em vez de inline
 * em `TaskRow.tsx`) para reutilizar `parseDueDateMs`, garantindo coerência
 * operacional com D3 e `isOverdue`:
 *   - Mesma interpretação local-date (não UTC) → evita off-by-one em
 *     timezones com offset (Portugal BST = +1h).
 *   - Mesma validação A4 (range guard + cross-check) — inputs inválidos
 *     retornam `'—'` (em-dash U+2014), em vez de strings tipo `'NaN/NaN/NaN'`.
 *
 * Tratamento:
 *   - `null` / `undefined` / string vazia → `'—'`
 *   - ISO `YYYY-MM-DD` válida → `DD/MM/YYYY`
 *   - ISO out-of-range (mês > 12, dia inválido, Feb 29 não-bissexto) → `'—'`
 *   - String não-ISO inválida → `'—'`
 *
 * Sem deps externas (date-fns evitado) — padding manual via `padStart(2, '0')`
 * é determinista e leve.
 */
export function formatDueDate(dueDate: string | null | undefined): string {
  if (dueDate === null || dueDate === undefined || dueDate === '') return '—';
  const ms = parseDueDateMs(dueDate);
  if (Number.isNaN(ms)) return '—';
  const date = new Date(ms);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
