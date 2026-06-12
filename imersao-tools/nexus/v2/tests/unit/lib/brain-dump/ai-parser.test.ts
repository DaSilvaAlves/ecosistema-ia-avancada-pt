import { describe, it, expect } from 'vitest';
import {
  BRAIN_DUMP_BUCKETS,
  BrainDumpParsedSchema,
  BrainDumpWireSchema,
  enrichWithIds,
  hasParsedContent,
  parseBrainDumpWire,
  type BrainDumpWire,
} from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — ai-parser unit tests (Story 5.7 — AC1/AC7)
 *
 * Helper PURO — testável ~100% sem mockar `fetch`. Foco em:
 *   - parse válido do wire (4 buckets de strings);
 *   - fidelidade `.strict()` (`mock-protocol-fidelity.md`): bucket renomeado,
 *     item sem texto, campo extra → FALHAM. Estes testes falhariam se o `.strict()`
 *     fosse removido — é o que torna o contrato falsificável;
 *   - `enrichWithIds` puro com `idFn` injectável (determinístico);
 *   - `hasParsedContent` (0 buckets úteis → false).
 */

/** Wire válido de referência (4 buckets, alguns vazios). */
function validWire(): BrainDumpWire {
  return {
    tarefas: ['ligar ao contabilista', 'comprar tinta'],
    projectos: ['renovar o escritório'],
    ideias: [],
    decisoes: ['mudar de banco?'],
  };
}

describe('parseBrainDumpWire (AC1) — caminho válido', () => {
  it('aceita os 4 buckets como arrays de strings (vazios permitidos)', () => {
    const wire = parseBrainDumpWire(validWire());
    expect(wire).toEqual(validWire());
  });

  it('aceita os 4 buckets todos vazios (a AI não encontrou itens)', () => {
    const empty = { tarefas: [], projectos: [], ideias: [], decisoes: [] };
    expect(parseBrainDumpWire(empty)).toEqual(empty);
  });
});

describe('parseBrainDumpWire — fidelidade `.strict()` (AC7, mock-protocol-fidelity.md)', () => {
  it('LANÇA se um bucket for renomeado (tarefas → tasks)', () => {
    const renamed = {
      tasks: ['x'],
      projectos: [],
      ideias: [],
      decisoes: [],
    };
    expect(() => parseBrainDumpWire(renamed)).toThrow(/formato inesperado/);
  });

  it('LANÇA se faltar um bucket obrigatório', () => {
    const missing = { tarefas: [], projectos: [], ideias: [] };
    expect(() => parseBrainDumpWire(missing)).toThrow(/formato inesperado/);
  });

  it('LANÇA com um campo extra (.strict())', () => {
    const extra = {
      tarefas: [],
      projectos: [],
      ideias: [],
      decisoes: [],
      lembretes: ['x'],
    };
    expect(() => parseBrainDumpWire(extra)).toThrow(/formato inesperado/);
  });

  it('LANÇA se um item for string vazia (min(1))', () => {
    const emptyItem = {
      tarefas: [''],
      projectos: [],
      ideias: [],
      decisoes: [],
    };
    expect(() => parseBrainDumpWire(emptyItem)).toThrow(/formato inesperado/);
  });

  it('LANÇA se um item não for string (a AI devolveu um objecto com id)', () => {
    // Fidelidade do contrato wire: a AI devolve TEXTOS, não ids. Se devolvesse
    // `{ id, texto }` o wire schema rejeita — os ids são do cliente (enrichWithIds).
    const objectItem = {
      tarefas: [{ id: 'a', texto: 'x' }],
      projectos: [],
      ideias: [],
      decisoes: [],
    };
    expect(() => parseBrainDumpWire(objectItem)).toThrow(/formato inesperado/);
  });
});

describe('enrichWithIds (AC1) — wire → domínio', () => {
  it('atribui ids a cada item preservando o texto e a ordem', () => {
    let counter = 0;
    const idFn = () => `id-${++counter}`;
    const domain = enrichWithIds(validWire(), idFn);

    expect(domain.tarefas).toEqual([
      { id: 'id-1', texto: 'ligar ao contabilista' },
      { id: 'id-2', texto: 'comprar tinta' },
    ]);
    expect(domain.projectos).toEqual([{ id: 'id-3', texto: 'renovar o escritório' }]);
    expect(domain.ideias).toEqual([]);
    expect(domain.decisoes).toEqual([{ id: 'id-4', texto: 'mudar de banco?' }]);
  });

  it('produz domínio que satisfaz `BrainDumpParsedSchema` (.strict())', () => {
    const domain = enrichWithIds(validWire(), () => crypto.randomUUID());
    expect(() => BrainDumpParsedSchema.parse(domain)).not.toThrow();
  });

  it('usa `crypto.randomUUID` por default (ids únicos não vazios)', () => {
    const domain = enrichWithIds({
      tarefas: ['a', 'b'],
      projectos: [],
      ideias: [],
      decisoes: [],
    });
    const [first, second] = domain.tarefas;
    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  it('não muta o wire de entrada', () => {
    const wire = validWire();
    const snapshot = JSON.parse(JSON.stringify(wire));
    enrichWithIds(wire, () => 'fixed');
    expect(wire).toEqual(snapshot);
  });
});

describe('hasParsedContent (AC1)', () => {
  it('false quando os 4 buckets estão vazios', () => {
    expect(
      hasParsedContent({ tarefas: [], projectos: [], ideias: [], decisoes: [] }),
    ).toBe(false);
  });

  it('true quando pelo menos um bucket tem conteúdo', () => {
    const domain = enrichWithIds(validWire(), () => 'x');
    expect(hasParsedContent(domain)).toBe(true);
  });

  it('aceita wire ou domínio (ambos têm os 4 buckets como arrays)', () => {
    expect(hasParsedContent(validWire())).toBe(true);
  });
});

describe('contrato dos buckets (external-contract-identifiers.md)', () => {
  it('os 4 nomes de bucket são ASCII (sem acentos/cedilha)', () => {
    for (const bucket of BRAIN_DUMP_BUCKETS) {
      // eslint-disable-next-line no-control-regex
      expect(bucket).toMatch(/^[\x00-\x7F]+$/);
    }
    expect(BRAIN_DUMP_BUCKETS).toEqual(['tarefas', 'projectos', 'ideias', 'decisoes']);
  });

  it('`BrainDumpWireSchema` valida o shape de referência', () => {
    expect(BrainDumpWireSchema.safeParse(validWire()).success).toBe(true);
  });
});
