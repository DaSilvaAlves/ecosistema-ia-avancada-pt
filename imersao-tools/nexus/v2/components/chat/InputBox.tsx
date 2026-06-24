'use client';

import { useEffect, useRef, useState, KeyboardEvent, ReactElement } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { VoiceModeButton } from '@/components/chat/VoiceModeButton';
import { useVoiceModeState } from '@/hooks/useVoiceModeState';
import { useVoice } from '@/hooks/useVoice';

/**
 * Nexus v2 — InputBox / ChatInput (Story 0.4 + Story 1.9 AC6 + AC9)
 *
 * Textarea autosize sticky bottom. Atalhos: `/` foca, `↵` envia, `⇧↵` nova linha.
 * Botões 📎 (anexo, Story 1.x), 🎙️ (voz, Epic 7), ⏎ (enviar).
 *
 * Trace canónico:
 * - Story 0.4 — base do componente (textarea autosize + atalhos + botões)
 * - Story 1.9 AC6 — estados `streamingState` (`idle`/`streaming`/`preview-pending`),
 *   placeholders contextuais, opacity 60% durante streaming, mic placeholder idle-only
 * - Story 1.9 AC9 — `aria-disabled`, `aria-describedby`, `aria-label` específico
 * - GAP-2 (PO Pax 08/05/2026) — `<Mic>` ERA placeholder visual idle-only;
 *   Story 7.1 (FR77) substitui-o pelo `<VoiceModeButton>` real (5 estados)
 * - Story 7.1 — integra `VoiceModeButton` + `useVoiceModeState` (estado local
 *   ao InputBox, D-7.1-PLACEMENT). A lógica de Web Speech (start/stop) chega na
 *   Story 7.2 via callback `onVoiceToggle` — a 7.1 só entrega a UI/estado.
 * - Front-end-spec §2.2 — tokens visuais (background blur, border)
 * - Front-end-spec §4.4 estado `idle` do `VoiceModeButton`
 *
 * Story 1.9 estende a Story 0.4 com `streamingState` para o ChatPanel poder
 * comunicar à UI o estado actual da agent stream sem múltiplas props booleanas.
 * O `disabled` legacy continua a funcionar (retrocompat com testes Story 0.4).
 */

/**
 * Estados de input agent-aware. `idle` permite escrever; `streaming` desactiva
 * com placeholder "A processar..."; `preview-pending` desactiva com mensagem
 * indicando que há ToolCard a aguardar confirmação.
 */
export type InputBoxStreamingState = 'idle' | 'streaming' | 'preview-pending';

interface InputBoxProps {
  onSend?: (text: string) => void;
  /** Legacy — Story 0.4 — força disabled. `streamingState` é preferível em Story 1.9+. */
  disabled?: boolean;
  placeholder?: string;
  /** Story 1.9 — estado da agent stream. Default `'idle'`. */
  streamingState?: InputBoxStreamingState;
}

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 200;

const STATE_PLACEHOLDERS: Record<InputBoxStreamingState, string> = {
  idle: 'Escreve qualquer coisa — uma tarefa, despesa, lembrete... 3 acções numa só frase.',
  streaming: 'A processar...',
  'preview-pending': 'Confirma a acção acima antes de continuar',
};

const DESCRIBED_BY_ID = 'input-box-state-message';

export function InputBox({
  onSend,
  disabled: disabledProp = false,
  placeholder,
  streamingState = 'idle',
}: InputBoxProps): ReactElement {
  const isStreaming = streamingState === 'streaming';
  const isPreviewPending = streamingState === 'preview-pending';
  const disabled = disabledProp || isStreaming || isPreviewPending;
  const effectivePlaceholder = placeholder ?? STATE_PLACEHOLDERS[streamingState];
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Story 7.1 — estado de voz local ao InputBox (D-7.1-PLACEMENT). A 7.2
  // liga `voice.toggle` ao SpeechRecognition; a 7.1 mantém o estado visual.
  const voice = useVoiceModeState();
  // Story 7.2 (FR78) — reconhecimento Web Speech PT-PT. DEV-DECISION
  // D-7.2-COMPOSE: o `useVoice` recebe o contrato da 7.1 (não duplica estado).
  // DEV-DECISION D-7.2-TRANSCRIPT-CONTRACT (opção b, precedente 6.13): a
  // transcrição é injectada no campo de texto — aparece como se o utilizador a
  // tivesse escrito, ficando disponível no pipeline `onSend` existente (a 7.3
  // consome o texto sem alterar ficheiros da 7.2). Após injectar, volta a `idle`.
  const recognizer = useVoice({
    voiceState: voice,
    onTranscript: (transcript: string) => {
      setText((prev) => {
        const trimmed = prev.trimEnd();
        return trimmed.length > 0 ? `${trimmed} ${transcript}` : transcript;
      });
      // O texto está entregue; o reconhecimento terminou. Volta a `idle` para
      // o utilizador poder rever/enviar (estado `processing` é transitório).
      voice.reset();
    },
  });

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
          data-testid="chat-composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={effectivePlaceholder}
          aria-label="Escreve o teu prompt"
          aria-disabled={disabled}
          aria-describedby={
            isPreviewPending || isStreaming ? DESCRIBED_BY_ID : undefined
          }
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

        {/*
         * Story 7.1 (FR77) — substitui o placeholder `<Mic>` (GAP-2) pelo
         * VoiceModeButton real. Estado local via `useVoiceModeState`. O clique
         * só alterna o modo voz quando o input NÃO está em streaming/preview
         * (respeita o `disabled` legacy do InputBox).
         * Story 7.2 (FR78) — o callback agora delega a `recognizer.toggle()`, que
         * conduz o `SpeechRecognition` (start/stop) e o estado de UI da 7.1.
         */}
        <VoiceModeButton
          state={voice.state}
          errorMessage={voice.errorMessage}
          onVoiceToggle={
            disabled
              ? undefined
              : () => {
                  recognizer.toggle();
                }
          }
        />


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

      {(isStreaming || isPreviewPending) && (
        <p
          id={DESCRIBED_BY_ID}
          style={{
            marginTop: 8,
            marginBottom: 0,
            textAlign: 'center',
            color: isPreviewPending ? '#FFB800' : '#8892A4',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          {isPreviewPending
            ? 'Confirma a acção acima antes de continuar'
            : 'A processar...'}
        </p>
      )}

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
