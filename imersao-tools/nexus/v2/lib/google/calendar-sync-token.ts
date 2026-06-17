import { kv } from '@vercel/kv';

/**
 * Nexus v2 — Persistência do cursor de sync do Google Calendar (Story 6.3 — T3)
 *
 * Decisão @architect `[D-6.3-SYNC-TOKEN]`: o `nextSyncToken` vive numa chave KV
 * DEDICADA (`nexus:google:calendar:syncToken`), SEPARADA de `nexus:google:tokens`
 * (os tokens OAuth). Razão: separação de responsabilidades — o cursor de sync é
 * estado operacional do calendário, não credencial. O caso 410 Gone apaga SÓ esta
 * chave (`kv.del`), sem nunca tocar nos tokens OAuth.
 *
 * Quem chama: a ROUTE (`/api/google/calendar/sync`), não o helper puro
 * `calendar.ts` (que recebe/devolve o token por parâmetro). Esta separação mantém
 * o helper testável a ~100% sem o KV.
 *
 * Prefixo `nexus:` obrigatório (ADR-6). Server-only: importa `@vercel/kv`. NUNCA
 * importar em código client. Node runtime obrigatório (ADR-1).
 *
 * Trace: AC2; [D-6.3-SYNC-TOKEN]; arch §6 (KV schema).
 */

/** Chave KV dedicada do cursor de sync do calendário (arch §6, [D-6.3-SYNC-TOKEN]). */
export const CALENDAR_SYNC_TOKEN_KEY = 'nexus:google:calendar:syncToken';

/**
 * Lê o cursor de sync guardado. Devolve `null` se ausente (primeira sincronização
 * ou após um 410 que o apagou) — o helper interpreta `null` como full resync.
 *
 * Defensivo: aceita tanto a forma `string` directa como `{ syncToken: string }`
 * (o spawn ratificou ambas as formas como válidas para esta chave).
 */
export async function getCalendarSyncToken(): Promise<string | null> {
  const raw = await kv.get<unknown>(CALENDAR_SYNC_TOKEN_KEY);
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return raw;
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { syncToken?: unknown }).syncToken === 'string'
  ) {
    return (raw as { syncToken: string }).syncToken;
  }
  // Forma inesperada (corrompido/legado) → tratar como ausente (força full resync).
  return null;
}

/** Persiste o cursor de sync para o próximo sync (atómico, só após sync bem-sucedido). */
export async function setCalendarSyncToken(token: string): Promise<void> {
  await kv.set(CALENDAR_SYNC_TOKEN_KEY, token);
}

/**
 * Apaga o cursor de sync (no-op se ausente). Usado pelo caminho 410 Gone — apaga
 * SÓ esta chave, nunca os tokens OAuth ([D-6.3-SYNC-TOKEN]).
 */
export async function deleteCalendarSyncToken(): Promise<void> {
  await kv.del(CALENDAR_SYNC_TOKEN_KEY);
}
