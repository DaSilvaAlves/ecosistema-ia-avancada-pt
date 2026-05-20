import { db } from '@/lib/db/client';
import { TagSchema } from '@/lib/db/schemas';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — Repository para `tags` (Story 2.1 base + Story 2.6 extensão)
 *
 * Tabela de definições de tags (`id, name, color`). O vínculo tarefa↔tag é
 * denormalizado em `Task.tags: string[]` + índice multi-entry `*tags` em
 * `tasks` (Story 0.3, version(1)). Não há tabela de junção.
 *
 * PO Q1 — `Task.tags` guarda IDs de tags, não nomes (rename-safety).
 *
 * PO Q2 — Sem índice único `&name`. `createTag`/`updateTag` rejeitam duplicados
 * via verificação repo-level com normalização case-insensitive
 * (`name.trim().toLowerCase()`). Lançam `Error` em PT-PT em caso de duplicado.
 * Persistem o `name` com a capitalização original escolhida pelo utilizador.
 *
 * Story 2.6:
 *   - Adiciona `updateTag(id, patch)` com verificação case-insensitive
 *     excluindo o próprio id (permite self-rename com capitalização diferente).
 *   - Estende `deleteTag(id)` com **cascata atómica** numa transacção `'rw'`:
 *     remove o `tagId` dos arrays `Task.tags` de todas as tasks vinculadas
 *     antes de eliminar a tag. Evita orphan tagIds que quebrariam o
 *     `tagsLookup` Map nas pages consumidoras.
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

/**
 * Story 2.6 / AC1 — Actualiza `name` e/ou `color` de uma tag existente.
 *
 * Verifica duplicados case-insensitive **excluindo o próprio id** (`t.id !== id`)
 * para permitir self-rename com capitalização diferente (ex: "Trabalho" → "TRABALHO").
 * Sem isto, a tag estaria a comparar contra si mesma e o submit falharia
 * com falso positivo.
 *
 * Persiste o `name` com a capitalização original escolhida pelo utilizador
 * (mesmo padrão de `createTag`).
 */
export async function updateTag(
  id: string,
  patch: Partial<Pick<Tag, 'name' | 'color'>>,
): Promise<void> {
  const existing = await db.tags.get(id);
  if (existing === undefined) {
    throw new Error(`Tag "${id}" não encontrada`);
  }

  if (patch.name !== undefined) {
    const target = normalize(patch.name);
    const all = await db.tags.toArray();
    const duplicate = all.find((t) => t.id !== id && normalize(t.name) === target);
    if (duplicate) {
      throw new Error(`Já existe uma tag com o nome "${patch.name}"`);
    }
  }

  const merged: Tag = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.color !== undefined ? { color: patch.color } : {}),
  };
  TagSchema.parse(merged);
  await db.tags.put(merged);
}

/**
 * Story 2.6 / AC2 — Elimina uma tag com **cascata atómica**.
 *
 * Numa única transacção Dexie `'rw'`:
 *   1. Lista todas as tasks que contêm o `tagId` no array `Task.tags`
 *      (índice multi-entry `*tags`).
 *   2. Para cada task vinculada, remove o `tagId` do array e actualiza
 *      `updatedAt`. Persiste via `db.tasks.put(updated)`.
 *   3. Elimina a tag via `db.tags.delete(id)`.
 *
 * Se qualquer operação dentro da transacção falhar, Dexie faz rollback
 * automático — garantia ACID local. NÃO usar 2 awaits separados em try/catch
 * (não-atómico, pode deixar estado inconsistente se o `delete` falhar depois
 * dos `put` terem corrido).
 *
 * Assinatura mantém `Promise<void>` para compatibilidade com call-sites
 * existentes da Story 2.1.
 */
export async function deleteTag(id: string): Promise<void> {
  await db.transaction('rw', db.tasks, db.tags, async () => {
    const affected = await db.tasks.where('tags').anyOf([id]).toArray();
    const now = Date.now();
    for (const task of affected) {
      await db.tasks.put({
        ...task,
        tags: task.tags.filter((t) => t !== id),
        updatedAt: now,
      });
    }
    await db.tags.delete(id);
  });
}

/**
 * Story 2.6 — Conta quantas tasks têm uma tag vinculada. Usado pela page
 * `/tags` para exibir contagem por TagCard e pela mensagem de `window.confirm`
 * antes do cascata-delete.
 */
export async function countTasksForTag(tagId: string): Promise<number> {
  return db.tasks.where('tags').anyOf([tagId]).count();
}
