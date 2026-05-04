'use client';

import type { ReactElement } from 'react';

/**
 * Nexus v2 — MessageList (Story 0.4)
 *
 * Lista de mensagens com bolha utilizador (direita, Cyan 8%) e bolha agente (esquerda).
 * Story 0.4 mostra apenas placeholder + mensagem de boas-vindas.
 * Epic 1 implementa renderização real de mensagens + ToolCards inline.
 */

interface ChatMessageView {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pinned?: boolean;
}

interface MessageListProps {
  messages?: ChatMessageView[];
}

const WELCOME_MESSAGE: ChatMessageView = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Bem-vindo, Eurico. Estou pronto. Escreve qualquer coisa — uma tarefa, uma despesa, um lembrete. Posso processar várias coisas numa só frase.',
  pinned: true,
};

export function MessageList({ messages = [] }: MessageListProps): ReactElement {
  const display: ChatMessageView[] = messages.length > 0 ? messages : [WELCOME_MESSAGE];

  return (
    <div
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
        {display.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessageView }): React.ReactElement {
  const isUser = message.role === 'user';
  const isPinned = message.pinned;

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
          background: isPinned
            ? 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(157,0,255,0.15))'
            : isUser
              ? 'rgba(0,245,255,0.08)'
              : 'rgba(255,255,255,0.04)',
          border: isPinned
            ? '1px solid rgba(0,245,255,0.2)'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {isPinned && (
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
            ⭐ Boas-vindas
          </span>
        )}
        {!isPinned && !isUser && (
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
