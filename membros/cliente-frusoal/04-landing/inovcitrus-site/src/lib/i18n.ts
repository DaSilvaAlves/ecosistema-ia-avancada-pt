// Configuração de internacionalização — Frusoal InovCitrus
// 4 línguas. PT é língua principal (master); EN/ES/FR são traduções ancoradas em fontes regionais oficiais.

export const locales = ['pt', 'en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

// Mapeamento slug-key → ficheiro markdown (mesmo nome em todas as línguas)
export const slugFiles = {
  home: '01-home.md',
  project: '02-projecto-trienal.md',
  structure: '03-estrutura-parceiros.md',
  repository: '04-repositorio.md',
  contacts: '05-contactos.md'
} as const;

export type SlugKey = keyof typeof slugFiles;

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const isSlugKey = (value: string): value is SlugKey =>
  Object.keys(slugFiles).includes(value);

// Etiquetas de UI por locale
export const ui = {
  pt: {
    languageLabel: 'Língua',
    skipToContent: 'Saltar para o conteúdo',
    languages: { pt: 'Português', en: 'Inglês', es: 'Espanhol', fr: 'Francês' },
    nav: {
      home: 'Início',
      project: 'Projecto Trienal',
      structure: 'Estrutura',
      repository: 'Repositório',
      contacts: 'Contactos',
      identity: 'Sistema Visual'
    },
    institutionalNote:
      'Comunicação institucional via Frusoal — frusoal.pt'
  },
  en: {
    languageLabel: 'Language',
    skipToContent: 'Skip to content',
    languages: { pt: 'Portuguese', en: 'English', es: 'Spanish', fr: 'French' },
    nav: {
      home: 'Home',
      project: 'Three-Year Project',
      structure: 'Structure',
      repository: 'Repository',
      contacts: 'Contacts',
      identity: 'Visual System'
    },
    institutionalNote:
      'Institutional communication via Frusoal — frusoal.pt'
  },
  es: {
    languageLabel: 'Idioma',
    skipToContent: 'Saltar al contenido',
    languages: { pt: 'Portugués', en: 'Inglés', es: 'Español', fr: 'Francés' },
    nav: {
      home: 'Inicio',
      project: 'Proyecto Trienal',
      structure: 'Estructura',
      repository: 'Repositorio',
      contacts: 'Contactos',
      identity: 'Sistema Visual'
    },
    institutionalNote:
      'Comunicación institucional vía Frusoal — frusoal.pt'
  },
  fr: {
    languageLabel: 'Langue',
    skipToContent: 'Aller au contenu',
    languages: { pt: 'Portugais', en: 'Anglais', es: 'Espagnol', fr: 'Français' },
    nav: {
      home: 'Accueil',
      project: 'Projet Triennal',
      structure: 'Structure',
      repository: 'Référentiel',
      contacts: 'Contacts',
      identity: 'Système Visuel'
    },
    institutionalNote:
      'Communication institutionnelle via Frusoal — frusoal.pt'
  }
} as const;

export const getUI = (locale: Locale) => ui[locale];
