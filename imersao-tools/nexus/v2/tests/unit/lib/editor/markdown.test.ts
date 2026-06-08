import { describe, it, expect } from 'vitest';
import { normalizeMarkdown } from '@/lib/editor/markdown';

/**
 * Nexus v2 — markdown helper tests (Story 5.2 — AC2 / R5)
 *
 * Round-trip não-tautológico: markdown → documento Tiptap → markdown.
 * Prova que a formatação é preservada (AC1 epic) — em especial task lists
 * (o nó mais frágil; FR42/FR47), checkbox marcado E desmarcado.
 */
describe('normalizeMarkdown — round-trip de formatação (Story 5.2 / AC2)', () => {
  it('preserva cabeçalho, negrito, itálico e código inline', () => {
    const out = normalizeMarkdown('# Titulo\n\nTexto **negrito** e *itálico* com `code`.');
    expect(out).toContain('# Titulo');
    expect(out).toContain('**negrito**');
    expect(out).toContain('*itálico*');
    expect(out).toContain('`code`');
  });

  it('preserva links', () => {
    const out = normalizeMarkdown('Ver [link](https://exemplo.pt).');
    expect(out).toContain('[link](https://exemplo.pt)');
  });

  it('preserva listas não-ordenadas e ordenadas', () => {
    const out = normalizeMarkdown('- a\n- b\n\n1. um\n2. dois');
    expect(out).toContain('- a');
    expect(out).toContain('- b');
    expect(out).toContain('1. um');
    expect(out).toContain('2. dois');
  });

  it('preserva task lists com checkbox desmarcado E marcado', () => {
    const out = normalizeMarkdown('- [ ] por fazer\n- [x] feito');
    expect(out).toContain('[ ] por fazer');
    expect(out).toContain('[x] feito');
  });

  it('preserva blocos de código fenced', () => {
    const out = normalizeMarkdown('```js\nconst a = 1;\n```');
    expect(out).toContain('```');
    expect(out).toContain('const a = 1;');
  });

  it('é idempotente (round-trip estável)', () => {
    const md =
      '# Titulo\n\nTexto **negrito** e *itálico*.\n\n- [ ] por fazer\n- [x] feito\n\n[link](https://exemplo.pt)';
    const once = normalizeMarkdown(md);
    const twice = normalizeMarkdown(once);
    expect(twice).toBe(once);
  });

  it('texto vazio devolve string vazia', () => {
    expect(normalizeMarkdown('').trim()).toBe('');
  });
});
