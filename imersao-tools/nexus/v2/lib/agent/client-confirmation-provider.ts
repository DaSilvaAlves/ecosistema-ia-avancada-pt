import type { ConfirmationProvider } from '@/lib/agent/executor';

/**
 * Nexus v2 — ClientConfirmationProvider in-process (Story 1.11 — ADR-9, A3)
 *
 * Implementação client-side do `ConfirmationProvider` (interface da Story 1.6,
 * `executor.ts`). Substitui o `KvConfirmationProvider` (cross-process KV) no
 * caminho client-side do ADR-9.
 *
 * Porquê (ADR-9 simplifica ADR-7): o `KvConfirmationProvider` existia porque o
 * `POST /api/agent/prompt` (Edge A) e o `POST /api/agent/confirm` (Edge B)
 * podiam correr em instâncias Edge distintas — uma Promise in-process nunca
 * resolveria entre processos. Com o `runAgent` a correr no **browser** (ADR-9),
 * o gate de preview e a UI vivem no mesmo processo: uma Promise in-process
 * resolve directamente quando o utilizador clica Confirmar/Cancelar.
 *
 * Mecanismo:
 *   1. O executor (no browser) invoca `requestConfirmation(runId, toolName)` —
 *      cria uma Promise pendente e guarda o seu `resolve` num mapa indexado por
 *      `runId:toolName`.
 *   2. A UI (ToolCard, Story 1.6) recebe o evento SSE `preview_request` e mostra
 *      o diálogo de confirmação.
 *   3. Ao clicar, a UI chama `resolve(runId, toolName, 'confirm' | 'cancel')` —
 *      a Promise pendente resolve e o executor prossegue/cancela.
 *
 * Single-user (C1) + chave `runId:toolName`: várias tools com gate no mesmo run
 * resolvem independentemente. `toolUseProcessed` no executor garante que cada
 * `preview_request` é único por `(runId, toolName)`; se o mesmo par for
 * solicitado duas vezes (raro), a segunda Promise substitui a primeira pendente
 * (a primeira é rejeitada para não ficar pendurada — ver `request`).
 *
 * Trace canónico:
 * - architecture-v2.md ADR-9 — confirmação in-process (substitui ADR-7 no client)
 * - executor.ts `ConfirmationProvider` (interface Story 1.6)
 * - Story 1.6 AC3 — gate de preview aguarda confirmação humana
 *
 * Constitution:
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...`
 */

type ConfirmAction = 'confirm' | 'cancel';

interface PendingEntry {
  resolve: (action: ConfirmAction) => void;
  reject: (reason: Error) => void;
}

/**
 * Constrói a chave de indexação interna para um par `(runId, toolName)`.
 * Mesma convenção semântica do `kvConfirmKey` (sem o prefixo de namespace KV,
 * que aqui é irrelevante — o mapa é in-memory por instância).
 */
function pendingKey(runId: string, toolName: string): string {
  return `${runId}:${toolName}`;
}

export class ClientConfirmationProvider implements ConfirmationProvider {
  private readonly pending = new Map<string, PendingEntry>();

  /**
   * Implementação da interface `ConfirmationProvider` — invocada pelo executor
   * quando o gate de preview activa. Devolve uma Promise que resolve quando a
   * UI chama `resolve(runId, toolName, action)`.
   *
   * Se já existir uma Promise pendente para o mesmo `(runId, toolName)` (caso
   * raro de re-solicitação), a anterior é rejeitada para não ficar pendurada
   * indefinidamente, e a nova substitui-a.
   */
  requestConfirmation(
    runId: string,
    toolName: string
  ): Promise<ConfirmAction> {
    const key = pendingKey(runId, toolName);
    const existing = this.pending.get(key);
    if (existing) {
      existing.reject(
        new Error(
          'ClientConfirmationProvider: pedido de confirmação substituído por novo pedido para a mesma tool'
        )
      );
    }
    return new Promise<ConfirmAction>((resolve, reject) => {
      this.pending.set(key, { resolve, reject });
    });
  }

  /**
   * Resolve um pedido de confirmação pendente (chamado pela UI ao clicar
   * Confirmar/Cancelar). Devolve `true` se havia um pedido pendente para
   * resolver, `false` caso contrário (clique tardio / pedido já resolvido).
   */
  resolve(runId: string, toolName: string, action: ConfirmAction): boolean {
    const key = pendingKey(runId, toolName);
    const entry = this.pending.get(key);
    if (!entry) return false;
    this.pending.delete(key);
    entry.resolve(action);
    return true;
  }

  /**
   * Cancela TODOS os pedidos pendentes (e.g., ao reset/unmount do chat). Resolve
   * cada um como `'cancel'` (safe default — não executar a tool). Evita Promises
   * penduradas que bloqueariam o executor indefinidamente.
   */
  cancelAll(): void {
    for (const entry of this.pending.values()) {
      entry.resolve('cancel');
    }
    this.pending.clear();
  }

  /** Número de pedidos pendentes — útil para testes e observability. */
  get pendingCount(): number {
    return this.pending.size;
  }
}
