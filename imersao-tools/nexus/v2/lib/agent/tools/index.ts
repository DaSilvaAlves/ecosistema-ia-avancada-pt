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
 * `toolRegistry.byDomain('finance').length === 6`, `toolRegistry.byDomain('habits').length === 9`
 * e `toolRegistry.all().length === 22`.
 *
 * D-DOMAIN (Story 4.10, Architect Ratification Opção A): as 9 tools do Epic 4
 * (hábitos+metas+lembretes) usam `domain:'habits'` — o classifier mapeia as 3
 * áreas para `'habits'` (`classifier-system.ts:30`). O enum `ToolDomain` NÃO é
 * estendido. Precedente A10: `projects.ts` usa `domain:'tasks'`.
 */
import './tasks'; // 5 tools: criar_tarefa, completar_tarefa, listar_tarefas, listar_atrasadas, vincular_tarefa_projecto
import './projects'; // 2 tools: criar_projecto, consultar_projecto
import './finance'; // 6 tools Epic 3 (FR23): criar_financa_variavel, criar_financa_recorrente, criar_cartao, criar_parcelada, consultar_balanco, consultar_categoria (nomes ASCII — TOOL_NAME_PATTERN + Anthropic spec)
import './habits'; // 3 tools Epic 4 (FR28): criar_habito, registar_habito_concluido, consultar_evolucao_habito (domain:'habits')
import './goals'; // 3 tools Epic 4 (FR41): criar_meta, actualizar_meta, consultar_metas (domain:'habits' — D-DOMAIN Opção A)
import './reminders'; // 3 tools Epic 4 (FR38): criar_lembrete, listar_lembretes, cancelar_lembrete (domain:'habits' — D-DOMAIN Opção A)
