'use client';

import type { KnowledgeArea, KnowledgeNotebook } from '@/types/db';
import {
  SystemEntityGuard,
  isSystemArea,
  isSystemNotebook,
} from '@/components/conhecimento/SystemEntityGuard';

/**
 * Nexus v2 — AreaTree (Story 5.9 — AC1/AC2/AC4/AC5/AC6/AC7/AC8/AC9)
 *
 * Painel esquerdo do master-detail de 2 painéis (front-end-spec-v2.md §3.6):
 * árvore Áreas→Cadernos com expand/collapse in-place. Cada área expande para os
 * seus cadernos; seleccionar um caderno popula a lista de notas (painel direito,
 * orquestrado pela page).
 *
 * Componente **prop-driven** (sem Dexie directo — a page detém os hooks): recebe
 * `areas`, o conjunto de áreas expandidas, e um mapa `areaId → cadernos`. Estados
 * de render distintos (`react-component-test-criteria.md`, ≥3): loading (`areas`
 * undefined) / vazia (0 áreas) / lista de áreas (com cadernos por área expandida).
 *
 * Guards de sistema (C3) via `SystemEntityGuard`: a área "Sistema" e o caderno
 * "Caixa de entrada" têm os botões eliminar E editar desactivados (disabled +
 * tooltip PT-PT). As cascatas de delete são quantificadas pela page (AC6/AC9) —
 * aqui só se emite o pedido (`onDeleteArea`/`onDeleteNotebook`).
 *
 * Design system (`design-system-ia-avancada.md`): sidebar glass sobre `#04040A`,
 * área/caderno seleccionados em Cyan, labels em Inter, contagem em JetBrains Mono.
 */

interface AreaTreeProps {
  /** `undefined` = a carregar (loading). */
  areas: KnowledgeArea[] | undefined;
  /** IDs das áreas expandidas (cadernos visíveis in-place). */
  expandedAreaIds: ReadonlySet<string>;
  /** Cadernos por área (só preenchido para áreas expandidas). */
  notebooksByArea: Map<string, KnowledgeNotebook[]>;
  /** Caderno actualmente seleccionado (popula a lista de notas). */
  selectedNotebookId: string | null;
  onToggleArea: (areaId: string) => void;
  onSelectNotebook: (notebook: KnowledgeNotebook) => void;
  onCreateArea: () => void;
  onEditArea: (area: KnowledgeArea) => void;
  onDeleteArea: (area: KnowledgeArea) => void;
  onCreateNotebook: (area: KnowledgeArea) => void;
  onEditNotebook: (notebook: KnowledgeNotebook) => void;
  onDeleteNotebook: (notebook: KnowledgeNotebook) => void;
}

const iconBtnStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.8rem',
  background: 'transparent',
  border: 'none',
  color: '#8892A4',
  cursor: 'pointer',
  padding: '0.15rem 0.3rem',
  borderRadius: 4,
  lineHeight: 1,
};

const disabledIconBtnStyle: React.CSSProperties = {
  ...iconBtnStyle,
  color: '#4A5568',
  cursor: 'not-allowed',
  opacity: 0.6,
};

export function AreaTree({
  areas,
  expandedAreaIds,
  notebooksByArea,
  selectedNotebookId,
  onToggleArea,
  onSelectNotebook,
  onCreateArea,
  onEditArea,
  onDeleteArea,
  onCreateNotebook,
  onEditNotebook,
  onDeleteNotebook,
}: AreaTreeProps): React.ReactElement {
  return (
    <nav
      aria-label="Áreas de conhecimento"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '0.5rem',
        minWidth: 240,
        maxWidth: 320,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        overflowY: 'auto',
      }}
    >
      {areas === undefined ? (
        <div aria-busy="true" aria-label="A carregar áreas" style={{ padding: '0.5rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 32,
                marginBottom: 6,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                backgroundSize: '200% 100%',
                borderRadius: 8,
                animation: 'conhecimento-skeleton-pulse 1.6s ease-in-out infinite',
              }}
            />
          ))}
          <style>{`
            @keyframes conhecimento-skeleton-pulse {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ) : areas.length === 0 ? (
        <div
          style={{
            padding: '1.5rem 0.75rem',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#8892A4',
          }}
        >
          <p style={{ margin: '0 0 0.75rem 0' }}>
            Sem áreas. Cria a primeira para organizar o teu conhecimento.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {areas.map((area) => {
            const expanded = expandedAreaIds.has(area.id);
            const systemArea = isSystemArea(area.id);
            const notebooks = notebooksByArea.get(area.id);
            return (
              <li key={area.id} style={{ marginBottom: 2 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0.35rem 0.4rem',
                    borderRadius: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleArea(area.id)}
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Colapsar' : 'Expandir'} área ${area.name}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      minWidth: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#F0F4FF',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    <span aria-hidden="true" style={{ color: '#8892A4', width: 12 }}>
                      {expanded ? '▾' : '▸'}
                    </span>
                    <span aria-hidden="true">{area.icon}</span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {area.name}
                    </span>
                  </button>

                  <SystemEntityGuard isSystem={systemArea} tooltip="Área de sistema">
                    {({ disabled, tooltip }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditArea(area)}
                          disabled={disabled}
                          aria-disabled={disabled}
                          title={disabled ? tooltip : 'Editar área'}
                          aria-label={`Editar área ${area.name}`}
                          style={disabled ? disabledIconBtnStyle : iconBtnStyle}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteArea(area)}
                          disabled={disabled}
                          aria-disabled={disabled}
                          title={disabled ? tooltip : 'Eliminar área'}
                          aria-label={`Eliminar área ${area.name}`}
                          style={disabled ? disabledIconBtnStyle : iconBtnStyle}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </SystemEntityGuard>
                </div>

                {expanded && (
                  <ul
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: '0 0 0 1.4rem',
                    }}
                  >
                    {notebooks === undefined ? (
                      <li
                        style={{
                          padding: '0.3rem 0.4rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.65rem',
                          color: '#4A5568',
                        }}
                      >
                        a carregar…
                      </li>
                    ) : (
                      <>
                        {notebooks.map((notebook) => {
                          const selected = notebook.id === selectedNotebookId;
                          const systemNotebook = isSystemNotebook(notebook.id);
                          return (
                            <li
                              key={notebook.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0.25rem 0.4rem',
                                borderRadius: 6,
                                background: selected
                                  ? 'rgba(0, 245, 255, 0.1)'
                                  : 'transparent',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => onSelectNotebook(notebook)}
                                aria-current={selected}
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  textAlign: 'left',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: selected ? '#00F5FF' : '#F0F4FF',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '0.85rem',
                                  padding: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {notebook.name}
                              </button>
                              <SystemEntityGuard
                                isSystem={systemNotebook}
                                tooltip="Caderno de sistema"
                              >
                                {({ disabled, tooltip }) => (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onEditNotebook(notebook)}
                                      disabled={disabled}
                                      aria-disabled={disabled}
                                      title={disabled ? tooltip : 'Editar caderno'}
                                      aria-label={`Editar caderno ${notebook.name}`}
                                      style={
                                        disabled ? disabledIconBtnStyle : iconBtnStyle
                                      }
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteNotebook(notebook)}
                                      disabled={disabled}
                                      aria-disabled={disabled}
                                      title={disabled ? tooltip : 'Eliminar caderno'}
                                      aria-label={`Eliminar caderno ${notebook.name}`}
                                      style={
                                        disabled ? disabledIconBtnStyle : iconBtnStyle
                                      }
                                    >
                                      🗑
                                    </button>
                                  </>
                                )}
                              </SystemEntityGuard>
                            </li>
                          );
                        })}
                        <li>
                          <button
                            type="button"
                            onClick={() => onCreateNotebook(area)}
                            style={{
                              ...iconBtnStyle,
                              color: '#00F5FF',
                              fontSize: '0.78rem',
                              padding: '0.25rem 0.4rem',
                            }}
                          >
                            + Novo caderno
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onCreateArea}
        style={{
          marginTop: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#00F5FF',
          background: 'rgba(0, 245, 255, 0.08)',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          borderRadius: 6,
          padding: '0.5rem 0.8rem',
          cursor: 'pointer',
        }}
      >
        + Nova área
      </button>
    </nav>
  );
}
