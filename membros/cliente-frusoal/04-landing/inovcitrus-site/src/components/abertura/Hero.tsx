import type { AberturaHero } from '@/data/abertura/types';

interface HeroProps {
  hero: AberturaHero;
}

export const Hero = ({ hero }: HeroProps) => (
  <section
    className="relative max-w-prose mx-auto pt-4 md:pt-8 pb-12 md:pb-16"
    aria-labelledby="abertura-hero-title"
  >
    <h1
      id="abertura-hero-title"
      className="font-sans text-ink leading-[1.05] tracking-tight"
    >
      <span className="block text-4xl md:text-5xl font-extrabold">
        {hero.greeting}
      </span>
      <span className="block text-3xl md:text-4xl font-bold text-citrus-dark mt-1">
        {hero.message}
      </span>
    </h1>
    <p className="mt-6 md:mt-8 text-lg md:text-xl text-ink-muted leading-relaxed italic">
      {hero.context}
    </p>
    <div className="mt-8 h-px w-16 bg-citrus" aria-hidden="true" />
  </section>
);
