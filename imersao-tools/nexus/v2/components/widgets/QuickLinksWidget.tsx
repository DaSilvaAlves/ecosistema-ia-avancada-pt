'use client';

import { ExternalLink } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

/**
 * Nexus v2 — QuickLinksWidget (Story 0.8, portado de v1)
 *
 * Atalhos para serviços comuns. Lista hardcoded inicial — Epic 8 permite
 * editar nas Definições.
 */

interface QuickLink {
  name: string;
  url: string;
}

const DEFAULT_LINKS: QuickLink[] = [
  { name: 'Anthropic Console', url: 'https://console.anthropic.com' },
  { name: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Gmail', url: 'https://mail.google.com' },
  { name: 'Claude', url: 'https://claude.ai' },
  { name: 'Comunidade', url: 'https://comunidade.avancada.expressia.pt' },
];

export function QuickLinksWidget(): React.ReactElement {
  return (
    <WidgetCard title="Links">
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DEFAULT_LINKS.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#00F5FF',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                padding: '4px 0',
              }}
            >
              <span>→</span>
              <span style={{ color: '#F0F4FF' }}>{link.name}</span>
              <ExternalLink size={11} color="#4A5568" />
            </a>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
