'use client';

import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

/**
 * Nexus v2 — GoodnightWidget (Story 0.8, portado de v1)
 *
 * Aparece apenas entre 22:00 e 5:00. Convida a snapshot de fim-de-dia
 * (Brain Dump nocturno em Epic 5).
 */

function isNightTime(date: Date): boolean {
  const h = date.getHours();
  return h >= 22 || h < 5;
}

export function GoodnightWidget(): React.ReactElement | null {
  const [show, setShow] = useState<boolean>(() => isNightTime(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setShow(isNightTime(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!show) return null;

  return (
    <WidgetCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Moon size={16} color="#9D00FF" />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            color: '#F0F4FF',
            fontWeight: 600,
          }}
        >
          Boa noite, Eurico
        </span>
      </div>
      <p
        style={{
          margin: '8px 0 0 0',
          color: '#8892A4',
          fontSize: '0.75rem',
          lineHeight: 1.6,
        }}
      >
        Tira 5 min para um Brain Dump antes de dormir. Acordas amanhã com
        contexto reconstruído pelo agente nocturno (Epic 5).
      </p>
    </WidgetCard>
  );
}
