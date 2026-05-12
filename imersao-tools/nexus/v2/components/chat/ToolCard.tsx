'use client';

import {
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
  Undo2,
  X,
} from 'lucide-react';
import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react';

/**
 * Nexus v2 — ToolCard component (Story 1.9 AC3 + AC4 + AC9)
 *
 * Cartão visual representando uma tool call no chat. 6 estados conforme
 * front-end-spec §4.1: `loading`, `success`, `error`, `preview-required`,
 * `reverted`, `interrupted`.
 *
 * Trace canónico:
 * - Front-end-spec §4.1 — 6 estados, tokens visuais exactos, animações
 * - Story 1.9 AC3 — todos os 6 estados implementados
 * - Story 1.9 AC4 — flow `preview-required` confirmar/cancelar
 * - Story 1.9 AC9 — WCAG 2.1 AA: aria-label nos botões, foco automático
 * - Design-system-ia-avancada — tokens exactos (cores, raios, tipografia)
 *
 * Usado por `MessageList` para renderizar tool calls inline nas mensagens
 * do agente. O state é determinado pelo `useAgentStream` hook que mapeia
 * os SSE events (`tool_start` → loading, `preview_request` → preview-required,
 * `preview_confirmed` + `tool_complete` → success, `tool_error` → error,
 * `markRunReverted` → reverted).
 */

export type ToolCardState =
  | 'loading'
  | 'success'
  | 'error'
  | 'preview-required'
  | 'reverted'
  | 'interrupted';

export interface ToolCardProps {
  /** Nome da tool (ex.: "criar_evento", "criar_transacao") — exibido como título. */
  toolName: string;
  /** Estado visual canónico — determina cor/icon/copy. */
  state: ToolCardState;
  /** Argumentos validados (pós-Zod) que serão passados à tool. */
  args: unknown;
  /** Resultado da execução (apenas em `success`). */
  result?: unknown;
  /** Mensagem PT-PT (apenas em `error` / `interrupted`). */
  error?: string;
  /** Confidence score [0..1] do classifier (apenas em `preview-required` low_confidence). */
  confidence?: number;
  /** Callback do botão "Confirmar e gravar" em `preview-required`. */
  onConfirm?: () => void;
  /** Callback do botão "Cancelar" em `preview-required`. */
  onCancel?: () => void;
  /** Callback do botão "Tentar de novo" em `error`. */
  onRetry?: () => void;
}

/**
 * Tokens exactos por estado — ler tabela como contrato visual da spec §4.1.
 * Evita literals dispersos pela render — facilita revisão visual e mudanças.
 */
interface StateTokens {
  borderColor: string;
  background: string;
  iconColor: string;
  pulseAnimation?: 'pulse-cyan' | 'pulse-gold-slow';
  borderStyle?: 'solid' | 'dashed';
}

const STATE_TOKENS: Record<ToolCardState, StateTokens> = {
  loading: {
    borderColor: 'rgba(0,245,255,0.5)',
    background: 'rgba(0,245,255,0.04)',
    iconColor: '#00F5FF',
    pulseAnimation: 'pulse-cyan',
  },
  success: {
    borderColor: 'rgba(57,255,20,0.4)',
    background: 'rgba(57,255,20,0.04)',
    iconColor: '#39FF14',
  },
  error: {
    borderColor: 'rgba(255,0,110,0.5)',
    background: 'rgba(255,0,110,0.04)',
    iconColor: '#FF006E',
  },
  'preview-required': {
    borderColor: 'rgba(255,184,0,0.5)',
    background: 'rgba(255,184,0,0.04)',
    iconColor: '#FFB800',
    pulseAnimation: 'pulse-gold-slow',
  },
  reverted: {
    borderColor: 'rgba(136,146,164,0.4)',
    background: 'rgba(255,255,255,0.02)',
    iconColor: '#8892A4',
    borderStyle: 'dashed',
  },
  interrupted: {
    borderColor: 'rgba(255,184,0,0.4)',
    background: 'rgba(255,255,255,0.02)',
    iconColor: '#FFB800',
  },
};

/**
 * Mapeia o `state` para o ícone canónico da spec §4.1.
 */
function StateIcon({ state, color }: { state: ToolCardState; color: string }): ReactElement {
  const size = 18;
  const props = { size, color, 'aria-hidden': true } as const;
  if (state === 'loading') {
    return (
      <span style={{ display: 'inline-flex', animation: 'nexus-spin 1s linear infinite' }}>
        <Loader2 {...props} />
      </span>
    );
  }
  if (state === 'success') return <Check {...props} />;
  if (state === 'error') return <X {...props} />;
  if (state === 'preview-required') return <AlertTriangle {...props} />;
  if (state === 'reverted') return <Undo2 {...props} />;
  return <AlertCircle {...props} />;
}

/**
 * Devolve o título humano para a tool — em PT-PT. Story 1.9 mantém-se
 * minimalista (toolName cru); Stories 2-7 podem traduzir via i18n.
 *
 * Exemplo: `"criar_evento"` → `"criar_evento"` (sem transformação por agora).
 * Decisão pragmática: o classifier usa snake_case canónico que é legível
 * para o utilizador alvo (Eurico), e Stories 2-7 vão definir labels mais
 * humanas via tool registry metadata.
 */
function toolTitle(toolName: string, state: ToolCardState): string {
  if (state === 'loading') return `${toolName} — a processar...`;
  if (state === 'preview-required') return `Confirmar acção: ${toolName}`;
  if (state === 'reverted') return `${toolName} — anulado`;
  if (state === 'interrupted') return `${toolName} — interrompida`;
  if (state === 'error') return `${toolName} — falhou`;
  return toolName;
}

/**
 * Formata `args`/`result` para exibição. Usa `JSON.stringify` com indent
 * apenas quando há estrutura — primitivos vão directos.
 */
function formatPayload(payload: unknown): string {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  background: '#FFB800',
  color: '#04040A',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: '0.2s',
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  color: '#F0F4FF',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  padding: '8px 14px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: '0.2s',
};

const RETRY_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  color: '#FF006E',
  border: '1px solid rgba(255,0,110,0.4)',
  borderRadius: 6,
  padding: '6px 12px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: '0.2s',
  marginTop: 8,
};

export function ToolCard(props: ToolCardProps): ReactElement {
  const { toolName, state, args, result, error, confidence, onConfirm, onCancel, onRetry } = props;
  const tokens = STATE_TOKENS[state];
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // AC9 — foco automático no botão "Confirmar" ao entrar em preview-required
  useEffect(() => {
    if (state === 'preview-required' && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [state]);

  const titleStyle: CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: state === 'reverted' ? '#8892A4' : '#F0F4FF',
    textDecoration: state === 'reverted' ? 'line-through' : 'none',
  };

  // Story 1.9 Iter 2 — keyframes definidos em `styles/globals.css` (prefixo
  // `nexus-`). `<style jsx>` removido (não está instalado neste projecto
  // Next 14 e era inert). CodeRabbit Iter 1 #3.
  const animationValue =
    tokens.pulseAnimation === 'pulse-cyan'
      ? 'nexus-tool-card-enter 200ms ease-out, nexus-pulse-cyan 1.5s ease-in-out infinite'
      : tokens.pulseAnimation === 'pulse-gold-slow'
        ? 'nexus-tool-card-enter 200ms ease-out, nexus-pulse-gold-slow 2.4s ease-in-out infinite'
        : 'nexus-tool-card-enter 200ms ease-out';

  const cardStyle: CSSProperties = {
    border: `1px ${tokens.borderStyle ?? 'solid'} ${tokens.borderColor}`,
    borderRadius: 12,
    padding: '12px 16px',
    background: tokens.background,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: '250ms ease-out',
    animation: animationValue,
  };

  return (
    <div
      role="article"
      aria-label={`Tool ${toolName} — estado ${state}`}
      data-testid="tool-card"
      data-state={state}
      data-animation={animationValue}
      style={cardStyle}
    >
      {/* Header: ícone + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <StateIcon state={state} color={tokens.iconColor} />
        <span style={titleStyle}>{toolTitle(toolName, state)}</span>
      </div>

      {/* Conteúdo: args (sempre) + result (em success) + error (em error/interrupted) */}
      {state !== 'reverted' && (
        <pre
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
            color: '#8892A4',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          {formatPayload(args)}
        </pre>
      )}

      {state === 'success' && result !== undefined && result !== null && (
        <pre
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
            color: '#39FF14',
            margin: '8px 0 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 120,
            overflowY: 'auto',
          }}
        >
          {formatPayload(result)}
        </pre>
      )}

      {(state === 'error' || state === 'interrupted') && error && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: state === 'error' ? '#FF006E' : '#FFB800',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

      {/* Confidence badge — apenas em preview-required low_confidence */}
      {state === 'preview-required' && confidence !== undefined && (
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: '#FFB800',
            margin: '8px 0 0',
            letterSpacing: '0.05em',
          }}
        >
          confidence: {(confidence * 100).toFixed(0)}%
        </p>
      )}

      {/* Action buttons */}
      {state === 'preview-required' && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            ref={confirmButtonRef}
            data-testid="preview-confirm"
            onClick={onConfirm}
            aria-label="Confirmar e gravar acção"
            style={PRIMARY_BUTTON_STYLE}
          >
            Confirmar e gravar
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar acção"
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancelar
          </button>
        </div>
      )}

      {state === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Tentar acção de novo"
          style={RETRY_BUTTON_STYLE}
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
