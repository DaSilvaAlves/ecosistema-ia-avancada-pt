'use client';

import { runAgent, type ExecutorSSEEvent } from '@/lib/agent/executor';
import { InferenceTransport } from '@/lib/agent/inference-transport';
import { OpenAIInferenceTransport } from '@/lib/agent/providers/openai-inference-transport';
import type {
  ClassifierProvider,
  ExecutorProvider,
} from '@/lib/agent/providers/types';
import type { ClientConfirmationProvider } from '@/lib/agent/client-confirmation-provider';
import { clientUndoStore } from '@/lib/agent/client-undo-store';
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
 * Story 1.12 (Phase 2, ADR-9 A4): undo REACTIVADO — injecta-se o singleton
 * `clientUndoStore` (memória + timer 30s, reverte mutações Dexie). O executor
 * volta a emitir `undo_registered` quando há tool calls reversíveis, e o
 * `UndoToast` reverte via `clientUndoStore.undo(runId)`. (Na Phase 1 o
 * `undoStore` era omitido → undo desactivado em produção.)
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
 *   mock que espelha o wire SSE do provider). Quando OMITIDO, o transport é
 *   seleccionado por `NEXT_PUBLIC_LLM_PROVIDER` (Story 8.4, ADR-10 §3.4,
 *   D-8.4-CLIENT-SELECT): `'openai'` → `OpenAIInferenceTransport`; `'anthropic'`
 *   (default) → `InferenceTransport`. O argumento explícito tem PRIORIDADE TOTAL
 *   sobre a selecção automática — testes que injectam um mock não mudam.
 * @returns AsyncGenerator de `ExecutorSSEEvent` até `done`.
 */
export async function* runClientAgent(
  prompt: string,
  confirmationProvider?: ClientConfirmationProvider,
  transport?: ClassifierProvider & ExecutorProvider
): AsyncGenerator<ExecutorSSEEvent> {
  // Selecção por flag PÚBLICA (inlined pelo Next.js em build-time — a selecção é
  // determinística por build/deployment, não por request). Só quando o argumento
  // `transport` não é fornecido (prioridade total ao override).
  const resolvedTransport =
    transport ??
    ((process.env.NEXT_PUBLIC_LLM_PROVIDER ?? 'anthropic') === 'openai'
      ? new OpenAIInferenceTransport()
      : new InferenceTransport());
  yield* runAgent(prompt, {
    db,
    executor: resolvedTransport,
    classifier: resolvedTransport,
    ...(confirmationProvider ? { confirmationProvider } : {}),
    // Story 1.12 (Phase 2, ADR-9 A4): store de undo client-side real (memória +
    // timer 30s). O executor volta a emitir `undo_registered` e o `UndoToast`
    // reverte via `clientUndoStore.undo(runId)`.
    undoStore: clientUndoStore,
  });
}
