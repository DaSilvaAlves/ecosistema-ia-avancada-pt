/**
 * Nexus v2 — useOnlineStatus hook tests (Story 9.5 AC1, AC10 eixo c)
 *
 * Prova o comportamento real do detector online/offline — não espelha o código:
 * - estado inicial reflecte navigator.onLine (SSR-safe: default online)
 * - evento `offline` → hook devolve false
 * - evento `online` (reconexão) → hook volta a true (nunca fica preso — AC10 c)
 * - cleanup no unmount remove os listeners (nenhum update de estado tardio)
 *
 * Mock de navigator.onLine via Object.defineProperty (padrão comum para este
 * tipo de hook); transições disparadas por window.dispatchEvent(new Event(...)).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  cleanup();
  // Repõe o default do jsdom (online) para não contaminar outros testes.
  setNavigatorOnLine(true);
  vi.restoreAllMocks();
});

describe('useOnlineStatus', () => {
  it('estado inicial reflecte navigator.onLine (online por omissão)', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('sincroniza com navigator.onLine no mount quando já offline', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('evento offline → devolve false', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('reconexão: offline → evento online → volta a true (AC10 eixo c)', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('cleanup no unmount remove os listeners online/offline', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toContain('online');
    expect(removed).toContain('offline');
  });
});
