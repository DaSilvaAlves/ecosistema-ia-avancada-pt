'use client';

import { UNDO_TTL_SECONDS } from '@/lib/agent/undo';
import type { UndoStore } from '@/lib/agent/executor';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { ToolCall } from '@/lib/agent/schemas';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — ClientUndoStore (Story 1.12 — ADR-9, A4, Phase 2 da 1.11)
 *
 * Implementação client-side do `UndoStore` (`executor.ts:45-51`) que a Phase 1
 * deixou como follow-up. O executor já chama `opts.undoStore.register(runId,
 * reversibleToolCalls)` (`executor.ts:752-756`) e emite `undo_registered` quando
 * um store está presente — na Phase 1 o `runClientAgent` OMITIA o store (undo
 * desactivado em produção). Esta story injecta este store (memória + timer 30s)
 * em `runClientAgent`, devolvendo o undo ao utilizador.
 *
 * Como funciona (espelha `app/api/agent/undo/route.ts`, mas no browser com Dexie
 * real em vez de KV server-side):
 *   - `register(runId, toolCalls)`: guarda as `reversibleToolCalls` em memória +
 *     arma um timer de `UNDO_TTL_SECONDS` (30s) que expira a entrada.
 *   - `undo(runId)`: reverte TODAS as tool calls em ORDEM REVERSA chamando
 *     `tool.reverse(args, result, ctx)` (o mesmo mecanismo do endpoint —
 *     `tasks.ts:223` `criar_tarefa.reverse` → `ctx.db.tasks.delete(result.id)`),
 *     com um `ExecutionContext` cujo `db` é o Dexie real (`@/lib/db/client`).
 *     At-most-once: consome a entrada ANTES do reverse loop.
 *
 * Singleton: a MESMA instância é injectada no executor (`runClientAgent`) que
 * regista, e importada pelo `UndoToast.tsx` que reverte — partilham o estado em
 * memória do browser. (single-user, single-tab; perda de undo ao fechar a tab
 * <30s é aceite — registado na 1.11 A4.)
 *
 * Edge-safety (ADR-1): `'use client'` — importa Dexie (`@/lib/db/client`); NUNCA
 * importado em código `runtime='edge'`. Sem `@vercel/kv`. NFR11: logs só com
 * `runId`/`toolName`, nunca prompt cru.
 *
 * Trace canónico:
 * - architecture-v2.md ADR-9 — undo client-side in-memory + timer 30s
 * - executor.ts `UndoStore` (:45-51), `register` chamado (:752-756)
 * - app/api/agent/undo/route.ts — reverse loop de referência (ordem reversa)
 */

/** Resultado de uma operação de undo client-side. Espelha o shape relevante do endpoint. */
export interface ClientUndoResult {
  /** `reverted` se a janela estava activa; `expired` se já não existe entrada. */
  status: 'reverted' | 'expired';
  /** Nº de tool calls processadas (best-effort — inclui as que falharam o reverse). */
  reverted: number;
  /** Erros por tool (best-effort — uma falha não bloqueia as restantes). */
  errors: Array<{ toolName: string; message: string }>;
}

interface UndoRegistryEntry {
  toolCalls: ToolCall[];
  /** Handle do timer de expiração (30s). */
  timer: ReturnType<typeof setTimeout>;
}

const undoLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[client-undo] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[client-undo] ${msg}`, meta ?? '');
  },
};

/**
 * Stub de `VercelKV` — as tools do caminho client NÃO tocam `ctx.kv` (ADR-9).
 * Falha-loud se invocado, em vez de um `null.get` silencioso.
 */
const noKvStub: VercelKV = {
  get: async () => {
    throw new Error('ClientUndoStore: ctx.kv não disponível no browser (ADR-9)');
  },
  set: async () => {
    throw new Error('ClientUndoStore: ctx.kv não disponível no browser (ADR-9)');
  },
  del: async () => {
    throw new Error('ClientUndoStore: ctx.kv não disponível no browser (ADR-9)');
  },
};

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Store de undo client-side. Implementa `UndoStore` (para ser injectável no
 * executor) e expõe `undo(runId)` para o `UndoToast` reverter.
 */
export class ClientUndoStore implements UndoStore {
  private readonly entries = new Map<string, UndoRegistryEntry>();

  /**
   * Constrói o `ExecutionContext` do reverse loop com o Dexie REAL do browser.
   * Mesma forma que o executor client (`buildExecutionContext`) mas com `kv`
   * stub (client não usa KV).
   */
  private buildReverseContext(runId: string): ExecutionContext {
    return {
      userId: 'eurico',
      db,
      kv: noKvStub,
      fetch: globalThis.fetch,
      logger: undoLogger,
      runId,
    };
  }

  /**
   * Regista as tool calls reversíveis de um run + arma o timer de 30s. Chamado
   * pelo executor (`executor.ts:756`). Best-effort: nunca lança (não deve
   * bloquear o `done` do run).
   */
  async register(runId: string, reversibleToolCalls: ToolCall[]): Promise<void> {
    // Substitui qualquer entrada anterior do mesmo runId (limpa o timer velho).
    this.cancel(runId);
    const timer = setTimeout(() => {
      this.entries.delete(runId);
    }, UNDO_TTL_SECONDS * 1000);
    this.entries.set(runId, { toolCalls: reversibleToolCalls, timer });
  }

  /** `true` se há uma janela de undo activa para o run. */
  has(runId: string): boolean {
    return this.entries.has(runId);
  }

  /**
   * Reverte todas as tool calls do run em ordem reversa. At-most-once: consome a
   * entrada ANTES do reverse loop (um 2º `undo` cai em `expired`). Best-effort:
   * uma `tool.reverse()` que falhe acumula em `errors[]` e o loop continua.
   */
  async undo(runId: string): Promise<ClientUndoResult> {
    const entry = this.entries.get(runId);
    if (entry === undefined) {
      return { status: 'expired', reverted: 0, errors: [] };
    }
    // Consume-before-reverse (at-most-once) — espelha o endpoint (route.ts:218).
    this.cancel(runId);

    const errors: ClientUndoResult['errors'] = [];
    const ctx = this.buildReverseContext(runId);

    for (let i = entry.toolCalls.length - 1; i >= 0; i--) {
      const toolCall = entry.toolCalls[i];
      const tool = toolRegistry.get(toolCall.toolName);
      if (!tool) {
        undoLogger.error('tool não registada durante undo', {
          runId,
          toolName: toolCall.toolName,
        });
        errors.push({
          toolName: toolCall.toolName,
          message: 'Tool não registada — não pode ser revertida',
        });
        continue;
      }
      if (tool.reverse === undefined) {
        undoLogger.error('tool reverse em falta — invariant violation', {
          runId,
          toolName: toolCall.toolName,
        });
        errors.push({
          toolName: toolCall.toolName,
          message: 'Tool reverse() não definido — invariant violation',
        });
        continue;
      }
      try {
        await tool.reverse(toolCall.args, toolCall.result, ctx);
      } catch (e) {
        errors.push({ toolName: toolCall.toolName, message: errorMessage(e) });
      }
    }

    return { status: 'reverted', reverted: entry.toolCalls.length, errors };
  }

  /** Cancela a janela de undo de um run (limpa o timer + a entrada). */
  cancel(runId: string): void {
    const existing = this.entries.get(runId);
    if (existing) {
      clearTimeout(existing.timer);
      this.entries.delete(runId);
    }
  }

  /** Limpa todas as entradas (utilitário de testes). */
  clear(): void {
    for (const entry of this.entries.values()) {
      clearTimeout(entry.timer);
    }
    this.entries.clear();
  }
}

/**
 * Singleton partilhado entre o executor (que regista) e o `UndoToast` (que
 * reverte). Uma só instância por browser/tab.
 */
export const clientUndoStore = new ClientUndoStore();
