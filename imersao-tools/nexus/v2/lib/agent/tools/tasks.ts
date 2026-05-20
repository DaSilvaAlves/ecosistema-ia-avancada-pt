import { z } from 'zod';
import { toolRegistry, defineTool } from '@/lib/agent/tools/registry';
import type { ToolDefinition } from '@/lib/agent/tools/types';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — Tools cérebro de tarefas (Story 2.10 — FR15)
 *
 * Regista 5 tools de domínio `'tasks'` no `toolRegistry` singleton:
 *   - `criar_tarefa`             — cria uma tarefa
 *   - `completar_tarefa`         — marca uma tarefa como concluída
 *   - `listar_tarefas`           — lista tarefas com filtro opcional
 *   - `listar_atrasadas`         — lista tarefas com prazo ultrapassado
 *   - `vincular_tarefa_projecto` — vincula/desvincula tarefa↔projecto
 *
 * `vincular_tarefa_projecto` serve FR15 + FR32 mas é registada apenas 1x aqui
 * (domínio `'tasks'`), pois modifica a entidade `Task.projectId` (AUTO-DECISION
 * A10 da story).
 *
 * Edge-safety (ADR-1): este módulo NÃO importa `@/lib/db/client` (Dexie) nem
 * `@vercel/kv` — todas as operações de DB usam `ctx.db` injectado em runtime
 * (`ExecutionContext.db: NexusDB`). Apenas `import type { Task }`. As leituras
 * complexas (`listar_tarefas`, `listar_atrasadas`) são feitas inline com
 * `ctx.db.tasks` em vez de chamar os helpers de `lib/db/repos/tasks.ts` —
 * estes importam o singleton `db` de `@/lib/db/client`, o que puxaria Dexie
 * para o caminho Edge. Decisão registada no Dev Agent Record da Story 2.10.
 *
 * Trace canónico:
 * - PRD-NEXUS-V2.md §6.2 L138 — FR15
 * - architecture-v2.md §7.3 — exemplo canónico `criar_tarefa`
 * - architecture-v2.md §7.4 — inventário 7 tools Epic 2
 *
 * Constitution:
 * - Article IV (No Invention): campos derivam de `types/db.ts` Task + arch §7.3
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...`
 */

// ═══════════════════════════════════════════════════════════════════
// Mapeamento prioridade PT-PT ↔ priority EN
// ═══════════════════════════════════════════════════════════════════

const PRIORIDADE_PT_PARA_EN = {
  alta: 'high',
  media: 'medium',
  baixa: 'low',
} as const satisfies Record<string, Task['priority']>;

const PRIORIDADE_EN_PARA_PT = {
  high: 'alta',
  medium: 'media',
  low: 'baixa',
} as const satisfies Record<Task['priority'], string>;

// ═══════════════════════════════════════════════════════════════════
// argsSchemas (source: architecture-v2.md §7.3 + types/db.ts)
// ═══════════════════════════════════════════════════════════════════

const CriarTarefaArgs = z.object({
  titulo: z.string().min(1, 'título é obrigatório').max(200),
  prioridade: z.enum(['alta', 'media', 'baixa']).default('media'),
  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'prazo deve ser YYYY-MM-DD')
    .nullable()
    .default(null),
  projecto: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  descricao: z.string().max(2000).default(''),
});

const CompletarTarefaArgs = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
});

const ListarTarefasArgs = z.object({
  status: z.enum(['todo', 'in-progress', 'blocked', 'done']).optional(),
  projectoId: z.string().uuid().nullable().optional(),
  limite: z.number().int().min(1).max(100).default(20),
});

const ListarAtrasadasArgs = z.object({
  limite: z.number().int().min(1).max(100).default(20),
});

const VincularTarefaProjectoArgs = z.object({
  tarefaId: z.string().uuid('tarefaId deve ser UUID válido'),
  projectoId: z.string().uuid('projectoId deve ser UUID válido').nullable(),
});

// ═══════════════════════════════════════════════════════════════════
// resultSchemas + tipos de resultado
// ═══════════════════════════════════════════════════════════════════

type CriarTarefaResult = { id: string; titulo: string };
type CompletarTarefaResult = { id: string; statusAnterior: string };
type TarefaResumida = {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  projectoId: string | null;
};
type ListarTarefasResult = { tarefas: TarefaResumida[]; total: number };
type TarefaAtrasada = {
  id: string;
  titulo: string;
  prazo: string | null;
  prioridade: string;
};
type ListarAtrasadasResult = { tarefas: TarefaAtrasada[]; total: number };
type VincularTarefaProjectoResult = {
  tarefaId: string;
  projectoIdAnterior: string | null;
  projectoIdNovo: string | null;
};

const CriarTarefaResultSchema = z.object({
  id: z.string(),
  titulo: z.string(),
});

const CompletarTarefaResultSchema = z.object({
  id: z.string(),
  statusAnterior: z.string(),
});

const ListarTarefasResultSchema = z.object({
  tarefas: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      status: z.string(),
      prioridade: z.string(),
      prazo: z.string().nullable(),
      projectoId: z.string().nullable(),
    })
  ),
  total: z.number(),
});

const ListarAtrasadasResultSchema = z.object({
  tarefas: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      prazo: z.string().nullable(),
      prioridade: z.string(),
    })
  ),
  total: z.number(),
});

const VincularTarefaProjectoResultSchema = z.object({
  tarefaId: z.string(),
  projectoIdAnterior: z.string().nullable(),
  projectoIdNovo: z.string().nullable(),
});

// ═══════════════════════════════════════════════════════════════════
// Helper de registo
// ═══════════════════════════════════════════════════════════════════

/**
 * Regista uma tool tipada no `toolRegistry`. O cast para `ToolDefinition`
 * (de `ToolDefinition<TArgs, TResult>` para `ToolDefinition<unknown,
 * unknown>`) é necessário porque `register` aceita o tipo não-genérico — o
 * parâmetro `args` de `execute` é contravariante, logo a forma específica
 * não é estruturalmente atribuível à forma `unknown`. `defineTool` valida o
 * shape em runtime, pelo que o cast é seguro. Evita `any` (Constitution).
 */
function registar<TArgs, TResult>(
  def: ToolDefinition<TArgs, TResult>
): void {
  toolRegistry.register(def as unknown as ToolDefinition);
}

// ═══════════════════════════════════════════════════════════════════
// criar_tarefa (FR15 — trace: PRD §6.2 L138, arch §7.3)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CriarTarefaArgs>, CriarTarefaResult>({
    name: 'criar_tarefa',
    description:
      'Cria uma nova tarefa. Use para qualquer pedido de "criar/adicionar/lembrar de fazer X".',
    domain: 'tasks',
    argsSchema: CriarTarefaArgs,
    resultSchema: CriarTarefaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const now = Date.now();
      const task: Task = {
        id: crypto.randomUUID(),
        title: args.titulo,
        description: args.descricao,
        priority: PRIORIDADE_PT_PARA_EN[args.prioridade],
        status: 'todo',
        dueDate: args.prazo,
        projectId: args.projecto,
        tags: args.tags,
        context: null,
        lastWorkedAt: null,
        recurrenceId: null,
        parentTaskId: null,
        createdAt: now,
        updatedAt: now,
      };
      await ctx.db.tasks.add(task);
      return { id: task.id, titulo: args.titulo };
    },
    reverse: async (_args, result, ctx) => {
      await ctx.db.tasks.delete(result.id);
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// completar_tarefa (FR15 — trace: PRD §6.2 L138)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof CompletarTarefaArgs>, CompletarTarefaResult>({
    name: 'completar_tarefa',
    description:
      'Marca uma tarefa como concluída. Use quando o utilizador diz "fiz", "conclui", "marquei como feita" ou "completa a tarefa X".',
    domain: 'tasks',
    argsSchema: CompletarTarefaArgs,
    resultSchema: CompletarTarefaResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const task = await ctx.db.tasks.get(args.id);
      if (task === undefined) {
        throw new Error(`Tarefa "${args.id}" não encontrada`);
      }
      const statusAnterior = task.status;
      const now = Date.now();
      await ctx.db.tasks.update(args.id, {
        status: 'done',
        lastWorkedAt: now,
        updatedAt: now,
      });
      return { id: args.id, statusAnterior };
    },
    reverse: async (args, result, ctx) => {
      await ctx.db.tasks.update(args.id, {
        status: result.statusAnterior as Task['status'],
        updatedAt: Date.now(),
      });
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// listar_tarefas (FR15 — trace: PRD §6.2 L138)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ListarTarefasArgs>, ListarTarefasResult>({
    name: 'listar_tarefas',
    description:
      'Lista as tarefas do utilizador com filtro opcional por status ou projecto. Use para "que tarefas tenho", "mostra as tarefas em curso", "tarefas do projecto X".',
    domain: 'tasks',
    argsSchema: ListarTarefasArgs,
    resultSchema: ListarTarefasResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const all = await ctx.db.tasks.toArray();
      const filtered = all
        .filter((t) => {
          if (args.status !== undefined && t.status !== args.status) {
            return false;
          }
          if (
            args.projectoId !== undefined &&
            t.projectId !== args.projectoId
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, args.limite);

      const tarefas: TarefaResumida[] = filtered.map((t) => ({
        id: t.id,
        titulo: t.title,
        status: t.status,
        prioridade: PRIORIDADE_EN_PARA_PT[t.priority],
        prazo: t.dueDate,
        projectoId: t.projectId,
      }));
      return { tarefas, total: tarefas.length };
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// listar_atrasadas (FR15 — trace: PRD §6.2 L138)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<z.infer<typeof ListarAtrasadasArgs>, ListarAtrasadasResult>({
    name: 'listar_atrasadas',
    description:
      'Lista as tarefas com prazo ultrapassado e ainda não concluídas. Use para "que tarefas estão atrasadas", "tenho tarefas em atraso?".',
    domain: 'tasks',
    argsSchema: ListarAtrasadasArgs,
    resultSchema: ListarAtrasadasResultSchema,
    requiresPreview: false,
    reversible: false,
    execute: async (args, ctx) => {
      const today = new Date().toISOString().slice(0, 10);
      const all = await ctx.db.tasks.toArray();
      const atrasadas = all
        .filter(
          (t) =>
            t.dueDate !== null &&
            t.dueDate < today &&
            t.status !== 'done'
        )
        .sort((a, b) => b.createdAt - a.createdAt);

      const tarefas: TarefaAtrasada[] = atrasadas
        .slice(0, args.limite)
        .map((t) => ({
          id: t.id,
          titulo: t.title,
          prazo: t.dueDate,
          prioridade: PRIORIDADE_EN_PARA_PT[t.priority],
        }));
      return { tarefas, total: atrasadas.length };
    },
  })
);

// ═══════════════════════════════════════════════════════════════════
// vincular_tarefa_projecto (FR15 + FR32 — trace: PRD §6.2 L138, §6.5 L164)
// ═══════════════════════════════════════════════════════════════════

registar(
  defineTool<
    z.infer<typeof VincularTarefaProjectoArgs>,
    VincularTarefaProjectoResult
  >({
    name: 'vincular_tarefa_projecto',
    description:
      'Vincula (ou desvincula se projectoId for null) uma tarefa a um projecto. Use para "adiciona a tarefa X ao projecto Y" ou "remove a tarefa X do projecto".',
    domain: 'tasks',
    argsSchema: VincularTarefaProjectoArgs,
    resultSchema: VincularTarefaProjectoResultSchema,
    requiresPreview: false,
    reversible: true,
    execute: async (args, ctx) => {
      const task = await ctx.db.tasks.get(args.tarefaId);
      if (task === undefined) {
        throw new Error(`Tarefa "${args.tarefaId}" não encontrada`);
      }
      if (args.projectoId !== null) {
        const proj = await ctx.db.projects.get(args.projectoId);
        if (proj === undefined) {
          throw new Error(`Projecto "${args.projectoId}" não encontrado`);
        }
      }
      const projectoIdAnterior = task.projectId;
      await ctx.db.tasks.update(args.tarefaId, {
        projectId: args.projectoId,
        updatedAt: Date.now(),
      });
      return {
        tarefaId: args.tarefaId,
        projectoIdAnterior,
        projectoIdNovo: args.projectoId,
      };
    },
    reverse: async (args, result, ctx) => {
      await ctx.db.tasks.update(args.tarefaId, {
        projectId: result.projectoIdAnterior,
        updatedAt: Date.now(),
      });
    },
  })
);
