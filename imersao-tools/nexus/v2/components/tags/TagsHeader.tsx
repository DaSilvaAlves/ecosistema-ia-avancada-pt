'use client';

import { useRouter } from 'next/navigation';

/**
 * Nexus v2 — TagsHeader (Story 2.6 / AC6)
 *
 * Header sticky com título "Tags" + input de pesquisa por nome (debounced
 * upstream pela page via `useMemo` filter) + botão "+ Nova tag" + botão
 * "Esc · Voltar". Reaproveita 1:1 o padrão de `ProjectsHeader` da Story 2.8.
 *
 * NÃO tem tab strip — a página `/tags` é uma vista única (sem filtro por
 * estado, ao contrário de `/projectos` ou `/tarefas`).
 */

interface TagsHeaderProps {
  search: string;
  onSearchChange: (next: string) => void;
  onNewTag: () => void;
}

export function TagsHeader({
  search,
  onSearchChange,
  onNewTag,
}: TagsHeaderProps): React.ReactElement {
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
        Tags
      </h1>

      <input
        type="search"
        aria-label="Pesquisar tags pelo nome"
        placeholder="Pesquisar tags..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 200,
          maxWidth: 360,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          color: '#F0F4FF',
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 6,
          padding: '0.5rem 0.8rem',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onNewTag}
          aria-label="Criar nova tag"
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
          + Nova tag
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
