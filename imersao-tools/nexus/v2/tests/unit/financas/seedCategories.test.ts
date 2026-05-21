import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createCategory, listDefaultCategories } from '@/lib/db/repos/categories';
import { seedDefaultCategories, DEFAULT_CATEGORIES } from '@/lib/financas/seedCategories';

/**
 * Nexus v2 — seedCategories tests (Story 3.2 / AC7)
 *
 * Foco: o seed das 10 categorias default PT é idempotente — re-execução total
 * ou parcial não falha nem cria duplicados. Cobre também a integridade do
 * array `DEFAULT_CATEGORIES` (nomes FR22 exactos, `color`/`icon` não-vazios).
 *
 * fake-indexeddb carregado via tests/setup.ts; `beforeEach` limpa a tabela.
 */

/** Os 10 nomes exactos de FR22, na ordem do PRD §6.3. */
const FR22_NAMES = [
  'Mercearia',
  'Restauração',
  'Combustível',
  'Saúde',
  'Habitação',
  'Educação',
  'Lazer',
  'Subscrições',
  'Serviços',
  'Outros',
];

describe('seedDefaultCategories — Story 3.2', () => {
  beforeEach(async () => {
    await db.categories.clear();
  });

  // AC7 — DB vazia → seed cria exactamente 10 categorias default
  it('numa DB vazia cria exactamente 10 categorias com isDefault: true', async () => {
    await seedDefaultCategories();

    const defaults = await listDefaultCategories();
    expect(defaults).toHaveLength(10);
    defaults.forEach((c) => expect(c.isDefault).toBe(true));
  });

  // AC7 — listDefaultCategories após seed devolve exactamente as 10
  it('listDefaultCategories após seed devolve exactamente as 10 categorias', async () => {
    await seedDefaultCategories();

    const defaults = await listDefaultCategories();
    // listDefaultCategories ordena alfabeticamente (pt-PT) — comparar como set.
    expect(new Set(defaults.map((c) => c.name))).toEqual(new Set(FR22_NAMES));
  });

  // AC4 / AC7 — idempotência: 2ª chamada não falha nem duplica
  it('é idempotente — chamar 2x não cria duplicados nem lança erro', async () => {
    await seedDefaultCategories();
    await expect(seedDefaultCategories()).resolves.toBeUndefined();

    const defaults = await listDefaultCategories();
    expect(defaults).toHaveLength(10);
  });

  // AC4 / AC7 — seed parcial: 5 pré-existentes → completa as 5 restantes
  it('seed parcial — com 5 categorias já presentes cria as 5 restantes sem falhar', async () => {
    // Semeia manualmente as primeiras 5 categorias default.
    for (const cat of DEFAULT_CATEGORIES.slice(0, 5)) {
      await createCategory({ ...cat, isDefault: true });
    }

    await expect(seedDefaultCategories()).resolves.toBeUndefined();

    const defaults = await listDefaultCategories();
    expect(defaults).toHaveLength(10);
  });

  // AC7 — seed parcial com categorias user-defined pré-existentes não as afecta
  it('seed parcial — categoria user-defined pré-existente é preservada e não conta como default', async () => {
    await createCategory({
      name: 'Personalizada',
      color: '#00F5FF',
      icon: 'star',
      isDefault: false,
    });

    await seedDefaultCategories();

    const defaults = await listDefaultCategories();
    expect(defaults).toHaveLength(10);
    expect(await db.categories.count()).toBe(11);
  });

  // AC3 / AC7 — nenhuma categoria default criada com isDefault: false
  it('nenhuma das categorias semeadas tem isDefault: false', async () => {
    await seedDefaultCategories();

    const all = await db.categories.toArray();
    expect(all).toHaveLength(10);
    all.forEach((c) => expect(c.isDefault).toBe(true));
  });

  // AC2 — nomes exactos do PRD FR22 (sem typos, ordem do array)
  it('DEFAULT_CATEGORIES tem os 10 nomes exactos de FR22 na ordem do PRD', () => {
    expect(DEFAULT_CATEGORIES.map((c) => c.name)).toEqual(FR22_NAMES);
  });

  it('DEFAULT_CATEGORIES tem exactamente 10 categorias', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(10);
  });

  // AC3 / AC7 — color e icon não-vazios (CategorySchema exige .min(1))
  it('todas as 10 categorias têm color não-vazio e icon não-vazio', () => {
    DEFAULT_CATEGORIES.forEach((cat) => {
      expect(cat.color.length).toBeGreaterThan(0);
      expect(cat.icon.length).toBeGreaterThan(0);
    });
  });

  // AC7 — as categorias semeadas persistem color e icon na DB
  it('as categorias semeadas persistem color e icon não-vazios na DB', async () => {
    await seedDefaultCategories();

    const all = await db.categories.toArray();
    all.forEach((c) => {
      expect(c.color.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
    });
  });
});
