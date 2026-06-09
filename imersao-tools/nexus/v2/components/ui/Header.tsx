'use client';

import Link from 'next/link';
import { Menu, Settings, Zap } from 'lucide-react';

/**
 * Nexus v2 — Header (Story 0.4)
 *
 * Sticky top, h:56px, glass background.
 * Logo NEXUS Cyan + nav links [Tarefas][Finanças][Hábitos][Lembretes][Diário][Conhecimento][⚙️].
 *
 * Conforme front-end-spec-v2.md §2.2 e §3.1.
 */

interface HeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function Header({ onToggleSidebar, showSidebarToggle }: HeaderProps): React.ReactElement {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSidebarToggle && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Abrir sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F0F4FF',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Menu size={18} />
          </button>
        )}
        <Zap size={20} color="#00F5FF" />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.05em',
            color: '#F0F4FF',
          }}
        >
          NEXUS
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#39FF14',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            marginLeft: 8,
          }}
        >
          ● online
        </span>
      </div>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
        }}
      >
        <NavLink href="/tarefas">Tarefas</NavLink>
        <NavLink href="/financas">Finanças</NavLink>
        <NavLink href="/habitos">Hábitos</NavLink>
        <NavLink href="/metas">Metas</NavLink>
        <NavLink href="/lembretes">Lembretes</NavLink>
        <NavLink href="/diario">Diário</NavLink>
        <NavLink href="/knowledge">Conhecimento</NavLink>
        <Link
          href="/settings"
          aria-label="Definições"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            color: '#8892A4',
            transition: 'color 0.2s',
          }}
        >
          <Settings size={16} />
        </Link>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 12px',
        color: '#8892A4',
        textDecoration: 'none',
        borderRadius: 6,
        transition: 'color 0.2s, background 0.2s',
      }}
    >
      {children}
    </Link>
  );
}
