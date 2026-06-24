import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InputBox } from '@/components/chat/InputBox';

/**
 * Nexus v2 — InputBox component tests (Story 0.4 + Story 7.3)
 *
 * Verifica:
 *  - Enter envia mensagem
 *  - Shift+Enter NÃO envia (nova linha)
 *  - Empty submit é bloqueado
 *  - Story 7.3 (FR79): encadeamento voz → texto → cérebro. O texto transcrito
 *    pelo `useVoice` (7.2) é injectado no campo via `onTranscript` → `setText`
 *    e, ao enviar, chega ao pipeline `onSend` → `stream.submit` → cérebro
 *    (D-7.3-PIPELINE-ROUTE opção A — manual-com-revisão, sem fluxo novo).
 */

describe('InputBox', () => {
  it('chama onSend ao pressionar Enter', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('NÃO chama onSend ao pressionar Shift+Enter (nova linha)', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(textarea, { target: { value: 'multi\nline' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('NÃO chama onSend com texto vazio', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  // Story 1.9 Iter 2 — N4 — branches `streamingState`
  describe('streamingState branches (Story 1.9)', () => {
    it('idle (default) — textarea ENABLED com placeholder canónico', () => {
      render(<InputBox onSend={vi.fn()} />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).not.toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toMatch(/Escreve qualquer coisa/i);
      expect(textarea.getAttribute('aria-describedby')).toBeNull();
    });

    it('streaming — textarea DISABLED com placeholder "A processar..." e aria-describedby', () => {
      render(<InputBox onSend={vi.fn()} streamingState="streaming" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toBe('A processar...');
      expect(textarea.getAttribute('aria-describedby')).toBe('input-box-state-message');
    });

    it('preview-pending — textarea DISABLED com placeholder de confirmação', () => {
      render(<InputBox onSend={vi.fn()} streamingState="preview-pending" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toMatch(/Confirma a acção acima/i);
      expect(textarea.getAttribute('aria-describedby')).toBe('input-box-state-message');
    });

    it('streaming — onSend NÃO é invocado quando Enter pressed', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} streamingState="streaming" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      fireEvent.change(textarea, { target: { value: 'tentar enviar durante stream' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('preview-pending — onSend NÃO é invocado quando Enter pressed', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} streamingState="preview-pending" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      fireEvent.change(textarea, { target: { value: 'tentar enviar durante preview' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('disabled prop legacy (Story 0.4) continua a funcionar', () => {
      render(<InputBox onSend={vi.fn()} disabled />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
    });
  });

  /**
   * Story 7.3 (FR79) — Texto transcrito → cérebro multi-intent.
   *
   * Testes de integração do encadeamento real `onTranscript` → `setText` →
   * `submit()` → `onSend`. NÃO mocka o `useVoice` nem o `useVoiceModeState`:
   * instala um `SpeechRecognition` fiel ao protocolo real da Web Speech API em
   * `window` (`mock-protocol-fidelity.md`) e dispara os eventos `onresult`/
   * `onerror`. Assim o pipeline completo do `InputBox` (composição dos dois
   * hooks reais da 7.1/7.2) é exercitado — um teste falharia se o encadeamento
   * estivesse quebrado.
   *
   * Cenários (AC5 + Testing §cenários obrigatórios):
   *   C1 caminho feliz       — onresult → onSend chamado com o texto transcrito
   *   C2 texto pré-existente  — transcrição anexada ao existente com espaço
   *   C3 falha de reconhecimento — onerror → onSend NÃO chamado, campo preservado
   *   C4 estado após injecção — após onresult, o VoiceModeButton volta a `idle`
   */
  describe('Story 7.3 — voz → texto → cérebro (onTranscript → onSend)', () => {
    /**
     * Mock de `SpeechRecognition` fiel ao protocolo real (espelha o de
     * `useVoice.test.ts`): `onresult` recebe `results[0][0].transcript`,
     * `onerror` recebe `error` (código string). Métodos `start`/`stop`.
     */
    class MockSpeechRecognition {
      static instances: MockSpeechRecognition[] = [];

      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;

      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: ((event: unknown) => void) | null = null;

      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();

      constructor() {
        MockSpeechRecognition.instances.push(this);
      }

      /** Dispara `onresult` com o shape REAL: `results[0][0].transcript`. */
      emitResult(transcript: string): void {
        const alternative = { transcript, confidence: 0.95 };
        const result = { 0: alternative, length: 1, isFinal: true };
        const results = { 0: result, length: 1 };
        this.onresult?.({ results, resultIndex: 0 });
      }

      /** Dispara `onerror` com o shape real: `error` (código) + `message`. */
      emitError(error: string): void {
        this.onerror?.({ error, message: `mock error: ${error}` });
      }
    }

    function installSpeechMock(): void {
      MockSpeechRecognition.instances = [];
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
        MockSpeechRecognition;
    }

    function uninstallSpeechMock(): void {
      delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
      delete (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;
    }

    beforeEach(() => {
      vi.clearAllMocks();
      installSpeechMock();
    });

    afterEach(() => {
      uninstallSpeechMock();
    });

    // C1 — caminho feliz: transcrição → campo → Enviar → onSend com texto certo.
    it('C1 — transcrição "criar tarefa comprar leite" → onSend chamado com o texto (trim)', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} />);

      // Inicia o reconhecimento (clique no botão de voz, estado idle → listening).
      const micButton = screen.getByTestId('voice-mode-button');
      act(() => fireEvent.click(micButton));

      const rec = MockSpeechRecognition.instances[0];
      expect(rec).toBeDefined();
      expect(rec.lang).toBe('pt-PT');

      // A transcrição PT-PT chega — injectada no campo via onTranscript → setText.
      act(() => rec.emitResult('criar tarefa comprar leite'));

      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect((textarea as HTMLTextAreaElement).value).toBe('criar tarefa comprar leite');

      // Antes de enviar, o cérebro (onSend) ainda não foi chamado — opção A
      // (manual-com-revisão): o utilizador é que dispara o envio.
      expect(onSend).not.toHaveBeenCalled();

      // O utilizador envia (Enter) → onSend → stream.submit → cérebro.
      act(() => fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false }));

      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith('criar tarefa comprar leite');
    });

    // C2 — texto pré-existente: a transcrição anexa ao existente com um espaço.
    it('C2 — campo com texto pré-existente → transcrição anexada com espaço → onSend com tudo', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} />);

      // Texto escrito manualmente antes de falar.
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      act(() => fireEvent.change(textarea, { target: { value: 'tarefa:' } }));

      // Falar acrescenta ao que já lá estava.
      const micButton = screen.getByTestId('voice-mode-button');
      act(() => fireEvent.click(micButton));
      const rec = MockSpeechRecognition.instances[0];
      act(() => rec.emitResult('comprar leite'));

      // Concatenado com espaço (trimEnd do prefixo + espaço + transcrição).
      expect((textarea as HTMLTextAreaElement).value).toBe('tarefa: comprar leite');

      act(() => fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false }));
      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith('tarefa: comprar leite');
    });

    // C3 — falha de reconhecimento: onSend NÃO chamado, campo preservado (AC4).
    it('C3 — onerror (no-speech) → onSend NÃO chamado e campo mantém conteúdo anterior', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} />);

      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      act(() => fireEvent.change(textarea, { target: { value: 'rascunho' } }));

      const micButton = screen.getByTestId('voice-mode-button');
      act(() => fireEvent.click(micButton));
      const rec = MockSpeechRecognition.instances[0];

      // O reconhecimento falha (sem fala detectada).
      act(() => rec.emitError('no-speech'));

      // AC4 — sem sucesso silencioso: nada é enviado e o campo fica intacto.
      expect(onSend).not.toHaveBeenCalled();
      expect((textarea as HTMLTextAreaElement).value).toBe('rascunho');
    });

    // C4 — estado após injecção: o VoiceModeButton volta a `idle` (AC2).
    it('C4 — após onresult, o estado de voz volta a idle (processing é transitório)', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} />);

      const micButton = screen.getByTestId('voice-mode-button');
      // Em idle, o botão expõe aria-pressed=false.
      expect(micButton.getAttribute('aria-pressed')).toBe('false');

      act(() => fireEvent.click(micButton));
      // Em listening, aria-pressed passa a true.
      expect(micButton.getAttribute('aria-pressed')).toBe('true');

      const rec = MockSpeechRecognition.instances[0];
      act(() => rec.emitResult('criar tarefa comprar leite'));

      // AC2 — após a injecção (voice.reset() no onTranscript), volta a idle:
      // não fica preso em `processing` nem em `listening`; pronto para enviar.
      expect(micButton.getAttribute('aria-pressed')).toBe('false');

      // E o pipeline de envio continua disponível imediatamente a seguir.
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      act(() => fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false }));
      expect(onSend).toHaveBeenCalledWith('criar tarefa comprar leite');
    });
  });
});
