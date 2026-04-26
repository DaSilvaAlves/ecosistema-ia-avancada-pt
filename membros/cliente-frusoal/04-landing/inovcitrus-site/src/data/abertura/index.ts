import type { Locale } from '@/lib/i18n';
import type { AberturaContent } from './types';
import { aberturaPT } from './pt';
import { aberturaEN } from './en';
import { aberturaES } from './es';
import { aberturaFR } from './fr';

const aberturaByLocale: Record<Locale, AberturaContent> = {
  pt: aberturaPT,
  en: aberturaEN,
  es: aberturaES,
  fr: aberturaFR
};

export const getAbertura = (locale: Locale): AberturaContent => aberturaByLocale[locale];

export type { AberturaContent } from './types';
