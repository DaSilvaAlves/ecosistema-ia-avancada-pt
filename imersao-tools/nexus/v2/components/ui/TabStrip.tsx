'use client';

import { useRef, type KeyboardEvent } from 'react';

/**
 * Nexus v2 — TabStrip (Story 4.2 — D-3.5-2, AC2)
 *
 * Tab strip acessível, controlado externamente (sem estado interno — a página
 * dona controla `activeTab`). Extrai o padrão `role="tablist"` + `TabButton`
 * das pages de finanças (Story 3.3-3.6) e adiciona o que faltava: **roving
 * tabindex** (débito D-3.5-2, a11y — A1 Epic 2).
 *
 * Roving tabindex (WAI-ARIA Authoring Practices — Tabs):
 *   - apenas a tab activa tem `tabindex="0"`; as restantes `tabindex="-1"`;
 *   - ArrowRight/ArrowLeft movem o foco (e a selecção) para a tab adjacente,
 *     com wrap circular; Home/End saltam para a primeira/última;
 *   - Enter/Space não são necessários (o clique/`onTabChange` no foco já
 *     activa via setas), mas o `<button>` nativo trata-os para clique.
 *
 * Design system (`design-system-ia-avancada.md`): tab activa em Cyan sobre
 * `#04040A`, inactivas em Grey sobre glass; JetBrains Mono uppercase; sem
 * bordas duras (border-radius 6).
 *
 * A page `/financas` NÃO é refactorada nesta story (R5) — o `TabStrip` é usado
 * apenas nas rotas novas do Epic 4.
 */

export interface TabDescriptor {
  key: string;
  label: string;
}

interface TabStripProps {
  tabs: TabDescriptor[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** Rótulo acessível do conjunto de tabs (`aria-label` do tablist). */
  ariaLabel: string;
}

export function TabStrip({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
}: TabStripProps): React.ReactElement {
  // Refs dos botões para mover o foco no roving tabindex.
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTabAt(index: number): void {
    const target = buttonRefs.current[index];
    if (target) {
      target.focus();
      onTabChange(tabs[index].key);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const lastIndex = tabs.length - 1;
    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        focusTabAt(index === lastIndex ? 0 : index + 1);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        focusTabAt(index === 0 ? lastIndex : index - 1);
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusTabAt(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        focusTabAt(lastIndex);
        break;
      }
      default:
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: 4,
        padding: '0 1.5rem 1rem',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab, index) => {
        const selected = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            id={`tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={selected}
            // Roving tabindex: só a tab activa entra na ordem de tabulação.
            tabIndex={selected ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: selected ? '#04040A' : '#8892A4',
              background: selected ? '#00F5FF' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selected ? '#00F5FF' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 6,
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
