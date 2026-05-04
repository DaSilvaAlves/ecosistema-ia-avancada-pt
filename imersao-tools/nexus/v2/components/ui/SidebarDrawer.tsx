'use client';

import { ReactElement, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Nexus v2 — Sidebar drawer (mobile/tablet)
 *
 * Slide right→left com backdrop dim. Triggers: ☰ no header, Esc fecha.
 * Conforme front-end-spec-v2.md §8.2.
 */

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export function SidebarDrawer({
  open,
  onClose,
  children,
}: SidebarDrawerProps): ReactElement | null {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sidebar drawer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <button
        type="button"
        aria-label="Fechar drawer"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4,4,10,0.85)',
          border: 'none',
          cursor: 'pointer',
        }}
      />
      <aside
        style={{
          position: 'relative',
          width: 320,
          maxWidth: '85vw',
          height: '100vh',
          background: '#04040A',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'nexus-drawer-in 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8892A4',
              cursor: 'pointer',
              padding: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
      <style>{`
        @keyframes nexus-drawer-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
