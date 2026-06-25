/**
 * Nexus v2 — ChatPanel síntese de voz tests (Story 7.4 — FR80, AC7)
 *
 * Verifica o ENCADEAMENTO de saída (cérebro → voz) com hooks REAIS de síntese
 * (`useSpeechSynthesis`/`useSynthesisToggle` NÃO são mockados) e um mock FIEL de
 * `SpeechSynthesis`/`SpeechSynthesisUtterance` instalado no global
 * (`mock-protocol-fidelity.md`). Só `useAgentStream` e `useConversationMessages`
 * são mockados (controlo determinístico dos eventos da stream).
 *
 * Cenários obrigatórios (Testing §cenários):
 *   C1 — toggle ON + `done` status success → `speak` 1x com texto acumulado, lang pt-PT
 *   C2 — toggle OFF + `done` success → `speak` NÃO chamado
 *   C3 — síntese em curso + nova run (handleSend) → `cancel` chamado antes do submit
 *   AC5 — browser sem `SpeechSynthesis` → toggle `unsupported`, `speak` 0x, sem crash
 *   Falsificável — se o encadeamento "done → speak" estivesse quebrado, C1 falharia
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ChatMessage } from '@/types/db';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import type { UseAgentStreamResult } from '@/hooks/useAgentStream';
import { SYNTHESIS_ENABLED_STORAGE_KEY } from '@/hooks/useSynthesisToggle';

/* ─── Mock controlável de useAgentStream / useConversationMessages ─────────── */

const persistedMessagesRef: { current: ChatMessage[] | undefined } = { current: [] };
const submitSpy = vi.fn();
const streamStateRef: { current: UseAgentStreamResult } = {
  current: {
    submit: submitSpy,
    reset: vi.fn(),
    isStreaming: false,
    currentRunId: null,
    events: [],
    error: null,
  },
};

vi.mock('@/hooks/useChatMessages', () => ({
  useConversationMessages: () => persistedMessagesRef.current,
}));

vi.mock('@/hooks/useAgentStream', () => ({
  useAgentStream: () => streamStateRef.current,
}));

import { ChatPanel } from '@/components/chat/ChatPanel';

/* ─── Mock fiel de SpeechSynthesis/SpeechSynthesisUtterance ───────────────── */

class MockUtterance {
  static instances: MockUtterance[] = [];
  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  constructor(text: string) {
    this.text = text;
    MockUtterance.instances.push(this);
  }
}

const speakSpy = vi.fn();
const cancelSpy = vi.fn();

class MockSpeechSynthesis {
  speak = speakSpy;
  cancel = cancelSpy;
  getVoices(): SpeechSynthesisVoice[] {
    return [{ lang: 'pt-PT', name: 'Joana' } as SpeechSynthesisVoice];
  }
  addEventListener(): void {}
  removeEventListener(): void {}
}

function installSynthesisMock(): void {
  MockUtterance.instances = [];
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis =
    new MockSpeechSynthesis();
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    MockUtterance;
}

function uninstallSynthesisMock(): void {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown })
    .SpeechSynthesisUtterance;
}

const RUN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function metaStart(runId = RUN_ID): ExecutorSSEEvent {
  return {
    type: 'meta',
    phase: 'start',
    runId,
    prompt: 'olá',
    modelClassifier: 'haiku',
    modelExecutor: 'sonnet',
    startedAt: 1700000000000,
    classifierResult: null,
  };
}

function doneSuccess(runId = RUN_ID): ExecutorSSEEvent {
  return {
    type: 'done',
    runId,
    status: 'success',
    intents: [],
    inputTokens: 0,
    outputTokens: 0,
    durationMs: 10,
    totals: { intents: 0, toolCalls: 0 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  persistedMessagesRef.current = [];
  streamStateRef.current = {
    submit: submitSpy,
    reset: vi.fn(),
    isStreaming: false,
    currentRunId: null,
    events: [],
    error: null,
  };
  window.localStorage.clear();
  installSynthesisMock();
});

afterEach(() => {
  uninstallSynthesisMock();
  window.localStorage.clear();
});

/* ─── C1 — toggle ON + done success → speak (falsificável) ────────────────── */

describe('ChatPanel síntese — C1 toggle ON + done → speak (AC2)', () => {
  it('done status success com toggle ON → speak 1x com texto acumulado e lang pt-PT', () => {
    // Toggle ON persistido antes do mount.
    window.localStorage.setItem(SYNTHESIS_ENABLED_STORAGE_KEY, 'true');

    // 1.º render: stream a meio (text_delta acumulados, sem done ainda).
    streamStateRef.current = {
      ...streamStateRef.current,
      isStreaming: true,
      currentRunId: RUN_ID,
      events: [
        metaStart(),
        { type: 'text_delta', runId: RUN_ID, delta: 'Criei ' },
        { type: 'text_delta', runId: RUN_ID, delta: 'a tarefa.' },
      ],
    };
    const { rerender } = render(<ChatPanel />);

    // Ainda não chegou `done` → nada falado.
    expect(speakSpy).not.toHaveBeenCalled();

    // 2.º render: chega `done` success.
    streamStateRef.current = {
      ...streamStateRef.current,
      isStreaming: false,
      events: [
        metaStart(),
        { type: 'text_delta', runId: RUN_ID, delta: 'Criei ' },
        { type: 'text_delta', runId: RUN_ID, delta: 'a tarefa.' },
        doneSuccess(),
      ],
    };
    act(() => rerender(<ChatPanel />));

    // Encadeamento: done → speak com o texto acumulado correcto.
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = MockUtterance.instances[0];
    expect(utterance.text).toBe('Criei a tarefa.');
    expect(utterance.lang).toBe('pt-PT');
    expect(utterance.voice?.name).toBe('Joana');
  });

  it('done NÃO re-dispara speak em re-renders subsequentes da mesma run', () => {
    window.localStorage.setItem(SYNTHESIS_ENABLED_STORAGE_KEY, 'true');
    const events = [
      metaStart(),
      { type: 'text_delta', runId: RUN_ID, delta: 'olá' } as ExecutorSSEEvent,
      doneSuccess(),
    ];
    streamStateRef.current = { ...streamStateRef.current, events };
    const { rerender } = render(<ChatPanel />);
    expect(speakSpy).toHaveBeenCalledTimes(1);

    // Re-render sem mudar a run → não fala de novo (spokenRunIdRef).
    act(() => rerender(<ChatPanel />));
    expect(speakSpy).toHaveBeenCalledTimes(1);
  });
});

/* ─── C2 — toggle OFF → speak NÃO chamado (AC2) ───────────────────────────── */

describe('ChatPanel síntese — C2 toggle OFF → não fala (AC2)', () => {
  it('done success com toggle OFF (omissão) → speak NÃO chamado', () => {
    // Sem localStorage → OFF por omissão (D-7.4-TOGGLE).
    streamStateRef.current = {
      ...streamStateRef.current,
      events: [
        metaStart(),
        { type: 'text_delta', runId: RUN_ID, delta: 'resposta' },
        doneSuccess(),
      ],
    };
    render(<ChatPanel />);

    expect(speakSpy).not.toHaveBeenCalled();
  });
});

/* ─── C3 — nova run → cancel antes do submit (AC3) ────────────────────────── */

describe('ChatPanel síntese — C3 nova run → cancel (AC3)', () => {
  it('handleSend cancela a síntese em curso e depois submete', () => {
    window.localStorage.setItem(SYNTHESIS_ENABLED_STORAGE_KEY, 'true');
    render(<ChatPanel />);

    // Enviar uma mensagem (via textarea + Enter).
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(textarea, { target: { value: 'nova pergunta' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // AC3 / R1: cancel chamado, submit chamado.
    expect(cancelSpy).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalledWith('nova pergunta');
  });
});

/* ─── AC5 — browser sem suporte → toggle unsupported, sem síntese ─────────── */

describe('ChatPanel síntese — AC5 sem suporte', () => {
  it('sem speechSynthesis → toggle unsupported e speak 0x mesmo após done', () => {
    uninstallSynthesisMock(); // remove suporte ANTES do mount
    window.localStorage.setItem(SYNTHESIS_ENABLED_STORAGE_KEY, 'true'); // mesmo ON

    streamStateRef.current = {
      ...streamStateRef.current,
      events: [
        metaStart(),
        { type: 'text_delta', runId: RUN_ID, delta: 'resposta' },
        doneSuccess(),
      ],
    };
    render(<ChatPanel />);

    // O toggle reflecte unsupported.
    const btn = screen.getByTestId('synthesis-toggle-button');
    expect(btn.getAttribute('data-state')).toBe('unsupported');
    // Nenhuma síntese tentada (speak global já não existe).
    expect(speakSpy).not.toHaveBeenCalled();
  });
});
