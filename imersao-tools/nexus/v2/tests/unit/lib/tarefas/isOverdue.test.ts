import { describe, it, expect } from 'vitest';
import {
  isOverdue,
  daysOverdue,
  startOfToday,
  parseDueDateMs,
  formatDueDate,
} from '@/lib/tarefas/isOverdue';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — isOverdue helper tests (Story 2.3 / AC12 / [AUTO-DECISION] D3)
 *
 * Helper puro — testes deterministas via `referenceTs`.
 */

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa de teste',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Referência fixa: 15/05/2026 14:30 (local)
const REF = new Date('2026-05-15T14:30:00').getTime();

describe('isOverdue helper (D3)', () => {
  it('tarefa sem dueDate NUNCA é overdue', () => {
    expect(isOverdue(makeTask({ dueDate: null }), REF)).toBe(false);
  });

  it('tarefa com dueDate de hoje NÃO é overdue (due today != overdue)', () => {
    // Hoje em local time, 09:00 — mesmo já passado, NÃO é overdue
    expect(isOverdue(makeTask({ dueDate: '2026-05-15' }), REF)).toBe(false);
  });

  it('tarefa com dueDate de ontem É overdue', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-14' }), REF)).toBe(true);
  });

  it('tarefa com dueDate de amanhã NÃO é overdue', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-16' }), REF)).toBe(false);
  });

  it('tarefa com status done NÃO é overdue mesmo com dueDate passado', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-10', status: 'done' }), REF)).toBe(false);
  });

  it('tarefa com dueDate inválido NÃO é overdue (não rebenta)', () => {
    expect(isOverdue(makeTask({ dueDate: 'data-inválida' }), REF)).toBe(false);
  });

  it('daysOverdue conta dias completos', () => {
    expect(daysOverdue(makeTask({ dueDate: '2026-05-14' }), REF)).toBe(1);
    expect(daysOverdue(makeTask({ dueDate: '2026-05-10' }), REF)).toBe(5);
  });

  it('daysOverdue devolve 0 se não atrasada', () => {
    expect(daysOverdue(makeTask({ dueDate: '2026-05-15' }), REF)).toBe(0);
    expect(daysOverdue(makeTask({ dueDate: null }), REF)).toBe(0);
  });

  it('startOfToday devolve 00:00:00 do dia local', () => {
    const ts = startOfToday(REF);
    const d = new Date(ts);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(4); // 0-indexed: Maio = 4
  });
});

/**
 * A4 — Range validation em parseDueDateMs (CR Iter 1 fix).
 * Garante que normalização silenciosa de `new Date(y, m-1, d)` é detectada
 * e que inputs out-of-range retornam NaN.
 */
describe('parseDueDateMs — range validation (A4)', () => {
  it('mês inválido (13) devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs('2026-13-45'))).toBe(true);
  });

  it('mês inválido (00) devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs('2026-00-15'))).toBe(true);
  });

  it('dia inválido (32) devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs('2026-05-32'))).toBe(true);
  });

  it('dia inválido (00) devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs('2026-05-00'))).toBe(true);
  });

  it('Feb 29 em ano não-bissexto (2026) devolve NaN (normalização detectada)', () => {
    expect(Number.isNaN(parseDueDateMs('2026-02-29'))).toBe(true);
  });

  it('Feb 29 em ano bissexto (2024) é VÁLIDO', () => {
    expect(Number.isNaN(parseDueDateMs('2024-02-29'))).toBe(false);
  });

  it('dia 31 em mês de 30 dias (Abril) devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs('2026-04-31'))).toBe(true);
  });

  it('string completamente inválida não rebenta — formato não-ISO cai no fallback Date', () => {
    // Não-ISO match → fallback `new Date('abc').getTime()` = NaN
    expect(Number.isNaN(parseDueDateMs('abc'))).toBe(true);
  });

  it('string vazia devolve NaN', () => {
    expect(Number.isNaN(parseDueDateMs(''))).toBe(true);
  });

  it('data ISO válida é parseada correctamente em local time', () => {
    const ts = parseDueDateMs('2026-05-20');
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4); // Maio
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(0);
  });

  it('isOverdue com dueDate fora de range NÃO rebenta (graceful)', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-13-45' }), REF)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: '2026-02-29' }), REF)).toBe(false);
  });

  it('daysOverdue com dueDate fora de range devolve 0', () => {
    expect(daysOverdue(makeTask({ dueDate: '2026-13-45' }), REF)).toBe(0);
    expect(daysOverdue(makeTask({ dueDate: '2026-02-29' }), REF)).toBe(0);
  });
});

/**
 * A5 — DST boundary em daysOverdue (CR Iter 1 fix).
 * Em Portugal, fim do DST é o último domingo de Outubro (29/10/2026 → 25/10/2026 no calendário real, mas testamos o conceito).
 * Confirmado: 2026 DST switch dates (Europe/Lisbon):
 *   - Início DST: domingo 29/03/2026 (relógios avançam 1h às 01:00 → 02:00)
 *   - Fim DST:    domingo 25/10/2026 (relógios recuam 1h às 02:00 → 01:00)
 *
 * Math.round(diff / 24h) absorve ±1h drift em vez de off-by-one com Math.floor.
 */
describe('daysOverdue — DST boundary (A5)', () => {
  it('boundary fim DST (Out): dueDate dia antes da transição, ref dia seguinte → 1 dia', () => {
    // Fim DST PT 2026: domingo 25/10/2026 às 02:00 local → 01:00 (recua 1h).
    // dueDate = 24/10/2026 (sábado, antes transição)
    // referenceTs = 26/10/2026 10:00 local (dia seguinte ao DST switch)
    // Diferença "real" entre 26/10 00:00 e 24/10 00:00 = 49h (não 48h, por causa do recuo)
    // Com Math.floor(49/24) = 2 ✓; com Math.round também = 2 ✓.
    const refOut = new Date('2026-10-26T10:00:00').getTime();
    expect(daysOverdue(makeTask({ dueDate: '2026-10-24' }), refOut)).toBe(2);
  });

  it('boundary início DST (Mar): dueDate dia antes da transição, ref dia seguinte → 1 dia', () => {
    // Início DST PT 2026: domingo 29/03/2026 às 01:00 local → 02:00 (avança 1h).
    // dueDate = 28/03/2026 (sábado, antes transição)
    // referenceTs = 30/03/2026 10:00 local (dia seguinte ao DST switch)
    // Diferença "real" entre 30/03 00:00 e 28/03 00:00 = 47h (não 48h, por causa do avanço)
    // Math.floor(47/24) = 1 (off-by-one!); Math.round(47/24) = 2 ✓
    const refMar = new Date('2026-03-30T10:00:00').getTime();
    expect(daysOverdue(makeTask({ dueDate: '2026-03-28' }), refMar)).toBe(2);
  });

  it('boundary cruzando início DST com dueDate imediatamente anterior → 1 dia (não 0)', () => {
    // dueDate = 28/03/2026; ref = 29/03/2026 12:00 (mesmo dia da transição, depois das 02:00)
    // startOfToday(ref) = 29/03 00:00 local.
    // Diferença real = ~23h (avanço DST).
    // Math.floor(23/24) = 0 (BUG); Math.round(23/24) = 1 ✓
    const refDST = new Date('2026-03-29T12:00:00').getTime();
    expect(daysOverdue(makeTask({ dueDate: '2026-03-28' }), refDST)).toBe(1);
  });
});

/**
 * A3 — formatDueDate (CR Iter 1 fix Uma).
 *
 * Consolidado em `isOverdue.ts` (em vez de inline em TaskRow.tsx) — garante
 * coerência operacional com D3 e reusa `parseDueDateMs` (local-date + range
 * validation). Tests confirmam:
 *   - Formato output `DD/MM/YYYY` (convenção PT-PT)
 *   - Null/undefined/string vazia → `'—'`
 *   - Out-of-range (mês > 12, dia inválido, Feb 29 não-bissexto) → `'—'`
 *     (graças à validação A4 do Dex em parseDueDateMs)
 *   - Local date interpretation (não UTC) — coerente com D3
 */
describe('formatDueDate (A3)', () => {
  it('ISO válida YYYY-MM-DD → DD/MM/YYYY', () => {
    expect(formatDueDate('2026-05-20')).toBe('20/05/2026');
  });

  it('null → "—"', () => {
    expect(formatDueDate(null)).toBe('—');
  });

  it('undefined → "—"', () => {
    expect(formatDueDate(undefined)).toBe('—');
  });

  it('string vazia → "—"', () => {
    expect(formatDueDate('')).toBe('—');
  });

  it('ISO out-of-range (mês 13) → "—" (graças a A4)', () => {
    expect(formatDueDate('2026-13-45')).toBe('—');
  });

  it('Feb 29 em ano não-bissexto → "—" (normalização silenciosa detectada por A4)', () => {
    expect(formatDueDate('2026-02-29')).toBe('—');
  });

  it('Feb 29 em ano bissexto (2024) → "29/02/2024"', () => {
    expect(formatDueDate('2024-02-29')).toBe('29/02/2024');
  });

  it('string completamente inválida → "—"', () => {
    expect(formatDueDate('invalid')).toBe('—');
  });

  it('zero-padding de dia e mês (dia 5, mês 3) → "05/03/2026"', () => {
    expect(formatDueDate('2026-03-05')).toBe('05/03/2026');
  });

  it('interpretação local-date — não UTC (evita off-by-one)', () => {
    // parseDueDateMs interpreta `2026-05-20` como 00:00 local time.
    // O output formatado é o mesmo dia independente do offset do runtime
    // (não usa toISOString que converteria para UTC).
    const out = formatDueDate('2026-05-20');
    expect(out).toBe('20/05/2026');
  });
});
