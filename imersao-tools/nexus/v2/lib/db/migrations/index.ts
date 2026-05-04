/**
 * Nexus v2 — Migrations registry
 *
 * Reexporta todas as migrations para fácil import.
 * Chamadas explícitas no boot do app (componente client top-level).
 */
export { migrateV1ToV2, MIGRATION_FLAG_KEY } from './v1-to-v2';
export type { MigrationResult } from './v1-to-v2';
