'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Nexus v2 — Definições da ligação Gmail (Story 6.7, T4, AC4)
 *
 * Componente NOVO e autónomo ([D-6.7-UI-COMPONENT] (A)): paralelo a
 * `GoogleCalendarSettings.tsx`, que NÃO é alterado. O OAuth Gmail é incremental —
 * a mesma autorização Google que cobre o Calendar passa a cobrir também o Gmail
 * (`gmail.modify`). Por isso a revogação é TUDO-OU-NADA para o client OAuth:
 * desligar o Gmail desliga também o Calendar (aviso explícito no estado `ligado`).
 *
 * Máquina de estados de render (`react-component-test-criteria.md` → ≥3 estados →
 * teste de componente obrigatório):
 *   - `nao-ligado`  — botão "Ligar ao Gmail" activo; inicia `?scope=gmail`.
 *   - `a-autorizar` — durante a verificação de estado (spinner).
 *   - `ligado`      — Gmail autorizado; botão "Desligar" (revogação partilhada).
 *   - `a-revogar`   — loading durante a revogação ("Desligar").
 *   - `erro`        — mensagem PT-PT por tipo + CTA de retentar ([D-6.1-ERROR]).
 *
 * O componente lê `gmailConnected` de `/api/google/oauth/status` (expandido na
 * 6.7) e revoga via `POST /api/google/oauth/revoke` (seam da 6.2, partilhado).
 * Props `*Endpoint`/`fetchImpl`/`initial*` injectáveis para teste/SSR.
 *
 * Design system (`design-system-ia-avancada.md`): fundo `#04040A`, glassmorphism,
 * Inter, Cyan `#00F5FF`, Lime `#39FF14`, Magenta `#FF006E`. `aria-live` nos
 * estados transitórios; botões com nomes acessíveis.
 *
 * Trace: AC1/AC3/AC4/AC6; [D-6.7-INCREMENTAL]; [D-6.7-STATUS]; [D-6.7-UI-COMPONENT];
 * [D-6.1-ERROR]; [D-6.2-REVOKE].
 */

/** Tipos de erro fechados ([D-6.1-ERROR]) + fallback genérico (reutilizados da 6.1). */
export type GmailOAuthError =
  | 'access_denied'
  | 'invalid_state'
  | 'token_exchange_failed'
  | 'storage_failed'
  | 'start_failed';

const ERROR_MESSAGES: Record<GmailOAuthError, string> = {
  access_denied:
    'A autorização foi cancelada ou recusada. Para ligar o Gmail, tens de permitir o acesso no ecrã do Google.',
  invalid_state:
    'O pedido de autorização expirou ou era inválido. Por segurança, tenta ligar novamente.',
  token_exchange_failed:
    'Não foi possível concluir a ligação ao Gmail. Tenta novamente dentro de momentos.',
  storage_failed:
    'A ligação foi autorizada mas não foi possível guardá-la. Tenta novamente.',
  start_failed:
    'Não foi possível iniciar a ligação ao Gmail. Verifica a configuração e tenta novamente.',
};

const GENERIC_ERROR = 'Ocorreu um erro a ligar o Gmail. Tenta novamente.';

/** Aviso de que a revogação é tudo-ou-nada (desliga também o Calendar). */
const REVOKE_FAILED_MESSAGE =
  'Não foi possível desligar a ligação ao Google neste momento. Tenta novamente dentro de momentos.';

type RenderState =
  | 'nao-ligado'
  | 'a-autorizar'
  | 'ligado'
  | 'a-revogar'
  | 'erro';

export interface GmailSettingsProps {
  /** Tipo de erro vindo do query param `?error=` (callback). `null` se ausente. */
  initialError?: GmailOAuthError | string | null;
  /** Endpoint que reporta `{ gmailConnected: boolean }`. Default: rota real. */
  statusEndpoint?: string;
  /** Endpoint de início do fluxo incremental Gmail (redirect). Default: rota real. */
  startEndpoint?: string;
  /** Endpoint de revogação ("Desligar"). Default: rota real (partilhado, tudo-ou-nada). */
  revokeEndpoint?: string;
  /** `fetch` injectável para teste. Default: `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
  /**
   * Estado de ligação Gmail inicial conhecido (evita o fetch em teste/SSR). Se
   * fornecido, o componente NÃO faz o fetch de estado.
   */
  initialGmailConnected?: boolean;
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
  // `hasOwnProperty.call` (não `in`): evita que chaves do prototype (ex.: `toString`,
  // `constructor`) num `?error=` manipulado devolvam um valor não-mensagem e partam
  // a vista de erro. Só códigos próprios mapeiam; o resto cai no genérico.
  if (Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, error)) {
    return ERROR_MESSAGES[error as GmailOAuthError];
  }
  return GENERIC_ERROR;
}

export function GmailSettings({
  initialError = null,
  statusEndpoint = '/api/google/oauth/status',
  startEndpoint = '/api/google/oauth/start?scope=gmail',
  revokeEndpoint = '/api/google/oauth/revoke',
  fetchImpl,
  initialGmailConnected,
}: GmailSettingsProps): React.ReactElement {
  const hasInitialConnected = typeof initialGmailConnected === 'boolean';
  const [connected, setConnected] = useState<boolean>(initialGmailConnected ?? false);
  const [checking, setChecking] = useState<boolean>(
    !initialError && !hasInitialConnected,
  );
  const [revoking, setRevoking] = useState<boolean>(false);
  const [revokeFailed, setRevokeFailed] = useState<boolean>(false);

  useEffect(() => {
    if (initialError || hasInitialConnected) return;

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
        const json = (await res.json()) as { gmailConnected?: boolean };
        if (!cancelled) setConnected(json.gmailConnected === true);
      } catch {
        if (!cancelled) setConnected(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialError, hasInitialConnected, statusEndpoint, fetchImpl]);

  const handleConnect = useCallback(() => {
    // Navegação full-page para a route de início incremental (que redirige ao Google).
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
        // Revogação completa → transição para `não-ligado` (tudo-ou-nada: também
        // desliga o Calendar no client OAuth; o cartão Calendar reflecte-o no
        // próximo fetch de estado).
        setConnected(false);
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
      : checking
        ? 'a-autorizar'
        : connected
          ? 'ligado'
          : 'nao-ligado';

  return (
    <section style={CARD_STYLE} aria-labelledby="gmail-heading">
      <h3 id="gmail-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
        Gmail
      </h3>

      {state === 'erro' && initialError && (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#FF006E' }}
          >
            {resolveErrorMessage(String(initialError))}
          </p>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleConnect}>
            Tentar novamente
          </button>
        </div>
      )}

      {state === 'a-revogar' && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A desligar a ligação ao Gmail…
        </p>
      )}

      {state === 'a-autorizar' && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A verificar a ligação ao Gmail…
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
            Gmail ligado
          </span>
          <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.85rem', color: '#8892A4' }}>
            A ligação ao Gmail partilha a mesma autorização Google do Calendar.
            Desligar o Gmail desliga também o Calendar.
          </p>
          {revokeFailed && (
            <p
              role="alert"
              style={{ margin: 0, lineHeight: 1.8, fontSize: '0.9rem', color: '#FF006E' }}
            >
              {REVOKE_FAILED_MESSAGE}
            </p>
          )}
          <button type="button" style={SECONDARY_BUTTON_STYLE} onClick={handleRevoke}>
            Desligar
          </button>
        </div>
      )}

      {state === 'nao-ligado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}>
            Liga o teu Gmail para que o Nexus possa aceder e organizar a tua inbox em
            teu nome.
          </p>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handleConnect}>
            Ligar ao Gmail
          </button>
        </div>
      )}
    </section>
  );
}
