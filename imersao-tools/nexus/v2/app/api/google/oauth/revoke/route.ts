import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { revokeToken, TokenRevokeError } from '@/lib/google/oauth';
import { getTokens, deleteTokens } from '@/lib/google/token-store';

/**
 * Nexus v2 — Revogação da ligação Google ("Desligar") (Story 6.2, T4, AC3)
 *
 * Rota `POST /api/google/oauth/revoke` — Node runtime (ADR-1: `googleapis`/
 * `crypto`/`@vercel/kv` são Node-only). Invocada pelo botão "Desligar" da UI
 * (`GoogleCalendarSettings`).
 *
 * Fluxo ([D-6.2-REVOKE]=(A) + [D-6.2-REVOKE-PARTIAL]=(A)):
 *   1. Verifica sessão (`getSession`) → 401 sem sessão (AC6 — só o Eurico revoga).
 *   2. Lê+desencripta o `refreshToken` de KV (via seam token-store, [D-6.1-SCOPE]).
 *      - KV ausente (sem tokens) → 200 OK idempotente (já desligado; estado-alvo
 *        alcançado — nunca crash, nunca silent loss; eixo b da 4.9 evitado).
 *   3. Revoga o `refreshToken` no Google (`revokeToken` — T3):
 *      - 200/400 (idempotente) → prossegue para apagar KV.
 *      - 5xx/rede (TokenRevokeError) → NÃO apaga KV; responde 502 (erro à UI),
 *        preservando a coerência (a autorização pode continuar viva no Google).
 *   4. Apaga o KV (`deleteTokens`) → `getTokens()` passa a devolver `null`.
 *   5. Responde 200 `{ revoked: true }`.
 *
 * Análise de ciclo de vida (`internal-state-contract-gate.md`):
 *   (a) estado-alvo: `não-existente` (desligado).
 *   (b) transição-já-ocorrida: KV ausente → 200 idempotente (não 500).
 *   (c) caminho de falha: Google indisponível → 502, KV preservado (não apaga).
 *
 * Segurança (AC6): o `refreshToken` NUNCA aparece na resposta nem em logs.
 *
 * Trace: AC3, AC6, AC7; [D-6.2-REVOKE]; [D-6.2-REVOKE-PARTIAL]; [D-6.1-SCOPE];
 * `internal-state-contract-gate.md` eixos a/b/c.
 */

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // Lê os tokens (desencriptados via seam). Falha de leitura de KV é tratada como
  // erro de infraestrutura — não apagar nada às cegas.
  let tokens: Awaited<ReturnType<typeof getTokens>>;
  try {
    tokens = await getTokens();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/revoke] falha ao ler tokens de KV:', message);
    return NextResponse.json(
      { error: 'Não foi possível ler o estado da ligação.' },
      { status: 502 },
    );
  }

  // KV ausente → já desligado. Idempotente (200), nunca silent loss nem crash.
  if (!tokens) {
    return NextResponse.json({ revoked: true, alreadyDisconnected: true }, { status: 200 });
  }

  // Revoga o refreshToken no Google. [D-6.2-REVOKE-PARTIAL]: 200/400 → idempotente
  // (prossegue para apagar KV); transporte/5xx (TokenRevokeError) → NÃO apaga KV.
  try {
    await revokeToken(tokens.refreshToken);
  } catch (err) {
    if (err instanceof TokenRevokeError) {
      // Google indisponível — não sabemos o estado da autorização. Preservar KV
      // (coerência): não deixar o utilizador "desligado" no Nexus mas com
      // autorização viva no Google sem caminho de revogação.
      console.error('[google/oauth/revoke] Google indisponível na revogação:', err.message);
      return NextResponse.json(
        { error: 'O Google está indisponível. Tenta novamente dentro de momentos.' },
        { status: 502 },
      );
    }
    // Erro inesperado — não logar o token.
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/revoke] erro inesperado na revogação:', message);
    return NextResponse.json(
      { error: 'Não foi possível desligar a ligação ao Google.' },
      { status: 502 },
    );
  }

  // Revogação bem-sucedida (ou idempotente). Apaga o KV.
  try {
    await deleteTokens();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/revoke] falha ao apagar tokens de KV:', message);
    return NextResponse.json(
      { error: 'A ligação foi revogada mas não foi possível limpar o estado local.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ revoked: true }, { status: 200 });
}
