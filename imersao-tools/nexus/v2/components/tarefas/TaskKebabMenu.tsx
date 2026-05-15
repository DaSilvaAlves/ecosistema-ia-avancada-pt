'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Nexus v2 — TaskKebabMenu (Story 2.3 / AC5 col 8)
 *
 * Menu inline por linha com 2 acções:
 *   - "Editar" (disabled — D4 ratificada: edição é story futura; click faz console.warn + toast)
 *   - "Apagar" (confirmação via window.confirm PT-PT → onDelete)
 *
 * Implementado com primitivo (button + ul absoluto) — @radix-ui/react-dropdown-menu
 * não está em deps. Fecha em click-outside, Escape ou Tab.
 *
 * A2 — CR Iter 1 fix: keyboard nav completo WAI-ARIA menu pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu/):
 *   - Open → focus no primeiro `menuitem` enabled
 *   - ArrowDown/ArrowUp → ciclo entre menuitems enabled
 *   - Home/End → primeiro/último enabled
 *   - Tab → fecha menu (composite widget — Tab sai do menu inteiro)
 *   - Escape → fecha menu + foca trigger button
 *   - Close → focus volta ao trigger button
 *
 * Items disabled (`aria-disabled="true"`) são saltados na navegação por arrow
 * keys/Home/End, conforme padrão WAI-ARIA standard.
 */

interface TaskKebabMenuProps {
  taskId: string;
  taskTitle: string;
  onDelete: () => void;
  onEditDisabledClick?: () => void;
}

export function TaskKebabMenu({
  taskId,
  taskTitle,
  onDelete,
  onEditDisabledClick,
}: TaskKebabMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Devolve a lista de menuitems enabled (saltando aria-disabled="true").
  function getEnabledItems(): HTMLElement[] {
    if (!menuRef.current) return [];
    const all = menuRef.current.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );
    return Array.from(all);
  }

  // Foca o item ao índice dado (com bounds check).
  function focusItemAt(index: number): void {
    const items = getEnabledItems();
    if (items.length === 0) return;
    const safeIndex = ((index % items.length) + items.length) % items.length;
    items[safeIndex]?.focus();
  }

  // Click-outside + key handlers globais quando aberto.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setOpen(false);
        // Foca o trigger ao fechar via Escape (padrão WAI-ARIA).
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Ao abrir, foca o primeiro item enabled.
  // Lógica embutida (não depende de focusItemAt) para evitar dependência
  // instável no array — getEnabledItems consulta menuRef.current directamente.
  useEffect(() => {
    if (!open) return;
    // Defer ao próximo tick para garantir que o menu está montado no DOM.
    const id = window.setTimeout(() => {
      if (!menuRef.current) return;
      const items = menuRef.current.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])'
      );
      items[0]?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // Keyboard navigation dentro do menu (arrow keys, Home, End, Tab).
  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLUListElement>): void {
    const items = getEnabledItems();
    if (items.length === 0) return;
    const activeEl = document.activeElement as HTMLElement | null;
    const currentIndex = activeEl ? items.indexOf(activeEl) : -1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItemAt(currentIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItemAt(currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItemAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusItemAt(items.length - 1);
        break;
      case 'Tab':
        // Tab fecha o menu (composite widget — sai do menu inteiro).
        setOpen(false);
        break;
      // Enter e Space são tratados nativamente pelo <button> menuitem
      // (cliques sintéticos via keyboard). Escape é capturado globalmente.
      default:
        break;
    }
  }

  function handleEditClick(): void {
    setOpen(false);
    console.warn(`Edição de tarefa "${taskTitle}" (${taskId}) será disponibilizada numa story futura.`);
    onEditDisabledClick?.();
  }

  function handleDeleteClick(): void {
    setOpen(false);
    const confirmed = window.confirm(`Apagar a tarefa "${taskTitle}"? Esta acção não pode ser desfeita.`);
    if (confirmed) onDelete();
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Acções para a tarefa "${taskTitle}"`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#8892A4',
          fontSize: '1.1rem',
          cursor: 'pointer',
          padding: '0.25rem 0.4rem',
          borderRadius: 6,
          lineHeight: 1,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#F0F4FF';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#8892A4';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ⋯
      </button>

      {open && (
        <ul
          ref={menuRef}
          role="menu"
          aria-label={`Menu de acções para "${taskTitle}"`}
          onKeyDown={handleMenuKeyDown}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            listStyle: 'none',
            padding: 4,
            minWidth: 140,
            background: 'rgba(4, 4, 10, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            backdropFilter: 'blur(12px)',
            zIndex: 20,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              aria-disabled="true"
              tabIndex={-1}
              onClick={handleEditClick}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: '#4A5568',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                cursor: 'not-allowed',
              }}
              title="Disponível numa story futura"
            >
              Editar
              <span
                aria-hidden="true"
                style={{
                  marginLeft: 6,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.55rem',
                  color: '#4A5568',
                }}
              >
                ◐
              </span>
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={handleDeleteClick}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: '#FF006E',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 110, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Apagar
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
