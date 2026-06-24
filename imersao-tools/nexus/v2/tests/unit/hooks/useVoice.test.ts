/**
 * Nexus v2 — useVoice hook tests (Story 7.2 — FR78, AC6)
 *
 * Testa a lógica de reconhecimento Web Speech PT-PT com um mock de
 * `SpeechRecognition` que reflecte o protocolo REAL da API
 * (`mock-protocol-fidelity.md`):
 *   - `onresult` recebe um evento com `results[0][0].transcript`
 *   - `onerror` recebe um evento com `error` (string) e `message`
 *   - `onend` dispara SEMPRE no fim (inclusive após `onresult` — ressalva PO #1)
 *   - `lang`/`continuous`/`interimResults` são propriedades configuráveis
 *
 * Cenários obrigatórios (AC6 + Testing §cenários):
 *   C1 caminho feliz   — onresult → transcript PT-PT → setProcessing + onTranscript
 *   C2 not-allowed     — onerror 'not-allowed' → setError('Permissão de microfone negada')
 *   C3 no-speech       — onerror 'no-speech'   → setError('Sem resposta de voz detectada')
 *   C4 onend-sem-result— onend sem onresult    → setError('Sem resposta de voz detectada')
 *   C5 isSupported=false — toggle() é no-op, SpeechRecognition não instanciado
 *   C6 (shape)         — falha se o mock usar results[0].transcript (anti-tautológico)
 *
 * O mock é instalado em `window.SpeechRecognition` por teste (não global em
 * `tests/setup.ts`) para isolar o controlo da instância e não afectar os 2359
 * testes existentes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoice, VOICE_ERROR_INIT_FAILED } from '@/hooks/useVoice';
import type { UseVoiceModeStateResult } from '@/hooks/useVoiceModeState';
import type { VoiceModeState } from '@/types/voice';

/* ─── Mock fiel ao protocolo Web Speech API ───────────────────────────────── */

/**
 * Mock de `SpeechRecognition`. Reflecte o shape real: handlers `onresult`/
 * `onerror`/`onend`, propriedades `lang`/`continuous`/`interimResults`, e os
 * métodos `start`/`stop`/`abort`. Expõe helpers `emitResult`/`emitError`/
 * `emitEnd` para os testes dispararem eventos com o shape correcto.
 */
class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];
  /** Se true, o próximo `start()` lança de forma síncrona (VOICE-001 (b)). */
  static throwOnStart = false;
  /**
   * Se true, o construtor (`new SpeechRecognition()`) lança (VOICE-002 — CR
   * Major 1: Firefox AR7 PT-PT, instanciação nativa pode falhar).
   */
  static throwOnConstruct = false;

  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: ((event: unknown) => void) | null = null;

  start = vi.fn(() => {
    if (MockSpeechRecognition.throwOnStart) {
      throw new DOMException('already started', 'InvalidStateError');
    }
  });
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    if (MockSpeechRecognition.throwOnConstruct) {
      throw new DOMException('construction failed', 'NotSupportedError');
    }
    MockSpeechRecognition.instances.push(this);
  }

  /**
   * Dispara `onresult` com o shape REAL: `results[0][0].transcript`.
   * `results` é indexável duas vezes (lista → resultado → alternativa).
   */
  emitResult(transcript: string): void {
    const alternative = { transcript, confidence: 0.95 };
    const result = { 0: alternative, length: 1, isFinal: true };
    const results = { 0: result, length: 1 };
    this.onresult?.({ results, resultIndex: 0 });
  }

  /** Dispara `onerror` com o shape real: `error` (string código) + `message`. */
  emitError(error: string): void {
    this.onerror?.({ error, message: `mock error: ${error}` });
  }

  /** Dispara `onend` (sempre corre no fim de uma sessão). */
  emitEnd(): void {
    this.onend?.(new Event('end'));
  }
}

/** Cria um duplo do `useVoiceModeState` com `state` mutável e spies. */
function makeVoiceState(
  initialState: VoiceModeState = 'idle',
  isSupported = true
): UseVoiceModeStateResult & { __setState: (s: VoiceModeState) => void } {
  let state = initialState;
  const obj = {
    get state() {
      return state;
    },
    toggle: vi.fn(() => {
      // Espelha a transição idle⇄listening do contrato real da 7.1.
      if (state === 'listening') state = 'idle';
      else if (state === 'idle' || state === 'error') state = 'listening';
    }),
    setError: vi.fn(() => {
      state = 'error';
    }),
    setProcessing: vi.fn(() => {
      state = 'processing';
    }),
    reset: vi.fn(() => {
      state = 'idle';
    }),
    errorMessage: '',
    isSupported,
    __setState: (s: VoiceModeState) => {
      state = s;
    },
  };
  return obj as UseVoiceModeStateResult & { __setState: (s: VoiceModeState) => void };
}

function installMock(): void {
  MockSpeechRecognition.instances = [];
  MockSpeechRecognition.throwOnStart = false;
  MockSpeechRecognition.throwOnConstruct = false;
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
    MockSpeechRecognition;
}

function uninstallMock(): void {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
}

beforeEach(() => {
  vi.clearAllMocks();
  installMock();
});

afterEach(() => {
  uninstallMock();
});

/* ─── C1 — caminho feliz ──────────────────────────────────────────────────── */

describe('useVoice — C1 caminho feliz (AC2/AC3)', () => {
  it('onresult → transcript PT-PT → setProcessing chamado + texto entregue via onTranscript', () => {
    const voiceState = makeVoiceState('idle');
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    // Clicar o botão (idle) inicia o reconhecimento.
    act(() => result.current.toggle());

    const rec = MockSpeechRecognition.instances[0];
    expect(rec).toBeDefined();
    // AC1/AC3: configuração obrigatória aplicada.
    expect(rec.lang).toBe('pt-PT');
    expect(rec.continuous).toBe(false);
    expect(rec.interimResults).toBe(false);
    expect(rec.start).toHaveBeenCalledTimes(1);
    expect(voiceState.toggle).toHaveBeenCalledTimes(1);

    // Transcrição em PT-PT chega.
    act(() => rec.emitResult('cria uma tarefa para amanhã'));

    // AC2: setProcessing chamado, texto entregue.
    expect(voiceState.setProcessing).toHaveBeenCalledTimes(1);
    expect(onTranscript).toHaveBeenCalledWith('cria uma tarefa para amanhã');
    // AC4: nenhum erro no caminho feliz.
    expect(voiceState.setError).not.toHaveBeenCalled();
  });

  it('onend após onresult NÃO dispara setError (ressalva PO #1 — gotResultRef)', () => {
    const voiceState = makeVoiceState('idle');
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitResult('olá mundo'));
    // `onend` corre SEMPRE no fim, inclusive após onresult bem-sucedido.
    act(() => rec.emitEnd());

    // O caminho feliz não pode cair em setError no onend.
    expect(voiceState.setError).not.toHaveBeenCalled();
    expect(onTranscript).toHaveBeenCalledTimes(1);
  });
});

/* ─── C2 — permissão negada ───────────────────────────────────────────────── */

describe('useVoice — C2 not-allowed (AC4)', () => {
  it("onerror 'not-allowed' → setError('Permissão de microfone negada')", () => {
    const voiceState = makeVoiceState('idle');
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitError('not-allowed'));

    expect(voiceState.setError).toHaveBeenCalledWith('Permissão de microfone negada');
    // onend a seguir não re-dispara (gotResultRef marcado no onerror).
    act(() => rec.emitEnd());
    expect(voiceState.setError).toHaveBeenCalledTimes(1);
  });
});

/* ─── C3 — no-speech ──────────────────────────────────────────────────────── */

describe('useVoice — C3 no-speech (AC4)', () => {
  it("onerror 'no-speech' → setError('Sem resposta de voz detectada')", () => {
    const voiceState = makeVoiceState('idle');
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitError('no-speech'));

    expect(voiceState.setError).toHaveBeenCalledWith('Sem resposta de voz detectada');
  });

  it('código de erro não mapeado → mensagem genérica PT-PT com o código', () => {
    const voiceState = makeVoiceState('idle');
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitError('audio-capture'));

    expect(voiceState.setError).toHaveBeenCalledWith('Erro de reconhecimento: audio-capture');
  });
});

/* ─── C4 — onend sem resultado ────────────────────────────────────────────── */

describe('useVoice — C4 onend sem onresult (AC4 / eixo c)', () => {
  it('onend sem onresult anterior → setError(no-speech), nunca sucesso silencioso', () => {
    const voiceState = makeVoiceState('idle');
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    // Fim sem qualquer resultado nem erro (silêncio total).
    act(() => rec.emitEnd());

    expect(voiceState.setError).toHaveBeenCalledWith('Sem resposta de voz detectada');
    expect(onTranscript).not.toHaveBeenCalled();
    expect(voiceState.setProcessing).not.toHaveBeenCalled();
  });

  it('onresult com transcript vazio → setError(no-speech) (AC3 — string não vazia)', () => {
    const voiceState = makeVoiceState('idle');
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitResult('   '));

    expect(voiceState.setError).toHaveBeenCalledWith('Sem resposta de voz detectada');
    expect(onTranscript).not.toHaveBeenCalled();
  });
});

/* ─── C5 — não suportado ──────────────────────────────────────────────────── */

describe('useVoice — C5 isSupported=false (AC1/AC4)', () => {
  it('sem SpeechRecognition no window → toggle() é no-op, nada instanciado', () => {
    uninstallMock(); // remove o construtor → não suportado
    const voiceState = makeVoiceState('unsupported', false);
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());

    expect(MockSpeechRecognition.instances).toHaveLength(0);
    expect(voiceState.toggle).not.toHaveBeenCalled();
    expect(voiceState.setError).not.toHaveBeenCalled();
  });
});

/* ─── C6 — fidelidade do shape (anti-tautológico) ─────────────────────────── */

describe('useVoice — C6 fidelidade do protocolo (mock-protocol-fidelity.md)', () => {
  it('o hook lê results[0][0].transcript — falharia se lesse results[0].transcript', () => {
    const voiceState = makeVoiceState('idle');
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    // Evento com o shape REAL: o transcript vive em results[0][0], NÃO em
    // results[0]. results[0].transcript é `undefined` no protocolo real.
    const alternative = { transcript: 'agenda reunião', confidence: 0.9 };
    const speechResult = { 0: alternative, length: 1, isFinal: true };
    const results = { 0: speechResult, length: 1 };
    act(() => rec.onresult?.({ results, resultIndex: 0 }));

    // Se o código lesse results[0].transcript obteria `undefined` → trim vazio →
    // setError(no-speech) e onTranscript nunca seria chamado. O facto de
    // onTranscript receber o texto correcto prova que lê results[0][0].
    expect(onTranscript).toHaveBeenCalledWith('agenda reunião');
    expect(voiceState.setProcessing).toHaveBeenCalledTimes(1);
    expect(voiceState.setError).not.toHaveBeenCalled();
    // Confirmação directa do shape: results[0].transcript não existe.
    expect((results as { 0: { transcript?: string } })[0].transcript).toBeUndefined();
  });
});

/* ─── Stop / ciclo de vida ────────────────────────────────────────────────── */

describe('useVoice — stop + cleanup (AC5)', () => {
  it('toggle em listening → chama stop() da instância e voiceState.toggle', () => {
    const voiceState = makeVoiceState('idle');
    const { result, rerender } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle()); // idle → listening (start)
    const rec = MockSpeechRecognition.instances[0];
    expect(rec.start).toHaveBeenCalledTimes(1);

    // O primeiro toggle moveu o `state` do contrato para 'listening'. Em
    // produção isso re-renderiza o InputBox (consumidor) e sincroniza o
    // `stateRef` interno via useEffect. No teste forçamos esse rerender — o
    // mock muta `state` sem disparar re-render do React.
    rerender();

    act(() => result.current.toggle()); // listening → stop
    expect(rec.stop).toHaveBeenCalled();
    expect(voiceState.toggle).toHaveBeenCalledTimes(2);
    // Não reinstanciou (start continua a 1).
    expect(rec.start).toHaveBeenCalledTimes(1);
    expect(MockSpeechRecognition.instances).toHaveLength(1);
  });

  it('VOICE-001 (b): start() lança de forma síncrona → UI NÃO transita (toggleMode não chamado)', () => {
    const voiceState = makeVoiceState('idle');
    MockSpeechRecognition.throwOnStart = true;
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());

    const rec = MockSpeechRecognition.instances[0];
    // start() foi tentado e lançou.
    expect(rec.start).toHaveBeenCalledTimes(1);
    // VOICE-001 (b): a UI NÃO transita (toggleMode não é chamado) — fica
    // coerente com o recognizer que não arrancou. O setError interno coloca a
    // UI em `error`, sem dupla transição.
    expect(voiceState.toggle).not.toHaveBeenCalled();
    expect(voiceState.setError).toHaveBeenCalledWith('Sem resposta de voz detectada');
    // A instância falhada foi descartada (efémera — AC5).
    expect(MockSpeechRecognition.instances[0]).toBeDefined();
  });

  it('VOICE-001 (b): stop() lança de forma síncrona → UI NÃO transita', () => {
    const voiceState = makeVoiceState('idle');
    const { result, rerender } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle()); // idle → listening (start ok)
    const rec = MockSpeechRecognition.instances[0];
    expect(voiceState.toggle).toHaveBeenCalledTimes(1);

    // Em listening; o próximo toggle chama stop(), que vai lançar.
    rec.stop = vi.fn(() => {
      throw new DOMException('not started', 'InvalidStateError');
    });
    rerender(); // sincroniza stateRef → 'listening'

    act(() => result.current.toggle()); // listening → stop (lança)

    // stop() lançou → UI NÃO transita de novo (continua a 1 chamada de toggle).
    expect(rec.stop).toHaveBeenCalledTimes(1);
    expect(voiceState.toggle).toHaveBeenCalledTimes(1);
  });

  it('unmount pára o reconhecimento e remove handlers (sem state update órfão)', () => {
    const voiceState = makeVoiceState('idle');
    const { result, unmount } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    unmount();

    // Handlers limpos e stop() chamado no teardown.
    expect(rec.onresult).toBeNull();
    expect(rec.onerror).toBeNull();
    expect(rec.onend).toBeNull();
    expect(rec.stop).toHaveBeenCalled();
  });
});

/* ─── VOICE-002 (CR Major 1) — construtor lança → nunca crash silencioso ──── */

describe('useVoice — VOICE-002 instanciação lança (AC4/AC8)', () => {
  it('o construtor nativo lança → setError(init failed), UI não transita, sem crash', () => {
    const voiceState = makeVoiceState('idle');
    MockSpeechRecognition.throwOnConstruct = true;
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoice({ voiceState, onTranscript }));

    // A excepção do construtor TEM de ser capturada — toggle() não pode lançar.
    expect(() => act(() => result.current.toggle())).not.toThrow();

    // Nenhuma instância foi registada (o construtor lançou antes do push).
    expect(MockSpeechRecognition.instances).toHaveLength(0);
    // AC4/AC8: falha explícita, nunca sucesso silencioso.
    expect(voiceState.setError).toHaveBeenCalledWith(VOICE_ERROR_INIT_FAILED);
    // VOICE-001 (b): start() devolveu false → a UI não transita (idle⇄listening).
    expect(voiceState.toggle).not.toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
  });
});

/* ─── VOICE-003 (CR Major 2) — sem onTranscript não fica preso em processing ─ */

describe('useVoice — VOICE-003 sem onTranscript (AC2 — estado sem saída)', () => {
  it('onresult sem callback onTranscript → setProcessing seguido de reset (não fica preso)', () => {
    const voiceState = makeVoiceState('idle');
    // Sem `onTranscript` — a interface pública permite omiti-lo.
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle());
    const rec = MockSpeechRecognition.instances[0];

    act(() => rec.emitResult('cria uma tarefa'));

    // A máquina de estados TEM de sair de `processing`: sem callback, o hook
    // repõe a UI para `idle` via reset (estado nunca inalcançável).
    expect(voiceState.setProcessing).toHaveBeenCalledTimes(1);
    expect(voiceState.reset).toHaveBeenCalledTimes(1);
    expect(voiceState.setError).not.toHaveBeenCalled();
  });
});

/* ─── VOICE-004 (CR Major 3) — cancel() liberta o microfone ───────────────── */

describe('useVoice — VOICE-004 cancel() (AC5 / Security)', () => {
  it('cancel() em listening → teardown da instância (microfone libertado) + reset da UI', () => {
    const voiceState = makeVoiceState('idle');
    const { result, rerender } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.toggle()); // idle → listening
    const rec = MockSpeechRecognition.instances[0];
    rerender(); // sincroniza stateRef → 'listening'

    act(() => result.current.cancel());

    // A instância foi descartada (handlers removidos + stop chamado) → microfone
    // libertado; a UI volta a idle.
    expect(rec.onresult).toBeNull();
    expect(rec.onerror).toBeNull();
    expect(rec.onend).toBeNull();
    expect(rec.stop).toHaveBeenCalled();
    expect(voiceState.reset).toHaveBeenCalledTimes(1);
  });

  it('cancel() sem sessão activa → no-op (não toca na UI)', () => {
    const voiceState = makeVoiceState('idle');
    const { result } = renderHook(() => useVoice({ voiceState }));

    act(() => result.current.cancel());

    expect(MockSpeechRecognition.instances).toHaveLength(0);
    expect(voiceState.reset).not.toHaveBeenCalled();
    expect(voiceState.setError).not.toHaveBeenCalled();
  });
});
