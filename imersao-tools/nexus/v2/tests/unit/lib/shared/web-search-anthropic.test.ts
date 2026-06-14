import { describe, it, expect } from 'vitest';
import { parseAnthropicWebSearch } from '@/lib/shared/web-search-anthropic';

/**
 * Nexus v2 — parseAnthropicWebSearch tests (Story 5.11 — AC2, AC6)
 *
 * Os fixtures reflectem o shape REAL da resposta da Anthropic web search tool
 * `web_search_20250305` (mock-protocol-fidelity.md, @architect V5):
 *   - Sucesso: bloco `web_search_tool_result` com `content[]` de
 *     `web_search_result` (`url`/`title`/`page_age`/`encrypted_content` — SEM
 *     `excerpt`). O excerto vem das `citations[].cited_text` nos blocos `text`.
 *   - Erro: `web_search_tool_result` com `content.type ===
 *     'web_search_tool_result_error'` — devolvido como HTTP 200 (M4 da 4.9).
 *
 * Os testes FALHARIAM se o shape divergisse: o de sucesso lê
 * `content[].type === 'web_search_tool_result'` e dentro
 * `type === 'web_search_result'`; o de erro lê
 * `type === 'web_search_tool_result_error'`.
 */

// Fixture de SUCESSO — shape real com citações para o excerto.
const ANTHROPIC_SUCCESS = {
  id: 'msg_01abc',
  type: 'message',
  role: 'assistant',
  model: 'claude-sonnet-4-6',
  content: [
    { type: 'text', text: 'Encontrei os seguintes resultados sobre Artemis 2.' },
    {
      type: 'server_tool_use',
      id: 'srvtoolu_01',
      name: 'web_search',
      input: { query: 'Artemis 2' },
    },
    {
      type: 'web_search_tool_result',
      tool_use_id: 'srvtoolu_01',
      content: [
        {
          type: 'web_search_result',
          url: 'https://pt.wikipedia.org/wiki/Artemis_2',
          title: 'Artemis 2 — Wikipédia',
          page_age: '2 weeks ago',
          encrypted_content: 'AbCdEf123==',
        },
        {
          type: 'web_search_result',
          url: 'https://www.nasa.gov/artemis-ii/',
          title: 'NASA Artemis II',
          page_age: null,
          encrypted_content: 'GhIjKl456==',
        },
      ],
    },
    {
      type: 'text',
      text: 'A Artemis 2 é a primeira missão tripulada do programa.',
      citations: [
        {
          type: 'web_search_result_location',
          url: 'https://pt.wikipedia.org/wiki/Artemis_2',
          title: 'Artemis 2 — Wikipédia',
          cited_text: 'A Artemis 2 levará quatro astronautas à órbita lunar.',
          encrypted_index: 'idx1',
        },
      ],
    },
  ],
  stop_reason: 'end_turn',
};

// Fixture de ERRO — HTTP 200, mas erro no body (ponto cego M4 da 4.9).
const ANTHROPIC_ERROR = {
  id: 'msg_01err',
  type: 'message',
  role: 'assistant',
  content: [
    { type: 'text', text: 'Vou pesquisar.' },
    {
      type: 'web_search_tool_result',
      tool_use_id: 'srvtoolu_02',
      content: {
        type: 'web_search_tool_result_error',
        error_code: 'max_uses_exceeded',
      },
    },
  ],
  stop_reason: 'end_turn',
};

// Fixture sem qualquer pesquisa (Claude respondeu sem usar a tool).
const ANTHROPIC_NO_SEARCH = {
  id: 'msg_01ns',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'Não tenho informação sobre isso.' }],
  stop_reason: 'end_turn',
};

describe('parseAnthropicWebSearch (Story 5.11 / AC2, AC6)', () => {
  it('sucesso → ok com resultados; excerto vem de citations[].cited_text', () => {
    const outcome = parseAnthropicWebSearch(ANTHROPIC_SUCCESS);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') throw new Error('esperado ok');

    expect(outcome.results).toHaveLength(2);
    expect(outcome.results[0]).toEqual({
      title: 'Artemis 2 — Wikipédia',
      url: 'https://pt.wikipedia.org/wiki/Artemis_2',
      excerpt: 'A Artemis 2 levará quatro astronautas à órbita lunar.',
    });
    // Segundo resultado sem citação → excerto vazio (não inventa).
    expect(outcome.results[1]!.url).toBe('https://www.nasa.gov/artemis-ii/');
    expect(outcome.results[1]!.excerpt).toBe('');
  });

  // TESTE OBRIGATÓRIO (eixo c, gate de saída): um `web_search_tool_result_error`
  // (HTTP 200) tem de produzir `error` para o endpoint cair em fallback DDG.
  // Falharia se o parser ignorasse o erro-no-body (ponto cego M4 da 4.9).
  it('erro-no-body (web_search_tool_result_error, HTTP 200) → error tool-error', () => {
    const outcome = parseAnthropicWebSearch(ANTHROPIC_ERROR);
    expect(outcome.kind).toBe('error');
    if (outcome.kind !== 'error') throw new Error('esperado error');
    expect(outcome.reason).toBe('tool-error');
    expect(outcome.errorCode).toBe('max_uses_exceeded');
  });

  it('sem resultados de pesquisa (Claude não pesquisou) → error no-results', () => {
    const outcome = parseAnthropicWebSearch(ANTHROPIC_NO_SEARCH);
    expect(outcome.kind).toBe('error');
    if (outcome.kind !== 'error') throw new Error('esperado error');
    expect(outcome.reason).toBe('no-results');
  });

  it('body malformado (sem content array) → error malformed', () => {
    // Todos os inputs malformados têm de devolver `error` COM `reason: 'malformed'`
    // (não basta `kind === error`) — CR Iter 1 PR #72.
    const malformed = [null, {}, { content: 'x' }, { content: {} }];
    for (const input of malformed) {
      const outcome = parseAnthropicWebSearch(input);
      expect(outcome.kind).toBe('error');
      if (outcome.kind !== 'error') throw new Error('esperado error');
      expect(outcome.reason).toBe('malformed');
    }
  });

  // Fidelidade de shape: se um `web_search_result` perdesse o campo `title` ou
  // `url`, é descartado (não produz resultado meio-vazio).
  it('descarta web_search_result sem url ou sem title', () => {
    const body = {
      content: [
        {
          type: 'web_search_tool_result',
          content: [
            { type: 'web_search_result', url: '', title: 'sem url' },
            { type: 'web_search_result', url: 'https://ok.com', title: '' },
            { type: 'web_search_result', url: 'https://valido.com', title: 'Válido' },
          ],
        },
      ],
    };
    const outcome = parseAnthropicWebSearch(body);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') throw new Error('esperado ok');
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0]!.url).toBe('https://valido.com');
  });
});
