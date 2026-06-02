'use client';

import { usePushSubscription } from '@/hooks/usePushSubscription';

/**
 * Nexus v2 — PushPermissionPrompt (Story 4.7, AC11 — componente novo)
 *
 * Pede e mostra o estado da subscrição Web Push. Story 0.7 não entregou UI de
 * push (SF-2), por isso este componente é criado de raiz. Integra-se nas
 * definições e no primeiro acesso (FR35).
 *
 * 3 estados de render distintos (react-component-test-criteria.md → ≥3 → teste
 * de componente obrigatório, C1-C3):
 *   1. `default`  — ainda não pediu permissão → botão "Activar notificações".
 *   2. `granted` + subscrito → badge "Notificações activas" + "Desactivar".
 *   3. `denied` / sem suporte → mensagem de bloqueio, sem botão.
 *
 * Design system: fundo `#04040A`, glassmorphism, Inter, Cyan `#00F5FF`,
 * Lime `#39FF14`. `aria-live="polite"` no sucesso, `role="status"` no badge.
 */

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
};

export function PushPermissionPrompt(): React.ReactElement {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushSubscription();

  // Estado 2 — permissão concedida e subscrição activa.
  if (permission === 'granted' && isSubscribed) {
    return (
      <div style={CARD_STYLE} aria-live="polite">
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
          Notificações activas
        </span>
        <button
          type="button"
          style={{ ...SECONDARY_BUTTON_STYLE, alignSelf: 'flex-start' }}
          onClick={() => void unsubscribe()}
          disabled={isLoading}
        >
          {isLoading ? 'A desactivar…' : 'Desactivar'}
        </button>
      </div>
    );
  }

  // Estado 3 — bloqueado ou sem suporte.
  if (permission === 'denied') {
    return (
      <div style={CARD_STYLE}>
        <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem' }}>
          O teu browser bloqueou as notificações. Para activar, vai às definições
          do browser e permite notificações para este site.
        </p>
      </div>
    );
  }

  // Estado 1 — ainda não pediu (default).
  return (
    <div style={CARD_STYLE}>
      <button
        type="button"
        style={PRIMARY_BUTTON_STYLE}
        onClick={() => void subscribe()}
        disabled={isLoading}
      >
        {isLoading ? 'A activar…' : 'Activar notificações'}
      </button>
    </div>
  );
}
