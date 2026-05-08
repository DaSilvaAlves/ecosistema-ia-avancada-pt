'use client';

import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Loader2 } from 'lucide-react';
import { ToolCard, type ToolCardState } from './ToolCard';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import type { ChatMessage } from '@/types/db';

/**
 * Nexus v2 — MessageList component (Story 0.4 + Story 1.9 AC7)
 *
 * Trace canónico:
 * - Story 0.4 — base (welcome bubble, layout, design tokens)
 * - Story 1.9 AC7 — render utilizador/agente, ToolCards inline na resposta
 *   do agente, texto streaming via `text_delta`, scroll automático smart,
 *   estado "A pensar..." enquanto aguarda primeiro evento SSE
 * - Front-end-spec §1.2 Flow 2 — sequência visual do killer flow
 * - Front-end-spec §4.1 — ToolCard inline nos cards do agente
 *
 * Recebe duas fontes de dados:
 * 1. `messages: ChatMessage[]` — histórico persistido em Dexie (mensagens user
 *    + assistant de runs anteriores ou da run actual após `done`)
 * 2. `events: ExecutorSSEEvent[]` — stream da run actual; transforma em
 *    "live message bubble" do agente com ToolCards inline
 *
 * Quando há run activa (`isStreaming === true`), a lista mostra:
 *   [welcome se aplicável] → [user msg] → [agente msg streaming]
 *
 * O componente nunca persiste — é responsabilidade do `useAgentStream` hook
 * (RESOLVED-2 da Story 1.5 + AC2 da Story 1.9).
 */

export interface MessageListProps {
  /** Mensagens persistidas (Dexie). Default `[]` → mostra welcome bubble. */
  messages?: ChatMessage[];
  /** SSE events da run actual (do `useAgentStream`). */
  events?: ExecutorSSEEvent[];
  /** `true` enquanto a run actual está a streamar — mostra "A pensar..." se sem eventos ainda. */
  isStreaming?: boolean;
  /** Callbacks para ToolCards `preview-required` (AC4). */
  onConfirmPreview?: (runId: string, toolName: string) => void;
  onCancelPreview?: (runId: string, toolName: string) => void;
}

interface WelcomeBubble {
  kind: 'welcome';
  id: 'welcome';
}

interface PersistedBubble {
  kind: 'persisted';
  message: ChatMessage;
}

interface LiveAgentBubble {
  kind: 'live-agent';
  runId: string;
  toolCardEntries: ToolCardEntry[];
  text: string;
}

type Bubble = WelcomeBubble | PersistedBubble | LiveAgentBubble;

interface ToolCardEntry {
  /** Identificador único — geralmente `toolName` mas pode ter sufixo se houver múltiplas chamadas iguais. */
  key: string;
  toolName: string;
  state: ToolCardState;
  args: unknown;
  result?: unknown;
  error?: string;
  confidence?: number;
}

const WELCOME_MESSAGE = {
  id: 'welcome' as const,
  content:
    'Bem-vindo, Eurico. Estou pronto. Escreve qualquer coisa — uma tarefa, uma despesa, um lembrete. Posso processar várias coisas numa só frase.',
};

/**
 * Reduz `events[]` num `LiveAgentBubble` se a run estiver activa.
 *
 * Mapeamento SSE → ToolCardState:
 * - `tool_start` → cria entry em `loading`
 * - `preview_request` → entry em `preview-required` (substitui loading da mesma tool)
 * - `preview_confirmed { confirm }` → de volta a `loading`
 * - `preview_confirmed { cancel }` → `reverted`
 * - `tool_complete` → `success` com `result`
 * - `tool_error` → `error` com mensagem
 * - `text_delta` → acumula no campo `text`
 *
 * Múltiplas chamadas à mesma tool no mesmo run: usar `${toolName}#${index}`
 * como key. Para Story 1.9 mantém-se simples (toolName direto) — Story 1.10
 * pode introduzir keys composto se a regression suite revelar duplicados.
 */
function reduceLiveBubble(
  events: ExecutorSSEEvent[]
): LiveAgentBubble | null {
  let runId: string | null = null;
  const toolCardMap = new Map<string, ToolCardEntry>();
  let text = '';

  for (const event of events) {
    if (event.type === 'meta' && event.phase === 'start') {
      runId = event.runId;
      continue;
    }

    if (event.type === 'text_delta') {
      text += event.delta;
      continue;
    }

    // Para todos os tool-related events, key = toolName (Story 1.9 simplificado)
    if (
      event.type === 'tool_start' ||
      event.type === 'tool_complete' ||
      event.type === 'tool_error' ||
      event.type === 'preview_request' ||
      event.type === 'preview_confirmed'
    ) {
      const key = event.toolName;
      const existing = toolCardMap.get(key);

      if (event.type === 'tool_start') {
        toolCardMap.set(key, {
          key,
          toolName: event.toolName,
          state: 'loading',
          args: event.args,
        });
        continue;
      }

      if (event.type === 'preview_request') {
        toolCardMap.set(key, {
          key,
          toolName: event.toolName,
          state: 'preview-required',
          args: event.args,
          confidence: event.confidence,
        });
        continue;
      }

      if (event.type === 'preview_confirmed') {
        if (existing) {
          if (event.action === 'cancel') {
            toolCardMap.set(key, { ...existing, state: 'reverted' });
          } else {
            toolCardMap.set(key, { ...existing, state: 'loading' });
          }
        }
        continue;
      }

      if (event.type === 'tool_complete') {
        toolCardMap.set(key, {
          key,
          toolName: event.toolName,
          state: 'success',
          args: event.args,
          result: event.result,
        });
        continue;
      }

      if (event.type === 'tool_error') {
        // tool_error pode vir de `executor`/`loop_guard`/`undo_register` — para esses
        // o key não é uma tool real, mas mostramos como interrupted no fim.
        if (event.toolName === 'executor' || event.toolName === 'loop_guard' || event.toolName === 'undo_register') {
          toolCardMap.set(key, {
            key,
            toolName: event.toolName,
            state: 'interrupted',
            args: null,
            error: event.error,
          });
        } else {
          // tool real — error visual
          toolCardMap.set(key, {
            key,
            toolName: event.toolName,
            state: 'error',
            args: existing?.args ?? null,
            error: event.error,
          });
        }
        continue;
      }
    }
  }

  if (runId === null) return null;

  return {
    kind: 'live-agent',
    runId,
    toolCardEntries: Array.from(toolCardMap.values()),
    text,
  };
}

export function MessageList({
  messages = [],
  events = [],
  isStreaming = false,
  onConfirmPreview,
  onCancelPreview,
}: MessageListProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  const liveBubble = useMemo(() => reduceLiveBubble(events), [events]);

  const bubbles: Bubble[] = useMemo(() => {
    const list: Bubble[] = [];
    if (messages.length === 0 && !liveBubble && !isStreaming) {
      list.push({ kind: 'welcome', id: 'welcome' });
    }
    for (const m of messages) {
      list.push({ kind: 'persisted', message: m });
    }
    if (liveBubble) {
      list.push(liveBubble);
    }
    return list;
  }, [messages, liveBubble, isStreaming]);

  // Smart scroll: só faz scroll se o utilizador estava no fundo
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const wasAtBottom = distanceFromBottom < 80; // tolerância 80px
    if (wasAtBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [bubbles, events.length]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {bubbles.map((bubble) => {
          if (bubble.kind === 'welcome') {
            return <WelcomeBubbleView key="welcome" />;
          }
          if (bubble.kind === 'persisted') {
            return <PersistedBubbleView key={bubble.message.id} message={bubble.message} />;
          }
          return (
            <LiveAgentBubbleView
              key={bubble.runId}
              bubble={bubble}
              isStreaming={isStreaming}
              onConfirmPreview={onConfirmPreview}
              onCancelPreview={onCancelPreview}
            />
          );
        })}

        {/* "A pensar..." — apenas se streaming mas sem live bubble ainda */}
        {isStreaming && !liveBubble && <ThinkingBubble />}
      </div>
    </div>
  );
}

function WelcomeBubbleView(): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          background:
            'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(157,0,255,0.15))',
          border: '1px solid rgba(0,245,255,0.2)',
          borderRadius: 12,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            marginBottom: 6,
            color: '#FFB800',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Boas-vindas
        </span>
        <div>{WELCOME_MESSAGE.content}</div>
      </div>
    </div>
  );
}

function PersistedBubbleView({ message }: { message: ChatMessage }): ReactElement {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          background: isUser ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {!isUser && (
          <div
            style={{
              marginBottom: 4,
              color: '#00F5FF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Nexus
          </div>
        )}
        <div>{message.content}</div>
      </div>
    </div>
  );
}

function LiveAgentBubbleView({
  bubble,
  isStreaming,
  onConfirmPreview,
  onCancelPreview,
}: {
  bubble: LiveAgentBubble;
  isStreaming: boolean;
  onConfirmPreview?: (runId: string, toolName: string) => void;
  onCancelPreview?: (runId: string, toolName: string) => void;
}): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          width: '100%',
        }}
      >
        <div
          style={{
            marginBottom: 8,
            color: '#00F5FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          Nexus
        </div>

        {/* ToolCards inline */}
        {bubble.toolCardEntries.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginBottom: bubble.text.length > 0 ? 8 : 0,
            }}
          >
            {bubble.toolCardEntries.map((entry) => (
              <ToolCard
                key={entry.key}
                toolName={entry.toolName}
                state={entry.state}
                args={entry.args}
                result={entry.result}
                error={entry.error}
                confidence={entry.confidence}
                onConfirm={
                  entry.state === 'preview-required' && onConfirmPreview
                    ? () => onConfirmPreview(bubble.runId, entry.toolName)
                    : undefined
                }
                onCancel={
                  entry.state === 'preview-required' && onCancelPreview
                    ? () => onCancelPreview(bubble.runId, entry.toolName)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Texto streaming */}
        {bubble.text.length > 0 && <div>{bubble.text}</div>}

        {/* Indicador subtil de streaming activo (sem text/tool ainda mas há run) */}
        {isStreaming && bubble.toolCardEntries.length === 0 && bubble.text.length === 0 && (
          <ThinkingIndicator />
        )}
      </div>
    </div>
  );
}

function ThinkingBubble(): ReactElement {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            color: '#00F5FF',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Nexus
        </div>
        <ThinkingIndicator />
      </div>
    </div>
  );
}

function ThinkingIndicator(): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#8892A4',
        fontStyle: 'italic',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          animation: 'spin 1s linear infinite',
        }}
      >
        <Loader2 size={14} aria-hidden />
      </span>
      A pensar...
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
