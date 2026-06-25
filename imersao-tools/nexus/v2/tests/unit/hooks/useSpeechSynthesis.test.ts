/**
 * Nexus v2 — useSpeechSynthesis hook tests (Story 7.4 — FR80, AC7)
 *
 * Testa a camada de síntese de voz (saída) com um mock FIEL ao protocolo REAL da
 * Web Speech API de saída (`mock-protocol-fidelity.md`):
 *   - `window.speechSynthesis` com `speak`/`cancel`/`getVoices` + `voiceschanged`
 *   - `SpeechSynthesisUtterance` construtor que captura `text`/`lang`/`voice`
 *   - `getVoices()` ASSÍNCRONO: pode devolver `[]` no mount e só ficar populado
 *     após `voiceschanged` (Chrome/Edge) — espelha o contrato real
 *
 * Cenários (AC4/AC5 + Testing §C5):
 *   - speak → utterance com lang='pt-PT' e voz PT-PT seleccionada
 *   - fallback: sem pt-PT mas com pt-BR → escolhe pt-BR
 *   - fallback: sem qualquer voz pt → utterance.voice indefinida (voz por omissão)
 *   - voiceschanged assíncrono → voz resolvida após o evento
 *   - cancel → speechSynthesis.cancel chamado
 *   - browser sem suporte → isSupported=false, speak/cancel no-op, sem crash (AC5)
 *   - cleanup: listener voiceschanged removido + cancel no unmount (R2 — memory-leak)
 *
 * O mock é instalado em `window` por teste (não global em `tests/setup.ts`) para
 * isolar o controlo e não afectar os 2380 testes existentes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSpeechSynthesis,
  isSpeechSynthesisSupported,
  selectPortugueseVoice,
} from '@/hooks/useSpeechSynthesis';

/* ─── Mock fiel ao protocolo Web Speech Synthesis API ─────────────────────── */

/** Voz mínima com o shape de `SpeechSynthesisVoice` (só os campos usados). */
function makeVoice(lang: string, name = lang): SpeechSynthesisVoice {
  return {
    lang,
    name,
    default: false,
    localService: true,
    voiceURI: name,
  } as SpeechSynthesisVoice;
}

/** Utterance capturada pelo construtor mock (espelha o shape real). */
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

/**
 * Mock de `window.speechSynthesis`. Reflecte o shape real: `speak`/`cancel`/
 * `getVoices` + `addEventListener('voiceschanged')`. `getVoices` é controlável
 * (começa vazio; `setVoices` simula a chegada assíncrona via `voiceschanged`).
 */
class MockSpeechSynthesis {
  speak = vi.fn();
  cancel = vi.fn();
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Array<() => void> = [];

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  addEventListener(type: string, cb: () => void): void {
    if (type === 'voiceschanged') this.listeners.push(cb);
  }

  removeEventListener(type: string, cb: () => void): void {
    if (type === 'voiceschanged') {
      this.listeners = this.listeners.filter((l) => l !== cb);
    }
  }

  /** Número de listeners `voiceschanged` registados (para asserções de cleanup). */
  get listenerCount(): number {
    return this.listeners.length;
  }

  /** Simula a chegada assíncrona das vozes (Chrome/Edge): popula + dispara evento. */
  setVoices(voices: SpeechSynthesisVoice[]): void {
    this.voices = voices;
    this.listeners.forEach((l) => l());
  }

  /** Popula as vozes SEM disparar o evento (Firefox/Safari: já vêm no mount). */
  seedVoices(voices: SpeechSynthesisVoice[]): void {
    this.voices = voices;
  }
}

function installMock(): MockSpeechSynthesis {
  MockUtterance.instances = [];
  const synth = new MockSpeechSynthesis();
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    MockUtterance;
  return synth;
}

function uninstallMock(): void {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  delete (window as unknown as { SpeechSynthesisUtterance?: unknown })
    .SpeechSynthesisUtterance;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  uninstallMock();
});

/* ─── selectPortugueseVoice (pura) — selecção + fallback (AC4) ─────────────── */

describe('selectPortugueseVoice (AC4)', () => {
  it('prefere pt-PT quando disponível', () => {
    const voices = [makeVoice('en-US'), makeVoice('pt-BR'), makeVoice('pt-PT')];
    expect(selectPortugueseVoice(voices)?.lang).toBe('pt-PT');
  });

  it('fallback para pt-BR quando não há pt-PT', () => {
    const voices = [makeVoice('en-US'), makeVoice('pt-BR')];
    expect(selectPortugueseVoice(voices)?.lang).toBe('pt-BR');
  });

  it('null quando não há nenhuma voz pt (fallback gracioso → voz por omissão)', () => {
    const voices = [makeVoice('en-US'), makeVoice('fr-FR')];
    expect(selectPortugueseVoice(voices)).toBeNull();
  });

  it('aceita o separador underscore (pt_PT) — normalização', () => {
    const voices = [makeVoice('pt_PT', 'Joana')];
    expect(selectPortugueseVoice(voices)?.name).toBe('Joana');
  });
});

/* ─── isSpeechSynthesisSupported (SSR-safe) ───────────────────────────────── */

describe('isSpeechSynthesisSupported (AC5)', () => {
  it('true quando speechSynthesis está em window', () => {
    installMock();
    expect(isSpeechSynthesisSupported()).toBe(true);
  });

  it('false quando speechSynthesis ausente', () => {
    uninstallMock();
    expect(isSpeechSynthesisSupported()).toBe(false);
  });
});

/* ─── speak → lang pt-PT + voz seleccionada (AC2/AC4) ─────────────────────── */

describe('useSpeechSynthesis — speak (AC2/AC4)', () => {
  it('speak cria utterance com lang=pt-PT e a voz PT-PT (vozes já presentes no mount)', () => {
    const synth = installMock();
    synth.seedVoices([makeVoice('en-US'), makeVoice('pt-PT', 'Joana')]);

    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSupported).toBe(true);

    act(() => result.current.speak('Olá, criei a tarefa.'));

    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = MockUtterance.instances[0];
    expect(utterance.text).toBe('Olá, criei a tarefa.');
    expect(utterance.lang).toBe('pt-PT');
    expect(utterance.voice?.name).toBe('Joana');
  });

  it('voiceschanged ASSÍNCRONO: vozes chegam após o mount → voz resolvida no speak', () => {
    const synth = installMock(); // getVoices() começa vazio (Chrome/Edge)

    const { result } = renderHook(() => useSpeechSynthesis());

    // As vozes chegam tarde via voiceschanged.
    act(() => synth.setVoices([makeVoice('pt-PT', 'Catarina')]));

    act(() => result.current.speak('resposta'));

    const utterance = MockUtterance.instances[0];
    expect(utterance.lang).toBe('pt-PT');
    expect(utterance.voice?.name).toBe('Catarina');
  });

  it('fallback gracioso: sem voz pt → utterance.voice indefinida, ainda fala (AC4)', () => {
    const synth = installMock();
    synth.seedVoices([makeVoice('en-US'), makeVoice('fr-FR')]);

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => result.current.speak('texto sem voz pt'));

    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = MockUtterance.instances[0];
    expect(utterance.lang).toBe('pt-PT'); // lang continua pt-PT
    expect(utterance.voice).toBeNull(); // mas sem voz explícita
  });

  it('speak com texto vazio (após trim) → no-op (não fala)', () => {
    const synth = installMock();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => result.current.speak('   '));

    expect(synth.speak).not.toHaveBeenCalled();
  });
});

/* ─── cancel (AC3) ────────────────────────────────────────────────────────── */

describe('useSpeechSynthesis — cancel (AC3)', () => {
  it('cancel → speechSynthesis.cancel chamado', () => {
    const synth = installMock();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => result.current.cancel());

    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });
});

/* ─── browser sem suporte (AC5 — sem sucesso silencioso) ──────────────────── */

describe('useSpeechSynthesis — sem suporte (AC5)', () => {
  it('speechSynthesis ausente → isSupported=false, speak/cancel no-op, sem crash', () => {
    uninstallMock(); // garante ausência

    const { result } = renderHook(() => useSpeechSynthesis());

    expect(result.current.isSupported).toBe(false);
    // speak/cancel não podem lançar nem ter efeito.
    expect(() => act(() => result.current.speak('algo'))).not.toThrow();
    expect(() => act(() => result.current.cancel())).not.toThrow();
    expect(MockUtterance.instances).toHaveLength(0);
  });
});

/* ─── cleanup no unmount (R2 — memory-leak do listener voiceschanged) ──────── */

describe('useSpeechSynthesis — cleanup no unmount (R2/AC4)', () => {
  it('remove o listener voiceschanged e cancela a fala no unmount', () => {
    const synth = installMock();
    const { unmount } = renderHook(() => useSpeechSynthesis());

    // O efeito registou exactamente 1 listener.
    expect(synth.listenerCount).toBe(1);

    unmount();

    // R2: listener removido (sem memory-leak) + fala cancelada.
    expect(synth.listenerCount).toBe(0);
    expect(synth.cancel).toHaveBeenCalled();
  });
});
