import { describe, it, expect } from 'vitest';
import {
  stripJsonMarkdownFences,
  extractFirstJsonObject,
} from '@/lib/agent/classifier-json';

/**
 * Nexus v2 — `classifier-json.ts` unit tests (acção preventiva 2026-05-31)
 *
 * Este módulo é a **single source of truth** que fecha a classe de bug
 * "JSON do LLM vem em markdown fences e o `JSON.parse` rebenta" — reincidente
 * 3 vezes em produção (09/05 server, 18/05 prosa variant server, 31/05 client;
 * ver `docs/incidents/INCIDENT-20260531-classifier-fences-CLOSED.md`). Tanto
 * `AnthropicClassifier.classify` (server) como `InferenceTransport.classify`
 * (client) dependem dele.
 *
 * Os testes de provider/transport exercitam-no indirectamente. Estes testes
 * cobrem-no **directamente e de forma exaustiva** — cada cenário de fence é uma
 * variante observada (ou plausível) do output real do Haiku 4.5. Se a função
 * regredir, falham aqui antes de chegar a produção.
 *
 * `mock-protocol-fidelity.md`: os inputs reflectem o output real do Haiku
 * (fences com/sem language tag, prosa antes/depois, múltiplos blocos), não uma
 * versão idealizada.
 */

const F = '```';

/** Helper: aplica strip + parse, devolve o objecto. Falha o teste se não parsear. */
function stripAndParse(raw: string): unknown {
  const cleaned = stripJsonMarkdownFences(raw);
  return JSON.parse(cleaned);
}

describe('stripJsonMarkdownFences', () => {
  it('passa JSON limpo intacto (sem fences)', () => {
    const raw = '{"intents":["tasks"],"confidence":{"tasks":0.96}}';
    expect(stripJsonMarkdownFences(raw)).toBe(raw);
    expect(stripAndParse(raw)).toEqual({
      intents: ['tasks'],
      confidence: { tasks: 0.96 },
    });
  });

  it('remove fence simétrico com language tag (```json … ```)', () => {
    const raw = `${F}json\n{"intents":["finance"]}\n${F}`;
    expect(stripAndParse(raw)).toEqual({ intents: ['finance'] });
  });

  it('remove fence simétrico sem language tag (``` … ```)', () => {
    const raw = `${F}\n{"intents":["habits"]}\n${F}`;
    expect(stripAndParse(raw)).toEqual({ intents: ['habits'] });
  });

  it('tolera whitespace extra à volta dos fences e do JSON', () => {
    const raw = `   ${F}json\n   {"a":1}   \n${F}   `;
    expect(stripAndParse(raw)).toEqual({ a: 1 });
  });

  it('remove fence quando há prosa explicativa DEPOIS do fence de fecho (bug prod 18/05)', () => {
    const raw = `${F}json\n{"intents":[]}\n${F}\nO prompt "avança" é demasiado vago para classificar.`;
    expect(stripAndParse(raw)).toEqual({ intents: [] });
  });

  it('remove fence quando há prosa ANTES do fence de abertura', () => {
    const raw = `Aqui está a classificação:\n${F}json\n{"intents":["journal"]}\n${F}`;
    expect(stripAndParse(raw)).toEqual({ intents: ['journal'] });
  });

  it('remove fence com prosa antes E depois', () => {
    const raw = `Claro:\n${F}\n{"intents":["calendar"]}\n${F}\nEspero ter ajudado.`;
    expect(stripAndParse(raw)).toEqual({ intents: ['calendar'] });
  });

  it('isola o primeiro objecto quando o Haiku devolve múltiplos blocos fenced', () => {
    // Caso que o strip simétrico ingénuo partia: deixava os marcadores ``` do
    // meio e o JSON.parse rebentava. Agora cai para extracção balanceada.
    const raw = `${F}json\n{"intents":["tasks"]}\n${F}\n${F}json\n{"intents":["finance"]}\n${F}`;
    expect(stripAndParse(raw)).toEqual({ intents: ['tasks'] });
  });

  it('extrai JSON balanceado quando o fence de abertura não tem fecho', () => {
    const raw = `${F}json\n{"intents":["knowledge"],"confidence":{"knowledge":0.7}}`;
    expect(stripAndParse(raw)).toEqual({
      intents: ['knowledge'],
      confidence: { knowledge: 0.7 },
    });
  });

  it('não desbalanceia perante chavetas dentro de strings ("{x}")', () => {
    const raw = `${F}json\n{"label":"valor {x} aqui","intents":["meta"]}\n${F}`;
    expect(stripAndParse(raw)).toEqual({
      label: 'valor {x} aqui',
      intents: ['meta'],
    });
  });

  it('preserva objecto vazio dentro de fences', () => {
    const raw = `${F}json\n{}\n${F}`;
    expect(stripAndParse(raw)).toEqual({});
  });

  it('extrai o primeiro objecto quando há JSON embutido em prosa sem fences', () => {
    const raw = 'O resultado é {"intents":["gmail"]} conforme pedido.';
    expect(stripAndParse(raw)).toEqual({ intents: ['gmail'] });
  });

  it('devolve a string trimmed intacta quando não há JSON (parse falha com mensagem útil)', () => {
    const raw = '  não consigo classificar isto  ';
    const out = stripJsonMarkdownFences(raw);
    expect(out).toBe('não consigo classificar isto');
    expect(() => JSON.parse(out)).toThrow();
  });
});

describe('extractFirstJsonObject', () => {
  it('extrai o primeiro objecto balanceado de uma string', () => {
    expect(extractFirstJsonObject('lixo {"a":1} mais lixo')).toBe('{"a":1}');
  });

  it('suporta objectos aninhados', () => {
    expect(extractFirstJsonObject('{"a":{"b":2}} resto')).toBe('{"a":{"b":2}}');
  });

  it('respeita chavetas dentro de strings com escapes', () => {
    const input = '{"path":"a\\\\b","note":"{nested}"}';
    expect(extractFirstJsonObject(input)).toBe(input);
  });

  it('respeita o startIndex fornecido', () => {
    const input = `prefixo {"a":1}`;
    const start = input.indexOf('{');
    expect(extractFirstJsonObject(input, start)).toBe('{"a":1}');
  });

  it('devolve null quando não há objecto balanceado', () => {
    expect(extractFirstJsonObject('sem chavetas aqui')).toBeNull();
    expect(extractFirstJsonObject('{"a":1')).toBeNull();
  });
});
