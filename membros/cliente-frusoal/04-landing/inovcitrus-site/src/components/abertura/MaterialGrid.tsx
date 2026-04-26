import Link from 'next/link';
import type { AberturaMaterial, MaterialItem } from '@/data/abertura/types';

interface MaterialGridProps {
  material: AberturaMaterial;
}

const KindBadge = ({ kind }: { kind: MaterialItem['kind'] }) => {
  const labels: Record<MaterialItem['kind'], string> = {
    web: 'Web',
    pdf: 'PDF',
    kit: 'KIT',
    sources: 'F01–F16'
  };
  return (
    <span className="font-mono text-[10px] tracking-widest uppercase text-citrus-dark bg-surface-warm border border-surface-border rounded px-2 py-1">
      {labels[kind]}
    </span>
  );
};

const Arrow = () => (
  <span
    aria-hidden="true"
    className="inline-block transition-transform group-hover:translate-x-1 text-citrus-dark"
  >
    →
  </span>
);

const Card = ({ item }: { item: MaterialItem }) => {
  const baseClass =
    'group flex flex-col h-full p-5 border border-surface-border rounded-md bg-surface hover:border-citrus hover:shadow-sm transition-all';

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <KindBadge kind={item.kind} />
        <Arrow />
      </div>
      <h3 className="font-sans text-base md:text-lg font-bold text-ink leading-snug mb-1">
        {item.title}
      </h3>
      <p className="text-sm text-ink-subtle leading-relaxed mt-auto">
        {item.subtitle}
      </p>
    </>
  );

  if (item.external || item.download || item.href.startsWith('#')) {
    return (
      <a
        href={item.href}
        className={baseClass}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        download={item.download || undefined}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={item.href} className={baseClass}>
      {inner}
    </Link>
  );
};

export const MaterialGrid = ({ material }: MaterialGridProps) => (
  <section
    className="max-w-content mx-auto py-12 md:py-16"
    aria-labelledby="material-heading"
  >
    <header className="max-w-prose mb-10">
      <h2
        id="material-heading"
        className="font-sans text-3xl md:text-4xl font-extrabold text-ink leading-tight tracking-tight mb-4"
      >
        {material.heading}
      </h2>
      <p className="text-base md:text-lg text-ink-muted leading-relaxed">
        {material.intro}
      </p>
    </header>
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 list-none">
      {material.items.map(item => (
        <li key={item.id} className="flex">
          <Card item={item} />
        </li>
      ))}
    </ul>
  </section>
);
