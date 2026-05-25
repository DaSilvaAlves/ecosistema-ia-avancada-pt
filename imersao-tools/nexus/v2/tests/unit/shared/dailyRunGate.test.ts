import { describe, it, expect, beforeEach } from 'vitest';
import {
  DAILY_RUN_STORAGE_KEY,
  getTodayLocalIso,
  shouldRunDailyEngine,
  resetDailyEngineRun,
} from '@/lib/shared/dailyRunGate';

/**
 * Nexus v2 — dailyRunGate tests (Story 3.10 / AC9)
 *
 * Cobertura das 3 funções puras + 1 com efeito colateral (`resetDailyEngineRun`).
 *
 * Nota fuso (ver Dev Notes da story): `getTodayLocalIso` depende do fuso do
 * ambiente Vitest. Para evitar falhas em CI (UTC) vs local (Europe/Lisbon), os
 * testes assertam **formato** (`/^\d{4}-\d{2}-\d{2}$/`) em vez de valor exacto
 * de string, excepto onde a comparação é puramente lexicográfica
 * (`shouldRunDailyEngine`) — aí os valores são fixados.
 *
 * Trace: Story 3.10 AC9 + [AUTO-DECISION] A1 + A2 + A9.
 */

describe('dailyRunGate — Story 3.10', () => {
  describe('DAILY_RUN_STORAGE_KEY', () => {
    it('é exactamente "nexus:lastDailyEngineRun" (contrato com hook)', () => {
      expect(DAILY_RUN_STORAGE_KEY).toBe('nexus:lastDailyEngineRun');
    });
  });

  describe('getTodayLocalIso()', () => {
    it('devolve string no formato YYYY-MM-DD (10 chars, dois hifens)', () => {
      const result = getTodayLocalIso();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toHaveLength(10);
    });

    it('aceita um Date custom e produz YYYY-MM-DD desse dia (formato)', () => {
      const result = getTodayLocalIso(new Date('2026-05-24T10:00:00Z'));
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // O ano deve ser 2026 (10:00 UTC = entre 09:00 e 11:00 em qualquer fuso
      // razoável, todos a 24 de Maio de 2026 ou próximo).
      expect(result.startsWith('2026-05-')).toBe(true);
    });

    it('produz strings comparáveis lexicograficamente (mesmo formato)', () => {
      const a = getTodayLocalIso(new Date('2026-05-23T12:00:00Z'));
      const b = getTodayLocalIso(new Date('2026-05-25T12:00:00Z'));
      // 23 < 25 cronologicamente — comparação de strings tem de respeitar.
      expect(a < b).toBe(true);
    });

    it('com 12:00 UTC em dias diferentes produz strings diferentes', () => {
      const dia1 = getTodayLocalIso(new Date('2026-01-01T12:00:00Z'));
      const dia2 = getTodayLocalIso(new Date('2026-01-02T12:00:00Z'));
      expect(dia1).not.toBe(dia2);
    });
  });

  describe('shouldRunDailyEngine()', () => {
    it('lastRunIso = null → true (nunca correu)', () => {
      expect(shouldRunDailyEngine('2026-05-24', null)).toBe(true);
    });

    it('lastRunIso = "" → true (defensivo, trata como nunca correu)', () => {
      expect(shouldRunDailyEngine('2026-05-24', '')).toBe(true);
    });

    it('lastRunIso = "2026-05-23", today = "2026-05-24" → true (novo dia)', () => {
      expect(shouldRunDailyEngine('2026-05-24', '2026-05-23')).toBe(true);
    });

    it('lastRunIso = "2026-05-24", today = "2026-05-24" → false (mesmo dia)', () => {
      expect(shouldRunDailyEngine('2026-05-24', '2026-05-24')).toBe(false);
    });

    it('lastRunIso = "2026-05-25", today = "2026-05-24" → false (relógio recuou — não duplicar)', () => {
      expect(shouldRunDailyEngine('2026-05-24', '2026-05-25')).toBe(false);
    });

    it('boundary de ano: lastRunIso = "2025-12-31", today = "2026-01-01" → true', () => {
      expect(shouldRunDailyEngine('2026-01-01', '2025-12-31')).toBe(true);
    });

    it('boundary de mês: lastRunIso = "2026-05-31", today = "2026-06-01" → true', () => {
      expect(shouldRunDailyEngine('2026-06-01', '2026-05-31')).toBe(true);
    });

    it('lastRunIso = "invalid" → true (malformed, treat as never ran)', () => {
      // Malformed strings would lexicographically block the engine permanently.
      // Defensive: invalid date → run as if never ran.
      expect(shouldRunDailyEngine('2026-05-24', 'invalid')).toBe(true);
    });

    it('lastRunIso = "not-a-date" → true (malformed, treat as never ran)', () => {
      expect(shouldRunDailyEngine('2026-05-24', 'not-a-date')).toBe(true);
    });
  });

  describe('resetDailyEngineRun()', () => {
    beforeEach(() => {
      // jsdom fornece window.localStorage — limpar entre testes.
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    });

    it('apaga a chave DAILY_RUN_STORAGE_KEY quando há window', () => {
      window.localStorage.setItem(DAILY_RUN_STORAGE_KEY, '2026-05-24');
      expect(window.localStorage.getItem(DAILY_RUN_STORAGE_KEY)).toBe('2026-05-24');
      resetDailyEngineRun();
      expect(window.localStorage.getItem(DAILY_RUN_STORAGE_KEY)).toBeNull();
    });

    it('é no-op (não lança) se a chave já não existe', () => {
      expect(() => resetDailyEngineRun()).not.toThrow();
    });

    it('não toca em outras chaves do localStorage', () => {
      window.localStorage.setItem(DAILY_RUN_STORAGE_KEY, '2026-05-24');
      window.localStorage.setItem('nexus:theme', 'dark');
      resetDailyEngineRun();
      expect(window.localStorage.getItem('nexus:theme')).toBe('dark');
    });
  });
});
