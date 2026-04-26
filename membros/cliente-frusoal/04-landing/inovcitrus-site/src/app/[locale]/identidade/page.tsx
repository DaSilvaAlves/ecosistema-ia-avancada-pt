import { Metadata } from 'next';
import { Locale, isLocale, locales } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { IdentitySidebar } from '@/components/brand/IdentitySidebar';
import { Section } from '@/components/brand/Section';
import { Swatch } from '@/components/brand/Swatch';
import { ContrastBadge } from '@/components/brand/ContrastBadge';
import { TypeSpecimen } from '@/components/brand/TypeSpecimen';
import { PlateCard } from '@/components/brand/PlateCard';
import { Cronos } from '@/components/brand/Cronos';
import { QuoteFBloco } from '@/components/brand/QuoteFBloco';
import { TabelaCientifica } from '@/components/brand/TabelaCientifica';
import { FichaPraga } from '@/components/brand/FichaPraga';

interface IdentityPageProps {
  params: { locale: string };
}

export const generateStaticParams = () =>
  locales.map((locale) => ({ locale }));

export const metadata: Metadata = {
  title: 'Sistema Visual · Frusoal InovCitrus',
  description:
    'Atlas Citrícola — sistema de design científico-agrícola do polo InovCitrus. Paleta extendida, tipografia, componentes e spec técnica.'
};

const sectionsByLocale = {
  pt: [
    { id: 'manifesto', number: '01', label: 'Manifesto' },
    { id: 'identidade', number: '02', label: 'Wordmark' },
    { id: 'paleta', number: '03', label: 'Paleta' },
    { id: 'tipografia', number: '04', label: 'Tipografia' },
    { id: 'componentes', number: '05', label: 'Componentes' },
    { id: 'tokens', number: '06', label: 'Tokens' },
    { id: 'aplicacoes', number: '07', label: 'Aplicações' },
    { id: 'acessibilidade', number: '08', label: 'Acessibilidade' }
  ],
  en: [
    { id: 'manifesto', number: '01', label: 'Manifesto' },
    { id: 'identidade', number: '02', label: 'Wordmark' },
    { id: 'paleta', number: '03', label: 'Palette' },
    { id: 'tipografia', number: '04', label: 'Typography' },
    { id: 'componentes', number: '05', label: 'Components' },
    { id: 'tokens', number: '06', label: 'Tokens' },
    { id: 'aplicacoes', number: '07', label: 'Applications' },
    { id: 'acessibilidade', number: '08', label: 'Accessibility' }
  ],
  es: [
    { id: 'manifesto', number: '01', label: 'Manifiesto' },
    { id: 'identidade', number: '02', label: 'Wordmark' },
    { id: 'paleta', number: '03', label: 'Paleta' },
    { id: 'tipografia', number: '04', label: 'Tipografía' },
    { id: 'componentes', number: '05', label: 'Componentes' },
    { id: 'tokens', number: '06', label: 'Tokens' },
    { id: 'aplicacoes', number: '07', label: 'Aplicaciones' },
    { id: 'acessibilidade', number: '08', label: 'Accesibilidad' }
  ],
  fr: [
    { id: 'manifesto', number: '01', label: 'Manifeste' },
    { id: 'identidade', number: '02', label: 'Wordmark' },
    { id: 'paleta', number: '03', label: 'Palette' },
    { id: 'tipografia', number: '04', label: 'Typographie' },
    { id: 'componentes', number: '05', label: 'Composants' },
    { id: 'tokens', number: '06', label: 'Tokens' },
    { id: 'aplicacoes', number: '07', label: 'Applications' },
    { id: 'acessibilidade', number: '08', label: 'Accessibilité' }
  ]
} as const;

const i18nCopy = {
  pt: {
    pageTitle: 'Atlas Citrícola',
    pageSubtitle:
      'Sistema de design científico-agrícola do polo InovCitrus — onde a tradição de 45 anos da Frusoal encontra o rigor de plate botânico do séc. XIX, traduzido em código moderno.',
    metaLabel: 'Sistema Visual · v1.0 · 26/04/2026'
  },
  en: {
    pageTitle: 'Citrus Atlas',
    pageSubtitle:
      'Scientific-agricultural design system for the InovCitrus pole — where Frusoal\'s 45 years of tradition meet the rigor of 19th-century botanical plates, translated into modern code.',
    metaLabel: 'Visual System · v1.0 · 04/26/2026'
  },
  es: {
    pageTitle: 'Atlas Citrícola',
    pageSubtitle:
      'Sistema de diseño científico-agrícola del polo InovCitrus — donde la tradición de 45 años de Frusoal se encuentra con el rigor de las láminas botánicas del siglo XIX, traducida en código moderno.',
    metaLabel: 'Sistema Visual · v1.0 · 26/04/2026'
  },
  fr: {
    pageTitle: 'Atlas Citricole',
    pageSubtitle:
      'Système de design scientifique-agricole du pôle InovCitrus — où la tradition de 45 ans de Frusoal rencontre la rigueur des planches botaniques du XIXe siècle, traduite en code moderne.',
    metaLabel: 'Système Visuel · v1.0 · 26/04/2026'
  }
} as const;

export default function IdentityPage({ params }: IdentityPageProps) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const sections = sectionsByLocale[locale];
  const copy = i18nCopy[locale];

  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-12">
      <aside className="hidden lg:block">
        <IdentitySidebar sections={[...sections]} />
      </aside>

      <article>
        {/* Hero */}
        <header className="mb-16 pb-10 border-b-2 border-algarve-dark">
          <p className="font-mono text-mono-tag uppercase tracking-wider text-algarve-dark mb-3">
            {copy.metaLabel}
          </p>
          <h1 className="font-display text-display-xl font-extrabold text-ink m-0">
            {copy.pageTitle}
          </h1>
          <p className="font-sans text-body-l text-ink-muted mt-6 max-w-prose">
            {copy.pageSubtitle}
          </p>
        </header>

        {/* §01 Manifesto */}
        <Section
          id="manifesto"
          number="01"
          title="Manifesto"
          intro="O InovCitrus existe para construir conhecimento aplicado em citricultura algarvia. O sistema visual respeita 45 anos de tradição e antecipa 36 meses de investigação."
        >
          <div className="space-y-6 max-w-prose">
            <QuoteFBloco
              quote="A produção de citrinos no Algarve atingiu 40.000 toneladas em 2024, o maior valor desde 2018."
              author="Fonte F08"
              authorRole="Cifras INE · Estatística agrícola"
              date="2025"
              sourceFootnoteId="F08"
            />
            <QuoteFBloco
              quote="Construir o que se sabe, no terreno, com método científico e respeito pelo ofício."
              variant="dark"
              author="InovCitrus"
              authorRole="Princípio fundador"
              date="2026"
              sourceFootnoteId="—"
            />
          </div>
        </Section>

        {/* §02 Wordmark */}
        <Section
          id="identidade"
          number="02"
          title="Wordmark"
          intro="Tipográfico Inter sem ícone — Frusoal regular weight 400 + InovCitrus extrabold weight 800. A versão colorida usa Citrus dark (#C68420) na palavra InovCitrus para harmonizar com a paleta da casa-mãe."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-surface-warm border border-surface-border rounded-card p-8 flex items-center justify-center">
              <span className="text-3xl">
                <span className="font-sans font-normal text-ink">Frusoal </span>
                <span className="font-sans font-extrabold text-citrus-dark">
                  InovCitrus
                </span>
              </span>
            </div>
            <div className="bg-ink rounded-card p-8 flex items-center justify-center">
              <span className="text-3xl">
                <span className="font-sans font-normal text-surface-warm">
                  Frusoal{' '}
                </span>
                <span className="font-sans font-extrabold text-solar">
                  InovCitrus
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <PlateCard
              plateId="DO"
              category="Wordmark"
              title="Compor com Inter"
              description="Manter Inter 400/800. Manter Citrus dark #C68420 em InovCitrus quando colorido. Manter espaço respiratório mínimo (1× altura)."
            />
            <PlateCard
              plateId="DON'T"
              category="Wordmark"
              title="Não distorcer"
              description="Não usar outras famílias. Não trocar a cor do InovCitrus. Não comprimir nem expandir letterspacing. Não acrescentar ícone, sombra ou efeito."
              variant="featured"
            />
          </div>
        </Section>

        {/* §03 Paleta */}
        <Section
          id="paleta"
          number="03"
          title="Paleta"
          intro="11 cores divididas em 2 famílias: 6 do núcleo (alinhadas com a Frusoal-mãe) e 5 funcionais (validadas após audit Gomo + Biogomo). Todas com ratios WCAG calculados."
        >
          <h3 className="font-sans text-body-l font-bold text-ink mb-4">
            Núcleo · alinhado com Frusoal-mãe
          </h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Swatch name="Citrus" token="--core-citrus" hex="#E8A53C" rgb="rgb(232,165,60)" use="Acção primária" />
            <Swatch name="Citrus dark" token="--core-citrus-dark" hex="#C68420" rgb="rgb(198,132,32)" use="Hover · links" />
            <Swatch name="Algarve" token="--core-algarve" hex="#5A8C45" rgb="rgb(90,140,69)" use="Verde sóbrio" />
            <Swatch name="Algarve dark" token="--core-algarve-dark" hex="#3F6A2E" rgb="rgb(63,106,46)" use="Verde texto" />
            <Swatch name="Ink" token="--core-ink" hex="#1A1A1A" rgb="rgb(26,26,26)" use="Texto principal" textColor="surface-warm" />
            <Swatch name="Surface warm" token="--core-surface-warm" hex="#FAF8F4" rgb="rgb(250,248,244)" use="Fundo institucional" />
          </div>

          <h3 className="font-sans text-body-l font-bold text-ink mb-4 mt-12">
            Funcional · v2.0 ajustada após audit
          </h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Swatch name="Solar" token="--fn-solar" hex="#FFD27A" rgb="rgb(255,210,122)" use="Luz dourada · selo IGP" />
            <Swatch name="Pomar" token="--fn-pomar" hex="#7FB069" rgb="rgb(127,176,105)" use="Sucesso · activo" />
            <Swatch name="Tinta" token="--fn-tinta" hex="#1B2A4E" rgb="rgb(27,42,78)" use="Citações · footnotes" textColor="surface-warm" />
            <Swatch name="Crítico" token="--fn-critico" hex="#8B2E22" rgb="rgb(139,46,34)" use="Alertas · Scirtothrips" textColor="surface-warm" />
            <Swatch name="Pergaminho" token="--fn-pergaminho" hex="#F1EBDB" rgb="rgb(241,235,219)" use="Cards Plate" />
          </div>

          <h3 className="font-sans text-body-l font-bold text-ink mb-4 mt-12">
            Contraste WCAG · texto sobre Surface warm #FAF8F4
          </h3>
          <div className="bg-surface border border-surface-border rounded-card p-6">
            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-ink">Ink #1A1A1A</span>
                <ContrastBadge ratio={16.4} />
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-tinta">Tinta #1B2A4E</span>
                <ContrastBadge ratio={13.3} />
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-critico">Crítico #8B2E22</span>
                <ContrastBadge ratio={7.9} />
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-algarve-dark">Algarve dark #3F6A2E</span>
                <ContrastBadge ratio={6.0} />
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-algarve">Algarve #5A8C45</span>
                <ContrastBadge ratio={3.8} />
                <ContrastBadge ratio={3.8} scale="large" />
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="font-sans text-body-m text-citrus-dark">Citrus dark #C68420</span>
                <ContrastBadge ratio={3.0} />
                <ContrastBadge ratio={3.0} scale="large" />
              </li>
            </ul>
          </div>
        </Section>

        {/* §04 Tipografia */}
        <Section
          id="tipografia"
          number="04"
          title="Tipografia"
          intro="Par tipográfico de 3 famílias: Fraunces (display · serif moderno com ressonância clássica) + Inter (body · sans humanista) + JetBrains Mono (data · code · footnotes). Cada uma com responsabilidade clara."
        >
          <TypeSpecimen
            family="display"
            weight={800}
            size="4rem"
            lineHeight="1.05"
            letterSpacing="-0.04em"
            sample="Atlas Citrícola"
            spec="Display XL · Fraunces · 64/1.05 · 800 · -0.04em"
          />
          <TypeSpecimen
            family="display"
            weight={800}
            size="3rem"
            lineHeight="1.10"
            letterSpacing="-0.03em"
            sample="Display L · H1 da página"
            spec="Display L · Fraunces · 48/1.10 · 800 · -0.03em"
          />
          <TypeSpecimen
            family="display"
            weight={600}
            size="2.25rem"
            lineHeight="1.15"
            letterSpacing="-0.02em"
            italic
            sample="Display M · italic · Citrus sinensis"
            spec="Display M · Fraunces · 36/1.15 · 600 · italic"
          />
          <TypeSpecimen
            family="display"
            weight={400}
            size="1.75rem"
            lineHeight="1.4"
            italic
            sample="« Pull Quote · citações destacadas »"
            spec="Pull Quote · Fraunces · 28/1.4 · 400 · italic"
          />
          <TypeSpecimen
            family="sans"
            weight={400}
            size="1.125rem"
            lineHeight="1.7"
            sample="Body L · introdução · 18px · Inter regular weight 400. A produção de citrinos no Algarve atingiu 40.000 toneladas em 2024."
            spec="Body L · Inter · 18/1.7 · 400"
          />
          <TypeSpecimen
            family="sans"
            weight={400}
            size="1rem"
            lineHeight="1.7"
            sample="Body M · padrão · 16px · Inter regular weight 400. A produção de citrinos no Algarve atingiu 40.000 toneladas em 2024."
            spec="Body M · Inter · 16/1.7 · 400"
          />
          <TypeSpecimen
            family="sans"
            weight={500}
            size="0.75rem"
            lineHeight="1.5"
            sample="Caption · meta · alt text · 12px · Inter medium 500"
            spec="Caption · Inter · 12/1.5 · 500"
          />
          <TypeSpecimen
            family="mono"
            weight={500}
            size="0.6875rem"
            lineHeight={1}
            letterSpacing="0.1em"
            uppercase
            sample="Mono Tag · Plate XII"
            spec="Mono Tag · JetBrains Mono · 11/1 · 500 · uppercase"
          />
          <TypeSpecimen
            family="mono"
            weight={500}
            size="0.75rem"
            lineHeight="1.4"
            letterSpacing="0.02em"
            sample="F08 · Footnote ID · rastreabilidade"
            spec="Footnote · JetBrains Mono · 12/1.4 · 500"
          />
          <TypeSpecimen
            family="mono"
            weight={400}
            size="0.875rem"
            lineHeight="1.6"
            italic
            sample="Scirtothrips aurantii · ID científico"
            spec="Scientific ID · JetBrains Mono · 14/1.6 · 400 · italic"
          />
        </Section>

        {/* §05 Componentes */}
        <Section
          id="componentes"
          number="05"
          title="Componentes"
          intro="5 componentes assinatura que dão personalidade ao InovCitrus. Inspiração: plate botânico do séc. XIX · cartografia · livro de campo. Implementados em React + Tailwind, código aberto."
        >
          <h3 className="font-sans text-body-l font-bold text-ink mb-4">Plate Card</h3>
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <PlateCard
              plateId="Plate XII"
              category="Citrus"
              title="Citrus sinensis"
              subtitle="laranja doce"
              description="A laranja doce cresce no Algarve há 8 séculos. Variedade dominante na produção Frusoal: 80% do volume anual."
              footnoteId="F03"
              meta={['Pomares Frusoal', '2025']}
            />
            <PlateCard
              plateId="Plate III"
              category="Marco"
              title="Caracterização"
              subtitle="2025 · Q3"
              description="Caracterização preliminar de Scirtothrips aurantii em pomares-piloto. Trabalho conjunto Frusoal × InPP × CCDR Algarve."
              footnoteId="F11"
              meta={['Roadmap M01']}
              variant="featured"
            />
          </div>

          <h3 className="font-sans text-body-l font-bold text-ink mb-4">Cronos · Timeline</h3>
          <div className="bg-surface border border-surface-border rounded-card p-8 mb-12 overflow-x-auto">
            <Cronos
              markers={[
                { id: 'M01', date: '2025 Q3', label: 'Caracterização', status: 'past', description: 'Scirtothrips' },
                { id: 'M04', date: '2026 Q2', label: 'Pilots IA', status: 'present', description: 'Visão computacional' },
                { id: 'M08', date: '2027 Q1', label: 'Replicação', status: 'future', description: 'Algarve' },
                { id: 'M12', date: '2028 Q1', label: 'Reporting', status: 'future', description: 'Trienal completo' }
              ]}
            />
          </div>

          <h3 className="font-sans text-body-l font-bold text-ink mb-4">Quote F-Bloco</h3>
          <div className="grid gap-6 mb-12">
            <QuoteFBloco
              quote="A produção de citrinos no Algarve atingiu 40.000 toneladas em 2024."
              author="INE"
              authorRole="Estatística Agrícola"
              date="2025"
              sourceFootnoteId="F08"
            />
          </div>

          <h3 className="font-sans text-body-l font-bold text-ink mb-4">Tabela Científica</h3>
          <TabelaCientifica
            caption="Tabela 03 · Indicadores produção 2022-2025"
            columns={[
              { id: 'indicador', label: 'INDICADOR', align: 'left' },
              { id: 'y2022', label: '2022', align: 'right' },
              { id: 'y2023', label: '2023', align: 'right' },
              { id: 'y2024', label: '2024', align: 'right' },
              { id: 'y2025', label: '2025', align: 'right' }
            ]}
            rows={[
              { indicador: 'Toneladas/ano', y2022: '38.500', y2023: '39.200', y2024: '40.000', y2025: '40.800' },
              { indicador: 'Hectares cultivados', y2022: '1.450', y2023: '1.475', y2024: '1.500', y2025: '1.520' },
              { indicador: 'Produtores associados', y2022: 62, y2023: 63, y2024: 65, y2025: 65 },
              { indicador: 'Exportação % do total', y2022: '22%', y2023: '24%', y2024: '25%', y2025: '27%¹' }
            ]}
            footnotes={[
              { marker: '¹', text: 'Estimativa preliminar — campanha 2025 em curso', sourceId: 'F12' }
            ]}
          />

          <h3 className="font-sans text-body-l font-bold text-ink mb-4 mt-12">Ficha Praga</h3>
          <FichaPraga
            plateId="Plate VII"
            category="Praga"
            commonName="Tripes da África do Sul"
            scientificName="Scirtothrips aurantii"
            metadata={[
              { label: 'Ordem', value: 'Thysanoptera' },
              { label: 'Família', value: 'Thripidae' },
              { label: 'Detecção PT', value: '2024 (Algarve)' }
            ]}
            sections={[
              {
                title: 'Descrição',
                content:
                  'Tripes invasor detectado pela primeira vez no Algarve em 2024. Causa danos significativos em folhas e frutos jovens de citrinos.'
              },
              {
                title: 'Sintomas',
                type: 'list',
                content: [
                  'Manchas prateadas em folhas',
                  'Deformação de frutos jovens',
                  'Necroses superficiais em frutos maduros'
                ]
              },
              {
                title: 'Controlo',
                content:
                  'Estratégias de Gestão Integrada de Pragas (IPM) com monitorização por armadilhas cromáticas e libertação de auxiliares.'
              }
            ]}
            sourceFootnoteIds={['F03', 'F07', 'F11']}
          />
        </Section>

        {/* §06 Tokens */}
        <Section
          id="tokens"
          number="06"
          title="Tokens"
          intro="11 cores, 3 famílias tipográficas, 11 tamanhos, 5 motion tokens, 4 box-shadows. Tudo declarado em CSS variables, Tailwind config, e exportado em formato W3C DTCG."
        >
          <div className="bg-tinta text-pergaminho rounded-card p-6 overflow-x-auto mb-6">
            <pre className="font-mono text-mono-code m-0">
              <code>{`/* globals.css */
:root {
  /* Núcleo */
  --core-citrus: #E8A53C;
  --core-citrus-dark: #C68420;
  --core-algarve: #5A8C45;
  --core-algarve-dark: #3F6A2E;
  --core-ink: #1A1A1A;
  --core-surface-warm: #FAF8F4;

  /* Funcional */
  --fn-solar: #FFD27A;
  --fn-pomar: #7FB069;
  --fn-tinta: #1B2A4E;
  --fn-critico: #8B2E22;
  --fn-pergaminho: #F1EBDB;

  /* Tipografia */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Motion */
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --ease-quiet: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}`}</code>
            </pre>
          </div>

          <p className="font-sans text-body-m text-ink-muted">
            Export DTCG W3C disponível em{' '}
            <a
              href="/tokens/inovcitrus-tokens.dtcg.json"
              className="text-citrus-dark underline hover:text-citrus"
            >
              <code className="font-mono text-mono-code">/tokens/inovcitrus-tokens.dtcg.json</code>
            </a>{' '}
            — pronto para Figma Tokens, Style Dictionary, ou outras ferramentas de design tokens.
          </p>
        </Section>

        {/* §07 Aplicações */}
        <Section
          id="aplicacoes"
          number="07"
          title="Aplicações"
          intro="O sistema visual InovCitrus aplica-se a 5 superfícies principais. Cada uma respeita a sobriedade do tema e a hierarquia tipográfica."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <PlateCard
              plateId="01"
              category="Aplicação"
              title="Site institucional"
              description="inovcitrus.vercel.app — Next.js 14 · 4 línguas · 21 endpoints · este sistema visual aplicado integralmente."
              footnoteId="—"
              meta={['Live · 25/04/2026']}
            />
            <PlateCard
              plateId="02"
              category="Aplicação"
              title="PDFs editoriais"
              description="6 PDFs gerados via Chrome headless: ficha técnica × 4 línguas · roadmap 36 meses · press release."
              footnoteId="—"
              meta={['v1.0 · 2025']}
            />
            <PlateCard
              plateId="03"
              category="Aplicação"
              title="Kit imprensa"
              description="Wordmarks SVG · paleta swatches · press releases editáveis · README institucional."
              footnoteId="—"
              meta={['Frusoal']}
            />
            <PlateCard
              plateId="04"
              category="Aplicação"
              title="Comunicação institucional"
              description="Aplicação coerente em apresentações · documentos científicos · publicações da Frusoal."
              footnoteId="—"
              meta={['Padrão · 2026']}
            />
          </div>
        </Section>

        {/* §08 Acessibilidade */}
        <Section
          id="acessibilidade"
          number="08"
          title="Acessibilidade"
          intro="WCAG 2.1 AA como linha de base. AAA onde possível. Não como afterthought — built-in desde a paleta."
        >
          <ul className="space-y-4 max-w-prose">
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Contraste:</strong> Todas as combinações de texto principal (Ink, Tinta, Crítico) sobre Surface warm passam AAA. Algarve dark passa AA. Cores decorativas (Citrus, Solar, Pomar) restritas a UI/badges grandes.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Tipografia mínima:</strong> Body 16px (1rem) · caption 12px (0.75rem). Line-height mínimo 1.5 · preferível 1.7 para corpo.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Focus visível:</strong> Outline 2px Citrus offset 2px em todos os elementos interactivos.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Skip link:</strong> Saltar para conteúdo · navegação por teclado completa.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>ARIA:</strong> Landmarks · aria-labels · scientific IDs marcados com italic semântico · footnotes ligadas a fontes F01-F16.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Motion:</strong> Tokens sóbrios (150-400ms · easing quiet). Respeita prefers-reduced-motion via Tailwind.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pomar mt-1" aria-hidden="true">✓</span>
              <span className="font-sans text-body-m text-ink">
                <strong>Multilíngue:</strong> PT/EN/ES/FR · diacríticos correctos em todas as fontes · lang attribute sempre presente.
              </span>
            </li>
          </ul>
        </Section>

        {/* Footer da página */}
        <footer className="mt-20 pt-10 border-t border-surface-border">
          <p className="font-mono text-mono-footnote text-ink-subtle">
            Atlas Citrícola · Sistema Visual Frusoal InovCitrus · v1.0 · 26/04/2026 · Desenhado por Uma (UX Design Expert)
          </p>
        </footer>
      </article>
    </div>
  );
}
