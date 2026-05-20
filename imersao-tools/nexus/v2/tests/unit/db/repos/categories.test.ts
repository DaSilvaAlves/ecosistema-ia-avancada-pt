import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createCategory,
  getCategory,
  listCategories,
  listDefaultCategories,
  deleteCategory,
} from '@/lib/db/repos/categories';
import type { Category } from '@/types/db';

/**
 * Nexus v2 — categories repo tests (Story 3.1 / AC13)
 *
 * PK da tabela é `name` ([AUTO-DECISION] A3). Foco do AC: `createCategory`
 * rejeita duplicado case-insensitive (padrão Story 2.1 Q2).
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    name: 'Mercearia',
    color: '#39FF14',
    icon: 'shopping-cart',
    isDefault: false,
    ...overrides,
  };
}

describe('categories repo', () => {
  beforeEach(async () => {
    await db.categories.clear();
  });

  it('createCategory + getCategory roundtrip (PK é name)', async () => {
    const category = makeCategory();
    await createCategory(category);
    const retrieved = await getCategory(category.name);
    expect(retrieved).toEqual(category);
  });

  it('createCategory rejeita nome vazio com mensagem PT-PT', async () => {
    const invalid = makeCategory({ name: '' });
    await expect(createCategory(invalid)).rejects.toThrow(/Nome da categoria é obrigatório/);
  });

  it('createCategory rejeita color ausente', async () => {
    const invalid = makeCategory({ color: '' });
    await expect(createCategory(invalid)).rejects.toThrow(/Cor da categoria é obrigatória/);
  });

  it('createCategory rejeita duplicado case-insensitive — "Mercearia" vs "mercearia"', async () => {
    await createCategory(makeCategory({ name: 'Mercearia' }));
    await expect(createCategory(makeCategory({ name: 'mercearia' }))).rejects.toThrow(
      /Já existe uma categoria com o nome "mercearia"/,
    );
  });

  it('createCategory rejeita duplicado case-insensitive — "SAÚDE" vs "Saúde"', async () => {
    await createCategory(makeCategory({ name: 'Saúde' }));
    await expect(createCategory(makeCategory({ name: 'SAÚDE' }))).rejects.toThrow(
      /Já existe uma categoria com o nome "SAÚDE"/,
    );
  });

  it('createCategory rejeita duplicado com whitespace — "  Lazer  " vs "Lazer"', async () => {
    await createCategory(makeCategory({ name: 'Lazer' }));
    await expect(createCategory(makeCategory({ name: '  Lazer  ' }))).rejects.toThrow(
      /Já existe uma categoria/,
    );
  });

  it('createCategory aceita nomes distintos', async () => {
    await createCategory(makeCategory({ name: 'Habitação' }));
    await expect(createCategory(makeCategory({ name: 'Educação' }))).resolves.toBeDefined();
  });

  it('listCategories ordena alfabeticamente (pt-PT)', async () => {
    await createCategory(makeCategory({ name: 'Zelo' }));
    await createCategory(makeCategory({ name: 'Ácido' }));
    await createCategory(makeCategory({ name: 'Maçã' }));

    const result = await listCategories();
    expect(result.map((c) => c.name)).toEqual(['Ácido', 'Maçã', 'Zelo']);
  });

  it('listDefaultCategories devolve apenas as categorias default', async () => {
    await createCategory(makeCategory({ name: 'Mercearia', isDefault: true }));
    await createCategory(makeCategory({ name: 'Restauração', isDefault: true }));
    await createCategory(makeCategory({ name: 'Personalizada', isDefault: false }));

    const defaults = await listDefaultCategories();
    expect(defaults).toHaveLength(2);
    defaults.forEach((c) => expect(c.isDefault).toBe(true));
    expect(defaults.map((c) => c.name)).toEqual(['Mercearia', 'Restauração']);
  });

  it('deleteCategory remove a categoria por nome', async () => {
    const category = makeCategory();
    await createCategory(category);
    await deleteCategory(category.name);
    expect(await getCategory(category.name)).toBeUndefined();
  });

  it('deleteCategory é idempotente — não lança em nome inexistente', async () => {
    await expect(deleteCategory('Inexistente')).resolves.toBeUndefined();
  });
});
