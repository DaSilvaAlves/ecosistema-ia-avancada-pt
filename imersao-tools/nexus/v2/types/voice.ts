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
