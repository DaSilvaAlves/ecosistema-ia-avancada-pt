// Loader de conteúdo markdown — Frusoal InovCitrus
// Lê ficheiros `.md` de `content/{locale}/` e converte para HTML preservando frontmatter.

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import { Locale, SlugKey, slugFiles } from './i18n';

export interface PageFrontmatter {
  slug: string;
  route: string;
  title: string;
  lang: Locale;
  sources: string[];
  translation_basis?: string;
}

export interface PageContent {
  frontmatter: PageFrontmatter;
  html: string;
  raw: string;
}

const CONTENT_ROOT = path.resolve(process.cwd(), 'content');

const stripSourceComments = (markdown: string): string =>
  markdown.replace(/<!--\s*F\d+(?:\s*,\s*F\d+)*\s*-->/g, '');

export const loadPage = async (
  locale: Locale,
  slugKey: SlugKey
): Promise<PageContent> => {
  const filePath = path.join(CONTENT_ROOT, locale, slugFiles[slugKey]);
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = matter(raw);

  const cleaned = stripSourceComments(parsed.content);
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(cleaned);

  return {
    frontmatter: parsed.data as PageFrontmatter,
    html: processed.toString(),
    raw: parsed.content
  };
};

export const allSlugKeys: SlugKey[] = Object.keys(slugFiles) as SlugKey[];
