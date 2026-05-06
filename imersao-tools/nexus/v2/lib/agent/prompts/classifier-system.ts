import type { ToolDomain } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Classifier system prompt PT-PT (Story 1.4)
 *
 * System prompt few-shot que ensina o Haiku 4.5 a classificar prompts PT-PT
 * em domínios funcionais (`ToolDomain` da Story 1.3). Output JSON estrito
 * validado pelo wrapper `lib/agent/classifier.ts` (validação adicional fail-loud).
 *
 * Decisão arquitectural Story 1.4: `intents` retornados são DOMAINS (e.g.
 * `'tasks'`, `'calendar'`), NÃO tool names — alinha optimização token economy
 * (arch §7.4): Story 1.5 (executor) faz `toolRegistry.byDomain(d)` por cada
 * domain detectado para enviar apenas ~10 tools ao Sonnet em vez de 39.
 *
 * Trace canónico:
 * - PRD §10 line 415 — `Classifier: prompt PT-PT → intents + confidence`
 * - PRD §10 line 424 (Epic 1 AC1) — benchmark multi-intent obrigatório (FEW_SHOT[1])
 * - architecture-v2.md §8 line 682 — flow Haiku `{ domains: [...], confidence: 0.92 }`
 * - architecture-v2.md §7.4 — optimização token economy
 * - architecture-v2.md §6.1 lines 392-427 — `AgentRun.intents` (consumido por Story 1.5)
 */

/**
 * Descrições PT-PT de cada domínio funcional. Apresentadas ao Haiku no system
 * prompt para que saiba mapear prompts → domains correctos. 1-line cada.
 */
const DOMAIN_DESCRIPTIONS: Record<ToolDomain, string> = {
  tasks: 'criar/completar/listar tarefas, projectos, deadlines',
  finance: 'registar despesas, receitas, cartões, balanços, categorias',
  habits: 'hábitos diários, metas pessoais, lembretes recorrentes',
  journal: 'diário pessoal, brain dumps, reflexões',
  knowledge: 'notas, áreas de conhecimento, pesquisa, segunda mente',
  calendar: 'eventos, reuniões, agenda, marcações',
  gmail: 'emails recebidos, drafts, arquivar, responder',
  telegram: 'enviar mensagem Telegram, notificações',
  receipt: 'processar recibos/faturas (foto), extrair dados',
  meta: 'consultas cross-domain ("o que tenho hoje?", "balanço deste mês")',
};

/**
 * Few-shot examples PT-PT que ensinam o Haiku o output desejado.
 *
 * Cobertura obrigatória:
 * - [0] Single-intent claro (tasks)
 * - [1] **Multi-intent (Epic 1 AC1 benchmark — AC6 Story 1.4)** — PRD §10 line 424
 * - [2] **Low-confidence ambíguo (AC7) — Story 1.6 trigger preview** (< 0.7)
 * - [3] **Empty intents (AC8)** — prompt sem domínio relevante
 * - [4] Meta cross-domain (consulta agregada)
 * - [5] **PT-BR + typo (SF-1 do PO Pax)** — normalização: aceita PT-BR "deletar" +
 *       typo "antigua" e classifica para `tasks` em PT-PT canonical
 * - [6] Natural lembrete (variante PT-PT idiomática)
 *
 * @dev pode iterar valores de confidence empiricamente (Story 1.10 — regression
 * suite manual de 50 prompts). Os valores aqui são o **alvo de calibração**.
 */
const FEW_SHOT_EXAMPLES: ReadonlyArray<{
  prompt: string;
  output: { intents: ToolDomain[]; confidence: Partial<Record<ToolDomain, number>> };
}> = [
  {
    prompt: 'criar tarefa: enviar relatório mensal',
    output: { intents: ['tasks'], confidence: { tasks: 0.98 } },
  },
  {
    // AC6 Epic 1 AC1 benchmark — multi-intent obrigatório
    prompt: 'amanhã reunião 15h com cliente, paguei €78,70 supermercado',
    output: {
      intents: ['calendar', 'finance'],
      confidence: { calendar: 0.95, finance: 0.93 },
    },
  },
  {
    // AC7 — low-confidence ambíguo (Story 1.6 dispara preview com < 0.7)
    prompt: 'reunião amanhã ou na quarta?',
    output: { intents: ['calendar'], confidence: { calendar: 0.55 } },
  },
  {
    // AC8 — empty intents
    prompt: 'o céu é azul hoje',
    output: { intents: [], confidence: {} },
  },
  {
    prompt: 'o que tenho hoje?',
    output: { intents: ['meta'], confidence: { meta: 0.92 } },
  },
  {
    // SF-1 PO Pax — PT-BR ("deletar") + typo ortográfico ("antigua" em vez
    // de "antiga"). Classifier deve aceitar e classificar; vocabulário PT-BR
    // é normalizado pelo prompt (não rejeitado).
    prompt: 'vamos deletar a tarefa antigua',
    output: { intents: ['tasks'], confidence: { tasks: 0.88 } },
  },
  {
    prompt: 'preciso de me lembrar de comprar pão',
    output: { intents: ['tasks'], confidence: { tasks: 0.85 } },
  },
];

/**
 * Regras de output formatadas como string. Reutilizado em error messages do
 * wrapper (`classifier.ts`) para apresentar contexto ao @dev/Eurico em debug.
 */
export const CLASSIFIER_OUTPUT_FORMAT_RULES = `Output: APENAS JSON válido, sem markdown, sem prosa. Formato:
{"intents":["dominio_1","dominio_2"],"confidence":{"dominio_1":0.92,"dominio_2":0.85}}

Regras:
- intents só contém domínios da lista acima (lowercase, snake_case)
- confidence ∈ [0, 1] por domínio mencionado em intents
- multi-domínio: incluir todos relevantes (1+ intents)
- ambíguo: confidence < 0.7 (vai disparar preview de confirmação)
- nada relevante: intents vazio []` as const;

/**
 * Constrói o system prompt PT-PT few-shot para o classifier Haiku.
 *
 * @param availableDomains - Subset de domains a apresentar ao Haiku como
 *   válidos. Defaults para todos os 10 da `ToolDomain` enum. Útil para
 *   "disable certain domains" via config futura.
 *
 * **SF-2 PO Pax — Comportamento com `availableDomains` subset:**
 *
 * Quando `availableDomains` é subset (e.g., `['tasks']`), o builder:
 * 1. Lista APENAS os domains do subset na secção "Domínios disponíveis"
 * 2. Mantém TODOS os {@link FEW_SHOT_EXAMPLES} (mesmo os que referenciam
 *    domains fora do subset). Razão: few-shot examples ensinam o Haiku o
 *    formato de output e capacidade multi-intent — restringi-los iria
 *    degradar a calibração para os domains que ainda estão activos.
 * 3. A regra "intents só contém domínios da lista acima" no prompt instrui
 *    o Haiku a respeitar o subset apresentado, mesmo que os exemplos
 *    mostrem outros domains.
 * 4. O wrapper {@link `lib/agent/classifier.ts`.classifyPrompt} faz validação
 *    fail-loud adicional: rejeita output com `intents` fora de `availableDomains`.
 *
 * Trade-off: prompt ligeiramente maior em tokens (few-shot examples preservados),
 * mas calibração estável e wrapper validação garantem semântica correcta.
 *
 * @returns system prompt completo PT-PT pronto para `client.messages.create({ system })`
 */
export function buildClassifierSystemPrompt(
  availableDomains: readonly ToolDomain[] = Object.keys(DOMAIN_DESCRIPTIONS) as ToolDomain[]
): string {
  const domainsSection = availableDomains
    .map((d) => `- ${d}: ${DOMAIN_DESCRIPTIONS[d]}`)
    .join('\n');

  const fewShotSection = FEW_SHOT_EXAMPLES.map(
    (ex) =>
      `Prompt: ${JSON.stringify(ex.prompt)}\nOutput: ${JSON.stringify(ex.output)}`
  ).join('\n\n');

  return `És o classifier do Nexus, assistente pessoal de IA do Eurico.

A tua função é analisar o prompt do utilizador (em português europeu) e
identificar QUE DOMÍNIOS funcionais devem actuar para responder.

Domínios disponíveis:
${domainsSection}

${CLASSIFIER_OUTPUT_FORMAT_RULES}

Exemplos:

${fewShotSection}

Agora classifica o prompt do utilizador.`;
}
