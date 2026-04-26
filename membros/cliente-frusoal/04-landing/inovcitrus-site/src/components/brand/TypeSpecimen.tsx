export interface TypeSpecimenProps {
  family: 'display' | 'sans' | 'mono';
  weight?: number | string;
  size: string; // e.g. "3rem"
  lineHeight?: string | number;
  letterSpacing?: string;
  italic?: boolean;
  uppercase?: boolean;
  sample: string;
  spec: string; // e.g. "Display L · 48/1.10 · 800 · -0.03em"
}

const familyClass = {
  display: 'font-display',
  sans: 'font-sans',
  mono: 'font-mono'
} as const;

export const TypeSpecimen = ({
  family,
  weight,
  size,
  lineHeight,
  letterSpacing,
  italic = false,
  uppercase = false,
  sample,
  spec
}: TypeSpecimenProps) => {
  return (
    <div className="border-b border-surface-border py-6">
      <p className="font-mono text-mono-tag uppercase tracking-wider text-algarve-dark mb-3">
        {spec}
      </p>
      <p
        className={`${familyClass[family]} text-ink m-0 ${italic ? 'italic' : ''} ${uppercase ? 'uppercase' : ''}`}
        style={{
          fontSize: size,
          fontWeight: weight,
          lineHeight: lineHeight as string,
          letterSpacing
        }}
      >
        {sample}
      </p>
    </div>
  );
};
