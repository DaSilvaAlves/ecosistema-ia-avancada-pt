'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Nexus v2 — TasksHeader (Story 2.3 / AC2 + Story 2.4 / AC1)
 *
 * Header sticky com título "Tarefas" + tab strip [Lista | Kanban | Calendário]
 * + botão "Esc — Voltar" (router.back).
 *
 * Story 2.4 (AC1) — tab Kanban activado. Calendário mantém-se placeholder (Story 2.5).
 * Story 2.4 (PA4 da Story 2.3 closure) — arrow-key navigation entre tabs activos
 * (WAI-ARIA Tabs Authoring Practices): ← / → navega entre tabs não-disabled e foca
 * o próximo; Home/End vão para primeiro/último activo.
 *
 * Tablist com role/aria-selected/aria-controls conforme AC8 (acessibilidade Story 2.3)
 * + WAI-ARIA arrow keys (Story 2.4).
 */

export type ActiveTab = 'lista' | 'kanban' | 'calendario';

interface TasksHeaderProps {
  activeTab: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
}

interface TabDescriptor {
  id: ActiveTab;
  label: string;
  disabled: boolean;
  tooltip?: string;
}

const TABS: TabDescriptor[] = [
  { id: 'lista', label: 'Lista', disabled: false },
  { id: 'kanban', label: 'Kanban', disabled: false },
  { id: 'calendario', label: 'Calendário', disabled: true, tooltip: 'Em construção · Story 2.5' },
];

export function TasksHeader({ activeTab, onTabChange }: TasksHeaderProps): React.ReactElement {
  const router = useRouter();
  const tabRefs = useRef<Record<ActiveTab, HTMLButtonElement | null>>({
    lista: null,
    kanban: null,
    calendario: null,
  });

  function focusableTabs(): TabDescriptor[] {
    return TABS.filter((t) => !t.disabled);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, currentTab: ActiveTab): void {
    const focusable = focusableTabs();
    if (focusable.length <= 1) return;
    const currentIdx = focusable.findIndex((t) => t.id === currentTab);
    if (currentIdx === -1) return;

    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % focusable.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + focusable.length) % focusable.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = focusable.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = focusable[nextIdx];
    tabRefs.current[nextTab.id]?.focus();
    onTabChange?.(nextTab.id);
  }

  function handleClick(tab: TabDescriptor): void {
    if (tab.disabled) return;
    onTabChange?.(tab.id);
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(4, 4, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 800,
          color: '#F0F4FF',
          letterSpacing: '-0.02em',
        }}
      >
        Tarefas
      </h1>

      <div
        role="tablist"
        aria-label="Vistas de tarefas"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
        }}
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            active={activeTab === tab.id}
            onSelect={() => handleClick(tab)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            buttonRef={(el) => {
              tabRefs.current[tab.id] = el;
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Voltar (Esc)"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#F0F4FF',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 6,
          padding: '0.5rem 0.9rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        }}
      >
        Esc · Voltar
      </button>
    </header>
  );
}

interface TabButtonProps {
  tab: TabDescriptor;
  active: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}

function TabButton({ tab, active, onSelect, onKeyDown, buttonRef }: TabButtonProps): React.ReactElement {
  const { label, disabled, tooltip } = tab;
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      aria-selected={active}
      aria-disabled={disabled}
      aria-label={disabled && tooltip ? `${label} — ${tooltip}` : `Ver tarefas em vista ${label.toLowerCase()}`}
      title={disabled ? tooltip : undefined}
      disabled={disabled}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        color: active ? '#04040A' : disabled ? '#4A5568' : '#F0F4FF',
        background: active ? '#00F5FF' : 'transparent',
        border: 'none',
        borderRadius: 6,
        padding: '0.4rem 0.9rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        boxShadow: active ? '0 0 12px rgba(0, 245, 255, 0.3)' : 'none',
      }}
    >
      {label}
      {disabled && (
        <span
          aria-hidden="true"
          style={{
            marginLeft: 6,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.08em',
            color: '#8892A4',
          }}
        >
          ◐
        </span>
      )}
    </button>
  );
}
