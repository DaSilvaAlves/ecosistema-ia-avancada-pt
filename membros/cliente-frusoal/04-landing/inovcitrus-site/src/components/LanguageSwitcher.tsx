'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Locale, locales, getUI } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export const LanguageSwitcher = ({ currentLocale }: LanguageSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const ui = getUI(currentLocale);

  const switchTo = (target: Locale) => {
    const segments = pathname.split('/').filter(Boolean);
    const [, ...rest] = segments; // remove locale segment
    const next = `/${target}${rest.length ? '/' + rest.join('/') : ''}`;
    router.push(next);
  };

  return (
    <nav aria-label={ui.languageLabel} className="flex items-center gap-1 text-sm">
      {locales.map((locale, idx) => {
        const isCurrent = locale === currentLocale;
        return (
          <span key={locale} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => switchTo(locale)}
              disabled={isCurrent}
              aria-current={isCurrent ? 'true' : undefined}
              className={
                isCurrent
                  ? 'font-bold text-citrus-dark cursor-default uppercase tracking-wider text-xs'
                  : 'text-ink-subtle hover:text-citrus-dark uppercase tracking-wider text-xs transition-colors'
              }
            >
              {locale}
            </button>
            {idx < locales.length - 1 && (
              <span className="text-surface-border" aria-hidden="true">·</span>
            )}
          </span>
        );
      })}
    </nav>
  );
};
