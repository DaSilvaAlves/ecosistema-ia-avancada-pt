'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Nexus v2 — ProjectsHeader (Story 2.8 / AC2)
 *
 * Header sticky com título "Projectos" + tab strip por status + botão "+ Novo
 * projecto" + botão "Esc · Voltar". Reaproveita 1:1 o padrão do TasksHeader
 * (Stories 2.3 + 2.4 + 2.5) — WAI-ARIA Tabs Authoring Practices: arrow keys
 * + Home/End navegam entre tabs activos.
 */

export type ProjectTab = 'activos' | 'pausados' | 'concluidos' | 'todos';

interface ProjectsHeaderProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  onNewProject: () => void;
}

interface TabDescriptor {
  id: ProjectTab;
  label: string;
}

const TABS: TabDescriptor[] = [
  { id: 'activos', label: 'Activos' },
  { id: 'pausados', label: 'Pausados' },
  { id: 'concluidos', label: 'Concluídos' },
  { id: 'todos', label: 'Todos' },
];

export function ProjectsHeader({
  activeTab,
  onTabChange,
  onNewProject,
}: ProjectsHeaderProps): React.ReactElement {
  const router = useRouter();
  const tabRefs = useRef<Record<ProjectTab, HTMLButtonElement | null>>({
    activos: null,
    pausados: null,
    concluidos: null,
    todos: null,
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, currentTab: ProjectTab): void {
    const idx = TABS.findIndex((t) => t.id === currentTab);
    if (idx === -1) return;

    let nextIdx = idx;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[nextIdx];
    tabRefs.current[nextTab.id]?.focus();
    onTabChange(nextTab.id);
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
        flexWrap: 'wrap',
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
        Projectos
      </h1>

      <div
        role="tablist"
        aria-label="Filtrar projectos por estado"
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
            onSelect={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            buttonRef={(el) => {
              tabRefs.current[tab.id] = el;
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onNewProject}
          aria-label="Criar novo projecto"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#04040A',
            background: '#00F5FF',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          + Novo projecto
        </button>
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
          }}
        >
          Esc · Voltar
        </button>
      </div>
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
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`Ver projectos ${tab.label.toLowerCase()}`}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem',
        fontWeight: active ? 700 : 500,
        color: active ? '#04040A' : '#F0F4FF',
        background: active ? '#00F5FF' : 'transparent',
        border: 'none',
        borderRadius: 6,
        padding: '0.4rem 0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 0 12px rgba(0, 245, 255, 0.3)' : 'none',
      }}
    >
      {tab.label}
    </button>
  );
}
