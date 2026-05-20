import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de projectos (Story 2.10 — FR32)
 *
 * Regista 2 tools de domínio `'tasks'` no `toolRegistry` singleton:
 *   - `criar_projecto`     — cria um projecto
 *   - `consultar_projecto` — consulta detalhes + progresso de um projecto
 *
 * Domínio `'tasks'` (AUTO-DECISION A10): o `byDomain('tasks')` do executor
 * apanha estas tools quando o classifier detecta intent de tarefas/projectos.
 *
 * Edge-safety (ADR-1): este módulo NÃO importa `@/lib/db/client` (Dexie) —
 * todas as operações usam `ctx.db` injectado. `consultar_projecto` faz a
 * contagem de tarefas inline com `ctx.db.tasks` em vez de chamar o helper
 * `listTasks` de `lib/db/repos/tasks.ts` (que importa o singleton `db`).
 * Decisão registada no Dev Agent Record da Story 2.10.
 *
 * Trace canónico:
 * - PRD-NEXUS-V2.md §6.5 L164 — FR32
 * - architecture-v2.md §7.4 — inventário 7 tools Epic 2
 *
 * Constitution:
 * - Article IV (No Invention): campos derivam de `types/db.ts` Project
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...`
 */

// ═══════════════════════════════════════════════════════════════════
// argsSchemas
// ═══════════════════════════════════════════════════════════════════

const CriarProjectoArgs = z.object({
  nome: z.string().min(1, 'nome é obrigatório').max(200),
  descricao: z.string().max(2000).default(''),
  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'prazo deve ser YYYY-MM-DD')
    .nullable()
    .default(null),
});

const ConsultarProjectoArgs = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos de resultado
// ═══════════════════════════════════════════════════════════════════

type CriarProjectoResult = { id: string; nome: string };
type ConsultarProjectoResult = {
  id: string;
  nome: string;
  descricao: string;
  status: string;
  startDate: string | null;
  deadline: string | null;
  totalTarefas: number;
  tarefasConcluidas: number;
};

const CriarProjectoResultSchema = z.object({
  id: z.string(),
  nome: z.string(),
});

const ConsultarProjectoResultSchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: z.string(),
  status: z.string(),
  startDate: z.string().nullable(),
  deadline: z.string().nullable(),
  totalTarefas: z.number(),
  tarefasConcluidas: z.number(),
});

// ═══════════════════════════════════════════════════════════════════
// Helper de registo
// ═══════════════════════════════════════════════════════════════════

/**
 * Regista uma tool tipada no `toolRegistry`. Cast necessário pela
 * contravariância de `execute` — ver justificação em `tasks.ts`.
 * `defineTool` valida o shape em runtime; o cast é seguro e evita `any`.
 */
function registar<TArgs, TResult>(
  def: ToolDefinition<TArgs, TResult>
): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

// ═══════════════════════════════════════════════════════════════════
// criar_projecto (FR32 — trace: PRD §6.5 L164)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarProjectoArgs>, CriarProjectoResult>({
    name: 'criar_projecto',
    description:
      'Cria um novo projecto. Use para "cria o projecto X", "quero começar um projecto chamado Y".',
    domain: 'tasks',
    argsSchema: CriarProjectoArgs,
    resultSchema: CriarProjectoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const project: Project = {
        id: crypto.randomUUID(),
        name: args.nome,
        description: args.descricao,
        status: 'active',
        startDate: new Date().toISOString().slice(0, 10),
        deadline: args.prazo,
        createdAt: Date.now(),
      };
      await ctx.db.projects.add(project);
      return { id: project.id, nome: args.nome };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.projects.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// consultar_projecto (FR32 — trace: PRD §6.5 L164)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ConsultarProjectoArgs>, ConsultarProjectoResult>({
    name: 'consultar_projecto',
    description:
      'Consulta os detalhes e progresso de um projecto (nome, status, datas, contagem de tarefas). Use para "como está o projecto X?", "mostra-me o projecto Y".',
    domain: 'tasks',
    argsSchema: ConsultarProjectoArgs,
    resultSchema: ConsultarProjectoResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const project = await ctx.db.projects.get(args.id);
      if (project === undefined) {
        throw new Error(`Projecto "${args.id}" não encontrado`);
      }
      const tasks = await ctx.db.tasks
        .where('projectId')
        .equals(args.id)
        .toArray();
      const tarefasConcluidas = tasks.filter(
        (t) => t.status === 'done'
      ).length;
      return {
        id: project.id,
        nome: project.name,
        descricao: project.description,
        status: project.status,
        startDate: project.startDate,
        deadline: project.deadline,
        totalTarefas: tasks.length,
        tarefasConcluidas,
      };
    },
  })
);
