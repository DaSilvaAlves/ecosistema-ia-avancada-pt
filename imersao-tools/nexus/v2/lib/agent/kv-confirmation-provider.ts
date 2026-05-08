import type { ConfirmationProvider } from '@/lib/agent/executor';
import type { Logger, VercelKV } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — KvConfirmationProvider (Story 1.8)
 *
 * Implementação cross-process do `ConfirmationProvider` interface (Story 1.6
 * `executor.ts` L112-114). Resolve o GAP herdado de Story 1.6 e diferido em
 * RESOLVED-3 + ADR-6 da Story 1.7: o `POST /api/agent/prompt` (Edge A, SSE
 * stream) e o `POST /api/agent/confirm` (Edge B, resposta ao clique) podem
 * correr em instâncias Edge distintas no Vercel — uma Promise in-process
 * nunca resolve.
 *
 * Trace canónico:
 * - Story 1.8 AC7 — interface + constantes + polling pattern
 * - Story 1.6 `ConfirmationProvider` interface (executor.ts L112-114)
 * - ADR-7 (Story 1.8) — KV polling com TTL 60s, intervalo 250ms
 * - ADR-6 (Story 1.7) — namespace `nexus:agent:confirm:*` distinto de
 *   `nexus:undo:run:*`; partilha cliente `kv` singleton
 *
 * Mecanismo:
 *   1. Browser recebe evento SSE `preview_request { runId, toolName }`
 *   2. Browser POSTs `/api/agent/confirm { runId, toolName, action }`
 *   3. Endpoint `confirm` escreve KV `nexus:agent:confirm:<runId>:<toolName>`
 *      com `action` e TTL `CONFIRM_TTL_SECONDS`
 *   4. Este provider (a correr no Edge do `prompt`) faz polling KV via
 *      `kvClient.get(key)` a cada `CONFIRM_POLL_INTERVAL_MS`
 *   5. Quando encontra `'confirm'` ou `'cancel'`, apaga a entry (`kvClient.del`)
 *      e retorna o valor
 *   6. Se atingir o deadline (`CONFIRM_TTL_SECONDS`), retorna `'cancel'`
 *      (safe default) — utilizador não confirmou a tempo
 *
 * Edge runtime safe (ADR-1): zero imports Node-only. `VercelKV` é `import type`.
 *
 * Constitution Article IV (No Invention): tudo trace-back a Story 1.6
 * interface + ADR-7 desta story.
 */

/**
 * TTL em segundos da entrada KV de confirmação. 60s é mais que suficiente
 * para o utilizador confirmar/cancelar no diálogo da Story 1.9 (typical
 * human-in-the-loop reaction time é 1-5s).
 *
 * Note: Edge function timeout é 30s no Vercel — se o run usa preview gate,
 * pode haver edge case onde Edge expira antes do utilizador confirmar.
 * Documentado em Story 1.8 Risks. ADR-7 OQ-1 endereça.
 */
export const CONFIRM_TTL_SECONDS = 60;

/**
 * Intervalo de polling em ms. 250ms equilibra latência percebida pelo
 * utilizador (imperceptível abaixo de 300ms para human-in-the-loop) e
 * consumo de KV ops (240 reads/min por confirmação activa — dentro do
 * Upstash free tier de 10k reads/dia para single-user).
 *
 * Override possível em testes via constructor opcional ou via mock — esta
 * constante é o valor canónico de produção.
 */
export const CONFIRM_POLL_INTERVAL_MS = 250;

/**
 * Prefixo do namespace KV. ADR-6 (Story 1.7) garante separação face a
 * `nexus:undo:run:*`. Pattern alinhado com arch §6.5 (`nexus:auth:session:*`,
 * `nexus:google:tokens`, etc.).
 */
export const KV_CONFIRM_NAMESPACE = 'nexus:agent:confirm';

/**
 * Constrói a chave KV canónica para um par `(runId, toolName)`.
 *
 * Usa dois separadores `:` para alinhamento com pattern arch §6.5; o
 * `toolName` é uma string controlada pelo registry (Story 1.3) — não
 * contém caracteres exóticos que requeiram encoding.
 *
 * Exportada (CR Iter 1 fix) para eliminar drift risk: `app/api/agent/confirm`
 * usa esta helper em vez de duplicar o template literal. Single source of
 * truth do formato da chave.
 */
export function kvConfirmKey(runId: string, toolName: string): string {
  return `${KV_CONFIRM_NAMESPACE}:${runId}:${toolName}`;
}

/**
 * Logger inline para o provider. Mesmo pattern do `undoLogger`
 * (`app/api/agent/undo/route.ts` L67-74) — minimal Logger interface com
 * console fallback para Vercel logs. Stories 2-7 podem substituir por
 * Pino/Winston sem alterar este provider.
 */
const kvConfirmLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[kv-confirmation] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[kv-confirmation] ${msg}`, meta ?? '');
  },
};

/**
 * Provider concreto que implementa `ConfirmationProvider` via KV polling.
 *
 * Construtor recebe APENAS `kvClient: VercelKV` — `runId` é argumento do
 * método `requestConfirmation(runId, toolName)`, alinhado com a interface
 * canónica de Story 1.6 (`executor.ts` L112-114). Isto permite construir o
 * provider UMA vez por request HTTP (antes do `for await`) sem precisar
 * aguardar o evento `meta(start)` para conhecer o `runId`.
 *
 * Stateless: cada chamada a `requestConfirmation` é independente. Se o
 * executor invocar duas tools com preview gate no mesmo run, este provider
 * faz polling em duas chaves distintas em paralelo (uma por chamada).
 */
export class KvConfirmationProvider implements ConfirmationProvider {
  constructor(private readonly kvClient: VercelKV) {}

  /**
   * Aguarda confirmação cross-process via KV polling.
   *
   * Loop até `Date.now() >= deadline`:
   *   - `kvClient.get(key)` — se retorna `'confirm' | 'cancel'`, faz cleanup
   *     (`kvClient.del`) e devolve o valor
   *   - se retorna `null`, dorme `CONFIRM_POLL_INTERVAL_MS` e tenta de novo
   *
   * Timeout: `CONFIRM_TTL_SECONDS` * 1000 ms — emite `logger.warn` (info no
   * minimal Logger) e devolve `'cancel'` (safe default — não executar a tool).
   *
   * Cleanup: a entry KV é apagada IMEDIATAMENTE após resolução para evitar
   * que polls subsequentes (em outras tools no mesmo run, raros) apanhem o
   * valor antigo. Falha de `del` é tolerada (best-effort) — o TTL natural
   * limpa em `CONFIRM_TTL_SECONDS`.
   *
   * @param runId - UUID do AgentRun (gerado pelo executor em runAgent L473)
   * @param toolName - Nome canónico da tool no registry (Story 1.3)
   * @returns `'confirm'` ou `'cancel'` (timeout default)
   */
  async requestConfirmation(
    runId: string,
    toolName: string
  ): Promise<'confirm' | 'cancel'> {
    const key = kvConfirmKey(runId, toolName);
    const deadline = Date.now() + CONFIRM_TTL_SECONDS * 1000;

    while (Date.now() < deadline) {
      // CR Iter 1 fix: try/catch defensivo em kvClient.get. Erros transientes
      // de leitura KV (rede, throttling Upstash) NÃO devem escapar — safe
      // default é 'cancel' (não executar a tool). Cleanup best-effort também
      // protegido. TTL natural (CONFIRM_TTL_SECONDS) limpa entradas perdidas.
      let value: string | null;
      try {
        value = await this.kvClient.get<string>(key);
      } catch (e) {
        kvConfirmLogger.error('KV read failed', {
          runId,
          toolName,
          error: e instanceof Error ? e.message : String(e),
        });
        // Best-effort cleanup. NÃO bloqueia retorno em caso de falha.
        try {
          await this.kvClient.del(key);
        } catch {
          // Silencioso: KV down em get → del provavelmente também falha.
          // TTL natural limpa.
        }
        return 'cancel';
      }
      if (value === 'confirm' || value === 'cancel') {
        // Cleanup imediato. Best-effort: falha de del NÃO bloqueia retorno
        // (TTL natural limpa em CONFIRM_TTL_SECONDS).
        try {
          await this.kvClient.del(key);
        } catch (e) {
          kvConfirmLogger.error('cleanup del falhou (best-effort)', {
            runId,
            toolName,
            error: e instanceof Error ? e.message : String(e),
          });
        }
        return value;
      }
      await new Promise<void>((resolve) =>
        setTimeout(resolve, CONFIRM_POLL_INTERVAL_MS)
      );
    }

    // Timeout — utilizador não confirmou a tempo. Safe default: cancelar.
    kvConfirmLogger.error('timeout aguardando confirmação', {
      runId,
      toolName,
      ttlSeconds: CONFIRM_TTL_SECONDS,
    });
    return 'cancel';
  }
}
