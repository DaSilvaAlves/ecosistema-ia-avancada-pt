import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ExecutionContext, ToolDefinition } from '@/lib/agent/tools/types';
import { getGoalProgress } from '@/lib/metas/progress';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de metas (Story 4.10 — FR41)
 *
 * Regista 3 tools de domínio `'habits'` (D-DOMAIN Opção A — ratificada por Aria,
 * 01/06/2026) no `toolRegistry` singleton:
 *   - `criar_meta`       — cria uma meta (numérica ou booleana)
 *   - `actualizar_meta`  — actualiza o valor actual / marca como alcançada
 *   - `consultar_metas`  — consulta metas por estado (com percentagem de progresso)
 *
 * D-DOMAIN (Architect Ratification, Story 4.10): o campo `domain` é um bucket de
 * routing/economia de tokens (`executor.ts:getToolsForDomains` faz `byDomain(d)`)
 * + chave de `confidence[tool.domain]` para preview. O classifier mapeia
 * hábitos+metas+lembretes → `'habits'` (`classifier-system.ts:30`), logo as tools
 * de metas usam `domain:'habits'` (NÃO se estende o enum `ToolDomain`). Precedente
 * A10: `projects.ts` usa `domain:'tasks'`.
 *
 * Edge-safety (ADR-1, DEV-DECISION D1 da Story 2.10): este módulo NÃO importa
 * `@/lib/db/client` (Dexie) NEM `@/lib/db/repos/*`. Toda a persistência usa
 * `ctx.db` injectado. `getGoalProgress` de `lib/metas/progress.ts` é PURO
 * (sem Dexie, sem React — confirmado na Story 4.5), logo Edge-safe.
 *
 * NOTA NOMES ASCII: `criar_meta`/`actualizar_meta`/`consultar_metas` são ASCII
 * puro — válidos contra `TOOL_NAME_PATTERN` (`registry.ts:27`) e a Anthropic tool
 * spec. A semântica PT-PT vive nas `description`.
 *
 * Trace canónico:
 * - PRD-NEXUS-V2.md §6.7 — FR41
 * - architecture-v2.md §7.4 — inventário 9 tools Epic 4
 * - Story 3.11 (`finance.ts`) — padrão de registo replicado
 *
 * Constitution: Article IV (No Invention — campos de `types/db.ts`), Article V
 * (mensagens PT-PT), Article VI (imports absolutos `@/...`).
 */

// ═══════════════════════════════════════════════════════════════════
// Helper de registo (idêntico ao de finance.ts — Story 3.11)
// ═══════════════════════════════════════════════════════════════════

function registar<TArgs, TResult>(def: ToolDefinition<TArgs, TResult>): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

/** Substring match case-insensitive em qualquer direcção (padrão `finance.ts`). */
function fuzzyMatches(candidate: string, input: string): boolean {
  const a = candidate.toLowerCase();
  const b = input.toLowerCase();
  return a.includes(b) || b.includes(a);
}

/**
 * Resolve uma meta pelo título → devolve o `Goal`. Política (padrão `finance.ts`):
 * 0 matches → Error PT-PT com a lista; ≥2 → o título mais curto (mais específico).
 */
async function resolveMetaByTitulo(
  titulo: string,
  ctx: ExecutionContext
): Promise<Goal> {
  const goals = await ctx.db.goals.toArray();
  const matches = goals.filter((g) => fuzzyMatches(g.title, titulo));
  if (matches.length === 0) {
    const lista = goals.map((g) => g.title).join(', ');
    throw new Error(
      `Meta não encontrada: "${titulo}". Disponíveis: ${lista || '(nenhuma)'}`
    );
  }
  return matches.reduce((a, b) => (a.title.length <= b.title.length ? a : b));
}

// ═══════════════════════════════════════════════════════════════════
// argsSchemas (source: FR41 + types/db.ts Goal:188-207)
// ═══════════════════════════════════════════════════════════════════

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const CriarMetaArgs = z.object({
  titulo: z.string().min(1, 'título da meta é obrigatório'),
  tipo: z.enum(['numeric', 'boolean']).default('numeric'),
  alvo: z.number().nullable().default(null),
  prazo: z
    .string()
    .regex(ISO_DATE_RE, 'prazo deve ser YYYY-MM-DD')
    .nullable()
    .default(null),
  descricao: z.string().max(1000).nullable().default(null),
});

const ActualizarMetaArgs = z.object({
  meta: z.string().min(1, 'meta (título) é obrigatória'),
  novoValor: z.number().nullable().default(null),
  marcarAlcancada: z.boolean().default(false),
});

const ConsultarMetasArgs = z.object({
  estado: z.enum(['active', 'achieved', 'cancelled']).default('active'),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos de resultado
// ═══════════════════════════════════════════════════════════════════

type CriarMetaResult = { id: string; mensagem: string };
type ActualizarMetaResult = {
  id: string;
  mensagem: string;
  // Snapshot para reverse (estado anterior antes da mutação).
  previousCurrent: number;
  previousStatus: Goal['status'];
  previousProgressLog?: Goal['progressLog'];
};
type MetaResumo = {
  id: string;
  titulo: string;
  tipo: Goal['type'];
  percentagem: number;
  alcancada: boolean;
};
type ConsultarMetasResult = {
  estado: Goal['status'];
  total: number;
  metas: MetaResumo[];
  mensagem: string;
};

const CriarMetaResultSchema = z.object({
  id: z.string(),
  mensagem: z.string(),
});
const ActualizarMetaResultSchema = z.object({
  id: z.string(),
  mensagem: z.string(),
  previousCurrent: z.number(),
  previousStatus: z.enum(['active', 'achieved', 'cancelled']),
  previousProgressLog: z
    .array(
      z.object({
        date: z.string(),
        value: z.number(),
        note: z.string().optional(),
      })
    )
    .optional(),
});
const ConsultarMetasResultSchema = z.object({
  estado: z.enum(['active', 'achieved', 'cancelled']),
  total: z.number(),
  metas: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      tipo: z.enum(['numeric', 'boolean']),
      percentagem: z.number(),
      alcancada: z.boolean(),
    })
  ),
  mensagem: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// criar_meta (FR41) — reversible (delete)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarMetaArgs>, CriarMetaResult>({
    name: 'criar_meta',
    description:
      'Cria uma meta/objectivo pessoal (numérica com alvo, ou booleana sim/não). Use para "define a meta de X", "quero atingir Y", "objectivo de ler N livros".',
    domain: 'habits',
    argsSchema: CriarMetaArgs,
    resultSchema: CriarMetaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      // Para metas booleanas o alvo é um passo único (1); para numéricas usa o
      // `alvo` indicado (default 1 se omitido — coerente com getGoalProgress).
      const target = args.tipo === 'boolean' ? 1 : (args.alvo ?? 1);
      const id = crypto.randomUUID();
      const goal: Goal = {
        id,
        title: args.titulo,
        description: args.descricao ?? undefined,
        type: args.tipo,
        target,
        current: 0,
        deadline: args.prazo,
        status: 'active',
        milestones: [],
      };
      await ctx.db.goals.add(goal);
      const alvoMsg =
        args.tipo === 'numeric' ? ` (alvo: ${target})` : ' (sim/não)';
      return {
        id,
        mensagem: `Meta "${args.titulo}" criada${alvoMsg}.`,
      };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.goals.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// actualizar_meta (FR41) — reversible (restaura snapshot do estado anterior)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ActualizarMetaArgs>, ActualizarMetaResult>({
    name: 'actualizar_meta',
    description:
      'Actualiza o progresso de uma meta (novo valor actual) ou marca-a como alcançada. Use para "já li 5 livros", "actualiza a meta X para Y", "marca a meta Z como alcançada/concluída".',
    domain: 'habits',
    argsSchema: ActualizarMetaArgs,
    resultSchema: ActualizarMetaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const goal = await resolveMetaByTitulo(args.meta, ctx);
      // Snapshot ANTES da mutação (para reverse).
      const previousCurrent = goal.current;
      const previousStatus = goal.status;
      const previousProgressLog = goal.progressLog;

      const patch: Partial<Goal> = {};
      let mensagem: string;

      if (args.marcarAlcancada) {
        patch.status = 'achieved';
        if (goal.type === 'numeric') patch.current = goal.target;
        mensagem = `Meta "${goal.title}" marcada como alcançada.`;
      } else if (args.novoValor !== null) {
        const today = new Date().toISOString().slice(0, 10);
        patch.current = args.novoValor;
        patch.progressLog = [
          ...(goal.progressLog ?? []),
          { date: today, value: args.novoValor },
        ];
        mensagem = `Meta "${goal.title}" actualizada para ${args.novoValor}.`;
      } else {
        throw new Error(
          'Nada a actualizar: indica um novo valor ou marca como alcançada.'
        );
      }

      await ctx.db.goals.update(goal.id, patch);
      return {
        id: goal.id,
        mensagem,
        previousCurrent,
        previousStatus,
        previousProgressLog,
      };
    },
    reverse: async (_args, result, ctx) => {
      // Restaura o estado anterior capturado no snapshot. `progressLog` pode ser
      // `undefined` (meta sem histórico antes da actualização) — Dexie `update`
      // não remove campos com `undefined`, por isso usa-se `put` parcial via get.
      const goal = await ctx.db.goals.get(result.id);
      if (goal === undefined) return;
      goal.current = result.previousCurrent;
      goal.status = result.previousStatus;
      goal.progressLog = result.previousProgressLog;
      await ctx.db.goals.put(goal);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// consultar_metas (FR41) — read-only
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ConsultarMetasArgs>, ConsultarMetasResult>({
    name: 'consultar_metas',
    description:
      'Consulta as metas por estado (activas, alcançadas ou canceladas) com a respectiva percentagem de progresso. Use para "quais as minhas metas?", "que objectivos tenho activos?", "metas já alcançadas".',
    domain: 'habits',
    argsSchema: ConsultarMetasArgs,
    resultSchema: ConsultarMetasResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const goals = await ctx.db.goals
        .where('status')
        .equals(args.estado)
        .toArray();
      const metas: MetaResumo[] = goals.map((g) => {
        const progress = getGoalProgress(g);
        return {
          id: g.id,
          titulo: g.title,
          tipo: g.type,
          percentagem: progress.percentage,
          alcancada: progress.isAchieved,
        };
      });
      const label =
        args.estado === 'active'
          ? 'activa(s)'
          : args.estado === 'achieved'
            ? 'alcançada(s)'
            : 'cancelada(s)';
      return {
        estado: args.estado,
        total: metas.length,
        metas,
        mensagem: `Tens ${metas.length} meta(s) ${label}.`,
      };
    },
  })
);
