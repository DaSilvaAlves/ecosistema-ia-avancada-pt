'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Nexus v2 — Definições da ligação Google Calendar
 * (Story 6.1, T4 + Story 6.2, T5, AC4)
 *
 * Máquina de estados de render (`react-component-test-criteria.md` → ≥3 estados →
 * teste de componente obrigatório):
 *   Estados base (6.1):
 *     - `nao-ligado`  — botão "Ligar ao Google Calendar" activo; sem conta.
 *     - `a-autorizar` — durante a verificação de estado / redirect (spinner).
 *     - `ligado`      — calendário ligado; botão "Desligar" funcional (6.2).
 *     - `erro`        — mensagem PT-PT por tipo + CTA de retentar ([D-6.1-ERROR]).
 *   Estados adicionados pela 6.2 (AC4):
 *     - `a-revogar`        — loading durante a revogação ("Desligar").
 *     - `revogado-externo` — o `refreshToken` foi revogado fora do Nexus
 *                            (`invalid_grant`); requer NOVA autorização OAuth (CTA).
 *
 * Nota ([D-6.2-REFRESH], reconciliação R1): `expirado-renovável` é TRANSPARENTE —
 * o refresh do accessToken é proactivo e automático no servidor
 * (`getValidAccessToken`); o utilizador NÃO precisa de fazer nada e o estado
 * apresentado continua `ligado`. Só `revogado-externo` (refreshToken inválido)
 * exige acção do utilizador. O estado transitório existente chama-se `a-autorizar`.
 *
 * As strings de erro PT-PT vivem AQUI, no componente. O componente lê o estado
 * `ligado` via `/api/google/oauth/status` e revoga via `POST /api/google/oauth/revoke`
 * (props `*Endpoint`/`fetchImpl` injectáveis para teste).
 *
 * Design system (`design-system-ia-avancada.md`): fundo `#04040A`, glassmorphism,
 * Inter, Cyan `#00F5FF`, Lime `#39FF14`, Magenta `#FF006E`. `aria-live` nos
 * estados transitórios; botões com nomes acessíveis.
 *
 * Trace: AC4, AC6 (não expõe token); [D-6.1-ERROR]; [D-6.2-REVOKE];
 * [D-6.2-REFRESH]; `internal-state-contract-gate.md` eixo a.
 */

/** Tipos de erro fechados ([D-6.1-ERROR]) + fallback genérico. */
export type GoogleOAuthError =
  | 'access_denied'
  | 'invalid_state'
  | 'token_exchange_failed'
  | 'storage_failed'
  | 'start_failed';

const ERROR_MESSAGES: Record<GoogleOAuthError, string> = {
  access_denied:
    'A autorização foi cancelada ou recusada. Para ligar o calendário, tens de permitir o acesso no ecrã do Google.',
  invalid_state:
    'O pedido de autorização expirou ou era inválido. Por segurança, tenta ligar novamente.',
  token_exchange_failed:
    'Não foi possível concluir a ligação ao Google. Tenta novamente dentro de momentos.',
  storage_failed:
    'A ligação foi autorizada mas não foi possível guardá-la. Tenta novamente.',
  start_failed:
    'Não foi possível iniciar a ligação ao Google. Verifica a configuração e tenta novamente.',
};

const GENERIC_ERROR =
  'Ocorreu um erro a ligar o Google Calendar. Tenta novamente.';

/** Mensagem do estado `revogado-externo` (refreshToken inválido — requer re-auth). */
const REVOKED_EXTERNAL_MESSAGE =
  'A ligação ao Google deixou de ser válida (foi revogada ou expirou). Para continuar, autoriza novamente o acesso ao calendário.';

/** Mensagem de falha da revogação (Google indisponível — KV preservado). */
const REVOKE_FAILED_MESSAGE =
  'Não foi possível desligar a ligação ao Google neste momento. Tenta novamente dentro de momentos.';

type RenderState =
  | 'nao-ligado'
  | 'a-autorizar'
  | 'ligado'
  | 'a-revogar'
  | 'revogado-externo'
  | 'erro';

export interface GoogleCalendarSettingsProps {
  /** Tipo de erro vindo do query param `?error=` (callback). `null` se ausente. */
  initialError?: GoogleOAuthError | string | null;
  /** Endpoint que reporta `{ connected: boolean }`. Default: rota real. */
  statusEndpoint?: string;
  /** Endpoint de início do fluxo (redirect). Default: rota real. */
  startEndpoint?: string;
  /** Endpoint de revogação ("Desligar"). Default: rota real. */
  revokeEndpoint?: string;
  /** `fetch` injectável para teste. Default: `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
  /**
   * Estado de ligação inicial conhecido (evita o fetch em teste/SSR). Se
   * fornecido, o componente NÃO faz o fetch de estado.
   */
  initialConnected?: boolean;
  /**
   * Sinaliza que o `refreshToken` foi revogado externamente (`invalid_grant`):
   * o componente arranca em `revogado-externo` com CTA de re-autorização.
   * Derivado pela página (resultado de `getValidAccessToken`) — não é um estado
   * persistido no componente.
   */
  initialRevokedExternal?: boolean;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  padding: '1.25rem',
  fontFamily: 'Inter, sans-serif',
  color: '#F0F4FF',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  background: '#00F5FF',
  boxShadow: '0 0 20px rgba(0,245,255,0.4)',
  color: '#04040A',
  padding: '0.65rem 1.4rem',
  borderRadius: 6,
  border: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start',
  transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

const SECONDARY_BUTTON_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#F0F4FF',
  padding: '0.5rem 1.1rem',
  borderRadius: 6,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

function resolveErrorMessage(error: string): string {
  if (error in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error as GoogleOAuthError];
  }
  return GENERIC_ERROR;
}

export function GoogleCalendarSettings({
  initialError = null,
  statusEndpoint = '/api/google/oauth/status',
  startEndpoint = '/api/google/oauth/start',
  revokeEndpoint = '/api/google/oauth/revoke',
  fetchImpl,
  initialConnected,
  initialRevokedExternal = false,
}: GoogleCalendarSettingsProps): React.ReactElement {
  const hasInitialConnected = typeof initialConnected === 'boolean';
  const [connected, setConnected] = useState<boolean>(initialConnected ?? false);
  // Se já temos o erro, o estado de ligação ou a revogação externa, não há fetch.
  const [checking, setChecking] = useState<boolean>(
    !initialError && !hasInitialConnected && !initialRevokedExternal,
  );
  // Estado de revogação ("Desligar"): idle | revoking | failed (mantém-se ligado).
  const [revoking, setRevoking] = useState<boolean>(false);
  const [revokedExternal, setRevokedExternal] = useState<boolean>(initialRevokedExternal);
  const [revokeFailed, setRevokeFailed] = useState<boolean>(false);

  useEffect(() => {
    if (initialError || hasInitialConnected || initialRevokedExternal) return;

    let cancelled = false;
    const doFetch = fetchImpl ?? globalThis.fetch;

    (async () => {
      try {
        const res = await doFetch(statusEndpoint, { credentials: 'same-origin' });
        if (!res.ok) {
          // Falha → assume não-ligado (fail-safe, nunca afirmar ligado sem prova).
          if (!cancelled) setConnected(false);
          return;
        }
        const json = (await res.json()) as { connected?: boolean };
        if (!cancelled) setConnected(json.connected === true);
      } catch {
        if (!cancelled) setConnected(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialError, hasInitialConnected, initialRevokedExternal, statusEndpoint, fetchImpl]);

  const handleConnect = useCallback(() => {
    // Navegação full-page para a route de início (que redirige ao Google).
    window.location.assign(startEndpoint);
  }, [startEndpoint]);

  const handleRevoke = useCallback(async () => {
    const doFetch = fetchImpl ?? globalThis.fetch;
    setRevokeFailed(false);
    setRevoking(true);
    try {
      const res = await doFetch(revokeEndpoint, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (res.ok) {
        // Revogação completa → transição para `não-ligado`.
        setConnected(false);
        setRevokedExternal(false);
      } else {
        // Google indisponível ([D-6.2-REVOKE-PARTIAL]: KV preservado) → mantém
        // `ligado` e mostra aviso de retentar.
        setRevokeFailed(true);
      }
    } catch {
      setRevokeFailed(true);
    } finally {
      setRevoking(false);
    }
  }, [revokeEndpoint, fetchImpl]);

  const state: RenderState = initialError
    ? 'erro'
    : revoking
      ? 'a-revogar'
      : revokedExternal
        ? 'revogado-externo'
        : checking
          ? 'a-autorizar'
          : connected
            ? 'ligado'
            : 'nao-ligado';

  return (
    <section style={CARD_STYLE} aria-labelledby="google-calendar-heading">
      <h3
        id="google-calendar-heading"
        style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}
      >
        Google Calendar
      </h3>

      {state === 'erro' && initialError && (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              fontSize: '0.95rem',
              color: '#FF006E',
            }}
          >
            {resolveErrorMessage(String(initialError))}
          </p>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleConnect}>
            Tentar novamente
          </button>
        </div>
      )}

      {state === 'revogado-externo' && (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              fontSize: '0.95rem',
              color: '#FF006E',
            }}
          >
            {REVOKED_EXTERNAL_MESSAGE}
          </p>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleConnect}>
            Autorizar novamente
          </button>
        </div>
      )}

      {state === 'a-revogar' && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A desligar a ligação ao Google Calendar…
        </p>
      )}

      {state === 'a-autorizar' && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A verificar a ligação ao Google Calendar…
        </p>
      )}

      {state === 'ligado' && (
        <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span
            role="status"
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              background: 'rgba(57,255,20,0.08)',
              border: '1px solid rgba(57,255,20,0.2)',
              borderRadius: 20,
              color: '#39FF14',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              padding: '0.3rem 0.8rem',
            }}
          >
            Calendário ligado
          </span>
          {revokeFailed && (
            <p
              role="alert"
              style={{ margin: 0, lineHeight: 1.8, fontSize: '0.9rem', color: '#FF006E' }}
            >
              {REVOKE_FAILED_MESSAGE}
            </p>
          )}
          <button
            type="button"
            style={SECONDARY_BUTTON_STYLE}
            onClick={handleRevoke}
          >
            Desligar
          </button>
        </div>
      )}

      {state === 'nao-ligado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}>
            Liga o teu Google Calendar para que o Nexus possa aceder aos teus eventos.
          </p>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleConnect}>
            Ligar ao Google Calendar
          </button>
        </div>
      )}
    </section>
  );
}
