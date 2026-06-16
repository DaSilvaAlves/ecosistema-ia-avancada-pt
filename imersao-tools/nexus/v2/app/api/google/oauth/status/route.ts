import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTokens } from '@/lib/google/token-store';

/**
 * Nexus v2 — Estado da ligação Google Calendar (Story 6.1, T4, AC4)
 *
 * Rota `/api/google/oauth/status` — Node runtime. Permite ao componente
 * `GoogleCalendarSettings` saber se o calendário está `ligado` (KV tem tokens).
 *
 * Auth (AC6): só o Eurico autenticado pode consultar o estado → 401 sem sessão.
 *
 * Segurança crítica: NUNCA devolve os tokens nem qualquer fragmento deles. Apenas
 * um booleano `connected` (presença/ausência do registo no KV). A validade fina
 * (`expiresAt`/refresh) é da 6.2 — a 6.1 reporta `ligado` se o registo existe
 * (`internal-state-contract-gate.md` eixo a: classes `não-existente`/`válido`).
 *
 * Trace: AC4, AC6; [D-6.1-SCOPE] (lê via seam token-store, não kv directo).
 */

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const tokens = await getTokens();
    return NextResponse.json({ connected: tokens !== null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/status] falha ao ler estado:', message);
    // Falha de KV → reporta não-ligado em vez de assumir ligado (fail-safe; nunca
    // afirmar `ligado` sem prova — eixo a/c).
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
