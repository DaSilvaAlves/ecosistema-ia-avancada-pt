import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createTag, updateTag, getTag } from '@/lib/db/repos/tags';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — tags repo updateTag tests (Story 2.6 / AC1)
 *
 * Foco do AC1: updateTag aceita Partial<Pick<Tag, 'name' | 'color'>>, valida
 * duplicado case-insensitive excluindo o próprio id (self-rename permitido),
 * lança mensagens PT-PT, valida via TagSchema antes de persistir.
 */

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: crypto.randomUUID(),
    name: 'Trabalho',
    color: '#00F5FF',
    ...overrides,
  };
}

describe('tags repo / updateTag (Story 2.6 AC1)', () => {
  beforeEach(async () => {
    await db.tags.clear();
  });

  it('updateTag altera o nome com sucesso', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await createTag(tag);

    await updateTag(tag.id, { name: 'Profissional' });

    const retrieved = await getTag(tag.id);
    expect(retrieved?.name).toBe('Profissional');
    expect(retrieved?.color).toBe('#00F5FF'); // cor inalterada
  });

  it('updateTag altera a cor com sucesso', async () => {
    const tag = makeTag({ name: 'Trabalho', color: '#00F5FF' });
    await createTag(tag);

    await updateTag(tag.id, { color: '#39FF14' });

    const retrieved = await getTag(tag.id);
    expect(retrieved?.color).toBe('#39FF14');
    expect(retrieved?.name).toBe('Trabalho'); // nome inalterado
  });

  it('updateTag lança Error PT-PT quando tag não existe', async () => {
    const fakeId = crypto.randomUUID();
    await expect(updateTag(fakeId, { name: 'X' })).rejects.toThrow(/não encontrada/);
  });

  it('updateTag rejeita duplicado case-insensitive contra OUTRA tag', async () => {
    await createTag(makeTag({ name: 'Trabalho' }));
    const other = makeTag({ name: 'Pessoal' });
    await createTag(other);

    await expect(updateTag(other.id, { name: 'TRABALHO' })).rejects.toThrow(
      /Já existe uma tag com o nome "TRABALHO"/,
    );
  });

  it('updateTag PERMITE self-rename com capitalização diferente (A7)', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await createTag(tag);

    // Não deve lançar — está a comparar contra si própria
    await expect(updateTag(tag.id, { name: 'TRABALHO' })).resolves.toBeUndefined();

    const retrieved = await getTag(tag.id);
    expect(retrieved?.name).toBe('TRABALHO');
  });

  it('updateTag PERMITE self-rename para nome idêntico (no-op semantic)', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await createTag(tag);

    await expect(updateTag(tag.id, { name: 'Trabalho' })).resolves.toBeUndefined();

    const retrieved = await getTag(tag.id);
    expect(retrieved?.name).toBe('Trabalho');
  });

  it('updateTag valida Zod no merged object (nome vazio rejeitado)', async () => {
    const tag = makeTag({ name: 'Trabalho' });
    await createTag(tag);

    await expect(updateTag(tag.id, { name: '' })).rejects.toThrow(
      /Nome da tag é obrigatório/,
    );
  });
});
