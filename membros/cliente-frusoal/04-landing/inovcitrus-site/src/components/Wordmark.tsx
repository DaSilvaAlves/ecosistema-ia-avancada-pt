import Link from 'next/link';
import { Locale } from '@/lib/i18n';

interface WordmarkProps {
  locale: Locale;
  variant?: 'header' | 'footer';
}

// Wordmark tipográfico Frusoal InovCitrus — Inter weights 400/700, sem ícone.
// Variante header: contraste alto. Variante footer: tom subtil.

export const Wordmark = ({ locale, variant = 'header' }: WordmarkProps) => {
  const isHeader = variant === 'header';
  const colorClass = isHeader ? 'text-ink' : 'text-ink-muted';
  const sizeClass = isHeader ? 'text-xl md:text-2xl' : 'text-base';

  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-baseline gap-2 ${colorClass} hover:text-citrus-dark transition-colors`}
      aria-label="Frusoal InovCitrus — início"
    >
      <span className={`font-sans font-normal tracking-tight ${sizeClass}`}>
        Frusoal
      </span>
      <span className={`font-sans font-bold tracking-tight ${sizeClass}`}>
        InovCitrus
      </span>
    </Link>
  );
};
