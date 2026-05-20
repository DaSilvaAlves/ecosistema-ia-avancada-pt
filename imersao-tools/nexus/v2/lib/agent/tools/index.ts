/**
 * Nexus v2 — Barrel de inicialização das tools (Story 2.10 — FR15 + FR32)
 *
 * Side-effect imports que registam todas as tools do Epic 2 no `toolRegistry`
 * singleton (`lib/agent/tools/registry.ts`). Cada módulo importado executa os
 * seus `toolRegistry.register({...})` ao ser avaliado.
 *
 * Importar este módulo no Route Handler `/api/agent/prompt` antes de qualquer
 * chamada ao executor/classifier — sem este import, `toolRegistry.all()`
 * retorna `[]` e o executor não tem tools disponíveis.
 *
 * Após este import: `toolRegistry.byDomain('tasks').length === 7` e
 * `toolRegistry.all().length === 7`.
 */
import './tasks'; // 5 tools: criar_tarefa, completar_tarefa, listar_tarefas, listar_atrasadas, vincular_tarefa_projecto
import './projects'; // 2 tools: criar_projecto, consultar_projecto
