import { createCategory } from '@/lib/db/repos/categories';
import type { Category } from '@/types/db';

/**
 * Nexus v2 — Seed das 10 categorias default PT (Story 3.2 / FR22)
 *
 * Semeia no IndexedDB local as 10 categorias de despesa mais comuns em Portugal.
 * Consumidor puro da Story 3.1: delega integralmente em `createCategory`
 * (`lib/db/repos/categories.ts`) — não acede ao objecto `db` directamente nem
 * reimplementa validação Zod ou lógica de duplicação.
 *
 * Idempotência: `createCategory` rejeita duplicados por nome normalizado
 * (case-insensitive, em transacção Dexie `'rw'`). O seed captura essa rejeição
 * por item, permitindo re-execução e seed parcial sem falhar nem duplicar.
 *
 * [AUTO-DECISION A2] Loop `createCategory` + `try/catch` por item (não
 * `bulkAdd`): `bulkAdd` abortaria toda a transacção num único duplicado, sem
 * idempotência granular.
 *
 * Trace: PRD §6.3 FR22, EPIC-3 §5 Story 3.2.
 */

/**
 * As 10 categorias default PT — ordem do PRD FR22.
 *
 * - `name`: lista exacta de FR22 (sem variações ortográficas, sem adições).
 * - `color`: paleta canónica do design system `[IA]AVANÇADA PT`
 *   (`.claude/rules/design-system-ia-avancada.md`).
 * - `icon`: nomes kebab-case de `lucide-react@^0.469.0` (todos verificados).
 *
 * `isDefault: true` é adicionado pelo seed na chamada a `createCategory`,
 * pelo que o array é tipado `Omit<Category, 'isDefault'>[]`.
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'isDefault'>[] = [
  { name: 'Mercearia', color: '#39FF14', icon: 'shopping-cart' },
  { name: 'Restauração', color: '#FFB800', icon: 'utensils' },
  { name: 'Combustível', color: '#FF006E', icon: 'fuel' },
  { name: 'Saúde', color: '#00F5FF', icon: 'stethoscope' },
  { name: 'Habitação', color: '#9D00FF', icon: 'home' },
  { name: 'Educação', color: '#FFB800', icon: 'graduation-cap' },
  { name: 'Lazer', color: '#39FF14', icon: 'gamepad-2' },
  { name: 'Subscrições', color: '#00F5FF', icon: 'repeat' },
  { name: 'Serviços', color: '#8892A4', icon: 'wrench' },
  { name: 'Outros', color: '#4A5568', icon: 'help-circle' },
];

/**
 * Semeia as 10 categorias default PT no IndexedDB local.
 *
 * Idempotente: se uma categoria já existir, `createCategory` lança um `Error`
 * de duplicado que é capturado por item — a execução prossegue para as
 * restantes. Re-execução total ou parcial completa sem erro e sem duplicados.
 *
 * Não devolve informação sobre quantas categorias foram criadas vs já
 * existiam — o seed é uma operação de inicialização, não uma consulta.
 */
export async function seedDefaultCategories(): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    try {
      await createCategory({ ...category, isDefault: true });
    } catch {
      // Categoria já existe — `createCategory` rejeita duplicados por nome
      // normalizado (case-insensitive). Idempotente: ignorar silenciosamente
      // e prosseguir para a categoria seguinte.
    }
  }
}
