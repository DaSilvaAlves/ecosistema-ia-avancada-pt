import Link from 'next/link';
import { Locale, getUI } from '@/lib/i18n';
import { Wordmark } from './Wordmark';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  locale: Locale;
}

export const Header = ({ locale }: HeaderProps) => {
  const ui = getUI(locale);

  const navItems: { key: keyof typeof ui.nav; href: string }[] = [
    { key: 'project', href: `/${locale}/project` },
    { key: 'structure', href: `/${locale}/structure` },
    { key: 'repository', href: `/${locale}/repository` },
    { key: 'contacts', href: `/${locale}/contacts` }
  ];

  return (
    <header className="border-b border-surface-border bg-surface">
      <div className="mx-auto max-w-content px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Wordmark locale={locale} />
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <nav aria-label="primary" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {navItems.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="text-ink-muted hover:text-citrus-dark transition-colors"
              >
                {ui.nav[key]}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
};
