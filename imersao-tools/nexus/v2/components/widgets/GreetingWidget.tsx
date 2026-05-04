'use client';

import { useEffect, useState } from 'react';

/**
 * Nexus v2 — GreetingWidget (Story 0.8, portado de v1)
 *
 * Saudação por hora: Bom dia (5-12) / Boa tarde (12-18) / Boa noite (18-5).
 * Clock actualiza a cada minuto.
 */

function greetByHour(hour: number, name: string): string {
  if (hour >= 5 && hour < 12) return `Bom dia, ${name} ☀`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${name}`;
  return `Boa noite, ${name} 🌙`;
}

function formatNow(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

export function GreetingWidget(): React.ReactElement {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = greetByHour(now.getHours(), 'Eurico');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '4px 4px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: '1.05rem',
          color: '#F0F4FF',
        }}
      >
        {greeting}
      </h2>
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          color: '#8892A4',
        }}
      >
        {formatNow(now)}
      </span>
    </div>
  );
}
