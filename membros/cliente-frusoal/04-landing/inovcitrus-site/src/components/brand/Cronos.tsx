export interface CronosMarker {
  id: string;
  date: string;
  label: string;
  description?: string;
  status: 'past' | 'present' | 'future';
}

export interface CronosProps {
  markers: CronosMarker[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'compact';
}

const markerStyles = {
  past: 'bg-algarve-dark border-algarve-dark',
  present: 'bg-solar border-solar shadow-solar-glow scale-125',
  future: 'bg-surface-warm border-algarve-dark'
} as const;

export const Cronos = ({
  markers,
  orientation = 'horizontal',
  variant = 'default'
}: CronosProps) => {
  const isCompact = variant === 'compact';

  if (orientation === 'vertical') {
    return (
      <ol className="relative pl-8" aria-label="Cronologia">
        <span
          className="absolute left-3 top-2 bottom-2 w-0.5 bg-algarve-dark"
          aria-hidden="true"
        />
        {markers.map((m) => (
          <li key={m.id} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -left-7 top-1.5 block w-3 h-3 rounded-full border-2 ${markerStyles[m.status]} transition-transform duration-base`}
              aria-hidden="true"
            />
            <p className="font-mono text-mono-tag uppercase text-algarve-dark mb-1">
              {m.date} · {m.id}
            </p>
            <p className="font-sans text-base font-bold text-ink m-0">{m.label}</p>
            {!isCompact && m.description && (
              <p className="font-sans text-body-s text-ink-muted mt-1 max-w-prose">
                {m.description}
              </p>
            )}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="relative" aria-label="Cronologia">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${markers.length}, 1fr)` }}>
        {markers.map((m) => (
          <li key={m.id} className="relative pt-8">
            <span
              className={`absolute top-0 left-1/2 -translate-x-1/2 block w-3 h-3 rounded-full border-2 ${markerStyles[m.status]} transition-transform duration-base z-10`}
              aria-hidden="true"
            />
            <p className="font-mono text-mono-tag uppercase text-algarve-dark text-center mb-1">
              {m.date}
            </p>
            <p className="font-sans text-body-s font-bold text-ink text-center m-0">
              {m.label}
            </p>
            {!isCompact && m.description && (
              <p className="font-sans text-mono-footnote text-ink-muted mt-2 text-center">
                {m.description}
              </p>
            )}
          </li>
        ))}
      </div>
      <span
        className="absolute top-1.5 left-0 right-0 h-0.5 bg-algarve-dark"
        aria-hidden="true"
      />
    </ol>
  );
};
