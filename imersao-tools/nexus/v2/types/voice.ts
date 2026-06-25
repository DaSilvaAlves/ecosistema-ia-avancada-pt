/**
 * Nexus v2 — Tipos do modo voz (Story 7.1 — FR77)
 *
 * Contrato de interface do `VoiceModeButton` + `useVoiceModeState`.
 * A Story 7.1 entrega apenas a UI (botão + estados visuais + estado local).
 * NÃO contém lógica de Web Speech API — `SpeechRecognition.start()/stop()`
 * pertence à Story 7.2. Aqui só se define a forma estável que a 7.2 preencherá.
 *
 * Trace canónico:
 * - PRD-NEXUS-V2.md §6.14 FR77 — "Botão 'ligar voz' no chat principal"
 * - EPIC-7.md §5 row 7.1 — componente com múltiplos estados de render
 * - front-end-spec §4.4 — estado `idle` do `VoiceModeButton`
 *
 * Fronteira 7.1/7.2: os identificadores aqui são todos tipos TS locais
 * (sem contrato externo) — `external-contract-identifiers.md` não se aplica.
 */

/**
 * Os 5 estados de render distintos do modo voz.
 *
 * | Estado        | Cor (design system)        | Quando |
 * |---------------|----------------------------|--------|
 * | `idle`        | Cyan `#00F5FF`             | Modo voz disponível mas inactivo |
 * | `listening`   | Lime `#39FF14` (pulsação)  | A reconhecer voz (7.2) |
 * | `processing`  | Cyan `#00F5FF` (spinner)   | Transcrição/envio em curso (7.2) |
 * | `error`       | Magenta `#FF006E`         | Erro de microfone/permissão (7.2) |
 * | `unsupported` | Grey `#8892A4` (disabled) | Browser sem Web Speech API |
 */
export type VoiceModeState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'unsupported';

/**
 * Props do `VoiceModeButton`. Componente prop-driven puro: o estado é
 * fornecido pelo caller (tipicamente via `useVoiceModeState`).
 *
 * `onVoiceToggle` é o ponto de extensão da 7.2 — invocado quando o utilizador
 * clica para activar/desactivar. A 7.1 invoca-o; a 7.2 fornece a implementação
 * real (ligar `SpeechRecognition`). Em `unsupported` e `processing` o clique é
 * no-op (não invoca o callback) — ver AC4.
 */
export interface VoiceModeButtonProps {
  /** Estado de render actual. */
  state: VoiceModeState;
  /**
   * Callback invocado ao activar/desactivar o modo voz.
   * `active=true` → utilizador quer começar a ouvir; `active=false` → parar.
   * Não invocado em `unsupported` nem `processing`.
   */
  onVoiceToggle?: (active: boolean) => void;
  /** Mensagem de erro opcional (estado `error`) — usada no `aria-label`/`title`. */
  errorMessage?: string;
  /** Tamanho do ícone em px (default 18, consistente com `InputBox`). */
  iconSize?: number;
}

/* ───────────────────────────────────────────────────────────────────────────
 * Story 7.2 (FR78) — Contrato da Web Speech API (browser nativo)
 *
 * ADITIVO (não altera os tipos da 7.1 acima). O `lib.dom.d.ts` do TypeScript
 * inclui `SpeechRecognitionResult`/`SpeechRecognitionAlternative`/
 * `SpeechRecognitionResultList`, mas NÃO declara `SpeechRecognition`,
 * `SpeechRecognitionEvent`, `SpeechRecognitionErrorEvent` nem os globais
 * `window.SpeechRecognition`/`window.webkitSpeechRecognition`. Estas declarações
 * mínimas reflectem o shape REAL do protocolo (mock-protocol-fidelity.md):
 * `event.results[0][0].transcript` e `event.error` (string).
 * Trace: PRD §6.14 FR78 + arch §6 ("Voice = Web Speech API browser nativo").
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Evento de resultado (`onresult`). Shape real: `results[0][0].transcript`.
 * `results` é indexável (`SpeechRecognitionResultList` → `SpeechRecognitionResult`
 * → `SpeechRecognitionAlternative`), todos já presentes no `lib.dom.d.ts`.
 */
export interface SpeechRecognitionEventLike {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

/**
 * Evento de erro (`onerror`). `error` é o código (`'not-allowed'`,
 * `'no-speech'`, `'network'`, `'audio-capture'`, ...); `message` é texto livre.
 */
export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message: string;
}

/**
 * Instância de `SpeechRecognition`. Só os membros usados pela 7.2 são tipados —
 * configuração (`lang`/`continuous`/`interimResults`), ciclo de vida
 * (`start`/`stop`/`abort`) e os 3 handlers de evento.
 */
export interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
}

/** Construtor nativo (`new SpeechRecognition()`). */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

/* ───────────────────────────────────────────────────────────────────────────
 * Story 7.4 (FR80) — Estado de render do toggle de síntese de voz (saída)
 *
 * ADITIVO (não altera os tipos da 7.1/7.2 acima). O toggle de síntese tem 3
 * estados de render distintos (`react-component-test-criteria.md`):
 *   - `idle`        → suportado, síntese OFF (estado por omissão — D-7.4-TOGGLE)
 *   - `active`      → suportado, síntese ON (lê a resposta do cérebro após `done`)
 *   - `unsupported` → browser sem `SpeechSynthesis` (não-interactivo — AC5)
 * Trace: PRD §6.14 FR80 + EPIC-7.md §5 row 7.4 ("Toggle de voz on/off").
 * ──────────────────────────────────────────────────────────────────────────── */

/** Os 3 estados de render do toggle de síntese de voz (Story 7.4). */
export type SynthesisToggleState = 'idle' | 'active' | 'unsupported';

/**
 * Props do `SynthesisToggleButton`. Componente prop-driven puro: o estado é
 * derivado pelo caller (tipicamente o `ChatPanel`/`InputBox`) a partir do
 * suporte do browser e da preferência persistida em `localStorage`.
 */
export interface SynthesisToggleButtonProps {
  /** Estado de render actual. */
  state: SynthesisToggleState;
  /**
   * Callback invocado ao alternar a síntese on/off. Não invocado em
   * `unsupported` (clique no-op — AC5).
   */
  onToggle?: () => void;
  /** Tamanho do ícone em px (default 18, consistente com `InputBox`). */
  iconSize?: number;
}

declare global {
  interface Window {
    /** Construtor nativo (Chrome/Edge recentes). */
    SpeechRecognition?: SpeechRecognitionConstructor;
    /** Construtor com prefixo `webkit` (Chrome/Edge legados). */
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
