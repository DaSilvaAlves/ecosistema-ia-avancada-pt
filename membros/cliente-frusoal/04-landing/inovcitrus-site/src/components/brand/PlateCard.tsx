import Link from 'next/link';

export interface PlateCardProps {
  plateId: string;
  category: string;
  title: string;
  subtitle?: string;
  description: string;
  footnoteId?: string;
  meta?: string[];
  variant?: 'default' | 'featured' | 'dark' | 'compact';
  href?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-surface-warm',
    border: 'border-algarve-dark',
    text: 'text-ink',
    subText: 'text-algarve-dark',
    footnote: 'text-tinta'
  },
  featured: {
    bg: 'bg-pergaminho',
    border: 'border-citrus-dark',
    text: 'text-ink',
    subText: 'text-algarve-dark',
    footnote: 'text-tinta'
  },
  dark: {
    bg: 'bg-tinta',
    border: 'border-solar',
    text: 'text-solar',
    subText: 'text-pergaminho',
    footnote: 'text-pergaminho'
  },
  compact: {
    bg: 'bg-surface-warm',
    border: 'border-algarve-dark',
    text: 'text-ink',
    subText: 'text-algarve-dark',
    footnote: 'text-tinta'
  }
} as const;

export const PlateCard = ({
  plateId,
  category,
  title,
  subtitle,
  description,
  footnoteId,
  meta = [],
  variant = 'default',
  href
}: PlateCardProps) => {
  const styles = variantStyles[variant];
  const isCompact = variant === 'compact';
  const isInteractive = Boolean(href);

  const inner = (
    <>
      <span
        className="solar-mark absolute top-3 right-3 text-xl"
        aria-hidden="true"
      >
        ⚜
      </span>

      <p
        className={`font-mono text-mono-tag uppercase ${styles.subText} mb-4`}
      >
        {plateId} · {category}
      </p>

      <h3 className={`font-display text-display-m italic font-semibold ${styles.text} m-0`}>
        {title}
      </h3>
      {subtitle && (
        <p className={`font-sans text-body-s font-bold uppercase tracking-wider ${styles.subText} mt-1`}>
          {subtitle}
        </p>
      )}

      {!isCompact && <hr className="hatch-divider my-4" />}

      <p className={`font-sans text-body-s ${styles.text} opacity-90`}>
        {description}
      </p>

      {!isCompact && (footnoteId || meta.length > 0) && (
        <>
          <hr className="hatch-divider my-4" />
          <p className={`font-mono text-mono-footnote ${styles.footnote} flex flex-wrap gap-x-2`}>
            {footnoteId && <span className="font-medium">{footnoteId}</span>}
            {footnoteId && meta.length > 0 && <span aria-hidden="true">•</span>}
            {meta.map((m, i) => (
              <span key={m}>
                {m}
                {i < meta.length - 1 && <span aria-hidden="true" className="ml-2">•</span>}
              </span>
            ))}
          </p>
        </>
      )}
    </>
  );

  const baseClasses = `
    relative block ${styles.bg} border ${styles.border} rounded-plate
    p-6 transition-all duration-base ease-quiet
    ${isInteractive ? 'hover:border-citrus-dark hover:shadow-plate hover:[&_.solar-mark]:opacity-100' : ''}
  `.trim();

  if (isInteractive) {
    return (
      <Link href={href!} className={baseClasses}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
};
