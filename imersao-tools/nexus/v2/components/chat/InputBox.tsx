'use client';

import { useEffect, useRef, useState, KeyboardEvent, ReactElement } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';

/**
 * Nexus v2 — InputBox (Story 0.4)
 *
 * Textarea autosize sticky bottom. Atalhos: `/` foca, `↵` envia, `⇧↵` nova linha.
 * Botões 📎 (anexo, Story 1.x), 🎙️ (voz, Story 1.x), ⏎ (enviar).
 *
 * Em Story 0.4, `onSend` é placeholder — Epic 1 liga ao agente real.
 */

interface InputBoxProps {
  onSend?: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 200;

export function InputBox({
  onSend,
  disabled = false,
  placeholder = 'Escreve qualquer coisa — uma tarefa, despesa, lembrete... 3 acções numa só frase.',
}: InputBoxProps): ReactElement {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Foco global com `/`
  useEffect(() => {
    function onSlash(e: globalThis.KeyboardEvent): void {
      if (e.key !== '/' || disabled) return;
      const active = document.activeElement;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      textareaRef.current?.focus();
    }
    window.addEventListener('keydown', onSlash);
    return () => window.removeEventListener('keydown', onSlash);
  }, [disabled]);

  // Autosize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight));
    el.style.height = `${newHeight}px`;
  }, [text]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit(): void {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setText('');
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <button
          type="button"
          aria-label="Anexar ficheiro"
          disabled={disabled}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8892A4',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Mensagem para o agente"
          style={{
            flex: 1,
            minHeight: MIN_HEIGHT,
            maxHeight: MAX_HEIGHT,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            padding: '12px 14px',
            outline: 'none',
            resize: 'none',
            opacity: disabled ? 0.6 : 1,
          }}
        />

        <button
          type="button"
          aria-label="Activar voz"
          disabled={disabled}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8892A4',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Mic size={18} />
        </button>

        <button
          type="button"
          aria-label="Enviar mensagem"
          onClick={submit}
          disabled={disabled || !text.trim()}
          style={{
            background: text.trim() && !disabled ? '#00F5FF' : 'rgba(0,245,255,0.3)',
            color: '#04040A',
            border: 'none',
            borderRadius: 8,
            padding: '10px 12px',
            cursor: !text.trim() || disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: '0.2s',
          }}
        >
          <Send size={16} />
        </button>
      </div>

      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          textAlign: 'center',
          color: '#4A5568',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.05em',
        }}
      >
        / foco · ↵ enviar · ⇧↵ nova linha
      </p>
    </div>
  );
}
