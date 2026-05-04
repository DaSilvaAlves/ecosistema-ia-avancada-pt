import { ReactNode } from 'react';

/**
 * Nexus v2 — WidgetCard wrapper (Story 0.8)
 *
 * Glass card padronizado para todos os widgets da sidebar.
 * Conforme front-end-spec-v2.md §5.4 (`.glass-card`).
 */

interface WidgetCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function WidgetCard({ title, children, className }: WidgetCardProps): React.ReactElement {
  return (
    <section
      aria-label={title}
      className={className}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {title && (
        <h3
          style={{
            margin: '0 0 12px 0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8892A4',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
