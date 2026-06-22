import { kv } from '@vercel/kv';
import { z } from 'zod';

/**
 * Nexus v2 — Mirror server-side da agenda de lembretes em Vercel KV (Story 4.8)
 *
 * Server-only: importa `@vercel/kv`. NUNCA importar em código client (o client
 * fala com este store apenas via `fetch` a `/api/push/schedule`).
 *
 * A fonte-de-verdade dos lembretes é Dexie/IndexedDB (client-only) — o servidor
 * não a lê. Para o disparo server-side (`/api/push/dispatch`, app possivelmente
 * fechada) o client espelha `{id, fireAt, text, status}` de cada lembrete para
 * este mirror nos handlers de CRUD (`/api/push/schedule`).
 *
 * DEV-DECISION D-KV-HASH (FLAG @architect): a agenda vive num **hash** Redis
 * `nexus:push:schedule` (field = id do lembrete), não numa chave por id. Razão:
 * o dispatch enumera todos os devidos com um único `hgetall` — evita `kv.keys()`
 * / `scan` (anti-pattern em Redis de produção), é atómico por field, e mantém o
 * prefixo `nexus:` (ADR-6). A decisão de entrada referia `nexus:push:schedule:<id>`;
 * o hash preserva o mesmo namespace lógico com enumeração O(1) por chamada.
 *
 * Trace: Story 4.8 AC3.2/AC3.3; Architect Gate (a) pontos 2-3; ADR-6.
 */

const SCHEDULE_KEY = 'nexus:push:schedule';

/**
 * Estado de um lembrete no mirror. `status`: `pending` = a aguardar disparo;
 * `sent` = disparado pelo dispatch (aguarda reconciliação client → Dexie).
 * `cancelled` nunca entra no mirror (o client remove-o via DELETE).
 *
 * D-SNOOZE-CONTRACT (Story 4.9, Architect Gate Iter 3): `snoozedAt?` é o marcador
 * dedicado e inequívoco de "adiado pelo utilizador". É ORTOGONAL a `status`:
 * `status` exprime "a aguardar disparo / disparado"; `snoozedAt` (epoch ms do
 * snooze) exprime "foi adiado". Uma entrada adiada por snooze mantém
 * `status: 'pending'` (para o dispatch re-disparar quando o novo `fireAt` chegar)
 * E ganha `snoozedAt`. O campo é OPCIONAL → entradas escritas pela 4.8
 * (`putReminderSchedule`, sem `snoozedAt`) continuam válidas (retrocompatível;
 * `listSchedules` não as descarta). A reconciliação on-mount actua só sobre
 * entradas com `snoozedAt` definido — nunca sobre o conjunto `pending` inteiro.
 */
export const ScheduleEntrySchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  fireAt: z.number().int().positive('fireAt deve ser epoch ms positivo'),
  text: z.string().min(1, 'text ausente'),
  status: z.enum(['pending', 'sent']),
  // D-SNOOZE-CONTRACT: presente ⇔ entrada adiada pelo utilizador via "Snooze".
  // Ausente nas entradas normais escritas pelo CRUD de lembretes (4.8).
  snoozedAt: z.number().int().positive().optional(),
  // [D-6.16-CHANNEL-COUPLING] (Story 6.16): canais de entrega declarados do
  // lembrete, espelhados de `Reminder.channels` (Dexie client-only). ADITIVO e
  // OPCIONAL — entradas escritas pela 4.8 (sem `channels`) continuam válidas
  // (mesmo precedente de `snoozedAt?`); o dispatcher trata `undefined` como
  // `['push']` (comportamento Epic 4 byte-a-byte preservado — AC2/C1). O `Zod`
  // não tem `.strict()`: campos extra são strippados, nunca rejeitados.
  channels: z.array(z.enum(['push', 'telegram'])).optional(),
});

export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

/**
 * Insere ou actualiza a entrada de agenda de um lembrete (idempotente por id).
 */
export async function putSchedule(entry: ScheduleEntry): Promise<void> {
  await kv.hset(SCHEDULE_KEY, { [entry.id]: entry });
}

/**
 * Remove a entrada de agenda de um lembrete (no-op se ausente).
 */
export async function deleteSchedule(id: string): Promise<void> {
  await kv.hdel(SCHEDULE_KEY, id);
}

/**
 * Lê todas as entradas de agenda. Devolve `[]` se o hash não existir.
 * Entradas malformadas (schema inválido) são descartadas defensivamente — uma
 * entrada corrompida nunca bloqueia o dispatch das restantes.
 */
export async function listSchedules(): Promise<ScheduleEntry[]> {
  const raw = await kv.hgetall<Record<string, unknown>>(SCHEDULE_KEY);
  if (!raw) return [];
  const entries: ScheduleEntry[] = [];
  for (const value of Object.values(raw)) {
    const parsed = ScheduleEntrySchema.safeParse(value);
    if (parsed.success) entries.push(parsed.data);
  }
  return entries;
}

/**
 * Marca uma entrada como `sent` (transição idempotente após o disparo). Mantém
 * `fireAt`/`text` para a reconciliação client poder identificar o lembrete.
 */
export async function markScheduleSent(entry: ScheduleEntry): Promise<void> {
  await kv.hset(SCHEDULE_KEY, { [entry.id]: { ...entry, status: 'sent' } });
}
