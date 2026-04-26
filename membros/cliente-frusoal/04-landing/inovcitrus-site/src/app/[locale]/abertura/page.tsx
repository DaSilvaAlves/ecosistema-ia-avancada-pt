import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Locale, isLocale, locales } from '@/lib/i18n';
import { getAbertura } from '@/data/abertura';
import { Hero } from '@/components/abertura/Hero';
import { Beat } from '@/components/abertura/Beat';
import { MaterialGrid } from '@/components/abertura/MaterialGrid';
import { SourcesAccordion } from '@/components/abertura/SourcesAccordion';
import { ContactBlock } from '@/components/abertura/ContactBlock';

interface AberturaPageProps {
  params: { locale: string };
}

export const dynamicParams = false;

export const generateStaticParams = () =>
  locales.map(locale => ({ locale }));

const sourcesToggleLabels: Record<Locale, string> = {
  pt: 'Ver as 16 fontes',
  en: 'View all 16 sources',
  es: 'Ver las 16 fuentes',
  fr: 'Voir les 16 sources'
};

const brandbookLinkLabels: Record<Locale, string> = {
  pt: 'Sistema visual aberto · ver',
  en: 'Open visual system · view',
  es: 'Sistema visual abierto · ver',
  fr: 'Système visuel ouvert · voir'
};

export default function AberturaPage({ params }: AberturaPageProps) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const content = getAbertura(locale);

  return (
    <article>
      <Hero hero={content.hero} />

      <div className="max-w-prose mx-auto">
        {content.beats.map(beat => (
          <Beat
            key={beat.number}
            beat={beat}
            isClimax={beat.number === 6}
          />
        ))}
      </div>

      <MaterialGrid material={content.material} />

      <SourcesAccordion
        sources={content.sources}
        toggleLabel={sourcesToggleLabels[locale]}
      />

      <ContactBlock contact={content.contact} />

      <footer
        className="max-w-prose mx-auto pt-8 pb-4 border-t border-surface-border text-xs text-ink-subtle italic space-y-2"
        aria-label="Assinatura"
      >
        <p>{content.footer.signature}</p>
        <p>{content.footer.disclaimer}</p>
        <p className="not-italic pt-2">
          <Link
            href={`/${locale}/identidade`}
            className="font-mono text-mono-footnote tracking-wider text-algarve-dark hover:text-citrus-dark transition-colors"
          >
            {brandbookLinkLabels[locale]} →
          </Link>
        </p>
      </footer>
    </article>
  );
}

export const generateMetadata = ({ params }: AberturaPageProps) => {
  if (!isLocale(params.locale)) return {};
  const content = getAbertura(params.locale as Locale);
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    robots: {
      index: false,
      follow: false
    }
  };
};
