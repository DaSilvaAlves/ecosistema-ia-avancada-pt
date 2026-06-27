import { describe, it, expect } from 'vitest';
import { iterateSseData } from '@/lib/agent/sse-lines';

/**
 * Nexus v2 — sse-lines unit tests (Story 8.4 — ADR-10 S4, D-8.4-SSE-LINES)
 *
 * `iterateSseData` foi extraída de `inference-transport.ts:137-177` para um
 * módulo partilhado (refactor zero-comportamento). Estes testes trancam o
 * framing puro `data: …\n\n`, independente do provider: `[DONE]` ignorado,
 * flush do bloco final sem `\n\n`, blocos vazios/sem `data:` ignorados.
 *
 * A não-regressão do caminho Anthropic é coberta pela suite existente
 * (`inference-transport.test.ts` + `client-executor.test.ts` — verdes após o
 * refactor); estes testes provam o framing isolado para os DOIS wire formats.
 */

function streamFrom(raw: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(raw));
      c.close();
    },
  });
}

/** Stream que emite os pedaços em chunks separados (simula fragmentação de rede). */
function streamFromChunks(pieces: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of pieces) c.enqueue(enc.encode(p));
      c.close();
    },
  });
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const evt of iterateSseData(stream)) out.push(evt);
  return out;
}

describe('iterateSseData (AC2)', () => {
  it('parseia múltiplos blocos data: separados por \\n\\n', async () => {
    const raw =
      'data: {"a":1}\n\n' + 'data: {"b":2}\n\n' + 'data: {"c":3}\n\n';
    const out = await drain(streamFrom(raw));
    expect(out).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('ignora o terminador [DONE]', async () => {
    const raw = 'data: {"a":1}\n\n' + 'data: [DONE]\n\n';
    const out = await drain(streamFrom(raw));
    expect(out).toEqual([{ a: 1 }]);
  });

  it('faz flush do bloco final sem \\n\\n terminador', async () => {
    // Último bloco não termina com \n\n — tem de ser parseado no flush final.
    const raw = 'data: {"a":1}\n\n' + 'data: {"final":true}';
    const out = await drain(streamFrom(raw));
    expect(out).toEqual([{ a: 1 }, { final: true }]);
  });

  it('ignora blocos vazios e linhas sem prefixo data:', async () => {
    const raw =
      'data: {"a":1}\n\n' +
      '\n\n' + // bloco vazio
      'event: ping\n\n' + // sem linha data:
      'data: {"b":2}\n\n';
    const out = await drain(streamFrom(raw));
    expect(out).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('reagrega um bloco data: partido entre chunks de rede', async () => {
    // O JSON `{"frag":"abc"}` chega partido a meio entre dois chunks.
    const out = await drain(
      streamFromChunks(['data: {"frag":"a', 'bc"}\n\n', 'data: [DONE]\n\n'])
    );
    expect(out).toEqual([{ frag: 'abc' }]);
  });

  it('ignora [DONE] também no flush final (sem \\n\\n)', async () => {
    const raw = 'data: {"a":1}\n\n' + 'data: [DONE]';
    const out = await drain(streamFrom(raw));
    expect(out).toEqual([{ a: 1 }]);
  });
});
