export interface SwatchProps {
  name: string;
  token: string;
  hex: string;
  rgb?: string;
  use?: string;
  textColor?: 'ink' | 'surface-warm';
}

export const Swatch = ({
  name,
  token,
  hex,
  rgb,
  use,
  textColor = 'ink'
}: SwatchProps) => {
  const previewTextClass = textColor === 'surface-warm' ? 'text-surface-warm' : 'text-ink';

  return (
    <div className="bg-surface border border-surface-border rounded-card overflow-hidden">
      <div
        className={`h-24 flex items-end px-4 pb-2 ${previewTextClass}`}
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      >
        <span className="font-mono text-mono-footnote opacity-80">Aa</span>
      </div>
      <div className="p-3 space-y-1">
        <p className="font-sans text-body-s font-bold text-ink m-0">{name}</p>
        <p className="font-mono text-mono-footnote text-citrus-dark m-0">{hex}</p>
        {rgb && <p className="font-mono text-mono-footnote text-ink-subtle m-0">{rgb}</p>}
        <p className="font-mono text-mono-footnote text-ink-muted opacity-60 m-0">
          {token}
        </p>
        {use && <p className="font-sans text-mono-footnote text-ink-subtle mt-2 m-0">{use}</p>}
      </div>
    </div>
  );
};
