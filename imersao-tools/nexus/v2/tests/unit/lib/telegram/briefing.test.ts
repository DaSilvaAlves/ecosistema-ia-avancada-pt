import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Story 6.16 — testes das funções PURAS de `lib/telegram/briefing.ts`
 * (janela horária, data de Lisboa, construção do texto). Não tocam KV nem rede.
 *
 * O `@vercel/kv` é importado no módulo (para `getBriefingLastSent`/`setBriefingLastSent`),
 * por isso mockamo-lo para o import não falhar; estes testes só exercem as funções
 * puras (DST/`Intl`/conteúdo).
 */

vi.mock('@vercel/kv', () => ({ kv: { get: vi.fn(), set: vi.fn() } }));

import {
  lisbonHour,
  lisbonDateKey,
  isWithinBriefingWindow,
  remindersForDay,
  buildBriefingText,
  DEFAULT_BRIEFING_HOUR_START,
  DEFAULT_BRIEFING_HOUR_END,
} from '@/lib/telegram/briefing';

function entry(over: Partial<ScheduleEntry>): ScheduleEntry {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    fireAt: Date.UTC(2026, 5, 23, 7, 0, 0),
    text: 'Lembrete',
    status: 'pending',
    ...over,
  };
}

describe('lisbonHour — DST (Intl Europe/Lisbon)', () => {
  it('Junho (WEST, UTC+1): UTC 07:00 → Lisboa 08:00', () => {
    expect(lisbonHour(new Date(Date.UTC(2026, 5, 23, 7, 0, 0)))).toBe(8);
  });

  it('Janeiro (WET, UTC+0): UTC 07:00 → Lisboa 07:00', () => {
    expect(lisbonHour(new Date(Date.UTC(2026, 0, 15, 7, 0, 0)))).toBe(7);
  });
});

describe('lisbonDateKey — fuso Lisboa, não UTC', () => {
  it('Junho 23h30 UTC → ainda 24 de Junho em Lisboa (UTC+1) — não 23', () => {
    expect(lisbonDateKey(new Date(Date.UTC(2026, 5, 23, 23, 30, 0)))).toBe('2026-06-24');
  });

  it('formato YYYY-MM-DD', () => {
    expect(lisbonDateKey(new Date(Date.UTC(2026, 5, 23, 7, 0, 0)))).toBe('2026-06-23');
  });
});

describe('isWithinBriefingWindow — [start, end[ exclusivo no fim', () => {
  const start = DEFAULT_BRIEFING_HOUR_START;
  const end = DEFAULT_BRIEFING_HOUR_END;

  it('Lisboa 08:00 (UTC 07:00 Junho) dentro de [7,9[', () => {
    expect(isWithinBriefingWindow(new Date(Date.UTC(2026, 5, 23, 7)), start, end)).toBe(true);
  });

  it('Lisboa 09:00 (UTC 08:00 Junho) FORA — fim exclusivo', () => {
    expect(isWithinBriefingWindow(new Date(Date.UTC(2026, 5, 23, 8)), start, end)).toBe(false);
  });

  it('Lisboa 06:00 (UTC 05:00 Junho) FORA — antes do início', () => {
    expect(isWithinBriefingWindow(new Date(Date.UTC(2026, 5, 23, 5)), start, end)).toBe(false);
  });
});

describe('remindersForDay — só lembretes do dia de Lisboa', () => {
  const at = new Date(Date.UTC(2026, 5, 23, 7, 0, 0)); // 23 Junho Lisboa
  it('inclui lembrete de hoje, exclui o de ontem/amanhã, ordena por fireAt', () => {
    const today1 = entry({ id: '11111111-1111-4111-8111-111111111111', fireAt: Date.UTC(2026, 5, 23, 16, 0), text: 'Tarde' });
    const today2 = entry({ id: '22222222-2222-4222-8222-222222222222', fireAt: Date.UTC(2026, 5, 23, 8, 0), text: 'Manhã' });
    const tomorrow = entry({ id: '33333333-3333-4333-8333-333333333333', fireAt: Date.UTC(2026, 5, 24, 8, 0), text: 'Amanhã' });
    const result = remindersForDay([today1, tomorrow, today2], at);
    expect(result.map((r) => r.text)).toEqual(['Manhã', 'Tarde']);
  });

  it('sem lembretes do dia → []', () => {
    const tomorrow = entry({ fireAt: Date.UTC(2026, 5, 24, 8, 0) });
    expect(remindersForDay([tomorrow], at)).toEqual([]);
  });
});

describe('buildBriefingText — nunca vazio, sem dados inventados (Artigo IV)', () => {
  const at = new Date(Date.UTC(2026, 5, 23, 7, 0, 0));

  it('com lembretes: inclui o texto de cada lembrete', () => {
    const text = buildBriefingText(
      [entry({ text: 'Dentista', fireAt: Date.UTC(2026, 5, 23, 9, 30) })],
      at,
    );
    expect(text).toContain('Dentista');
    expect(text.length).toBeGreaterThan(0);
  });

  it('sem lembretes: texto não-vazio com cabeçalho + linha honesta (diferimento Dexie)', () => {
    const text = buildBriefingText([], at);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('Não tens lembretes');
    expect(text).toContain('app');
  });
});
