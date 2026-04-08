import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl backdrop-blur-xl p-5 ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {title && (
        <h3
          className="text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
