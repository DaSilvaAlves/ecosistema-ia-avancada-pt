'use client';

import { useEffect, useRef, useState } from 'react';
import { canStructure, countWords } from '@/lib/brain-dump/input';
import {
  BRAIN_DUMP_BUCKETS,
  hasParsedContent,
  type BrainDumpBucket,
  type BrainDumpParsed,
} from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — BrainDumpModal (Stories 5.6 + 5.7)
 *
 * Modal FULLSCREEN de captura de brain dump (paradigma distinto do chat). Replica
 * o padrão de a11y dos modais do projecto (`JournalEntryModal` 5.3): focus trap,
 * Escape, `role="dialog"` + `aria-modal`, foco inicial na `textarea`, regresso de
 * foco ao opener ao fechar. Design system inegociável (`design-system-ia-avancada.md`):
 * fundo #04040A, glassmorphism, Inter + JetBrains Mono (contadores), botão Cyan.
 *
 * Story 5.6 (`[D-5.6-SEAM]`): a parte de INPUT é presentational — gere texto,
 * contador, threshold, placeholder, foco, fechar; expõe `onStructure(markdown)`.
 *
 * Story 5.7 (`[D-5.7-SCOPE]`): este componente passa a renderizar também os
 * ESTADOS de processamento e o display read-only dos 4 buckets. NÃO chama AI nem
 * Dexie — o pipeline (client de inferência + `createBrainDump`) vive no
 * `BrainDumpLauncher` (AC3); este componente é controlado por `aiState` (prop).
 *   - `loading` → overlay "A estruturar…" + spinner Cyan + textarea readonly (AC4).
 *   - `error`   → mensagem PT-PT, sem buckets vazios silenciosos (AC4).
 *   - `parsed`  → 4 secções colapsáveis (não-vazias expandidas, vazias "(0)"
 *                  colapsadas) com contador + itens, read-only (AC5/AC6). Sem
 *                  checkboxes/editar/rejeitar/guardar (isso é a Story 5.8).
 *
 * Estados de render (`react-component-test-criteria.md`): fechado (null) / idle
 * (input) / loading (overlay) / parsed (buckets) / error (mensagem) ⇒ ≥3 ⇒ teste
 * de componente obrigatório.
 */

/**
 * Máquina de estados do parsing AI (união discriminada — padrão `AiState` da 5.4,
 * `internal-state-contract-gate.md` eixo c). O `BrainDumpLauncher` é dono do
 * estado; o modal apenas o renderiza.
 */
export type BrainDumpAiState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'parsed'; parsed: BrainDumpParsed }
  | { kind: 'error'; message: string };

interface BrainDumpModalProps {
  /** Controla a visibilidade — quando `false` o modal não renderiza. */
  isOpen: boolean;
  /** Fecha o modal (botão de fechar ou Escape). */
  onClose: () => void;
  /**
   * Seam para o pipeline AI (Story 5.7): recebe o markdown cru da `textarea` ao
   * clicar "Estruturar com AI" com input válido. O `BrainDumpLauncher` liga isto
   * ao client de inferência + `createBrainDump`.
   */
  onStructure: (markdown: string) => void;
  /**
   * Estado do parsing AI (controlado pelo `BrainDumpLauncher`). Default `idle`
   * para compatibilidade com chamadas que só testam a parte de input (5.6).
   */
  aiState?: BrainDumpAiState;
}

const PLACEHOLDER =
  'Vomita ideias 10 minutos seguidos. Sem censura. A AI organiza depois.';

/**
 * Metadados de apresentação dos 4 buckets (AC5/AC6). Os nomes (`tarefas` etc.) são
 * identificadores ASCII de contrato (`ai-parser.ts`); os labels e cores são de UI.
 * Cores apenas da paleta canónica (`lib/tags/colors.ts` — `[D-5.7-SHAPE]` AC6):
 * tarefas Cyan, projectos Purple, ideias Gold (Ouro), decisões Magenta.
 */
const BUCKET_META: Record<BrainDumpBucket, { label: string; color: string }> = {
  tarefas: { label: 'Tarefas propostas', color: '#00F5FF' },
  projectos: { label: 'Projectos propostos', color: '#9D00FF' },
  ideias: { label: 'Ideias soltas', color: '#FFB800' },
  decisoes: { label: 'Decisões a tomar', color: '#FF006E' },
};

export function BrainDumpModal({
  isOpen,
  onClose,
  onStructure,
  aiState = { kind: 'idle' },
}: BrainDumpModalProps): React.ReactElement | null {
  const [text, setText] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = 'brain-dump-modal-title';

  const isLoading = aiState.kind === 'loading';

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
      // Regressa o foco ao elemento que abriu o modal (AC5 5.6).
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const words = countWords(text);
  const structurable = canStructure(text) && !isLoading;

  function handleStructure(): void {
    if (!canStructure(text) || isLoading) return;
    onStructure(text);
  }

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
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
          position: 'relative',
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
            disabled={isLoading}
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
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Fechar
          </button>
        </div>

        {/* Placeholder em Grey2 (AC6 / design-system) — estilos inline não atingem
            ::placeholder; `opacity: 1` neutraliza o esbatimento default do Firefox.
            Spinner do overlay (AC4): keyframes inline (estilos inline não suportam
            @keyframes). */}
        <style>{`
          [data-testid="brain-dump-textarea"]::placeholder { color: #4A5568; opacity: 1; }
          @keyframes brain-dump-spin { to { transform: rotate(360deg); } }
        `}</style>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          readOnly={isLoading}
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

        {/* Display dos 4 buckets / mensagem de erro (AC4/AC5/AC6) — só após o parse. */}
        {aiState.kind === 'parsed' && <BucketDisplay parsed={aiState.parsed} />}
        {aiState.kind === 'error' && (
          <p
            role="alert"
            data-testid="brain-dump-error"
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
              color: '#FF006E',
              background: 'rgba(255, 0, 110, 0.08)',
              border: '1px solid rgba(255, 0, 110, 0.25)',
              borderRadius: 6,
              padding: '0.75rem 1rem',
            }}
          >
            {aiState.message}
          </p>
        )}

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

        {/* Overlay "A estruturar…" (AC4, FE [4] §1014) — cobre o modal em loading. */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            data-testid="brain-dump-loading-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              background: 'rgba(4, 4, 10, 0.78)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              zIndex: 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '3px solid rgba(0, 245, 255, 0.2)',
                borderTopColor: '#00F5FF',
                animation: 'brain-dump-spin 0.8s linear infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#F0F4FF',
                letterSpacing: '0.01em',
              }}
            >
              A estruturar…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Display read-only dos 4 buckets (AC5/AC6). Secções colapsáveis: buckets
 * não-vazios default expandidos; buckets vazios mostram "(0)" e ficam colapsados
 * (`[D-5.7-SCOPE]`). Sem controlos item-a-item (Story 5.8). a11y: `aria-expanded`
 * + botão de toggle com nome acessível.
 */
function BucketDisplay({ parsed }: { parsed: BrainDumpParsed }): React.ReactElement {
  const emptyHint = !hasParsedContent(parsed);

  return (
    <div
      data-testid="brain-dump-buckets"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
        maxHeight: '40vh',
      }}
    >
      {emptyHint && (
        <p
          data-testid="brain-dump-empty-hint"
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            color: '#8892A4',
          }}
        >
          A AI não encontrou itens para estruturar neste texto.
        </p>
      )}
      {BRAIN_DUMP_BUCKETS.map((bucket) => (
        <BucketSection
          key={bucket}
          bucket={bucket}
          items={parsed[bucket]}
        />
      ))}
    </div>
  );
}

/**
 * Uma secção colapsável de bucket. Estado de expansão local, inicializado a
 * `items.length > 0` (não-vazio expandido, vazio colapsado — `[D-5.7-SCOPE]`).
 */
function BucketSection({
  bucket,
  items,
}: {
  bucket: BrainDumpBucket;
  items: BrainDumpParsed[BrainDumpBucket];
}): React.ReactElement {
  const { label, color } = BUCKET_META[bucket];
  const [expanded, setExpanded] = useState(items.length > 0);
  const panelId = `brain-dump-bucket-panel-${bucket}`;

  return (
    <section
      data-testid={`brain-dump-bucket-${bucket}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={panelId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '0.7rem 0.9rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#F0F4FF',
            flex: 1,
          }}
        >
          {label}{' '}
          <span
            data-testid={`brain-dump-count-${bucket}`}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.78rem',
              fontWeight: 700,
              color,
            }}
          >
            ({items.length})
          </span>
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem',
            color: '#8892A4',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ▸
        </span>
      </button>
      {expanded && (
        <ul
          id={panelId}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: items.length > 0 ? '0 0.9rem 0.7rem 1.7rem' : '0 0.9rem 0.7rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {items.length === 0 ? (
            <li
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                color: '#8892A4',
                fontStyle: 'italic',
              }}
            >
              Sem itens neste grupo.
            </li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  color: '#D8DEF0',
                  lineHeight: 1.5,
                  listStyle: 'disc',
                }}
              >
                {item.texto}
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
