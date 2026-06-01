import { z } from 'zod';
import { RRule } from 'rrule';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';
import { getMetricRecords } from '@/lib/habitos/metrics';
import type { Habit, HabitLog } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de hábitos (Story 4.10 — FR28)
 *
 * Regista 3 tools de domínio `'habits'` (D-DOMAIN Opção A) no `toolRegistry`:
 *   - `criar_habito`                — cria um hábito (frequência RRULE + categoria)
 *   - `registar_habito_concluido`   — regista um hábito como concluído num dia
 *   - `consultar_evolucao_habito`   — consulta a evolução/recordes de um hábito
 *
 * Edge-safety (ADR-1, DEV-DECISION D1 da Story 2.10): NÃO importa
 * `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*`. Persistência via `ctx.db`.
 * Helpers importados são PUROS e Edge-safe: `getMetricRecords` de
 * `lib/habitos/metrics.ts` (sem Dexie, confirmado na Story 4.4) e a classe
 * `RRule` da lib `'rrule'` (JS pura — apenas a classe, não o motor da Story 2.7).
 *
 * Tabela Dexie: `ctx.db.habit_logs` (snake_case — `client.ts:73,90`). NÃO existe
 * `habitLogs` (correcção @po na validação da story).
 *
 * NOTA NOMES ASCII: nomes ASCII puro — válidos contra `TOOL_NAME_PATTERN`
 * (`registry.ts:27`) + Anthropic spec. Semântica PT-PT nas `description`.
 *
 * Trace: PRD-NEXUS-V2.md §6.4 (FR28); architecture-v2.md §7.4; Story 3.11
 * (`finance.ts`) padrão replicado.
 *
 * Constitution: Article IV (No Invention), V (PT-PT), VI (imports `@/...` + rrule).
 */

// ═══════════════════════════════════════════════════════════════════
// FREQ_MAP — espelha finance.ts:63-68 (classe RRule pura; NÃO o motor)
// ═══════════════════════════════════════════════════════════════════

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
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
 * Resolve um hábito pelo nome → devolve o `Habit`. Política (padrão `finance.ts`):
 * 0 matches → Error PT-PT com a lista; ≥2 → o nome mais curto (mais específico).
 * Ignora hábitos arquivados (`archivedAt` definido) na resolução.
 */
async function resolveHabitoByNome(
  nome: string,
  ctx: ExecutionContext
): Promise<Habit> {
  const habits = (await ctx.db.habits.toArray()).filter(
    (h) => h.archivedAt === undefined
  );
  const matches = habits.filter((h) => fuzzyMatches(h.name, nome));
  if (matches.length === 0) {
    const lista = habits.map((h) => h.name).join(', ');
    throw new Error(
      `Hábito não encontrado: "${nome}". Disponíveis: ${lista || '(nenhum)'}`
    );
  }
  return matches.reduce((a, b) => (a.name.length <= b.name.length ? a : b));
}

/**
 * Valida que uma string `YYYY-MM-DD` é uma data de calendário REAL (padrão
 * `finance.ts:76`). Rejeita `2026-02-30`, `2026-13-01`, etc.
 */
function isRealIsoDate(s: string): boolean {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// ═══════════════════════════════════════════════════════════════════
// argsSchemas (source: FR28 + types/db.ts Habit:170-186)
// ═══════════════════════════════════════════════════════════════════

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const CriarHabitoArgs = z.object({
  nome: z.string().min(1, 'nome do hábito é obrigatório'),
  frequencia: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  categoria: z.string().min(1).default('Geral'),
  hora: z.string().regex(HHMM_RE, 'hora deve ser HH:MM').nullable().default(null),
  metricaUnidade: z.string().min(1).nullable().default(null),
  metricaAlvo: z.number().nullable().default(null),
});

const RegistarHabitoConcluidoArgs = z.object({
  habito: z.string().min(1, 'nome do hábito é obrigatório'),
  data: z
    .string()
    .regex(ISO_DATE_RE, 'data deve ser YYYY-MM-DD')
    .refine(isRealIsoDate, 'data inválida — não é uma data de calendário real')
    .default(() => new Date().toISOString().slice(0, 10)),
  valor: z.number().nullable().default(null),
});

const ConsultarEvolucaoHabitoArgs = z.object({
  habito: z.string().min(1, 'nome do hábito é obrigatório'),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos
// ═══════════════════════════════════════════════════════════════════

type CriarHabitoResult = { id: string; mensagem: string };
type RegistarHabitoConcluidoResult = { id: string; habitId: string; mensagem: string };
type ConsultarEvolucaoHabitoResult = {
  habitId: string;
  totalRegistos: number;
  bestDayValue: number;
  bestMonthValue: number;
  bestDayDate: string;
  mensagem: string;
};

const CriarHabitoResultSchema = z.object({
  id: z.string(),
  mensagem: z.string(),
});
const RegistarHabitoConcluidoResultSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  mensagem: z.string(),
});
const ConsultarEvolucaoHabitoResultSchema = z.object({
  habitId: z.string(),
  totalRegistos: z.number(),
  bestDayValue: z.number(),
  bestMonthValue: z.number(),
  bestDayDate: z.string(),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// criar_habito (FR28) — reversible (delete)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarHabitoArgs>, CriarHabitoResult>({
    name: 'criar_habito',
    description:
      'Cria um novo hábito com frequência (diária, semanal ou mensal) e categoria, opcionalmente com métrica (unidade + alvo). Use para "cria o hábito de X", "quero X todos os dias", "adiciona hábito de correr".',
    domain: 'habits',
    argsSchema: CriarHabitoArgs,
    resultSchema: CriarHabitoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      // `frequency` é uma RRULE string (Habit.frequency — types/db.ts:173).
      const frequency = new RRule({
        freq: FREQ_MAP[args.frequencia],
        interval: 1,
      }).toString();
      const id = crypto.randomUUID();
      const habit: Habit = {
        id,
        name: args.nome,
        frequency,
        category: args.categoria,
        time: args.hora ?? undefined,
        metric:
          args.metricaUnidade !== null && args.metricaAlvo !== null
            ? { unit: args.metricaUnidade, target: args.metricaAlvo }
            : undefined,
        createdAt: Date.now(),
      };
      await ctx.db.habits.add(habit);
      const freqMsg =
        args.frequencia === 'daily'
          ? 'diário'
          : args.frequencia === 'weekly'
            ? 'semanal'
            : 'mensal';
      return {
        id,
        mensagem: `Hábito "${args.nome}" (${freqMsg}) criado na categoria ${args.categoria}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.habits.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// registar_habito_concluido (FR25/FR28) — reversible (delete log)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<
    z.infer<typeof RegistarHabitoConcluidoArgs>,
    RegistarHabitoConcluidoResult
  >({
    name: 'registar_habito_concluido',
    description:
      'Regista um hábito como concluído num dia (opcionalmente com um valor de métrica). Use para "fiz o hábito X hoje", "já corri", "marca X como feito", "completei X com N km".',
    domain: 'habits',
    argsSchema: RegistarHabitoConcluidoArgs,
    resultSchema: RegistarHabitoConcluidoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const habit = await resolveHabitoByNome(args.habito, ctx);
      const id = crypto.randomUUID();
      const log: HabitLog = {
        id,
        habitId: habit.id,
        date: args.data,
        value: args.valor ?? undefined,
      };
      await ctx.db.habit_logs.add(log);
      const valorMsg = args.valor !== null ? ` (${args.valor})` : '';
      return {
        id,
        habitId: habit.id,
        mensagem: `Hábito "${habit.name}" registado em ${args.data}${valorMsg}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.habit_logs.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// consultar_evolucao_habito (FR28) — read-only
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<
    z.infer<typeof ConsultarEvolucaoHabitoArgs>,
    ConsultarEvolucaoHabitoResult
  >({
    name: 'consultar_evolucao_habito',
    description:
      'Consulta a evolução e os recordes de um hábito (total de registos, melhor dia, melhor mês). Use para "como vai o hábito X?", "qual o meu recorde de X?", "evolução do hábito de correr".',
    domain: 'habits',
    argsSchema: ConsultarEvolucaoHabitoArgs,
    resultSchema: ConsultarEvolucaoHabitoResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const habit = await resolveHabitoByNome(args.habito, ctx);
      const logs = await ctx.db.habit_logs
        .where('habitId')
        .equals(habit.id)
        .toArray();
      // Recordes via helper puro (Story 4.4 — Edge-safe).
      const records = getMetricRecords(logs);
      return {
        habitId: habit.id,
        totalRegistos: logs.length,
        bestDayValue: records.bestDayValue,
        bestMonthValue: records.bestMonthValue,
        bestDayDate: records.bestDayDate,
        mensagem: `Hábito "${habit.name}": ${logs.length} registo(s)${
          records.bestDayValue > 0
            ? `, melhor dia ${records.bestDayValue} (${records.bestDayDate})`
            : ''
        }.`,
      };
    },
  })
);
