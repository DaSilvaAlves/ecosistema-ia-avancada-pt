'use client';

import { ReactNode } from 'react';

/**
 * Nexus v2 — Sidebar (Story 0.4)
 *
 * Container 360px à direita (>=1280px), 320px em laptop, drawer em mobile.
 * Glassmorphism, scroll independente, hidden em <1024px.
 *
 * Story 0.8 popula com widgets (Markets no topo per UX-4, Greeting, Pomodoro,
 * GitHub, Quick Links, Goodnight).
 */

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps): React.ReactElement {
  return (
    <aside
      aria-label="Sidebar com widgets"
      className="nexus-sidebar"
      style={{
        position: 'fixed',
        right: 0,
        top: 56,
        bottom: 0,
        width: 360,
        background: 'rgba(255,255,255,0.025)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {children}
      <style>{`
        @media (max-width: 1279px) {
          .nexus-sidebar { width: 320px !important; }
        }
        @media (max-width: 1023px) {
          .nexus-sidebar { display: none !important; }
        }
      `}</style>
    </aside>
  );
}
