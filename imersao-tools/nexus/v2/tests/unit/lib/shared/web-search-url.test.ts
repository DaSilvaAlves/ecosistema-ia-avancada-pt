import { describe, it, expect } from 'vitest';
import { isSafeHttpUrl } from '@/lib/shared/web-search-url';

/**
 * Nexus v2 — isSafeHttpUrl tests (Story 5.11 — CR Major PR #72, finding 2)
 *
 * Allowlist de esquemas partilhada pelos dois parsers de pesquisa web. Os testes
 * FALHARIAM se a allowlist não existisse: um `javascript:`/`data:` passaria para
 * `sourceUrl` da nota e link clicável (XSS). Garante que só http(s) absoluto passa.
 */

describe('isSafeHttpUrl (Story 5.11)', () => {
  it('aceita http e https absolutos (normaliza via new URL)', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe('https://example.com/');
    expect(isSafeHttpUrl('http://example.com/page?a=1')).toBe('http://example.com/page?a=1');
  });

  it('rejeita esquemas perigosos (javascript:/data:/vbscript:/file:)', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBeNull();
    expect(isSafeHttpUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejeita URL relativo / malformado / vazio', () => {
    expect(isSafeHttpUrl('/settings')).toBeNull();
    expect(isSafeHttpUrl('not a url')).toBeNull();
    expect(isSafeHttpUrl('')).toBeNull();
    expect(isSafeHttpUrl('   ')).toBeNull();
  });

  it('rejeita input não-string (robustez defensiva)', () => {
    expect(isSafeHttpUrl(null)).toBeNull();
    expect(isSafeHttpUrl(undefined)).toBeNull();
    expect(isSafeHttpUrl(123)).toBeNull();
    expect(isSafeHttpUrl({})).toBeNull();
  });

  it('apara espaços antes de validar', () => {
    expect(isSafeHttpUrl('  https://ok.com  ')).toBe('https://ok.com/');
  });
});
