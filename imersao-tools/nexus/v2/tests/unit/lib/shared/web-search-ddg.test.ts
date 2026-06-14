import { describe, it, expect } from 'vitest';
import { parseDdgHtml, MAX_EXCERPT_LENGTH } from '@/lib/shared/web-search-ddg';

/**
 * Nexus v2 — parseDdgHtml tests (Story 5.11 — AC1, AC6)
 *
 * Helper PURO de parsing do HTML da versão sem-JS do DuckDuckGo. Os fixtures
 * reflectem o HTML REAL do `html.duckduckgo.com/html/` (mock-protocol-fidelity.md):
 * links de título `<a class="result__a" href="//duckduckgo.com/l/?uddg=…">`
 * (redirect com URL real codificado no parâmetro `uddg`) e snippet
 * `<a class="result__snippet">`. Há ≥1 teste que FALHARIA se o selector mudasse
 * (HTML com a estrutura antiga sem `result__a` → `[]`).
 */

// Fixture: 2 resultados na estrutura real do DDG HTML (links com redirect uddg).
const DDG_HTML_TWO_RESULTS = `
<!DOCTYPE html>
<html><body>
<div class="results">
  <div class="result results_links results_links_deep web-result">
    <div class="links_main">
      <h2 class="result__title">
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fpt.wikipedia.org%2Fwiki%2FArtemis_2&amp;rut=abc">Artemis 2 &amp;ndash; Wikipédia</a>
      </h2>
      <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fpt.wikipedia.org%2Fwiki%2FArtemis_2">A missão <b>Artemis 2</b> levará astronautas à órbita lunar.</a>
      <div class="result__url">pt.wikipedia.org/wiki/Artemis_2</div>
    </div>
  </div>
  <div class="result results_links results_links_deep web-result">
    <div class="links_main">
      <h2 class="result__title">
        <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.nasa.gov%2Fartemis-ii%2F">NASA Artemis II</a>
      </h2>
      <a class="result__snippet" href="x">Overview of the Artemis II crewed mission.</a>
    </div>
  </div>
</div>
</body></html>
`;

const DDG_HTML_EMPTY = `
<!DOCTYPE html>
<html><body>
<div class="results">
  <div class="no-results">No results found.</div>
</div>
</body></html>
`;

// CAPTCHA / anti-bot: nenhum `result__a`.
const DDG_HTML_CAPTCHA = `
<!DOCTYPE html>
<html><body>
<div class="anomaly-modal__title">Unfortunately, bots use DuckDuckGo too.</div>
<form id="challenge-form"><input name="captcha" /></form>
</body></html>
`;

// Estrutura ANTIGA/alterada: links sem a classe `result__a` (ex: layout mudou).
// Este fixture prova que o parser é específico do selector — se um dia o DDG
// trocar `result__a` por outra classe, este teste apanha a regressão.
const DDG_HTML_CHANGED_LAYOUT = `
<!DOCTYPE html>
<html><body>
<div class="results">
  <div class="result">
    <a class="result-title-link" href="https://example.com">Exemplo</a>
    <span class="result-text">Conteúdo de exemplo.</span>
  </div>
</div>
</body></html>
`;

describe('parseDdgHtml (Story 5.11 / AC1)', () => {
  it('HTML com resultados → extrai título, URL real (descodifica uddg) e excerto', () => {
    const results = parseDdgHtml(DDG_HTML_TWO_RESULTS);
    expect(results).toHaveLength(2);

    expect(results[0]).toEqual({
      // Entidade `&amp;ndash;` descodificada para `&ndash;` (decodeHtmlEntities
      // resolve `&amp;` → `&`; `ndash;` fica literal — não é entidade completa).
      title: 'Artemis 2 &ndash; Wikipédia',
      // URL real extraído do parâmetro uddg (não o redirect do DDG).
      url: 'https://pt.wikipedia.org/wiki/Artemis_2',
      // Snippet com tags `<b>` removidas.
      excerpt: 'A missão Artemis 2 levará astronautas à órbita lunar.',
    });

    expect(results[1]!.title).toBe('NASA Artemis II');
    expect(results[1]!.url).toBe('https://www.nasa.gov/artemis-ii/');
    expect(results[1]!.excerpt).toBe('Overview of the Artemis II crewed mission.');
  });

  it('HTML sem resultados (página vazia) → []', () => {
    expect(parseDdgHtml(DDG_HTML_EMPTY)).toEqual([]);
  });

  it('HTML de CAPTCHA / anti-bot → [] (sem throw)', () => {
    expect(parseDdgHtml(DDG_HTML_CAPTCHA)).toEqual([]);
  });

  it('string vazia → []', () => {
    expect(parseDdgHtml('')).toEqual([]);
    expect(parseDdgHtml('   ')).toEqual([]);
  });

  // ≥1 teste que FALHARIA se o selector CSS do DDG mudasse: o parser depende
  // especificamente de `class="…result__a…"`. Com a estrutura alterada (classe
  // diferente), nenhum resultado é extraído.
  it('selector específico — layout alterado (sem result__a) → [] (apanha regressão de selector)', () => {
    expect(parseDdgHtml(DDG_HTML_CHANGED_LAYOUT)).toEqual([]);
  });

  it('descarta links sem URL http(s) válido (ex: link interno do DDG sem uddg)', () => {
    const html = `
      <a class="result__a" href="/settings">Definições internas</a>
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fok.com">Válido</a>
    `;
    const results = parseDdgHtml(html);
    expect(results).toHaveLength(1);
    expect(results[0]!.url).toBe('https://ok.com');
  });

  it('aceita href absoluto sem redirect uddg (degrada graciosamente)', () => {
    const html = `<a class="result__a" href="https://direct.example.com/page">Directo</a>`;
    const results = parseDdgHtml(html);
    expect(results).toHaveLength(1);
    expect(results[0]!.url).toBe('https://direct.example.com/page');
    expect(results[0]!.excerpt).toBe('');
  });

  it('trunca excertos longos a MAX_EXCERPT_LENGTH com reticências', () => {
    const longSnippet = 'palavra '.repeat(60).trim(); // > 150 chars
    const html = `
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com">T</a>
      <a class="result__snippet">${longSnippet}</a>
    `;
    const results = parseDdgHtml(html);
    expect(results).toHaveLength(1);
    expect(results[0]!.excerpt.length).toBeLessThanOrEqual(MAX_EXCERPT_LENGTH + 1); // +1 pelo '…'
    expect(results[0]!.excerpt.endsWith('…')).toBe(true);
  });

  it('input não-string → [] (robustez defensiva)', () => {
    // @ts-expect-error — teste defensivo de input inválido em runtime.
    expect(parseDdgHtml(null)).toEqual([]);
    // @ts-expect-error — teste defensivo de input inválido em runtime.
    expect(parseDdgHtml(undefined)).toEqual([]);
  });
});
