import { describe, expect, it } from 'vitest';
import { urlBase64ToUint8Array } from '@/lib/push/utils';

/**
 * Story 4.7 — testes do helper `urlBase64ToUint8Array` (AC4).
 *
 * `mock-protocol-fidelity.md`: pelo menos 1 teste falha se o helper tiver bug
 * de padding ou de substituição base64url → base64. A chave de fidelidade é
 * uma VAPID public key real (87 chars base64url → 65 bytes P-256, RFC 8292):
 * `0x04` (uncompressed point) + 32 bytes X + 32 bytes Y.
 */

// VAPID public key real gerada por `web-push` — 87 chars base64url → 65 bytes P-256.
const VAPID_PUBLIC_KEY =
  'BB5FvmkT0019krrVvM-XaNfIkn1nbP5ws6nEPAv1FMpFh0qUQrG8U0miJFZb4kfXm62bRkRmP8_X3yOrQLdxCF8';

describe('urlBase64ToUint8Array', () => {
  it('devolve um Uint8Array', () => {
    const result = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('fidelidade de protocolo: VAPID key real → 65 bytes P-256', () => {
    // Falharia se o padding ou a substituição base64url estivessem errados.
    const result = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    expect(result.length).toBe(65);
    // P-256 uncompressed point começa sempre com 0x04.
    expect(result[0]).toBe(0x04);
  });

  it('input que precisa de padding (==) descodifica sem throw', () => {
    // "TQ" → 1 byte; precisa de "==" de padding.
    const result = urlBase64ToUint8Array('TQ');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(0x4d); // 'M'
  });

  it('input sem padding necessário descodifica correctamente', () => {
    // "TWFu" (4 chars, múltiplo de 4) → "Man" = 3 bytes, sem padding.
    const result = urlBase64ToUint8Array('TWFu');
    expect(Array.from(result)).toEqual([0x4d, 0x61, 0x6e]);
  });

  it('substitui caracteres base64url (-, _) por base64 (+, /)', () => {
    // base64url "-_8" ↔ base64 "+/8" → bytes 0xFB 0xFF.
    const result = urlBase64ToUint8Array('-_8');
    expect(Array.from(result)).toEqual([0xfb, 0xff]);
  });
});
