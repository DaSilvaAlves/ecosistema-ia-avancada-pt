'use client';

import { MessageList } from './MessageList';
import { InputBox } from './InputBox';

/**
 * Nexus v2 — ChatPanel (Story 0.4)
 *
 * Container flex 1 com lista de mensagens + input sticky bottom.
 * Layout chat-first conforme UX-1 (front-end-spec-v2.md §3.1).
 *
 * Epic 1 substitui o `onSend` placeholder pela chamada real ao agente.
 */

export function ChatPanel(): React.ReactElement {
  function handleSend(text: string): void {
    // Story 0.4 placeholder — Epic 1 liga ao agente real via /api/agent/prompt
    if (typeof console !== 'undefined') {
      console.log('[ChatPanel] mensagem placeholder:', text);
    }
  }

  return (
    <section
      aria-label="Chat principal"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        position: 'relative',
      }}
    >
      <MessageList />
      <InputBox onSend={handleSend} />
    </section>
  );
}
