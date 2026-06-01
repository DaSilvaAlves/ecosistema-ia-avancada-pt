import { z } from 'zod';
import { RRule } from 'rrule';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';
import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de lembretes (Story 4.10 — FR38)
 *
 * Regista 3 tools de domínio `'habits'` (D-DOMAIN Opção A) no `toolRegistry`:
 *   - `criar_lembrete`     — cria um lembrete (horário + recorrência opcional)
 *   - `listar_lembretes`   — lista lembretes por estado
 *   - `cancelar_lembrete`  — cancela (soft) um lembrete pendente
 *
 * Este é o AC4 canónico do Epic 4 ("lembra-me sexta às 10h de pagar a luz" →
 * `criar_lembrete` correcto).
 *
 * Edge-safety (ADR-1, DEV-DECISION D1 da Story 2.10): NÃO importa
 * `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*`. Persistência via `ctx.db`.
 * A classe `RRule` de `'rrule'` é JS pura (só a classe, não o motor da Story 2.7).
 *
 * Recorrência: cria a linha `recurrences` genérica (`ownerType:'reminder'`,
 * `ownerId = reminder.id`) numa transacção `rw` — padrão `finance.ts:404-428`.
 * NÃO activa o motor de recorrência (é a Story 4.8).
 *
 * Cancelar é SOFT (status → 'cancelled'), não hard-delete — coerente com a tab
 * "Cancelados" da UI (Story 4.6).
 *
 * NOTA NOMES ASCII: nomes ASCII puro — válidos contra `TOOL_NAME_PATTERN`
 * (`registry.ts:27`) + Anthropic spec. Semântica PT-PT nas `description`.
 *
 * Trace: PRD-NEXUS-V2.md §6.6 (FR38); EPIC-4.md §6 AC4; Story 3.11 (`finance.ts`).
 *
 * Constitution: Article IV (No Invention), V (PT-PT), VI (imports `@/...` + rrule).
 */

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const;

function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

function fuzzyMatches(candidate: string, input: string): boolean {
  const a = candidate.toLowerCase();
  const b = input.toLowerCase();
  return a.includes(b) || b.includes(a);
}

/**
 * Resolve um lembrete pelo texto → devolve o `Reminder`. Política (padrão
 * `finance.ts`): 0 matches → Error PT-PT com a lista; ≥2 → erro de ambiguidade
 * (nunca cancelar o errado).
 *
 * `onlyPending` (CR 4.10 Iter 1): quando `true`, restringe a procura a lembretes
 * `status:'pending'` SEM fallback — `cancelar_lembrete` nunca deve actuar sobre
 * um lembrete já enviado/cancelado. Quando `false` (default), procura em todos.
 */
async function resolveLembreteByTexto(
  texto: string,
  ctx: ExecutionContext,
  onlyPending = false
): Promise<Reminder> {
  const all = await ctx.db.reminders.toArray();
  const pool = onlyPending ? all.filter((r) => r.status === 'pending') : all;
  const matches = pool.filter((r) => fuzzyMatches(r.text, texto));
  if (matches.length === 0) {
    const lista = pool.map((r) => r.text).join(', ');
    const sufixo = onlyPending ? ' pendente(s)' : '';
    throw new Error(
      `Lembrete${sufixo} não encontrado: "${texto}". Disponíveis: ${lista || '(nenhum)'}`
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Lembrete ambíguo: "${texto}" corresponde a ${matches.length} lembretes (${matches
        .map((r) => r.text)
        .join(', ')}). Especifica o texto completo.`
    );
  }
  return matches[0];
}

/**
 * Valida `YYYY-MM-DDTHH:mm` como data-hora de calendário/relógio REAL (CR 4.10
 * Iter 1): rejeita dias inexistentes (`2026-02-30`), horas >23 e minutos >59
 * (que `Date.UTC` normalizaria silenciosamente). Usado pelo refine do schema de
 * `criar_lembrete` — a validação vive no `argsSchema` (consistência com
 * `habits.ts`/`finance.ts`), não só no `execute`.
 */
function isRealDateTime(quandoIso: string): boolean {
  const m = quandoIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (m === null) return false;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (h > 23 || mi > 59) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

/** Epoch ms (UTC) de uma `YYYY-MM-DDTHH:mm` já validada por `isRealDateTime`. */
function toEpochUTC(quandoIso: string): number {
  const [datePart, timePart] = quandoIso.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h, mi);
}

// ═══════════════════════════════════════════════════════════════════
// argsSchemas (source: FR38 + types/db.ts Reminder:210-217)
// ═══════════════════════════════════════════════════════════════════

const CriarLembreteArgs = z.object({
  texto: z.string().min(1, 'texto do lembrete é obrigatório'),
  quandoIso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'quandoIso deve ser YYYY-MM-DDTHH:mm')
    .refine(isRealDateTime, 'data-hora inválida — não é um instante real'),
  recorrencia: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().int().min(1).default(1),
    })
    .nullable()
    .default(null),
});

const ListarLembretesArgs = z.object({
  estado: z
    .enum(['pending', 'sent', 'cancelled', 'snoozed'])
    .default('pending'),
});

const CancelarLembreteArgs = z.object({
  lembrete: z.string().min(1, 'texto do lembrete é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos
// ═══════════════════════════════════════════════════════════════════

type CriarLembreteResult = {
  id: string;
  recurrenceId: string | null;
  mensagem: string;
};
type LembreteResumo = {
  id: string;
  texto: string;
  fireAt: number;
  recorrente: boolean;
};
type ListarLembretesResult = {
  estado: Reminder['status'];
  total: number;
  lembretes: LembreteResumo[];
  mensagem: string;
};
type CancelarLembreteResult = {
  id: string;
  previousStatus: Reminder['status'];
  mensagem: string;
};

const CriarLembreteResultSchema = z.object({
  id: z.string(),
  recurrenceId: z.string().nullable(),
  mensagem: z.string(),
});
const ListarLembretesResultSchema = z.object({
  estado: z.enum(['pending', 'sent', 'cancelled', 'snoozed']),
  total: z.number(),
  lembretes: z.array(
    z.object({
      id: z.string(),
      texto: z.string(),
      fireAt: z.number(),
      recorrente: z.boolean(),
    })
  ),
  mensagem: z.string(),
});
const CancelarLembreteResultSchema = z.object({
  id: z.string(),
  previousStatus: z.enum(['pending', 'sent', 'cancelled', 'snoozed']),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// criar_lembrete (FR38 + AC4 epic) — reversible (delete reminder + recurrence)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarLembreteArgs>, CriarLembreteResult>({
    name: 'criar_lembrete',
    description:
      'Cria um lembrete para um momento específico, opcionalmente recorrente. Use para "lembra-me de X em DATA às HORAS", "avisa-me todas as semanas de Y", "lembrete para pagar a luz sexta às 10h".',
    domain: 'habits',
    argsSchema: CriarLembreteArgs,
    resultSchema: CriarLembreteResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      // `quandoIso` já validado como instante real pelo refine do argsSchema.
      const fireAt = toEpochUTC(args.quandoIso);
      const id = crypto.randomUUID();
      const startDate = args.quandoIso.slice(0, 10);

      let recurrenceId: string | null = null;
      if (args.recorrencia !== null) {
        recurrenceId = crypto.randomUUID();
        const rule = new RRule({
          freq: FREQ_MAP[args.recorrencia.frequency],
          interval: args.recorrencia.interval,
          dtstart: new Date(`${startDate}T00:00:00.000Z`),
        }).toString();
        const recurrenceIdLocal = recurrenceId;
        await ctx.db.transaction(
          'rw',
          ctx.db.recurrences,
          ctx.db.reminders,
          async () => {
            await ctx.db.recurrences.add({
              id: recurrenceIdLocal,
              rule,
              startDate,
              endDate: null,
              ownerType: 'reminder',
              ownerId: id,
            });
            const reminder: Reminder = {
              id,
              text: args.texto,
              fireAt,
              recurrenceId: recurrenceIdLocal,
              channels: ['push'],
              status: 'pending',
            };
            await ctx.db.reminders.add(reminder);
          }
        );
      } else {
        const reminder: Reminder = {
          id,
          text: args.texto,
          fireAt,
          recurrenceId: null,
          channels: ['push'],
          status: 'pending',
        };
        await ctx.db.reminders.add(reminder);
      }

      const recMsg = recurrenceId !== null ? ' (recorrente)' : '';
      return {
        id,
        recurrenceId,
        mensagem: `Lembrete "${args.texto}" criado para ${args.quandoIso}${recMsg}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.transaction(
        'rw',
        ctx.db.recurrences,
        ctx.db.reminders,
        async () => {
          await ctx.db.reminders.delete(result.id);
          if (result.recurrenceId !== null) {
            await ctx.db.recurrences.delete(result.recurrenceId);
          }
        }
      );
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// listar_lembretes (FR38) — read-only
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ListarLembretesArgs>, ListarLembretesResult>({
    name: 'listar_lembretes',
    description:
      'Lista os lembretes por estado (pendentes, enviados, cancelados ou adiados), ordenados por horário. Use para "que lembretes tenho?", "mostra os meus lembretes pendentes", "lembretes cancelados".',
    domain: 'habits',
    argsSchema: ListarLembretesArgs,
    resultSchema: ListarLembretesResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const rows = await ctx.db.reminders
        .where('status')
        .equals(args.estado)
        .toArray();
      rows.sort((a, b) => a.fireAt - b.fireAt);
      const lembretes: LembreteResumo[] = rows.map((r) => ({
        id: r.id,
        texto: r.text,
        fireAt: r.fireAt,
        recorrente: r.recurrenceId !== null,
      }));
      const label =
        args.estado === 'pending'
          ? 'pendente(s)'
          : args.estado === 'sent'
            ? 'enviado(s)'
            : args.estado === 'cancelled'
              ? 'cancelado(s)'
              : 'adiado(s)';
      return {
        estado: args.estado,
        total: lembretes.length,
        lembretes,
        mensagem: `Tens ${lembretes.length} lembrete(s) ${label}.`,
      };
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// cancelar_lembrete (FR38) — reversible (restaura previousStatus)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CancelarLembreteArgs>, CancelarLembreteResult>({
    name: 'cancelar_lembrete',
    description:
      'Cancela um lembrete pendente (cancelamento reversível — não apaga). Use para "cancela o lembrete de X", "já não preciso do lembrete Y".',
    domain: 'habits',
    argsSchema: CancelarLembreteArgs,
    resultSchema: CancelarLembreteResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const reminder = await resolveLembreteByTexto(args.lembrete, ctx, true);
      const previousStatus = reminder.status;
      await ctx.db.reminders.update(reminder.id, { status: 'cancelled' });
      return {
        id: reminder.id,
        previousStatus,
        mensagem: `Lembrete "${reminder.text}" cancelado.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.reminders.update(result.id, { status: result.previousStatus });
    },
  })
);
