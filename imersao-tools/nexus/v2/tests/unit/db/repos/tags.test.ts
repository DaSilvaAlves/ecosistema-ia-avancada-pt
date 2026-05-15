import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createTag, listTags, getTag, deleteTag } from '@/lib/db/repos/tags';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — tags repo tests (Story 2.1 / AC11)
 *
 * Foco do AC: `createTag` rejeita duplicado case-insensitive (PO Q2).
 */

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: crypto.randomUUID(),
    name: 'Urgente',
    color: '#FF006E',
    ...overrides,
  };
}

describe('tags repo', () => {
  beforeEach(async () => {
    await db.tags.clear();
  });

  it('createTag + getTag roundtrip', async () => {
    const tag = makeTag();
    await createTag(tag);
    const retrieved = await getTag(tag.id);
    expect(retrieved).toEqual(tag);
  });

  it('createTag rejeita input inválido (Zod)', async () => {
    const invalid = makeTag({ id: 'not-a-uuid' });
    await expect(createTag(invalid)).rejects.toThrow();
  });

  it('createTag rejeita nome vazio com mensagem PT-PT', async () => {
    const invalid = makeTag({ name: '' });
    await expect(createTag(invalid)).rejects.toThrow(/Nome da tag é obrigatório/);
  });

  it('createTag rejeita duplicado case-insensitive — "Urgente" vs "urgente"', async () => {
    await createTag(makeTag({ name: 'Urgente' }));
    await expect(createTag(makeTag({ name: 'urgente' }))).rejects.toThrow(
      /Já existe uma tag com o nome "urgente"/
    );
  });

  it('createTag rejeita duplicado case-insensitive — "URGENTE" vs "Urgente"', async () => {
    await createTag(makeTag({ name: 'Urgente' }));
    await expect(createTag(makeTag({ name: 'URGENTE' }))).rejects.toThrow(
      /Já existe uma tag com o nome "URGENTE"/
    );
  });

  it('createTag rejeita duplicado com whitespace — "  Urgente  " vs "Urgente"', async () => {
    await createTag(makeTag({ name: 'Urgente' }));
    await expect(createTag(makeTag({ name: '  Urgente  ' }))).rejects.toThrow(
      /Já existe uma tag/
    );
  });

  it('createTag preserva capitalização original ao persistir', async () => {
    const tag = makeTag({ name: 'Família' });
    await createTag(tag);
    const retrieved = await getTag(tag.id);
    expect(retrieved?.name).toBe('Família');
  });

  it('createTag aceita nomes distintos após normalização', async () => {
    await createTag(makeTag({ name: 'Trabalho' }));
    await expect(createTag(makeTag({ name: 'Casa' }))).resolves.toBeDefined();
  });

  it('listTags ordena alfabeticamente (pt-PT)', async () => {
    await createTag(makeTag({ name: 'Zen' }));
    await createTag(makeTag({ name: 'Ácido' }));
    await createTag(makeTag({ name: 'Maçã' }));

    const result = await listTags();
    expect(result.map((t) => t.name)).toEqual(['Ácido', 'Maçã', 'Zen']);
  });

  it('deleteTag remove a tag', async () => {
    const tag = makeTag();
    await createTag(tag);
    await deleteTag(tag.id);
    const after = await getTag(tag.id);
    expect(after).toBeUndefined();
  });
});
