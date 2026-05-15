import { db } from '@/lib/db/client';
import { TagSchema } from '@/lib/db/schemas';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — Repository para `tags` (Story 2.1)
 *
 * Tabela de definições de tags (`id, name, color`). O vínculo tarefa↔tag é
 * denormalizado em `Task.tags: string[]` + índice multi-entry `*tags` em
 * `tasks` (Story 0.3, version(1)). Não há tabela de junção.
 *
 * PO Q1 — `Task.tags` guarda IDs de tags, não nomes (rename-safety).
 *
 * PO Q2 — Sem índice único `&name`. `createTag` rejeita duplicados via
 * verificação repo-level com normalização case-insensitive
 * (`name.trim().toLowerCase()`). Lança `Error` em PT-PT em caso de duplicado.
 * Persiste o `name` com a capitalização original escolhida pelo utilizador.
 */

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export async function createTag(input: Tag): Promise<Tag> {
  TagSchema.parse(input);

  const target = normalize(input.name);
  const existing = await db.tags.toArray();
  const duplicate = existing.find((t) => normalize(t.name) === target);
  if (duplicate) {
    throw new Error(`Já existe uma tag com o nome "${input.name}"`);
  }

  await db.tags.add(input);
  return input;
}

export async function listTags(): Promise<Tag[]> {
  const all = await db.tags.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

export async function getTag(id: string): Promise<Tag | undefined> {
  return db.tags.get(id);
}

export async function deleteTag(id: string): Promise<void> {
  await db.tags.delete(id);
}
