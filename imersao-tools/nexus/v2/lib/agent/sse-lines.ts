/**
 * Nexus v2 — SSE line framing partilhado (Story 8.4 — ADR-10 S4, D-8.4-SSE-LINES)
 *
 * `iterateSseData` extraída de `inference-transport.ts:137-177` (caminho
 * Anthropic, Story 1.11) para um módulo partilhado, sem qualquer mudança de
 * comportamento (refactor DRY zero-comportamento — ADR-10 §3.3 "Nota DRY de
 * baixo risco"). É reutilizada por:
 *   - `lib/agent/inference-transport.ts` (transport Anthropic, importa daqui)
 *   - `lib/agent/providers/openai-inference-transport.ts` (transport OpenAI, 8.4)
 *
 * O framing de linhas `data: …\n\n` (e o ignorar de `[DONE]`) é **idêntico**
 * para os dois wire formats — só o JSON por-evento difere (o discriminador é
 * o conteúdo do JSON, não o framing). Logo a função é puro framing, sem
 * semântica de provider, e é seguro partilhá-la (ADR-10 §3.3).
 *
 * Edge-safety (ADR-1): apenas `ReadableStream` + `TextDecoder` (Web standard) —
 * sem APIs Node-only. Importável de módulos `'use client'` e Edge.
 *
 * Constitution:
 * - Article IV (No Invention): comportamento byte-a-byte idêntico ao original.
 * - Article VI (Absolute Imports): sem imports relativos.
 */

/**
 * Itera as linhas SSE de um `ReadableStream` (`data: <json>\n\n`), devolvendo
 * cada bloco de dados JSON parseado.
 *
 * O proxy faz pass-through do wire SSE do provider tal-qual. Aqui só precisamos
 * das linhas `data:` — o conteúdo interno do JSON discrimina o evento (Anthropic
 * inclui `"type"` no payload; OpenAI usa `choices[0].delta`).
 *
 * AsyncGenerator para integração natural com o `for await` dos transports.
 */
export async function* iterateSseData(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const dataLine = block
          .split('\n')
          .find((l) => l.startsWith('data:'));
        if (!dataLine) continue;
        const raw = dataLine.slice('data:'.length).trim();
        if (raw.length === 0 || raw === '[DONE]') continue;
        yield JSON.parse(raw);
      }
    }
    // CR Iter 2 #4: flush final do `TextDecoder` (sem `{ stream: true }`) — emite
    // quaisquer bytes multibyte UTF-8 que tenham ficado pendentes na fronteira do
    // último chunk do stream. Para streams terminados em ASCII (`\n\n`/`[DONE]`)
    // devolve `''` → zero mudança de comportamento (correcção de robustez
    // simétrica, partilhada com o caminho Anthropic — não divergente).
    buffer += decoder.decode();
    // Flush do bloco final sem `\n\n` terminador.
    if (buffer.trim().length > 0) {
      const dataLine = buffer.split('\n').find((l) => l.startsWith('data:'));
      if (dataLine) {
        const raw = dataLine.slice('data:'.length).trim();
        if (raw.length > 0 && raw !== '[DONE]') {
          yield JSON.parse(raw);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // releaseLock pode lançar se o reader já está fechado — silencia.
    }
  }
}
