import { notFound } from 'next/navigation';
import { Locale, isLocale, locales, getUI } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export const generateStaticParams = () =>
  locales.map(locale => ({ locale }));

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const ui = getUI(locale);

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-surface-warm">
        <a href="#main" className="skip-link">
          {ui.skipToContent}
        </a>
        <Header locale={locale} />
        <main id="main" className="flex-1 mx-auto max-w-content w-full px-6 md:px-8 py-12">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
