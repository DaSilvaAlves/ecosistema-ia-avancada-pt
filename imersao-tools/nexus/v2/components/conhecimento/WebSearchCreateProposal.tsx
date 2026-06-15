'use client';

import type { Proposal } from '@/lib/conhecimento/web-search-create';
import type { WebSearchProvider } from '@/components/conhecimento/WebSearchResults';

/**
 * Nexus v2 — WebSearchCreateProposal (Story 5.12 — FR56, AC3/AC8/AC11)
 *
 * Componente apresentacional do fluxo "pesquisa web e cria nota". Prop-driven
 * (espelha `WebSearchResults`/`KnowledgeSearchResults`): o parent (`knowledge/
 * page.tsx`) faz a orquestração (`proposeWebSearchCreate`/`persistProposal`) e
 * passa o estado discriminado + os callbacks. O componente não faz fetch nem
 * acede ao Dexie — só renderiza o estado e emite confirmar/cancelar.
 *
 * `[D-5.12-PREVIEW]=P3 consolidado`: 1 preview para as N entidades (área +
 * caderno + nota), fora do mecanismo `requiresPreview` do executor.
 *
 * 6 estados de render (`react-component-test-criteria.md` → teste OBRIGATÓRIO,
 * ≥3 → 6 estados):
 *   - idle: convite PT-PT.
 *   - searching: skeleton/spinner (aria-busy), sem botões.
 *   - proposing: proposta (área + caderno + nota + URL + badge provider);
 *     C3 — distingue visualmente "nova" vs "existente (reutilizar)". Botões
 *     "Confirmar"/"Cancelar" com aria-label PT-PT.
 *   - confirming: progresso ("A criar…"); botões DESACTIVADOS (C4 — dupla
 *     submissão impossível: o parent ignora cliques em `confirming` E o botão
 *     fica `disabled`).
 *   - done: sucesso PT-PT ("Nota criada em {Caderno}").
 *   - error: mensagem real PT-PT em Magenta; role="alert".
 *
 * Design system [IA]AVANÇADA PT: glassmorphism nos cards, Inter (corpo),
 * JetBrains Mono (badge/URL/status), fundo #04040A, Cyan #00F5FF, Lime #B6FF3C
 * (sucesso), Magenta #FF006E (erro), Grey #8892A4 (metadados).
 */

const PROVIDER_LABEL: Record<WebSearchProvider, string> = {
  anthropic: 'ANTHROPIC',
  duckduckgo: 'DUCKDUCKGO',
};

/** Estado discriminado do fluxo (detido pelo parent). */
export type WebSearchCreateState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'proposing'; proposal: Proposal }
  | { kind: 'confirming'; proposal: Proposal }
  | { kind: 'done'; notebookName: string; noteTitle: string }
  | { kind: 'error'; message: string };

interface WebSearchCreateProposalProps {
  state: WebSearchCreateState;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Badge "NOVA"/"EXISTENTE" — C3, distinção visual nova vs reutilizar. */
function EntityStatusBadge({
  status,
}: {
  status: 'nova' | 'existente';
}): React.ReactElement {
  const isNew = status === 'nova';
  return (
    <span
      data-testid={`status-badge-${status}`}
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.55rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: isNew ? '#04040A' : '#B6FF3C',
        background: isNew ? '#B6FF3C' : 'rgba(182, 255, 60, 0.1)',
        border: isNew ? 'none' : '1px solid rgba(182, 255, 60, 0.3)',
        borderRadius: 20,
        padding: '0.1rem 0.5rem',
        flexShrink: 0,
      }}
    >
      {isNew ? 'NOVA' : 'REUTILIZAR'}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: '0.9rem 1rem',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: '#8892A4',
};

export function WebSearchCreateProposal({
  state,
  onConfirm,
  onCancel,
}: WebSearchCreateProposalProps): React.ReactElement {
  // ── searching ──
  if (state.kind === 'searching') {
    return (
      <div
        data-testid="wsc-searching"
        aria-busy="true"
        aria-label="A pesquisar e a preparar a proposta"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 64,
              marginBottom: 8,
              borderRadius: 10,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
              backgroundSize: '200% 100%',
              animation: 'wsc-pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes wsc-pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // ── error (role="alert", distinto de empty) ──
  if (state.kind === 'error') {
    return (
      <p
        data-testid="wsc-error"
        role="alert"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#FF006E',
        }}
      >
        {state.message}
      </p>
    );
  }

  // ── done ──
  if (state.kind === 'done') {
    return (
      <p
        data-testid="wsc-done"
        role="status"
        aria-live="polite"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#B6FF3C',
        }}
      >
        Nota «{state.noteTitle}» criada em {state.notebookName}.
      </p>
    );
  }

  // ── idle ──
  if (state.kind === 'idle') {
    return (
      <p
        data-testid="wsc-idle"
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Pesquisa um tema na web e cria automaticamente uma nota no teu
        Conhecimento, na área e caderno que indicares.
      </p>
    );
  }

  // ── proposing | confirming (partilham o cartão de proposta) ──
  const { proposal } = state;
  const isConfirming = state.kind === 'confirming';

  return (
    <section
      data-testid="wsc-proposal"
      role="region"
      aria-label="Proposta de nota a criar"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Área */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={labelStyle}>ÁREA</span>
          <EntityStatusBadge status={proposal.area.status} />
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: '#F0F4FF',
          }}
        >
          {proposal.area.name}
        </span>
      </div>

      {/* Caderno */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={labelStyle}>CADERNO</span>
          <EntityStatusBadge status={proposal.notebook.status} />
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: '#F0F4FF',
          }}
        >
          {proposal.notebook.name}
        </span>
      </div>

      {/* Nota */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={labelStyle}>NOTA</span>
          {proposal.source !== null && (
            <span
              title={`Resultado obtido via ${PROVIDER_LABEL[proposal.source]}`}
              style={{
                flexShrink: 0,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#00F5FF',
                background: 'rgba(0, 245, 255, 0.08)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                borderRadius: 20,
                padding: '0.15rem 0.55rem',
              }}
            >
              {PROVIDER_LABEL[proposal.source]}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: '#F0F4FF',
          }}
        >
          {proposal.note.title}
        </span>
        {proposal.note.bodyMarkdown.trim() !== '' && (
          <p
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#F0F4FF',
              whiteSpace: 'pre-wrap',
            }}
          >
            {proposal.note.bodyMarkdown}
          </p>
        )}
        <a
          href={proposal.note.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: '#00F5FF',
            textDecoration: 'none',
            wordBreak: 'break-all',
          }}
        >
          {proposal.note.sourceUrl}
        </a>
      </div>

      {isConfirming && (
        <p
          data-testid="wsc-confirming"
          role="status"
          aria-live="polite"
          style={{
            margin: 0,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            color: '#00F5FF',
          }}
        >
          A criar…
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          aria-label="Cancelar criação da nota"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#F0F4FF',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '0.5rem 1.1rem',
            cursor: isConfirming ? 'not-allowed' : 'pointer',
            opacity: isConfirming ? 0.6 : 1,
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          aria-label="Confirmar e criar a nota"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#04040A',
            background: '#00F5FF',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.1rem',
            cursor: isConfirming ? 'wait' : 'pointer',
            opacity: isConfirming ? 0.7 : 1,
            boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
          }}
        >
          Confirmar
        </button>
      </div>
    </section>
  );
}
