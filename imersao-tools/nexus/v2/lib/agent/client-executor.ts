'use client';

import { runAgent, type ExecutorSSEEvent } from '@/lib/agent/executor';
import { InferenceTransport } from '@/lib/agent/inference-transport';
import type { ClientConfirmationProvider } from '@/lib/agent/client-confirmation-provider';
import { db } from '@/lib/db/client';
// Story 1.11 (ADR-9, A1) — side-effect import que regista as tools do Epic 2/3
// no `toolRegistry` singleton. Antes da Story 1.11 este registo vivia no Route
// Edge `/api/agent/prompt`; ADR-9 move o `runAgent` para o cliente, logo o
// registo TEM de correr no bundle client antes de qualquer `runAgent`. Os
// módulos de tools são Edge/browser-safe (apenas `import type` de Dexie + uso
// de `ctx.db` injectado) — ver `lib/agent/tools/tasks.ts` cabeçalho.
import '@/lib/agent/tools';

/**
 * Nexus v2 — Client Executor (Story 1.11 — ADR-9, A1+A2+A3)
 *
 * Módulo `'use client'` que conduz o `runAgent` no **browser** com:
 *   - `db` = singleton Dexie real (`@/lib/db/client`) → `ctx.db.*` funciona
 *   - `executor`/`classifier` = `InferenceTransport` (proxy) → key server-only
 *   - `confirmationProvider` = `ClientConfirmationProvider` in-process
 *
 * Resolve o bug de produção (ADR-9): "anota a tarefa de comprar pão" deixava de
 * falhar com `Cannot read properties of null (reading 'tasks')` porque
 * `ctx.db` passa a ser o Dexie real, e as 12 tools (inalteradas) escrevem/leem
 * directamente.
 *
 * O `runAgent` é um AsyncGenerator de `ExecutorSSEEvent` — o `useAgentStream`
 * (Story 1.11, T5) consome estes eventos directamente, sem `fetch` ao
 * `/api/agent/prompt`. A persistência de chat-log (agent_runs/chat_messages)
 * mantém-se no hook.
 *
 * Edge-safety (ADR-1): este módulo é `'use client'` — NUNCA importado em código
 * `runtime='edge'`. O único ponto Edge do cérebro continua a ser o
 * `/api/anthropic/proxy` (sem Dexie). O transport (T2) fala com esse proxy.
 *
 * Phase 1 (esta story): undo desactivado (no `undoStore` injectado) — Phase 2
 * (A4) implementa o store client-side real (memória + timer 30s).
 *
 * Trace canónico:
 * - architecture-v2.md ADR-9 — executor client-side + ctx.db Dexie real
 * - executor.ts `runAgent`/`RunAgentOpts` (injecção db/executor/classifier)
 * - lib/agent/inference-transport.ts (A2) — transport por proxy
 * - lib/agent/client-confirmation-provider.ts (A3) — confirmação in-process
 *
 * Constitution:
 * - Article VI (Absolute Imports): apenas `@/...`
 */

/**
 * Conduz uma run do cérebro no browser, emitindo os mesmos `ExecutorSSEEvent`
 * que o `/api/agent/prompt` emitia. AsyncGenerator para consumo natural por
 * `for await` no `useAgentStream`.
 *
 * @param prompt - Prompt PT-PT do utilizador (já trimmed pelo caller).
 * @param confirmationProvider - Provider in-process partilhado com a UI; a UI
 *   resolve os pedidos de preview gate. Quando omitido, o gate auto-confirma
 *   (comportamento Story 1.5 — útil em testes que não exercitam o gate).
 * @param transport - Override do transport de inferência (testes injectam um
 *   mock que espelha o wire SSE da Anthropic). Default: `InferenceTransport`.
 * @returns AsyncGenerator de `ExecutorSSEEvent` até `done`.
 */
export async function* runClientAgent(
  prompt: string,
  confirmationProvider?: ClientConfirmationProvider,
  transport: InferenceTransport = new InferenceTransport()
): AsyncGenerator<ExecutorSSEEvent> {
  yield* runAgent(prompt, {
    db,
    executor: transport,
    classifier: transport,
    ...(confirmationProvider ? { confirmationProvider } : {}),
    // Phase 1 (ADR-9 faseamento): undoStore omitido → undo desactivado.
    // Phase 2 (A4) injecta o store client-side real (memória + timer 30s).
  });
}
