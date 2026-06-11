'use client';

import { useEffect, useRef, useState } from 'react';
import { canStructure, countWords } from '@/lib/brain-dump/input';

/**
 * Nexus v2 — BrainDumpModal (Story 5.6 — AC1/AC3/AC5/AC6, FR47)
 *
 * Modal FULLSCREEN de captura de brain dump (paradigma distinto do chat). Replica
 * o padrão de a11y dos modais do projecto (`JournalEntryModal` 5.3): focus trap,
 * Escape, `role="dialog"` + `aria-modal`, foco inicial na `textarea`, regresso de
 * foco ao opener ao fechar. Design system inegociável (`design-system-ia-avancada.md`):
 * fundo #04040A, glassmorphism, Inter + JetBrains Mono (contador), botão Cyan.
 *
 * `[D-5.6-SEAM]` — PRESENTATIONAL. Gere apenas o estado de input (texto, contador,
 * threshold, placeholder, foco, fechar) e expõe `onStructure(markdown)`. NÃO chama
 * AI, NÃO invoca `createBrainDump`, NÃO escreve em Dexie — isso é da Story 5.7.
 *
 * Estados de render (`react-component-test-criteria.md`): fechado (null) /
 * abaixo do threshold (botão inibido) / acima do threshold (botão activo).
 */

interface BrainDumpModalProps {
  /** Controla a visibilidade — quando `false` o modal não renderiza. */
  isOpen: boolean;
  /** Fecha o modal (botão de fechar ou Escape). */
  onClose: () => void;
  /**
   * Seam para a Story 5.7: recebe o markdown cru da `textarea` ao clicar
   * "Estruturar com AI" com input válido. O parser AI + persistência ligam-se aqui.
   */
  onStructure: (markdown: string) => void;
}

const PLACEHOLDER =
  'Vomita ideias 10 minutos seguidos. Sem censura. A AI organiza depois.';

export function BrainDumpModal({
  isOpen,
  onClose,
  onStructure,
}: BrainDumpModalProps): React.ReactElement | null {
  const [text, setText] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = 'brain-dump-modal-title';

  // Foco inicial na textarea + restauro do foco ao opener + focus trap + Escape
  // (padrão JournalEntryModal 5.3). Reset do texto a cada abertura (dump fresco).
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setText('');
    textareaRef.current?.focus();

    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleKeyDown(e: globalThis.KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Regressa o foco ao elemento que abriu o modal (AC5).
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const words = countWords(text);
  const structurable = canStructure(text);

  function handleStructure(): void {
    if (!structurable) return;
    onStructure(text);
  }

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 4, 10, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 70,
        padding: 24,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label="Brain Dump — captura de ideias"
        data-testid="brain-dump-modal"
        style={{
          width: '100%',
          maxWidth: 880,
          height: 'calc(100vh - 48px)',
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '1.75rem',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#F0F4FF',
              letterSpacing: '-0.02em',
            }}
          >
            Brain Dump
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Brain Dump"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#F0F4FF',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>

        {/* Placeholder em Grey2 (AC6 / design-system) — estilos inline não atingem
            ::placeholder; `opacity: 1` neutraliza o esbatimento default do Firefox. */}
        <style>{`
          [data-testid="brain-dump-textarea"]::placeholder { color: #4A5568; opacity: 1; }
        `}</style>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          aria-label="Texto do brain dump"
          data-testid="brain-dump-textarea"
          style={{
            flex: 1,
            width: '100%',
            resize: 'none',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '1rem',
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            lineHeight: 1.8,
            outline: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            data-testid="brain-dump-word-count"
            aria-live="polite"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#8892A4',
            }}
          >
            {words} {words === 1 ? 'palavra' : 'palavras'}
          </span>
          <button
            type="button"
            onClick={handleStructure}
            disabled={!structurable}
            aria-disabled={!structurable || undefined}
            aria-label={
              structurable
                ? 'Estruturar com AI'
                : 'Estruturar com AI (desactivado — escreve pelo menos 50 caracteres)'
            }
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: structurable ? '#04040A' : '#4A5568',
              background: structurable ? '#00F5FF' : 'rgba(255, 255, 255, 0.04)',
              border: structurable ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '0.65rem 1.4rem',
              cursor: structurable ? 'pointer' : 'not-allowed',
              boxShadow: structurable ? '0 0 20px rgba(0, 245, 255, 0.4)' : 'none',
              transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Estruturar com AI
          </button>
        </div>
      </div>
    </div>
  );
}
