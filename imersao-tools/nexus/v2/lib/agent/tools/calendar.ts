import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';
import type { CalendarEvent } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de calendário (Story 6.6 — FR61 + FR62)
 *
 * Regista 3 tools de domínio `'calendar'` (`[D-6.6-GAP65-DOMAIN]`=(a)
 * standalone, Aria 18/06/2026) no `toolRegistry`:
 *   - `criar_evento_calendar`       — cria um evento local-pendente em Dexie
 *   - `actualizar_evento_calendar`  — actualiza um evento local por `id` Nexus
 *   - `listar_eventos`              — lista eventos de Dexie por janela temporal
 *
 * Edge-safety (ADR-1, `[D-6.6-GAP65-DOMAIN]`): este módulo opera EXCLUSIVAMENTE
 * via `ctx.db` (Dexie injectado, `ExecutionContext.db`) e NÃO importa
 * `googleapis`, `@/lib/google/calendar-push.ts` nem `@/lib/google/calendar.ts`
 * (helper pull). O acoplamento com a Story 6.4 é SÓ por dados — a classe
 * "local-pendente" escrita em `calendarEvents` (sem `googleId`) que a route
 * push da 6.4 (`route.ts:96`) lê via `filter((e) => !e.googleId)`. O push ao
 * Google Calendar é responsabilidade server-side da route 6.4, nunca da tool.
 *
 * Decisões ratificadas (`@architect` Gate de Entrada, Aria 18/06/2026):
 *   - `[D-6.6-PREVIEW]`=(a): `criar`/`actualizar` = `requiresPreview: true,
 *     reversible: false` (efeito externo indirecto via push 6.4 — precedente
 *     `knowledge.ts:483-484`); `listar` = `requiresPreview: false,
 *     reversible: false` (consulta read-only — precedente `knowledge.ts:416`).
 *   - `[D-6.6-ACTUALIZAR-SCOPE]`=(a): actualiza qualquer evento por `id` Nexus
 *     independentemente de `googleId`; NUNCA toca `googleId` (preserva a classe
 *     de sincronização). O push 6.4 só propaga eventos local-pendente.
 *   - `[D-6.6-LISTAR-SOURCE]`=(a): lê exclusivamente de Dexie via
 *     `where('startAt').between(from, to)`; índices `startAt`/`[startAt+endAt]`
 *     criados na 6.3 explicitamente para esta query (`client.ts:176`).
 *
 * Nomes ASCII puro (`external-contract-identifiers.md`): `criar_evento_calendar`,
 * `actualizar_evento_calendar`, `listar_eventos` — todos em `[a-z][a-z0-9_]*`
 * (TOOL_NAME_PATTERN, `registry.ts:27`). A semântica PT-PT vive nas
 * `description`. Precedente D-NAMES de `finance.ts`/`knowledge.ts`.
 *
 * SEM version bump Dexie: `calendarEvents` está em `version(6)` desde a 6.3 e o
 * índice `&googleId` único E esparso já suporta registos sem `googleId`.
 */

/**
 * Erro descritivo (PT-PT) para `actualizar_evento_calendar` sobre um evento que
 * não existe em Dexie — lançado ANTES de qualquer `update`, sem efeito colateral
 * (eixo (c) da análise de ciclo de vida, Architect Gate de Entrada).
 */
export class CalendarEventNotFoundError extends Error {
  constructor(id: string) {
    super(`Evento de calendário não encontrado: "${id}".`);
    this.name = 'CalendarEventNotFoundError';
  }
}

/**
 * Wrapper tipado de registo (mesmo padrão de `knowledge.ts:55`) — preserva os
 * genéricos `TArgs`/`TResult` de cada `defineTool` no `register`.
 */
function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

// ═══════════════════════════════════════════════════════════════════
// criar_evento_calendar (FR61) — cria evento local-pendente (sem googleId)
// requiresPreview: true (efeito externo indirecto via push 6.4 — D-6.6-PREVIEW)
// ═══════════════════════════════════════════════════════════════════

// Nota: o modelo `CalendarEvent` (`types/db.ts:283-298`) NÃO tem campo
// `description` — apenas `id`/`googleId?`/`title`/`startAt`/`endAt`/`allDay`/
// `updatedAt`. Não se aceita `description` no schema para evitar silent data
// loss (aceitar um campo que seria descartado). A semântica do evento vive no
// `title`. Estender o modelo com `description` seria version bump Dexie, fora
// de scope desta story (decisão Architect Gate: types/db.ts INTOCADO).
const CriarEventoArgs = z.object({
  title: z.string().min(1, 'título obrigatório'),
  startAt: z.number().int().positive(), // epoch ms
  endAt: z.number().int().positive(), // epoch ms
  allDay: z.boolean().optional().default(false),
});

const CriarEventoResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.number(),
  endAt: z.number(),
  allDay: z.boolean(),
});

type CriarEventoResult = z.infer<typeof CriarEventoResultSchema>;

registar(
  defineTool<z.infer<typeof CriarEventoArgs>, CriarEventoResult>({
    name: 'criar_evento_calendar',
    description:
      'Cria um evento no calendário. Use para "amanhã 15h reunião com Paulo", "sexta 3ª reunião de equipa", "marca jantar sábado às 20h".',
    domain: 'calendar',
    argsSchema: CriarEventoArgs,
    resultSchema: CriarEventoResultSchema,
    requiresPreview: true, // efeito externo indirecto via push 6.4 — D-6.6-PREVIEW
    reversible: false, // sem undo nesta story
    execute: async (args, ctx) => {
      const { title, startAt, endAt, allDay = false } = args;
      // Validação de coerência temporal: só exigida para eventos com hora.
      // Eventos de dia inteiro (allDay) podem ter `endAt` igual/derivado.
      if (!allDay && endAt <= startAt) {
        throw new Error(
          'endAt deve ser posterior a startAt para eventos com hora.',
        );
      }
      // Classe "local-pendente": `googleId` ausente → a route push da 6.4
      // selecciona via `filter((e) => !e.googleId)`. `add()` (não `put`/
      // `bulkPut`) — sem `googleId` não há chave única a substituir; a PK é
      // `id` string preenchida por `crypto.randomUUID()`.
      const id = crypto.randomUUID();
      const event: CalendarEvent = {
        id,
        title,
        startAt,
        endAt,
        allDay,
        updatedAt: Date.now(),
        // googleId: ausente → classe "local-pendente" (acoplamento 6.4, AC7)
      };
      await ctx.db.calendarEvents.add(event);
      return { id, title, startAt, endAt, allDay };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// actualizar_evento_calendar (FR62) — actualiza evento local por id Nexus
// requiresPreview: true — D-6.6-PREVIEW; NUNCA toca googleId — D-6.6-ACTUALIZAR-SCOPE
// ═══════════════════════════════════════════════════════════════════

// `description` ausente pela mesma razão de `CriarEventoArgs` — `CalendarEvent`
// não tem o campo (sem version bump nesta story).
const ActualizarEventoArgs = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  startAt: z.number().int().positive().optional(),
  endAt: z.number().int().positive().optional(),
  allDay: z.boolean().optional(),
});

const ActualizarEventoResultSchema = z.object({
  id: z.string(),
  googleId: z.string().optional(),
  title: z.string(),
  startAt: z.number(),
  endAt: z.number(),
  allDay: z.boolean(),
  updatedAt: z.number(),
});

type ActualizarEventoResult = z.infer<typeof ActualizarEventoResultSchema>;

registar(
  defineTool<z.infer<typeof ActualizarEventoArgs>, ActualizarEventoResult>({
    name: 'actualizar_evento_calendar',
    description:
      'Actualiza um evento existente do calendário pelo seu id. Use para "muda a reunião de amanhã para as 16h", "altera o título do evento", "passa o jantar para sábado".',
    domain: 'calendar',
    argsSchema: ActualizarEventoArgs,
    resultSchema: ActualizarEventoResultSchema,
    requiresPreview: true, // efeito externo indirecto via push 6.4 — D-6.6-PREVIEW
    reversible: false, // sem undo nesta story
    execute: async (args, ctx) => {
      const { id, ...campos } = args;
      // Lê por `id` Nexus independentemente de `googleId` (D-6.6-ACTUALIZAR-SCOPE).
      const existente = await ctx.db.calendarEvents.get(id);
      if (existente === undefined) {
        // Lançado ANTES de qualquer `update` — sem efeito colateral.
        throw new CalendarEventNotFoundError(id);
      }
      // Só os campos fornecidos são actualizados. NUNCA toca `googleId`
      // (preserva a classe de sincronização — D-6.6-ACTUALIZAR-SCOPE).
      const patch: Partial<CalendarEvent> = { updatedAt: Date.now() };
      if (campos.title !== undefined) patch.title = campos.title;
      if (campos.startAt !== undefined) patch.startAt = campos.startAt;
      if (campos.endAt !== undefined) patch.endAt = campos.endAt;
      if (campos.allDay !== undefined) patch.allDay = campos.allDay;

      // Validação de coerência após o merge dos campos: o resultado final não
      // pode ter `endAt <= startAt` num evento com hora.
      const finalStartAt = patch.startAt ?? existente.startAt;
      const finalEndAt = patch.endAt ?? existente.endAt;
      const finalAllDay = patch.allDay ?? existente.allDay;
      if (!finalAllDay && finalEndAt <= finalStartAt) {
        throw new Error(
          'endAt deve ser posterior a startAt para eventos com hora.',
        );
      }

      await ctx.db.calendarEvents.update(id, patch);
      const actualizado = await ctx.db.calendarEvents.get(id);
      // `actualizado` nunca é undefined aqui (acabámos de actualizar um registo
      // existente), mas o get devolve `T | undefined` — fail-loud por garantia.
      if (actualizado === undefined) {
        throw new CalendarEventNotFoundError(id);
      }
      return {
        id: actualizado.id,
        googleId: actualizado.googleId,
        title: actualizado.title,
        startAt: actualizado.startAt,
        endAt: actualizado.endAt,
        allDay: actualizado.allDay,
        updatedAt: actualizado.updatedAt,
      };
    },
  }),
);

// ═══════════════════════════════════════════════════════════════════
// listar_eventos (FR62) — lê de Dexie por janela temporal (read-only)
// requiresPreview: false — D-6.6-PREVIEW; D-6.6-LISTAR-SOURCE (sem HTTP)
// ═══════════════════════════════════════════════════════════════════

// NB: `argsSchema` tem de ser `z.ZodObject` puro (registry exige
// `instanceof z.ZodObject` — `registry.ts:55-58`); um `.refine()` produziria
// `ZodEffects` e o `defineTool` rejeitaria. A validação `from <= to` é feita
// dentro do `execute` (padrão das tools que cruzam campos, ex. `endAt > startAt`).
const ListarEventosArgs = z.object({
  from: z.number().int().positive(), // epoch ms — limite inferior de startAt
  to: z.number().int().positive(), // epoch ms — limite superior de startAt
  limit: z.number().int().min(1).max(100).optional().default(10),
});

const EventoResumoSchema = z.object({
  id: z.string(),
  googleId: z.string().optional(),
  title: z.string(),
  startAt: z.number(),
  endAt: z.number(),
  allDay: z.boolean(),
  updatedAt: z.number(),
});

const ListarEventosResultSchema = z.object({
  eventos: z.array(EventoResumoSchema),
  total: z.number(),
});

type ListarEventosResult = z.infer<typeof ListarEventosResultSchema>;

registar(
  defineTool<z.infer<typeof ListarEventosArgs>, ListarEventosResult>({
    name: 'listar_eventos',
    description:
      'Lista os eventos do calendário numa janela temporal. Use para "que tenho amanhã?", "mostra a minha agenda da semana", "que reuniões tenho hoje?".',
    domain: 'calendar',
    argsSchema: ListarEventosArgs,
    resultSchema: ListarEventosResultSchema,
    requiresPreview: false, // consulta read-only de Dexie — D-6.6-PREVIEW
    reversible: false,
    execute: async (args, ctx) => {
      const { from, to, limit = 10 } = args;
      if (from > to) {
        throw new Error(
          'from deve ser anterior ou igual a to (janela temporal válida).',
        );
      }
      // Lê exclusivamente de Dexie (D-6.6-LISTAR-SOURCE) — índice `startAt`
      // criado na 6.3 para esta query (`client.ts:176`). `.between(from, to)`
      // é inclusivo em ambos os limites; ordenação por `startAt` crescente
      // (ordem natural do índice). Janela vazia → `[]`.
      const collection = () =>
        ctx.db.calendarEvents.where('startAt').between(from, to, true, true);
      // `total` é a contagem REAL de eventos na janela (sem `limit`), distinta
      // de `eventos.length` — quando há mais matches do que `limit`, o
      // consumidor sabe que a lista está truncada (CR Iter 2).
      const [eventos, total] = await Promise.all([
        collection().limit(limit).toArray(),
        collection().count(),
      ]);
      return {
        eventos: eventos.map((e) => ({
          id: e.id,
          googleId: e.googleId,
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          allDay: e.allDay,
          updatedAt: e.updatedAt,
        })),
        total,
      };
    },
  }),
);
