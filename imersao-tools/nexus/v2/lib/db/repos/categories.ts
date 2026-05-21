import { db } from '@/lib/db/client';
import { CategorySchema } from '@/lib/db/schemas';
import type { Category } from '@/types/db';

/**
 * Nexus v2 — Repository para `categories` (Story 3.1)
 *
 * Encapsula acesso à tabela Dexie `categories` (categorias de transações —
 * FR16/FR22). Padrão herdado da Story 2.1 (`tags.ts`).
 *
 * [AUTO-DECISION] A3 (ratificada @po) — a chave primária é `name` (string),
 * não `id`. `Transaction.category` referencia o nome directamente
 * (types/db.ts:118), pelo que usar `name` como PK evita um join desnecessário.
 *
 * `createCategory` rejeita duplicados por nome normalizado (case-insensitive),
 * padrão idêntico ao `createTag` da Story 2.1 (PO Q2).
 *
 * A Story 3.2 semeia as 10 categorias default PT — NÃO é responsabilidade
 * desta story.
 */

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export async function createCategory(input: Category): Promise<Category> {
  CategorySchema.parse(input);

  // Story 3.1 Iter 2 (CodeRabbit #3) — o duplicate-check case-insensitive e o
  // insert correm na MESMA transacção Dexie `'rw'`. Sem isto, duas escritas
  // concorrentes de nomes case-variant ("Lazer" / "lazer") podiam ambas passar
  // o check antes de qualquer `add`, criando duplicados. A transacção serializa
  // leitura+escrita e garante o invariante de unicidade case-insensitive.
  const target = normalize(input.name);
  await db.transaction('rw', db.categories, async () => {
    const existing = await db.categories.toArray();
    const duplicate = existing.find((c) => normalize(c.name) === target);
    if (duplicate) {
      throw new Error(`Já existe uma categoria com o nome "${input.name}"`);
    }
    await db.categories.add(input);
  });

  return input;
}

export async function getCategory(name: string): Promise<Category | undefined> {
  return db.categories.get(name);
}

/**
 * Lista todas as categorias, ordenadas alfabeticamente (pt-PT) por `name`.
 */
export async function listCategories(): Promise<Category[]> {
  const all = await db.categories.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

/**
 * Lista apenas as categorias default (semeadas pela Story 3.2). Ordenadas
 * alfabeticamente (pt-PT) por `name`.
 *
 * O filtro `isDefault` é aplicado em memória: o IndexedDB não indexa valores
 * booleanos de forma fiável (não são keys válidas), pelo que `isDefault` no
 * schema `categories: 'name, isDefault'` não suporta `.where('isDefault')`.
 * A leitura completa + filtro segue o padrão de `listTasks` (Story 2.1) e é
 * adequada à cardinalidade do domínio (≈10 categorias default + user-defined).
 */
export async function listDefaultCategories(): Promise<Category[]> {
  const all = await db.categories.toArray();
  return all
    .filter((c) => c.isDefault)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

export async function deleteCategory(name: string): Promise<void> {
  await db.categories.delete(name);
}
