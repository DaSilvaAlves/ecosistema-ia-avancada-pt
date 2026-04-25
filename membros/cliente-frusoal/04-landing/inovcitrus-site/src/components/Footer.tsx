import Link from 'next/link';
import { Locale, getUI } from '@/lib/i18n';
import { Wordmark } from './Wordmark';

interface FooterProps {
  locale: Locale;
}

export const Footer = ({ locale }: FooterProps) => {
  const ui = getUI(locale);

  const partners = [
    { name: 'Frusoal', url: 'https://www.frusoal.pt/' },
    { name: 'InnovPlantProtect', url: 'https://iplantprotect.pt/' }
  ];

  return (
    <footer className="border-t border-surface-border bg-surface-warm mt-16">
      <div className="mx-auto max-w-content px-6 md:px-8 py-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark locale={locale} variant="footer" />
          <p className="text-sm text-ink-subtle max-w-prose">{ui.institutionalNote}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-bold text-ink-muted uppercase tracking-wider text-xs">
            {locale === 'pt'
              ? 'Parceiros'
              : locale === 'en'
                ? 'Partners'
                : locale === 'es'
                  ? 'Socios'
                  : 'Partenaires'}
          </span>
          {partners.map(p => (
            <Link
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted hover:text-citrus-dark transition-colors"
            >
              {p.name}
            </Link>
          ))}
        </div>
        <div className="text-xs text-ink-subtle md:text-right">
          <p>Tavira · Algarve · Portugal</p>
          <p className="mt-1">© {new Date().getFullYear()} Frusoal · v1.0 preliminar</p>
        </div>
      </div>
    </footer>
  );
};
