import { notFound } from 'next/navigation';
import { Locale, isLocale, locales } from '@/lib/i18n';

interface KitPageProps {
  params: { locale: string };
}

export const dynamicParams = false;

export const generateStaticParams = () =>
  locales.map(locale => ({ locale }));

interface KitFile {
  filename: string;
  format: string;
  href: string;
  preview?: string; // só para imagens
}

interface KitContent {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  filesHeading: string;
  files: { file: KitFile; description: string }[];
  downloadLabel: string;
  previewLabel: string;
  backLabel: string;
  backHref: string;
  rules: { heading: string; lines: string[] };
}

const sharedFiles: Record<string, KitFile> = {
  wordmark: {
    filename: 'wordmark-inovcitrus.svg',
    format: 'SVG',
    href: '/material/kit/wordmark-inovcitrus.svg'
  },
  wordmarkMono: {
    filename: 'wordmark-inovcitrus-mono.svg',
    format: 'SVG',
    href: '/material/kit/wordmark-inovcitrus-mono.svg'
  },
  paletaPNG: {
    filename: 'paleta-swatches.png',
    format: 'PNG',
    href: '/material/kit/paleta-swatches.png',
    preview: '/material/kit/paleta-swatches.png'
  },
  paletaHTML: {
    filename: 'paleta-swatches.html',
    format: 'HTML',
    href: '/material/kit/paleta-swatches.html'
  },
  pressPT: {
    filename: 'press-release-pt.md',
    format: 'Markdown',
    href: '/material/kit/press-release-pt.md'
  },
  pressEN: {
    filename: 'press-release-en.md',
    format: 'Markdown',
    href: '/material/kit/press-release-en.md'
  },
  readme: {
    filename: 'README.md',
    format: 'Markdown',
    href: '/material/kit/README.md'
  }
};

const content: Record<Locale, KitContent> = {
  pt: {
    metaTitle: 'Kit imprensa · InovCitrus',
    metaDescription:
      'Conteúdos institucionais para uso da Frusoal em comunicação sobre o polo InovCitrus — wordmarks, paleta, press releases editáveis.',
    title: 'Kit imprensa',
    intro:
      'Conteúdos disponíveis para uso da Frusoal em comunicação institucional sobre o polo InovCitrus. Todos os ficheiros são modelos editáveis — adaptar datas, contactos e citações antes de cada utilização.',
    filesHeading: 'Ficheiros',
    files: [
      { file: sharedFiles.wordmark, description: 'Wordmark institucional para web, digital, materiais a cores.' },
      { file: sharedFiles.wordmarkMono, description: 'Variante monocromática para impressão a preto e branco, fax, fotocópia.' },
      { file: sharedFiles.paletaPNG, description: 'Cores institucionais com nome, hex e uso (referência para designers).' },
      { file: sharedFiles.paletaHTML, description: 'Source da paleta · pode ser regenerado em qualquer tamanho.' },
      { file: sharedFiles.pressPT, description: 'Modelo de press release de lançamento (PT-PT).' },
      { file: sharedFiles.pressEN, description: 'Modelo de press release de lançamento (EN).' },
      { file: sharedFiles.readme, description: 'Índice completo do kit, com tipografia e regras de uso da paleta.' }
    ],
    downloadLabel: 'Descarregar',
    previewLabel: 'Pré-visualização',
    backLabel: '← Voltar à página de abertura',
    backHref: '/pt/abertura',
    rules: {
      heading: 'Regras de uso',
      lines: [
        'Os modelos editáveis devem ser preenchidos com dados verificados antes de cada publicação.',
        'A paleta está alinhada com a identidade visual da Frusoal — laranja citrino + verde algarvio sóbrio.',
        'A wordmark colorida usa o tom Citrus dark (#C68420) na palavra InovCitrus para harmonizar com a paleta da Frusoal.'
      ]
    }
  },
  en: {
    metaTitle: 'Press kit · InovCitrus',
    metaDescription:
      'Institutional content for Frusoal use in communications about the InovCitrus centre — wordmarks, palette, editable press releases.',
    title: 'Press kit',
    intro:
      'Content available for Frusoal use in institutional communications about the InovCitrus centre. All files are editable templates — adapt dates, contacts and quotations before each use.',
    filesHeading: 'Files',
    files: [
      { file: sharedFiles.wordmark, description: 'Institutional wordmark for web, digital, colour materials.' },
      { file: sharedFiles.wordmarkMono, description: 'Monochromatic variant for black-and-white printing, fax, photocopy.' },
      { file: sharedFiles.paletaPNG, description: 'Institutional colours with name, hex and use (reference for designers).' },
      { file: sharedFiles.paletaHTML, description: 'Palette source · can be regenerated at any size.' },
      { file: sharedFiles.pressPT, description: 'Launch press release template (PT-PT).' },
      { file: sharedFiles.pressEN, description: 'Launch press release template (EN).' },
      { file: sharedFiles.readme, description: 'Full kit index, with typography and palette use rules.' }
    ],
    downloadLabel: 'Download',
    previewLabel: 'Preview',
    backLabel: '← Back to opening page',
    backHref: '/en/abertura',
    rules: {
      heading: 'Rules of use',
      lines: [
        'Editable templates must be filled with verified data before each publication.',
        'The palette is aligned with Frusoal\'s visual identity — citrus orange + sober Algarve green.',
        'The colour wordmark uses the Citrus dark tone (#C68420) in the word InovCitrus to harmonise with the Frusoal palette.'
      ]
    }
  },
  es: {
    metaTitle: 'Kit de prensa · InovCitrus',
    metaDescription:
      'Contenidos institucionales para uso de Frusoal en comunicación sobre el polo InovCitrus — wordmarks, paleta, notas de prensa editables.',
    title: 'Kit de prensa',
    intro:
      'Contenidos disponibles para uso de Frusoal en comunicación institucional sobre el polo InovCitrus. Todos los archivos son plantillas editables — adaptar fechas, contactos y citas antes de cada uso.',
    filesHeading: 'Archivos',
    files: [
      { file: sharedFiles.wordmark, description: 'Wordmark institucional para web, digital, materiales a color.' },
      { file: sharedFiles.wordmarkMono, description: 'Variante monocromática para impresión en blanco y negro, fax, fotocopia.' },
      { file: sharedFiles.paletaPNG, description: 'Colores institucionales con nombre, hex y uso (referencia para diseñadores).' },
      { file: sharedFiles.paletaHTML, description: 'Fuente de la paleta · se puede regenerar en cualquier tamaño.' },
      { file: sharedFiles.pressPT, description: 'Plantilla de nota de prensa de lanzamiento (PT-PT).' },
      { file: sharedFiles.pressEN, description: 'Plantilla de nota de prensa de lanzamiento (EN).' },
      { file: sharedFiles.readme, description: 'Índice completo del kit, con tipografía y reglas de uso de la paleta.' }
    ],
    downloadLabel: 'Descargar',
    previewLabel: 'Vista previa',
    backLabel: '← Volver a la página de apertura',
    backHref: '/es/abertura',
    rules: {
      heading: 'Reglas de uso',
      lines: [
        'Las plantillas editables deben rellenarse con datos verificados antes de cada publicación.',
        'La paleta está alineada con la identidad visual de Frusoal — naranja cítrico + verde algarvio sobrio.',
        'La wordmark a color usa el tono Citrus dark (#C68420) en la palabra InovCitrus para armonizar con la paleta de Frusoal.'
      ]
    }
  },
  fr: {
    metaTitle: 'Kit presse · InovCitrus',
    metaDescription:
      "Contenus institutionnels pour utilisation par Frusoal en communication sur le pôle InovCitrus — wordmarks, palette, communiqués éditables.",
    title: 'Kit presse',
    intro:
      "Contenus disponibles pour utilisation par Frusoal en communication institutionnelle sur le pôle InovCitrus. Tous les fichiers sont des modèles éditables — adapter dates, contacts et citations avant chaque utilisation.",
    filesHeading: 'Fichiers',
    files: [
      { file: sharedFiles.wordmark, description: "Wordmark institutionnel pour le web, le numérique, les supports en couleur." },
      { file: sharedFiles.wordmarkMono, description: "Variante monochrome pour impression noir et blanc, fax, photocopie." },
      { file: sharedFiles.paletaPNG, description: "Couleurs institutionnelles avec nom, hex et usage (référence pour designers)." },
      { file: sharedFiles.paletaHTML, description: "Source de la palette · peut être régénérée à n'importe quelle taille." },
      { file: sharedFiles.pressPT, description: 'Modèle de communiqué de presse de lancement (PT-PT).' },
      { file: sharedFiles.pressEN, description: 'Modèle de communiqué de presse de lancement (EN).' },
      { file: sharedFiles.readme, description: "Index complet du kit, avec typographie et règles d'utilisation de la palette." }
    ],
    downloadLabel: 'Télécharger',
    previewLabel: 'Aperçu',
    backLabel: "← Retour à la page d'ouverture",
    backHref: '/fr/abertura',
    rules: {
      heading: 'Règles d\'utilisation',
      lines: [
        "Les modèles éditables doivent être remplis avec des données vérifiées avant chaque publication.",
        "La palette est alignée à l'identité visuelle de Frusoal — orange citrique + vert algarvien sobre.",
        "La wordmark en couleur utilise la teinte Citrus dark (#C68420) sur le mot InovCitrus pour s'harmoniser avec la palette de Frusoal."
      ]
    }
  }
};

export default function KitPage({ params }: KitPageProps) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const c = content[locale];

  return (
    <article>
      <header className="max-w-prose mx-auto pt-4 pb-8">
        <a
          href={c.backHref}
          className="font-mono text-xs tracking-wider text-citrus-dark hover:underline"
        >
          {c.backLabel}
        </a>
        <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-ink leading-tight tracking-tight mt-4 mb-4">
          {c.title}
        </h1>
        <p className="text-base md:text-lg text-ink-muted leading-relaxed">
          {c.intro}
        </p>
      </header>

      <section
        className="max-w-content mx-auto py-8"
        aria-labelledby="kit-files-heading"
      >
        <h2
          id="kit-files-heading"
          className="font-sans text-2xl md:text-3xl font-bold text-ink mb-6"
        >
          {c.filesHeading}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 list-none">
          {c.files.map(({ file, description }) => (
            <li
              key={file.filename}
              className="flex flex-col p-5 border border-surface-border rounded-md bg-surface hover:border-citrus transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="font-mono text-[10px] tracking-widest uppercase text-citrus-dark bg-surface-warm border border-surface-border rounded px-2 py-1">
                  {file.format}
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-ink mb-2 break-all">
                {file.filename}
              </p>
              <p className="text-sm text-ink-muted leading-relaxed mb-4">
                {description}
              </p>
              {file.preview && (
                <div className="mb-4 border border-surface-border rounded overflow-hidden bg-surface-warm">
                  <img
                    src={file.preview}
                    alt={c.previewLabel}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              )}
              <a
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                download={file.filename}
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-ink text-surface-warm hover:bg-citrus-dark font-sans font-bold text-sm rounded transition-colors"
              >
                {c.downloadLabel} ↓
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="max-w-prose mx-auto py-8"
        aria-labelledby="kit-rules-heading"
      >
        <h2
          id="kit-rules-heading"
          className="font-sans text-xl md:text-2xl font-bold text-ink mb-4"
        >
          {c.rules.heading}
        </h2>
        <ul className="list-disc list-inside space-y-2 text-base text-ink-muted leading-relaxed">
          {c.rules.lines.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export const generateMetadata = ({ params }: KitPageProps) => {
  if (!isLocale(params.locale)) return {};
  const c = content[params.locale as Locale];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    robots: { index: false, follow: false }
  };
};
