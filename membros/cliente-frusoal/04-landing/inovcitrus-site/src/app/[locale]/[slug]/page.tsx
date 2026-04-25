import { notFound } from 'next/navigation';
import { Locale, isLocale, isSlugKey, locales } from '@/lib/i18n';
import { loadPage, allSlugKeys } from '@/lib/content';
import { MarkdownContent } from '@/components/MarkdownContent';

interface SlugPageProps {
  params: { locale: string; slug: string };
}

export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = allSlugKeys.filter(s => s !== 'home');
  return locales.flatMap(locale =>
    slugs.map(slug => ({ locale, slug }))
  );
};

export default async function SlugPage({ params }: SlugPageProps) {
  if (!isLocale(params.locale) || !isSlugKey(params.slug)) notFound();
  const locale = params.locale as Locale;
  const page = await loadPage(locale, params.slug);

  return (
    <article>
      <MarkdownContent html={page.html} />
    </article>
  );
}

export const generateMetadata = async ({ params }: SlugPageProps) => {
  if (!isLocale(params.locale) || !isSlugKey(params.slug)) return {};
  const page = await loadPage(params.locale as Locale, params.slug);
  return {
    title: `${page.frontmatter.title} · Frusoal InovCitrus`
  };
};
