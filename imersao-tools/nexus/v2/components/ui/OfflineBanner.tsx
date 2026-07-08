'use client';

import type { ReactElement } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Nexus v2 — OfflineBanner component (Story 9.5 AC3, AC10 eixo c)
 *
 * Banner honesto de "sem rede". Consome `useOnlineStatus()` (AC1) e tem dois
 * estados de render distintos (react-component-test-criteria.md — componente de
 * fronteira elevado a teste exigido pelo risco de UX/confiança, mesma classe dos
 * 4 Major da Story 4.9):
 *
 *   1. Online  (`isOnline === true`)  → `return null` (sem DOM, sem espaço reservado).
 *   2. Offline (`isOnline === false`) → faixa fixa `sticky` logo abaixo do Header.
 *
 * Reconexão (AC10 eixo c): quando o evento `online` dispara, o hook actualiza e o
 * banner desaparece — nunca fica "preso" em offline.
 *
 * Estilo: glassmorphism + paleta Magenta do design-system (erros/alertas críticos,
 * `#FF006E`), coerente com o render de erro do `ChatPanel` (rgba(255,0,110,0.08)
 * bg + rgba(255,0,110,0.4) border). Acessibilidade: `role="alert"` +
 * `aria-live="polite"` (mudança de estado de rede não é urgente ao ponto de
 * interromper o leitor de ecrã, tal como o `UndoToast`).
 *
 * Montagem: irmão do `<header>` em `Header.tsx` (não filho — preserva o
 * `position: sticky` do header). Um único ponto de montagem cobre as 10 páginas
 * autenticadas (mesmo padrão de cobertura app-wide do indicador do AC2).
 *
 * Trace canónico:
 * - Story 9.5 AC3 — banner "sem rede" com 2 estados de render
 * - Story 9.5 AC10 eixo c — desaparece na reconexão
 * - `EPIC-9.md` §5 linha 9.5 "Banner sem rede"; design-system-ia-avancada.md (Magenta)
 */
export function OfflineBanner(): ReactElement | null {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="offline-banner"
      style={{
        position: 'sticky',
        top: 56,
        zIndex: 49,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 24px',
        background: 'rgba(255,0,110,0.08)',
        borderBottom: '1px solid rgba(255,0,110,0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#FF006E',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.8rem',
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      Sem ligação à internet — a mostrar os teus dados locais.
    </div>
  );
}
