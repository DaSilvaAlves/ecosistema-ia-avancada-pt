/**
 * Nexus v2 — Helpers puros de Web Push (Story 4.7, AC3)
 *
 * `urlBase64ToUint8Array` converte a VAPID public key (base64url, RFC 8292)
 * para o `Uint8Array` que a Push API exige em `applicationServerKey`.
 *
 * Sem dependências externas — só APIs nativas (`atob`). Compatível com
 * Chrome 110+ e Edge 110+ (NFR23). Referência: Mozilla MDN Web Push.
 */

/**
 * Converte uma string base64url (VAPID public key) num `Uint8Array`.
 *
 * Passos:
 * 1. Acrescenta o padding `=` em falta (base64url omite-o).
 * 2. Substitui os caracteres base64url (`-`, `_`) pelos base64 (`+`, `/`).
 * 3. Descodifica com `atob` e mapeia cada char para o seu code point.
 *
 * @param base64String VAPID public key em base64url (ex.: 87 chars → 65 bytes P-256).
 * @returns `Uint8Array` pronto para `pushManager.subscribe`.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData).map((char) => char.charCodeAt(0)));
}
