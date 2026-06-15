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
 * `toolRegistry.byDomain('finance').length === 6`, `toolRegistry.byDomain('habits').length === 9`,
 * `toolRegistry.byDomain('journal').length === 4`, `toolRegistry.byDomain('knowledge').length === 5`
 * e `toolRegistry.all().length === 31`.
 *
 * D-DOMAIN (Story 4.10, Architect Ratification Opção A): as 9 tools do Epic 4
 * (hábitos+metas+lembretes) usam `domain:'habits'` — o classifier mapeia as 3
 * áreas para `'habits'` (`classifier-system.ts:30`). O enum `ToolDomain` NÃO é
 * estendido. Precedente A10: `projects.ts` usa `domain:'tasks'`.
 *
 * `[D-5.13-DOMAIN]`=A (Story 5.13, Architect Ratification Aria 15/06/2026): as 9
 * tools do Epic 5 dividem-se em 2 ficheiros por domínio — `journal.ts` (4 tools,
 * `domain:'journal'`, inclui `brain_dump` porque o classifier agrupa brain dumps
 * em `journal` — `classifier-system.ts:31`) e `knowledge.ts` (5 tools,
 * `domain:'knowledge'`).
 */
import './tasks'; // 5 tools: criar_tarefa, completar_tarefa, listar_tarefas, listar_atrasadas, vincular_tarefa_projecto
import './projects'; // 2 tools: criar_projecto, consultar_projecto
import './finance'; // 6 tools Epic 3 (FR23): criar_financa_variavel, criar_financa_recorrente, criar_cartao, criar_parcelada, consultar_balanco, consultar_categoria (nomes ASCII — TOOL_NAME_PATTERN + Anthropic spec)
import './habits'; // 3 tools Epic 4 (FR28): criar_habito, registar_habito_concluido, consultar_evolucao_habito (domain:'habits')
import './goals'; // 3 tools Epic 4 (FR41): criar_meta, actualizar_meta, consultar_metas (domain:'habits' — D-DOMAIN Opção A)
import './reminders'; // 3 tools Epic 4 (FR38): criar_lembrete, listar_lembretes, cancelar_lembrete (domain:'habits' — D-DOMAIN Opção A)
import './journal'; // 4 tools Epic 5 (FR46+FR50): criar_entrada_diario, consultar_diario, pesquisar_diario, brain_dump (domain:'journal' — D-5.13-DOMAIN Opção A)
import './knowledge'; // 5 tools Epic 5 (FR57): criar_area, criar_caderno, criar_nota, pesquisar_conhecimento, pesquisar_web_e_criar_nota (domain:'knowledge' — D-5.13-DOMAIN Opção A)
