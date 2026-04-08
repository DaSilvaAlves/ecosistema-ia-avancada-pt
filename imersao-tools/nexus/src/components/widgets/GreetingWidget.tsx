import { useState, useEffect } from 'react';

interface GreetingWidgetProps {
  name: string;
}

function getGreeting(hour: number): string {
  if (hour < 6) return 'Boa noite';
  if (hour < 12) return 'Bom dia';
  if (hour < 20) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function GreetingWidget({ name }: GreetingWidgetProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting(now.getHours());
  const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = formatDate(now);

  return (
    <div className="col-span-full text-center py-6">
      <p className="text-sm uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
        {date}
      </p>
      <h1
        className="text-4xl font-black tracking-tight mb-2"
        style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}
      >
        {greeting}, {name || 'Explorador'}
      </h1>
      <p
        className="text-5xl font-bold tabular-nums"
        style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {time}
      </p>
    </div>
  );
}
