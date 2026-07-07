import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

/**
 * Story 9.4 (AC8) — teste de estrutura do manifest PWA.
 *
 * `app/manifest.ts` é uma função pura → importa-se e afirma-se a forma do
 * objecto devolvido. Sem estados de render (função, não componente) →
 * `react-component-test-criteria.md` N/A (0 estados). Teste de forma basta.
 */

const m = manifest();

describe('app/manifest.ts — Web App Manifest PWA (Story 9.4)', () => {
  it('tem os campos obrigatórios PWA (AC1)', () => {
    expect(m.name).toBe('Nexus');
    expect(m.short_name).toBe('Nexus');
    expect(m.description).toBe(
      'Continuidade pessoal — assistente multi-intent chat-first.',
    );
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.lang).toBe('pt-PT');
  });

  it('usa exactamente as cores do design-system (AC4)', () => {
    expect(m.background_color).toBe('#04040A');
    expect(m.theme_color).toBe('#00F5FF');
  });

  it('declara ícones 192 + 512 em image/png (AC2, AC3)', () => {
    const icons = m.icons ?? [];
    const icon192 = icons.find((i) => i.sizes === '192x192');
    const icon512 = icons.find((i) => i.sizes === '512x512');

    expect(icon192).toBeDefined();
    expect(icon192?.type).toBe('image/png');
    expect(icon512).toBeDefined();
    expect(icon512?.type).toBe('image/png');
  });

  it('inclui pelo menos um ícone maskable com zona-segura (AC2)', () => {
    const icons = m.icons ?? [];
    const maskable = icons.filter((i) => i.purpose === 'maskable');

    expect(maskable.length).toBeGreaterThanOrEqual(1);
    expect(maskable.every((i) => i.type === 'image/png')).toBe(true);
  });

  it('todos os ícones são image/png e servidos sob /icons/ (AC7)', () => {
    const icons = m.icons ?? [];
    expect(icons.length).toBeGreaterThanOrEqual(3);
    expect(icons.every((i) => i.type === 'image/png')).toBe(true);
    expect(icons.every((i) => i.src.startsWith('/icons/'))).toBe(true);
  });
});
