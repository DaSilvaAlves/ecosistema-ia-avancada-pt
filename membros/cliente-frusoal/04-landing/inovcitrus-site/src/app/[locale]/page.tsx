import { notFound } from 'next/navigation';
import { Locale, isLocale } from '@/lib/i18n';
import { loadPage } from '@/lib/content';
import { MarkdownContent } from '@/components/MarkdownContent';

interface HomePageProps {
  params: { locale: string };
}

export const dynamicParams = false;

export default async function HomePage({ params }: HomePageProps) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const page = await loadPage(locale, 'home');

  return (
    <article>
      <MarkdownContent html={page.html} />
    </article>
  );
}

export const generateMetadata = async ({ params }: HomePageProps) => {
  if (!isLocale(params.locale)) return {};
  const page = await loadPage(params.locale as Locale, 'home');
  return {
    title: page.frontmatter.title
  };
};
