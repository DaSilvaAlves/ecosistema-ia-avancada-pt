import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { toolRegistry } from '@/lib/agent/tools/registry';
import { CalendarEventNotFoundError } from '@/lib/agent/tools/calendar';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { CalendarEvent } from '@/types/db';
// Side-effect import — regista as 34 tools (31 prévias + 3 de calendar).
// Importar o barrel (não `calendar.ts` directo) evita dupla cadeia de registo.
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro de calendário tests (Story 6.6 — FR61+FR62)
 *
 * `fake-indexeddb` carregado via `tests/setup.ts`. Cada tool é obtida via
 * `toolRegistry.get(name)` — o registo acontece 1x no import do barrel.
 * `beforeEach` limpa `db.calendarEvents`; testes exercem o contrato REAL via
 * `fake-indexeddb` (não mock manual de `db.*` — lição A1 `mock-protocol-fidelity`).
 *
 * Cenário central: o teste AC7 (acoplamento com route push 6.4) replica a query
 * REAL da route (`filter((e) => !e.googleId)`) — se o shape do evento criado
 * divergir (ex.: `googleId` definido por engano, ou campos em falta), o teste
 * falha. É o teste de fidelidade de protocolo desta story.
 */

// ── ctx mock ───────────────────────────────────────────────────────
const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};
const ctx: ExecutionContext = {
  userId: 'eurico',
  db,
  kv: mockKv,
  fetch: globalThis.fetch,
  logger: mockLogger,
  runId: 'test-run-id',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) {
    throw new Error(`Tool "${name}" não registada no toolRegistry`);
  }
  return t;
};

// epoch ms fixos para legibilidade (datas relativas evitadas — testes determinísticos)
const T_09H = 1_750_000_000_000; // base arbitrária
const T_10H = T_09H + 60 * 60 * 1000;
const T_11H = T_09H + 2 * 60 * 60 * 1000;
const T_12H = T_09H + 3 * 60 * 60 * 1000;

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: crypto.randomUUID(),
    title: 'Evento de teste',
    startAt: T_09H,
    endAt: T_10H,
    allDay: false,
    updatedAt: Date.now(),
    ...overrides,
  };
}

beforeEach(async () => {
  await db.calendarEvents.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// AC1 / AC5 — registo no toolRegistry (domínio calendar + contagem barrel)
// ═══════════════════════════════════════════════════════════════════

describe('registo das tools de calendar (AC1/AC5)', () => {
  it('regista exactamente 3 tools no domínio calendar', () => {
    expect(toolRegistry.byDomain('calendar')).toHaveLength(3);
  });

  it('os nomes das tools são exactamente os esperados (ASCII puro)', () => {
    const nomes = toolRegistry
      .byDomain('calendar')
      .map((t) => t.name)
      .sort();
    expect(nomes).toEqual([
      'actualizar_evento_calendar',
      'criar_evento_calendar',
      'listar_eventos',
    ]);
  });

  it('o barrel regista 34 tools no total (31 + 3 calendar)', () => {
    expect(toolRegistry.all()).toHaveLength(34);
  });

  it('criar/actualizar têm requiresPreview:true e listar requiresPreview:false (D-6.6-PREVIEW)', () => {
    expect(tool('criar_evento_calendar').requiresPreview).toBe(true);
    expect(tool('actualizar_evento_calendar').requiresPreview).toBe(true);
    expect(tool('listar_eventos').requiresPreview).toBe(false);
    // reversible: false em todas (sem undo nesta story)
    expect(tool('criar_evento_calendar').reversible).toBe(false);
    expect(tool('actualizar_evento_calendar').reversible).toBe(false);
    expect(tool('listar_eventos').reversible).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AC2 — criar_evento_calendar (local-pendente sem googleId)
// ═══════════════════════════════════════════════════════════════════

describe('criar_evento_calendar (AC2)', () => {
  it('cria um evento local-pendente SEM googleId, com id UUID e updatedAt', async () => {
    const antes = Date.now();
    const result = (await tool('criar_evento_calendar').execute(
      {
        title: 'reunião com Paulo',
        startAt: T_11H,
        endAt: T_12H,
        allDay: false,
      },
      ctx,
    )) as { id: string; title: string; startAt: number; endAt: number; allDay: boolean };

    expect(result.id).toMatch(UUID_RE);
    expect(result.title).toBe('reunião com Paulo');
    expect(result.startAt).toBe(T_11H);
    expect(result.endAt).toBe(T_12H);
    expect(result.allDay).toBe(false);

    const persistido = await db.calendarEvents.get(result.id);
    expect(persistido).toBeDefined();
    // Classe "local-pendente": googleId ausente (acoplamento route push 6.4)
    expect(persistido?.googleId).toBeUndefined();
    expect(persistido?.updatedAt).toBeGreaterThanOrEqual(antes);
  });

  it('aplica allDay=false por default quando omitido', async () => {
    const result = (await tool('criar_evento_calendar').execute(
      { title: 'evento sem allDay', startAt: T_09H, endAt: T_10H },
      ctx,
    )) as { allDay: boolean };
    expect(result.allDay).toBe(false);
  });

  it('lança erro quando endAt <= startAt num evento com hora (allDay=false)', async () => {
    await expect(
      tool('criar_evento_calendar').execute(
        { title: 'inválido', startAt: T_10H, endAt: T_09H, allDay: false },
        ctx,
      ),
    ).rejects.toThrow(/endAt deve ser posterior a startAt/);
    // sem registo parcial — nada foi escrito
    expect(await db.calendarEvents.count()).toBe(0);
  });

  it('permite endAt <= startAt quando allDay=true (validação relaxada)', async () => {
    const result = (await tool('criar_evento_calendar').execute(
      { title: 'dia inteiro', startAt: T_09H, endAt: T_09H, allDay: true },
      ctx,
    )) as { id: string; allDay: boolean };
    expect(result.allDay).toBe(true);
    const persistido = await db.calendarEvents.get(result.id);
    expect(persistido?.allDay).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AC7 — fidelidade de protocolo: acoplamento com route push 6.4
// ═══════════════════════════════════════════════════════════════════

describe('acoplamento com route push 6.4 (AC7)', () => {
  it('ciclo completo: criar → filter(!googleId) encontra → persistir googleId → filter vazio', async () => {
    const result = (await tool('criar_evento_calendar').execute(
      { title: 'amanhã 15h reunião com Paulo', startAt: T_11H, endAt: T_12H },
      ctx,
    )) as { id: string };

    // Query REAL da route push 6.4 (`route.ts:96`): filter(e => !e.googleId)
    const pendentes = await db.calendarEvents
      .filter((e) => !e.googleId)
      .toArray();
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].id).toBe(result.id);

    // Simular o que a route push 6.4 faz após events.insert 2xx: persistir googleId
    await db.calendarEvents.update(result.id, { googleId: 'google-evt-abc123' });

    // Após sincronização, o evento desaparece da query local-pendente
    // → a route push ficaria com { pushed: 0 } na próxima execução
    const pendentesDepois = await db.calendarEvents
      .filter((e) => !e.googleId)
      .toArray();
    expect(pendentesDepois).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AC3 — actualizar_evento_calendar (por id Nexus, independente de googleId)
// ═══════════════════════════════════════════════════════════════════

describe('actualizar_evento_calendar (AC3)', () => {
  it('actualiza o título e avança updatedAt', async () => {
    const evento = makeEvent({ title: 'antigo', updatedAt: T_09H });
    await db.calendarEvents.add(evento);

    const result = (await tool('actualizar_evento_calendar').execute(
      { id: evento.id, title: 'novo título' },
      ctx,
    )) as { title: string; updatedAt: number };

    expect(result.title).toBe('novo título');
    expect(result.updatedAt).toBeGreaterThan(T_09H);
    const persistido = await db.calendarEvents.get(evento.id);
    expect(persistido?.title).toBe('novo título');
  });

  it('actualiza startAt sem tocar outros campos', async () => {
    const evento = makeEvent({ startAt: T_09H, endAt: T_12H });
    await db.calendarEvents.add(evento);
    await tool('actualizar_evento_calendar').execute(
      { id: evento.id, startAt: T_10H },
      ctx,
    );
    const persistido = await db.calendarEvents.get(evento.id);
    expect(persistido?.startAt).toBe(T_10H);
    expect(persistido?.endAt).toBe(T_12H);
  });

  it('lança CalendarEventNotFoundError para evento inexistente (sem efeito colateral)', async () => {
    const idInexistente = crypto.randomUUID();
    await expect(
      tool('actualizar_evento_calendar').execute(
        { id: idInexistente, title: 'x' },
        ctx,
      ),
    ).rejects.toThrow(CalendarEventNotFoundError);
    expect(await db.calendarEvents.count()).toBe(0);
  });

  it('actualiza um evento já sincronizado (com googleId) SEM tocar o googleId (D-6.6-ACTUALIZAR-SCOPE)', async () => {
    const evento = makeEvent({
      title: 'sincronizado',
      googleId: 'google-evt-xyz',
    });
    await db.calendarEvents.add(evento);

    await tool('actualizar_evento_calendar').execute(
      { id: evento.id, title: 'título alterado' },
      ctx,
    );

    const persistido = await db.calendarEvents.get(evento.id);
    expect(persistido?.title).toBe('título alterado');
    // googleId preservado — a classe de sincronização não muda
    expect(persistido?.googleId).toBe('google-evt-xyz');
  });

  it('rejeita actualização que tornaria endAt <= startAt num evento com hora', async () => {
    const evento = makeEvent({ startAt: T_09H, endAt: T_12H, allDay: false });
    await db.calendarEvents.add(evento);
    await expect(
      tool('actualizar_evento_calendar').execute(
        { id: evento.id, endAt: T_09H },
        ctx,
      ),
    ).rejects.toThrow(/endAt deve ser posterior a startAt/);
    // estado preservado (sem escrita parcial)
    const persistido = await db.calendarEvents.get(evento.id);
    expect(persistido?.endAt).toBe(T_12H);
  });
});

// ═══════════════════════════════════════════════════════════════════
// AC4 — listar_eventos (janela temporal, lê de Dexie)
// ═══════════════════════════════════════════════════════════════════

describe('listar_eventos (AC4)', () => {
  it('devolve eventos dentro da janela ordenados por startAt crescente', async () => {
    await db.calendarEvents.bulkAdd([
      makeEvent({ title: 'C', startAt: T_12H, endAt: T_12H + 1000 }),
      makeEvent({ title: 'A', startAt: T_09H, endAt: T_10H }),
      makeEvent({ title: 'B', startAt: T_10H, endAt: T_11H }),
    ]);

    const result = (await tool('listar_eventos').execute(
      { from: T_09H, to: T_12H },
      ctx,
    )) as { eventos: Array<{ title: string; startAt: number }>; total: number };

    expect(result.total).toBe(3);
    expect(result.eventos.map((e) => e.title)).toEqual(['A', 'B', 'C']);
  });

  it('devolve [] quando a janela não tem eventos', async () => {
    await db.calendarEvents.add(makeEvent({ startAt: T_09H, endAt: T_10H }));
    const result = (await tool('listar_eventos').execute(
      { from: T_12H + 10_000, to: T_12H + 20_000 },
      ctx,
    )) as { eventos: unknown[]; total: number };
    expect(result.eventos).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('respeita o limit nos eventos devolvidos mas total reflecte a contagem REAL da janela', async () => {
    await db.calendarEvents.bulkAdd([
      makeEvent({ startAt: T_09H, endAt: T_10H }),
      makeEvent({ startAt: T_10H, endAt: T_11H }),
      makeEvent({ startAt: T_11H, endAt: T_12H }),
    ]);
    const result = (await tool('listar_eventos').execute(
      { from: T_09H, to: T_12H, limit: 2 },
      ctx,
    )) as { eventos: unknown[]; total: number };
    // lista truncada a 2, mas total indica que há 3 matches (lista parcial)
    expect(result.eventos).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('lança erro quando from > to (janela invertida)', async () => {
    await expect(
      tool('listar_eventos').execute({ from: T_12H, to: T_09H }, ctx),
    ).rejects.toThrow(/janela temporal válida/);
  });

  it('inclui os limites da janela (between inclusivo em ambos os extremos)', async () => {
    await db.calendarEvents.bulkAdd([
      makeEvent({ title: 'borda-inferior', startAt: T_09H, endAt: T_10H }),
      makeEvent({ title: 'borda-superior', startAt: T_12H, endAt: T_12H + 1000 }),
    ]);
    const result = (await tool('listar_eventos').execute(
      { from: T_09H, to: T_12H },
      ctx,
    )) as { eventos: Array<{ title: string }>; total: number };
    expect(result.total).toBe(2);
  });

  it('aplica limit=10 por default quando omitido', async () => {
    const eventos = Array.from({ length: 12 }, (_, i) =>
      makeEvent({ startAt: T_09H + i * 1000, endAt: T_09H + i * 1000 + 500 }),
    );
    await db.calendarEvents.bulkAdd(eventos);
    const result = (await tool('listar_eventos').execute(
      { from: T_09H, to: T_12H },
      ctx,
    )) as { eventos: unknown[]; total: number };
    expect(result.eventos).toHaveLength(10);
  });
});
