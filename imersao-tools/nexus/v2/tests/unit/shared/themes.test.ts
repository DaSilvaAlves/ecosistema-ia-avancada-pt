import { describe, it, expect, afterEach, vi } from 'vitest';
import { THEMES, applyTheme, type ThemeName } from '@/lib/shared/themes';

/**
 * Nexus v2 — themes.ts unit tests (P1.1 — fecha o ficheiro a 0% coverage)
 *
 * `applyTheme` escreve nas CSS custom properties do `:root`. Em jsdom existe
 * `document`, por isso o caminho de escrita é exercido directamente. O ramo
 * SSR-safe (`document` ausente) é coberto com `vi.stubGlobal('document', undefined)`.
 */

const ALL_THEMES: ThemeName[] = ['midnight', 'warm-dark', 'deep-purple', 'arctic'];

describe('THEMES', () => {
  it('expõe os 4 temas portados de v1', () => {
    expect(Object.keys(THEMES)).toHaveLength(4);
    for (const name of ALL_THEMES) {
      expect(THEMES[name]).toBeDefined();
      expect(THEMES[name].name).toBe(name);
    }
  });

  it('midnight respeita o design-system (#04040A, accent cyan)', () => {
    expect(THEMES.midnight.bg).toBe('#04040A');
    expect(THEMES.midnight.accent).toBe('#00F5FF');
    expect(THEMES.midnight.text).toBe('#F0F4FF');
  });

  it('cada tema tem todas as propriedades de cor obrigatórias', () => {
    for (const name of ALL_THEMES) {
      const t = THEMES[name];
      expect(t.label).toBeTruthy();
      expect(t.bg).toBeTruthy();
      expect(t.bgCard).toBeTruthy();
      expect(t.border).toBeTruthy();
      expect(t.accent).toBeTruthy();
      expect(t.accentGlow).toBeTruthy();
      expect(t.text).toBeTruthy();
      expect(t.textSecondary).toBeTruthy();
    }
  });
});

describe('applyTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('escreve as 7 CSS custom properties no :root (jsdom)', () => {
    applyTheme(THEMES.midnight);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--bg')).toBe(THEMES.midnight.bg);
    expect(root.style.getPropertyValue('--bg-card')).toBe(THEMES.midnight.bgCard);
    expect(root.style.getPropertyValue('--border')).toBe(THEMES.midnight.border);
    expect(root.style.getPropertyValue('--accent')).toBe(THEMES.midnight.accent);
    expect(root.style.getPropertyValue('--accent-glow')).toBe(THEMES.midnight.accentGlow);
    expect(root.style.getPropertyValue('--text')).toBe(THEMES.midnight.text);
    expect(root.style.getPropertyValue('--text-secondary')).toBe(
      THEMES.midnight.textSecondary,
    );
  });

  it('aplica um tema diferente sobrescreve as properties', () => {
    applyTheme(THEMES.arctic);
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(
      THEMES.arctic.bg,
    );
  });

  it('é no-op SSR-safe quando document é ausente (não lança)', () => {
    vi.stubGlobal('document', undefined);
    expect(() => applyTheme(THEMES.midnight)).not.toThrow();
  });
});
