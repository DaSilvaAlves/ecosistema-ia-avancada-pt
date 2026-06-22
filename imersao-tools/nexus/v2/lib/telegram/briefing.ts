import { kv } from '@vercel/kv';
import type { ScheduleEntry } from '@/lib/push/schedule-store';

/**
 * Nexus v2 — Lógica do briefing matinal por Telegram (Story 6.16 — FR74/FR75)
 *
 * Funções puras (janela horária, data de Lisboa, construção do texto) + acesso
 * KV ao marcador de idempotência (`last_sent`). Server-only: importa `@vercel/kv`.
 * NUNCA importar em código client.
 *
 * Decisões do Architect Gate de Entrada (Aria, 22/06/2026):
 *   - [D-6.16-BRIEFING-SCHEDULE] (C8): janela `[start, end[` calculada em
 *     `Europe/Lisbon` via `Intl` (robusto a DST — o offset Lisboa muda 2×/ano),
 *     NÃO no horário do scheduler externo (UTC).
 *   - [D-6.16-BRIEFING-CONTENT] (C10): conteúdo SÓ de fontes server-side. Os
 *     lembretes do dia vêm de `listSchedules()` (KV). Tarefas/hábitos/finanças/
 *     diário vivem em Dexie (client-only) e NÃO são acessíveis aqui — são
 *     DIFERIDOS com 1 linha honesta (Artigo IV — zero invenção). Débito
 *     REC-6.16-BRIEFING-RICH.
 *   - [D-6.16-STATE-CONTRACT] (C9): `last_sent` gravado SÓ após `sendMessage` OK
 *     (briefing falhado não bloqueia o re-envio — silent-loss guard).
 *
 * Trace: Story 6.16 AC6-AC10; condições C8/C9/C10.
 */

/** Chave KV do marcador de idempotência diária do briefing (AC8/C9). */
export const BRIEFING_LAST_SENT_KEY = 'nexus:telegram:briefing:last_sent';

/** Default da janela horária `[7, 9[` (hora de Lisboa) — [D-6.16-BRIEFING-SCHEDULE]. */
export const DEFAULT_BRIEFING_HOUR_START = 7;
export const DEFAULT_BRIEFING_HOUR_END = 9;

/** Fuso horário de referência do utilizador (Eurico, Lisboa). */
const LISBON_TZ = 'Europe/Lisbon';

/**
 * Hora local de Lisboa (0-23) para um instante dado. Usa `Intl` (Node tem ICU
 * full em produção Vercel) — robusto a DST sem depender de offset fixo (C8).
 */
export function lisbonHour(at: Date): number {
  const formatted = new Intl.DateTimeFormat('pt-PT', {
    timeZone: LISBON_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(at);
  // `pt-PT` com `hour12:false` pode devolver "24" à meia-noite — normaliza p/ 0.
  const hour = Number.parseInt(formatted, 10) % 24;
  return hour;
}

/**
 * Data de Lisboa em `YYYY-MM-DD` para um instante dado. Usado como chave de
 * idempotência diária (C9): comparar em fuso Lisboa, NÃO UTC — senão um envio às
 * 23h45 UTC e outro às 00h15 UTC seriam "dias diferentes" para o KV mas o mesmo
 * dia Lisboa (eixo (b) da análise de estado).
 */
export function lisbonDateKey(at: Date): string {
  // `en-CA` formata como `YYYY-MM-DD` (ISO), aplicando o fuso indicado.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LISBON_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/**
 * `true` se a hora local de Lisboa está dentro de `[start, end[` (C8). `end`
 * exclusivo (default 9 → última hora servida é 08:59).
 */
export function isWithinBriefingWindow(
  at: Date,
  start: number,
  end: number,
): boolean {
  const hour = lisbonHour(at);
  return hour >= start && hour < end;
}

/**
 * Lê o marcador `last_sent` do KV (data de Lisboa do último briefing enviado).
 * `null` se nunca enviado. Best-effort de leitura faz parte do caller.
 */
export async function getBriefingLastSent(): Promise<string | null> {
  return (await kv.get<string>(BRIEFING_LAST_SENT_KEY)) ?? null;
}

/**
 * Grava o marcador `last_sent` (data de Lisboa de hoje). Chamado SÓ após o
 * `sendMessage` ter êxito (C9 — briefing falhado não actualiza o marcador, para
 * o próximo tick poder re-tentar; silent-loss guard).
 */
export async function setBriefingLastSent(dateKey: string): Promise<void> {
  await kv.set(BRIEFING_LAST_SENT_KEY, dateKey);
}

/**
 * Lembretes cujo `fireAt` cai no dia de Lisboa de `at`. Fonte 100% server-side
 * (KV via `listSchedules`) — base mínima do conteúdo viável (C10/AC10). Inclui
 * `pending` e `sent` (o briefing dá o panorama do dia, não só o que falta).
 */
export function remindersForDay(
  schedules: ScheduleEntry[],
  at: Date,
): ScheduleEntry[] {
  const dayKey = lisbonDateKey(at);
  return schedules
    .filter((s) => lisbonDateKey(new Date(s.fireAt)) === dayKey)
    .sort((a, b) => a.fireAt - b.fireAt);
}

/**
 * Constrói o texto do briefing matinal (C10). Determinístico, sem `runAgent`
 * (com `db:null` server-side as tools de DB seriam inertes — REC-6.13-DB-BRIDGE).
 *
 * Conteúdo v1 (server-side):
 *   - cabeçalho com a data de Lisboa;
 *   - secção de lembretes do dia (de `listSchedules`);
 *   - 1 linha honesta a diferir o conteúdo rico de Dexie (Artigo IV — sem dados
 *     inventados). REC-6.16-BRIEFING-RICH.
 *
 * NUNCA devolve string vazia (o `sendMessage` rejeitaria texto vazio — C11): o
 * cabeçalho + a linha honesta garantem sempre conteúdo.
 */
export function buildBriefingText(
  reminders: ScheduleEntry[],
  at: Date,
): string {
  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    timeZone: LISBON_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(at);

  const lines: string[] = [`Bom dia. Aqui está o teu briefing de ${dateLabel}.`, ''];

  if (reminders.length > 0) {
    lines.push('Lembretes de hoje:');
    for (const r of reminders) {
      const time = new Intl.DateTimeFormat('pt-PT', {
        timeZone: LISBON_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(r.fireAt));
      lines.push(`- ${time} — ${r.text}`);
    }
  } else {
    lines.push('Não tens lembretes agendados para hoje.');
  }

  lines.push('');
  lines.push('O resumo completo do dia (tarefas, hábitos, finanças e diário) está disponível na app.');

  return lines.join('\n');
}
