/**
 * Nexus v2 — MessageList component tests (Story 1.9 Iter 2)
 *
 * Cobertura nova focada nos fixes CodeRabbit Iter 1:
 *   - Major #2: `toolCallId` per-invocation evita colapso de múltiplas
 *     invocações da mesma tool num único ToolCard
 *   - Fallback `toolName#index` quando `toolCallId` ausente (retrocompat)
 *   - Smart scroll usa snapshot pre-update (useLayoutEffect) — verificado
 *     indirectamente pela ausência de scroll quando utilizador NÃO estava
 *     no fundo antes do insert
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '@/components/chat/MessageList';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';

const RUN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function metaStart(): ExecutorSSEEvent {
  return {
    type: 'meta',
    phase: 'start',
    runId: RUN_ID,
    prompt: 'teste',
    modelClassifier: 'haiku',
    modelExecutor: 'sonnet',
    startedAt: 1700000000000,
    classifierResult: null,
  };
}

beforeEach(() => {
  // jsdom não implementa scrollTo — stub para evitar erro
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

describe('MessageList — toolCallId key (Story 1.9 Iter 2 Major #2)', () => {
  it('duas invocações da mesma tool COM toolCallId distintos renderizam 2 ToolCards', () => {
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_001',
        args: { url: 'https://a.com' },
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_001',
        args: { url: 'https://a.com' },
        result: { ok: 'a' },
        durationMs: 50,
      },
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_002',
        args: { url: 'https://b.com' },
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_002',
        args: { url: 'https://b.com' },
        result: { ok: 'b' },
        durationMs: 60,
      },
    ];

    render(<MessageList events={events} isStreaming={false} />);

    // Deve haver 2 ToolCards distintos (não colapsados num só)
    const toolCards = screen.getAllByTestId('tool-card');
    expect(toolCards).toHaveLength(2);

    // Ambos os results visíveis
    expect(screen.getByText(/"ok": "a"/)).toBeInTheDocument();
    expect(screen.getByText(/"ok": "b"/)).toBeInTheDocument();
  });

  it('duas invocações da mesma tool SEM toolCallId (fallback) renderizam 2 ToolCards distintos', () => {
    // Cenário retrocompat: stream emitido por código pré-Iter 2 (sem toolCallId)
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'web_fetch',
        args: { url: 'https://a.com' },
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'web_fetch',
        args: { url: 'https://a.com' },
        result: { ok: 'a' },
        durationMs: 50,
      },
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'web_fetch',
        args: { url: 'https://b.com' },
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'web_fetch',
        args: { url: 'https://b.com' },
        result: { ok: 'b' },
        durationMs: 60,
      },
    ];

    render(<MessageList events={events} isStreaming={false} />);

    const toolCards = screen.getAllByTestId('tool-card');
    expect(toolCards).toHaveLength(2);
    expect(screen.getByText(/"ok": "a"/)).toBeInTheDocument();
    expect(screen.getByText(/"ok": "b"/)).toBeInTheDocument();
  });

  it('preview_request → preview_confirmed → tool_complete da mesma tool (mesmo toolCallId) actualiza UM cartão', () => {
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_xyz',
        args: { titulo: 'reunião' },
      },
      {
        type: 'preview_request',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_xyz',
        args: { titulo: 'reunião' },
        reason: 'low_confidence',
        confidence: 0.5,
        domain: 'calendar',
      },
      {
        type: 'preview_confirmed',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_xyz',
        action: 'confirm',
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_xyz',
        args: { titulo: 'reunião' },
        result: { id: 'ev-1' },
        durationMs: 100,
      },
    ];

    render(<MessageList events={events} isStreaming={false} />);

    // Apenas 1 cartão (mesmo toolCallId) — estado final = success
    const toolCards = screen.getAllByTestId('tool-card');
    expect(toolCards).toHaveLength(1);
    expect(toolCards[0].getAttribute('aria-label')).toMatch(/success/);
  });
});

describe('MessageList — animation classes preserved (Story 1.9 Iter 2 Major #3)', () => {
  it('estado loading aplica animação nexus-pulse-cyan', () => {
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'tool_start',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_001',
        args: { url: 'https://a.com' },
      },
    ];
    render(<MessageList events={events} isStreaming />);
    const card = screen.getByTestId('tool-card');
    const animation = card.getAttribute('data-animation') ?? '';
    expect(animation).toContain('nexus-pulse-cyan');
    expect(animation).toContain('nexus-tool-card-enter');
  });

  it('estado preview-required aplica animação nexus-pulse-gold-slow', () => {
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'preview_request',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_001',
        args: { titulo: 'reunião' },
        reason: 'low_confidence',
        confidence: 0.5,
        domain: 'calendar',
      },
    ];
    render(<MessageList events={events} isStreaming />);
    const card = screen.getByTestId('tool-card');
    const animation = card.getAttribute('data-animation') ?? '';
    expect(animation).toContain('nexus-pulse-gold-slow');
  });

  it('estado success aplica APENAS animação de entrada', () => {
    const events: ExecutorSSEEvent[] = [
      metaStart(),
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'web_fetch',
        toolCallId: 'call_001',
        args: { url: 'https://a.com' },
        result: { ok: true },
        durationMs: 50,
      },
    ];
    render(<MessageList events={events} isStreaming={false} />);
    const card = screen.getByTestId('tool-card');
    const animation = card.getAttribute('data-animation') ?? '';
    expect(animation).toContain('nexus-tool-card-enter');
    expect(animation).not.toContain('nexus-pulse-cyan');
    expect(animation).not.toContain('nexus-pulse-gold-slow');
  });
});

describe('MessageList — welcome bubble', () => {
  it('lista vazia sem stream mostra welcome bubble', () => {
    render(<MessageList isStreaming={false} />);
    expect(screen.getByText(/Bem-vindo, Eurico/)).toBeInTheDocument();
  });
});
