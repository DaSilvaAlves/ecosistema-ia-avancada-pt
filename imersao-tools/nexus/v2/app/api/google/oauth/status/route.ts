import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  GMAIL_MODIFY_SCOPE_FRAGMENT,
  GOOGLE_CALENDAR_SCOPE,
} from '@/lib/google/oauth';
import { getTokens } from '@/lib/google/token-store';

/**
 * Nexus v2 — Estado da ligação Google (Story 6.1, T4, AC4 + Story 6.7, T3)
 *
 * Rota `/api/google/oauth/status` — Node runtime. Permite aos componentes
 * `GoogleCalendarSettings` e `GmailSettings` saberem o estado de autorização.
 *
 * Auth (AC6): só o Eurico autenticado pode consultar o estado → 401 sem sessão.
 *
 * Segurança crítica: NUNCA devolve os tokens nem qualquer fragmento deles. Apenas
 * booleanos de estado (presença no KV + scopes concedidos).
 *
 * Story 6.7 ([D-6.7-STATUS] (C-ajustada)): EXPANDE a resposta de `{ connected }`
 * para `{ connected, calendarConnected, gmailConnected }`. O campo `connected`
 * legado MANTÉM-SE (o `GoogleCalendarSettings` lê-o — INALTERADO). Os novos campos
 * derivam do `scopes` persistido (espaço-separado):
 *   - `gmailConnected`    = `scopes` inclui `gmail.modify`;
 *   - `calendarConnected` = `scopes` inclui `calendar` OU (fallback retro-compatível)
 *     `scopes` ausente (registo 6.1 legado = calendar-só).
 * Um utilizador que fez a 6.1 mas não a 6.7 → `calendarConnected:true,
 * gmailConnected:false` (eixo a — classes de estado).
 *
 * Trace: AC3, AC4, AC6; [D-6.1-SCOPE]; [D-6.7-STATUS]; `internal-state-contract-gate.md` eixo a.
 */

export const runtime = 'nodejs';

interface StatusResponse {
  connected: boolean;
  calendarConnected: boolean;
  gmailConnected: boolean;
}

const NOT_CONNECTED: StatusResponse = {
  connected: false,
  calendarConnected: false,
  gmailConnected: false,
};

export async function GET(req: Request): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const tokens = await getTokens();
    if (tokens === null) {
      return NextResponse.json(NOT_CONNECTED);
    }

    const scopes = tokens.scopes;
    const gmailConnected = scopes?.includes(GMAIL_MODIFY_SCOPE_FRAGMENT) ?? false;
    // Fallback retro-compatível (C2): registo 6.1 sem `scopes` → calendar-só.
    const calendarConnected =
      scopes === undefined ? true : scopes.includes(GOOGLE_CALENDAR_SCOPE);

    return NextResponse.json({
      connected: true,
      calendarConnected,
      gmailConnected,
    } satisfies StatusResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/status] falha ao ler estado:', message);
    // Falha de KV → reporta não-ligado em vez de assumir ligado (fail-safe; nunca
    // afirmar `ligado` sem prova — eixo a/c).
    return NextResponse.json(NOT_CONNECTED, { status: 200 });
  }
}
