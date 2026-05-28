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
 * Após este import: `toolRegistry.byDomain('tasks').length === 7`,
 * `toolRegistry.byDomain('finance').length === 6` e `toolRegistry.all().length === 13`.
 */
import './tasks'; // 5 tools: criar_tarefa, completar_tarefa, listar_tarefas, listar_atrasadas, vincular_tarefa_projecto
import './projects'; // 2 tools: criar_projecto, consultar_projecto
import './finance'; // 6 tools Epic 3 (FR23): criar_financa_variavel, criar_financa_recorrente, criar_cartao, criar_parcelada, consultar_balanco, consultar_categoria (nomes ASCII — TOOL_NAME_PATTERN + Anthropic spec)
