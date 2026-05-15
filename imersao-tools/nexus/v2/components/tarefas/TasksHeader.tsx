'use client';

import { useRouter } from 'next/navigation';

/**
 * Nexus v2 — TasksHeader (Story 2.3 / AC2)
 *
 * Header sticky com título "Tarefas" + tab strip [Lista | Kanban | Calendário]
 * + botão "Esc — Voltar" (router.back).
 *
 * Tabs Kanban/Calendário estão em estado disabled (placeholders) conforme
 * [AUTO-DECISION] D2 ratificada pela `@po`. Stories 2.4 e 2.5 vão activá-las.
 *
 * Tablist com role/aria-selected conforme AC8 (acessibilidade).
 */

export type ActiveTab = 'lista' | 'kanban' | 'calendario';

interface TasksHeaderProps {
  activeTab: ActiveTab;
}

export function TasksHeader({ activeTab }: TasksHeaderProps): React.ReactElement {
  const router = useRouter();

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
        <TabButton label="Lista" active={activeTab === 'lista'} disabled={false} />
        <TabButton
          label="Kanban"
          active={activeTab === 'kanban'}
          disabled
          tooltip="Em construção · Story 2.4"
        />
        <TabButton
          label="Calendário"
          active={activeTab === 'calendario'}
          disabled
          tooltip="Em construção · Story 2.5"
        />
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
  label: string;
  active: boolean;
  disabled: boolean;
  tooltip?: string;
}

function TabButton({ label, active, disabled, tooltip }: TabButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-disabled={disabled}
      aria-label={disabled && tooltip ? `${label} — ${tooltip}` : `Ver tarefas em vista ${label.toLowerCase()}`}
      title={disabled ? tooltip : undefined}
      disabled={disabled}
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
